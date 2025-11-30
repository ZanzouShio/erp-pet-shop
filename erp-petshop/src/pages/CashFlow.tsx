import { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calendar, TrendingUp, TrendingDown, DollarSign, Filter } from 'lucide-react';

import { API_URL } from '../services/api';

interface Projection {
    date: string;
    in: number;
    out: number;
    balance: number;
}

interface Transaction {
    id: string;
    type: 'in' | 'out';
    description: string;
    entity: string;
    category?: string;
    color?: string;
    amount: number;
    date: string;
    status: string;
}

type Period = 'today' | 'week' | 'month' | 'next30';

export default function CashFlow() {
    const [projections, setProjections] = useState<Projection[]>([]);
    const [currentBalance, setCurrentBalance] = useState(0);
    const [dailyView, setDailyView] = useState<Transaction[]>([]);
    const [period, setPeriod] = useState<Period>('month');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [period]);

    const getPeriodDates = () => {
        const today = new Date();
        const start = new Date();
        const end = new Date();

        switch (period) {
            case 'today':
                // Start e End são hoje
                break;
            case 'week':
                // Início da semana (Domingo) até fim da semana (Sábado)
                const day = today.getDay();
                const diff = today.getDate() - day;
                start.setDate(diff);
                end.setDate(start.getDate() + 6);
                break;
            case 'month':
                // Início do mês até fim do mês
                start.setDate(1);
                end.setMonth(end.getMonth() + 1);
                end.setDate(0);
                break;
            case 'next30':
                // Hoje até D+30
                end.setDate(today.getDate() + 30);
                break;
        }
        return { start, end };
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const { start, end } = getPeriodDates();

            const queryParams = `startDate=${start.toISOString()}&endDate=${end.toISOString()}`;

            // 1. Carregar Projeções (Gráfico)
            const projRes = await fetch(`${API_URL}/cash-flow/projections?${queryParams}`);
            const projData = await projRes.json();

            setProjections(projData.projections || []);
            setCurrentBalance(Number(projData.current_balance || 0));

            // 2. Carregar Visão Detalhada (Tabela)
            const viewRes = await fetch(`${API_URL}/cash-flow/daily-view?${queryParams}`);
            const viewData = await viewRes.json();
            setDailyView(Array.isArray(viewData) ? viewData : []);

        } catch (error) {
            console.error('Erro ao carregar fluxo de caixa:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    };

    // Calcular totais do período selecionado
    const totalIn = dailyView.filter(t => t.type === 'in').reduce((acc, curr) => acc + curr.amount, 0);
    const totalOut = dailyView.filter(t => t.type === 'out').reduce((acc, curr) => acc + curr.amount, 0);
    const periodBalance = totalIn - totalOut;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Fluxo de Caixa</h1>
                    <p className="text-gray-500">Acompanhe receitas, despesas e projeções</p>
                </div>

                {/* Filtros de Período */}
                <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                    {(['today', 'week', 'month', 'next30'] as Period[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${period === p
                                ? 'bg-blue-50 text-blue-700 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            {p === 'today' && 'Hoje'}
                            {p === 'week' && 'Esta Semana'}
                            {p === 'month' && 'Este Mês'}
                            {p === 'next30' && 'Próximos 30 Dias'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Saldo Atual (Bancos)</p>
                            <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(currentBalance)}</h3>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Receitas (Período)</p>
                            <h3 className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(totalIn)}</h3>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Despesas (Período)</p>
                            <h3 className="text-2xl font-bold text-red-600 mt-1">{formatCurrency(totalOut)}</h3>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <TrendingDown size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Resultado (Período)</p>
                            <h3 className={`text-2xl font-bold mt-1 ${periodBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrency(periodBalance)}
                            </h3>
                        </div>
                        <div className={`p-2 rounded-lg ${periodBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'}`}>
                            {periodBalance >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                        </div>
                    </div>
                </div>
            </div>

            {/* Gráfico de Receitas vs Despesas */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-4">Evolução Financeira (Receitas vs Despesas)</h2>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={projections}>
                            <defs>
                                <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#16a34a" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(val) => formatDate(val)}
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                tickFormatter={(val) => `R$ ${val}`}
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                formatter={(value: number) => formatCurrency(value)}
                                labelFormatter={(label) => formatDate(label)}
                            />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="in"
                                name="Receitas"
                                stroke="#16a34a"
                                fillOpacity={1}
                                fill="url(#colorIn)"
                                strokeWidth={2}
                            />
                            <Area
                                type="monotone"
                                dataKey="out"
                                name="Despesas"
                                stroke="#dc2626"
                                fillOpacity={1}
                                fill="url(#colorOut)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Visão Detalhada */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-800">Detalhamento de Lançamentos</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entidade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : dailyView.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum lançamento encontrado para este período.</td></tr>
                            ) : (
                                dailyView.map((item) => (
                                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                                            {formatDate(item.date)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.type === 'in' ? (
                                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                                    <TrendingUp size={12} /> Receita
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center gap-1 w-fit">
                                                    <TrendingDown size={12} /> Despesa
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{item.entity}</td>
                                        <td className="px-6 py-4">
                                            {item.category && (
                                                <span
                                                    className="px-2 py-1 rounded-md text-xs font-medium"
                                                    style={{
                                                        backgroundColor: `${item.color || '#9ca3af'}20`,
                                                        color: item.color || '#4b5563'
                                                    }}
                                                >
                                                    {item.category}
                                                </span>
                                            )}
                                        </td>
                                        <td className={`px-6 py-4 text-sm font-bold text-right ${item.type === 'in' ? 'text-green-600' : 'text-red-600'}`}>
                                            {item.type === 'in' ? '+' : '-'}{formatCurrency(item.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'paid'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {item.status === 'paid' ? 'Realizado' : 'Pendente'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
