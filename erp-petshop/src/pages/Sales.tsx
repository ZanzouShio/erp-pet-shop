import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Calendar, DollarSign } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

interface Sale {
    id: string;
    sale_number: number;
    subtotal: number;
    discount_amount: number;
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    item_count: number;
}

type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const paymentMethodLabels: Record<string, string> = {
    CASH: 'Dinheiro',
    DEBIT_CARD: 'Débito',
    CREDIT_CARD: 'Crédito',
    PIX: 'PIX'
};

export default function Sales() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(false);
    const [total, setTotal] = useState(0);

    // Filtros
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<string>('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadSales();
    }, [dateFilter, startDate, endDate, paymentMethod, searchTerm]);

    const getDateRange = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const formatDate = (date: Date) => {
            return date.toISOString().split('T')[0];
        };

        switch (dateFilter) {
            case 'today':
                return {
                    startDate: formatDate(today),
                    endDate: formatDate(today)
                };
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return {
                    startDate: formatDate(yesterday),
                    endDate: formatDate(yesterday)
                };
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return {
                    startDate: formatDate(weekAgo),
                    endDate: formatDate(today)
                };
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setDate(monthAgo.getDate() - 30);
                return {
                    startDate: formatDate(monthAgo),
                    endDate: formatDate(today)
                };
            case 'custom':
                return { startDate, endDate };
            default:
                return { startDate: '', endDate: '' };
        }
    };

    const loadSales = async () => {
        try {
            setLoading(true);
            const { startDate: start, endDate: end } = getDateRange();

            const params = new URLSearchParams();
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);
            if (paymentMethod !== 'ALL') params.append('paymentMethod', paymentMethod);
            if (searchTerm) params.append('search', searchTerm);
            params.append('limit', '50');
            params.append('offset', '0');

            const response = await fetch(`${API_URL}/sales?${params}`);
            const data = await response.json();

            // Backend retorna array direto, não objeto {sales: [...]}
            const salesArray = Array.isArray(data) ? data : [];
            setSales(salesArray);
            setTotal(salesArray.length);
            setHasMore(false);
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getStatusBadge = (status: string) => {
        if (status === 'completed') {
            return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Concluída</span>;
        } else if (status === 'cancelled') {
            return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Cancelada</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
        }
    };

    // Calcular total do dia
    const totalToday = sales.reduce((sum, sale) => {
        if (sale.status === 'completed') {
            return sum + parseFloat(String(sale.total_amount));
        }
        return sum;
    }, 0);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Histórico de Vendas</h1>
                    <p className="text-gray-500 mt-1">Visualize e gerencie todas as vendas realizadas</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Total do Período</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalToday)}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Filtro de Data */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar size={16} className="inline mr-1" />
                            Período
                        </label>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="today">Hoje</option>
                            <option value="yesterday">Ontem</option>
                            <option value="week">Últimos 7 dias</option>
                            <option value="month">Últimos 30 dias</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>

                    {/* Data Custom */}
                    {dateFilter === 'custom' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </>
                    )}

                    {/* Forma de Pagamento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <DollarSign size={16} className="inline mr-1" />
                            Pagamento
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="ALL">Todas</option>
                            <option value="CASH">Dinheiro</option>
                            <option value="DEBIT_CARD">Débito</option>
                            <option value="CREDIT_CARD">Crédito</option>
                            <option value="PIX">PIX</option>
                        </select>
                    </div>

                    {/* Busca */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Search size={16} className="inline mr-1" />
                            Buscar Nº Venda
                        </label>
                        <input
                            type="text"
                            placeholder="Digite o número..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Tabela de Vendas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Filter size={48} className="text-gray-400 mx-auto mb-4 animate-pulse" />
                            <p className="text-gray-500">Carregando vendas...</p>
                        </div>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Filter size={48} className="text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma venda encontrada</p>
                            <p className="text-gray-400 text-sm mt-2">Tente ajustar os filtros</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nº Venda
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Data/Hora
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Pagamento
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {sales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-medium text-gray-900">#{sale.sale_number}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(sale.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {sale.item_count} {sale.item_count === 1 ? 'item' : 'itens'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {paymentMethodLabels[sale.payment_method] || sale.payment_method}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-medium text-gray-900">
                                                    {formatCurrency(parseFloat(String(sale.total_amount)))}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(sale.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => alert(`Ver detalhes da venda #${sale.sale_number} - Em desenvolvimento`)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Eye size={16} />
                                                    Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer com info de paginação */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Mostrando {sales.length} de {total} vendas
                            </div>
                            {hasMore && (
                                <button
                                    onClick={() => alert('Paginação em desenvolvimento')}
                                    className="px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                >
                                    Carregar mais
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
