import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';
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
import CustomerList from './pages/Customers/CustomerList';
import CustomerForm from './pages/Customers/CustomerForm';
import PetSpeciesSettings from './pages/Settings/PetSpeciesSettings';
import PaymentSettings from './pages/Settings/PaymentSettings';
import BankAccountSettings from './pages/Settings/BankAccountSettings';
import SuppliersList from './pages/Suppliers/SuppliersList';
import SupplierForm from './pages/Suppliers/SupplierForm';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz redireciona para admin/dashboard */}
        <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />

        {/* PDV - Tela cheia, sem AdminLayout */}
        <Route path="/pos" element={<POSPage />} />

        {/* Rotas administrativas - com AdminLayout */}
        <Route path="/admin/*" element={<AdminRoutes />} />
      </Routes>
    </BrowserRouter>
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
        <Route path="inventory" element={<Inventory />} />
        <Route path="stock-movements" element={<StockMovements />} />

        {/* Financeiro */}
        <Route path="financial/payable" element={<AccountsPayable />} />
        <Route path="financial/receivable" element={<AccountsReceivable />} />
        <Route path="financial/categories" element={<ExpenseCategories />} />
        <Route path="financial/cash-flow" element={<CashFlow />} />
        <Route path="financial/reconciliation" element={<BankReconciliation />} />
        <Route path="financial/import" element={<Finance />} />

        {/* Relatórios */}
        <Route path="reports" element={<ReportsDashboard />} />
        <Route path="reports/daily-sales" element={<DailySalesReport />} />
        <Route path="reports/cash-position" element={<CashPositionReport />} />
        <Route path="reports/financial-situation" element={<FinancialSituationReport />} />
        <Route path="reports/stock-alerts" element={<StockAlertsReport />} />
        <Route path="reports/product-performance" element={<ProductPerformanceReport />} />
        <Route path="reports/payment-fees" element={<PaymentFeesReport />} />

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
        <Route path="settings/expense-categories" element={<ExpenseCategories />} />
        <Route path="settings/payments" element={<PaymentSettings />} />
        <Route path="settings/bank-accounts" element={<BankAccountSettings />} />
      </Routes>
    </AdminLayout>
  );
}

export default App;
