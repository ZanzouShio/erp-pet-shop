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
    Receipt,
    ChevronDown,
    ChevronRight,
    FileText,
    TrendingUp,
    TrendingDown,
    Upload,
    LineChart,
    Boxes
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

export default function Sidebar({ onNavigate }: SidebarProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedMenus, setExpandedMenus] = useState<string[]>(['financial', 'stock', 'settings']);
    const navigate = useNavigate();
    const location = useLocation();

    const toggleMenu = (menuId: string) => {
        setExpandedMenus(prev =>
            prev.includes(menuId)
                ? prev.filter(id => id !== menuId)
                : [...prev, menuId]
        );
    };

    const handleNavigation = (path: string) => {
        navigate(path);
        if (onNavigate) onNavigate(path.replace('/admin/', ''));
    };

    const menuItems: MenuItem[] = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: true, path: '/admin/dashboard' },
        { id: 'pos', label: 'PDV', icon: ShoppingCart, enabled: true, path: '/pos' },
        { id: 'sales', label: 'Vendas', icon: Receipt, enabled: true, path: '/admin/sales' },
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
                { id: 'financial-payable', label: 'Contas a Pagar', icon: TrendingDown, enabled: true, path: '/admin/financial/payable' },
                { id: 'financial-receivable', label: 'Contas a Receber', icon: TrendingUp, enabled: false, path: '/admin/financial/receivable' },
                { id: 'financial-cashflow', label: 'Fluxo de Caixa', icon: LineChart, enabled: false, path: '/admin/financial/cash-flow' },
                { id: 'financial-import', label: 'Importação NF-e', icon: Upload, enabled: true, path: '/admin/financial/import' },
            ]
        },
        { id: 'reports', label: 'Relatórios', icon: BarChart3, enabled: false, path: '/admin/reports' },
        { id: 'customers', label: 'Clientes', icon: Users, enabled: false, path: '/admin/customers' },
        { id: 'users', label: 'Usuários', icon: UserCog, enabled: false, path: '/admin/users' },
        {
            id: 'settings',
            label: 'Configurações',
            icon: Settings,
            enabled: true,
            subItems: [
                {
                    id: 'settings-financial',
                    label: 'Financeiro',
                    icon: DollarSign,
                    enabled: true,
                    subItems: [
                        { id: 'financial-categories', label: 'Categorias de Despesa', icon: FileText, enabled: true, path: '/admin/financial/categories' },
                    ]
                }
            ]
        },
    ];

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
        const paddingLeft = depth * 12 + 16; // 16px base + 12px per level

        return (
            <div key={item.id}>
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
                        w-full flex items-center gap-3 py-2.5 rounded-lg transition-all mb-0.5
                        ${active && !hasSubItems
                            ? 'bg-indigo-50 text-indigo-600 font-medium'
                            : item.enabled
                                ? 'text-gray-700 hover:bg-gray-100'
                                : 'text-gray-400 cursor-not-allowed opacity-60'
                        }
                        ${isCollapsed ? 'justify-center px-2' : 'pr-4'}
                    `}
                    title={isCollapsed ? item.label : ''}
                >
                    {Icon && <Icon size={20} className={active && !hasSubItems ? 'text-indigo-600' : 'text-gray-500'} />}
                    {!isCollapsed && (
                        <>
                            <span className="flex-1 text-left text-sm">{item.label}</span>
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
                            className="absolute left-0 top-0 bottom-0 border-l border-gray-100"
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
            className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white shadow-xl flex flex-col transition-all duration-300 h-screen sticky top-0 z-50 border-r border-gray-100`}
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
                    {menuItems.map(item => renderMenuItem(item))}
                </div>
            </nav>

            {/* Logout */}
            <div className="p-3 border-t border-gray-100 flex-shrink-0 bg-gray-50/50">
                <button
                    onClick={() => alert('Logout - Em desenvolvimento')}
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
