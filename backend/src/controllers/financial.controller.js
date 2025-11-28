import { XMLParser } from 'fast-xml-parser';
import pool from '../db.js';
import fs from 'fs';

export const uploadNfe = async (req, res) => {
    const client = await pool.connect();
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
        }

        // Ler arquivo XML
        const xmlData = fs.readFileSync(req.file.path, 'utf8');
        const parser = new XMLParser({ ignoreAttributes: false });
        const jsonObj = parser.parse(xmlData);

        // Validar estrutura básica da NFe
        const nfeProc = jsonObj.nfeProc || jsonObj.NFe;
        if (!nfeProc) {
            fs.unlinkSync(req.file.path); // Deletar arquivo
            return res.status(400).json({ error: 'Arquivo XML inválido ou não é uma NFe' });
        }

        const infNFe = nfeProc.NFe ? nfeProc.NFe.infNFe : nfeProc.infNFe;
        const emit = infNFe.emit;
        const det = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];

        // Dados da Nota
        const nfeData = {
            number: infNFe.ide.nNF,
            series: infNFe.ide.serie,
            date: infNFe.ide.dhEmi,
            supplier: {
                cnpj: emit.CNPJ,
                name: emit.xNome,
                tradeName: emit.xFant
            },
            total: infNFe.total.ICMSTot.vNF
        };

        // Verificação Antecipada de Duplicidade
        const cnpjString = String(nfeData.supplier.cnpj);
        const cnpjLimpo = cnpjString.replace(/\D/g, '');
        const uniqueNfeKey = `${cnpjLimpo}-${nfeData.number}`;

        const existingEntry = await client.query(
            "SELECT id FROM stock_movements WHERE reference_type = 'NFE' AND reference_id = $1 LIMIT 1",
            [uniqueNfeKey]
        );

        if (existingEntry.rowCount > 0) {
            fs.unlinkSync(req.file.path);
            return res.status(409).json({
                error: `A Nota Fiscal ${nfeData.number} deste fornecedor já foi importada anteriormente.`
            });
        }

        // Processar Itens
        const items = [];
        for (const item of det) {
            const prod = item.prod;

            // Tentar encontrar produto no banco
            // 1. Pelo EAN (cEAN)
            // 2. Pelo Código do Fornecedor (cProd) - Futuro: Tabela de vínculo

            let product = null;
            let matchType = null;

            if (prod.cEAN && prod.cEAN !== 'SEM GTIN') {
                const prodResult = await client.query('SELECT * FROM products WHERE ean = $1', [prod.cEAN]);
                if (prodResult.rowCount > 0) {
                    product = prodResult.rows[0];
                    matchType = 'EAN';
                }
            }

            items.push({
                code: prod.cProd,
                ean: prod.cEAN,
                name: prod.xProd,
                quantity: parseFloat(prod.qCom),
                unitPrice: parseFloat(prod.vUnCom),
                totalPrice: parseFloat(prod.vProd),
                matchedProduct: product,
                matchType: matchType
            });
        }

        // Remover arquivo temporário
        fs.unlinkSync(req.file.path);

        res.json({
            message: 'NFe processada com sucesso',
            nfe: nfeData,
            items: items
        });

    } catch (error) {
        console.error('❌ Erro ao processar NFe:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Erro ao processar NFe: ' + error.message });
    } finally {
        client.release();
    }
};

export const confirmEntry = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { items, nfeData } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            throw new Error('Nenhum item para processar');
        }

        // Gerar chave única para controle de duplicidade (CNPJ + Número da Nota)
        const cnpjString = String(nfeData.supplier.cnpj);
        const cnpjLimpo = cnpjString.replace(/\D/g, '');
        const uniqueNfeKey = `${cnpjLimpo}-${nfeData.number}`;

        // Verificar se já existe movimentação para esta nota
        const existingEntry = await client.query(
            "SELECT id FROM stock_movements WHERE reference_type = 'NFE' AND reference_id = $1 LIMIT 1",
            [uniqueNfeKey]
        );

        if (existingEntry.rowCount > 0) {
            throw new Error(`A Nota Fiscal ${nfeData.number} deste fornecedor já foi importada anteriormente.`);
        }

        for (const item of items) {
            console.log(`🔄 Processando item: ${item.name} | Qtd: ${item.quantity} | Preço: ${item.unitPrice}`);

            let productId = item.matchedProduct ? item.matchedProduct.id : null;

            // Se não tem produto vinculado, CRIAR NOVO
            if (!productId) {
                // Verificar se já existe por EAN antes de criar
                if (item.ean && item.ean !== 'SEM GTIN') {
                    const existing = await client.query('SELECT id FROM products WHERE ean = $1', [item.ean]);
                    if (existing.rowCount > 0) {
                        productId = existing.rows[0].id;
                    }
                }

                if (!productId) {
                    console.log('✨ Criando novo produto...');
                    const newProductResult = await client.query(`
                        INSERT INTO products (
                            name, description, ean, sale_price, cost_price,
                            stock_quantity, min_stock, unit, is_active, created_at, updated_at
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                        RETURNING id
                    `, [
                        item.name,
                        `Importado via NFe ${nfeData.number}`,
                        item.ean !== 'SEM GTIN' ? item.ean : null,
                        parseFloat(item.unitPrice) * 1.5,
                        parseFloat(item.unitPrice),
                        0,
                        10,
                        'UN'
                    ]);
                    productId = newProductResult.rows[0].id;
                }
            }

            // 1. Registrar Movimentação de Estoque
            await client.query(`
                INSERT INTO stock_movements (
                    product_id, type, quantity, cost_price,
                    reference_type, reference_id, notes, created_at
                ) VALUES ($1, 'IN', $2, $3, 'NFE', $4, $5, CURRENT_TIMESTAMP)
            `, [
                productId,
                parseFloat(item.quantity),
                parseFloat(item.unitPrice),
                uniqueNfeKey,
                `Entrada via NFe ${nfeData.number} - Fornecedor: ${nfeData.supplier.name}`
            ]);

            // 2. Atualizar Produto (Estoque e Custo Médio)
            const currentProd = await client.query('SELECT stock_quantity, cost_price FROM products WHERE id = $1', [productId]);
            const currentStock = parseFloat(currentProd.rows[0].stock_quantity) || 0;
            const currentCost = parseFloat(currentProd.rows[0].cost_price) || 0;
            const entryQty = parseFloat(item.quantity);
            const entryPrice = parseFloat(item.unitPrice);

            const newStock = currentStock + entryQty;

            console.log(`📊 Estoque: ${currentStock} + ${entryQty} = ${newStock}`);

            // Cálculo Custo Médio Ponderado
            let newCost = entryPrice;
            if (newStock > 0) {
                newCost = ((currentStock * currentCost) + (entryQty * entryPrice)) / newStock;
            }

            await client.query(`
                UPDATE products 
                SET stock_quantity = $1, cost_price = $2, updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
            `, [newStock, newCost, productId]);
        }

        await client.query('COMMIT');
        res.json({ message: 'Entrada confirmada com sucesso! Estoque atualizado.' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro ao confirmar entrada:', error);
        res.status(500).json({ error: 'Erro ao confirmar entrada: ' + error.message });
    } finally {
        client.release();
    }
};

export const getSuppliers = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, trade_name as name FROM suppliers ORDER BY trade_name');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar fornecedores:', error);
        res.status(500).json({ error: 'Erro ao listar fornecedores' });
    }
};
