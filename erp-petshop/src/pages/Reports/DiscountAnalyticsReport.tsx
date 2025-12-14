/**
 * DiscountAnalyticsReport - Relatório Analítico de Descontos
 */

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, TrendingDown, Users, Tag, Clock, Package, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface KPI {
    totalDiscount: number;
    totalSalesWithDiscount: number;
    totalSubtotal: number;
    avgTicketWithDiscount: number;
    avgTicketNoDiscount: number;
    avgDiscountPercent: number;
    discountOverRevenue: string;
}

interface OperatorData {
    id: string;
    name: string;
    saleCount: number;
    totalDiscount: number;
    totalSales: number;
    discountPercent: string;
}

interface ReasonData {
    reason: string;
    label: string;
    count: number;
    total: number;
}

interface HourlyData {
    hour: number;
    count: number;
    total: number;
}

interface GridItem {
    id: string;
    saleNumber: string;
    createdAt: string;
    subtotal: number;
    discount: number;
    discountReason: string;
    discountReasonLabel: string;
    discountPercent: string;
    total: number;
    operatorName: string;
    customerName: string;
}

interface ReportData {
    kpi: KPI;
    topOperator: { id: string; name: string; totalDiscount: number; discountPercent: number } | null;
    operators: OperatorData[];
    reasons: ReasonData[];
    hourly: HourlyData[];
    grid: GridItem[];
}

type Period = 'today' | 'week' | 'month' | 'next30' | 'custom';

export default function DiscountAnalyticsReport() {
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
        if (startDate && endDate) fetchData();
    }, [startDate, endDate]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ startDate, endDate });
            const response = await fetch(`${API_URL}/reports/discounts?${params}`);
            if (response.ok) {
                const result = await response.json();
                setData(result);
            }
        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    if (loading && !data) {
        return <div className="flex h-screen items-center justify-center">Carregando...</div>;
    }

    const maxDiscount = Math.max(...(data?.reasons.map(r => r.total) || [1]), 1);

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
                        📊 Relatório de Descontos
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Análise detalhada de descontos concedidos
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
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-xl shadow-sm p-5 border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Descontado</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatCurrency(data.kpi.totalDiscount)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        em {data.kpi.totalSalesWithDiscount} vendas
                                    </p>
                                </div>
                                <div className="bg-red-100 p-3 rounded-full">
                                    <TrendingDown className="text-red-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-5 border group relative">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        % sobre Faturamento
                                        <span className="cursor-help text-gray-400">ⓘ</span>
                                    </p>
                                    <p className="text-2xl font-bold text-amber-600">
                                        {data.kpi.discountOverRevenue}%
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Média: {data.kpi.avgDiscountPercent.toFixed(1)}% por venda
                                    </p>
                                </div>
                                <div className="bg-amber-100 p-3 rounded-full">
                                    <Tag className="text-amber-600" size={24} />
                                </div>
                            </div>
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                <p><strong>{data.kpi.discountOverRevenue}%</strong>: Total de descontos ÷ faturamento bruto (ponderado pelo valor)</p>
                                <p className="mt-1"><strong>{data.kpi.avgDiscountPercent.toFixed(1)}%</strong>: Média simples das % de desconto por venda</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-5 border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Ticket Médio c/ Desconto</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(data.kpi.avgTicketWithDiscount)}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Seria sem desconto: {formatCurrency(data.kpi.avgTicketNoDiscount)}
                                    </p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <Package className="text-blue-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-sm p-5 border">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Top Operador</p>
                                    <p className="text-xl font-bold text-purple-600 truncate max-w-[150px]">
                                        {data.topOperator?.name || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {data.topOperator?.discountPercent.toFixed(1)}% de desconto médio
                                    </p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <Users className="text-purple-600" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Por Motivo */}
                        <div className="bg-white rounded-xl shadow-sm p-5 border">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <AlertCircle size={18} className="text-amber-500" />
                                Descontos por Motivo
                            </h3>
                            <div className="space-y-3">
                                {data.reasons.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Nenhum desconto no período</p>
                                ) : (
                                    data.reasons.map((r, i) => (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="text-gray-600">{r.label}</span>
                                                <span className="font-medium">
                                                    {formatCurrency(r.total)} ({r.count}x)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-amber-400 to-orange-500 h-2 rounded-full"
                                                    style={{ width: `${(r.total / maxDiscount) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Ranking Operadores */}
                        <div className="bg-white rounded-xl shadow-sm p-5 border">
                            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Users size={18} className="text-purple-500" />
                                Ranking de Operadores
                            </h3>
                            <div className="space-y-2">
                                {data.operators.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Sem dados</p>
                                ) : (
                                    data.operators.slice(0, 5).map((op, i) => (
                                        <div
                                            key={op.id}
                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-red-100 text-red-600' :
                                                    i === 1 ? 'bg-orange-100 text-orange-600' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {i + 1}
                                                </span>
                                                <span className="font-medium">{op.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-red-600">
                                                    {op.discountPercent}%
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {formatCurrency(op.totalDiscount)}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Horário Distribution */}
                    <div className="bg-white rounded-xl shadow-sm p-5 border">
                        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Clock size={18} className="text-blue-500" />
                            Descontos por Horário
                        </h3>
                        <div className="flex items-end justify-between h-32 gap-1">
                            {Array.from({ length: 24 }, (_, hour) => {
                                const hourData = data.hourly.find(h => h.hour === hour);
                                const maxHourly = Math.max(...data.hourly.map(h => h.total), 1);
                                const height = hourData ? (hourData.total / maxHourly) * 100 : 0;
                                return (
                                    <div
                                        key={hour}
                                        className="flex-1 bg-blue-100 hover:bg-blue-200 rounded-t transition-all cursor-pointer group relative"
                                        style={{ height: `${Math.max(height, 2)}%` }}
                                        title={`${hour}h: ${hourData ? formatCurrency(hourData.total) : 'R$ 0'}`}
                                    >
                                        {hourData && hourData.total > 0 && (
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                {formatCurrency(hourData.total)}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0h</span>
                            <span>6h</span>
                            <span>12h</span>
                            <span>18h</span>
                            <span>23h</span>
                        </div>
                    </div>

                    {/* Grid Detalhado */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="p-5 border-b">
                            <h3 className="font-semibold text-gray-800">
                                📋 Vendas com Desconto (últimas 100)
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Data/Hora</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Venda</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Operador</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Cliente</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Original</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Desconto</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">%</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500">Final</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Motivo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {data.grid.map((row) => (
                                        <tr key={row.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-600">
                                                {new Date(row.createdAt).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-medium">#{row.saleNumber}</td>
                                            <td className="px-4 py-3 text-sm">{row.operatorName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">
                                                {row.customerName}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                {formatCurrency(row.subtotal)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                                                -{formatCurrency(row.discount)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right">
                                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${parseFloat(row.discountPercent) > 15
                                                    ? 'bg-red-100 text-red-700'
                                                    : parseFloat(row.discountPercent) > 10
                                                        ? 'bg-orange-100 text-orange-700'
                                                        : parseFloat(row.discountPercent) > 5
                                                            ? 'bg-amber-100 text-amber-700'
                                                            : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {row.discountPercent}%
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-semibold">
                                                {formatCurrency(row.total)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                    {row.discountReasonLabel || 'Não informado'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.grid.length === 0 && (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                                Nenhuma venda com desconto no período selecionado
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
