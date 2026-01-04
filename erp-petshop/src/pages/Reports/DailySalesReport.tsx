import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { API_URL, authFetch } from '../../services/api';

export default function DailySalesReport() {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        fetchReport();
    }, [date]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/reports/daily-sales?date=${date}`);
            if (!res.ok) throw new Error('Falha ao carregar relatório');
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error('Erro ao carregar relatório:', error);
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    const getPercentChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const renderTrend = (current: number, previous: number) => {
        const percent = getPercentChange(current, previous);
        if (percent === 0) return <span className="text-gray-400 flex items-center text-xs"><Minus size={12} /> 0%</span>;
        const isPositive = percent > 0;
        return (
            <span className={`flex items-center text-xs ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(percent).toFixed(1)}%
            </span>
        );
    };

    if (loading) return <div className="p-8 text-center">Carregando relatório...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Erro ao carregar dados.</div>;

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header - No Print */}
            <div className="print:hidden flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/reports')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold">Relatório de Vendas</h1>
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="border rounded-lg p-2"
                    />
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Printer size={20} /> Imprimir
                    </button>
                </div>
            </div>

            {/* Report Content */}
            <div className="max-w-4xl mx-auto space-y-8 print:w-full print:max-w-none">

                <div className="text-center border-b pb-4 mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Resumo de Vendas do Dia</h2>
                    <p className="text-gray-500 mt-1">Data de Referência: {new Date(data.date).toLocaleDateString('pt-BR')}</p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">Total de Vendas</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(data.summary.today.total)}</h3>
                        <div className="flex justify-between mt-2">
                            <span className="text-xs text-gray-500">Ontem: {formatCurrency(data.summary.yesterday.total)}</span>
                            {renderTrend(data.summary.today.total, data.summary.yesterday.total)}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">Transações</p>
                        <h3 className="text-2xl font-bold text-gray-900">{data.summary.today.count}</h3>
                        <div className="flex justify-between mt-2">
                            <span className="text-xs text-gray-500">Ontem: {data.summary.yesterday.count}</span>
                            {renderTrend(data.summary.today.count, data.summary.yesterday.count)}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <p className="text-sm text-gray-500 mb-1">Ticket Médio</p>
                        <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(data.summary.today.ticket)}</h3>
                        <div className="flex justify-between mt-2">
                            <span className="text-xs text-gray-500">Ontem: {formatCurrency(data.summary.yesterday.ticket)}</span>
                            {renderTrend(data.summary.today.ticket, data.summary.yesterday.ticket)}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-8 print:grid-cols-2">
                    {/* Top Products */}
                    <div>
                        <h3 className="font-bold text-lg mb-4 border-b pb-2">Top 10 Produtos Mais Vendidos</h3>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500">
                                    <th className="pb-2">Produto</th>
                                    <th className="pb-2 text-right">Qtd</th>
                                    <th className="pb-2 text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data.topProducts.map((p: any, i: number) => (
                                    <tr key={i}>
                                        <td className="py-2">{p.name}</td>
                                        <td className="py-2 text-right">{p.quantity}</td>
                                        <td className="py-2 text-right">{formatCurrency(p.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Payment Methods & Operators */}
                    <div className="space-y-8">
                        <div>
                            <h3 className="font-bold text-lg mb-4 border-b pb-2">Formas de Pagamento</h3>
                            <table className="w-full text-sm">
                                <tbody>
                                    {data.paymentMethods.map((pm: any, i: number) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="py-2">{pm.method}</td>
                                            <td className="py-2 text-right font-medium">{formatCurrency(pm.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div>
                            <h3 className="font-bold text-lg mb-4 border-b pb-2">Vendas por Operador</h3>
                            <table className="w-full text-sm">
                                <tbody>
                                    {data.salesByOperator.map((op: any, i: number) => (
                                        <tr key={i} className="border-b last:border-0">
                                            <td className="py-2">{op.name}</td>
                                            <td className="py-2 text-right">{op.count} vendas</td>
                                            <td className="py-2 text-right font-medium">{formatCurrency(op.total)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-400 pt-8 print:fixed print:bottom-4 print:w-full">
                    Gerado em {new Date().toLocaleString('pt-BR')} pelo ERP Pet Shop
                </div>
            </div>
        </div>
    );
}
