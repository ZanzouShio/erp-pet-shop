import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Save,
    User,
    Mail,
    Phone,
    CreditCard,
    Shield,
    Scissors
} from 'lucide-react';
import { API_URL, authFetch } from '../../services/api';
import { useToast } from '../../components/Toast';

interface Role {
    id: string;
    name: string;
    description: string | null;
    color: string;
}

interface UserFormData {
    name: string;
    email: string;
    password: string;
    cpf: string;
    phone: string;
    role_id: string;
    is_groomer: boolean;
    seniority_level: string;
    commission_rate: number;
}

export default function UserForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const toast = useToast();
    const isEditing = !!id;

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [roles, setRoles] = useState<Role[]>([]);
    const [formData, setFormData] = useState<UserFormData>({
        name: '',
        email: '',
        password: '',
        cpf: '',
        phone: '',
        role_id: '',
        is_groomer: false,
        seniority_level: '',
        commission_rate: 0
    });

    useEffect(() => {
        loadRoles();
        if (isEditing) {
            loadUser();
        }
    }, [id]);

    const loadRoles = async () => {
        try {
            const response = await authFetch(`${API_URL}/roles`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const data = await response.json();
            setRoles(data || []);
        } catch (error) {
            console.error('Error loading roles:', error);
        }
    };

    const loadUser = async () => {
        try {
            setLoading(true);
            const response = await authFetch(`${API_URL}/users/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            const user = await response.json();

            setFormData({
                name: user.name || '',
                email: user.email || '',
                password: '',
                cpf: user.cpf || '',
                phone: user.phone || '',
                role_id: user.role_id || '',
                is_groomer: user.is_groomer || false,
                seniority_level: user.seniority_level || '',
                commission_rate: user.commission_rate ? parseFloat(user.commission_rate) : 0
            });
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            toast.error('Nome e email são obrigatórios');
            return;
        }

        if (!isEditing && !formData.password) {
            toast.error('Senha é obrigatória para novos usuários');
            return;
        }

        try {
            setSaving(true);

            const payload: any = {
                name: formData.name,
                email: formData.email,
                cpf: formData.cpf || null,
                phone: formData.phone || null,
                role_id: formData.role_id || null,
                is_groomer: formData.is_groomer,
                seniority_level: formData.is_groomer ? formData.seniority_level : null,
                commission_rate: formData.is_groomer ? formData.commission_rate : 0
            };

            if (!isEditing) {
                payload.password = formData.password;
            }

            const url = isEditing ? `${API_URL}/users/${id}` : `${API_URL}/users`;
            const method = isEditing ? 'PUT' : 'POST';

            const response = await authFetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const data = await response.json();
                toast.error(data.error || 'Erro ao salvar usuário');
                return;
            }

            navigate('/admin/settings/users');
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error('Erro ao salvar usuário');
        } finally {
            setSaving(false);
        }
    };

    const formatCPF = (value: string) => {
        const numbers = value.replace(/\D/g, '').slice(0, 11);
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
        if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
        return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;
    };

    const formatPhone = (value: string) => {
        const numbers = value.replace(/\D/g, '').slice(0, 11);
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/settings/users')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {isEditing ? 'Editar Usuário' : 'Novo Usuário'}
                </h1>
                <p className="text-gray-500 mt-1">
                    {isEditing ? 'Altere os dados do usuário' : 'Preencha os dados para criar um novo usuário'}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-2xl">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome Completo *
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Nome do usuário"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="email@exemplo.com"
                                    required
                                />
                            </div>
                        </div>

                        {!isEditing && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Senha *
                                </label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="••••••••"
                                    required={!isEditing}
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                CPF
                            </label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={formData.cpf}
                                    onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="000.000.000-00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefone
                            </label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Role */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Shield className="inline w-4 h-4 mr-1" />
                            Cargo / Permissões
                        </label>
                        <select
                            value={formData.role_id}
                            onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Selecione um cargo</option>
                            {roles.map(role => (
                                <option key={role.id} value={role.id}>
                                    {role.name} {role.description ? `- ${role.description}` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Groomer Section */}
                    <div className="border-t border-gray-100 pt-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.is_groomer}
                                onChange={(e) => setFormData({ ...formData, is_groomer: e.target.checked })}
                                className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <div className="flex items-center gap-2">
                                <Scissors className="text-purple-600" size={18} />
                                <span className="font-medium text-gray-900">Este usuário é um Groomer (Tosador/Banhista)</span>
                            </div>
                        </label>

                        {formData.is_groomer && (
                            <div className="mt-4 grid grid-cols-2 gap-4 pl-8">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nível de Senioridade
                                    </label>
                                    <select
                                        value={formData.seniority_level}
                                        onChange={(e) => setFormData({ ...formData, seniority_level: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="">Selecione</option>
                                        <option value="junior">Júnior</option>
                                        <option value="mid">Pleno</option>
                                        <option value="senior">Sênior</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Taxa de Comissão (%)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="100"
                                        value={formData.commission_rate}
                                        onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/settings/users')}
                        className="flex-1 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        <Save size={18} />
                        {saving ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Usuário')}
                    </button>
                </div>
            </form>
        </div>
    );
}
