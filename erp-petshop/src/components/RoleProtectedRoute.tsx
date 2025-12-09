import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ReactNode } from 'react';

// Role-based route access configuration (same as Sidebar)
const roleRouteAccess: Record<string, string[]> = {
    admin: ['*'], // Full access
    gerente: ['/admin/dashboard', '/pos', '/admin/sales', '/admin/scheduler', '/admin/inventory', '/admin/stock-movements', '/admin/financial', '/admin/reports', '/admin/customers', '/admin/suppliers', '/admin/settings'],
    caixa: ['/admin/dashboard', '/pos', '/admin/sales', '/admin/customers'],
    financeiro: ['/admin/dashboard', '/admin/financial', '/admin/reports', '/admin/customers', '/admin/suppliers'],
    estoque: ['/admin/dashboard', '/admin/inventory', '/admin/stock-movements', '/admin/reports', '/admin/suppliers'],
};

interface RoleProtectedRouteProps {
    children: ReactNode;
    requiredRole?: string[];
}

export function RoleProtectedRoute({ children, requiredRole }: RoleProtectedRouteProps) {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="flex items-center justify-center h-screen">Carregando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const userRole = user?.role?.toLowerCase() || 'caixa';
    const routes = roleRouteAccess[userRole] || roleRouteAccess.caixa;
    const hasFullAccess = routes.includes('*');

    // If specific roles are required, check them
    if (requiredRole && requiredRole.length > 0) {
        if (!hasFullAccess && !requiredRole.includes(userRole)) {
            return <Navigate to="/admin/dashboard" replace />;
        }
    }

    return <>{children}</>;
}

// Helper to check if a user can access a path
export function canAccessPath(userRole: string, path: string): boolean {
    const role = userRole?.toLowerCase() || 'caixa';
    const routes = roleRouteAccess[role] || roleRouteAccess.caixa;

    if (routes.includes('*')) return true;

    // Check if path starts with any allowed route
    return routes.some(route => path.startsWith(route));
}
