import pool from '../db.js';

export const createSale = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { items, payment_method, discount_amount, installments = 1, customer_id, due_date, paymentConfigId, feePercent } = req.body;

        if (!items || items.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Itens são obrigatórios' });
        }
        if (!payment_method) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Método de pagamento é obrigatório' });
        }

        // Calcular totais
        const subtotal = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
        const total_discount = discount_amount || items.reduce((sum, item) => sum + (item.discount || 0), 0);
        const total_amount = subtotal - total_discount;

        // Gerar número da venda
        const saleNumberResult = await client.query('SELECT COALESCE(MAX(CAST(sale_number AS INTEGER)), 0) + 1 as next_number FROM sales WHERE sale_number ~ \'^[0-9]+$\'');
        const sale_number = saleNumberResult.rows[0].next_number.toString();

        // User ID - Admin PDV (Dynamic fetch)
        let user_id = req.user_id; // Try to get from request (middleware)
        if (!user_id) {
            const userResult = await client.query('SELECT id FROM users LIMIT 1');
            user_id = userResult.rows[0]?.id;
        }

        if (!user_id) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Nenhum usuário encontrado no sistema para vincular a venda' });
        }

        // 1. Criar Venda
        const saleResult = await client.query(`
            INSERT INTO sales (
                sale_number, subtotal, discount, total,
                status, user_id, synced, customer_id
            ) VALUES ($1, $2, $3, $4, 'completed', $5, false, $6)
            RETURNING *
        `, [sale_number, subtotal, total_discount, total_amount, user_id, customer_id || null]);

        const sale = saleResult.rows[0];

        // 2. Inserir Itens
        for (const item of items) {
            // Buscar custo do produto
            const productResult = await client.query(
                'SELECT cost_price FROM products WHERE id = $1',
                [item.product_id]
            );
            const productCost = productResult.rows[0]?.cost_price || 0;

            await client.query(`
                INSERT INTO sale_items (
                    sale_id, product_id, quantity, unit_price, discount, total, cost_price
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                sale.id,
                item.product_id,
                item.quantity,
                item.unit_price,
                item.discount || 0,
                (item.unit_price * item.quantity) - (item.discount || 0),
                productCost
            ]);

            // Atualizar Estoque
            await client.query(`
                UPDATE products 
                SET stock_quantity = stock_quantity - $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [item.quantity, item.product_id]);

            // Registrar Movimentação de Estoque
            await client.query(`
                INSERT INTO stock_movements (
                    product_id, type, quantity, cost_price, 
                    reference_type, reference_id, notes, created_at
                ) VALUES ($1, 'OUT', $2, $3, 'sale', $4, 'Venda realizada', NOW())
            `, [
                item.product_id,
                item.quantity,
                productCost,
                sale.id
            ]);
        }

        // 4. Lógica de Pagamento e Carteira (Cashback)
        let amountToPay = total_amount;
        let walletAmountUsed = 0;

        // Verificar uso de saldo de cashback
        if (req.body.useWalletBalance && customer_id) {
            const customerResult = await client.query('SELECT wallet_balance FROM customers WHERE id = $1', [customer_id]);
            const currentBalance = Number(customerResult.rows[0]?.wallet_balance || 0);

            if (currentBalance > 0) {
                walletAmountUsed = Math.min(currentBalance, total_amount);
                amountToPay = total_amount - walletAmountUsed;

                // Debitar da carteira
                await client.query(`
                    UPDATE customers 
                    SET wallet_balance = wallet_balance - $1 
                    WHERE id = $2
                `, [walletAmountUsed, customer_id]);

                // Registrar transação de débito
                await client.query(`
                    INSERT INTO wallet_transactions (
                        customer_id, sale_id, amount, type, description
                    ) VALUES ($1, $2, $3, 'debit', $4)
                `, [customer_id, sale.id, walletAmountUsed, `Uso de saldo na venda #${sale_number}`]);

                // Registrar pagamento com cashback
                await client.query(`
                    INSERT INTO sale_payments (
                        sale_id, payment_method, amount
                    ) VALUES ($1, 'cashback', $2)
                `, [sale.id, walletAmountUsed]);
            }
        }

        // Registrar pagamento principal (se houver restante)
        if (amountToPay > 0) {
            await client.query(`
                INSERT INTO sale_payments (
                    sale_id, payment_method, amount, installments
                ) VALUES ($1, $2, $3, $4)
            `, [sale.id, payment_method, amountToPay, installments || 1]);
        }

        // 5. Gerar Contas a Receber (Apenas sobre o valor pago em dinheiro/cartão/etc)
        if (amountToPay > 0) {
            let config = null;
            if (paymentConfigId) {
                const configResult = await client.query('SELECT * FROM payment_methods_config WHERE id = $1', [paymentConfigId]);
                config = configResult.rows[0];
            }

            const receivableMode = config?.receivable_mode || 'immediate';
            const daysToLiquidate = config?.days_to_liquidate !== undefined ? config.days_to_liquidate : (payment_method === 'credit_card' ? 30 : 1);
            const appliedFeePercent = feePercent !== undefined ? Number(feePercent) : 0;

            if (payment_method === 'store_credit') {
                const installmentValue = amountToPay / installments;
                for (let i = 1; i <= installments; i++) {
                    const dueDate = new Date();
                    if (due_date) {
                        dueDate.setTime(new Date(due_date).getTime());
                    } else {
                        dueDate.setDate(dueDate.getDate() + (i * 30));
                    }

                    await client.query(`
                        INSERT INTO accounts_receivable (
                            description, amount, net_amount, tax_amount, tax_rate,
                            due_date, paid_date, status, customer_id, sale_id,
                            installment_number, total_installments, payment_method, origin_type
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'sale')
                    `, [
                        `Venda #${sale_number} - Parcela ${i}/${installments}`,
                        installmentValue,
                        installmentValue,
                        0,
                        0,
                        dueDate,
                        null,
                        'pending',
                        customer_id || null,
                        sale.id,
                        i,
                        installments,
                        payment_method
                    ]);
                }
            } else if (receivableMode === 'immediate') {
                const totalFee = (amountToPay * appliedFeePercent) / 100;
                const netAmount = amountToPay - totalFee;

                const dueDate = new Date();
                dueDate.setDate(dueDate.getDate() + daysToLiquidate);

                let status = 'pending';
                let paidDate = null;

                // Se dias para liquidar for 0, ou se for dinheiro/cash, já nasce pago
                // Pix e Débito seguem a configuração (se for 1 dia, nasce pendente)
                if (daysToLiquidate === 0 || payment_method === 'money' || payment_method === 'cash') {
                    status = 'paid';
                    paidDate = new Date();
                }

                await client.query(`
                    INSERT INTO accounts_receivable (
                        description, amount, net_amount, tax_amount, tax_rate,
                        due_date, paid_date, status, customer_id, sale_id,
                        installment_number, total_installments, payment_method, payment_config_id, origin_type
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'sale')
                `, [
                    `Venda #${sale_number} (Integral)`,
                    amountToPay,
                    netAmount,
                    totalFee,
                    appliedFeePercent,
                    dueDate,
                    paidDate,
                    status,
                    customer_id || null,
                    sale.id,
                    1,
                    1,
                    payment_method,
                    paymentConfigId || null
                ]);

                if (status === 'paid') {
                    // Verificar se deve atualizar saldo bancário (apenas se tiver config com banco)
                    let bankAccountId = null;
                    if (config && config.bank_account_id) {
                        bankAccountId = config.bank_account_id;
                        // Atualizar saldo bancário
                        await client.query(`
                            UPDATE bank_accounts 
                            SET current_balance = current_balance + $1 
                            WHERE id = $2
                        `, [netAmount, bankAccountId]);
                    }

                    await client.query(`
                        INSERT INTO financial_transactions 
                        (type, amount, description, date, issue_date, due_date, category, payment_method, payment_config_id, status, customer_id, bank_account_id)
                        VALUES ('revenue', $1, $2, $3, $4, $5, 'Venda de Produtos', $6, $7, 'paid', $8, $9)
                    `, [
                        netAmount,
                        `Recebimento Venda #${sale_number}`,
                        paidDate, paidDate, paidDate,
                        payment_method,
                        paymentConfigId || null,
                        customer_id || null,
                        bankAccountId
                    ]);
                }
            } else {
                // Fluxo
                const installmentValue = amountToPay / installments;

                for (let i = 1; i <= installments; i++) {
                    const feeAmount = (installmentValue * appliedFeePercent) / 100;
                    const netAmount = installmentValue - feeAmount;
                    const daysToAdd = i * 30;
                    const dueDate = new Date();
                    dueDate.setDate(dueDate.getDate() + daysToAdd);

                    // Se dias para liquidar for 0 (embora raro em fluxo parcelado), poderia nascer pago, mas assumindo fluxo normal

                    await client.query(`
                        INSERT INTO accounts_receivable (
                            description, amount, net_amount, tax_amount, tax_rate,
                            due_date, paid_date, status, customer_id, sale_id,
                            installment_number, total_installments, payment_method, payment_config_id, origin_type
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'sale')
                    `, [
                        `Venda #${sale_number} - Parcela ${i}/${installments}`,
                        installmentValue,
                        netAmount,
                        feeAmount,
                        appliedFeePercent,
                        dueDate,
                        null,
                        'pending',
                        customer_id || null,
                        sale.id,
                        i,
                        installments,
                        payment_method,
                        paymentConfigId || null
                    ]);
                }
            }
        }

        // 6. Fidelidade e Cashback (Acúmulo)
        if (customer_id) {
            const settingsResult = await client.query('SELECT * FROM company_settings LIMIT 1');
            const settings = settingsResult.rows[0];

            if (settings) {
                // Fidelidade (Pontos)
                if (settings.loyalty_enabled) {
                    const pointsEarned = Math.floor(total_amount * Number(settings.loyalty_points_per_real));
                    if (pointsEarned > 0) {
                        await client.query(`
                            UPDATE customers 
                            SET loyalty_points = loyalty_points + $1,
                                total_spent = total_spent + $2,
                                last_purchase_at = CURRENT_TIMESTAMP
                            WHERE id = $3
                        `, [pointsEarned, total_amount, customer_id]);

                        await client.query(`
                            INSERT INTO loyalty_transactions (
                                customer_id, type, points, description, reference_id
                            ) VALUES ($1, 'earn', $2, $3, $4)
                        `, [customer_id, pointsEarned, `Compra #${sale_number}`, sale.id]);

                        await client.query('UPDATE sales SET loyalty_points_earned = $1 WHERE id = $2', [pointsEarned, sale.id]);
                    }
                }

                // Cashback
                if (settings.cashback_enabled && amountToPay > 0) { // Só gera cashback sobre o valor pago (não sobre o saldo usado)
                    const cashbackPercent = Number(settings.cashback_percentage || 0);
                    if (cashbackPercent > 0) {
                        const cashbackValue = (amountToPay * cashbackPercent) / 100;
                        const expireDays = settings.cashback_expire_days || 90;
                        const expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + expireDays);

                        await client.query(`
                            UPDATE customers 
                            SET wallet_balance = wallet_balance + $1
                            WHERE id = $2
                        `, [cashbackValue, customer_id]);

                        await client.query(`
                            INSERT INTO wallet_transactions (
                                customer_id, sale_id, amount, type, description, expires_at
                            ) VALUES ($1, $2, $3, 'credit', $4, $5)
                        `, [
                            customer_id,
                            sale.id,
                            cashbackValue,
                            `Cashback Venda #${sale_number}`,
                            expiresAt
                        ]);
                    }
                }

                // Se nenhum sistema ativo, apenas atualiza total gasto
                if (!settings.loyalty_enabled && !settings.cashback_enabled) {
                    await client.query(`
                        UPDATE customers 
                        SET total_spent = total_spent + $1,
                            last_purchase_at = CURRENT_TIMESTAMP
                        WHERE id = $2
                    `, [total_amount, customer_id]);
                }
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            message: 'Venda criada com sucesso',
            sale: {
                id: sale.id,
                sale_number: sale.sale_number,
                total: parseFloat(sale.total),
                payment_method: sale.payment_method
            }
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao criar venda:', error);
        res.status(500).json({ error: 'Erro ao criar venda: ' + error.message });
    } finally {
        client.release();
    }
};

