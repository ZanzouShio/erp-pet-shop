import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    DollarSign,
    Calendar,
    Clock,
    User,
    Monitor,
    TrendingUp,
    TrendingDown,
    Filter,
    RefreshCw,
    Eye,
    Printer,
    CheckCircle,
    XCircle,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { API_URL, authFetch } from '../../services/api';

interface CashRegister {
    id: string;
    terminal_id: string;
    user_id: string;
    opened_at: string;
    closed_at: string | null;
    opening_balance: number;
    closing_balance: number | null;
    expected_balance: number | null;
    difference: number | null;
    status: 'open' | 'closed';
    notes: string | null;
    users: { id: string; name: string };
    pdv_terminals: { id: string; name: string };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export default function CashRegisterList() {
    const navigate = useNavigate();
    const [registers, setRegisters] = useState<CashRegister[]>([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });

    // Filters
    const [status, setStatus] = useState<string>('');
    const [startDate, setStartDate] = useState(() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Report Modal
    const [selectedRegister, setSelectedRegister] = useState<CashRegister | null>(null);
    const [reportData, setReportData] = useState<any>(null);
    const [showReport, setShowReport] = useState(false);
    const [loadingReport, setLoadingReport] = useState(false);

    useEffect(() => {
        loadRegisters();
    }, [pagination.page, status, startDate, endDate]);

    const loadRegisters = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.append('page', pagination.page.toString());
            params.append('limit', '20');
            if (status) params.append('status', status);
            if (startDate) params.append('startDate', startDate);
            if (endDate) params.append('endDate', endDate);

            const response = await authFetch(`${API_URL}/cash-registers?${params}`);
            const data = await response.json();

            setRegisters(data.registers || []);
            setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
        } catch (error) {
            console.error('Error loading cash registers:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadReport = async (register: CashRegister) => {
        try {
            setLoadingReport(true);
            setSelectedRegister(register);
            setShowReport(true);

            const response = await authFetch(`${API_URL}/cash-registers/${register.id}/report`);
            const data = await response.json();
            setReportData(data);
        } catch (error) {
            console.error('Error loading report:', error);
        } finally {
            setLoadingReport(false);
        }
    };

    const formatCurrency = (value: number | null) => {
        if (value === null) return '-';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDateTime = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('pt-BR');
    };

    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('pt-BR');
    };

    const handlePrintReport = () => {
        if (!reportData) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Relatório de Caixa</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 5mm; line-height: 1.4; }
                        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                        .header h1 { font-size: 14px; margin-bottom: 5px; }
                        .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
                        .row { display: flex; justify-content: space-between; margin: 4px 0; }
                        .section-title { font-weight: bold; margin-top: 10px; margin-bottom: 5px; text-transform: uppercase; }
                        .total-row { font-weight: bold; font-size: 14px; margin-top: 10px; }
                        .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>RELATÓRIO DE CAIXA</h1>
                        <div>${reportData.register?.terminalName || 'Terminal'}</div>
                    </div>
                    <div class="divider"></div>
                    <div class="row"><span>Operador(a):</span><span>${reportData.register?.operatorName || '-'}</span></div>
                    <div class="row"><span>Abertura:</span><span>${formatDateTime(reportData.register?.openedAt)}</span></div>
                    <div class="row"><span>Fechamento:</span><span>${formatDateTime(reportData.register?.closedAt)}</span></div>
                    <div class="divider"></div>
                    <div class="section-title">RESUMO FINANCEIRO</div>
                    <div class="row"><span>Saldo Inicial</span><span>${formatCurrency(reportData.summary?.opening)}</span></div>
                    <div class="row"><span>Suprimentos</span><span>${formatCurrency(reportData.summary?.suprimentos)}</span></div>
                    <div class="row"><span>Vendas em Dinheiro</span><span>${formatCurrency(reportData.summary?.sales?.cash)}</span></div>
                    <div class="row"><span>Sangrias</span><span>${formatCurrency(reportData.summary?.sangrias)}</span></div>
                    <div class="divider"></div>
                    <div class="section-title">VENDAS POR FORMA</div>
                    <div class="row"><span>Dinheiro</span><span>${formatCurrency(reportData.summary?.sales?.cash)}</span></div>
                    <div class="row"><span>Débito</span><span>${formatCurrency(reportData.summary?.sales?.debit_card)}</span></div>
                    <div class="row"><span>Crédito</span><span>${formatCurrency(reportData.summary?.sales?.credit_card)}</span></div>
                    <div class="row"><span>PIX</span><span>${formatCurrency(reportData.summary?.sales?.pix)}</span></div>
                    <div class="row total-row"><span>TOTAL VENDAS</span><span>${formatCurrency(reportData.summary?.sales?.total)}</span></div>
                    <div class="divider"></div>
                    <div class="row total-row"><span>SALDO ESPERADO</span><span>${formatCurrency(reportData.summary?.expected)}</span></div>
                    <div class="row total-row"><span>SALDO CONFERIDO</span><span>${formatCurrency(reportData.summary?.closing)}</span></div>
                    <div class="row total-row"><span>DIFERENÇA</span><span>${formatCurrency(reportData.summary?.difference)}</span></div>
                    <div class="footer">
                        <div class="divider"></div>
                        ERP Pet Shop<br/>${new Date().toLocaleString('pt-BR')}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    // Summary calculations
    const totalOpened = registers.filter(r => r.status === 'open').length;
    const totalClosed = registers.filter(r => r.status === 'closed').length;
    const totalDifference = registers.reduce((sum, r) => sum + (Number(r.difference) || 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate('/admin/financial/cash-flow')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                >
                    <ArrowLeft size={20} />
                    <span>Voltar</span>
                </button>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <DollarSign className="w-6 h-6 text-indigo-600" />
                            </div>
                            Controle de Caixa
                        </h1>
                        <p className="text-gray-500 mt-1">Histórico de aberturas e fechamentos de caixa</p>
                    </div>
                    <button
                        onClick={loadRegisters}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <RefreshCw size={18} />
                        Atualizar
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Monitor className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total de Sessões</p>
                            <p className="text-xl font-bold text-gray-900">{pagination.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Caixas Abertos</p>
                            <p className="text-xl font-bold text-green-600">{totalOpened}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                            <XCircle className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Caixas Fechados</p>
                            <p className="text-xl font-bold text-gray-600">{totalClosed}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${totalDifference >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                            {totalDifference >= 0 ? (
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                            ) : (
                                <TrendingDown className="w-5 h-5 text-red-600" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Diferença Total</p>
                            <p className={`text-xl font-bold ${totalDifference >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                {formatCurrency(totalDifference)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={18} className="text-gray-500" />
                    <span className="font-medium text-gray-700">Filtros</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value="">Todos</option>
                            <option value="open">Aberto</option>
                            <option value="closed">Fechado</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : registers.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        Nenhum registro de caixa encontrado
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terminal</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operador</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abertura</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fechamento</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Inicial</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Saldo Final</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Diferença</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {registers.map((register) => (
                                    <tr key={register.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Monitor size={16} className="text-gray-400" />
                                                <span className="font-medium text-gray-900">
                                                    {register.pdv_terminals?.name || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <User size={16} className="text-gray-400" />
                                                <span className="text-gray-700">{register.users?.name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-600">
                                                    {formatDateTime(register.opened_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-gray-400" />
                                                <span className="text-sm text-gray-600">
                                                    {formatDateTime(register.closed_at)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                                            {formatCurrency(Number(register.opening_balance))}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                                            {formatCurrency(register.closing_balance !== null ? Number(register.closing_balance) : null)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {register.difference !== null ? (
                                                <span className={`font-medium ${Number(register.difference) > 0 ? 'text-blue-600' :
                                                        Number(register.difference) < 0 ? 'text-red-600' : 'text-green-600'
                                                    }`}>
                                                    {Number(register.difference) > 0 ? '+' : ''}
                                                    {formatCurrency(Number(register.difference))}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${register.status === 'open'
                                                    ? 'bg-green-100 text-green-700'
                                                    : 'bg-gray-100 text-gray-700'
                                                }`}>
                                                {register.status === 'open' ? (
                                                    <><CheckCircle size={12} /> Aberto</>
                                                ) : (
                                                    <><XCircle size={12} /> Fechado</>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => loadReport(register)}
                                                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                                    title="Ver Relatório"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                                disabled={pagination.page <= 1}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="px-3 py-1 text-sm text-gray-600">
                                Página {pagination.page} de {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                                disabled={pagination.page >= pagination.totalPages}
                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Report Modal */}
            {showReport && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setShowReport(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Relatório de Caixa</h3>
                                    <p className="text-indigo-100 text-sm">
                                        {selectedRegister?.pdv_terminals?.name} • {formatDate(selectedRegister?.opened_at || null)}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrintReport}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                        title="Imprimir"
                                    >
                                        <Printer className="w-5 h-5 text-white" />
                                    </button>
                                    <button
                                        onClick={() => setShowReport(false)}
                                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <XCircle className="w-5 h-5 text-white" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {loadingReport ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                </div>
                            ) : reportData ? (
                                <div className="space-y-6">
                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1">Operador</p>
                                            <p className="font-medium text-gray-900">{reportData.register?.operatorName || '-'}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1">Abertura</p>
                                            <p className="font-medium text-gray-900 text-sm">{formatDateTime(reportData.register?.openedAt)}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1">Fechamento</p>
                                            <p className="font-medium text-gray-900 text-sm">{formatDateTime(reportData.register?.closedAt)}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-3">
                                            <p className="text-xs text-gray-500 mb-1">Status</p>
                                            <p className={`font-medium ${reportData.register?.status === 'open' ? 'text-green-600' : 'text-gray-600'}`}>
                                                {reportData.register?.status === 'open' ? 'Aberto' : 'Fechado'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Financial Summary */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="font-medium text-gray-700 mb-4">Resumo Financeiro</h4>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-gray-600">Saldo Inicial</span>
                                                <span className="font-medium">{formatCurrency(reportData.summary?.opening)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-gray-600 flex items-center gap-2">
                                                    <TrendingUp size={16} className="text-green-500" /> Suprimentos
                                                </span>
                                                <span className="text-green-600 font-medium">+ {formatCurrency(reportData.summary?.suprimentos)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-gray-600 flex items-center gap-2">
                                                    <TrendingUp size={16} className="text-blue-500" /> Vendas em Dinheiro
                                                </span>
                                                <span className="text-blue-600 font-medium">+ {formatCurrency(reportData.summary?.sales?.cash)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-gray-200">
                                                <span className="text-gray-600 flex items-center gap-2">
                                                    <TrendingDown size={16} className="text-amber-500" /> Sangrias
                                                </span>
                                                <span className="text-amber-600 font-medium">- {formatCurrency(reportData.summary?.sangrias)}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-3 bg-indigo-50 rounded-lg px-3 mt-2">
                                                <span className="font-medium text-indigo-900">Saldo Esperado</span>
                                                <span className="font-bold text-lg text-indigo-600">{formatCurrency(reportData.summary?.expected)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sales by Method */}
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="font-medium text-gray-700 mb-4">Vendas por Forma de Pagamento</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                                                <p className="text-lg font-bold text-emerald-600">{formatCurrency(reportData.summary?.sales?.cash)}</p>
                                                <p className="text-xs text-gray-500">Dinheiro</p>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                                                <p className="text-lg font-bold text-purple-600">{formatCurrency(reportData.summary?.sales?.debit_card)}</p>
                                                <p className="text-xs text-gray-500">Débito</p>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                                                <p className="text-lg font-bold text-blue-600">{formatCurrency(reportData.summary?.sales?.credit_card)}</p>
                                                <p className="text-xs text-gray-500">Crédito</p>
                                            </div>
                                            <div className="text-center p-3 bg-white rounded-lg border border-gray-200">
                                                <p className="text-lg font-bold text-cyan-600">{formatCurrency(reportData.summary?.sales?.pix)}</p>
                                                <p className="text-xs text-gray-500">PIX</p>
                                            </div>
                                            <div className="text-center p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                                                <p className="text-lg font-bold text-indigo-600">{formatCurrency(reportData.summary?.sales?.total)}</p>
                                                <p className="text-xs text-gray-500">Total</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Closing Info (if closed) */}
                                    {reportData.register?.status === 'closed' && (
                                        <div className={`rounded-xl p-4 ${Math.abs(reportData.summary?.difference || 0) < 0.01
                                                ? 'bg-green-50 border border-green-200'
                                                : reportData.summary?.difference > 0
                                                    ? 'bg-blue-50 border border-blue-200'
                                                    : 'bg-red-50 border border-red-200'
                                            }`}>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm text-gray-600">Saldo Conferido</p>
                                                    <p className="font-bold text-lg">{formatCurrency(reportData.summary?.closing)}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600">Diferença</p>
                                                    <p className={`font-bold text-lg ${Math.abs(reportData.summary?.difference || 0) < 0.01
                                                            ? 'text-green-600'
                                                            : reportData.summary?.difference > 0
                                                                ? 'text-blue-600'
                                                                : 'text-red-600'
                                                        }`}>
                                                        {Math.abs(reportData.summary?.difference || 0) < 0.01
                                                            ? 'Conferido ✓'
                                                            : formatCurrency(reportData.summary?.difference)
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    Erro ao carregar relatório
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
