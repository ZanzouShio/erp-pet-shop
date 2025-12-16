import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Users,
    DollarSign,
    UserCog,
    Settings,
    LogOut,
    Menu,
    Receipt,
    ChevronDown,
    ChevronRight,
    FileText,
    TrendingUp,
    TrendingDown,
    Upload,
    LineChart,
    Boxes,
    Link as LinkIcon,
    Truck,
    Building2,
    Scissors,
    FileSearch,
    Monitor
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
    currentPage?: string;
    onNavigate?: (page: string) => void;
}

interface MenuItem {
    id: string;
    label: string;
    icon?: any;
    enabled: boolean;
    path?: string;
    subItems?: MenuItem[];
}

// Role-based menu access configuration
const roleMenuAccess: Record<string, string[]> = {
    admin: ['*'], // Full access
    gerente: ['dashboard', 'pos', 'sales', 'scheduler', 'stock', 'financial', 'reports', 'customers', 'suppliers', 'settings'],
    caixa: ['dashboard', 'pos', 'sales', 'customers'],
    financeiro: ['dashboard', 'financial', 'reports', 'customers', 'suppliers'],
    estoque: ['dashboard', 'stock', 'reports', 'suppliers'],
};

export default function Sidebar({ onNavigate }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['financial', 'stock', 'settings']);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout, user } = useAuth();

    // Get allowed menus for current user role
    const userRole = user?.role?.toLowerCase() || 'caixa';
    const allowedMenus = roleMenuAccess[userRole] || roleMenuAccess.caixa;
    const hasFullAccess = allowedMenus.includes('*');

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuId)
                ? prev.filter(id => id !== menuId)
                : [...prev, menuId]
        );
    };

    const handleNavigation = (path: string) => {
        if (path === '/pos') {
            window.location.href = path;
        } else {
            navigate(path);
        }
        // Note: onNavigate is not called since paths are already absolute
    };

    const menuItems: MenuItem[] = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: true, path: '/admin/dashboard' },
        { id: 'pos', label: 'PDV', icon: ShoppingCart, enabled: true, path: '/pos' },
        { id: 'sales', label: 'Vendas', icon: Receipt, enabled: true, path: '/admin/sales' },
        { id: 'scheduler', label: 'Agendamento', icon: Scissors, enabled: true, path: '/admin/scheduler' },
        {
            id: 'stock',
            label: 'Estoque',
            icon: Package,
            enabled: true,
            subItems: [
                { id: 'inventory', label: 'Gestão de Estoque', icon: Boxes, enabled: true, path: '/admin/inventory' },
                { id: 'stock-movements', label: 'Movimentações', icon: TrendingUp, enabled: true, path: '/admin/stock-movements' },
            ]
        },
        {
            id: 'financial',
            label: 'Financeiro',
            icon: DollarSign,
            enabled: true,
            subItems: [
                { id: 'financial-cash-registers', label: 'Caixa', icon: Monitor, enabled: true, path: '/admin/financial/cash-registers' },
                { id: 'financial-payable', label: 'Contas a Pagar', icon: TrendingDown, enabled: true, path: '/admin/financial/payable' },
                { id: 'financial-receivable', label: 'Contas a Receber', icon: TrendingUp, enabled: true, path: '/admin/financial/receivable' },
                { id: 'financial-cashflow', label: 'Fluxo de Caixa', icon: LineChart, enabled: true, path: '/admin/financial/cash-flow' },
                { id: 'fiscal-invoices', label: 'Notas Fiscais', icon: FileText, enabled: true, path: '/admin/financial/invoices' },
                { id: 'financial-commissions', label: 'Comissões', icon: UserCog, enabled: true, path: '/admin/financial/commissions' },
                { id: 'financial-reconciliation', label: 'Conciliação Bancária', icon: LinkIcon, enabled: true, path: '/admin/financial/reconciliation' },
                { id: 'financial-import', label: 'Importação NF-e', icon: Upload, enabled: true, path: '/admin/financial/import' },
            ]
        },
        { id: 'reports', label: 'Relatórios', icon: FileText, enabled: true, path: '/admin/reports' },
        { id: 'customers', label: 'Clientes', icon: Users, enabled: true, path: '/admin/customers' },
        { id: 'suppliers', label: 'Fornecedores', icon: Truck, enabled: true, path: '/admin/suppliers' },
        {
            id: 'settings',
            label: 'Configurações',
            icon: Settings,
            enabled: true,
            subItems: [
                { id: 'business-settings', label: 'Meu Negócio', icon: Building2, enabled: true, path: '/admin/settings/business' },
                {
                    id: 'settings-products',
                    label: 'Produtos',
                    icon: Package,
                    enabled: true,
                    subItems: [
                        { id: 'product-categories', label: 'Categorias', icon: ChevronRight, enabled: true, path: '/admin/settings/product-categories' },
                    ]
                },
                {
                    id: 'settings-financial',
                    label: 'Financeiro',
                    icon: DollarSign,
                    enabled: true,
                    subItems: [
                        { id: 'expense-categories', label: 'Categorias de Despesas', icon: ChevronRight, enabled: true, path: '/admin/settings/expense-categories' },
                        { id: 'payment-methods', label: 'Métodos de Pagamento', icon: ChevronRight, enabled: true, path: '/admin/settings/payments' },
                        { id: 'bank-accounts', label: 'Contas Bancárias', icon: ChevronRight, enabled: true, path: '/admin/settings/bank-accounts' },
                    ]
                },
                {
                    id: 'settings-pets',
                    label: 'Clientes',
                    icon: Users,
                    enabled: true,
                    subItems: [
                        { id: 'pet-species', label: 'Cadastro de Espécies', icon: ChevronRight, enabled: true, path: '/admin/settings/pet-species' },
                        { id: 'loyalty-settings', label: 'Fidelidade e Cashback', icon: ChevronRight, enabled: true, path: '/admin/settings/loyalty' },
                    ]
                },
                {
                    id: 'settings-system',
                    label: 'Sistema',
                    icon: Monitor,
                    enabled: true,
                    subItems: [
                        { id: 'users-management', label: 'Usuários', icon: Users, enabled: true, path: '/admin/settings/users' },
                        { id: 'audit-logs', label: 'Auditoria de Logs', icon: FileSearch, enabled: true, path: '/admin/settings/audit-logs' },
                    ]
                }
            ]
        },
    ];

    // Filter menu items based on user role
    const getFilteredMenuItems = (): MenuItem[] => {
        if (hasFullAccess) return menuItems;
        return menuItems.filter(item => allowedMenus.includes(item.id));
    };

    const filteredMenuItems = getFilteredMenuItems();

    const isActive = (item: MenuItem): boolean => {
        if (item.path === '/pos') return false;
        if (item.path && location.pathname === item.path) return true;
        if (item.subItems) {
            return item.subItems.some(sub => isActive(sub));
        }
        return false;
    };

    const renderMenuItem = (item: MenuItem, depth = 0) => {
        const Icon = item.icon;
        const active = isActive(item);
        const expanded = expandedMenus.includes(item.id);
        const hasSubItems = item.subItems && item.subItems.length > 0;
        const isSubItem = depth > 0;
        const paddingLeft = depth * 12 + 16; // 16px base + 12px per level

        return (
            <div key={item.id} className="relative group">
                <button
                    onClick={() => {
                        if (!item.enabled) return;
                        if (item.id === 'pos') {
                            window.open('/pos', '_blank');
                            return;
                        }
                        if (hasSubItems) {
                            toggleMenu(item.id);
                            if (isCollapsed) setIsCollapsed(false);
                        } else if (item.path) {
                            handleNavigation(item.path);
                        }
                    }}
                    disabled={!item.enabled}
                    style={{ paddingLeft: isCollapsed ? undefined : `${paddingLeft}px` }}
                    className={`
                        w-full flex items-center gap-3 py-2 rounded-lg transition-all mb-0.5 relative
                        ${active && !hasSubItems
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : item.enabled
                                ? isSubItem
                                    ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    : 'text-gray-700 hover:bg-gray-100' // Top level default
                                : 'text-gray-400 cursor-not-allowed opacity-60'
                        }
                        ${isCollapsed ? 'justify-center px-2' : 'pr-4'}
                    `}
                    title={isCollapsed ? item.label : ''}
                >
                    {active && !hasSubItems && !isCollapsed && (
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-l-full" />
                    )}

                    {Icon && (
                        <div className={`flex items-center justify-center transition-colors ${isSubItem ? 'scale-90 opacity-75' : ''}`}>
                            <Icon
                                size={isSubItem ? 18 : 20}
                                className={active && !hasSubItems ? 'text-indigo-600' : isSubItem ? 'text-gray-400 group-hover:text-gray-600' : 'text-gray-500 group-hover:text-gray-700'}
                            />
                        </div>
                    )}

                    {!isCollapsed && (
                        <>
                            <span className={`flex-1 text-left ${isSubItem ? 'text-[13px] font-normal' : 'text-sm font-medium'}`}>
                                {item.label}
                            </span>
                            {hasSubItems && (
                                expanded ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />
                            )}
                            {!item.enabled && (
                                <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-500">Em breve</span>
                            )}
                        </>
                    )}
                </button>

                {/* Recursively render subitems */}
                {!isCollapsed && hasSubItems && expanded && (
                    <div className="relative">
                        {/* Linha guia visual para submenus */}
                        <div
                            className="absolute left-0 top-0 bottom-0 border-l border-gray-200"
                            style={{ left: `${paddingLeft + 9}px` }}
                        />
                        {item.subItems!.map(subItem => renderMenuItem(subItem, depth + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside
            className={`
                fixed lg:static inset-y-0 left-0 z-30
                ${isCollapsed ? 'w-20' : 'w-64'} 
                bg-white shadow-xl flex flex-col transition-all duration-300 h-screen border-r border-gray-100
                print:hidden
            `}
        >
            {/* Logo e Toggle */}
            <div className="p-4 border-b border-gray-100 flex-shrink-0 bg-white">
                <div className="flex items-center justify-between">
                    {!isCollapsed && (
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="bg-indigo-600 p-2 rounded-lg text-white flex-shrink-0 shadow-sm">
                                <Package size={20} />
                            </div>
                            <h1 className="text-lg font-bold text-gray-800 whitespace-nowrap">ERP Pet Shop</h1>
                        </div>
                    )}
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        className={`p-1.5 hover:bg-gray-100 rounded-lg transition-colors ${isCollapsed ? 'mx-auto' : ''}`}
                        title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
                    >
                        <Menu size={20} className="text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Menu Items - Scrollable Area */}
            <nav className="flex-1 p-3 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent hover:scrollbar-thumb-gray-300">
                <div className="space-y-0.5">
                    {filteredMenuItems.map(item => renderMenuItem(item))}
                </div>
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <button
                    onClick={logout}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? 'Sair' : ''}
                >
                    <LogOut size={20} />
                    {!isCollapsed && <span className="text-sm font-medium">Sair do Sistema</span>}
                </button>
            </div>
        </aside>
    );
}
