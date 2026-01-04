import { useState, useEffect } from 'react';
import { X, PackageOpen, ArrowRight } from 'lucide-react';
import { API_URL, authFetch } from '../services/api';

interface Product {
    id: string;
    name: string;
    stock_quantity: number;
    unit: string;
}

interface OpenPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    initialParentId?: string;
}

export default function OpenPackageModal({ isOpen, onClose, onSuccess, initialParentId }: OpenPackageModalProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState('1');
    const [loading, setLoading] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadProducts();
            setSelectedProductId(initialParentId || '');
            setQuantity('1');
            setPreview(null);
        }
    }, [isOpen, initialParentId]);

    const loadProducts = async () => {
        try {
            const response = await authFetch(`${API_URL}/products`);
            const data = await response.json();
            // Filtrar apenas produtos que TÊM filhos a granel
            setProducts(data.filter((p: any) => p.children && p.children.length > 0));
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductId || !quantity) return;

        try {
            setLoading(true);
            const response = await authFetch(`${API_URL}/stock-movements/open-package`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    parentProductId: selectedProductId,
                    quantity: parseInt(quantity)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao abrir pacote');
            }

            alert(data.message);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao abrir pacote:', error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const selectedProduct = products.find(p => p.id === selectedProductId);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <PackageOpen className="text-indigo-600" />
                        Abrir Pacote (Granel)
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Produto (Pacote Fechado)
                        </label>
                        <select
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        >
                            <option value="">Selecione um produto...</option>
                            {products.map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.name} (Estoque: {product.stock_quantity} {product.unit})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Quantidade de Pacotes a Abrir
                        </label>
                        <input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>

                    {selectedProduct && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h4 className="font-medium text-blue-900 mb-2">Resumo da Operação:</h4>
                            <div className="flex flex-col gap-2 text-sm text-blue-800">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-red-600">-{quantity} {selectedProduct.unit}</span>
                                    <span>{selectedProduct.name}</span>
                                </div>
                                <div className="flex justify-center">
                                    <ArrowRight className="text-blue-400" size={20} />
                                </div>
                                <div className="flex items-center gap-2 justify-center font-medium">
                                    <span>Será gerado estoque para:</span>
                                    <span className="font-bold text-green-600">
                                        {(selectedProduct as any).children?.[0]?.name || 'Produto a Granel'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-center text-xs text-blue-600 mt-2">
                                O estoque será convertido automaticamente.
                            </div>
                        </div>
                    )}

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !selectedProductId}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                        >
                            {loading ? 'Processando...' : 'Confirmar Abertura'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
