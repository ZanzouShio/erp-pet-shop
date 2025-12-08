import React, { useState } from 'react';
import { X, LogOut, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface CashCloseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (closingBalance: number, notes?: string) => void;
    expectedBalance: number;
    openingBalance: number;
    totalSales: number;
    totalSangrias: number;
    totalSuprimentos: number;
    isLoading?: boolean;
}

const CashCloseModal: React.FC<CashCloseModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    expectedBalance,
    openingBalance,
    totalSales,
    totalSangrias,
    totalSuprimentos,
    isLoading = false
}) => {
    const [closingBalance, setClosingBalance] = useState('');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const parsedClosingBalance = parseFloat(closingBalance.replace(',', '.')) || 0;
    const difference = parsedClosingBalance - expectedBalance;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(parsedClosingBalance, notes.trim() || undefined);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatInputCurrency = (value: string) => {
        const numericValue = value.replace(/\D/g, '');
        const floatValue = parseInt(numericValue || '0', 10) / 100;
        return floatValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatInputCurrency(e.target.value);
        setClosingBalance(formatted);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <LogOut className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Fechar Caixa</h2>
                                <p className="text-red-100 text-sm">Conferência e fechamento de sessão</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Summary */}
                    <div className="bg-slate-900/50 rounded-xl p-4 space-y-3">
                        <h3 className="text-sm font-medium text-slate-400 mb-3">Resumo da Sessão</h3>

                        <div className="flex justify-between items-center py-2 border-b border-slate-700">
                            <span className="text-slate-300">Saldo Inicial</span>
                            <span className="text-white font-medium">{formatCurrency(openingBalance)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-slate-700">
                            <span className="text-slate-300 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-green-400" />
                                Suprimentos
                            </span>
                            <span className="text-green-400 font-medium">+ {formatCurrency(totalSuprimentos)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-slate-700">
                            <span className="text-slate-300 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-400" />
                                Vendas em Dinheiro
                            </span>
                            <span className="text-blue-400 font-medium">+ {formatCurrency(totalSales)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-slate-700">
                            <span className="text-slate-300 flex items-center gap-2">
                                <TrendingDown className="w-4 h-4 text-amber-400" />
                                Sangrias
                            </span>
                            <span className="text-amber-400 font-medium">- {formatCurrency(totalSangrias)}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 bg-slate-800/50 rounded-lg px-3 -mx-1">
                            <span className="text-white font-medium">Saldo Esperado</span>
                            <span className="text-white font-bold text-lg">{formatCurrency(expectedBalance)}</span>
                        </div>
                    </div>

                    {/* Closing Balance Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Saldo Conferido (Dinheiro no caixa)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <span className="text-slate-400">R$</span>
                            </div>
                            <input
                                type="text"
                                value={closingBalance}
                                onChange={handleBalanceChange}
                                placeholder="0,00"
                                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-lg font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Difference Display */}
                    {closingBalance && (
                        <div className={`rounded-lg p-4 ${Math.abs(difference) < 0.01
                                ? 'bg-green-500/10 border border-green-500/30'
                                : difference > 0
                                    ? 'bg-blue-500/10 border border-blue-500/30'
                                    : 'bg-red-500/10 border border-red-500/30'
                            }`}>
                            <div className="flex items-center justify-between">
                                <span className={`font-medium ${Math.abs(difference) < 0.01
                                        ? 'text-green-400'
                                        : difference > 0
                                            ? 'text-blue-400'
                                            : 'text-red-400'
                                    }`}>
                                    {Math.abs(difference) < 0.01
                                        ? 'Caixa OK ✓'
                                        : difference > 0
                                            ? 'Sobra de Caixa'
                                            : 'Falta de Caixa'
                                    }
                                </span>
                                <span className={`text-xl font-bold ${Math.abs(difference) < 0.01
                                        ? 'text-green-400'
                                        : difference > 0
                                            ? 'text-blue-400'
                                            : 'text-red-400'
                                    }`}>
                                    {difference > 0 ? '+' : ''}{formatCurrency(difference)}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Observações (opcional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Justificativa de diferença, ocorrências..."
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Warning for difference */}
                    {closingBalance && Math.abs(difference) > 0.01 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-amber-200">
                                Existe uma diferença de {formatCurrency(Math.abs(difference))} entre o saldo esperado e o conferido.
                                Recomendamos verificar antes de confirmar.
                            </div>
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !closingBalance}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogOut className="w-5 h-5" />
                                    Fechar Caixa
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashCloseModal;
