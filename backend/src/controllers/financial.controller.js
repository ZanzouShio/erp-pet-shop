import { XMLParser } from 'fast-xml-parser';
import { prisma } from '../db.js';
import fs from 'fs';

export const uploadNfe = async (req, res) => {
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
            number: String(infNFe.ide.nNF),
            series: String(infNFe.ide.serie),
            date: infNFe.ide.dhEmi,
            supplier: {
                cnpj: emit.CNPJ,
                name: emit.xNome,
                tradeName: emit.xFant
            },
            total: parseFloat(infNFe.total.ICMSTot.vNF)
        };

        // Verificação Antecipada de Duplicidade
        const cnpjString = String(nfeData.supplier.cnpj);
        const cnpjLimpo = cnpjString.replace(/\D/g, '');
        const uniqueNfeKey = `${cnpjLimpo}-${nfeData.number}`;

        const existingEntry = await prisma.stock_movements.findFirst({
            where: {
                reference_type: 'NFE',
                reference_id: uniqueNfeKey
            }
        });

        if (existingEntry) {
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
            let product = null;
            let matchType = null;

            if (prod.cEAN && prod.cEAN !== 'SEM GTIN') {
                product = await prisma.products.findFirst({
                    where: { ean: prod.cEAN }
                });

                if (product) {
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
    }
};

export const confirmEntry = async (req, res) => {
    const { items, nfeData } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: 'Nenhum item para processar' });
    }

    try {
        await prisma.$transaction(async (tx) => {
            // Gerar chave única para controle de duplicidade (CNPJ + Número da Nota)
            const cnpjString = String(nfeData.supplier.cnpj);
            const cnpjLimpo = cnpjString.replace(/\D/g, '');
            const uniqueNfeKey = `${cnpjLimpo}-${nfeData.number}`;

            // Verificar se já existe movimentação para esta nota
            const existingEntry = await tx.stock_movements.findFirst({
                where: {
                    reference_type: 'NFE',
                    reference_id: uniqueNfeKey
                }
            });

            if (existingEntry) {
                throw new Error(`A Nota Fiscal ${nfeData.number} deste fornecedor já foi importada anteriormente.`);
            }

            for (const item of items) {
                console.log(`🔄 Processando item: ${item.name} | Qtd: ${item.quantity} | Preço: ${item.unitPrice}`);

                let productId = item.matchedProduct ? item.matchedProduct.id : null;

                // Se não tem produto vinculado, CRIAR NOVO
                if (!productId) {
                    // Verificar se já existe por EAN antes de criar
                    if (item.ean && item.ean !== 'SEM GTIN') {
                        const existing = await tx.products.findFirst({
                            where: { ean: item.ean }
                        });
                        if (existing) {
                            productId = existing.id;
                        }
                    }

                    if (!productId) {
                        console.log('✨ Criando novo produto...');
                        const newProduct = await tx.products.create({
                            data: {
                                name: item.name,
                                description: `Importado via NFe ${nfeData.number}`,
                                ean: item.ean !== 'SEM GTIN' ? item.ean : null,
                                sale_price: parseFloat(item.unitPrice) * 1.5,
                                cost_price: parseFloat(item.unitPrice),
                                stock_quantity: 0,
                                min_stock: 10,
                                unit: 'UN',
                                is_active: true
                            }
                        });
                        productId = newProduct.id;
                    }
                }

                // 1. Registrar Movimentação de Estoque
                await tx.stock_movements.create({
                    data: {
                        product_id: productId,
                        type: 'IN',
                        quantity: parseFloat(item.quantity),
                        cost_price: parseFloat(item.unitPrice),
                        reference_type: 'NFE',
                        reference_id: uniqueNfeKey,
                        notes: `Entrada via NFe ${nfeData.number} - Fornecedor: ${nfeData.supplier.name}`
                    }
                });

                // 2. Atualizar Produto (Estoque e Custo Médio)
                const currentProd = await tx.products.findUnique({
                    where: { id: productId },
                    select: { stock_quantity: true, cost_price: true }
                });

                const currentStock = Number(currentProd.stock_quantity) || 0;
                const currentCost = Number(currentProd.cost_price) || 0;
                const entryQty = parseFloat(item.quantity);
                const entryPrice = parseFloat(item.unitPrice);

                const newStock = currentStock + entryQty;

                console.log(`📊 Estoque: ${currentStock} + ${entryQty} = ${newStock}`);

                // Cálculo Custo Médio Ponderado
                let newCost = entryPrice;
                if (newStock > 0) {
                    newCost = ((currentStock * currentCost) + (entryQty * entryPrice)) / newStock;
                }

                await tx.products.update({
                    where: { id: productId },
                    data: {
                        stock_quantity: newStock,
                        cost_price: newCost,
                        updated_at: new Date()
                    }
                });
            }
        });

        res.json({ message: 'Entrada confirmada com sucesso! Estoque atualizado.' });

    } catch (error) {
        console.error('❌ Erro ao confirmar entrada:', error);
        res.status(500).json({ error: 'Erro ao confirmar entrada: ' + error.message });
    }
};

export const getSuppliers = async (req, res) => {
    try {
        const suppliers = await prisma.suppliers.findMany({
            select: {
                id: true,
                trade_name: true
            },
            orderBy: {
                trade_name: 'asc'
            }
        });

        // Mapear para manter compatibilidade com o frontend (name)
        const formattedSuppliers = suppliers.map(s => ({
            id: s.id,
            name: s.trade_name
        }));

        res.json(formattedSuppliers);
    } catch (error) {
        console.error('Erro ao listar fornecedores:', error);
        res.status(500).json({ error: 'Erro ao listar fornecedores' });
    }
};

export const getBankAccounts = async (req, res) => {
    try {
        const accounts = await prisma.bank_accounts.findMany({
            orderBy: {
                bank_name: 'asc'
            }
        });
        res.json(accounts);
    } catch (error) {
        console.error('Erro ao listar contas bancárias:', error);
        res.status(500).json({ error: 'Erro ao listar contas bancárias' });
    }
};
