import { useState, useEffect } from 'react';
import { X, Package, Tag, DollarSign, Layers } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

interface Category {
    id: string;
    name: string;
}

interface ProductFormData {
    id?: string;
    name: string;
    description: string;
    brand: string;
    category_id: string;
    internal_code: string;
    ean: string;
    sku: string;
    cost_price: string;
    sale_price: string;
    stock_quantity: string;
    min_stock: string;
    max_stock: string;
    unit: string;
    image_url: string;
}

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product?: any; // Produto a editar (undefined = cadastro)
}

export default function ProductFormModal({ isOpen, onClose, onSuccess, product }: ProductFormModalProps) {
    const [activeTab, setActiveTab] = useState<'basic' | 'codes' | 'prices' | 'stock'>('basic');
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        brand: '',
        category_id: '',
        internal_code: '',
        ean: '',
        sku: '',
        cost_price: '',
        sale_price: '',
        stock_quantity: '',
        min_stock: '0',
        max_stock: '',
        unit: 'UN',
        image_url: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            loadCategories();

            // Se está editando, preencher dados
            if (product) {
                setFormData({
                    id: product.id,
                    name: product.name || '',
                    description: product.description || '',
                    brand: product.brand || '',
                    category_id: product.category_id || '',
                    internal_code: product.internal_code || '',
                    ean: product.ean || '',
                    sku: product.sku || '',
                    cost_price: product.cost_price ? parseFloat(String(product.cost_price)).toFixed(2) : '',
                    sale_price: product.sale_price ? parseFloat(String(product.sale_price)).toFixed(2) : '',
                    stock_quantity: product.stock_quantity ? String(product.stock_quantity) : '',
                    min_stock: product.min_stock ? String(product.min_stock) : '0',
                    max_stock: product.max_stock ? String(product.max_stock) : '',
                    unit: product.unit || 'UN',
                    image_url: product.image_url || '',
                });
            } else {
                // Reset para cadastro
                setFormData({
                    name: '',
                    description: '',
                    brand: '',
                    category_id: '',
                    internal_code: '',
                    ean: '',
                    sku: '',
                    cost_price: '',
                    sale_price: '',
                    stock_quantity: '',
                    min_stock: '0',
                    max_stock: '',
                    unit: 'UN',
                    image_url: '',
                });
            }
            setErrors({});
            setActiveTab('basic');
        }
    }, [isOpen, product]);

    const loadCategories = async () => {
        try {
            const response = await fetch(`${API_URL}/categories`);
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    };

    const handleChange = (field: keyof ProductFormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Limpar erro do campo ao digitar
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        // Validações aba Basic
        if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
        if (!formData.category_id) newErrors.category_id = 'Categoria é obrigatória';

        // Validações aba Prices
        const costPrice = parseFloat(formData.cost_price);
        const salePrice = parseFloat(formData.sale_price);

        if (!formData.cost_price || isNaN(costPrice) || costPrice <= 0) {
            newErrors.cost_price = 'Preço de custo válido é obrigatório';
        }
        if (!formData.sale_price || isNaN(salePrice) || salePrice <= 0) {
            newErrors.sale_price = 'Preço de venda válido é obrigatório';
        }
        if (costPrice && salePrice && salePrice <= costPrice) {
            newErrors.sale_price = 'Preço de venda deve ser maior que custo';
        }

        // Validações aba Stock (apenas no cadastro)
        if (!product) { // Cadastro
            const stockQty = parseFloat(formData.stock_quantity);
            if (!formData.stock_quantity || isNaN(stockQty) || stockQty < 0) {
                newErrors.stock_quantity = 'Quantidade de estoque inicial é obrigatória';
            }
        }

        const minStock = parseFloat(formData.min_stock);
        if (isNaN(minStock) || minStock < 0) {
            newErrors.min_stock = 'Estoque mínimo inválido';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            // Navegar para aba com erro
            if (errors.name || errors.category_id) {
                setActiveTab('basic');
                alert('Por favor, preencha todos os campos obrigatórios na aba "Informações Básicas"');
            } else if (errors.cost_price || errors.sale_price) {
                setActiveTab('prices');
                alert('Por favor, corrija os erros na aba "Preços"');
            } else if (errors.stock_quantity || errors.min_stock) {
                setActiveTab('stock');
                alert('Por favor, corrija os erros na aba "Estoque"');
            } else {
                alert('Por favor, corrija os erros no formulário');
            }
            return;
        }

        try {
            setLoading(true);

            const payload: any = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                brand: formData.brand.trim() || null,
                category_id: formData.category_id,  // ✅ snake_case
                internal_code: formData.internal_code.trim() || null,  // ✅ snake_case
                ean: formData.ean.trim() || null,
                sku: formData.sku.trim() || null,
                cost_price: parseFloat(formData.cost_price),  // ✅ snake_case
                sale_price: parseFloat(formData.sale_price),  // ✅ snake_case
                min_stock: parseFloat(formData.min_stock),    // ✅ snake_case
                max_stock: formData.max_stock ? parseFloat(formData.max_stock) : null,  // ✅ snake_case
                unit: formData.unit,
                image_url: formData.image_url.trim() || null,  // ✅ snake_case
            };

            // Apenas no cadastro enviar stock_quantity
            if (!product) {
                payload.stock_quantity = parseFloat(formData.stock_quantity);  // ✅ snake_case
            }

            const url = product
                ? `${API_URL}/products/${product.id}`
                : `${API_URL}/products`;

            const method = product ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar produto');
            }

            alert(product ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar produto:', error);
            alert(error.message || 'Erro ao salvar produto');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const tabs = [
        { id: 'basic', label: 'Informações Básicas', icon: Package },
        { id: 'codes', label: 'Códigos', icon: Tag },
        { id: 'prices', label: 'Preços', icon: DollarSign },
        { id: 'stock', label: 'Estoque', icon: Layers },
    ] as const;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {product ? 'Editar Produto' : 'Novo Produto'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 font-medium'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <Icon size={18} />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                    {/* Aba: Informações Básicas */}
                    {activeTab === 'basic' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nome do Produto <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => handleChange('name', e.target.value)}
                                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Ex: Ração Premium para Cães"
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descrição
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Descrição detalhada do produto"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Marca
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.brand}
                                        onChange={(e) => handleChange('brand', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Ex: Royal Canin"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Categoria <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.category_id}
                                        onChange={(e) => handleChange('category_id', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.category_id ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                    >
                                        <option value="">Selecione...</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    URL da Imagem
                                </label>
                                <input
                                    type="text"
                                    value={formData.image_url}
                                    onChange={(e) => handleChange('image_url', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="https://exemplo.com/imagem.jpg"
                                />
                            </div>
                        </div>
                    )}

                    {/* Aba: Códigos */}
                    {activeTab === 'codes' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código Interno
                                </label>
                                <input
                                    type="text"
                                    value={formData.internal_code}
                                    onChange={(e) => handleChange('internal_code', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Ex: PROD-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    EAN / Código de Barras
                                </label>
                                <input
                                    type="text"
                                    value={formData.ean}
                                    onChange={(e) => handleChange('ean', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Ex: 7891234567890"
                                    maxLength={13}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    SKU
                                </label>
                                <input
                                    type="text"
                                    value={formData.sku}
                                    onChange={(e) => handleChange('sku', e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Ex: RC-ADULT-15KG"
                                />
                            </div>
                        </div>
                    )}

                    {/* Aba: Preços */}
                    {activeTab === 'prices' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Preço de Custo (R$) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.cost_price}
                                        onChange={(e) => handleChange('cost_price', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.cost_price ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0.00"
                                    />
                                    {errors.cost_price && <p className="text-red-500 text-sm mt-1">{errors.cost_price}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Preço de Venda (R$) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.sale_price}
                                        onChange={(e) => handleChange('sale_price', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.sale_price ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0.00"
                                    />
                                    {errors.sale_price && <p className="text-red-500 text-sm mt-1">{errors.sale_price}</p>}
                                </div>
                            </div>

                            {formData.cost_price && formData.sale_price && (
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-blue-900">
                                        Margem de Lucro:{' '}
                                        {(
                                            ((parseFloat(formData.sale_price) - parseFloat(formData.cost_price)) /
                                                parseFloat(formData.cost_price)) *
                                            100
                                        ).toFixed(2)}
                                        %
                                    </p>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Lucro por unidade: R$ {(parseFloat(formData.sale_price) - parseFloat(formData.cost_price)).toFixed(2)}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Aba: Estoque */}
                    {activeTab === 'stock' && (
                        <div className="space-y-4">
                            {product && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                                    <p className="text-sm text-yellow-800">
                                        ⚠️ <strong>Atenção:</strong> A quantidade em estoque não pode ser editada aqui.
                                        Use a funcionalidade de <strong>Movimentações de Estoque</strong> para ajustar o estoque.
                                    </p>
                                </div>
                            )}

                            {!product && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantidade Inicial <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.stock_quantity}
                                        onChange={(e) => handleChange('stock_quantity', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.stock_quantity ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0"
                                    />
                                    {errors.stock_quantity && <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>}
                                </div>
                            )}

                            {product && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantidade Atual (Somente Leitura)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.stock_quantity}
                                        disabled
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estoque Mínimo <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.min_stock}
                                        onChange={(e) => handleChange('min_stock', e.target.value)}
                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.min_stock ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        placeholder="0"
                                    />
                                    {errors.min_stock && <p className="text-red-500 text-sm mt-1">{errors.min_stock}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Estoque Máximo
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.max_stock}
                                        onChange={(e) => handleChange('max_stock', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        placeholder="Opcional"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Unidade
                                    </label>
                                    <select
                                        value={formData.unit}
                                        onChange={(e) => handleChange('unit', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    >
                                        <option value="UN">UN (Unidade)</option>
                                        <option value="KG">KG (Quilograma)</option>
                                        <option value="L">L (Litro)</option>
                                        <option value="M">M (Metro)</option>
                                        <option value="CX">CX (Caixa)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Salvando...' : product ? 'Atualizar' : 'Cadastrar'}
                    </button>
                </div>
            </div>
        </div>
    );
}
