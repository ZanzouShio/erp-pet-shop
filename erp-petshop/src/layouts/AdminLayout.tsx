import { ReactNode } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { useAuth } from '../contexts/AuthContext';

interface AdminLayoutProps {
    children: ReactNode;
}

// Role-based route access configuration
const roleRouteAccess: Record<string, string[]> = {
    admin: ['*'], // Full access
    gerente: ['dashboard', 'sales', 'scheduler', 'inventory', 'stock-movements', 'financial', 'reports', 'customers', 'suppliers', 'settings'],
    caixa: ['dashboard', 'sales', 'customers'],
    financeiro: ['dashboard', 'financial', 'reports', 'customers', 'suppliers'],
    estoque: ['dashboard', 'inventory', 'stock-movements', 'reports', 'suppliers'],
};

export default function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Get current route segment
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const currentSection = pathSegments[1] || 'dashboard'; // e.g., /admin/settings/users -> settings

    // Check access
    const userRole = user?.role?.toLowerCase() || 'caixa';
    const allowedRoutes = roleRouteAccess[userRole] || roleRouteAccess.caixa;
    const hasFullAccess = allowedRoutes.includes('*');

    // If user doesn't have access to this section, redirect to dashboard
    if (!hasFullAccess && !allowedRoutes.includes(currentSection)) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    // Extrai o nome da página atual da rota (ex: /admin/dashboard -> dashboard)
    const currentPage = location.pathname.split('/').pop() || 'dashboard';

    const handleNavigate = (page: string) => {
        navigate(`/admin/${page}`);
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header currentPage={currentPage} />

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

