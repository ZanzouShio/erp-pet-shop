import React, { useState, useRef } from 'react';
import { X, LogOut, AlertTriangle, TrendingUp, TrendingDown, Printer, CheckCircle } from 'lucide-react';
import type { CashCloseData } from '../hooks/useHardware';

interface CashCloseModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (closingBalance: number, notes?: string) => void;
    expectedBalance: number;
    openingBalance: number;
    totalSales: number;
    totalDebit: number;
    totalCredit: number;
    totalPix: number;
    totalSangrias: number;
    totalSuprimentos: number;
    operatorName?: string;
    terminalName?: string;
    openedAt?: string;
    isLoading?: boolean;
    // Thermal printing support
    printerConnected?: boolean;
    printCashClose?: (data: CashCloseData) => Promise<boolean>;
}

const CashCloseModal: React.FC<CashCloseModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    expectedBalance,
    openingBalance,
    totalSales,
    totalDebit,
    totalCredit,
    totalPix,
    totalSangrias,
    totalSuprimentos,
    operatorName = 'Operador',
    terminalName = 'Terminal 01',
    openedAt,
    isLoading = false,
    printerConnected = false,
    printCashClose
}) => {
    const [closingBalance, setClosingBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    if (!isOpen) return null;

    const parsedClosingBalance = parseFloat(closingBalance.replace(/\./g, '').replace(',', '.')) || 0;
    const difference = parsedClosingBalance - expectedBalance;
    const totalCardSales = totalDebit + totalCredit + totalPix;
    const totalAllSales = totalSales + totalCardSales;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setShowConfirmation(true);
    };

    const handleConfirmClose = () => {
        onConfirm(parsedClosingBalance, notes.trim() || undefined);
        setShowConfirmation(false);
    };

    const handlePrint = async () => {
        // Try thermal printing first if available
        if (printerConnected && printCashClose) {
            try {
                await printCashClose({
                    terminalName,
                    operatorName,
                    openedAt: openedAt ? new Date(openedAt).toLocaleString('pt-BR') : new Date().toLocaleString('pt-BR'),
                    closedAt: new Date().toLocaleString('pt-BR'),
                    openingBalance,
                    totalSales,
                    totalDebit,
                    totalCredit,
                    totalPix,
                    totalSuprimentos,
                    totalSangrias,
                    expectedBalance,
                    closingBalance: parsedClosingBalance,
                    notes: notes.trim() || undefined
                });
                return; // Success, no need for fallback
            } catch (e) {
                console.error('Thermal print failed, falling back to browser:', e);
            }
        }

        // Fallback: browser print dialog
        const printContent = printRef.current;
        if (!printContent) return;

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Fechamento de Caixa</title>
                    <style>
                        * { margin: 0; padding: 0; box-sizing: border-box; }
                        body { 
                            font-family: 'Courier New', monospace; 
                            font-size: 12px; 
                            width: 80mm; 
                            padding: 5mm;
                            line-height: 1.4;
                        }
                        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
                        .header h1 { font-size: 14px; margin-bottom: 5px; }
                        .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
                        .row { display: flex; justify-content: space-between; margin: 4px 0; }
                        .label { text-align: left; }
                        .value { text-align: right; font-weight: bold; }
                        .section-title { font-weight: bold; margin-top: 10px; margin-bottom: 5px; text-transform: uppercase; }
                        .total-row { font-weight: bold; font-size: 14px; margin-top: 10px; }
                        .footer { text-align: center; margin-top: 15px; font-size: 10px; color: #666; }
                        .difference { padding: 5px; margin-top: 10px; text-align: center; }
                        .difference.ok { background: #e8f5e9; }
                        .difference.warn { background: #fff3e0; }
                    </style>
                </head>
                <body>
                    ${printContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
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

    const formatDateTime = (date?: string) => {
        if (!date) return new Date().toLocaleString('pt-BR');
        return new Date(date).toLocaleString('pt-BR');
    };

    // Confirmation Dialog
    if (showConfirmation) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 border border-slate-700">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-8 h-8 text-amber-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Confirmar Fechamento</h3>
                        <p className="text-slate-400 mb-6">
                            Tem certeza que deseja fechar o caixa?<br />
                            <span className="text-white font-medium">Saldo conferido: {formatCurrency(parsedClosingBalance)}</span>
                            {Math.abs(difference) > 0.01 && (
                                <span className={`block mt-2 ${difference > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                                    {difference > 0 ? 'Sobra' : 'Falta'}: {formatCurrency(Math.abs(difference))}
                                </span>
                            )}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 py-3 px-4 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleConfirmClose}
                                disabled={isLoading}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-medium rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Confirmar
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 overflow-hidden border border-slate-700 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg">
                                <LogOut className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">Fechar Caixa</h2>
                                <p className="text-red-100 text-sm">{terminalName} • {operatorName}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrint}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                title="Imprimir Fechamento"
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

                {/* Content - 2 Columns */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column - Financial Summary */}
                        <div className="space-y-4">
                            {/* Cash Summary */}
                            <div className="bg-slate-900/50 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-slate-400 mb-3">💵 Resumo do Caixa</h3>
                                <div className="space-y-2">
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
                                            <TrendingUp className="w-4 h-4 text-emerald-400" />
                                            Vendas em Dinheiro
                                        </span>
                                        <span className="text-emerald-400 font-medium">+ {formatCurrency(totalSales)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-2 border-b border-slate-700">
                                        <span className="text-slate-300 flex items-center gap-2">
                                            <TrendingDown className="w-4 h-4 text-amber-400" />
                                            Sangrias
                                        </span>
                                        <span className="text-amber-400 font-medium">- {formatCurrency(totalSangrias)}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-3 bg-slate-800/80 rounded-lg px-3 mt-2">
                                        <span className="text-white font-medium">Saldo Esperado</span>
                                        <span className="text-white font-bold text-lg">{formatCurrency(expectedBalance)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Card Sales */}
                            <div className="bg-slate-900/50 rounded-xl p-4">
                                <h3 className="text-sm font-medium text-slate-400 mb-3">📋 Conferência de Canhotos</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="text-center p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                                        <div className="text-lg font-bold text-purple-400">{formatCurrency(totalDebit)}</div>
                                        <div className="text-xs text-slate-400 mt-1">Débito</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                        <div className="text-lg font-bold text-blue-400">{formatCurrency(totalCredit)}</div>
                                        <div className="text-xs text-slate-400 mt-1">Crédito</div>
                                    </div>
                                    <div className="text-center p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                                        <div className="text-lg font-bold text-cyan-400">{formatCurrency(totalPix)}</div>
                                        <div className="text-xs text-slate-400 mt-1">PIX</div>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center">
                                    <span className="text-slate-400 text-sm">Total Cartão/PIX</span>
                                    <span className="text-white font-bold">{formatCurrency(totalCardSales)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Closing Input */}
                        <div className="space-y-4">
                            {/* Total Sales Summary */}
                            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-xl p-4 border border-indigo-500/30">
                                <h3 className="text-sm font-medium text-indigo-300 mb-2">💰 Total de Vendas do Turno</h3>
                                <div className="text-3xl font-bold text-white">{formatCurrency(totalAllSales)}</div>
                            </div>

                            {/* Closing Balance Input */}
                            <div className="bg-slate-900/50 rounded-xl p-4">
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
                                        className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-2xl font-medium focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                        autoFocus
                                    />
                                </div>

                                {/* Difference Display */}
                                {closingBalance && (
                                    <div className={`rounded-lg p-4 mt-4 ${Math.abs(difference) < 0.01
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
                            </div>

                            {/* Notes */}
                            <div className="bg-slate-900/50 rounded-xl p-4">
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    Observações (opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Ex: Justificativa de diferença, ocorrências..."
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                                />
                            </div>

                            {/* Warning for difference */}
                            {closingBalance && Math.abs(difference) > 0.01 && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-amber-200">
                                        Existe uma diferença de {formatCurrency(Math.abs(difference))} entre o saldo esperado e o conferido.
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-3 mt-6">
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
                            <LogOut className="w-5 h-5" />
                            Fechar Caixa
                        </button>
                    </div>
                </form>
            </div>

            {/* Hidden Print Content */}
            <div className="hidden">
                <div ref={printRef}>
                    <div className="header">
                        <h1>FECHAMENTO DE CAIXA</h1>
                        <div>{terminalName}</div>
                    </div>
                    <div className="divider"></div>
                    <div className="row">
                        <span>Operador(a):</span>
                        <span>{operatorName}</span>
                    </div>
                    <div className="row">
                        <span>Data Abertura:</span>
                        <span>{formatDateTime(openedAt)}</span>
                    </div>
                    <div className="row">
                        <span>Data Fechamento:</span>
                        <span>{new Date().toLocaleString('pt-BR')}</span>
                    </div>
                    <div className="divider"></div>
                    <div className="section-title">ENTRADAS NO CAIXA</div>
                    <div className="row">
                        <span>Saldo Inicial</span>
                        <span>{formatCurrency(openingBalance)}</span>
                    </div>
                    <div className="row">
                        <span>Suprimentos</span>
                        <span>{formatCurrency(totalSuprimentos)}</span>
                    </div>
                    <div className="row">
                        <span>Dinheiro</span>
                        <span>{formatCurrency(totalSales)}</span>
                    </div>
                    <div className="row">
                        <span>Cartão de Débito</span>
                        <span>{formatCurrency(totalDebit)}</span>
                    </div>
                    <div className="row">
                        <span>Cartão de Crédito</span>
                        <span>{formatCurrency(totalCredit)}</span>
                    </div>
                    <div className="row">
                        <span>PIX</span>
                        <span>{formatCurrency(totalPix)}</span>
                    </div>
                    <div className="divider"></div>
                    <div className="section-title">SAÍDAS</div>
                    <div className="row">
                        <span>Sangrias</span>
                        <span>{formatCurrency(totalSangrias)}</span>
                    </div>
                    <div className="divider"></div>
                    <div className="row total-row">
                        <span>SALDO ESPERADO</span>
                        <span>{formatCurrency(expectedBalance)}</span>
                    </div>
                    <div className="row total-row">
                        <span>SALDO CONFERIDO</span>
                        <span>{formatCurrency(parsedClosingBalance)}</span>
                    </div>
                    <div className={`difference ${Math.abs(difference) < 0.01 ? 'ok' : 'warn'}`}>
                        <strong>{Math.abs(difference) < 0.01 ? 'CAIXA OK' : (difference > 0 ? 'SOBRA' : 'FALTA')}: {formatCurrency(Math.abs(difference))}</strong>
                    </div>
                    {notes && (
                        <>
                            <div className="divider"></div>
                            <div className="section-title">OBSERVAÇÕES</div>
                            <div>{notes}</div>
                        </>
                    )}
                    <div className="footer">
                        <div className="divider"></div>
                        ERP Pet Shop<br />
                        {new Date().toLocaleString('pt-BR')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashCloseModal;
