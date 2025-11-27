import { TrendingUp, Users, Package, Calendar, ArrowUpRight } from 'lucide-react';
import { useEffect, useState } from 'react';

const API_URL = 'http://localhost:3001/api';

interface DashboardMetrics {
    salesToday: { value: number; change: number };
    newCustomers: { value: number; trend: string };
    lowStock: { value: number };
    appointments: { value: number };
}

interface Sale {
    id: string;
    sale_number: number;
    final_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
}

export default function Dashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics>({
        salesToday: { value: 0, change: 0 },
        newCustomers: { value: 32, trend: 'Neste mês' },
        lowStock: { value: 0 },
        appointments: { value: 12 },
    });
    const [recentSales, setRecentSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Buscar vendas de hoje
            const today = new Date().toISOString().split('T')[0];
            const salesResponse = await fetch(`${API_URL}/sales?startDate=${today}&endDate=${today}&limit=5`);
            const salesData = await salesResponse.json();

            // Calcular total de vendas hoje
            const todayTotal = salesData.sales.reduce((sum: number, sale: Sale) => {
                if (sale.status === 'completed') {
                    return sum + parseFloat(String(sale.final_amount));
                }
                return sum;
            }, 0);

            // Buscar produtos com estoque baixo
            const lowStockResponse = await fetch(`${API_URL}/products/low-stock`);
            const lowStockData = await lowStockResponse.json();

            setMetrics({
                salesToday: { value: todayTotal, change: 0 },
                newCustomers: { value: 32, trend: 'Neste mês' },
                lowStock: { value: lowStockData.length || 0 },
                appointments: { value: 12 },
            });

            setRecentSales(salesData.sales || []);
        } catch (error) {
            console.error('Erro ao carregar dados do dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const paymentMethodLabels: Record<string, string> = {
        CASH: 'Dinheiro',
        DEBIT_CARD: 'Débito',
        CREDIT_CARD: 'Crédito',
        PIX: 'PIX'
    };

    const topProducts = [
        { name: 'Ração Premium Cães Adultos', sold: 120, revenue: 180.00 },
        { name: 'Brinquedo de Corda', sold: 95, revenue: 25.00 },
        { name: 'Areia Higiênica 4kg', sold: 88, revenue: 22.00 },
        { name: 'Antipulgas Advantage 4ml', sold: 71, revenue: 58.00 },
    ];

    return (
        <div className="p-8 space-y-6">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Sales Today */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Vendas Hoje</p>
                            <h3 className="text-3xl font-bold text-gray-900">
                                R$ {metrics.salesToday.value.toFixed(2)}
                            </h3>
                        </div>
                        <div className="bg-green-100 p-3 rounded-lg">
                            <TrendingUp className="text-green-600" size={24} />
                        </div>
                    </div>
                    <div className="flex items-center gap-1 text-green-600 text-sm">
                        <ArrowUpRight size={16} />
                        <span>+{metrics.salesToday.change}% vs ontem</span>
                    </div>
                </div>

                {/* New Customers */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Novos Clientes</p>
                            <h3 className="text-3xl font-bold text-gray-900">{metrics.newCustomers.value}</h3>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Users className="text-blue-600" size={24} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">{metrics.newCustomers.trend}</p>
                </div>

                {/* Low Stock */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Itens em Estoque Baixo</p>
                            <h3 className="text-3xl font-bold text-gray-900">{metrics.lowStock.value}</h3>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-lg">
                            <Package className="text-orange-600" size={24} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">Requer atenção</p>
                </div>

                {/* Appointments */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-500 text-sm mb-1">Agendamentos</p>
                            <h3 className="text-3xl font-bold text-gray-900">{metrics.appointments.value}</h3>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <Calendar className="text-purple-600" size={24} />
                        </div>
                    </div>
                    <p className="text-gray-500 text-sm">Para hoje</p>
                </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Sales */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800">Vendas Recentes (Hoje)</h2>
                    </div>
                    {loading ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500">Carregando vendas...</p>
                        </div>
                    ) : recentSales.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-500">Nenhuma venda registrada hoje</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nº Venda</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hora</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {recentSales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">#{sale.sale_number}</td>
                                            <td className="px-6 py-4 text-sm text-gray-500">{formatDate(sale.created_at)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {paymentMethodLabels[sale.payment_method] || sale.payment_method}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {formatCurrency(parseFloat(String(sale.final_amount)))}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${sale.status === 'completed' ? 'bg-green-100 text-green-700' :
                                                        sale.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                            'bg-red-100 text-red-700'
                                                    }`}>
                                                    {sale.status === 'completed' ? 'Concluída' :
                                                        sale.status === 'cancelled' ? 'Cancelada' : sale.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Top Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h2 className="text-lg font-bold text-gray-800">Produtos Mais Vendidos</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        {topProducts.map((product, index) => (
                            <div key={index} className="flex items-start gap-3">
                                <div className="bg-gray-100 p-2 rounded-lg">
                                    <Package size={20} className="text-gray-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 text-sm truncate">{product.name}</p>
                                    <p className="text-xs text-gray-500">{product.sold} vendidos</p>
                                </div>
                                <p className="font-bold text-sm text-gray-900">R$ {product.revenue.toFixed(2)}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
