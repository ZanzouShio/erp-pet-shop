import { Bell, User } from 'lucide-react';

interface HeaderProps {
    currentPage: string;
}

const pageNames: Record<string, string> = {
    dashboard: 'Dashboard',
    pos: 'Ponto de Venda',
    inventory: 'Estoque',
    customers: 'Clientes',
    financial: 'Financeiro',
    reports: 'Relatórios',
    users: 'Usuários',
    settings: 'Configurações',
};

export default function Header({ currentPage }: HeaderProps) {
    return (
        <header className="bg-white shadow-sm px-8 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
                {/* Page Title */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {pageNames[currentPage] || 'ERP Pet Shop'}
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Visão geral do seu negócio
                    </p>
                </div>

                {/* User Info */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Bell size={20} className="text-gray-600" />
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </button>

                    {/* User Avatar */}
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <p className="font-medium text-gray-900">Admin</p>
                            <p className="text-xs text-gray-500">Operador</p>
                        </div>
                        <div className="bg-indigo-600 p-2 rounded-full text-white">
                            <User size={20} />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
