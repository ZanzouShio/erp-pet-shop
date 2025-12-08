import React, { useState } from 'react';
import { X, DollarSign, LogIn, AlertCircle } from 'lucide-react';

interface CashOpenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (openingBalance: number, notes?: string) => void;
    isLoading?: boolean;
}

const CashOpenModal: React.FC<CashOpenModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    isLoading = false
}) => {
    const [openingBalance, setOpeningBalance] = useState('');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const balance = parseFloat(openingBalance.replace(',', '.')) || 0;
        onConfirm(balance, notes.trim() || undefined);
    };

    const formatCurrency = (value: string) => {
        const numericValue = value.replace(/\D/g, '');
        const floatValue = parseInt(numericValue || '0', 10) / 100;
        return floatValue.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const handleBalanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCurrency(e.target.value);
        setOpeningBalance(formatted);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-slate-700">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <LogIn className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Abrir Caixa</h2>
                                <p className="text-green-100 text-sm">Iniciar nova sessão de caixa</p>
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
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-200">
                                Informe o valor em dinheiro disponível no caixa físico para iniciar a conferência.
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Saldo Inicial (Fundo de Caixa)
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <span className="text-slate-400">R$</span>
                            </div>
                            <input
                                type="text"
                                value={openingBalance}
                                onChange={handleBalanceChange}
                                placeholder="0,00"
                                className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-lg font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Observações (opcional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ex: Troco preparado, conferência realizada..."
                            rows={3}
                            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                        />
                    </div>

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
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Abrir Caixa
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CashOpenModal;
