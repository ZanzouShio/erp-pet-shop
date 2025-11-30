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
import CustomerList from './pages/Customers/CustomerList';
import CustomerForm from './pages/Customers/CustomerForm';
import PetSpeciesSettings from './pages/Settings/PetSpeciesSettings';

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

        {/* Clientes */}
        <Route path="customers" element={<CustomerList />} />
        <Route path="customers/new" element={<CustomerForm />} />
        <Route path="customers/:id" element={<CustomerForm />} />

        {/* Configurações */}
        <Route path="settings/pet-species" element={<PetSpeciesSettings />} />
      </Routes>
    </AdminLayout>
  );
}

// Componente placeholder para páginas em desenvolvimento
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-8 flex items-center justify-center h-full">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{title}</h1>
        <p className="text-gray-500 text-lg">Em desenvolvimento...</p>
        <p className="text-gray-400 text-sm mt-2">Esta funcionalidade estará disponível em breve.</p>
      </div>
    </div>
  );
}

export default App;
