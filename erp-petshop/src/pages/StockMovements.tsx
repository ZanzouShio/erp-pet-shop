import { Package, Plus, TrendingDown, TrendingUp, AlertTriangle, Search, X, ChevronDown } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

import { API_URL } from '../services/api';

interface Product {
    id: string;
    name: string;
    stock_quantity: number;
    average_cost: number;
    last_cost: number;
    internal_code: string;
    sku: string;
    ean: string;
    parent_product_id: string | null;
}

interface StockMovement {
    id: string;
    product_name: string;
    current_stock: number;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    quantity: number;
    cost_price: number | null;
    reference_type: string;
    notes: string;
    created_at: string;
}

interface MarginAlert {
    margin_alert: boolean;
    current_price: number;
    new_cost: number;
    current_margin: number;
    target_margin: number;
    suggested_price: number;
    message: string;
}

export default function StockMovements() {
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal de entrada
    const [showEntryModal, setShowEntryModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState('');
    const [costPrice, setCostPrice] = useState('');
    const [notes, setNotes] = useState('');

    // Searchable Combobox State
    const [searchTerm, setSearchTerm] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Modal de alerta de margem
    const [marginAlert, setMarginAlert] = useState<MarginAlert | null>(null);
    const [productName, setProductName] = useState('');

    useEffect(() => {
        loadMovements();
        loadProducts();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const loadMovements = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/stock-movements?limit=50`);
            const data = await response.json();
            setMovements(data);
        } catch (error) {
            console.error('Erro ao carregar movimentações:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            const response = await fetch(`${API_URL}/products`);
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    };

    const handleSubmitEntry = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedProduct || !quantity || !costPrice) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/stock-movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: selectedProduct.id,
                    type: 'in',
                    quantity: parseInt(quantity),
                    cost_price: parseFloat(costPrice),
                    notes: notes || null
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao processar entrada');
            }

            // Fechar modal de entrada
            setShowEntryModal(false);

            // Se houver alerta de margem, mostrar modal
            if (result.margin_alert) {
                setMarginAlert(result);
                setProductName(result.product_name);
            } else {
                alert(`Entrada processada com sucesso!\nEstoque: ${result.old_stock} → ${result.new_stock}\nCusto médio: R$ ${result.old_average_cost.toFixed(2)} → R$ ${result.new_average_cost.toFixed(2)}`);
            }

            // Limpar form
            setSelectedProduct(null);
            setSearchTerm('');
            setQuantity('');
            setCostPrice('');
            setNotes('');

            // Recarregar listas
            loadMovements();
            loadProducts();

        } catch (error: any) {
            alert('Erro: ' + error.message);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'IN': return <TrendingUp className="text-green-600" size={20} />;
            case 'OUT': return <TrendingDown className="text-red-600" size={20} />;
            default: return <Package className="text-gray-600" size={20} />;
        }
    };

    const getTypeText = (type: string) => {
        switch (type) {
            case 'IN': return 'Entrada';
            case 'OUT': return 'Saída';
            case 'ADJUSTMENT': return 'Ajuste';
            default: return type;
        }
    };

    // Filter products based on search term
    const filteredProducts = products.filter(product => {
        // Exclude child products (bulk) - they should be managed via "Open Package"
        if (product.parent_product_id) return false;

        const searchLower = searchTerm.toLowerCase();
        return (
            product.name.toLowerCase().includes(searchLower) ||
            (product.internal_code && product.internal_code.toLowerCase().includes(searchLower)) ||
            (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
            (product.ean && product.ean.includes(searchLower))
        );
    });

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Movimentações de Estoque</h1>
                    <p className="text-gray-500 mt-1">Histórico completo de entradas e saídas</p>
                </div>
                <button
                    onClick={() => setShowEntryModal(true)}
                    className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition"
                >
                    <Plus size={20} />
                    Entrada de Estoque
                </button>
            </div>

            {/* Movements Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Custo Unit.</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estoque Atual</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Notas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Carregando movimentações...
                                    </td>
                                </tr>
                            ) : movements.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Nenhuma movimentação registrada
                                    </td>
                                </tr>
                            ) : (
                                movements.map((movement) => (
                                    <tr key={movement.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {getTypeIcon(movement.type)}
                                                <span className="text-sm font-medium">{getTypeText(movement.type)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{movement.product_name}</td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {movement.cost_price ? formatCurrency(movement.cost_price) : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-gray-900">{movement.current_stock}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(movement.created_at)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{movement.notes || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal: Entrada de Estoque */}
            {showEntryModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 overflow-visible">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Nova Entrada de Estoque</h2>

                        <form onSubmit={handleSubmitEntry} className="space-y-4">
                            {/* Produto Searchable Combobox */}
                            <div className="relative" ref={dropdownRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Produto *
                                </label>

                                <div
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent cursor-text flex items-center justify-between bg-white"
                                    onClick={() => setIsDropdownOpen(true)}
                                >
                                    {selectedProduct ? (
                                        <div className="flex-1 truncate">
                                            <span className="font-medium text-gray-900">{selectedProduct.name}</span>
                                            <span className="text-xs text-gray-500 ml-2">
                                                (Estoque: {selectedProduct.stock_quantity})
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">Selecione um produto...</span>
                                    )}
                                    <div className="flex items-center gap-1">
                                        {selectedProduct && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedProduct(null);
                                                    setSearchTerm('');
                                                }}
                                                className="text-gray-400 hover:text-gray-600"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                        <ChevronDown size={16} className="text-gray-400" />
                                    </div>
                                </div>

                                {isDropdownOpen && (
                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
                                        <div className="p-2 border-b border-gray-100">
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                                                    placeholder="Buscar por nome, código, SKU..."
                                                    autoFocus
                                                />
                                            </div>
                                        </div>

                                        <div className="overflow-y-auto flex-1">
                                            {filteredProducts.length === 0 ? (
                                                <div className="p-4 text-center text-gray-500 text-sm">
                                                    Nenhum produto encontrado
                                                </div>
                                            ) : (
                                                filteredProducts.map((product) => (
                                                    <button
                                                        key={product.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedProduct(product);
                                                            setIsDropdownOpen(false);
                                                            setSearchTerm('');
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 transition-colors"
                                                    >
                                                        <div className="font-medium text-gray-900">{product.name}</div>
                                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                                            <span>Estoque: {product.stock_quantity}</span>
                                                            {product.sku && <span>SKU: {product.sku}</span>}
                                                            {product.internal_code && <span>Cód: {product.internal_code}</span>}
                                                        </div>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quantidade */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Quantidade *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="10"
                                    required
                                />
                            </div>

                            {/* Custo Unitário */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Custo Unitário (R$) *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={costPrice}
                                    onChange={(e) => setCostPrice(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="50.00"
                                    required
                                />
                            </div>

                            {/* Notas */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notas (Opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    placeholder="Ex: Compra fornecedor XYZ"
                                    rows={3}
                                />
                            </div>

                            {/* Botões */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEntryModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                >
                                    Processar Entrada
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Alerta de Margem */}
            {marginAlert && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="bg-orange-100 p-3 rounded-full">
                                <AlertTriangle className="text-orange-600" size={32} />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-gray-900">Alerta de Margem</h2>
                                <p className="text-gray-600 mt-1">{productName}</p>
                            </div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
                            <p className="text-gray-800 font-medium mb-4">{marginAlert.message}</p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Margem Atual</p>
                                    <p className="text-2xl font-bold text-orange-600">{marginAlert.current_margin.toFixed(1)}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Margem Meta</p>
                                    <p className="text-2xl font-bold text-gray-900">{marginAlert.target_margin.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                            <p className="text-sm text-gray-600 mb-2">Preço Sugerido para Manter Margem</p>
                            <p className="text-3xl font-bold text-green-600">{formatCurrency(marginAlert.suggested_price)}</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Preço atual: {formatCurrency(marginAlert.current_price)} |
                                Novo custo: {formatCurrency(marginAlert.new_cost)}
                            </p>
                        </div>

                        <p className="text-sm text-gray-500 mb-6">
                            ⚠️ <strong>Atenção:</strong> Este é apenas um alerta. O preço <strong>não foi alterado</strong> automaticamente.
                            Você pode ajustar o preço de venda manualmente na página de Estoque.
                        </p>

                        <button
                            onClick={() => setMarginAlert(null)}
                            className="w-full px-4 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition font-medium"
                        >
                            Entendi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
