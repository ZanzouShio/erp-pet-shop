import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, AlertTriangle, PackageX, CalendarX, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { API_URL, authFetch } from '../../services/api';

export default function StockAlertsReport() {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/reports/stock-alerts`);
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
                    <h1 className="text-2xl font-bold">Alertas de Estoque</h1>
                </div>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Printer size={20} /> Imprimir
                </button>
            </div>

            {/* Report Content */}
            <div className="max-w-6xl mx-auto space-y-8 print:w-full print:max-w-none">

                <div className="text-center border-b pb-4 mb-6">
                    <h2 className="text-3xl font-bold text-gray-900">Relatório de Alertas de Estoque</h2>
                    <p className="text-gray-500 mt-1">Gerado em: {new Date().toLocaleDateString('pt-BR')}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Estoque Baixo */}
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-orange-50 p-4 border-b border-orange-100 flex items-center gap-2">
                            <AlertTriangle className="text-orange-600" size={20} />
                            <h3 className="font-bold text-orange-900">Estoque Baixo (Abaixo do Mínimo)</h3>
                        </div>
                        <div className="p-4">
                            {data.lowStock.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500">
                                            <th className="pb-2">Produto</th>
                                            <th className="pb-2 text-right">Atual</th>
                                            <th className="pb-2 text-right">Mínimo</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.lowStock.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="py-2">{item.name}</td>
                                                <td className="py-2 text-right font-bold text-orange-600">{Number(item.stock_quantity)} {item.unit}</td>
                                                <td className="py-2 text-right text-gray-500">{Number(item.min_stock)} {item.unit}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-400 text-center py-4">Nenhum produto com estoque baixo.</p>
                            )}
                        </div>
                    </div>

                    {/* Estoque Zerado */}
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
                            <PackageX className="text-red-600" size={20} />
                            <h3 className="font-bold text-red-900">Estoque Zerado</h3>
                        </div>
                        <div className="p-4">
                            {data.outOfStock.length > 0 ? (
                                <ul className="space-y-2 text-sm">
                                    {data.outOfStock.map((item: any) => (
                                        <li key={item.id} className="flex justify-between items-center py-1 border-b last:border-0">
                                            <span>{item.name}</span>
                                            <span className="text-red-600 font-bold bg-red-100 px-2 py-0.5 rounded text-xs">Zerado</span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-center py-4">Nenhum produto com estoque zerado.</p>
                            )}
                        </div>
                    </div>

                    {/* Lotes Vencendo */}
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-yellow-50 p-4 border-b border-yellow-100 flex items-center gap-2">
                            <CalendarX className="text-yellow-600" size={20} />
                            <h3 className="font-bold text-yellow-900">Lotes Vencendo (30 dias) ou Vencidos</h3>
                        </div>
                        <div className="p-4">
                            {data.expiringBatches.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500">
                                            <th className="pb-2">Produto</th>
                                            <th className="pb-2">Lote</th>
                                            <th className="pb-2 text-right">Validade</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.expiringBatches.map((item: any) => {
                                            const isExpired = new Date(item.expiryDate) < new Date();
                                            return (
                                                <tr key={item.id}>
                                                    <td className="py-2">{item.productName}</td>
                                                    <td className="py-2 text-xs text-gray-500">{item.batchNumber}</td>
                                                    <td className={`py-2 text-right font-bold ${isExpired ? 'text-red-600' : 'text-yellow-600'}`}>
                                                        {new Date(item.expiryDate).toLocaleDateString('pt-BR')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-400 text-center py-4">Nenhum lote próximo do vencimento.</p>
                            )}
                        </div>
                    </div>

                    {/* Sem Giro */}
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
                            <Clock className="text-gray-600" size={20} />
                            <h3 className="font-bold text-gray-900">Sem Giro (&gt; 30 dias)</h3>
                        </div>
                        <div className="p-4">
                            {data.slowMoving.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500">
                                            <th className="pb-2">Produto</th>
                                            <th className="pb-2 text-right">Estoque Parado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.slowMoving.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="py-2">{item.name}</td>
                                                <td className="py-2 text-right text-gray-600">{Number(item.stock_quantity)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-400 text-center py-4">Todos os produtos com estoque tiveram saída recente.</p>
                            )}
                        </div>
                    </div>

                </div>

                <div className="text-center text-xs text-gray-400 pt-8 print:fixed print:bottom-4 print:w-full">
                    ERP Pet Shop - Módulo de Inteligência de Estoque
                </div>
            </div>
        </div>
    );
}
