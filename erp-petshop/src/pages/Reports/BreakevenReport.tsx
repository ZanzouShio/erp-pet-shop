import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, DollarSign, Activity, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { API_URL } from '../../services/api';
import { formatCurrency } from '../../utils/format';

interface BreakevenData {
    revenue: number;
    variableCosts: number;
    margin: number;
    marginPercentage: number;
    opex: number;
    breakevenPoint: number;
    salesCount: number;
    fixedExpensesCount: number;
}

type Period = 'today' | 'week' | 'month' | 'next30' | 'custom';

export default function BreakevenReport() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<BreakevenData | null>(null);
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
            const response = await fetch(`${API_URL}/reports/breakeven?${params}`);
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

    // Calculations for Progress
    const progress = data ? Math.min((data.revenue / data.breakevenPoint) * 100, 100) : 0;
    const isProfitable = data ? data.revenue >= data.breakevenPoint : false;

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

            {/* Header & Filters */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="text-indigo-600" />
                        Ponto de Equilíbrio (Breakeven)
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Descubra quanto você precisa vender para cobrir seus custos fixos.
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
                    {/* Breakeven Highlight Card */}
                    <div className={`p-8 rounded-2xl shadow-lg text-white transition-all ${isProfitable ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                            <div className="text-center md:text-left">
                                <p className="text-indigo-100 font-medium mb-1">Seu Ponto de Equilíbrio é</p>
                                <h2 className="text-4xl md:text-5xl font-bold">
                                    {formatCurrency(data.breakevenPoint)}
                                </h2>
                                <p className="text-indigo-100 text-sm mt-2">
                                    Necessário para pagar {formatCurrency(data.opex)} de Custos Fixos.
                                </p>
                            </div>

                            <div className="col-span-2 space-y-4">
                                <div className="flex justify-between items-end text-sm font-medium opacity-90">
                                    <span>Faturamento Atual: {formatCurrency(data.revenue)}</span>
                                    <span>{progress.toFixed(1)}% da Meta</span>
                                </div>
                                <div className="w-full bg-black/20 rounded-full h-4 overflow-hidden relative">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${isProfitable ? 'bg-white' : 'bg-yellow-400'}`}
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                    {/* Breakeven Marker */}
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-red-400 opacity-70" style={{ left: '100%' }}></div>
                                </div>
                                <p className="text-sm opacity-80 text-center md:text-right">
                                    {isProfitable
                                        ? '🎉 Parabéns! Você já está lucrando neste período.'
                                        : `Faltam ${formatCurrency(Math.max(0, data.breakevenPoint - data.revenue))} para empatar.`
                                    }
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* 1. Revenue */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-blue-50 rounded-lg">
                                    <DollarSign className="text-blue-600" size={24} />
                                </div>
                                <span className="text-xs font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {data.salesCount} Vendas
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm">Faturamento Total</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(data.revenue)}</h3>
                        </div>

                        {/* 2. Variable Costs */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-amber-50 rounded-lg">
                                    <TrendingDown className="text-amber-600" size={24} />
                                </div>
                            </div>
                            <p className="text-gray-500 text-sm">Custos Variáveis (CMV)</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(data.variableCosts)}</h3>
                        </div>

                        {/* 3. Contribution Margin */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-emerald-50 rounded-lg">
                                    <TrendingUp className="text-emerald-600" size={24} />
                                </div>
                                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-1 rounded">
                                    {(data.marginPercentage * 100).toFixed(1)}% Margem
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm">Margem de Contribuição</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(data.margin)}</h3>
                        </div>

                        {/* 4. OPEX (Fixed Costs) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-red-50 rounded-lg">
                                    <Activity className="text-red-600" size={24} />
                                </div>
                                {data.fixedExpensesCount === 0 && (
                                    <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded flex items-center gap-1 cursor-help" title="Configure categorias como 'Fixa' em Configurações > Categorias">
                                        ! Sem Dados
                                    </span>
                                )}
                            </div>
                            <p className="text-gray-500 text-sm">Despesas Fixas</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatCurrency(data.opex)}</h3>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
