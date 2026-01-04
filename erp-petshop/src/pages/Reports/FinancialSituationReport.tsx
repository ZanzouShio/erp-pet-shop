import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, TrendingUp, TrendingDown, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { API_URL, authFetch } from '../../services/api';

export default function FinancialSituationReport() {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/reports/financial-situation`);
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
                    <h1 className="text-2xl font-bold">Situação Financeira</h1>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Printer size={20} /> Imprimir
                </button>
            </div>

            {/* Report Content */}
            <div className="max-w-5xl mx-auto space-y-8 print:w-full print:max-w-none">

                <div className="text-center border-b pb-4 mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Situação Financeira do Dia</h2>
                    <p className="text-gray-500 mt-1">Data de Referência: {new Date(data.date).toLocaleDateString('pt-BR')}</p>
                </div>

                {/* Hoje */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* A Pagar Hoje */}
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-red-800 flex items-center gap-2">
                                <TrendingDown size={24} /> Contas a Pagar (Hoje)
                            </h3>
                            <span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                                {data.today.payable.count} títulos
                            </span>
                        </div>
                        <p className="text-4xl font-bold text-red-900">{formatCurrency(data.today.payable.total)}</p>
                    </div>

                    {/* A Receber Hoje */}
                    <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                                <TrendingUp size={24} /> Contas a Receber (Hoje)
                            </h3>
                            <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                                {data.today.receivable.count} títulos
                            </span>
                        </div>
                        <p className="text-4xl font-bold text-green-900">{formatCurrency(data.today.receivable.total)}</p>
                    </div>
                </div>

                {/* Inadimplência / Atrasados */}
                {(data.overdue.payable.total > 0 || data.overdue.receivable.total > 0) && (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 mt-6">
                        <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2 mb-4">
                            <AlertCircle size={24} /> Pendências em Atraso (Acumulado)
                        </h3>
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <p className="text-sm text-orange-700 mb-1">A Pagar (Vencidos)</p>
                                <p className="text-2xl font-bold text-red-600">{formatCurrency(data.overdue.payable.total)}</p>
                                <p className="text-xs text-gray-500">{data.overdue.payable.count} títulos</p>
                            </div>
                            <div>
                                <p className="text-sm text-orange-700 mb-1">A Receber (Vencidos)</p>
                                <p className="text-2xl font-bold text-green-600">{formatCurrency(data.overdue.receivable.total)}</p>
                                <p className="text-xs text-gray-500">{data.overdue.receivable.count} títulos</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Previsão 7 Dias */}
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar size={24} /> Previsão Financeira (Próximos 7 Dias)
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                                <tr>
                                    <th className="py-3 px-4">Data</th>
                                    <th className="py-3 px-4 text-right text-red-600">A Pagar</th>
                                    <th className="py-3 px-4 text-right text-green-600">A Receber</th>
                                    <th className="py-3 px-4 text-right">Saldo Previsto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data.forecast.map((day: any) => {
                                    const balance = day.receivable - day.payable;
                                    return (
                                        <tr key={day.date} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium">
                                                {new Date(day.date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
                                            </td>
                                            <td className="py-3 px-4 text-right text-red-600">{formatCurrency(day.payable)}</td>
                                            <td className="py-3 px-4 text-right text-green-600">{formatCurrency(day.receivable)}</td>
                                            <td className={`py-3 px-4 text-right font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(balance)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="text-center text-xs text-gray-400 pt-8 print:fixed print:bottom-4 print:w-full">
                    Gerado em {new Date().toLocaleString('pt-BR')} pelo ERP Pet Shop
                </div>
            </div>
        </div>
    );
}
