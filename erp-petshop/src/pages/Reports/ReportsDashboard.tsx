import { FileText, DollarSign, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ReportsDashboard() {
    const navigate = useNavigate();

    const reports = [
        {
            id: 'daily-sales',
            title: 'Resumo de Vendas do Dia',
            description: 'Total de vendas, ticket médio, top produtos e comparativos.',
            icon: <FileText size={32} className="text-blue-600" />,
            color: 'bg-blue-50 border-blue-200 hover:border-blue-400'
        },
        {
            id: 'cash-position',
            title: 'Posição de Caixa',
            description: 'Saldo inicial, entradas, saídas e fechamento de caixa.',
            icon: <DollarSign size={32} className="text-green-600" />,
            color: 'bg-green-50 border-green-200 hover:border-green-400'
        },
        {
            id: 'financial-situation',
            title: 'Situação Financeira',
            description: 'Contas a pagar/receber hoje e previsão para 7 dias.',
            icon: <TrendingUp size={32} className="text-purple-600" />,
            color: 'bg-purple-50 border-purple-200 hover:border-purple-400'
        },
        {
            id: 'stock-alerts',
            title: 'Alertas de Estoque',
            description: 'Produtos com estoque baixo, zerado ou vencidos.',
            icon: <AlertTriangle size={32} className="text-orange-600" />,
            color: 'bg-orange-50 border-orange-200 hover:border-orange-400'
        },
        {
            id: 'product-performance',
            title: 'Performance de Produtos',
            description: 'Curva ABC, margens e produtos com maior giro.',
            icon: <Package size={32} className="text-indigo-600" />,
            color: 'bg-indigo-50 border-indigo-200 hover:border-indigo-400'
        },
        {
            id: 'payment-fees',
            title: 'Taxas de Pagamento',
            description: 'Análise de taxas por operador e parcelas.',
            icon: <DollarSign size={32} className="text-red-600" />,
            color: 'bg-red-50 border-red-200 hover:border-red-400'
        }
    ];

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-800">Relatórios Gerenciais</h1>
                <p className="text-gray-500">Selecione um relatório para visualizar e imprimir.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports.map(report => (
                    <div
                        key={report.id}
                        onClick={() => navigate(`/admin/reports/${report.id}`)}
                        className={`p-6 rounded-xl border cursor-pointer transition-all shadow-sm hover:shadow-md ${report.color}`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="p-3 bg-white rounded-lg shadow-sm">
                                {report.icon}
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">{report.title}</h3>
                        <p className="text-sm text-gray-600">{report.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
