import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, Building2 } from 'lucide-react';
import { API_URL } from '../../services/api';

interface BankAccount {
    id: string;
    name: string;
    bank_name: string;
    bank_code: string;
    agency: string;
    account_number: string;
    account_type: string;
    initial_balance: number;
    current_balance: number;
    pix_enabled: boolean;
    pix_key: string;
    is_active: boolean;
}

const BankAccountSettings: React.FC = () => {
    const [accounts, setAccounts] = useState<BankAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<BankAccount>>({
        name: '',
        bank_name: '',
        bank_code: '',
        agency: '',
        account_number: '',
        account_type: 'checking',
        initial_balance: 0,
        pix_enabled: false,
        pix_key: '',
        is_active: true
    });

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await fetch(`${API_URL}/bank-accounts`);
            const data = await response.json();
            setAccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro ao buscar contas:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const url = editingId
                ? `${API_URL}/bank-accounts/${editingId}`
                : `${API_URL}/bank-accounts`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                fetchAccounts();
                setShowForm(false);
                setEditingId(null);
                setFormData({
                    name: '',
                    bank_name: '',
                    bank_code: '',
                    agency: '',
                    account_number: '',
                    account_type: 'checking',
                    initial_balance: 0,
                    pix_enabled: false,
                    pix_key: '',
                    is_active: true
                });
            }
        } catch (error) {
            console.error('Erro ao salvar conta:', error);
        }
    };

    const handleEdit = (account: BankAccount) => {
        setFormData(account);
        setEditingId(account.id);
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Tem certeza que deseja excluir esta conta?')) return;

        try {
            const response = await fetch(`${API_URL}/bank-accounts/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchAccounts();
            } else {
                const error = await response.json();
                alert(error.error || 'Erro ao excluir conta');
            }
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Building2 className="w-8 h-8 text-blue-600" />
                    Contas Bancárias
                </h1>
                <button
                    onClick={() => {
                        setEditingId(null);
                        setFormData({
                            name: '',
                            bank_name: '',
                            bank_code: '',
                            agency: '',
                            account_number: '',
                            account_type: 'checking',
                            initial_balance: 0,
                            pix_enabled: false,
                            pix_key: '',
                            is_active: true
                        });
                        setShowForm(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <Plus size={20} />
                    Nova Conta
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {editingId ? 'Editar Conta' : 'Nova Conta Bancária'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Apelido da Conta *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                        placeholder="Ex: Itaú Principal"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Banco *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.bank_name}
                                        onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                        placeholder="Ex: Banco Itaú"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Código do Banco</label>
                                    <input
                                        type="text"
                                        value={formData.bank_code || ''}
                                        onChange={e => setFormData({ ...formData, bank_code: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                        placeholder="Ex: 341"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Conta</label>
                                    <select
                                        value={formData.account_type}
                                        onChange={e => setFormData({ ...formData, account_type: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    >
                                        <option value="checking">Conta Corrente</option>
                                        <option value="savings">Conta Poupança</option>
                                        <option value="investment">Conta Investimento</option>
                                        <option value="cash">Caixa Interno</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                                    <input
                                        type="text"
                                        value={formData.agency || ''}
                                        onChange={e => setFormData({ ...formData, agency: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Número da Conta</label>
                                    <input
                                        type="text"
                                        value={formData.account_number || ''}
                                        onChange={e => setFormData({ ...formData, account_number: e.target.value })}
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status da Conta</label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={formData.is_active}
                                            onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                        />
                                        <label htmlFor="is_active" className="text-sm text-gray-700">
                                            {formData.is_active ? 'Conta Ativa' : 'Conta Inativa'}
                                        </label>
                                    </div>
                                </div>
                                {!editingId && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial (R$)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.initial_balance}
                                            onChange={e => setFormData({ ...formData, initial_balance: parseFloat(e.target.value) })}
                                            className="w-full border rounded-lg p-2"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="border-t pt-4 mt-4">
                                <h3 className="font-medium mb-3">Configurações Pix</h3>
                                <div className="flex items-center gap-2 mb-3">
                                    <input
                                        type="checkbox"
                                        id="pix_enabled"
                                        checked={formData.pix_enabled}
                                        onChange={e => setFormData({ ...formData, pix_enabled: e.target.checked })}
                                        className="w-4 h-4 text-blue-600"
                                    />
                                    <label htmlFor="pix_enabled" className="text-sm text-gray-700">Habilitar recebimento via Pix nesta conta</label>
                                </div>

                                {formData.pix_enabled && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Chave Pix</label>
                                        <input
                                            type="text"
                                            value={formData.pix_key || ''}
                                            onChange={e => setFormData({ ...formData, pix_key: e.target.value })}
                                            className="w-full border rounded-lg p-2"
                                            placeholder="CPF, CNPJ, Email, Telefone ou Chave Aleatória"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowForm(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                                >
                                    <Save size={20} />
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Conta</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Banco</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agência / Conta</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo Atual</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pix</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Carregando...</td>
                            </tr>
                        ) : accounts.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Nenhuma conta cadastrada</td>
                            </tr>
                        ) : (
                            accounts.map((account) => (
                                <tr key={account.id} className={`hover:bg-gray-50 ${!account.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="font-medium text-gray-900">{account.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {account.account_type === 'checking' ? 'Conta Corrente' :
                                                account.account_type === 'savings' ? 'Poupança' :
                                                    account.account_type === 'investment' ? 'Investimento' : 'Caixa'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {account.bank_name}
                                        {account.bank_code && <span className="ml-1 text-xs">({account.bank_code})</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {account.agency && <span>Ag: {account.agency}</span>}
                                        {account.agency && account.account_number && <span className="mx-1">/</span>}
                                        {account.account_number && <span>CC: {account.account_number}</span>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        R$ {Number(account.current_balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {account.is_active ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Ativa
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                Inativa
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {account.pix_enabled ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                Pix Ativo
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                -
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEdit(account)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                            title="Editar"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(account.id)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BankAccountSettings;
