import { useState } from 'react';
import { X, ChevronRight, HelpCircle, ArrowLeft } from 'lucide-react';
import BuyerDataForm from './BuyerDataForm';

interface NFCeEmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    sale: any;
    onEmit: () => void;
}

export default function NFCeEmissionModal({ isOpen, onClose, sale, onEmit }: NFCeEmissionModalProps) {
    const [showBuyerForm, setShowBuyerForm] = useState(false);
    const [buyerData, setBuyerData] = useState<any>(null);

    if (!isOpen || !sale) return null;

    const handleBuyerFormSubmit = (data: any) => {
        setBuyerData(data);
        setShowBuyerForm(false);
    };

    if (showBuyerForm) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setShowBuyerForm(false)} className="p-1 hover:bg-gray-100 rounded-full">
                                <ArrowLeft size={20} className="text-gray-500" />
                            </button>
                            <h2 className="text-xl font-bold text-gray-900">Preencha os dados de quem comprou</h2>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                            <X size={24} />
                        </button>
                    </div>
                    <BuyerDataForm
                        onSubmit={handleBuyerFormSubmit}
                        onCancel={() => setShowBuyerForm(false)}
                        initialData={buyerData}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-gray-100 rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto flex">
                {/* Left Side - Main Content */}
                <div className="flex-1 p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            Verifique os dados fiscais para emitir a NFC-e
                        </h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Customer Card */}
                        <div className="bg-white p-6 rounded-lg shadow-sm">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg">
                                        {sale.user_name ? sale.user_name.substring(0, 2).toUpperCase() : 'CL'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">{sale.user_name || 'Consumidor Final'}</h3>
                                        <p className="text-sm text-gray-500">SKU: {sale.items[0]?.sku || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-gray-800">R$ {sale.total_amount.toFixed(2).replace('.', ',')}</p>
                                    <p className="text-sm text-gray-500">{sale.items.length} x R$ {sale.total_amount.toFixed(2).replace('.', ',')}</p>
                                </div>
                            </div>
                            <div className="border-t border-gray-100 pt-4">
                                <button className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline">
                                    Revisar dados fiscais do produto <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Buyer Data Toggle */}
                        <div
                            onClick={() => setShowBuyerForm(true)}
                            className="bg-white p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        >
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold text-gray-800">
                                        {buyerData ? 'Dados do comprador incluídos' : 'Deseja incluir os dados do comprador? (Opcional)'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        {buyerData
                                            ? `${buyerData.type === 'PF' ? 'CPF: ' + buyerData.cpf : 'CNPJ: ' + buyerData.cnpj} - ${buyerData.type === 'PF' ? buyerData.name || 'Nome não informado' : buyerData.corporateName}`
                                            : 'Adicione o CPF ou CNPJ de quem comprou na nota fiscal.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 text-blue-600">
                                    {buyerData && <span className="text-sm font-medium">Editar</span>}
                                    <ChevronRight className={buyerData ? "text-blue-600" : "text-gray-400"} />
                                </div>
                            </div>
                        </div>

                        {/* Help Link */}
                        <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center cursor-pointer hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-2 text-gray-700 font-medium">
                                <HelpCircle size={20} />
                                Tire suas dúvidas sobre emissão de nota.
                            </div>
                            <ChevronRight className="text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Right Side - Info Sidebar */}
                <div className="w-80 bg-gray-50 p-8 border-l border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4 text-sm">
                        Dados adicionais que mostramos de forma obrigatória:
                    </h3>
                    <ul className="space-y-3 text-sm text-gray-600 mb-8">
                        <li className="flex gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                            Emitido por ME/EPP optante do Simples Nacional.
                        </li>
                        <li className="flex gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                            Sem direito a crédito fiscal de ICMS/ISS/IPI.
                        </li>
                        <li className="flex gap-2">
                            <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                            Valor aproximado dos tributos (IBPT).
                        </li>
                    </ul>

                    <h3 className="font-bold text-gray-800 mb-4 text-sm">
                        Mensagens adicionais já cadastradas por você:
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                        Ao editar os dados adicionais no campo abaixo, suas mensagens já cadastradas serão automaticamente sobrepostas.
                    </p>

                    <textarea
                        className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Insira os dados para sobrepor suas mensagens adicionais já cadastradas."
                        maxLength={500}
                    ></textarea>
                    <div className="text-right text-xs text-gray-400 mt-1">0 / 500</div>

                    <button
                        onClick={onEmit}
                        className="w-full mt-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Emitir NFC-e
                    </button>
                </div>
            </div>
        </div>
    );
}
