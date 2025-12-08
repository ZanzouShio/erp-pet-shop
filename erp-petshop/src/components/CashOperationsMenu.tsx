import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign, Settings, LogOut, LogIn, ArrowDownCircle, ArrowUpCircle, FileText, ChevronDown } from 'lucide-react';

interface CashOperationsMenuProps {
    terminalId: string;
    onOpenCash: () => void;
    onCloseCash: () => void;
    onSangria: () => void;
    onSuprimento: () => void;
    onViewReport: () => void;
    isOpen: boolean;
    currentBalance?: number;
    operatorName?: string;
}

const CashOperationsMenu: React.FC<CashOperationsMenuProps> = ({
    terminalId,
    onOpenCash,
    onCloseCash,
    onSangria,
    onSuprimento,
    onViewReport,
    isOpen,
    currentBalance = 0,
    operatorName
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setShowMenu(!showMenu)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${isOpen
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
                        : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white'
                    }`}
            >
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">
                    {isOpen ? 'Caixa Aberto' : 'Caixa Fechado'}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
            </button>

            {showMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-slate-700/50 to-slate-800/50 border-b border-slate-700">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">Status do Caixa</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${isOpen ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {isOpen ? 'Aberto' : 'Fechado'}
                            </span>
                        </div>
                        {isOpen && (
                            <>
                                <div className="mt-2 text-lg font-bold text-white">
                                    {formatCurrency(currentBalance)}
                                </div>
                                {operatorName && (
                                    <div className="text-xs text-slate-400 mt-1">
                                        Operador: {operatorName}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                        {!isOpen ? (
                            <button
                                onClick={() => { onOpenCash(); setShowMenu(false); }}
                                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 text-left transition-colors group"
                            >
                                <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-colors">
                                    <LogIn className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    <div className="font-medium text-white">Abrir Caixa</div>
                                    <div className="text-xs text-slate-400">Iniciar uma nova sessão</div>
                                </div>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => { onSuprimento(); setShowMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 text-left transition-colors group"
                                >
                                    <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-colors">
                                        <ArrowDownCircle className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">Suprimento</div>
                                        <div className="text-xs text-slate-400">Adicionar dinheiro ao caixa</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { onSangria(); setShowMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 text-left transition-colors group"
                                >
                                    <div className="p-2 bg-amber-500/20 rounded-lg group-hover:bg-amber-500/30 transition-colors">
                                        <ArrowUpCircle className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">Sangria</div>
                                        <div className="text-xs text-slate-400">Retirar dinheiro do caixa</div>
                                    </div>
                                </button>

                                <button
                                    onClick={() => { onViewReport(); setShowMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700/50 text-left transition-colors group"
                                >
                                    <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-colors">
                                        <FileText className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">Relatório</div>
                                        <div className="text-xs text-slate-400">Ver movimentações do caixa</div>
                                    </div>
                                </button>

                                <div className="my-2 border-t border-slate-700" />

                                <button
                                    onClick={() => { onCloseCash(); setShowMenu(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-left transition-colors group"
                                >
                                    <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-colors">
                                        <LogOut className="w-5 h-5 text-red-400" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-red-400">Fechar Caixa</div>
                                        <div className="text-xs text-slate-400">Encerrar a sessão atual</div>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CashOperationsMenu;