export const getAllSales = async (req, res) => {
    try {
        const { startDate, endDate, paymentMethod, search, limit = 50, offset = 0 } = req.query;

        let whereClause = '1=1';
        const params = [];
        let paramCount = 1;

        if (startDate) {
            params.push(startDate);
            whereClause += ` AND DATE(s.created_at AT TIME ZONE 'America/Sao_Paulo') >= $${paramCount}:: date`;
            paramCount++;
        }

        if (endDate) {
            params.push(endDate);
            whereClause += ` AND DATE(s.created_at AT TIME ZONE 'America/Sao_Paulo') <= $${paramCount}:: date`;
            paramCount++;
        }

        if (paymentMethod && paymentMethod !== 'all') {
            params.push(paymentMethod);
            whereClause += ` AND sp.payment_method = $${paramCount}`;
            paramCount++;
        }

        if (search) {
            params.push(`%${search}%`);
            whereClause += ` AND s.sale_number ILIKE $${paramCount}`;
            paramCount++;
        }

        if (req.query.customerId) {
            params.push(req.query.customerId);
            whereClause += ` AND s.customer_id = $${paramCount}`;
            paramCount++;
        }

        params.push(parseInt(limit));
        const limitParam = paramCount;
        paramCount++;

        params.push(parseInt(offset));
        const offsetParam = paramCount;

        const result = await pool.query(`
            SELECT
                s.id,
                s.sale_number,
                s.subtotal,
                s.discount,
                s.total,
                s.status,
                s.created_at,
                COUNT(DISTINCT si.id) as item_count,
                STRING_AGG(DISTINCT sp.payment_method, ', ') as payment_method
            FROM sales s
            LEFT JOIN sale_items si ON s.id = si.sale_id
            LEFT JOIN sale_payments sp ON s.id = sp.sale_id
            WHERE ${whereClause}
            GROUP BY s.id
            ORDER BY s.created_at DESC
            LIMIT $${limitParam} OFFSET $${offsetParam}
        `, params);

        const sales = result.rows.map(row => ({
            id: row.id,
            sale_number: parseInt(row.sale_number) || row.sale_number,
            subtotal: parseFloat(row.subtotal),
            discount_amount: parseFloat(row.discount),
            total_amount: parseFloat(row.total),
            payment_method: row.payment_method || 'N/A',
            status: row.status,
            created_at: row.created_at,
            item_count: parseInt(row.item_count),
            items: [] // Placeholder
        }));

        if (req.query.includeItems === 'true' && sales.length > 0) {
            const saleIds = sales.map(s => s.id);
            const itemsResult = await pool.query(`
                SELECT 
                    si.sale_id,
                    si.product_id,
                    si.quantity,
                    si.unit_price,
                    si.total,
                    p.name as product_name
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                WHERE si.sale_id = ANY($1)
            `, [saleIds]);

            // Map items to sales
            const itemsBySale = {};
            itemsResult.rows.forEach(item => {
                if (!itemsBySale[item.sale_id]) {
                    itemsBySale[item.sale_id] = [];
                }
                itemsBySale[item.sale_id].push({
                    name: item.product_name,
                    quantity: item.quantity,
                    total: parseFloat(item.total)
                });
            });

            sales.forEach(sale => {
                sale.items = itemsBySale[sale.id] || [];
            });
        }

        res.json(sales);
    } catch (error) {
        console.error('❌ Erro ao buscar vendas:', error);
        res.status(500).json({ error: 'Erro ao buscar vendas' });
    }
};

