import { prisma } from '../db.js';

export const createInvoice = async (req, res) => {
    const { saleId, type, buyerData } = req.body;

    try {
        const sale = await prisma.sales.findUnique({
            where: { id: saleId },
            include: {
                sale_items: true,
                sale_payments: true,
                customers: true
            }
        });

        if (!sale) {
            return res.status(404).json({ error: 'Venda não encontrada' });
        }

        // Simulação de emissão (SEFAZ)
        // Em um cenário real, aqui seria feita a comunicação com a API da SEFAZ
        // Gerando número aleatório para simular
        const invoiceNumber = Math.floor(Math.random() * 100000).toString();
        const series = '1';
        const accessKey = Math.floor(Math.random() * 100000000000000000000000000000000000000000000).toString();
        const protocol = Math.floor(Math.random() * 1000000000000000).toString();

        // Dados do destinatário
        let recipient = {};
        if (buyerData) {
            recipient = {
                recipient_type: buyerData.type,
                recipient_cpf_cnpj: buyerData.type === 'PF' ? buyerData.cpf : buyerData.cnpj,
                recipient_name: buyerData.type === 'PF' ? buyerData.name : buyerData.corporateName
            };
        } else if (sale.customers) {
            recipient = {
                recipient_type: sale.customers.cpf_cnpj && sale.customers.cpf_cnpj.length > 14 ? 'PJ' : 'PF',
                recipient_cpf_cnpj: sale.customers.cpf_cnpj,
                recipient_name: sale.customers.name,
                recipient_id: sale.customers.id
            };
        } else {
            recipient = {
                recipient_name: 'Consumidor Final'
            };
        }

        // Criar registro na tabela invoices
        const invoice = await prisma.invoices.create({
            data: {
                type: type,
                number: invoiceNumber,
                series: series,
                access_key: accessKey,
                status: 'authorized', // Simulating success
                issuer_cnpj: '00.000.000/0000-00', // Mock issuer
                issuer_name: 'Pet Shop Demo', // Mock issuer
                ...recipient,
                subtotal: sale.subtotal,
                discount: sale.discount,
                total: sale.total,
                authorization_protocol: protocol,
                authorization_date: new Date(),
                sale_id: sale.id,
                notes: `Emissão simulada de ${type}`
            }
        });

        // Atualizar venda com dados da nota
        await prisma.sales.update({
            where: { id: saleId },
            data: {
                invoice_type: type,
                invoice_number: invoiceNumber,
                invoice_series: series,
                invoice_key: accessKey,
                invoice_issued_at: new Date()
            }
        });

        res.json({
            message: `${type} emitida com sucesso!`,
            invoice
        });

    } catch (error) {
        console.error('Erro ao emitir nota:', error);
        res.status(500).json({ error: 'Erro ao emitir nota fiscal' });
    }
};

export const getInvoices = async (req, res) => {
    try {
        const { startDate, endDate, type, status, search } = req.query;

        const where = {};

        if (startDate && endDate) {
            const end = new Date(endDate);
            end.setUTCHours(23, 59, 59, 999);

            where.created_at = {
                gte: new Date(startDate),
                lte: end
            };
        }

        if (type && type !== 'all') {
            where.type = type;
        }

        if (status && status !== 'all') {
            where.status = status;
        }

        if (search) {
            where.OR = [
                { number: { contains: search } },
                { recipient_name: { contains: search, mode: 'insensitive' } },
                { recipient_cpf_cnpj: { contains: search } }
            ];
        }

        const invoices = await prisma.invoices.findMany({
            where,
            orderBy: { created_at: 'desc' },
            take: 50 // Limit for now
        });

        // Format data for frontend
        const formattedInvoices = invoices.map(inv => ({
            id: inv.id,
            number: `${inv.number}/${inv.series}`,
            date: new Intl.DateTimeFormat('pt-BR', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            }).format(inv.created_at),
            type: inv.type === 'nfce' ? 'NFC-e' : inv.type === 'nfe' ? 'NF-e' : inv.type,
            client: inv.recipient_cpf_cnpj || 'Sem dados',
            value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(inv.total)),
            status: inv.status
        }));

        res.json(formattedInvoices);

    } catch (error) {
        console.error('Erro ao listar notas:', error);
        res.status(500).json({ error: 'Erro ao listar notas fiscais' });
    }
};
