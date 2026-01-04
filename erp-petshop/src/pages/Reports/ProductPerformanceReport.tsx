import { useState, useEffect } from 'react';
import { Printer, ArrowLeft, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { API_URL, authFetch } from '../../services/api';

export default function ProductPerformanceReport() {
    const navigate = useNavigate();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/reports/product-performance`);
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

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header - No Print */}
            <div className="print:hidden flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/reports')} className="p-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold">Performance de Produtos</h1>
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
                    <h2 className="text-3xl font-bold text-gray-900">Performance de Produtos</h2>
                    <p className="text-gray-500 mt-1">
                        Período: {new Date(data.period.start).toLocaleDateString('pt-BR')} até {new Date(data.period.end).toLocaleDateString('pt-BR')}
                    </p>
                </div>

                {/* Top Vendas (Curva ABC Simplificada) */}
                <div className="border rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-blue-50 p-4 border-b border-blue-100 flex items-center gap-2">
                        <DollarSign className="text-blue-600" size={20} />
                        <h3 className="font-bold text-blue-900">Top Produtos Vendidos (Últimos 30 dias)</h3>
                    </div>
                    <div className="p-4 overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b">
                                    <th className="pb-2">Produto</th>
                                    <th className="pb-2 text-right">Qtd</th>
                                    <th className="pb-2 text-right">Receita</th>
                                    <th className="pb-2 text-right">Lucro Est.</th>
                                    <th className="pb-2 text-right">Margem Real</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {data.topSelling.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="py-2 font-medium">{item.name}</td>
                                        <td className="py-2 text-right">{item.quantity}</td>
                                        <td className="py-2 text-right text-blue-600 font-bold">{formatCurrency(item.revenue)}</td>
                                        <td className="py-2 text-right text-green-600">{formatCurrency(item.profit)}</td>
                                        <td className="py-2 text-right">{item.margin}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* Melhores Margens */}
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-green-50 p-4 border-b border-green-100 flex items-center gap-2">
                            <TrendingUp className="text-green-600" size={20} />
                            <h3 className="font-bold text-green-900">Melhores Margens (Cadastro)</h3>
                        </div>
                        <div className="p-4">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-500">
                                        <th className="pb-2">Produto</th>
                                        <th className="pb-2 text-right">Custo</th>
                                        <th className="pb-2 text-right">Venda</th>
                                        <th className="pb-2 text-right">Margem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {data.bestMargins.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="py-2">{item.name}</td>
                                            <td className="py-2 text-right text-gray-500">{formatCurrency(item.costPrice)}</td>
                                            <td className="py-2 text-right">{formatCurrency(item.salePrice)}</td>
                                            <td className="py-2 text-right font-bold text-green-600">{item.margin}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Margens Baixas */}
                    <div className="border rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-red-50 p-4 border-b border-red-100 flex items-center gap-2">
                            <TrendingDown className="text-red-600" size={20} />
                            <h3 className="font-bold text-red-900">Margens Baixas (&lt; 30%)</h3>
                        </div>
                        <div className="p-4">
                            {data.lowMargins.length > 0 ? (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-gray-500">
                                            <th className="pb-2">Produto</th>
                                            <th className="pb-2 text-right">Custo</th>
                                            <th className="pb-2 text-right">Venda</th>
                                            <th className="pb-2 text-right">Margem</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.lowMargins.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="py-2">{item.name}</td>
                                                <td className="py-2 text-right text-gray-500">{formatCurrency(item.costPrice)}</td>
                                                <td className="py-2 text-right">{formatCurrency(item.salePrice)}</td>
                                                <td className="py-2 text-right font-bold text-red-600">{item.margin}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-gray-400 text-center py-4">Nenhum produto com margem abaixo de 30%.</p>
                            )}
                        </div>
                    </div>

                </div>

                <div className="text-center text-xs text-gray-400 pt-8 print:fixed print:bottom-4 print:w-full">
                    ERP Pet Shop - Módulo de Inteligência de Vendas
                </div>
            </div>
        </div>
    );
}
