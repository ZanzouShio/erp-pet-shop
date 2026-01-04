import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { API_URL, authFetch } from '../../services/api';

export default function CashPositionReport() {
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
            const res = await authFetch(`${API_URL}/reports/cash-position?date=${date}`);
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
                    <h1 className="text-2xl font-bold">Posição de Caixa</h1>
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
                    <h2 className="text-3xl font-bold text-gray-900">Posição de Caixa Diária</h2>
                    <p className="text-gray-500 mt-1">Data de Referência: {new Date(data.date).toLocaleDateString('pt-BR')}</p>
                </div>

                {/* Saldo Atual Geral */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
                    <p className="text-blue-600 font-medium mb-2">Saldo Atual em Contas (Todas)</p>
                    <h3 className="text-4xl font-bold text-blue-900">{formatCurrency(data.currentBalance)}</h3>
                    <p className="text-xs text-blue-400 mt-2">*Saldo acumulado real no momento da geração</p>
                </div>

                {/* Movimentação do Dia */}
                <h3 className="font-bold text-lg border-b pb-2 mt-8">Movimentação do Dia ({new Date(data.date).toLocaleDateString('pt-BR')})</h3>
                <div className="grid grid-cols-3 gap-6">
                    <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                        <div className="flex items-center gap-2 mb-2 text-green-700">
                            <TrendingUp size={20} />
                            <span className="font-medium">Entradas</span>
                        </div>
                        <h3 className="text-2xl font-bold text-green-900">{formatCurrency(data.daySummary.inflows)}</h3>
                    </div>
                    <div className="p-4 bg-red-50 rounded-xl border border-red-200">
                        <div className="flex items-center gap-2 mb-2 text-red-700">
                            <TrendingDown size={20} />
                            <span className="font-medium">Saídas</span>
                        </div>
                        <h3 className="text-2xl font-bold text-red-900">{formatCurrency(data.daySummary.outflows)}</h3>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="flex items-center gap-2 mb-2 text-gray-700">
                            <DollarSign size={20} />
                            <span className="font-medium">Resultado do Dia</span>
                        </div>
                        <h3 className={`text-2xl font-bold ${data.daySummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(data.daySummary.balance)}
                        </h3>
                    </div>
                </div>

                {/* Detalhamento de Entradas */}
                <div className="mt-8">
                    <h3 className="font-bold text-lg mb-4 border-b pb-2">Entradas por Forma de Pagamento</h3>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b">
                                <th className="pb-2">Forma de Pagamento</th>
                                <th className="pb-2 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {data.paymentMethods.length > 0 ? (
                                data.paymentMethods.map((pm: any, i: number) => (
                                    <tr key={i}>
                                        <td className="py-3">{pm.method}</td>
                                        <td className="py-3 text-right font-medium">{formatCurrency(pm.total)}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={2} className="py-4 text-center text-gray-400">Nenhuma entrada registrada nesta data.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="text-center text-xs text-gray-400 pt-8 print:fixed print:bottom-4 print:w-full">
                    Gerado em {new Date().toLocaleString('pt-BR')} pelo ERP Pet Shop
                </div>
            </div>
        </div>
    );
}
