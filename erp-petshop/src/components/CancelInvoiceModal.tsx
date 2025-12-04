import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CancelInvoiceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
}

export default function CancelInvoiceModal({ isOpen, onClose, onConfirm }: CancelInvoiceModalProps) {
    const [selectedReason, setSelectedReason] = useState('');

    if (!isOpen) return null;

    const reasons = [
        'Erros cadastrais, como CPF ou CNPJ.',
        'Informações incorretas sobre preço e impostos.',
        'Desistência da venda.',
        'Outro.'
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                >
                    <X size={24} />
                </button>

                <h2 className="text-xl font-bold text-gray-800 mb-6 pr-8">
                    Informe o motivo do cancelamento da NFC-e:
                </h2>

                <div className="space-y-4 mb-8">
                    {reasons.map((reason) => (
                        <label key={reason} className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input
                                    type="radio"
                                    name="cancelReason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-full border border-gray-300 checked:border-blue-600 transition-all"
                                />
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-blue-600 opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                            </div>
                            <span className="text-gray-700 group-hover:text-gray-900">{reason}</span>
                        </label>
                    ))}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => onConfirm(selectedReason)}
                        disabled={!selectedReason}
                        className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Cancelar NFC-e
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        </div>
    );
}
