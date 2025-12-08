import React, { useState } from 'react';
import { X, ArrowDownCircle, AlertCircle } from 'lucide-react';

interface SuprimentoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (amount: number, reason?: string) => void;
    currentBalance?: number;
    isLoading?: boolean;
}

const SuprimentoModal: React.FC<SuprimentoModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    currentBalance = 0,
    isLoading = false
}) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const parsedAmount = parseFloat(amount.replace(',', '.')) || 0;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (parsedAmount <= 0) {
            setError('Valor deve ser maior que zero');
            return;
        }

        onConfirm(parsedAmount, reason.trim() || undefined);
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

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatInputCurrency(e.target.value);
        setAmount(formatted);
        setError('');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <ArrowDownCircle className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Suprimento</h2>
                                <p className="text-blue-100 text-sm">Adicionar dinheiro ao caixa</p>
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
                    {/* Current Balance */}
                    <div className="bg-slate-900/50 rounded-lg p-4 flex justify-between items-center">
                        <span className="text-slate-400">Saldo atual do caixa</span>
                        <span className="text-xl font-bold text-white">{formatCurrency(currentBalance)}</span>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Valor do Suprimento
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <span className="text-slate-400">R$</span>
                            </div>
                            <input
                                type="text"
                                value={amount}
                                onChange={handleAmountChange}
                                placeholder="0,00"
                                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-lg font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Reason Input */}
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Motivo (opcional)
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex: Reposição de troco, fundo adicional..."
                            rows={2}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        />
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex gap-3">
                            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-200">{error}</div>
                        </div>
                    )}

                    {/* Balance After */}
                    {amount && parsedAmount > 0 && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex justify-between items-center">
                            <span className="text-green-300">Saldo após suprimento</span>
                            <span className="text-lg font-bold text-green-400">{formatCurrency(currentBalance + parsedAmount)}</span>
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
                            disabled={isLoading || !amount}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ArrowDownCircle className="w-5 h-5" />
                                    Confirmar Suprimento
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SuprimentoModal;
