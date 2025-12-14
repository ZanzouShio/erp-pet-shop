import type { Product } from '../types/index';

interface ProductSearchProps {
    products: Product[];
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onAddToCart: (product: Product) => void;
    onBarcodeSubmit?: (barcode: string) => void;
    showOnlyProducts?: boolean;
}

export default function ProductSearch({
    products,
    searchTerm,
    onSearchChange,
    onAddToCart,
    onBarcodeSubmit,
    showOnlyProducts = false,
}: ProductSearchProps) {

    // Handle Enter key - if it looks like a barcode, try to add to cart
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchTerm.trim()) {
            e.preventDefault();

            // Check if input looks like a barcode (only numbers, 8-14 digits)
            const isBarcode = /^\d{8,14}$/.test(searchTerm.trim());

            if (isBarcode && onBarcodeSubmit) {
                onBarcodeSubmit(searchTerm.trim());
            } else {
                // If there's exactly one product in filtered results, add it
                const filtered = products.filter(
                    (product) =>
                        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        product.barcode?.includes(searchTerm) ||
                        product.category.toLowerCase().includes(searchTerm.toLowerCase())
                );
                if (filtered.length === 1) {
                    onAddToCart(filtered[0]);
                    onSearchChange('');
                }
            }
        }
    };

    // Filtrar produtos
    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.barcode?.includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Agrupar por categoria
    const categories = Array.from(new Set(products.map((p) => p.category)));

    // Se showOnlyProducts=true, mostrar apenas o grid
    if (showOnlyProducts) {
        return (
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                padding: '1.5rem',
                height: 'calc(100vh - 250px)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                }}>
                    <h3 style={{ fontWeight: '600', color: '#374151' }}>
                        {filteredProducts.length} produto(s)
                    </h3>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '0.75rem',
                    overflowY: 'auto',
                    flex: 1
                }}>
                    {filteredProducts.map((product) => (
                        <div
                            key={product.id}
                            style={{
                                border: '1px solid #e5e7eb',
                                borderRadius: '0.5rem',
                                padding: '1rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                height: 'fit-content'
                            }}
                            onClick={() => onAddToCart(product)}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#0ea5e9';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#e5e7eb';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <div style={{ marginBottom: '0.5rem' }}>
                                <h4 style={{
                                    fontWeight: '600',
                                    color: '#111827',
                                    fontSize: '0.95rem',
                                    marginBottom: '0.25rem'
                                }}>
                                    {product.name}
                                </h4>
                                <p style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                                    {product.category}
                                </p>
                            </div>

                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginTop: '0.5rem'
                            }}>
                                <div>
                                    <p style={{
                                        fontSize: '1.25rem',
                                        fontWeight: 'bold',
                                        color: '#0284c7'
                                    }}>
                                        R$ {product.price.toFixed(2)}
                                    </p>
                                    <p style={{ fontSize: '0.65rem', color: '#6b7280' }}>
                                        Est: {product.stock}
                                    </p>
                                </div>
                                <button
                                    className="btn-primary"
                                    style={{ fontSize: '1.1rem', padding: '0.4rem 0.8rem' }}
                                >
                                    +
                                </button>
                            </div>

                            {product.stock <= 10 && (
                                <div style={{
                                    marginTop: '0.5rem',
                                    padding: '0.3rem',
                                    backgroundColor: '#fef3c7',
                                    color: '#92400e',
                                    fontSize: '0.65rem',
                                    borderRadius: '0.25rem',
                                    textAlign: 'center'
                                }}>
                                    ⚠️ Baixo
                                </div>
                            )}
                        </div>
                    ))}

                    {filteredProducts.length === 0 && (
                        <div style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '3rem',
                            color: '#9ca3af'
                        }}>
                            <p style={{ fontSize: '1.125rem' }}>Nenhum produto encontrado</p>
                            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
                                Tente buscar por outro termo
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Modo completo: apenas busca e filtros (sem grid)
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Search Bar */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                border: '1px solid #e5e7eb',
                padding: '1rem'
            }}>
                <div style={{ position: 'relative' }}>
                    <input
                        id="product-search"
                        type="text"
                        style={{
                            width: '100%',
                            padding: '0.625rem 0.625rem 0.625rem 3rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            fontSize: '1rem'
                        }}
                        placeholder="Buscar produto (nome, código de barras, categoria)..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    <div style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '1.25rem'
                    }}>
                        🔍
                    </div>
                </div>

                {/* Quick Category Filter */}
                <div style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <button
                            onClick={() => onSearchChange('')}
                            className={searchTerm === '' ? 'btn-primary' : 'btn-secondary'}
                            style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                        >
                            Todos
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => onSearchChange(category)}
                                className={searchTerm.toLowerCase() === category.toLowerCase() ? 'btn-primary' : 'btn-secondary'}
                                style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
