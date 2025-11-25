import { useState } from 'react';
import type { PaymentMethod } from '../types/index';

interface PaymentModalProps {
    total: number;
    onClose: () => void;
    onComplete: (paymentMethod: PaymentMethod) => void;
}

export default function PaymentModal({
    total,
    onClose,
    onComplete,
}: PaymentModalProps) {
    const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
    const [cashReceived, setCashReceived] = useState<string>('');

    const change = cashReceived
        ? parseFloat(cashReceived) - total
        : 0;

    const handleComplete = () => {
        if (selectedMethod === 'cash' && change < 0) {
            alert('Valor recebido insuficiente!');
            return;
        }
        onComplete(selectedMethod);
    };

    const paymentMethods = [
        { id: 'cash' as PaymentMethod, name: 'Dinheiro', icon: '💵' },
        { id: 'debit_card' as PaymentMethod, name: 'Débito', icon: '💳' },
        { id: 'credit_card' as PaymentMethod, name: 'Crédito', icon: '💳' },
        { id: 'pix' as PaymentMethod, name: 'PIX', icon: '📱' },
    ];

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                maxWidth: '28rem',
                width: '100%',
                margin: '0 1rem'
            }}>
                {/* Header */}
                <div style={{
                    background: 'linear-gradient(to right, #0284c7, #0369a1)',
                    color: 'white',
                    padding: '1.5rem',
                    borderRadius: '1rem 1rem 0 0'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Pagamento</h2>
                        <button
                            onClick={onClose}
                            style={{
                                color: 'white',
                                background: 'none',
                                border: 'none',
                                fontSize: '1.5rem',
                                cursor: 'pointer'
                            }}
                        >
                            ✕
                        </button>
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                        <p style={{ fontSize: '0.875rem', opacity: 0.9 }}>Total a pagar</p>
                        <p style={{ fontSize: '2.25rem', fontWeight: 'bold', marginTop: '0.25rem' }}>
                            R$ {total.toFixed(2)}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem'
                }}>
                    {/* Payment Method Selection */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '0.75rem'
                        }}>
                            Forma de Pagamento
                        </label>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '0.75rem'
                        }}>
                            {paymentMethods.map((method) => (
                                <button
                                    key={method.id}
                                    onClick={() => setSelectedMethod(method.id)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '0.5rem',
                                        border: `2px solid ${selectedMethod === method.id ? '#0284c7' : '#e5e7eb'
                                            }`,
                                        backgroundColor: selectedMethod === method.id ? '#e0f2fe' : 'white',
                                        color: selectedMethod === method.id ? '#075985' : '#111827',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ fontSize: '1.875rem', marginBottom: '0.25rem' }}>
                                        {method.icon}
                                    </div>
                                    <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                                        {method.name}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Cash Specific */}
                    {selectedMethod === 'cash' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={{
                                    display: 'block',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    color: '#374151',
                                    marginBottom: '0.5rem'
                                }}>
                                    Valor Recebido
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute',
                                        left: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        color: '#6b7280',
                                        fontWeight: '600'
                                    }}>
                                        R$
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={total}
                                        value={cashReceived}
                                        onChange={(e) => setCashReceived(e.target.value)}
                                        style={{
                                            width: '100%',
                                            paddingLeft: '3rem',
                                            padding: '0.625rem 1rem',
                                            fontSize: '1.125rem',
                                            fontWeight: '600',
                                            border: '1px solid #d1d5db',
                                            borderRadius: '0.5rem'
                                        }}
                                        placeholder="0,00"
                                        autoFocus
                                    />
                                </div>
                            </div>

                            {cashReceived && (
                                <div style={{
                                    padding: '1rem',
                                    borderRadius: '0.5rem',
                                    backgroundColor: change >= 0 ? '#dcfce7' : '#fee2e2'
                                }}>
                                    <p style={{
                                        fontSize: '0.875rem',
                                        fontWeight: '600',
                                        color: '#374151'
                                    }}>
                                        Troco
                                    </p>
                                    <p style={{
                                        fontSize: '1.5rem',
                                        fontWeight: 'bold',
                                        color: change >= 0 ? '#16a34a' : '#dc2626'
                                    }}>
                                        R$ {Math.max(0, change).toFixed(2)}
                                    </p>
                                </div>
                            )}

                            {/* Quick Values */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '0.5rem'
                            }}>
                                {[20, 50, 100, 200].map((value) => (
                                    <button
                                        key={value}
                                        onClick={() => setCashReceived(value.toString())}
                                        className="btn-secondary"
                                        style={{ fontSize: '0.875rem', padding: '0.5rem' }}
                                    >
                                        R$ {value}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* PIX QR Code Simulation */}
                    {selectedMethod === 'pix' && (
                        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                            <div style={{
                                backgroundColor: '#f3f4f6',
                                padding: '1.5rem',
                                borderRadius: '0.5rem',
                                display: 'inline-block'
                            }}>
                                <div style={{
                                    width: '12rem',
                                    height: '12rem',
                                    backgroundColor: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '3.75rem'
                                }}>
                                    📱
                                </div>
                            </div>
                            <p style={{
                                fontSize: '0.875rem',
                                color: '#6b7280',
                                marginTop: '1rem'
                            }}>
                                Escaneie o QR Code para pagar
                            </p>
                            <p style={{
                                fontSize: '0.75rem',
                                color: '#9ca3af',
                                marginTop: '0.25rem'
                            }}>
                                (Simulação - em produção, QR Code real será exibido)
                            </p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                            style={{ flex: 1, padding: '0.75rem' }}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleComplete}
                            className="btn-success"
                            style={{
                                flex: 1,
                                padding: '0.75rem',
                                fontWeight: 'bold'
                            }}
                        >
                            ✓ Confirmar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
