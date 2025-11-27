import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();

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