export const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscar venda
        const saleResult = await pool.query(`
            SELECT 
                s.id, s.sale_number, s.subtotal, s.discount, s.total,
                s.status, s.created_at,
                u.name as user_name
            FROM sales s
            LEFT JOIN users u ON s.user_id = u.id
            WHERE s.id = $1
        `, [id]);

        if (saleResult.rowCount === 0) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        const sale = saleResult.rows[0];

        // 2. Buscar itens da venda
        const itemsResult = await pool.query(`
            SELECT 
                si.id,
                si.quantity,
                si.unit_price,
                si.discount,
                si.total,
                p.name as product_name,
                p.sku
            FROM sale_items si
            JOIN products p ON si.product_id = p.id
            WHERE si.sale_id = $1
            ORDER BY si.id
        `, [id]);

        //3. Buscar pagamentos
        const paymentsResult = await pool.query(`
            SELECT 
                payment_method,
                amount,
                installments
            FROM sale_payments
            WHERE sale_id = $1
        `, [id]);

        // 3.5 Buscar parcelas (installments) do contas a receber
        const installmentsResult = await pool.query(`
            SELECT 
                installment_number,
                total_installments,
                amount,
                payment_method
            FROM accounts_receivable
            WHERE sale_id = $1
            ORDER BY installment_number
        `, [id]);

        // Agrupar parcelas por método (se houver misto, mas geralmente é um só de crédito para parcelas)
        // Simplificação: Vamos anexar as parcelas ao objeto de resposta
        const installments = installmentsResult.rows.map(inst => ({
            number: inst.installment_number,
            total: inst.total_installments,
            amount: parseFloat(inst.amount),
            method: inst.payment_method
        }));

        // 4. Montar resposta
        res.json({
            id: sale.id,
            sale_number: sale.sale_number,
            subtotal: parseFloat(sale.subtotal),
            discount_amount: parseFloat(sale.discount),
            total_amount: parseFloat(sale.total),
            status: sale.status,
            created_at: sale.created_at,
            user_name: sale.user_name,
            items: itemsResult.rows.map(item => ({
                id: item.id,
                product_name: item.product_name,
                sku: item.sku,
                quantity: parseInt(item.quantity),
                unit_price: parseFloat(item.unit_price),
                discount: parseFloat(item.discount) || 0,
                total: parseFloat(item.total)
            })),
            payments: paymentsResult.rows.map(payment => ({
                payment_method: payment.payment_method,
                amount: parseFloat(payment.amount),
                installments: payment.installments || 1
            })),
            installments: installments // New field
        });

    } catch (error) {
        console.error('❌ Erro ao buscar venda:', error);
        res.status(500).json({ error: 'Erro ao buscar venda' });
    }
};

