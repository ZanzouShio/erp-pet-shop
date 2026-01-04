import { useState, useEffect } from 'react';
import { X, Package, AlertTriangle } from 'lucide-react';
import { API_URL } from '../../services/api';

interface Product {
    id: string;
    name: string;
    stock_quantity: string | number;
    cost_price: string | number;
    unit: string;
    sale_price: string | number;
}

interface SupplierProductsModalProps {
    isOpen: boolean;
    onClose: () => void;
    supplierId: string | null;
    supplierName: string;
}

export default function SupplierProductsModal({ isOpen, onClose, supplierId, supplierName }: SupplierProductsModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && supplierId) {
            loadProducts();
        } else {
            setProducts([]);
        }
    }, [isOpen, supplierId]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/suppliers/${supplierId}`);
            if (!response.ok) throw new Error('Erro ao buscar produtos');

            const data = await response.json();

            // The controller returns the supplier with 'products' array included and already sorted by stock_quantity ASC
            if (data.products) {
                setProducts(data.products);
            } else {
                setProducts([]);
            }
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Package className="text-indigo-600" />
                            Produtos: {supplierName}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Listagem ordenada por quantidade em estoque (do menor para o maior).
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="text-center">
                                <Package size={48} className="text-gray-300 mx-auto mb-4 animate-pulse" />
                                <p className="text-gray-500">Carregando produtos...</p>
                            </div>
                        </div>
                    ) : products.length === 0 ? (
                        <div className="flex items-center justify-center h-48 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <div className="text-center">
                                <Package size={48} className="text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">Nenhum produto vinculado a este fornecedor.</p>
                                <p className="text-xs text-gray-400 mt-1">Edite um produto e selecione este fornecedor na aba "Informações Básicas".</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                    <tr>
                                        <th className="p-3">Produto</th>
                                        <th className="p-3">Estoque Atual</th>
                                        <th className="p-3 text-right">Custo Unit.</th>
                                        <th className="p-3 text-right">Venda Unit.</th>
                                        <th className="p-3 text-right">Sugestão</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {products.map((product) => {
                                        const stock = parseFloat(String(product.stock_quantity));
                                        const isLowStock = stock <= 5; // Exemplo de regra simples, ou poderia usar min_stock se viesse da API

                                        return (
                                            <tr key={product.id} className="hover:bg-gray-50">
                                                <td className="p-3 font-medium text-gray-900">
                                                    {product.name}
                                                </td>
                                                <td className="p-3">
                                                    <div className={`flex items-center gap-2 ${isLowStock ? 'text-red-600 font-bold' : 'text-gray-700'}`}>
                                                        {stock} {product.unit}
                                                        {isLowStock && <AlertTriangle size={14} />}
                                                    </div>
                                                </td>
                                                <td className="p-3 text-right text-gray-600">
                                                    R$ {parseFloat(String(product.cost_price)).toFixed(2)}
                                                </td>
                                                <td className="p-3 text-right text-gray-600">
                                                    R$ {parseFloat(String(product.sale_price)).toFixed(2)}
                                                </td>
                                                <td className="p-3 text-right">
                                                    {isLowStock ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                                            Repor Estoque
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                            OK
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
