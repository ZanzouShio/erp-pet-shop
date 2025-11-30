import { prisma } from '../db.js';

class PaymentConfigurationController {
    async list(req, res) {
        try {
            const configs = await prisma.payment_methods_config.findMany({
                orderBy: { created_at: 'desc' },
                include: {
                    bank_accounts: {
                        select: { name: true, bank_name: true }
                    }
                }
            });
            return res.json(configs);
        } catch (error) {
            console.error('Erro ao listar configurações de pagamento:', error);
            return res.status(500).json({ error: 'Erro ao listar configurações' });
        }
    }

    async create(req, res) {
        try {
            const {
                type,
                name,
                bank_account_id,
                days_to_liquidate,
                receivable_mode,
                flat_fee_percent,
                max_installments,
                installment_fees,
                color
            } = req.body;

            // Validações básicas
            if (!type || !name) {
                return res.status(400).json({ error: 'Tipo e Nome são obrigatórios' });
            }

            // Sanitização do bank_account_id
            const sanitizedBankAccountId = bank_account_id && bank_account_id.trim() !== '' ? bank_account_id : null;

            const config = await prisma.payment_methods_config.create({
                data: {
                    type,
                    name,
                    bank_account_id: sanitizedBankAccountId,
                    days_to_liquidate: parseInt(days_to_liquidate || 1),
                    receivable_mode: receivable_mode || 'immediate',
                    flat_fee_percent: flat_fee_percent ? parseFloat(flat_fee_percent) : 0,
                    max_installments: max_installments ? parseInt(max_installments) : 1,
                    installment_fees: installment_fees || [],
                    color: color || '#3b82f6',
                    is_active: true
                }
            });

            return res.status(201).json(config);
        } catch (error) {
            console.error('Erro detalhado ao criar configuração de pagamento:', error);
            return res.status(500).json({ error: 'Erro ao criar configuração: ' + error.message });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const {
                name,
                bank_account_id,
                days_to_liquidate,
                receivable_mode,
                flat_fee_percent,
                max_installments,
                installment_fees,
                is_active,
                color
            } = req.body;

            // Sanitização do bank_account_id
            const sanitizedBankAccountId = bank_account_id && bank_account_id.trim() !== '' ? bank_account_id : null;

            const config = await prisma.payment_methods_config.update({
                where: { id },
                data: {
                    name,
                    bank_account_id: sanitizedBankAccountId,
                    days_to_liquidate: days_to_liquidate ? parseInt(days_to_liquidate) : undefined,
                    receivable_mode: receivable_mode,
                    flat_fee_percent: flat_fee_percent !== undefined ? parseFloat(flat_fee_percent) : undefined,
                    max_installments: max_installments ? parseInt(max_installments) : undefined,
                    installment_fees,
                    is_active,
                    color
                }
            });

            return res.json(config);
        } catch (error) {
            console.error('Erro ao atualizar configuração de pagamento:', error);
            return res.status(500).json({ error: 'Erro ao atualizar configuração: ' + error.message });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            await prisma.payment_methods_config.delete({
                where: { id }
            });
            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir configuração de pagamento:', error);
            return res.status(500).json({ error: 'Erro ao excluir configuração' });
        }
    }

    async getActiveByType(req, res) {
        try {
            const { type } = req.params;
            const configs = await prisma.payment_methods_config.findMany({
                where: {
                    type,
                    is_active: true
                },
                include: {
                    bank_accounts: {
                        select: { name: true, bank_name: true }
                    }
                }
            });
            return res.json(configs);
        } catch (error) {
            console.error('Erro ao buscar configurações ativas:', error);
            return res.status(500).json({ error: 'Erro ao buscar configurações' });
        }
    }
}

export default new PaymentConfigurationController();