export const cancelSale = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        // 1. Buscar venda e verificar status
        const saleResult = await client.query(`
            SELECT id, status FROM sales WHERE id = $1 FOR UPDATE
        `, [id]);

        if (saleResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        const sale = saleResult.rows[0];

        if (sale.status === 'cancelled') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Venda já está cancelada' });
        }

        // 2. Buscar itens para estorno
        const itemsResult = await client.query(`
            SELECT product_id, quantity, unit_price 
            FROM sale_items 
            WHERE sale_id = $1
        `, [id]);

        // 3. Estornar estoque e registrar movimentação
        for (const item of itemsResult.rows) {
            // Devolver ao estoque
            await client.query(`
                UPDATE products 
                SET stock_quantity = stock_quantity + $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $2
            `, [item.quantity, item.product_id]);

            // Registrar movimentação
            await client.query(`
                INSERT INTO stock_movements (
                    product_id, type, quantity, cost_price, 
                    reference_type, reference_id, notes, created_at
                ) VALUES ($1, 'IN', $2, $3, 'sale_cancellation', $4, 'Cancelamento de venda', NOW())
            `, [
                item.product_id,
                item.quantity,
                0, // TODO: Ideal seria pegar o custo original, mas por hora 0 ou custo atual
                id
            ]);
        }

        // 4. Atualizar status da venda
        await client.query(`
            UPDATE sales 
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
        `, [id]);

        // 5. Cancelar Contas a Receber associadas
        await client.query(`
            UPDATE accounts_receivable
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE sale_id = $1 AND status != 'paid'
        `, [id]);

        // 6. Estornar/Remover Transações Financeiras (se houver)
        // Se já foi pago, precisamos estornar (criar uma saída) ou remover a entrada se foi erro?
        // Assumindo que se cancelou a venda, o dinheiro deve ser devolvido ou o registro anulado.
        // Vamos buscar se tem transações pagas vinculadas a essa venda (via accounts_receivable ou direto)
        // Simplificação: Se a venda foi cancelada, removemos a previsão de receita.
        // Se já houve recebimento (status='paid'), o ideal seria lançar uma despesa de estorno, mas por enquanto vamos apenas cancelar o título se não foi pago.
        // Se foi pago (dinheiro/pix), o usuário devolve o dinheiro. O sistema deve registrar essa saída?
        // Por hora, vamos focar em cancelar o que está pendente.

        // Se houver transações financeiras vinculadas a esta venda (ex: dinheiro/pix que gerou receita imediata), deveríamos estornar?
        // O usuário pediu: "eu cancelei uma venda (#64) e ela continuou como paga no Contas a Receber, teoricamente eu perco esse valor porque cancelou"
        // Se estava PAGO, precisamos mudar para CANCELADO ou ESTORNADO.
        await client.query(`
            UPDATE accounts_receivable
            SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE sale_id = $1
        `, [id]);

        // Remover transações financeiras de receita geradas por essa venda (para limpar o fluxo de caixa)
        // Isso assume que o dinheiro foi devolvido.
        // Buscar transações pela descrição ou metadados seria ideal, mas não temos link direto forte além da descrição ou data/valor.
        // Mas espere, na criação nós não salvamos o sale_id na financial_transactions.
        // Mas salvamos na accounts_receivable. E quando baixamos accounts_receivable, criamos financial_transactions.
        // Se foi venda a vista (dinheiro), criamos financial_transactions direto no controller.

        // Vamos tentar remover transações que tenham descrição "Recebimento Venda #${sale_number}"
        // Primeiro precisamos do sale_number
        const saleNumber = sale.sale_number; // Já buscamos o sale antes? Não, buscamos só id e status.

        const saleDetails = await client.query('SELECT sale_number FROM sales WHERE id = $1', [id]);
        const sn = saleDetails.rows[0].sale_number;

        await client.query(`
            DELETE FROM financial_transactions 
            WHERE description LIKE $1 AND type = 'revenue'
        `, [`%Venda #${sn}%`]);

        await client.query('COMMIT');

        res.json({ message: 'Venda cancelada com sucesso' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao cancelar venda:', error);
        res.status(500).json({ error: 'Erro ao cancelar venda' });
    } finally {
        client.release();
    }
};
