import { useState, useEffect } from 'react';
import {
    DollarSign, CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface ReceivableTitle {
    id: string;
    description: string;
    amount: string;
    net_amount: string;
    tax_amount: string;
    due_date: string;
    status: 'pending' | 'paid' | 'overdue' | 'cancelled';
    customer_name: string;
    installment_number: number;
    total_installments: number;
    payment_method: string;
}

import { API_URL } from '../services/api';

export default function AccountsReceivable() {
    const [titles, setTitles] = useState<ReceivableTitle[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'titles' | 'customers'>('titles');

    // Filtros
    const [statusFilter, setStatusFilter] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [descriptionFilter, setDescriptionFilter] = useState('');

    // Ordenação
    const [sortConfig, setSortConfig] = useState<{ key: keyof ReceivableTitle; direction: 'asc' | 'desc' } | null>(null);

    useEffect(() => {
        loadTitles();
    }, [statusFilter, startDate, endDate]);

    const loadTitles = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);
            if (startDate) params.append('start_date', startDate);
            if (endDate) params.append('end_date', endDate);

            const response = await fetch(`${API_URL}/accounts-receivable?${params}`);
            const data = await response.json();
            setTitles(data);
        } catch (error) {
            console.error('Erro ao carregar títulos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReceive = async (id: string, description: string) => {
        if (!confirm(`Confirmar recebimento de: ${description}?`)) return;

        try {
            const response = await fetch(`${API_URL}/accounts-receivable/${id}/receive`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ payment_date: new Date() })
            });

            if (!response.ok) throw new Error('Erro ao baixar título');

            alert('Título baixado com sucesso!');
            loadTitles();
        } catch (error) {
            alert('Erro ao processar recebimento');
        }
    };

    const handleSort = (key: keyof ReceivableTitle) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'overdue': return 'bg-red-100 text-red-700';
            case 'cancelled': return 'bg-gray-100 text-gray-700';
            default: return 'bg-yellow-100 text-yellow-700';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'paid': return 'Pago';
            case 'overdue': return 'Vencido';
            case 'cancelled': return 'Cancelado';
            default: return 'Pendente';
        }
    };

    // Aplicar filtros client-side (descrição) e ordenação
    const filteredAndSortedTitles = titles
        .filter(title =>
            title.description.toLowerCase().includes(descriptionFilter.toLowerCase()) ||
            title.customer_name?.toLowerCase().includes(descriptionFilter.toLowerCase())
        )
        .sort((a, b) => {
            if (!sortConfig) return 0;

            const aValue = a[sortConfig.key];
            const bValue = b[sortConfig.key];

            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    const SortIcon = ({ column }: { column: keyof ReceivableTitle }) => {
        if (sortConfig?.key !== column) return <span className="text-gray-300 ml-1">↕</span>;
        return sortConfig.direction === 'asc' ? <span className="ml-1">↑</span> : <span className="ml-1">↓</span>;
    };

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign className="text-indigo-600" />
                        Contas a Receber
                    </h1>
                    <p className="text-gray-500">Gerencie seus recebimentos e carteira de clientes</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('titles')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'titles' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        Títulos
                    </button>
                    <button
                        onClick={() => setActiveTab('customers')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === 'customers' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                        Carteira de Clientes
                    </button>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar por Descrição/Cliente</label>
                    <input
                        type="text"
                        value={descriptionFilter}
                        onChange={(e) => setDescriptionFilter(e.target.value)}
                        placeholder="Ex: Venda #123"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                        <option value="">Todos</option>
                        <option value="pending">Pendentes</option>
                        <option value="overdue">Vencidos</option>
                        <option value="paid">Pagos</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                </div>
                <button
                    onClick={() => { setStatusFilter(''); setStartDate(''); setEndDate(''); setDescriptionFilter(''); }}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-indigo-600 font-medium"
                >
                    Limpar Filtros
                </button>
            </div>

            {/* Tabela */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 cursor-pointer select-none">
                            <tr>
                                <th onClick={() => handleSort('due_date')} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hover:bg-gray-100 transition-colors">
                                    Vencimento <SortIcon column="due_date" />
                                </th>
                                <th onClick={() => handleSort('description')} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hover:bg-gray-100 transition-colors">
                                    Descrição <SortIcon column="description" />
                                </th>
                                <th onClick={() => handleSort('customer_name')} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hover:bg-gray-100 transition-colors">
                                    Cliente <SortIcon column="customer_name" />
                                </th>
                                <th onClick={() => handleSort('amount')} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hover:bg-gray-100 transition-colors">
                                    Valor Bruto <SortIcon column="amount" />
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Taxa</th>
                                <th onClick={() => handleSort('net_amount')} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hover:bg-gray-100 transition-colors">
                                    Líquido <SortIcon column="net_amount" />
                                </th>
                                <th onClick={() => handleSort('status')} className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase hover:bg-gray-100 transition-colors">
                                    Status <SortIcon column="status" />
                                </th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Carregando...</td></tr>
                            ) : filteredAndSortedTitles.length === 0 ? (
                                <tr><td colSpan={8} className="text-center py-8 text-gray-500">Nenhum título encontrado</td></tr>
                            ) : (
                                filteredAndSortedTitles.map((title) => (
                                    <tr key={title.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {format(new Date(title.due_date), 'dd/MM/yyyy')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{title.description}</div>
                                            <div className="text-xs text-gray-500">{title.payment_method}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {title.customer_name || 'Consumidor Final'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            R$ {Number(title.amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-red-500">
                                            - R$ {Number(title.tax_amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-green-600">
                                            R$ {Number(title.net_amount).toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(title.status)}`}>
                                                {getStatusLabel(title.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {title.status !== 'paid' && title.status !== 'cancelled' && (
                                                <button
                                                    onClick={() => handleReceive(title.id, title.description)}
                                                    className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center gap-1 justify-end ml-auto"
                                                    title="Dar Baixa"
                                                >
                                                    <CheckCircle size={16} />
                                                    Baixar
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
