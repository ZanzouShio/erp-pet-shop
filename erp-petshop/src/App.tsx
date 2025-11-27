import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Sales from './pages/Sales';

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
        <Route path="inventory" element={<Inventory />} />
        <Route path="sales" element={<Sales />} />
        <Route path="customers" element={<PlaceholderPage title="Clientes" />} />
        <Route path="financial" element={<PlaceholderPage title="Financeiro" />} />
        <Route path="reports" element={<PlaceholderPage title="Relatórios" />} />
        <Route path="users" element={<PlaceholderPage title="Usuários" />} />
        <Route path="settings" element={<PlaceholderPage title="Configurações" />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
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
