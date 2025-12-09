import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Users,
    UserPlus,
    Search,
    Filter,
    Edit,
    Trash2,
    Power,
    Key,
    Clock,
    Shield,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    X
} from 'lucide-react';
import { API_URL } from '../../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    cpf: string | null;
    phone: string | null;
    role: string;
    role_id: string | null;
    is_active: boolean;
    avatar_url: string | null;
    last_login_at: string | null;
    two_factor_enabled: boolean;
    is_groomer: boolean;
    created_at: string;
    roles: { id: string; name: string; color: string } | null;
}

interface Role {
    id: string;
    name: string;
    color: string;
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

interface LoginHistory {
    id: string;
    ip_address: string | null;
    user_agent: string | null;
    success: boolean;
    reason: string | null;
    created_at: string;
}

export default function UserList() {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });

    // Filters
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Modals
    const [showResetPassword, setShowResetPassword] = useState<User | null>(null);
    const [showLoginHistory, setShowLoginHistory] = useState<User | null>(null);
    const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);
    const [newPassword, setNewPassword] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        loadRoles();
    }, []);

    useEffect(() => {
        loadUsers();
    }, [pagination.page, roleFilter, statusFilter]);

    const loadRoles = async () => {
        try {
            const response = await fetch(`${API_URL}/roles`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            if (!response.ok) {
                console.error('Error loading roles:', response.status);
                setRoles([]);
                return;
            }
            const data = await response.json();
            setRoles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading roles:', error);
            setRoles([]);
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', pagination.page.toString());
            params.append('limit', '20');
            if (search) params.append('search', search);
            if (roleFilter) params.append('role', roleFilter);
            if (statusFilter) params.append('isActive', statusFilter);

            const response = await fetch(`${API_URL}/users?${params}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) {
                console.error('Error loading users:', response.status);
                setUsers([]);
                return;
            }

            const data = await response.json();

            setUsers(Array.isArray(data.users) ? data.users : []);
            setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch (error) {
            console.error('Error loading users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPagination(p => ({ ...p, page: 1 }));
        loadUsers();
    };

    const handleToggleStatus = async (user: User) => {
        if (!confirm(`Deseja ${user.is_active ? 'desativar' : 'ativar'} o usuário ${user.name}?`)) return;

        try {
            await fetch(`${API_URL}/users/${user.id}/toggle-status`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            loadUsers();
        } catch (error) {
            console.error('Error toggling user status:', error);
        }
    };

    const handleResetPassword = async () => {
        if (!showResetPassword || !newPassword) return;

        try {
            setActionLoading(true);
            const response = await fetch(`${API_URL}/users/${showResetPassword.id}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ newPassword })
            });

            if (response.ok) {
                alert('Senha redefinida com sucesso!');
                setShowResetPassword(null);
                setNewPassword('');
            } else {
                const data = await response.json();
                alert(data.error || 'Erro ao redefinir senha');
            }
        } catch (error) {
            console.error('Error resetting password:', error);
            alert('Erro ao redefinir senha');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (user: User) => {
        if (!confirm(`Deseja excluir o usuário ${user.name}? Esta ação não pode ser desfeita.`)) return;

        try {
            await fetch(`${API_URL}/users/${user.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            loadUsers();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const loadLoginHistory = async (user: User) => {
        setShowLoginHistory(user);
        try {
            const response = await fetch(`${API_URL}/users/${user.id}/login-history`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setLoginHistory(data || []);
        } catch (error) {
            console.error('Error loading login history:', error);
        }
    };

    const formatDateTime = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('pt-BR');
    };

    const getRoleColor = (user: User) => {
        return user.roles?.color || '#6B7280';
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/settings/business')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Users className="w-6 h-6 text-indigo-600" />
                            </div>
                            Gestão de Usuários
                        </h1>
                        <p className="text-gray-500 mt-1">Gerenciar usuários, permissões e acessos do sistema</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/admin/settings/roles')}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Shield size={18} />
                            Gerenciar Cargos
                        </button>
                        <button
                            onClick={() => navigate('/admin/settings/users/new')}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <UserPlus size={18} />
                            Novo Usuário
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar por nome, email ou CPF..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <select
                            value={roleFilter}
                            onChange={(e) => { setRoleFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Todos os Cargos</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.name}>{role.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setPagination(p => ({ ...p, page: 1 })); }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Todos os Status</option>
                            <option value="true">Ativos</option>
                            <option value="false">Inativos</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="submit"
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            <Filter size={18} />
                            Filtrar
                        </button>
                        <button
                            type="button"
                            onClick={loadUsers}
                            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <RefreshCw size={18} />
                        </button>
                    </div>
                </form>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        Nenhum usuário encontrado
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cargo</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último Acesso</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">2FA</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                                    <span className="text-indigo-600 font-medium">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{user.name}</p>
                                                    <p className="text-sm text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span
                                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                                style={{
                                                    backgroundColor: `${getRoleColor(user)}20`,
                                                    color: getRoleColor(user)
                                                }}
                                            >
                                                {user.roles?.name || user.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatDateTime(user.last_login_at)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {user.is_active ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            {user.two_factor_enabled ? (
                                                <span className="text-green-600">✓</span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => navigate(`/admin/settings/users/${user.id}`)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setShowResetPassword(user)}
                                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
                                                    title="Resetar Senha"
                                                >
                                                    <Key size={16} />
                                                </button>
                                                <button
                                                    onClick={() => loadLoginHistory(user)}
                                                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                    title="Histórico de Login"
                                                >
                                                    <Clock size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleStatus(user)}
                                                    className={`p-1.5 rounded transition-colors ${user.is_active
                                                        ? 'text-orange-600 hover:bg-orange-50'
                                                        : 'text-green-600 hover:bg-green-50'
                                                        }`}
                                                    title={user.is_active ? 'Desativar' : 'Ativar'}
                                                >
                                                    <Power size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(user)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-600">
                                Página {pagination.page} de {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Reset Password Modal */}
            {showResetPassword && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowResetPassword(null)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Redefinir Senha</h3>
                            <button onClick={() => setShowResetPassword(null)} className="p-1 hover:bg-gray-100 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Defina uma nova senha para <strong>{showResetPassword.name}</strong>
                        </p>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Nova senha"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowResetPassword(null)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleResetPassword}
                                disabled={actionLoading || !newPassword}
                                className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                            >
                                {actionLoading ? 'Salvando...' : 'Redefinir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Login History Modal */}
            {showLoginHistory && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowLoginHistory(null)} />
                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden">
                        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">
                                Histórico de Login - {showLoginHistory.name}
                            </h3>
                            <button onClick={() => setShowLoginHistory(null)} className="p-1 hover:bg-gray-100 rounded">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh]">
                            {loginHistory.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Nenhum registro de login</p>
                            ) : (
                                <div className="space-y-3">
                                    {loginHistory.map((entry) => (
                                        <div
                                            key={entry.id}
                                            className={`p-3 rounded-lg border ${entry.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className={`font-medium ${entry.success ? 'text-green-700' : 'text-red-700'}`}>
                                                    {entry.success ? '✓ Login bem-sucedido' : '✗ Falha no login'}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {formatDateTime(entry.created_at)}
                                                </span>
                                            </div>
                                            <div className="mt-1 text-sm text-gray-600">
                                                <span>IP: {entry.ip_address || 'N/A'}</span>
                                                {entry.reason && <span className="ml-3 text-red-600">({entry.reason})</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
