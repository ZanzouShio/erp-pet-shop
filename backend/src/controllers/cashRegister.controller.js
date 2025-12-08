import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Cash Register Controller
 * Handles cash register operations: open, close, sangria, suprimento
 */
const cashRegisterController = {
    /**
     * Get current open cash register status
     */
    async getStatus(req, res) {
        try {
            const { terminalId } = req.params;

            // Try to find terminal by ID or name
            let terminal = null;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            if (uuidRegex.test(terminalId)) {
                terminal = await prisma.pdv_terminals.findUnique({ where: { id: terminalId } });
            } else {
                terminal = await prisma.pdv_terminals.findFirst({ where: { name: terminalId } });
            }

            if (!terminal) {
                return res.json({
                    isOpen: false,
                    message: 'Terminal não encontrado'
                });
            }

            // Find the currently open cash register for this terminal
            const openRegister = await prisma.cash_registers.findFirst({
                where: {
                    terminal_id: terminal.id,
                    status: 'open'
                },
                include: {
                    users: { select: { id: true, name: true } },
                    pdv_terminals: { select: { id: true, name: true } },
                    cash_movements: { orderBy: { created_at: 'desc' }, take: 50 }
                },
                orderBy: { opened_at: 'desc' }
            });

            if (!openRegister) {
                return res.json({
                    isOpen: false,
                    message: 'Nenhum caixa aberto para este terminal'
                });
            }

            // Calculate current balance based on movements
            const movements = await prisma.cash_movements.findMany({
                where: { cash_register_id: openRegister.id }
            });

            let currentBalance = parseFloat(openRegister.opening_balance) || 0;

            movements.forEach(mov => {
                const amount = parseFloat(mov.amount) || 0;
                if (['opening', 'suprimento', 'sale_cash'].includes(mov.type)) {
                    currentBalance += amount;
                } else if (['sangria', 'closing'].includes(mov.type)) {
                    currentBalance -= amount;
                }
            });

            res.json({
                isOpen: true,
                register: {
                    id: openRegister.id,
                    terminalId: openRegister.terminal_id,
                    terminalName: openRegister.pdv_terminals?.name,
                    operatorId: openRegister.user_id,
                    operatorName: openRegister.users?.name,
                    openedAt: openRegister.opened_at,
                    openingBalance: openRegister.opening_balance,
                    currentBalance: currentBalance.toFixed(2),
                    status: openRegister.status,
                    movements: openRegister.cash_movements
                }
            });
        } catch (error) {
            console.error('Error getting cash register status:', error);
            res.status(500).json({ error: 'Erro ao obter status do caixa' });
        }
    },

    /**
     * Open a new cash register
     */
    async open(req, res) {
        try {
            const { terminalId, openingBalance, notes } = req.body;
            const userId = req.user?.id || req.body.userId;

            if (!userId) {
                return res.status(400).json({ error: 'ID do operador é obrigatório' });
            }

            // Find or create a default terminal
            let terminal;
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            if (terminalId) {
                if (uuidRegex.test(terminalId)) {
                    terminal = await prisma.pdv_terminals.findUnique({ where: { id: terminalId } });
                } else {
                    terminal = await prisma.pdv_terminals.findFirst({ where: { name: terminalId } });
                    if (!terminal) {
                        terminal = await prisma.pdv_terminals.create({
                            data: { name: terminalId, is_active: true }
                        });
                        console.log(`Created new terminal: ${terminal.name} (${terminal.id})`);
                    }
                }
            } else {
                terminal = await prisma.pdv_terminals.findFirst({ where: { name: 'Caixa 01' } });
                if (!terminal) {
                    terminal = await prisma.pdv_terminals.create({
                        data: { name: 'Caixa 01', is_active: true }
                    });
                    console.log(`Created default terminal: ${terminal.name} (${terminal.id})`);
                }
            }

            if (!terminal) {
                return res.status(400).json({ error: 'Terminal não encontrado' });
            }

            // Check if there's already an open register for this terminal
            const existingOpen = await prisma.cash_registers.findFirst({
                where: { terminal_id: terminal.id, status: 'open' }
            });

            if (existingOpen) {
                return res.status(400).json({
                    error: 'Já existe um caixa aberto para este terminal',
                    registerId: existingOpen.id
                });
            }

            // Create the new cash register
            const newRegister = await prisma.cash_registers.create({
                data: {
                    terminal_id: terminal.id,
                    user_id: userId,
                    opening_balance: openingBalance || 0,
                    status: 'open',
                    notes: notes || null
                }
            });

            // Log the opening movement
            await prisma.cash_movements.create({
                data: {
                    cash_register_id: newRegister.id,
                    type: 'opening',
                    amount: openingBalance || 0,
                    reason: 'Abertura de caixa',
                    user_id: userId
                }
            });

            // Log to audit
            await prisma.audit_logs.create({
                data: {
                    user_id: userId,
                    action: 'CASH_REGISTER_OPEN',
                    entity_type: 'cash_registers',
                    entity_id: newRegister.id,
                    description: `Caixa aberto com saldo inicial de R$ ${(openingBalance || 0).toFixed(2)}`,
                    metadata: {
                        terminalId: terminal.id,
                        terminalName: terminal.name,
                        openingBalance: openingBalance || 0,
                        notes
                    }
                }
            });

            res.status(201).json({
                success: true,
                message: 'Caixa aberto com sucesso',
                register: newRegister
            });
        } catch (error) {
            console.error('Error opening cash register:', error);
            res.status(500).json({ error: 'Erro ao abrir caixa' });
        }
    },

    /**
     * Close a cash register
     */
    async close(req, res) {
        try {
            const { id } = req.params;
            const { closingBalance, notes } = req.body;
            const userId = req.user?.id || req.body.userId;

            if (closingBalance === undefined || closingBalance === null) {
                return res.status(400).json({ error: 'Informe o saldo de fechamento' });
            }

            const register = await prisma.cash_registers.findUnique({
                where: { id },
                include: { cash_movements: true }
            });

            if (!register) {
                return res.status(404).json({ error: 'Caixa não encontrado' });
            }

            if (register.status === 'closed') {
                return res.status(400).json({ error: 'Este caixa já está fechado' });
            }

            // Calculate expected balance from movements
            let expectedBalance = parseFloat(register.opening_balance) || 0;

            register.cash_movements.forEach(mov => {
                const amount = parseFloat(mov.amount) || 0;
                if (['suprimento', 'sale_cash'].includes(mov.type)) {
                    expectedBalance += amount;
                } else if (['sangria'].includes(mov.type)) {
                    expectedBalance -= amount;
                }
            });

            const difference = parseFloat(closingBalance) - expectedBalance;

            // Update cash register
            const updatedRegister = await prisma.cash_registers.update({
                where: { id },
                data: {
                    closed_at: new Date(),
                    closing_balance: closingBalance,
                    expected_balance: expectedBalance,
                    difference: difference,
                    status: 'closed',
                    notes: notes ? `${register.notes || ''}\n${notes}` : register.notes
                }
            });

            // Log the closing movement
            await prisma.cash_movements.create({
                data: {
                    cash_register_id: id,
                    type: 'closing',
                    amount: closingBalance,
                    reason: 'Fechamento de caixa',
                    user_id: userId
                }
            });

            // Log to audit
            await prisma.audit_logs.create({
                data: {
                    user_id: userId,
                    action: 'CASH_REGISTER_CLOSE',
                    entity_type: 'cash_registers',
                    entity_id: id,
                    description: `Caixa fechado. Saldo: R$ ${parseFloat(closingBalance).toFixed(2)}, Esperado: R$ ${expectedBalance.toFixed(2)}, Diferença: R$ ${difference.toFixed(2)}`,
                    metadata: { closingBalance: parseFloat(closingBalance), expectedBalance, difference, notes }
                }
            });

            res.json({
                success: true,
                message: 'Caixa fechado com sucesso',
                register: updatedRegister,
                summary: {
                    openingBalance: parseFloat(register.opening_balance),
                    closingBalance: parseFloat(closingBalance),
                    expectedBalance,
                    difference
                }
            });
        } catch (error) {
            console.error('Error closing cash register:', error);
            res.status(500).json({ error: 'Erro ao fechar caixa' });
        }
    },

    /**
     * Perform sangria (cash withdrawal)
     */
    async sangria(req, res) {
        try {
            const { id } = req.params;
            const { amount, reason } = req.body;
            const userId = req.user?.id || req.body.userId;

            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Valor deve ser maior que zero' });
            }

            if (!reason || reason.trim().length < 3) {
                return res.status(400).json({ error: 'Motivo é obrigatório (mínimo 3 caracteres)' });
            }

            const register = await prisma.cash_registers.findUnique({ where: { id } });

            if (!register) {
                return res.status(404).json({ error: 'Caixa não encontrado' });
            }

            if (register.status === 'closed') {
                return res.status(400).json({ error: 'Caixa está fechado. Não é possível realizar sangria.' });
            }

            const movement = await prisma.cash_movements.create({
                data: {
                    cash_register_id: id,
                    type: 'sangria',
                    amount: amount,
                    reason: reason.trim(),
                    user_id: userId
                }
            });

            await prisma.audit_logs.create({
                data: {
                    user_id: userId,
                    action: 'CASH_SANGRIA',
                    entity_type: 'cash_movements',
                    entity_id: movement.id,
                    description: `Sangria de R$ ${parseFloat(amount).toFixed(2)}`,
                    reason: reason.trim(),
                    metadata: { cashRegisterId: id, amount: parseFloat(amount), reason: reason.trim() }
                }
            });

            res.json({ success: true, message: 'Sangria realizada com sucesso', movement });
        } catch (error) {
            console.error('Error performing sangria:', error);
            res.status(500).json({ error: 'Erro ao realizar sangria' });
        }
    },

    /**
     * Perform suprimento (cash addition)
     */
    async suprimento(req, res) {
        try {
            const { id } = req.params;
            const { amount, reason } = req.body;
            const userId = req.user?.id || req.body.userId;

            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'Valor deve ser maior que zero' });
            }

            const register = await prisma.cash_registers.findUnique({ where: { id } });

            if (!register) {
                return res.status(404).json({ error: 'Caixa não encontrado' });
            }

            if (register.status === 'closed') {
                return res.status(400).json({ error: 'Caixa está fechado. Não é possível realizar suprimento.' });
            }

            const movement = await prisma.cash_movements.create({
                data: {
                    cash_register_id: id,
                    type: 'suprimento',
                    amount: amount,
                    reason: reason?.trim() || 'Suprimento de caixa',
                    user_id: userId
                }
            });

            await prisma.audit_logs.create({
                data: {
                    user_id: userId,
                    action: 'CASH_SUPRIMENTO',
                    entity_type: 'cash_movements',
                    entity_id: movement.id,
                    description: `Suprimento de R$ ${parseFloat(amount).toFixed(2)}`,
                    reason: reason?.trim(),
                    metadata: { cashRegisterId: id, amount: parseFloat(amount), reason: reason?.trim() }
                }
            });

            res.json({ success: true, message: 'Suprimento realizado com sucesso', movement });
        } catch (error) {
            console.error('Error performing suprimento:', error);
            res.status(500).json({ error: 'Erro ao realizar suprimento' });
        }
    },

    /**
     * Get cash register report
     */
    async getReport(req, res) {
        try {
            const { id } = req.params;

            const register = await prisma.cash_registers.findUnique({
                where: { id },
                include: {
                    users: { select: { id: true, name: true } },
                    pdv_terminals: { select: { id: true, name: true } },
                    cash_movements: {
                        orderBy: { created_at: 'asc' },
                        include: { users: { select: { id: true, name: true } } }
                    },
                    sales: {
                        select: {
                            id: true, sale_number: true, total: true, status: true, created_at: true,
                            sale_payments: true
                        }
                    }
                }
            });

            if (!register) {
                return res.status(404).json({ error: 'Caixa não encontrado' });
            }

            const summary = {
                opening: 0, sangrias: 0, suprimentos: 0,
                sales: { cash: 0, credit_card: 0, debit_card: 0, pix: 0, other: 0, total: 0 },
                closing: parseFloat(register.closing_balance) || 0,
                expected: 0,
                difference: parseFloat(register.difference) || 0
            };

            register.cash_movements.forEach(mov => {
                const amount = parseFloat(mov.amount) || 0;
                if (mov.type === 'opening') summary.opening = amount;
                else if (mov.type === 'sangria') summary.sangrias += amount;
                else if (mov.type === 'suprimento') summary.suprimentos += amount;
            });

            register.sales.forEach(sale => {
                if (sale.status !== 'cancelled') {
                    sale.sale_payments?.forEach(payment => {
                        const amt = parseFloat(payment.amount) || 0;
                        const method = payment.payment_method?.toLowerCase() || 'other';
                        if (method.includes('cash') || method.includes('dinheiro')) summary.sales.cash += amt;
                        else if (method.includes('credit') || method.includes('crédito')) summary.sales.credit_card += amt;
                        else if (method.includes('debit') || method.includes('débito')) summary.sales.debit_card += amt;
                        else if (method.includes('pix')) summary.sales.pix += amt;
                        else summary.sales.other += amt;
                        summary.sales.total += amt;
                    });
                }
            });

            summary.expected = summary.opening + summary.suprimentos + summary.sales.cash - summary.sangrias;

            res.json({
                register: {
                    id: register.id, terminalId: register.terminal_id,
                    terminalName: register.pdv_terminals?.name, operatorId: register.user_id,
                    operatorName: register.users?.name, openedAt: register.opened_at,
                    closedAt: register.closed_at, status: register.status
                },
                summary,
                movements: register.cash_movements,
                sales: register.sales
            });
        } catch (error) {
            console.error('Error getting cash register report:', error);
            res.status(500).json({ error: 'Erro ao gerar relatório' });
        }
    },

    /**
     * List cash registers with filters
     */
    async list(req, res) {
        try {
            const { terminalId, status, startDate, endDate, operatorId, page = 1, limit = 20 } = req.query;
            const where = {};

            if (terminalId) where.terminal_id = terminalId;
            if (status) where.status = status;
            if (operatorId) where.user_id = operatorId;

            if (startDate || endDate) {
                where.opened_at = {};
                if (startDate) where.opened_at.gte = new Date(startDate + 'T00:00:00');
                if (endDate) where.opened_at.lte = new Date(endDate + 'T23:59:59');
            }

            const skip = (parseInt(page) - 1) * parseInt(limit);

            const [registers, total] = await Promise.all([
                prisma.cash_registers.findMany({
                    where,
                    include: {
                        users: { select: { id: true, name: true } },
                        pdv_terminals: { select: { id: true, name: true } }
                    },
                    orderBy: { opened_at: 'desc' },
                    skip,
                    take: parseInt(limit)
                }),
                prisma.cash_registers.count({ where })
            ]);

            res.json({
                registers,
                pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) }
            });
        } catch (error) {
            console.error('Error listing cash registers:', error);
            res.status(500).json({ error: 'Erro ao listar caixas' });
        }
    },

    /**
     * Get movements for a cash register
     */
    async getMovements(req, res) {
        try {
            const { id } = req.params;
            const movements = await prisma.cash_movements.findMany({
                where: { cash_register_id: id },
                include: { users: { select: { id: true, name: true } } },
                orderBy: { created_at: 'asc' }
            });
            res.json({ movements });
        } catch (error) {
            console.error('Error getting movements:', error);
            res.status(500).json({ error: 'Erro ao obter movimentações' });
        }
    }
};

export default cashRegisterController;
