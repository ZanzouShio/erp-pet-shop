import express from 'express';
import cors from 'cors';
import path from 'path';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { fileURLToPath } from 'url';

// Auth middleware
import { authMiddleware, optionalAuthMiddleware } from './middleware/auth.middleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import productRoutes from './routes/product.routes.js';
import categoryRoutes from './routes/category.routes.js';
import saleRoutes from './routes/sale.routes.js';
import stockRoutes from './routes/stock.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import financialRoutes from './routes/financial.routes.js';
import accountsPayableRoutes from './routes/accountsPayable.routes.js';
import accountsReceivableRoutes from './routes/accountsReceivable.routes.js';
import paymentRateRoutes from './routes/paymentRate.routes.js';
import cashFlowRoutes from './routes/cashFlow.routes.js';
import bankReconciliationRoutes from './routes/bankReconciliation.routes.js';
import reportsRoutes from './routes/reports.routes.js';
import customerRoutes from './routes/customers.routes.js';
import petSpeciesRoutes from './routes/petSpecies.routes.js';
import paymentConfigurationRoutes from './routes/paymentConfiguration.routes.js';
import bankAccountRoutes from './routes/bankAccount.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';
import settingsRoutes from './routes/settings.routes.js';
import invoiceRoutes from './routes/invoices.routes.js';
import appointmentRoutes from './routes/appointments.routes.js';
import groomingRoutes from './routes/grooming.routes.js';
import groomersRoutes from './routes/groomers.routes.js';
import groomingServicesRoutes from './routes/groomingServices.routes.js';
import groomingResourcesRoutes from './routes/groomingResources.routes.js';
import serviceMatrixRoutes from './routes/serviceMatrix.routes.js';
import commissionsRoutes from './routes/commissions.routes.js';
import auditLogRoutes from './routes/auditLog.routes.js';
import cashRegisterRoutes from './routes/cashRegister.routes.js';
import discountReportRoutes from './routes/discountReport.routes.js';
import uploadRoutes from './routes/upload.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ============================================
// SEGURANÇA - Helmet (headers de proteção)
// ============================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Para permitir uploads
    contentSecurityPolicy: false // Desabilitar CSP em dev, habilitar em prod com config adequada
}));

// ============================================
// CORS - Configuração de origens permitidas
// ============================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [process.env.FRONTEND_URL || 'http://localhost:5173', 'http://localhost:5174'];

app.use(cors({
    origin: (origin, callback) => {
        // Permitir requisições sem origin (apps mobile, Postman, etc)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Origem bloqueada: ${origin}`);
            callback(new Error('Bloqueado por política CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ============================================
// RATE LIMITING - Proteção contra brute force
// ============================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // máximo 10 tentativas por IP
    message: {
        error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
        code: 'RATE_LIMITED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => process.env.NODE_ENV === 'development' // Desabilitar em dev
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minuto
    max: 200, // 200 requests por minuto
    message: { error: 'Muitas requisições. Aguarde um momento.' },
    skip: (req) => process.env.NODE_ENV === 'development'
});

// Aplicar rate limit geral na API
app.use('/api', apiLimiter);

// ============================================
// ROTAS PÚBLICAS (sem autenticação)
// ============================================

// Health check - sempre público
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'ERP Pet Shop API',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Auth routes - login precisa ser público
app.use('/api/auth', loginLimiter, authRoutes);

// Arquivos estáticos (uploads) - público para imagens
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// MIDDLEWARE DE AUTENTICAÇÃO GLOBAL
// ============================================
// Todas as rotas abaixo exigem autenticação
app.use('/api', authMiddleware);

// ============================================
// ROTAS PROTEGIDAS (requerem autenticação)
// ============================================

// Usuários e Roles
app.use('/api/users', usersRoutes);
app.use('/api/roles', rolesRoutes);

// Produtos e Categorias
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);

// Vendas e PDV
app.use('/api/sales', saleRoutes);
app.use('/api/cash-registers', cashRegisterRoutes);

// Estoque
app.use('/api/stock-movements', stockRoutes);

// Dashboard e Relatórios
app.use('/api/statistics', dashboardRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/reports', discountReportRoutes); // Sub-rota de relatórios

// Financeiro
app.use('/api/financial', financialRoutes);
app.use('/api/accounts-payable', accountsPayableRoutes);
app.use('/api/accounts-receivable', accountsReceivableRoutes);
app.use('/api/payment-rates', paymentRateRoutes);
app.use('/api/cash-flow', cashFlowRoutes);
app.use('/api/bank-reconciliation', bankReconciliationRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/payment-config', paymentConfigurationRoutes);
app.use('/api/commissions', commissionsRoutes);

// Clientes
app.use('/api/customers', customerRoutes);
app.use('/api/pet-species', petSpeciesRoutes);

// Fornecedores
app.use('/api/suppliers', suppliersRoutes);

// Agendamentos e Banho/Tosa
app.use('/api/appointments', appointmentRoutes);
app.use('/api/grooming', groomingRoutes);
app.use('/api/groomers', groomersRoutes);
app.use('/api/grooming-services', groomingServicesRoutes);
app.use('/api/grooming-resources', groomingResourcesRoutes);
app.use('/api/service-matrix', serviceMatrixRoutes);

// Configurações
app.use('/api/settings', settingsRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/uploads', uploadRoutes);

// ============================================
// ERROR HANDLERS
// ============================================

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada', path: req.path });
});

// Error Handler global
app.use((err, req, res, next) => {
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV !== 'production') {
        console.error('❌ Erro:', err);
    }

    // Erros de CORS
    if (err.message === 'Bloqueado por política CORS') {
        return res.status(403).json({ error: 'Origem não permitida' });
    }

    // Erro genérico
    res.status(err.status || 500).json({
        error: process.env.NODE_ENV === 'production'
            ? 'Erro interno do servidor'
            : err.message
    });
});

export default app;

