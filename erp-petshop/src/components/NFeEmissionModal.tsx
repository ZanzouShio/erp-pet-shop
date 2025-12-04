import { useState } from 'react';
import { X, ArrowLeft } from 'lucide-react';
import BuyerDataForm from './BuyerDataForm';

interface NFeEmissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEmit: (data: any) => void;
}

export default function NFeEmissionModal({ isOpen, onClose, onEmit }: NFeEmissionModalProps) {
    const [step, setStep] = useState<'form' | 'review'>('form');
    const [buyerData, setBuyerData] = useState<any>(null);

    if (!isOpen) return null;

    const handleFormSubmit = (data: any) => {
        setBuyerData(data);
        setStep('review');
    };

    const handleEmit = () => {
        onEmit(buyerData);
        setStep('form'); // Reset for next time
        setBuyerData(null);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                    <div className="flex items-center gap-3">
                        {step === 'review' && (
                            <button onClick={() => setStep('form')} className="p-1 hover:bg-gray-100 rounded-full">
                                <ArrowLeft size={20} className="text-gray-500" />
                            </button>
                        )}
                        <h2 className="text-xl font-bold text-gray-900">
                            {step === 'form' ? 'Preencha os dados de quem comprou' : 'Revisar emissão de NF-e'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <X size={24} />
                    </button>
                </div>

                {step === 'form' ? (
                    <BuyerDataForm
                        onSubmit={handleFormSubmit}
                        onCancel={onClose}
                        initialData={buyerData}
                    />
                ) : (
                    <div className="p-6 space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h3 className="font-semibold text-blue-900 mb-2">Resumo da Nota Fiscal</h3>
                            <div className="space-y-2 text-sm text-blue-800">
                                <p><span className="font-medium">Destinatário:</span> {buyerData.type === 'PF' ? buyerData.name || 'Consumidor Final' : buyerData.corporateName}</p>
                                <p><span className="font-medium">Documento:</span> {buyerData.type === 'PF' ? buyerData.cpf || 'Não informado' : buyerData.cnpj}</p>
                                <p><span className="font-medium">Endereço:</span> {buyerData.street ? `${buyerData.street}, ${buyerData.number}` : 'Não informado'}</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="font-medium text-gray-900">Itens da Venda</h4>
                            <p className="text-sm text-gray-500 italic">Os itens da venda selecionada serão incluídos nesta nota.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                onClick={() => setStep('form')}
                                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Voltar
                            </button>
                            <button
                                onClick={handleEmit}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                Emitir NF-e
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
