import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import { ToastProvider } from './components/Toast';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
import Scheduler from './pages/Scheduler';
import StockMovements from './pages/StockMovements';
import Finance from './pages/Finance';
import ExpenseCategories from './pages/ExpenseCategories';
import AccountsPayable from './pages/AccountsPayable';
import AccountsReceivable from './pages/AccountsReceivable';
import CashFlow from './pages/CashFlow';
import BankReconciliation from './pages/BankReconciliation';
import ReportsDashboard from './pages/Reports/ReportsDashboard';
import DailySalesReport from './pages/Reports/DailySalesReport';
import CashPositionReport from './pages/Reports/CashPositionReport';
import FinancialSituationReport from './pages/Reports/FinancialSituationReport';
import StockAlertsReport from './pages/Reports/StockAlertsReport';
import ProductPerformanceReport from './pages/Reports/ProductPerformanceReport';
import PaymentFeesReport from './pages/Reports/PaymentFeesReport';
import BreakevenReport from './pages/Reports/BreakevenReport';
import AverageTicketReport from './pages/Reports/AverageTicketReport';
import RevenueAnalysisReport from './pages/Reports/RevenueAnalysisReport';
import DiscountAnalyticsReport from './pages/Reports/DiscountAnalyticsReport';
import CustomerList from './pages/Customers/CustomerList';
import CustomerForm from './pages/Customers/CustomerForm';
import SuppliersList from './pages/Suppliers/SuppliersList';
import SupplierForm from './pages/Suppliers/SupplierForm';
import PetSpeciesSettings from './pages/Settings/PetSpeciesSettings';
import PaymentSettings from './pages/Settings/PaymentSettings';
import BankAccountSettings from './pages/Settings/BankAccountSettings';
import LoyaltySettings from './pages/Settings/LoyaltySettings';
import BusinessSettingsDashboard from './pages/Settings/BusinessSettingsDashboard';
import CompanySettings from './pages/Settings/CompanySettings';
import InvoiceSettings from './pages/Settings/InvoiceSettings';
import NFCeSettings from './pages/Settings/NFCeSettings';
import NFCeCertificate from './pages/Settings/NFCeCertificate';
import NFCeEmissionData from './pages/Settings/NFCeEmissionData';
import NFCeTaxes from './pages/Settings/NFCeTaxes';
import NFeSettings from './pages/Settings/NFeSettings';
import NFeCertificate from './pages/Settings/NFeCertificate';
import NFeEmissionData from './pages/Settings/NFeEmissionData';
import NFeTaxes from './pages/Settings/NFeTaxes';
import AuditLogs from './pages/Settings/AuditLogs';
import FiscalInvoices from './pages/Financial/FiscalInvoices';
import Commissions from './pages/Financial/Commissions';
import CashRegisterList from './pages/Financial/CashRegisterList';
import UserList from './pages/Settings/UserList';
import UserForm from './pages/Settings/UserForm';
import RoleList from './pages/Settings/RoleList';
import ProductCategories from './pages/Settings/ProductCategories';
import GroomingManagement from './pages/GroomingManagement';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div>Carregando...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Rotas Protegidas */}
            <Route path="/pos" element={
              <ProtectedRoute>
                <POSPage />
              </ProtectedRoute>
            } />

            <Route path="/admin/*" element={
              <ProtectedRoute>
                <AdminRoutes />
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

// Componente PDV standalone
function POSPage() {
  return <POS onExit={() => window.location.href = '/admin/dashboard'} />;
}

// Componente para rotas administrativas
function AdminRoutes() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="sales" element={<Sales />} />
        <Route path="scheduler" element={<Scheduler />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="stock-movements" element={<StockMovements />} />

        {/* Financeiro */}
        <Route path="financial/payable" element={<AccountsPayable />} />
        <Route path="financial/receivable" element={<AccountsReceivable />} />
        <Route path="financial/categories" element={<ExpenseCategories />} />
        <Route path="financial/cash-flow" element={<CashFlow />} />
        <Route path="financial/invoices" element={<FiscalInvoices />} />
        <Route path="financial/reconciliation" element={<BankReconciliation />} />
        <Route path="financial/commissions" element={<Commissions />} />
        <Route path="financial/cash-registers" element={<CashRegisterList />} />
        <Route path="financial/import" element={<Finance />} />

        {/* Relatórios */}
        <Route path="reports" element={<ReportsDashboard />} />
        <Route path="reports/daily-sales" element={<DailySalesReport />} />
        <Route path="reports/cash-position" element={<CashPositionReport />} />
        <Route path="reports/financial-situation" element={<FinancialSituationReport />} />
        <Route path="reports/stock-alerts" element={<StockAlertsReport />} />
        <Route path="reports/product-performance" element={<ProductPerformanceReport />} />
        <Route path="reports/payment-fees" element={<PaymentFeesReport />} />
        <Route path="reports/breakeven" element={<BreakevenReport />} />
        <Route path="reports/average-ticket" element={<AverageTicketReport />} />
        <Route path="reports/revenue-analysis" element={<RevenueAnalysisReport />} />
        <Route path="reports/discounts" element={<DiscountAnalyticsReport />} />

        {/* Clientes */}
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id" element={<CustomerForm />} />

        {/* Fornecedores */}
        <Route path="suppliers" element={<SuppliersList />} />
        <Route path="suppliers/new" element={<SupplierForm />} />
        <Route path="suppliers/:id" element={<SupplierForm />} />

        {/* Configurações */}
        <Route path="settings/pet-species" element={<PetSpeciesSettings />} />
        <Route path="settings/product-categories" element={<ProductCategories />} />
        <Route path="settings/expense-categories" element={<ExpenseCategories />} />
        <Route path="settings/payments" element={<PaymentSettings />} />
        <Route path="settings/payments" element={<PaymentSettings />} />
        <Route path="settings/bank-accounts" element={<BankAccountSettings />} />
        <Route path="settings/loyalty" element={<LoyaltySettings />} />
        <Route path="settings/business" element={<BusinessSettingsDashboard />} />
        <Route path="settings/company" element={<CompanySettings />} />
        <Route path="settings/invoices" element={<InvoiceSettings />} />
        <Route path="settings/invoices/nfce" element={<NFCeSettings />} />
        <Route path="settings/invoices/nfce/certificate" element={<NFCeCertificate />} />
        <Route path="settings/invoices/nfce/data" element={<NFCeEmissionData />} />
        <Route path="settings/invoices/nfce/taxes" element={<NFCeTaxes />} />

        <Route path="settings/invoices/nfe" element={<NFeSettings />} />
        <Route path="settings/invoices/nfe/certificate" element={<NFeCertificate />} />
        <Route path="settings/invoices/nfe/data" element={<NFeEmissionData />} />
        <Route path="settings/invoices/nfe/taxes" element={<NFeTaxes />} />
        <Route path="settings/audit-logs" element={<AuditLogs />} />
        <Route path="settings/users" element={<UserList />} />
        <Route path="settings/users/new" element={<UserForm />} />
        <Route path="settings/users/:id" element={<UserForm />} />
        <Route path="settings/roles" element={<RoleList />} />

        {/* Grooming Management */}
        <Route path="grooming-settings" element={<GroomingManagement />} />

        {/* Placeholders for now */}
        <Route path="settings/integrations" element={<div className="p-8">Configurações de Integrações (Em breve)</div>} />
        <Route path="settings/stores" element={<div className="p-8">Gestão de Lojas e Caixas (Em breve)</div>} />
      </Routes>
    </AdminLayout>
  );
}

export default App;
