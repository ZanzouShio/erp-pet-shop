import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Shield,
    Plus,
    Edit,
    Trash2,
    Lock
} from 'lucide-react';
import { API_URL, authFetch } from '../../services/api';
import { useToast } from '../../components/Toast';

interface Role {
    id: string;
    name: string;
    description: string | null;
    permissions: string[];
    color: string;
    is_system: boolean;
    is_active: boolean;
    _count: { users: number };
}

const PERMISSION_GROUPS: Record<string, { label: string; permissions: string[] }> = {
    dashboard: { label: 'Dashboard', permissions: ['dashboard.view'] },
    pos: { label: 'PDV', permissions: ['pos.access', 'pos.sales', 'pos.discounts', 'pos.cancel_sale'] },
    cash: { label: 'Caixa', permissions: ['cash.open', 'cash.close', 'cash.sangria', 'cash.suprimento', 'cash.report'] },
    sales: { label: 'Vendas', permissions: ['sales.view', 'sales.create', 'sales.edit', 'sales.cancel'] },
    inventory: { label: 'Estoque', permissions: ['inventory.view', 'inventory.manage', 'inventory.movements'] },
    financial: { label: 'Financeiro', permissions: ['financial.view', 'financial.payable', 'financial.receivable', 'financial.cashflow', 'financial.invoices', 'financial.commissions'] },
    customers: { label: 'Clientes', permissions: ['customers.view', 'customers.create', 'customers.edit', 'customers.delete'] },
    suppliers: { label: 'Fornecedores', permissions: ['suppliers.view', 'suppliers.create', 'suppliers.edit', 'suppliers.delete'] },
    reports: { label: 'Relatórios', permissions: ['reports.view', 'reports.export'] },
    settings: { label: 'Configurações', permissions: ['settings.view', 'settings.users', 'settings.roles', 'settings.company', 'settings.payments', 'settings.invoices'] },
    grooming: { label: 'Banho & Tosa', permissions: ['grooming.view', 'grooming.schedule', 'grooming.manage'] }
};

export default function RoleList() {
    const navigate = useNavigate();
    const toast = useToast();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        color: '#6B7280',
        permissions: [] as string[]
    });

    useEffect(() => {
        loadRoles();
    }, []);

    const loadRoles = async () => {
        try {
            setLoading(true);
            const response = await authFetch(`${API_URL}/roles?includeInactive=true`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setRoles(data || []);
        } catch (error) {
            console.error('Error loading roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const seedDefaults = async () => {
        try {
            await authFetch(`${API_URL}/roles/seed`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            loadRoles();
            toast.success('Cargos padrão criados com sucesso!');
        } catch (error) {
            console.error('Error seeding roles:', error);
        }
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            color: role.color,
            permissions: role.permissions || []
        });
        setShowForm(true);
    };

    const handleNew = () => {
        setEditingRole(null);
        setFormData({
            name: '',
            description: '',
            color: '#6B7280',
            permissions: []
        });
        setShowForm(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name) {
            toast.error('Nome é obrigatório');
            return;
        }

        try {
            setSaving(true);
            const url = editingRole ? `${API_URL}/roles/${editingRole.id}` : `${API_URL}/roles`;
            const method = editingRole ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const data = await response.json();
                toast.error(data.error || 'Erro ao salvar cargo');
                return;
            }

            setShowForm(false);
            loadRoles();
        } catch (error) {
            console.error('Error saving role:', error);
            toast.error('Erro ao salvar cargo');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (role: Role) => {
        if (!confirm(`Deseja excluir o cargo "${role.name}"?`)) return;

        try {
            await authFetch(`${API_URL}/roles/${role.id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            loadRoles();
        } catch (error) {
            console.error('Error deleting role:', error);
        }
    };

    const togglePermission = (permission: string) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permission)
                ? prev.permissions.filter(p => p !== permission)
                : [...prev.permissions, permission]
        }));
    };

    const toggleGroup = (group: string) => {
        const groupPerms = PERMISSION_GROUPS[group].permissions;
        const allSelected = groupPerms.every(p => formData.permissions.includes(p));

        setFormData(prev => ({
            ...prev,
            permissions: allSelected
                ? prev.permissions.filter(p => !groupPerms.includes(p))
                : [...new Set([...prev.permissions, ...groupPerms])]
        }));
    };

    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#14B8A6'];

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/settings/users')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar para Usuários</span>
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Shield className="w-6 h-6 text-purple-600" />
                            </div>
                            Gestão de Cargos
                        </h1>
                        <p className="text-gray-500 mt-1">Configure cargos e permissões do sistema</p>
                    </div>
                    <div className="flex items-center gap-3">
                        {roles.length === 0 && (
                            <button
                                onClick={seedDefaults}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Criar Cargos Padrão
                            </button>
                        )}
                        <button
                            onClick={handleNew}
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                        >
                            <Plus size={18} />
                            Novo Cargo
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Role List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <h3 className="font-medium text-gray-900">Cargos Cadastrados</h3>
                        </div>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                            </div>
                        ) : roles.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                Nenhum cargo cadastrado
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {roles.map(role => (
                                    <div
                                        key={role.id}
                                        className={`p-4 hover:bg-gray-50 ${!role.is_active ? 'opacity-50' : ''}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: role.color }}
                                                />
                                                <div>
                                                    <p className="font-medium text-gray-900 flex items-center gap-2">
                                                        {role.name}
                                                        {role.is_system && (
                                                            <Lock size={12} className="text-gray-400" />
                                                        )}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {role._count.users} usuário(s)
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleEdit(role)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {!role.is_system && (
                                                    <button
                                                        onClick={() => handleDelete(role)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {role.description && (
                                            <p className="text-sm text-gray-500 mt-2">{role.description}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form / Permissions */}
                <div className="lg:col-span-2">
                    {showForm ? (
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                {editingRole ? 'Editar Cargo' : 'Novo Cargo'}
                            </h3>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Nome do cargo"
                                        disabled={editingRole?.is_system}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                                    <div className="flex gap-2">
                                        {colors.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, color })}
                                                className={`w-8 h-8 rounded-lg ${formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                                style={{ backgroundColor: color }}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        placeholder="Descrição do cargo"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="font-medium text-gray-900 mb-4">Permissões</h4>
                                <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                    {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
                                        const allSelected = group.permissions.every(p => formData.permissions.includes(p));
                                        const someSelected = group.permissions.some(p => formData.permissions.includes(p));

                                        return (
                                            <div key={key} className="border border-gray-200 rounded-lg p-3">
                                                <label className="flex items-center gap-2 cursor-pointer mb-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={allSelected}
                                                        ref={el => { if (el) el.indeterminate = someSelected && !allSelected; }}
                                                        onChange={() => toggleGroup(key)}
                                                        className="w-4 h-4 text-purple-600 rounded"
                                                    />
                                                    <span className="font-medium text-gray-900">{group.label}</span>
                                                </label>
                                                <div className="pl-6 space-y-1">
                                                    {group.permissions.map(perm => (
                                                        <label key={perm} className="flex items-center gap-2 cursor-pointer text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissions.includes(perm)}
                                                                onChange={() => togglePermission(perm)}
                                                                className="w-3 h-3 text-purple-600 rounded"
                                                            />
                                                            <span className="text-gray-600">{perm.split('.')[1]}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {saving ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">Selecione um cargo para editar ou crie um novo</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
