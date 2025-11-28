import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    DollarSign,
    BarChart3,
    UserCog,
    Settings,
    LogOut,
    Menu,
    Receipt
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
    currentPage: string;
    onNavigate: (page: string) => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon: any;
    enabled: boolean;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    const menuItems: MenuItem[] = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
        { id: 'pos', label: 'PDV', icon: ShoppingCart, enabled: true },
        { id: 'inventory', label: 'Estoque', icon: Package, enabled: true },
        { id: 'sales', label: 'Vendas', icon: Receipt, enabled: true },
        { id: 'customers', label: 'Clientes', icon: Users, enabled: false },
        { id: 'financial', label: 'Financeiro', icon: DollarSign, enabled: true },
        { id: 'reports', label: 'Relatórios', icon: BarChart3, enabled: false },
        { id: 'users', label: 'Usuários', icon: UserCog, enabled: false },
        { id: 'settings', label: 'Configurações', icon: Settings, enabled: false },
    ];

    return (
        <aside className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white shadow-lg flex flex-col transition-all duration-300`}>
            {/* Logo e Toggle */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2 rounded-lg text-white">
                                <Package size={24} />
                            </div>
                            <h1 className="text-xl font-bold text-gray-800">ERP Pet Shop</h1>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-2 hover:bg-gray-100 rounded-lg transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
                        title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
                    >
                        <Menu size={20} className="text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 p-4 space-y-1">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentPage === item.id;

                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (!item.enabled) return;
                                // PDV abre em nova guia
                                if (item.id === 'pos') {
                                    window.open('/pos', '_blank');
                                } else {
                                    onNavigate(item.id);
                                }
                            }}
                            disabled={!item.enabled}
                            className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                ${isActive
                                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                                    : item.enabled
                                        ? 'text-gray-700 hover:bg-gray-100'
                                        : 'text-gray-400 cursor-not-allowed opacity-60'
                                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
                            title={isCollapsed ? item.label : ''}
                        >
                            <Icon size={20} />
                            {!isCollapsed && (
                                <>
                                    <span className="flex-1 text-left">{item.label}</span>
                                    {!item.enabled && (
                                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">Em breve</span>
                                    )}
                                </>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={() => alert('Logout - Em desenvolvimento')}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? 'Sair' : ''}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span>Sair</span>}
                </button>
            </div>
        </aside>
    );
}
