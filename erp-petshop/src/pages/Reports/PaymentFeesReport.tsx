import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import {
    DollarSign, Filter, Download, CreditCard,
    Percent, ArrowLeft
} from 'lucide-react';

interface PaymentFeeData {
    operatorId: string;
    operatorName: string;
    paymentType: string;
    installments: number;
    totalGross: number;
    totalNet: number;
    totalFees: number;
    count: number;
}

interface OperatorSummary {
    name: string;
    totalGross: number;
    totalFees: number;
    avgFeePercent: number;
    color?: string;
    [key: string]: string | number | undefined; // Index signature for Recharts
}

interface ReportResponse {
    period: { start: string; end: string };
    details: PaymentFeeData[];
    summary: OperatorSummary[];
}

const PaymentFeesReport: React.FC = () => {
    const navigate = useNavigate();
    const [startDate, setStartDate] = useState(
        new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(
        new Date().toISOString().split('T')[0]
    );
    const [data, setData] = useState<ReportResponse | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:3001/api/reports/payment-fees?startDate=${startDate}&endDate=${endDate}`);
            if (!response.ok) throw new Error('Falha ao carregar relatório');
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(value / 100);
    };

    return (
        <div className="space-y-6 p-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/admin/reports')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Voltar para Relatórios</span>
            </button>

            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800">Relatório de Taxas de Pagamento</h1>
            </div>

            {/* Filtros */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Data Inicial</label>
                        <input
                            type="date"
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Data Final</label>
                        <input
                            type="date"
                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={fetchReport}
                        disabled={loading}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 disabled:opacity-50"
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Filtrar
                    </button>
                    <button
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 h-10 px-4 py-2 ml-auto"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                    </button>
                </div>
            </div>

            {data && (
                <>
                    {/* Cards de Resumo (Storytelling: Bruto -> Taxas -> Líquido -> Média) */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* 1. Vendas Brutas */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="text-sm font-medium text-gray-500">Vendas Brutas</h3>
                                <CreditCard className="h-4 w-4 text-blue-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(data.summary.reduce((acc, curr) => acc + curr.totalGross, 0))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Total transacionado
                                </p>
                            </div>
                        </div>

                        {/* 2. Total de Taxas */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="text-sm font-medium text-gray-500">Total de Taxas</h3>
                                <DollarSign className="h-4 w-4 text-red-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-red-600">
                                    {formatCurrency(data.summary.reduce((acc, curr) => acc + curr.totalFees, 0))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Custo total com taxas
                                </p>
                            </div>
                        </div>

                        {/* 3. Total Líquido (Novo) */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="text-sm font-medium text-gray-500">Total Líquido</h3>
                                <DollarSign className="h-4 w-4 text-green-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-green-600">
                                    {formatCurrency(data.summary.reduce((acc, curr) => acc + (curr.totalGross - curr.totalFees), 0))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Valor real a receber
                                </p>
                            </div>
                        </div>

                        {/* 4. Taxa Média Global */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <h3 className="text-sm font-medium text-gray-500">Taxa Média Global</h3>
                                <Percent className="h-4 w-4 text-yellow-500" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-yellow-600">
                                    {(() => {
                                        const totalFees = data.summary.reduce((acc, curr) => acc + curr.totalFees, 0);
                                        const totalGross = data.summary.reduce((acc, curr) => acc + curr.totalGross, 0);
                                        return totalGross > 0 ? formatPercent((totalFees / totalGross) * 100) : '0%';
                                    })()}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Impacto médio nas vendas
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Taxas por Operador</h3>
                                <p className="text-sm text-gray-500">Comparativo de valor pago em taxas</p>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data.summary}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis />
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                        <Bar dataKey="totalFees" name="Total Taxas (R$)">
                                            {data.summary.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || '#ef4444'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                            <div className="mb-4">
                                <h3 className="text-lg font-bold text-gray-800">Distribuição de Vendas</h3>
                                <p className="text-sm text-gray-500">Volume transacionado por operador</p>
                            </div>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data.summary}
                                            dataKey="totalGross"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={80}
                                            label={(entry) => entry.name}
                                        >
                                            {data.summary.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Tabela Detalhada */}
                    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-bold text-gray-800">Detalhamento por Parcelas</h3>
                            <p className="text-sm text-gray-500">
                                Análise detalhada de taxas por operador e quantidade de parcelas
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                                    <tr>
                                        <th className="px-6 py-3">Operador</th>
                                        <th className="px-6 py-3">Tipo</th>
                                        <th className="px-6 py-3 text-center">Parcelas</th>
                                        <th className="px-6 py-3 text-right">Qtd. Vendas</th>
                                        <th className="px-6 py-3 text-right">Venda Bruta</th>
                                        <th className="px-6 py-3 text-right text-red-600">Taxas Pagas</th>
                                        <th className="px-6 py-3 text-right text-green-600">Venda Líquida</th>
                                        <th className="px-6 py-3 text-right">% Taxa Real</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {data.details.map((row, index) => (
                                        <tr key={`${row.operatorId}-${row.installments}-${index}`} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium">{row.operatorName}</td>
                                            <td className="px-6 py-4">
                                                {row.paymentType === 'credit_card' ? 'Crédito' :
                                                    row.paymentType === 'debit_card' ? 'Débito' :
                                                        row.paymentType === 'pix' ? 'Pix' : row.paymentType}
                                            </td>
                                            <td className="px-6 py-4 text-center">{row.installments}x</td>
                                            <td className="px-6 py-4 text-right">{row.count}</td>
                                            <td className="px-6 py-4 text-right">{formatCurrency(row.totalGross)}</td>
                                            <td className="px-6 py-4 text-right text-red-600 font-medium">
                                                {formatCurrency(row.totalFees)}
                                            </td>
                                            <td className="px-6 py-4 text-right text-green-600">
                                                {formatCurrency(row.totalNet)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {row.totalGross > 0
                                                    ? formatPercent((row.totalFees / row.totalGross) * 100)
                                                    : '0%'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default PaymentFeesReport;
