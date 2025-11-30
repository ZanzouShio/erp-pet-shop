import { useState, useEffect } from 'react';
import type { PaymentMethod } from '../types/index';
import { API_URL } from '../services/api';

interface PaymentModalProps {
    total: number;
    onClose: () => void;
    onComplete: (paymentMethod: PaymentMethod, details?: any) => void;
}

interface PaymentConfig {
    id: string;
    type: string;
    name: string;
    max_installments?: number;
    installment_fees?: { installment: number; fee: number }[];
    flat_fee_percent?: number;
    receivable_mode?: 'immediate' | 'flow';
}

export default function PaymentModal({
    total,
    onClose,
    onComplete,
}: PaymentModalProps) {
    const [step, setStep] = useState<'method' | 'installments' | 'provider' | 'confirm'>('method');
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
    const [cashReceived, setCashReceived] = useState<string>('');
    const [configs, setConfigs] = useState<PaymentConfig[]>([]);
    const [selectedConfigId, setSelectedConfigId] = useState<string>('');
    const [installments, setInstallments] = useState<number>(1);
    const [loading, setLoading] = useState(false);

    // Reset ao abrir
    useEffect(() => {
        setStep('method');
        setSelectedMethod('cash');
        setInstallments(1);
        setConfigs([]);
    }, [total]);

    const fetchConfigs = async (type: string) => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/payment-config/active/${type}`);
            const data = await res.json();
            setConfigs(data);
        } catch (error) {
            console.error('Erro ao buscar configs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMethodSelect = async (method: PaymentMethod) => {
        setSelectedMethod(method);
        if (method === 'cash') {
            setStep('confirm');
        } else if (method === 'credit_card') {
            // Buscar configs primeiro para saber o max de parcelas global? 
            // Ou apenas ir para tela de parcelas e depois filtrar?
            // Melhor buscar configs agora para saber quais parcelas mostrar
            await fetchConfigs(method);
            setStep('installments');
        } else {
            // Débito ou Pix
            await fetchConfigs(method);
            setStep('provider');
        }
    };

    const handleInstallmentSelect = (n: number) => {
        setInstallments(n);
        setStep('provider');
    };

    const handleProviderSelect = (configId: string) => {
        setSelectedConfigId(configId);
        setStep('confirm');
    };

    const change = cashReceived ? parseFloat(cashReceived) - total : 0;

    const getSelectedConfig = () => configs.find(c => c.id === selectedConfigId);

    const getFeeForConfig = (config: PaymentConfig, inst: number) => {
        if (config.type === 'credit_card') {
            const feeObj = config.installment_fees?.find(f => f.installment === inst);
            return feeObj ? Number(feeObj.fee) : 0;
        }
        return Number(config.flat_fee_percent || 0);
    };

    const handleComplete = () => {
        if (selectedMethod === 'cash' && change < 0) {
            alert('Valor recebido insuficiente!');
            return;
        }

        const details: any = {};
        if (selectedMethod !== 'cash') {
            const config = getSelectedConfig();
            // Se não tiver config selecionada (ex: lista vazia), segue sem config
            if (config) {
                details.paymentConfigId = config.id;
                details.providerName = config.name;
                details.installments = installments;
                details.feePercent = getFeeForConfig(config, installments);
            } else {
                details.installments = installments;
            }
        }

        onComplete(selectedMethod, details);
    };

    const paymentMethods = [
        { id: 'cash' as PaymentMethod, name: 'Dinheiro', icon: '💵' },
        { id: 'debit_card' as PaymentMethod, name: 'Débito', icon: '💳' },
        { id: 'credit_card' as PaymentMethod, name: 'Crédito', icon: '💳' },
        { id: 'pix' as PaymentMethod, name: 'PIX', icon: '📱' },
    ];

    // Filtrar configs que suportam a parcela selecionada
    const availableConfigs = configs.filter(c => {
        if (selectedMethod !== 'credit_card') return true;
        return (c.max_installments || 1) >= installments;
    }).sort((a, b) => {
        // Ordenar por menor taxa
        const feeA = getFeeForConfig(a, installments);
        const feeB = getFeeForConfig(b, installments);
        return feeA - feeB;
    });

    // Calcular maior número de parcelas disponível entre todas as configs
    const maxGlobalInstallments = configs.reduce((max, c) => Math.max(max, c.max_installments || 1), 1);

    return (
        <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '1rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                maxWidth: '32rem', width: '100%', margin: '0 1rem', maxHeight: '90vh', overflowY: 'auto'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(to right, #0284c7, #0369a1)', color: 'white', padding: '1.5rem', borderRadius: '1rem 1rem 0 0'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                            {step === 'method' && 'Forma de Pagamento'}
                            {step === 'installments' && 'Parcelamento'}
                            {step === 'provider' && 'Escolha a Maquininha'}
                            {step === 'confirm' && 'Confirmar Pagamento'}
                        </h2>
                        <button onClick={onClose} style={{ color: 'white', background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total a pagar</p>
                        <p style={{ fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.25rem' }}>R$ {total.toFixed(2)}</p>
                    </div>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* STEP 1: Method Selection */}
                    {step === 'method' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => handleMethodSelect(method.id)}
                                    style={{
                                        padding: '1.5rem', borderRadius: '0.5rem',
                                        border: '1px solid #e5e7eb', backgroundColor: 'white',
                                        color: '#111827', cursor: 'pointer', transition: 'all 0.2s',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem'
                                    }}
                                    className="hover:bg-gray-50 hover:border-blue-300"
                                >
                                    <div style={{ fontSize: '2rem' }}>{method.icon}</div>
                                    <div style={{ fontWeight: '600' }}>{method.name}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* STEP 2: Installments (Credit Card Only) */}
                    {step === 'installments' && (
                        <div className="grid grid-cols-3 gap-3">
                            {Array.from({ length: maxGlobalInstallments }, (_, i) => i + 1).map(i => (
                                <button
                                    key={i}
                                    onClick={() => handleInstallmentSelect(i)}
                                    className="p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all text-center"
                                >
                                    <div className="font-bold text-lg text-gray-800">{i}x</div>
                                    <div className="text-xs text-gray-500">R$ {(total / i).toFixed(2)}</div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* STEP 3: Provider Selection */}
                    {step === 'provider' && (
                        <div className="space-y-3">
                            {availableConfigs.length > 0 ? (
                                availableConfigs.map(config => {
                                    const fee = getFeeForConfig(config, installments);
                                    const netValue = total - (total * fee / 100);
                                    return (
                                        <button
                                            key={config.id}
                                            onClick={() => handleProviderSelect(config.id)}
                                            className="w-full p-4 border rounded-lg hover:bg-blue-50 hover:border-blue-500 transition-all flex justify-between items-center text-left"
                                        >
                                            <div>
                                                <div className="font-bold text-gray-800">{config.name}</div>
                                                <div className="text-xs text-gray-500">
                                                    {config.receivable_mode === 'flow' ? 'Recebimento em Fluxo' : 'Recebimento Antecipado'}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-green-600">Taxa: {fee}%</div>
                                                <div className="text-xs text-gray-500">Líquido: R$ {netValue.toFixed(2)}</div>
                                            </div>
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-lg">
                                    Nenhuma configuração disponível para esta opção.
                                    <button
                                        onClick={() => handleProviderSelect('')}
                                        className="block mx-auto mt-2 text-blue-600 underline"
                                    >
                                        Continuar sem configuração
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 4: Confirm (Cash or Final Review) */}
                    {step === 'confirm' && (
                        <div className="space-y-4">
                            {selectedMethod === 'cash' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Valor Recebido</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value)}
                                        className="w-full p-3 text-xl font-bold border rounded-lg"
                                        placeholder="0,00"
                                        autoFocus
                                    />
                                    {cashReceived && (
                                        <div className={`mt-4 p-4 rounded-lg ${change >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                            <p className="text-sm font-medium text-gray-600">Troco</p>
                                            <p className={`text-2xl font-bold ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                R$ {Math.max(0, change).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Método:</span>
                                        <span className="font-medium capitalize">{selectedMethod.replace('_', ' ')}</span>
                                    </div>
                                    {installments > 1 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Parcelas:</span>
                                            <span className="font-medium">{installments}x de R$ {(total / installments).toFixed(2)}</span>
                                        </div>
                                    )}
                                    {getSelectedConfig() && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Maquininha:</span>
                                            <span className="font-medium">{getSelectedConfig()?.name}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setStep('method')}
                                    className="flex-1 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Voltar
                                </button>
                                <button
                                    onClick={handleComplete}
                                    className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                                >
                                    Confirmar Pagamento
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Back Button (except for method step) */}
                    {step !== 'method' && step !== 'confirm' && (
                        <button
                            onClick={() => {
                                if (step === 'installments') setStep('method');
                                if (step === 'provider') setStep(selectedMethod === 'credit_card' ? 'installments' : 'method');
                            }}
                            className="text-gray-500 text-sm hover:text-gray-700"
                        >
                            ← Voltar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
