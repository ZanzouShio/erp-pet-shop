import express from 'express';
import cors from 'cors';
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

const app = express();

// Middlewares
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());

// Rotas
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/stock-movements', stockRoutes);
app.use('/api/statistics', dashboardRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/accounts-payable', accountsPayableRoutes);
app.use('/api/accounts-receivable', accountsReceivableRoutes);
app.use('/api/payment-rates', paymentRateRoutes);
app.use('/api/cash-flow', cashFlowRoutes);
app.use('/api/bank-reconciliation', bankReconciliationRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/pet-species', petSpeciesRoutes);
app.use('/api/payment-config', paymentConfigurationRoutes);
app.use('/api/bank-accounts', bankAccountRoutes);
app.use('/api/suppliers', suppliersRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'ERP Pet Shop API está rodando! (Refatorado)',
        timestamp: new Date().toISOString()
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Erro:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
});

export default app;
