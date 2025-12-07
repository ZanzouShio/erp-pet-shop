import { prisma } from "../db.js";

const CommissionsController = {
    // List commissions with filters
    list: async (req, res) => {
        try {
            const { start_date, end_date, professional_id, status } = req.query;

            const where = {};

            if (status) where.commission_status = status;
            if (professional_id) where.professional_id = professional_id;

            // Date filter on Appointment Date
            if (start_date || end_date) {
                where.appointments = {};
                if (start_date) where.appointments.date = { ...where.appointments.date, gte: new Date(start_date) };
                if (end_date) where.appointments.date = { ...where.appointments.date, lte: new Date(end_date) };
            }

            // Ensure we only look at items that HAVE a commission calculated
            where.calculated_commission = { gt: 0 };

            const items = await prisma.appointment_services.findMany({
                where,
                include: {
                    appointments: {
                        include: {
                            customers: { select: { name: true } },
                            pets: { select: { name: true } }
                        }
                    },
                    services: { select: { name: true } },
                    professional: { select: { name: true, email: true } }
                },
                orderBy: {
                    appointments: { date: 'desc' }
                }
            });

            // Format for frontend
            const formatted = items.map(item => ({
                id: item.id,
                date: item.appointments.date,
                customer_name: item.appointments.customers?.name || 'N/A',
                pet_name: item.appointments.pets?.name || 'N/A',
                service_name: item.services.name,
                professional_name: item.professional?.name || 'N/A',
                price: Number(item.price),
                commission_value: Number(item.calculated_commission),
                status: item.commission_status,
                paid_at: item.commission_paid_at
            }));

            res.json(formatted);
        } catch (error) {
            console.error("List Commissions Error:", error);
            res.status(500).json({ error: "Erro ao listar comissões." });
        }
    },

    // Batch pay commissions
    pay: async (req, res) => {
        try {
            const { ids, account_id, payment_method, notes } = req.body;

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: "Selecione ao menos um item." });
            }

            // 1. Calculate Total
            const itemsToPay = await prisma.appointment_services.findMany({
                where: {
                    id: { in: ids },
                    commission_status: { not: 'paid' } // Prevent double pay
                }
            });

            if (itemsToPay.length === 0) {
                return res.status(400).json({ error: "Nenhum item válido para pagamento encontrado." });
            }

            const totalAmount = itemsToPay.reduce((sum, item) => sum + Number(item.calculated_commission || 0), 0);

            // 2. Create Financial Transaction (Expense)
            const transaction = await prisma.financial_transactions.create({
                data: {
                    description: `Pagamento de Comissões (${itemsToPay.length} serviços)`,
                    amount: totalAmount,
                    type: 'expense',
                    status: 'paid',
                    issue_date: new Date(),
                    due_date: new Date(),
                    paid_date: new Date(),
                    payment_method: payment_method || 'transfer',
                    account_id: account_id || null, // Optional bank account
                    category: 'Comissões',
                    notes: notes || ''
                }
            });

            // 3. Update Items
            await prisma.appointment_services.updateMany({
                where: { id: { in: itemsToPay.map(i => i.id) } },
                data: {
                    commission_status: 'paid',
                    commission_paid_at: new Date(),
                    commission_transaction_id: transaction.id
                }
            });

            res.json({
                success: true,
                paid_count: itemsToPay.length,
                total_paid: totalAmount,
                transaction_id: transaction.id
            });

        } catch (error) {
            console.error("Pay Commissions Error:", error);
            res.status(500).json({ error: "Erro ao processar pagamento." });
        }
    }
};

export default CommissionsController;
