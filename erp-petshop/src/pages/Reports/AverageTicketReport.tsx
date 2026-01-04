import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Calendar, BarChart2 } from 'lucide-react';
import { format } from 'date-fns';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { API_URL, authFetch } from '../../services/api';
import { formatCurrency } from '../../utils/format';

interface GeneralMetrics {
    revenue: number;
    salesCount: number;
    averageTicket: number;
    previousTicket: number;
    variation: number;
}

interface DayOfWeekData {
    day: string;
    dayIndex: number;
    count: number;
    revenue: number;
    ticket: number;
}

interface CategoryData {
    name: string;
    revenue: number;
    itemCount: number;
    ticketPerItem: number;
}

interface ReportData {
    period: { start: string; end: string };
    general: GeneralMetrics;
    byDayOfWeek: DayOfWeekData[];
    byCategory: CategoryData[];
}

type Period = 'today' | 'week' | 'month' | 'next30' | 'custom';

export default function AverageTicketReport() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportData | null>(null);
    const [period, setPeriod] = useState<Period>('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Update dates when period changes
    useEffect(() => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (period) {
            case 'today':
                break;
            case 'week':
                const day = today.getDay();
                const diff = today.getDate() - day;
                start.setDate(diff);
                end.setDate(start.getDate() + 6);
                break;
            case 'month':
                start.setDate(1);
                end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                break;
            case 'next30':
                end.setDate(today.getDate() + 30);
                break;
            case 'custom':
                return;
        }

        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
    }, [period]);

    useEffect(() => {
        if (startDate && endDate) loadData();
    }, [startDate, endDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate,
                endDate
            });
            const response = await authFetch(`${API_URL}/reports/average-ticket?${params}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error('Erro ao carregar relatório:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !data) return <div className="flex h-screen items-center justify-center">Carregando...</div>;

    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/admin/reports')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Voltar para Relatórios</span>
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <DollarSign className="text-blue-600" />
                        Ticket Médio
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Análise do valor médio por transação
                    </p>
                </div>
            </div>

            {/* Period Filter */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
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
                </div>

                {period === 'custom' && (
                    <>
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
                    </>
                )}
            </div>

            {data && (
                <>
                    {/* Main Ticket Card */}
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 rounded-2xl shadow-lg text-white">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                            <div className="text-center md:text-left">
                                <p className="text-blue-100 font-medium mb-1">Ticket Médio Atual</p>
                                <h2 className="text-4xl md:text-5xl font-bold">
                                    {formatCurrency(data.general.averageTicket)}
                                </h2>
                                <p className="text-blue-100 text-sm mt-2">
                                    Baseado em {data.general.salesCount} vendas
                                </p>
                            </div>

                            <div className="text-center">
                                <p className="text-blue-100 font-medium mb-1">Período Anterior</p>
                                <h3 className="text-2xl font-bold">
                                    {formatCurrency(data.general.previousTicket)}
                                </h3>
                            </div>

                            <div className="text-center md:text-right">
                                <p className="text-blue-100 font-medium mb-1">Variação</p>
                                <div className={`flex items-center justify-center md:justify-end gap-2 text-3xl font-bold ${data.general.variation >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                    {data.general.variation >= 0 ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
                                    {data.general.variation >= 0 ? '+' : ''}{data.general.variation.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <DollarSign className="text-blue-600" size={24} />
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm">Receita Total</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(data.general.revenue)}</h3>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-green-50 rounded-lg">
                                    <BarChart2 className="text-green-600" size={24} />
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm">Total de Vendas</p>
                            <h3 className="text-2xl font-bold text-gray-800">{data.general.salesCount}</h3>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-purple-50 rounded-lg">
                                    <Calendar className="text-purple-600" size={24} />
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm">Melhor Dia</p>
                            <h3 className="text-2xl font-bold text-gray-800">
                                {data.byDayOfWeek.reduce((best, day) => day.ticket > best.ticket ? day : best, data.byDayOfWeek[0]).day}
                            </h3>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* By Day of Week */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Ticket Médio por Dia da Semana</h3>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.byDayOfWeek}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                        <YAxis tickFormatter={(value) => `R$${value}`} />
                                        <Tooltip
                                            formatter={(value: number) => [formatCurrency(value), 'Ticket Médio']}
                                            labelFormatter={(label) => `${label}`}
                                        />
                                        <Bar dataKey="ticket" name="Ticket Médio" radius={[4, 4, 0, 0]}>
                                            {data.byDayOfWeek.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* By Category */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Ticket por Categoria</h3>
                            <div className="space-y-3">
                                {data.byCategory.map((cat, index) => (
                                    <div key={cat.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                            />
                                            <span className="font-medium text-gray-700">{cat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-800">{formatCurrency(cat.ticketPerItem)}/item</p>
                                            <p className="text-xs text-gray-500">{cat.itemCount} itens • {formatCurrency(cat.revenue)}</p>
                                        </div>
                                    </div>
                                ))}
                                {data.byCategory.length === 0 && (
                                    <p className="text-gray-400 text-center py-4">Nenhuma categoria encontrada</p>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
