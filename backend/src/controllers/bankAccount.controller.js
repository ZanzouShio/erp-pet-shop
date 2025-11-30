import { prisma } from '../db.js';

class BankAccountController {
    async list(req, res) {
        try {
            const accounts = await prisma.bank_accounts.findMany({
                orderBy: { bank_name: 'asc' }
            });
            return res.json(accounts);
        } catch (error) {
            console.error('Erro ao listar contas bancárias:', error);
            return res.status(500).json({ error: 'Erro ao listar contas bancárias' });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const account = await prisma.bank_accounts.findUnique({
                where: { id }
            });

            if (!account) {
                return res.status(404).json({ error: 'Conta bancária não encontrada' });
            }

            return res.json(account);
        } catch (error) {
            console.error('Erro ao buscar conta bancária:', error);
            return res.status(500).json({ error: 'Erro ao buscar conta bancária' });
        }
    }

    async create(req, res) {
        try {
            const {
                name,
                bank_name,
                bank_code,
                agency,
                account_number,
                account_type,
                initial_balance,
                pix_enabled,
                pix_key
            } = req.body;

            if (!name || !bank_name) {
                return res.status(400).json({ error: 'Nome e Banco são obrigatórios' });
            }

            const account = await prisma.bank_accounts.create({
                data: {
                    name,
                    bank_name,
                    bank_code,
                    agency,
                    account_number,
                    account_type,
                    initial_balance: initial_balance ? parseFloat(initial_balance) : 0,
                    current_balance: initial_balance ? parseFloat(initial_balance) : 0, // Saldo inicial = Saldo atual na criação
                    pix_enabled: pix_enabled || false,
                    pix_key,
                    is_active: true
                }
            });

            return res.status(201).json(account);
        } catch (error) {
            console.error('Erro ao criar conta bancária:', error);
            return res.status(500).json({ error: 'Erro ao criar conta bancária' });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const {
                name,
                bank_name,
                bank_code,
                agency,
                account_number,
                account_type,
                pix_enabled,
                pix_key,
                is_active
            } = req.body;

            const account = await prisma.bank_accounts.update({
                where: { id },
                data: {
                    name,
                    bank_name,
                    bank_code,
                    agency,
                    account_number,
                    account_type,
                    pix_enabled,
                    pix_key,
                    is_active
                }
            });

            return res.json(account);
        } catch (error) {
            console.error('Erro ao atualizar conta bancária:', error);
            return res.status(500).json({ error: 'Erro ao atualizar conta bancária' });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;

            // Verificar dependências antes de excluir
            const hasTransactions = await prisma.financial_transactions.findFirst({
                where: { bank_account_id: id }
            });

            if (hasTransactions) {
                return res.status(400).json({ error: 'Não é possível excluir conta com transações vinculadas. Desative-a em vez disso.' });
            }

            const hasPaymentConfig = await prisma.payment_methods_config.findFirst({
                where: { bank_account_id: id }
            });

            if (hasPaymentConfig) {
                return res.status(400).json({ error: 'Esta conta está vinculada a uma configuração de pagamento. Remova o vínculo antes de excluir.' });
            }

            await prisma.bank_accounts.delete({
                where: { id }
            });

            return res.status(204).send();
        } catch (error) {
            console.error('Erro ao excluir conta bancária:', error);
            return res.status(500).json({ error: 'Erro ao excluir conta bancária' });
        }
    }
}

export default new BankAccountController();
