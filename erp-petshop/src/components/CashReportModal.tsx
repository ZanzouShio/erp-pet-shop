import React from 'react';
import { X, FileText, DollarSign, TrendingUp, TrendingDown, Clock, User, Printer } from 'lucide-react';

interface CashReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    report: any;
    isLoading?: boolean;
}

const CashReportModal: React.FC<CashReportModalProps> = ({
    isOpen,
    onClose,
    report,
    isLoading = false
}) => {
    if (!isOpen) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value || 0);
    };

    const formatDateTime = (date: string) => {
        if (!date) return '-';
        return new Date(date).toLocaleString('pt-BR');
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'opening': 'Abertura',
            'closing': 'Fechamento',
            'sangria': 'Sangria',
            'suprimento': 'Suprimento',
            'sale_cash': 'Venda (Dinheiro)'
        };
        return labels[type] || type;
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'opening': 'bg-green-500/20 text-green-400',
            'closing': 'bg-red-500/20 text-red-400',
            'sangria': 'bg-amber-500/20 text-amber-400',
            'suprimento': 'bg-blue-500/20 text-blue-400',
            'sale_cash': 'bg-emerald-500/20 text-emerald-400'
        };
        return colors[type] || 'bg-slate-500/20 text-slate-400';
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Relatório do Caixa</h2>
                                <p className="text-purple-100 text-sm">
                                    {report?.register?.terminalName || 'Terminal'} - {report?.register?.status === 'open' ? 'Aberto' : 'Fechado'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => window.print()}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Imprimir"
                            >
                                <Printer className="w-5 h-5 text-white" />
                            </button>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                        </div>
                    ) : report ? (
                        <>
                            {/* Info Cards */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                        <User className="w-4 h-4" />
                                        Operador
                                    </div>
                                    <div className="text-white font-medium">{report.register?.operatorName || '-'}</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                        <Clock className="w-4 h-4" />
                                        Abertura
                                    </div>
                                    <div className="text-white font-medium text-sm">{formatDateTime(report.register?.openedAt)}</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                        <Clock className="w-4 h-4" />
                                        Fechamento
                                    </div>
                                    <div className="text-white font-medium text-sm">{formatDateTime(report.register?.closedAt)}</div>
                                </div>
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700">
                                    <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
                                        <DollarSign className="w-4 h-4" />
                                        Status
                                    </div>
                                    <div className={`font-medium ${report.register?.status === 'open' ? 'text-green-400' : 'text-slate-400'}`}>
                                        {report.register?.status === 'open' ? 'Aberto' : 'Fechado'}
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                                <h3 className="text-lg font-semibold text-white mb-4">Resumo Financeiro</h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                        <span className="text-slate-300 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                            Saldo Inicial
                                        </span>
                                        <span className="text-white font-medium">{formatCurrency(report.summary?.opening)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                        <span className="text-slate-300 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-blue-400" />
                                            Suprimentos
                                        </span>
                                        <span className="text-blue-400 font-medium">+ {formatCurrency(report.summary?.suprimentos)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                        <span className="text-slate-300 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                                            Vendas em Dinheiro
                                        </span>
                                        <span className="text-emerald-400 font-medium">+ {formatCurrency(report.summary?.sales?.cash)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                        <span className="text-slate-300 flex items-center gap-2">
                                            <TrendingDown className="w-4 h-4 text-amber-400" />
                                            Sangrias
                                        </span>
                                        <span className="text-amber-400 font-medium">- {formatCurrency(report.summary?.sangrias)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 bg-slate-800/50 rounded-lg px-3 -mx-3 mt-4">
                                        <span className="text-white font-medium">Saldo Esperado</span>
                                        <span className="text-white font-bold text-lg">{formatCurrency(report.summary?.expected)}</span>
                                    </div>
                                    {report.register?.status === 'closed' && (
                                        <>
                                            <div className="flex justify-between items-center py-2">
                                                <span className="text-slate-300">Saldo Conferido</span>
                                                <span className="text-white font-medium">{formatCurrency(report.summary?.closing)}</span>
                                            </div>
                                            <div className={`flex justify-between items-center py-3 rounded-lg px-3 -mx-3 ${Math.abs(report.summary?.difference || 0) < 0.01
                                                    ? 'bg-green-500/10 border border-green-500/30'
                                                    : report.summary?.difference > 0
                                                        ? 'bg-blue-500/10 border border-blue-500/30'
                                                        : 'bg-red-500/10 border border-red-500/30'
                                                }`}>
                                                <span className={`font-medium ${Math.abs(report.summary?.difference || 0) < 0.01 ? 'text-green-400' : report.summary?.difference > 0 ? 'text-blue-400' : 'text-red-400'
                                                    }`}>
                                                    {Math.abs(report.summary?.difference || 0) < 0.01 ? 'Caixa OK ✓' : report.summary?.difference > 0 ? 'Sobra' : 'Falta'}
                                                </span>
                                                <span className={`font-bold text-lg ${Math.abs(report.summary?.difference || 0) < 0.01 ? 'text-green-400' : report.summary?.difference > 0 ? 'text-blue-400' : 'text-red-400'
                                                    }`}>
                                                    {formatCurrency(Math.abs(report.summary?.difference || 0))}
                                                </span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Sales by Payment Method */}
                            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                                <h3 className="text-lg font-semibold text-white mb-4">Vendas por Forma de Pagamento</h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                        <div className="text-2xl font-bold text-emerald-400">{formatCurrency(report.summary?.sales?.cash)}</div>
                                        <div className="text-xs text-slate-400 mt-1">Dinheiro</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-400">{formatCurrency(report.summary?.sales?.credit_card)}</div>
                                        <div className="text-xs text-slate-400 mt-1">Crédito</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                        <div className="text-2xl font-bold text-purple-400">{formatCurrency(report.summary?.sales?.debit_card)}</div>
                                        <div className="text-xs text-slate-400 mt-1">Débito</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                        <div className="text-2xl font-bold text-cyan-400">{formatCurrency(report.summary?.sales?.pix)}</div>
                                        <div className="text-xs text-slate-400 mt-1">PIX</div>
                                    </div>
                                    <div className="text-center p-3 bg-slate-800/50 rounded-lg">
                                        <div className="text-2xl font-bold text-white">{formatCurrency(report.summary?.sales?.total)}</div>
                                        <div className="text-xs text-slate-400 mt-1">Total</div>
                                    </div>
                                </div>
                            </div>

                            {/* Movements List */}
                            <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700">
                                <h3 className="text-lg font-semibold text-white mb-4">Movimentações</h3>
                                {report.movements && report.movements.length > 0 ? (
                                    <div className="space-y-2 max-h-64 overflow-y-auto">
                                        {report.movements.map((mov: any, index: number) => (
                                            <div key={mov.id || index} className="flex items-center justify-between py-2 px-3 bg-slate-800/50 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeColor(mov.type)}`}>
                                                        {getTypeLabel(mov.type)}
                                                    </span>
                                                    <span className="text-sm text-slate-300">{mov.reason || '-'}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <span className="text-xs text-slate-500">
                                                        {new Date(mov.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                    <span className={`font-medium ${['sangria', 'closing'].includes(mov.type) ? 'text-red-400' : 'text-green-400'}`}>
                                                        {['sangria', 'closing'].includes(mov.type) ? '-' : '+'} {formatCurrency(parseFloat(mov.amount))}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-slate-400 text-center py-4">Nenhuma movimentação registrada</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-12 text-slate-400">
                            Nenhum dado disponível
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-700 p-4 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CashReportModal;
