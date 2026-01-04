import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, Percent, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';
import { API_URL, authFetch } from '../../services/api';
import { formatCurrency } from '../../utils/format';

interface RevenueMetrics {
    totalRevenue: number;
    previousRevenue: number;
    growthRate: number;
    grossProfit: number;
    grossProfitMargin: number;
    netProfit: number;
    netProfitMargin: number;
    totalCMV: number;
    totalExpenses: number;
    salesCount: number;
}

interface MonthlyData {
    month: string;
    revenue: number;
    count: number;
}

interface ReportData {
    period: { start: string; end: string };
    metrics: RevenueMetrics;
    monthlyData: MonthlyData[];
}

type Period = 'today' | 'week' | 'month' | 'next30' | 'custom';

export default function RevenueAnalysisReport() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ReportData | null>(null);
    const [period, setPeriod] = useState<Period>('month');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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
            const params = new URLSearchParams({ startDate, endDate });
            const response = await authFetch(`${API_URL}/reports/revenue-analysis?${params}`);
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
                        <BarChart3 className="text-emerald-600" />
                        Análise de Receita
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Receita Total, Crescimento e Margem de Lucro
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
                    {/* Main Metrics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* 1. Receita Total */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-2xl shadow-lg text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <DollarSign size={24} />
                                </div>
                                <span className="text-emerald-100 font-medium">Receita Total</span>
                            </div>
                            <h2 className="text-3xl font-bold">{formatCurrency(data.metrics.totalRevenue)}</h2>
                            <p className="text-emerald-100 text-sm mt-2">
                                {data.metrics.salesCount} vendas no período
                            </p>
                        </div>

                        {/* 2. Crescimento */}
                        <div className={`p-6 rounded-2xl shadow-lg text-white ${data.metrics.growthRate >= 0 ? 'bg-gradient-to-br from-blue-500 to-indigo-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 rounded-lg">
                                    {data.metrics.growthRate >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                </div>
                                <span className="opacity-90 font-medium">Crescimento</span>
                            </div>
                            <h2 className="text-3xl font-bold">
                                {data.metrics.growthRate >= 0 ? '+' : ''}{data.metrics.growthRate.toFixed(1)}%
                            </h2>
                            <p className="opacity-80 text-sm mt-2">
                                vs. período anterior: {formatCurrency(data.metrics.previousRevenue)}
                            </p>
                        </div>

                        {/* 3. Margem Líquida */}
                        <div className={`p-6 rounded-2xl shadow-lg text-white ${data.metrics.netProfitMargin >= 0 ? 'bg-gradient-to-br from-purple-500 to-violet-600' : 'bg-gradient-to-br from-orange-500 to-red-600'}`}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-white/20 rounded-lg">
                                    <Percent size={24} />
                                </div>
                                <span className="opacity-90 font-medium">Margem Líquida</span>
                            </div>
                            <h2 className="text-3xl font-bold">{data.metrics.netProfitMargin.toFixed(1)}%</h2>
                            <p className="opacity-80 text-sm mt-2">
                                Lucro: {formatCurrency(data.metrics.netProfit)}
                            </p>
                        </div>
                    </div>

                    {/* Detailed Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs mb-1">CMV (Custo)</p>
                            <h3 className="text-lg font-bold text-gray-800">{formatCurrency(data.metrics.totalCMV)}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs mb-1">Lucro Bruto</p>
                            <h3 className="text-lg font-bold text-emerald-600">{formatCurrency(data.metrics.grossProfit)}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs mb-1">Despesas Pagas</p>
                            <h3 className="text-lg font-bold text-red-600">{formatCurrency(data.metrics.totalExpenses)}</h3>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <p className="text-gray-500 text-xs mb-1">Margem Bruta</p>
                            <h3 className="text-lg font-bold text-gray-800">{data.metrics.grossProfitMargin.toFixed(1)}%</h3>
                        </div>
                    </div>

                    {/* Revenue Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Evolução da Receita (Últimos 6 Meses)</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data.monthlyData}>
                                    <defs>
                                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value: number) => [formatCurrency(value), 'Receita']}
                                        labelFormatter={(label) => `${label}`}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="revenue"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorRevenue)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
