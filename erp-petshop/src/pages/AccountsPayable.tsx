import { useState, useEffect } from 'react';
import { Plus, Filter, CheckCircle, AlertCircle, Clock, Search, X, CreditCard, Wallet, Banknote } from 'lucide-react';

import { API_URL } from '../services/api';

interface AccountPayable {
    id: string;
    description: string;
    amount: number;
    due_date: string;
    status: 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled';
    supplier_name?: string;
    category_name?: string;
    category_color?: string;
    total_paid: number;
    payment_date?: string;
}

import { format } from 'date-fns';

export default function AccountsPayable() {
    const [accounts, setAccounts] = useState<AccountPayable[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Filtros
    type Period = 'today' | 'week' | 'month' | 'next30' | 'custom';
    const [period, setPeriod] = useState<Period>('month');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Contas Bancárias
    const [bankAccounts, setBankAccounts] = useState<{ id: string; name: string }[]>([]);

    // Dados para o modal de criação
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([]);
    const [suppliers, setSuppliers] = useState<{ id: string, name: string }[]>([]);
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        due_date: '',
        category_id: '',
        supplier_id: '',
        notes: ''
    });

    // Dados para o modal de pagamento
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null);
    const [paymentData, setPaymentData] = useState({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        method: 'PIX',
        account_id: ''
    });
    const [processingPayment, setProcessingPayment] = useState(false);

    // Atualizar datas quando o período mudar
    useEffect(() => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (period) {
            case 'today':
                break; // Start and End are already today
            case 'week':
                const day = today.getDay();
                const diff = today.getDate() - day; // Sunday
                start.setDate(diff);
                end.setDate(start.getDate() + 6); // Saturday
                break;
            case 'month':
                start.setDate(1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month
                break;
            case 'next30':
                end.setDate(today.getDate() + 30);
                break;
            case 'custom':
                return; // Do not auto-update dates for custom
        }

        // Atualiza os estados de data (para period !== 'custom')
        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
    }, [period]);

    useEffect(() => {
        loadAccounts();
    }, [filterStatus, startDate, endDate]);

    useEffect(() => {
        loadDependencies();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filterStatus !== 'ALL') params.append('status', filterStatus);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await fetch(`${API_URL}/accounts-payable?${params}`);
            if (!response.ok) {
                throw new Error('Erro ao carregar contas');
            }
            const data = await response.json();
            setAccounts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    const loadDependencies = async () => {
        try {
            const [catRes, supRes, bankRes] = await Promise.all([
                fetch(`${API_URL}/accounts-payable/categories`),
                fetch(`${API_URL}/financial/suppliers`),
                fetch(`${API_URL}/financial/bank-accounts`)
            ]);
            if (catRes.ok) setCategories(await catRes.json());
            if (supRes.ok) setSuppliers(await supRes.json());
            if (bankRes.ok) {
                const banks = await bankRes.json();
                setBankAccounts(banks.filter((b: any) => b.is_active));
            }
        } catch (error) {
            console.error('Erro ao carregar dependências:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/accounts-payable`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Erro ao criar despesa');

            setIsModalOpen(false);
            setFormData({ description: '', amount: '', due_date: '', category_id: '', supplier_id: '', notes: '' });
            loadAccounts();
            alert('Despesa criada com sucesso!');
        } catch (error) {
            alert('Erro ao criar despesa');
        }
    };

    const handleOpenPayment = (account: AccountPayable) => {
        const remaining = Number(account.amount) - Number(account.total_paid);
        setSelectedAccount(account);
        setPaymentData({
            amount: remaining.toFixed(2),
            date: new Date().toISOString().split('T')[0],
            method: 'PIX',
            account_id: ''
        });
        setIsPaymentModalOpen(true);
    };

    const handleConfirmPayment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAccount) return;

        try {
            setProcessingPayment(true);
            const response = await fetch(`${API_URL}/accounts-payable/${selectedAccount.id}/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount_paid: Number(paymentData.amount),
                    payment_date: paymentData.date,
                    payment_method: paymentData.method,
                    account_id: paymentData.method === 'DINHEIRO' ? null : paymentData.account_id
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao processar pagamento');
            }

            alert('Pagamento registrado com sucesso!');
            setIsPaymentModalOpen(false);
            setSelectedAccount(null);
            loadAccounts();
        } catch (error: any) {
            alert(error.message || 'Erro ao registrar pagamento');
        } finally {
            setProcessingPayment(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Pago</span>;
            case 'partial': return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12} /> Parcial</span>;
            case 'overdue': return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1"><AlertCircle size={12} /> Vencido</span>;
            case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center gap-1"><Clock size={12} /> Pendente</span>;
            default: return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Cancelado</span>;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Contas a Pagar</h1>
                    <p className="text-gray-500">Gerencie suas despesas e compromissos financeiros</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                        <Filter size={20} /> Filtros
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus size={20} /> Nova Despesa
                    </button>
                </div>
            </div>

            {/* Modal de Nova Despesa */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Nova Despesa</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ex: Conta de Luz"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.amount}
                                        onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vencimento</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.due_date}
                                        onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.category_id}
                                        onChange={e => setFormData({ ...formData, category_id: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor (Opcional)</label>
                                    <select
                                        className="w-full p-2 border rounded-lg"
                                        value={formData.supplier_id}
                                        onChange={e => setFormData({ ...formData, supplier_id: e.target.value })}
                                    >
                                        <option value="">Selecione...</option>
                                        {suppliers.map(sup => (
                                            <option key={sup.id} value={sup.id}>{sup.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea
                                    className="w-full p-2 border rounded-lg"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Salvar Despesa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Pagamento */}
            {isPaymentModalOpen && selectedAccount && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Registrar Pagamento</h2>
                            <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Referente à conta</p>
                            <p className="font-medium text-gray-900">{selectedAccount.description}</p>
                            <div className="flex justify-between mt-2 text-sm">
                                <span className="text-gray-500">Valor Total:</span>
                                <span className="font-medium">{formatCurrency(selectedAccount.amount)}</span>
                            </div>
                            <div className="flex justify-between mt-1 text-sm">
                                <span className="text-gray-500">Já Pago:</span>
                                <span className="font-medium text-green-600">{formatCurrency(selectedAccount.total_paid)}</span>
                            </div>
                        </div>

                        <form onSubmit={handleConfirmPayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Valor do Pagamento (R$)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full p-2 border rounded-lg text-lg font-bold text-gray-900"
                                    value={paymentData.amount}
                                    onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                                    max={selectedAccount.amount - selectedAccount.total_paid}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data do Pagamento</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full p-2 border rounded-lg"
                                    value={paymentData.date}
                                    onChange={e => setPaymentData({ ...paymentData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
                                <div className="grid grid-cols-2 gap-2">
                                    {['PIX', 'DINHEIRO', 'CARTAO', 'BOLETO'].map(method => (
                                        <button
                                            key={method}
                                            type="button"
                                            onClick={() => setPaymentData({ ...paymentData, method })}
                                            className={`p-2 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 ${paymentData.method === method
                                                ? 'bg-blue-50 border-blue-500 text-blue-700'
                                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            {method === 'PIX' && <Banknote size={16} />}
                                            {method === 'DINHEIRO' && <Wallet size={16} />}
                                            {method === 'CARTAO' && <CreditCard size={16} />}
                                            {method}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {paymentData.method !== 'DINHEIRO' && (
                                <div className="animate-fadeIn">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Conta de Saída</label>
                                    <select
                                        required={paymentData.method !== 'DINHEIRO'}
                                        className="w-full p-2 border rounded-lg"
                                        value={paymentData.account_id}
                                        onChange={e => setPaymentData({ ...paymentData, account_id: e.target.value })}
                                    >
                                        <option value="">Selecione uma conta...</option>
                                        {bankAccounts.map(bank => (
                                            <option key={bank.id} value={bank.id}>{bank.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsPaymentModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    disabled={processingPayment}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                    disabled={processingPayment}
                                >
                                    {processingPayment ? 'Processando...' : 'Confirmar Pagamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Filtros Rápidos */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {['ALL', 'pending', 'paid', 'overdue'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${filterStatus === status
                            ? 'bg-blue-100 text-blue-800 border-blue-200 border'
                            : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                    >
                        {status === 'ALL' ? 'Todas' :
                            status === 'pending' ? 'A Vencer' :
                                status === 'paid' ? 'Pagas' : 'Vencidas'}
                    </button>
                ))}
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 justify-between items-center">
                    {/* Filtros de Data */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                            {(['today', 'week', 'month', 'next30', 'custom'] as Period[]).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p
                                        ? 'bg-white text-indigo-700 shadow-sm border border-gray-100'
                                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                        }`}
                                >
                                    {p === 'today' && 'Hoje'}
                                    {p === 'week' && 'Esta Semana'}
                                    {p === 'month' && 'Este Mês'}
                                    {p === 'next30' && 'Próx 30 Dias'}
                                    {p === 'custom' && 'Personalizado'}
                                </button>
                            ))}
                        </div>
                        {period === 'custom' && (
                            <div className="flex gap-2 items-center">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                                <span className="text-gray-400">-</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        )}
                    </div>

                    <div className="relative w-full md:w-auto">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por descrição ou fornecedor..."
                            className="w-full md:w-80 pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pago</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : accounts.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhuma conta encontrada.</td></tr>
                            ) : (
                                accounts.map((account) => (
                                    <tr key={account.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {account.due_date ? account.due_date.toString().split('T')[0].split('-').reverse().join('/') : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-medium text-gray-900">{account.description}</p>
                                            {account.supplier_name && <p className="text-xs text-gray-500">{account.supplier_name}</p>}
                                        </td>
                                        <td className="px-6 py-4">
                                            {account.category_name && (
                                                <span
                                                    className="px-2 py-1 rounded-md text-xs font-medium"
                                                    style={{
                                                        backgroundColor: `${account.category_color}20`,
                                                        color: account.category_color
                                                    }}
                                                >
                                                    {account.category_name}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                            {formatCurrency(Number(account.amount))}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {Number(account.total_paid) > 0 ? formatCurrency(Number(account.total_paid)) : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(account.status)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {account.status !== 'paid' && account.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleOpenPayment(account)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Pagar
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
