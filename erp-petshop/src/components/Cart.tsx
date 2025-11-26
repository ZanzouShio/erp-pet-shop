import type { CartItem } from '../types/index';

interface CartProps {
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
    onRemoveItem: (productId: string) => void;
    onUpdateQuantity: (productId: string, quantity: number) => void;
    onApplyDiscount: (productId: string, discount: number) => void;
    onCheckout: () => void;
}

export default function Cart({
    items,
    subtotal,
    discount,
    total,
    onRemoveItem,
    onUpdateQuantity,
    onCheckout,
}: CartProps) {
    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '0.75rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            position: 'sticky',
            top: '1.5rem'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem'
            }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>
                    Carrinho
                </h2>
                <span style={{
                    backgroundColor: '#e0f2fe',
                    color: '#075985',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: '600'
                }}>
                    {items.length} {items.length === 1 ? 'item' : 'itens'}
                </span>
            </div>

            {/* Cart Items */}
            <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                marginBottom: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
            }}>
                {items.length === 0 && (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#9ca3af'
                    }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🛒</div>
                        <p style={{ fontSize: '0.875rem' }}>Carrinho vazio</p>
                        <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                            Adicione produtos para começar
                        </p>
                    </div>
                )}

                {items.map((item) => (
                    <div
                        key={item.id}
                        style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.5rem',
                            padding: '0.75rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'start',
                            marginBottom: '0.5rem'
                        }}>
                            <div style={{ flex: 1 }}>
                                <h4 style={{
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                    color: '#111827'
                                }}>
                                    {item.name}
                                </h4>
                                <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    R$ {item.price.toFixed(2)} x {item.quantity}
                                </p>
                            </div>
                            <button
                                onClick={() => onRemoveItem(item.id)}
                                style={{
                                    color: '#ef4444',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '1.25rem',
                                    marginLeft: '0.5rem'
                                }}
                                title="Remover item"
                            >
                                🗑️
                            </button>
                        </div>

                        {/* Quantity Controls */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                style={{
                                    width: '2rem',
                                    height: '2rem',
                                    backgroundColor: '#f3f4f6',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    color: '#374151',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                -
                            </button>
                            <input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) =>
                                    onUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                                }
                                style={{
                                    width: '4rem',
                                    textAlign: 'center',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '0.25rem',
                                    padding: '0.25rem'
                                }}
                            />
                            <button
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                style={{
                                    width: '2rem',
                                    height: '2rem',
                                    backgroundColor: '#f3f4f6',
                                    border: 'none',
                                    borderRadius: '0.25rem',
                                    color: '#374151',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                +
                            </button>
                        </div>

                        <div style={{
                            marginTop: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                Subtotal:
                            </span>
                            <span style={{ fontWeight: 'bold', color: '#111827' }}>
                                R$ {item.subtotal.toFixed(2)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Totals */}
            {items.length > 0 && (
                <>
                    <div style={{
                        borderTop: '1px solid #e5e7eb',
                        paddingTop: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '0.875rem'
                        }}>
                            <span style={{ color: '#6b7280' }}>Subtotal:</span>
                            <span style={{ fontWeight: '600' }}>R$ {subtotal.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.875rem'
                            }}>
                                <span style={{ color: '#6b7280' }}>Desconto:</span>
                                <span style={{ fontWeight: '600', color: '#16a34a' }}>
                                    - R$ {discount.toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontSize: '1.125rem',
                            fontWeight: 'bold',
                            borderTop: '1px solid #e5e7eb',
                            paddingTop: '0.5rem'
                        }}>
                            <span>Total:</span>
                            <span style={{ color: '#0284c7' }}>R$ {total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Checkout Button */}
                    <button
                        onClick={onCheckout}
                        className="btn-success"
                        style={{
                            width: '100%',
                            marginTop: '1rem',
                            padding: '0.75rem',
                            fontSize: '1.125rem',
                            fontWeight: 'bold'
                        }}
                    >
                        💳 Finalizar Venda (F4)
                    </button>
                </>
            )}
        </div>
    );
}
