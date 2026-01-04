/**
 * DiscountModal - Modal para aplicar desconto com motivo obrigatório
 */

import { useState, useEffect } from 'react';
import { X, Tag, AlertTriangle } from 'lucide-react';

interface DiscountModalProps {
    isOpen: boolean;
    onClose: () => void;
    subtotal: number;
    currentDiscount: number;
    onApplyDiscount: (discount: number, reason: string) => void;
}

const DISCOUNT_REASONS = [
    { value: 'NEAR_EXPIRY', label: 'Próximo ao Vencimento' },
    { value: 'DAMAGE', label: 'Avaria na Embalagem' },
    { value: 'PROMO', label: 'Promoção Relâmpago' },
    { value: 'LOYALTY', label: 'Cliente Fidelidade/VIP' },
    { value: 'OTHER', label: 'Outro' },
];

export default function DiscountModal({
    isOpen,
    onClose,
    subtotal,
    currentDiscount,
    onApplyDiscount,
}: DiscountModalProps) {
    const [discountValue, setDiscountValue] = useState('');
    const [discountType, setDiscountType] = useState<'value' | 'percent'>('value');
    const [reason, setReason] = useState('');
    const [otherReason, setOtherReason] = useState('');

    // Resetar formulário quando o modal abre
    useEffect(() => {
        if (isOpen) {
            setDiscountValue('');
            setDiscountType('value');
            setReason('');
            setOtherReason('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    // Format currency input (like PaymentModal)
    const formatCurrencyInput = (value: string): string => {
        const rawValue = value.replace(/\D/g, '');
        if (!rawValue) return '';
        const amount = parseInt(rawValue, 10) / 100;
        return amount.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    // Parse formatted value to number
    const parseFormattedValue = (formatted: string): number => {
        if (!formatted) return 0;
        return parseFloat(formatted.replace(/\./g, '').replace(',', '.')) || 0;
    };

    const handleDiscountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (discountType === 'value') {
            const formatted = formatCurrencyInput(e.target.value);
            setDiscountValue(formatted);
        } else {
            // For percentage, allow direct input
            setDiscountValue(e.target.value);
        }
    };

    const numericDiscount = discountType === 'value'
        ? parseFormattedValue(discountValue)
        : (parseFloat(discountValue.replace(',', '.')) || 0);

    const finalDiscount = discountType === 'percent'
        ? (subtotal * numericDiscount / 100)
        : numericDiscount;

    const percentOfSubtotal = subtotal > 0 ? (finalDiscount / subtotal * 100) : 0;
    const finalTotal = subtotal - finalDiscount;

    const isHighDiscount = percentOfSubtotal > 15;
    const canApply = reason !== '' && finalDiscount >= 0 && finalTotal >= 0;

    const handleApply = () => {
        if (!canApply) return;
        const finalReason = reason === 'OTHER' ? `Outro: ${otherReason}` : reason;
        onApplyDiscount(finalDiscount, finalReason);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                width: '400px',
                maxWidth: '90vw',
                boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Tag size={20} style={{ color: '#16a34a' }} />
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>
                            Aplicar Desconto
                        </h2>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6b7280'
                    }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem' }}>
                    {/* Subtotal Info */}
                    <div style={{
                        backgroundColor: '#f0f9ff',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Subtotal da venda: </span>
                        <span style={{ fontWeight: 'bold', color: '#0284c7' }}>
                            R$ {subtotal.toFixed(2)}
                        </span>
                    </div>

                    {/* Discount Type Toggle */}
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <button
                            onClick={() => { setDiscountType('value'); setDiscountValue(''); }}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: discountType === 'value' ? '2px solid #16a34a' : '1px solid #d1d5db',
                                borderRadius: '0.5rem',
                                backgroundColor: discountType === 'value' ? '#f0fdf4' : 'white',
                                cursor: 'pointer',
                                fontWeight: discountType === 'value' ? 'bold' : 'normal'
                            }}
                        >
                            R$ (Valor)
                        </button>
                        <button
                            onClick={() => { setDiscountType('percent'); setDiscountValue(''); }}
                            style={{
                                flex: 1,
                                padding: '0.5rem',
                                border: discountType === 'percent' ? '2px solid #16a34a' : '1px solid #d1d5db',
                                borderRadius: '0.5rem',
                                backgroundColor: discountType === 'percent' ? '#f0fdf4' : 'white',
                                cursor: 'pointer',
                                fontWeight: discountType === 'percent' ? 'bold' : 'normal'
                            }}
                        >
                            % (Percentual)
                        </button>
                    </div>

                    {/* Discount Input */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Valor do desconto
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#6b7280' }}>
                                {discountType === 'value' ? 'R$' : '%'}
                            </span>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder={discountType === 'value' ? '0,00' : '0'}
                                value={discountValue}
                                onChange={handleDiscountChange}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.5rem',
                                    fontSize: '1.25rem',
                                    textAlign: 'right'
                                }}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Calculated Values */}
                    <div style={{
                        backgroundColor: '#f9fafb',
                        padding: '0.75rem 1rem',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Desconto:</span>
                            <span style={{ fontWeight: '600', color: '#16a34a' }}>
                                - R$ {finalDiscount.toFixed(2)} ({percentOfSubtotal.toFixed(1)}%)
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontWeight: '600' }}>Total final:</span>
                            <span style={{ fontWeight: 'bold', color: '#0284c7', fontSize: '1.125rem' }}>
                                R$ {finalTotal.toFixed(2)}
                            </span>
                        </div>
                    </div>

                    {/* High Discount Warning */}
                    {isHighDiscount && (
                        <div style={{
                            backgroundColor: '#fef3c7',
                            border: '1px solid #fbbf24',
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <AlertTriangle size={20} style={{ color: '#d97706' }} />
                            <span style={{ color: '#92400e', fontSize: '0.875rem' }}>
                                Desconto acima de 15% - será registrado para auditoria
                            </span>
                        </div>
                    )}

                    {/* Reason Select (Obrigatório) */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                            Motivo do desconto <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <select
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: reason ? '1px solid #d1d5db' : '2px solid #dc2626',
                                borderRadius: '0.5rem',
                                fontSize: '1rem',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">Selecione o motivo...</option>
                            {DISCOUNT_REASONS.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Other Reason Text */}
                    {reason === 'OTHER' && (
                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Descreva o motivo..."
                                value={otherReason}
                                onChange={(e) => setOtherReason(e.target.value)}
                                maxLength={93}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.5rem'
                                }}
                            />
                            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {otherReason.length}/93 caracteres
                            </span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #e5e7eb',
                    display: 'flex',
                    gap: '0.75rem',
                    justifyContent: 'flex-end'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.625rem 1.25rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            backgroundColor: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!canApply}
                        style={{
                            padding: '0.625rem 1.5rem',
                            border: 'none',
                            borderRadius: '0.5rem',
                            backgroundColor: canApply ? '#16a34a' : '#9ca3af',
                            color: 'white',
                            cursor: canApply ? 'pointer' : 'not-allowed',
                            fontWeight: '600'
                        }}
                    >
                        Aplicar Desconto
                    </button>
                </div>
            </div>
        </div>
    );
}
