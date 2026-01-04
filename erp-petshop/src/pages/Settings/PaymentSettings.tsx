import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, AlertCircle, CreditCard, Smartphone } from 'lucide-react';
import { API_URL, authFetch } from '../../services/api';

interface PaymentConfig {
    id: string;
    type: 'credit_card' | 'debit_card' | 'pix';
    name: string;
    is_active: boolean;
    bank_account_id?: string;
    days_to_liquidate: number;
    receivable_mode?: 'immediate' | 'flow';
    flat_fee_percent?: number;
    max_installments?: number;
    installment_fees?: { installment: number; fee: number }[];
    bank_accounts?: { name: string; bank_name: string };
    color?: string;
}

interface BankAccount {
    id: string;
    name: string;
    bank_name: string;
    is_active: boolean;
}

export default function PaymentSettings() {
    const [configs, setConfigs] = useState<PaymentConfig[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'credit_card' | 'debit_card' | 'pix'>('credit_card');
    const [isEditing, setIsEditing] = useState(false);
    const [editingConfig, setEditingConfig] = useState<Partial<PaymentConfig>>({});
    const [error, setError] = useState('');

    useEffect(() => {
        fetchConfigs();
        fetchBankAccounts();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await authFetch(`${API_URL}/payment-config`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setConfigs(data);
            } else {
                console.error('Dados inválidos recebidos:', data);
                setConfigs([]);
            }
        } catch (error) {
            console.error('Erro ao buscar configurações:', error);
            setError('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const fetchBankAccounts = async () => {
        try {
            const res = await authFetch(`${API_URL}/financial/bank-accounts`);
            const data = await res.json();
            setBankAccounts(data);
        } catch (error) {
            console.error('Erro ao buscar contas bancárias:', error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingConfig.name) {
            setError('Nome é obrigatório');
            return;
        }

        try {
            const url = editingConfig.id
                ? `${API_URL}/payment-config/${editingConfig.id}`
                : `${API_URL}/payment-config`;

            const method = editingConfig.id ? 'PUT' : 'POST';

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...editingConfig,
                    type: activeTab
                })
            });

            if (res.ok) {
                setIsEditing(false);
                setEditingConfig({});
                fetchConfigs();
            } else {
                const err = await res.json();
                setError(err.error || 'Erro ao salvar configuração');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            setError('Erro ao salvar configuração');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta configuração?')) return;

        try {
            const res = await authFetch(`${API_URL}/payment-config/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchConfigs();
            } else {
                setError('Erro ao excluir configuração');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            setError('Erro ao excluir configuração');
        }
    };

    const startEditing = (config?: PaymentConfig) => {
        setEditingConfig(config || {
            type: activeTab,
            is_active: true,
            days_to_liquidate: 1,
            receivable_mode: 'immediate',
            flat_fee_percent: 0,
            max_installments: 1,
            installment_fees: [],
            color: '#3b82f6'
        });
        setIsEditing(true);
    };

    const filteredConfigs = configs.filter(c => c.type === activeTab);

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuração de Pagamentos</h1>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto hover:text-red-900">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('credit_card')}
                    className={`pb-3 px-4 font-medium flex items-center gap-2 ${activeTab === 'credit_card'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <CreditCard size={20} /> Crédito
                </button>
                <button
                    onClick={() => setActiveTab('debit_card')}
                    className={`pb-3 px-4 font-medium flex items-center gap-2 ${activeTab === 'debit_card'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <CreditCard size={20} /> Débito
                </button>
                <button
                    onClick={() => setActiveTab('pix')}
                    className={`pb-3 px-4 font-medium flex items-center gap-2 ${activeTab === 'pix'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    <Smartphone size={20} /> Pix
                </button>
            </div>

            {isEditing ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">
                        {editingConfig.id ? 'Editar Configuração' : 'Nova Configuração'}
                    </h2>
                    <form onSubmit={handleSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Provedor</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={editingConfig.name || ''}
                                    onChange={e => setEditingConfig({ ...editingConfig, name: e.target.value })}
                                    placeholder="Ex: Stone, Cielo, Banco X"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cor de Identificação</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        className="h-10 w-20 p-1 border rounded-lg cursor-pointer"
                                        value={editingConfig.color || '#3b82f6'}
                                        onChange={e => setEditingConfig({ ...editingConfig, color: e.target.value })}
                                    />
                                    <span className="text-sm text-gray-500">{editingConfig.color || '#3b82f6'}</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Conta Bancária de Recebimento</label>
                                <select
                                    className="w-full p-2 border rounded-lg"
                                    value={editingConfig.bank_account_id || ''}
                                    onChange={e => setEditingConfig({ ...editingConfig, bank_account_id: e.target.value })}
                                >
                                    <option value="">Selecione uma conta...</option>
                                    {bankAccounts
                                        .filter(acc => acc.is_active || acc.id === editingConfig.bank_account_id)
                                        .map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.bank_name}) {!acc.is_active && '(Inativa)'}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Dias para Recebimento (Liquidação)</label>
                                <input
                                    type="number"
                                    min="0"
                                    className="w-full p-2 border rounded-lg"
                                    value={editingConfig.days_to_liquidate ?? 1}
                                    onChange={e => setEditingConfig({ ...editingConfig, days_to_liquidate: e.target.value === '' ? 0 : parseInt(e.target.value) })}
                                />
                            </div>

                            {activeTab === 'credit_card' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo de Recebimento</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={editingConfig.receivable_mode || 'immediate'}
                                        onChange={e => setEditingConfig({ ...editingConfig, receivable_mode: e.target.value as any })}
                                    >
                                        <option value="immediate">Antecipação / Imediato (Tudo de uma vez)</option>
                                        <option value="flow">Fluxo (Receber conforme parcelas)</option>
                                    </select>
                                </div>
                            )}

                            {activeTab !== 'credit_card' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Taxa (%)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="w-full p-2 border rounded-lg"
                                        value={editingConfig.flat_fee_percent || 0}
                                        onChange={e => setEditingConfig({ ...editingConfig, flat_fee_percent: parseFloat(e.target.value) })}
                                    />
                                </div>
                            )}
                        </div>

                        {activeTab === 'credit_card' && (
                            <div className="mt-6">
                                <h3 className="font-medium text-gray-700 mb-3">Configuração de Parcelamento</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Máximo de Parcelas</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="18"
                                            className="w-full p-2 border rounded-lg"
                                            value={editingConfig.max_installments || 1}
                                            onChange={e => {
                                                const max = parseInt(e.target.value);
                                                const currentFees = editingConfig.installment_fees || [];
                                                // Adjust fees array size
                                                const newFees = Array.from({ length: max }, (_, i) => {
                                                    const existing = currentFees.find(f => f.installment === i + 1);
                                                    return existing || { installment: i + 1, fee: 0 };
                                                });
                                                setEditingConfig({
                                                    ...editingConfig,
                                                    max_installments: max,
                                                    installment_fees: newFees
                                                });
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-600 font-medium">
                                            <tr>
                                                <th className="p-3">Parcela</th>
                                                <th className="p-3">Taxa (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {(editingConfig.installment_fees || []).map((item, index) => (
                                                <tr key={index}>
                                                    <td className="p-3 font-medium">{item.installment}x</td>
                                                    <td className="p-3">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            className="w-24 p-1 border rounded"
                                                            value={item.fee}
                                                            onChange={e => {
                                                                const newFees = [...(editingConfig.installment_fees || [])];
                                                                newFees[index] = { ...item, fee: parseFloat(e.target.value) };
                                                                setEditingConfig({ ...editingConfig, installment_fees: newFees });
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => setIsEditing(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <Save size={18} /> Salvar
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <button
                            onClick={() => startEditing()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Plus size={20} /> Nova Configuração
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredConfigs.map(config => (
                            <div key={config.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 relative overflow-hidden">
                                {/* Color Strip */}
                                <div
                                    className="absolute top-0 left-0 w-1.5 h-full"
                                    style={{ backgroundColor: config.color || '#3b82f6' }}
                                />
                                <div className="flex justify-between items-start mb-4 pl-2">
                                    <div>
                                        <h3 className="font-bold text-gray-800 text-lg">{config.name}</h3>
                                        {config.bank_accounts && (
                                            <p className="text-sm text-gray-500">{config.bank_accounts.bank_name}</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => startEditing(config)}
                                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(config.id)}
                                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 text-sm text-gray-600 pl-2">
                                    <div className="flex justify-between">
                                        <span>Liquidação:</span>
                                        <span className="font-medium">{config.days_to_liquidate} dias</span>
                                    </div>

                                    {config.type === 'credit_card' ? (
                                        <div className="flex justify-between">
                                            <span>Parcelamento:</span>
                                            <span className="font-medium">Até {config.max_installments}x</span>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between">
                                            <span>Taxa:</span>
                                            <span className="font-medium">{config.flat_fee_percent}%</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
