import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, DollarSign, CreditCard, Banknote } from 'lucide-react';
import { API_URL } from '../services/api';

interface ConfirmReceiptModalProps {
    title: {
        id: string;
        description: string;
        amount: string;
        net_amount: string;
    };
    onClose: () => void;
    onConfirm: (data: { payment_date: string; bank_account_id: string | null; payment_method: string }) => void;
}

export default function ConfirmReceiptModal({ title, onClose, onConfirm }: ConfirmReceiptModalProps) {
    const [bankAccounts, setBankAccounts] = useState<{ id: string; name: string }[]>([]);
    const [method, setMethod] = useState('cash'); // cash, bank_transfer, pix, etc.
    const [selectedBankId, setSelectedBankId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchBankAccounts();
    }, []);

    const fetchBankAccounts = async () => {
        try {
            const res = await fetch(`${API_URL}/financial/bank-accounts`);
            const data = await res.json();
            setBankAccounts(data.filter((acc: any) => acc.is_active));
        } catch (error) {
            console.error('Erro ao buscar contas:', error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let bankId = null;
        if (method !== 'cash') {
            bankId = selectedBankId || null;
            if (!bankId) {
                alert('Selecione uma conta bancária para receber.');
                return;
            }
        }

        onConfirm({
            payment_date: date,
            bank_account_id: bankId,
            payment_method: method
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <CheckCircle className="text-green-600" />
                        Confirmar Recebimento
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                    <p className="text-sm text-gray-500 mb-1">Referente a</p>
                    <p className="font-medium text-gray-900 line-clamp-1">{title.description}</p>
                    <div className="flex justify-between mt-2 pt-2 border-t border-gray-200">
                        <p className="text-sm text-gray-500">Valor Líquido</p>
                        <p className="text-lg font-bold text-green-600">
                            R$ {Number(title.net_amount).toFixed(2)}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Data do Recebimento</label>
                        <input
                            type="date"
                            required
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Destino do Valor</label>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <button
                                type="button"
                                onClick={() => setMethod('cash')}
                                className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${method === 'cash'
                                        ? 'bg-green-50 border-green-500 text-green-700 ring-1 ring-green-500'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <Banknote size={24} />
                                <span className="text-sm font-medium">Caixa (Dinheiro)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMethod('bank_transfer')}
                                className={`p-3 rounded-lg border flex flex-col items-center gap-2 transition-all ${method !== 'cash'
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500'
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <CreditCard size={24} />
                                <span className="text-sm font-medium">Conta Bancária</span>
                            </button>
                        </div>

                        {method !== 'cash' && (
                            <div className="animate-fadeIn">
                                <label className="block text-xs text-gray-500 mb-1 uppercase tracking-wide">Selecione a Conta</label>
                                <select
                                    required={method !== 'cash'}
                                    className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-blue-50/50"
                                    value={selectedBankId}
                                    onChange={e => setSelectedBankId(e.target.value)}
                                >
                                    <option value="">Selecione uma conta...</option>
                                    {bankAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold shadow-sm"
                        >
                            Confirmar Recebimento
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
