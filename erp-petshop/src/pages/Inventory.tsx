import { useState, useEffect } from 'react';
import { Plus, Search, Package, Edit, Trash2, AlertTriangle, PackageOpen } from 'lucide-react';
import ProductFormModal from '../components/ProductFormModal';
import OpenPackageModal from '../components/OpenPackageModal';

import { API_URL } from '../services/api';

interface Product {
    id: string;
    name: string;
    description?: string;
    brand?: string;
    category_id?: string;
    category?: string;
    ean?: string;
    internal_code?: string;
    cost_price: number;
    sale_price: number;
    profit_margin?: number;
    stock_quantity: number;
    min_stock: number;
    unit: string;
    image_url?: string;
    is_active: boolean;
}

interface Category {
    id: string;
    name: string;
}

export default function Inventory() {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [showLowStock, setShowLowStock] = useState(false);

    // Estados do modal
    const [showModal, setShowModal] = useState(false);
    const [showOpenPackageModal, setShowOpenPackageModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);

    useEffect(() => {
        loadProducts();
        loadCategories();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/products`);
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/categories`);
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Deseja realmente desativar o produto "${name}"?`)) return;

        try {
            const response = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('Produto desativado com sucesso!');
                loadProducts();
            } else {
                const data = await response.json();
                alert(data.error || 'Erro ao desativar produto');
            }
        } catch (error) {
            console.error('Erro ao desativar produto:', error);
            alert('Erro ao desativar produto');
        }
    };

    // Filtrar produtos
    const filteredProducts = products.filter((product) => {
        const matchesSearch =
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.ean?.includes(searchTerm) ||
            product.internal_code?.includes(searchTerm);

        const matchesCategory = !selectedCategory || product.category_id === selectedCategory;

        const matchesLowStock = !showLowStock || parseFloat(String(product.stock_quantity)) <= parseFloat(String(product.min_stock));

        return matchesSearch && matchesCategory && matchesLowStock;
    });

    const handleNew = () => {
        setEditingProduct(undefined);
        setShowModal(true);
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingProduct(undefined);
    };

    const handleModalSuccess = () => {
        loadProducts(); // Recarregar lista
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Gestão de Estoque</h1>
                    <p className="text-gray-500 mt-1">Gerencie seus produtos e controle o inventário</p>
                </div>
                <div className="flex gap-3">
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() => setShowOpenPackageModal(true)}
                    >
                        <PackageOpen size={20} />
                        Abrir Pacote
                    </button>
                    <button
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        onClick={handleNew}
                    >
                        <Plus size={20} />
                        Novo Produto
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="md:col-span-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por nome, código de barras ou código interno..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="">Todas as Categorias</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Low Stock Filter */}
                    <div className="flex items-center">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={showLowStock}
                                onChange={(e) => setShowLowStock(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                            />
                            <span className="text-sm text-gray-700">Apenas Estoque Baixo</span>
                        </label>
                    </div>
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Package size={48} className="text-gray-400 mx-auto mb-4 animate-pulse" />
                            <p className="text-gray-500">Carregando produtos...</p>
                        </div>
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Package size={48} className="text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhum produto encontrado</p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Produto
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Categoria
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estoque
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Preços
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Ações
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredProducts.map((product) => {
                                    const stockQty = parseFloat(String(product.stock_quantity));
                                    const minStock = parseFloat(String(product.min_stock));
                                    const isLowStock = stockQty <= minStock;

                                    return (
                                        <tr key={product.id} className="hover:bg-gray-50">
                                            {/* Product Info */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                        {product.image_url ? (
                                                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                                                        ) : (
                                                            <Package size={24} className="text-gray-400" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{product.name}</p>
                                                        {product.ean && (
                                                            <p className="text-xs text-gray-500">EAN: {product.ean}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Category */}
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-700">{product.category || 'Sem categoria'}</span>
                                            </td>

                                            {/* Stock */}
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className={`font-medium ${isLowStock ? 'text-red-600' : 'text-gray-900'}`}>
                                                        {stockQty.toFixed(0)} {product.unit}
                                                    </p>
                                                    {isLowStock && (
                                                        <div className="flex items-center gap-1 text-xs text-red-600 mt-1">
                                                            <AlertTriangle size={14} />
                                                            <span>Estoque baixo</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Prices */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm">
                                                    <p className="text-gray-500">Custo: R$ {parseFloat(String(product.cost_price)).toFixed(2)}</p>
                                                    <p className="font-medium text-gray-900">Venda: R$ {parseFloat(String(product.sale_price)).toFixed(2)}</p>
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                        title="Editar produto"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product.id, product.name)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Desativar produto"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="mt-4 text-sm text-gray-500">
                Mostrando {filteredProducts.length} de {products.length} produtos
            </div>

            {/* Modal de Cadastro/Edição */}
            <ProductFormModal
                isOpen={showModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                product={editingProduct}
            />

            {/* Modal de Abertura de Pacote */}
            <OpenPackageModal
                isOpen={showOpenPackageModal}
                onClose={() => setShowOpenPackageModal(false)}
                onSuccess={handleModalSuccess}
            />
        </div>
    );
}
