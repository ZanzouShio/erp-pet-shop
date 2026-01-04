import { useState, useEffect } from 'react';
import { X, Package, Tag, DollarSign, Layers, Scale, PackageOpen, Plus } from 'lucide-react';

import { API_URL, authFetch } from '../services/api';
import OpenPackageModal from './OpenPackageModal';
import CategoryFormModal from './CategoryFormModal';
import { useToast } from './Toast';
import ImagePicker from './ImagePicker';

interface Category {
    id: string;
    name: string;
}

interface Supplier {
    id: string;
    company_name: string;
    trade_name?: string;
}

interface ProductFormData {
    id?: string;
    name: string;
    description: string;
    brand: string;
    category_id: string;
    supplier_id: string;
    internal_code: string;
    ean: string;
    sku: string;
    cost_price: string;
    sale_price: string;
    profit_margin: string;
    stock_quantity: string;
    min_stock: string;
    max_stock: string;
    unit: string;
    image_url: string;
    // Bulk fields
    create_bulk: boolean;
    bulk_conversion_factor: string;
    bulk_unit: string;
    bulk_price: string;
}

interface ProductFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    product?: any;
    initialParentId?: string;
}

export default function ProductFormModal({ isOpen, onClose, onSuccess, product }: ProductFormModalProps) {
    const [activeTab, setActiveTab] = useState<'basic' | 'codes' | 'prices' | 'stock' | 'bulk'>('basic');
    const [categories, setCategories] = useState<Category[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(false);
    const [showOpenPackageModal, setShowOpenPackageModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const toast = useToast();

    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        description: '',
        brand: '',
        category_id: '',
        supplier_id: '',
        internal_code: '',
        ean: '',
        sku: '',
        cost_price: '',
        sale_price: '',
        profit_margin: '',
        stock_quantity: '',
        min_stock: '0',
        max_stock: '',
        unit: 'UN',
        image_url: '',
        create_bulk: false,
        bulk_conversion_factor: '',
        bulk_unit: 'KG',
        bulk_price: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            loadCategories();
            loadSuppliers();

            // Se está editando, preencher dados
            if (product) {
                const cost = product.cost_price ? parseFloat(String(product.cost_price)) : 0;
                const sale = product.sale_price ? parseFloat(String(product.sale_price)) : 0;
                let margin = '';

                if (cost > 0 && sale > 0) {
                    margin = (((sale - cost) / cost) * 100).toFixed(2);
                }

                setFormData({
                    id: product.id,
                    name: product.name || '',
                    description: product.description || '',
                    brand: product.brand || '',
                    category_id: product.category_id || '',
                    supplier_id: product.supplier_id || '',
                    internal_code: product.internal_code || '',
                    ean: product.ean || '',
                    sku: product.sku || '',
                    cost_price: cost ? cost.toFixed(2) : '',
                    sale_price: sale ? sale.toFixed(2) : '',
                    profit_margin: margin,
                    stock_quantity: product.stock_quantity ? String(product.stock_quantity) : '',
                    min_stock: product.min_stock ? String(product.min_stock) : '0',
                    max_stock: product.max_stock ? String(product.max_stock) : '',
                    unit: product.unit || 'UN',
                    image_url: product.image_url || '',
                    create_bulk: false,
                    bulk_conversion_factor: '',
                    bulk_unit: 'KG',
                    bulk_price: '',
                });
            } else {
                // Reset para cadastro
                setFormData({
                    name: '',
                    description: '',
                    brand: '',
                    category_id: '',
                    supplier_id: '',
                    internal_code: '',
                    ean: '',
                    sku: '',
                    cost_price: '',
                    sale_price: '',
                    profit_margin: '',
                    stock_quantity: '',
                    min_stock: '0',
                    max_stock: '',
                    unit: 'UN',
                    image_url: '',
                    create_bulk: false,
                    bulk_conversion_factor: '',
                    bulk_unit: 'KG',
                    bulk_price: '',
                });
            }
            setErrors({});
            setActiveTab('basic');
        }
    }, [isOpen, product]);

    const loadCategories = async () => {
        try {
            const response = await authFetch(`${API_URL}/categories`);
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        }
    };

    const loadSuppliers = async () => {
        try {
            const response = await authFetch(`${API_URL}/suppliers`);
            const data = await response.json();
            setSuppliers(data);
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
        }
    };

    const handleChange = (field: keyof ProductFormData, value: any) => {
        let newFormData = { ...formData, [field]: value };

        // Lógica de cálculo de preços
        if (field === 'cost_price') {
            const cost = parseFloat(value);
            const margin = parseFloat(formData.profit_margin);

            if (!isNaN(cost) && !isNaN(margin)) {
                // Se mudou custo e tem margem, recalcula venda
                const sale = cost + (cost * (margin / 100));
                newFormData.sale_price = sale.toFixed(2);
            } else if (!isNaN(cost) && formData.sale_price) {
                // Se mudou custo e tem venda, recalcula margem
                const sale = parseFloat(formData.sale_price);
                if (!isNaN(sale) && cost > 0) {
                    const newMargin = ((sale - cost) / cost) * 100;
                    newFormData.profit_margin = newMargin.toFixed(2);
                }
            }
        } else if (field === 'sale_price') {
            const sale = parseFloat(value);
            const cost = parseFloat(formData.cost_price);

            if (!isNaN(sale) && !isNaN(cost) && cost > 0) {
                // Se mudou venda e tem custo, recalcula margem
                const margin = ((sale - cost) / cost) * 100;
                newFormData.profit_margin = margin.toFixed(2);
            }
        } else if (field === 'profit_margin') {
            const margin = parseFloat(value);
            const cost = parseFloat(formData.cost_price);

            if (!isNaN(margin) && !isNaN(cost)) {
                // Se mudou margem e tem custo, recalcula venda
                const sale = cost + (cost * (margin / 100));
                newFormData.sale_price = sale.toFixed(2);
            }
        }

        setFormData(newFormData);

        // Limpar erro do campo ao digitar
        if (errors[field as string]) {
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

        // Validações aba Bulk
        if (formData.create_bulk) {
            const factor = parseFloat(formData.bulk_conversion_factor);
            if (!formData.bulk_conversion_factor || isNaN(factor) || factor <= 0) {
                newErrors.bulk_conversion_factor = 'Fator de conversão inválido';
            }
            if (!formData.bulk_unit) {
                newErrors.bulk_unit = 'Unidade a granel obrigatória';
            }
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
                toast.error('Por favor, preencha todos os campos obrigatórios na aba "Informações Básicas"');
            } else if (errors.cost_price || errors.sale_price) {
                setActiveTab('prices');
                toast.error('Por favor, corrija os erros na aba "Preços"');
            } else if (errors.stock_quantity || errors.min_stock) {
                setActiveTab('stock');
                toast.error('Por favor, corrija os erros na aba "Estoque"');
            } else if (errors.bulk_conversion_factor || errors.bulk_unit) {
                setActiveTab('bulk');
                toast.error('Por favor, corrija os erros na aba "Venda a Granel"');
            } else {
                toast.error('Por favor, corrija os erros no formulário');
            }
            return;
        }

        try {
            setLoading(true);

            const payload: any = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                brand: formData.brand.trim() || null,
                category_id: formData.category_id,
                supplier_id: formData.supplier_id || null, // Optional
                internal_code: formData.internal_code.trim() || null,
                ean: formData.ean.trim() || null,
                sku: formData.sku.trim() || null,
                cost_price: parseFloat(formData.cost_price),
                sale_price: parseFloat(formData.sale_price),
                min_stock: parseFloat(formData.min_stock),
                max_stock: formData.max_stock ? parseFloat(formData.max_stock) : null,
                unit: formData.unit,
                image_url: formData.image_url.trim() || null,
            };

            // Apenas no cadastro enviar stock_quantity
            if (!product) {
                payload.stock_quantity = parseFloat(formData.stock_quantity);
            }

            // Enviar dados de granel se marcado (tanto criação quanto edição)
            if (formData.create_bulk) {
                payload.create_bulk = true;
                payload.bulk_conversion_factor = parseFloat(formData.bulk_conversion_factor);
                payload.bulk_unit = formData.bulk_unit;
                payload.bulk_price = formData.bulk_price ? parseFloat(formData.bulk_price) : null;
            }

            const url = product
                ? `${API_URL}/products/${product.id}`
                : `${API_URL}/products`;

            const method = product ? 'PUT' : 'POST';

            const response = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao salvar produto');
            }

            toast.success(product ? 'Produto atualizado com sucesso!' : 'Produto cadastrado com sucesso!');
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Erro ao salvar produto:', error);
            toast.error(error.message || 'Erro ao salvar produto');
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

    // Adicionar aba de granel se não tiver filhos e não for filho
    const canCreateBulk = !product || (product && (!product.children || product.children.length === 0) && !product.parent_id);

    const allTabs = canCreateBulk
        ? [...tabs, { id: 'bulk', label: 'Venda a Granel', icon: Scale }]
        : tabs;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {product ? 'Editar Produto' : 'Novo Produto'}
                        </h2>
                        {product?.parent_name && (
                            <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1 text-sm text-indigo-600">
                                    <Layers size={14} />
                                    <span>Vinculado ao pai: <strong>{product.parent_name}</strong></span>
                                </div>
                                <button
                                    onClick={() => setShowOpenPackageModal(true)}
                                    className="flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded border border-indigo-200 hover:bg-indigo-100 transition-colors"
                                >
                                    <PackageOpen size={12} />
                                    Abrir Pacote
                                </button>
                            </div>
                        )}
                        {product?.children && product.children.length > 0 && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-green-600">
                                <Scale size={14} />
                                <span>Possui {product.children.length} produto(s) a granel vinculado(s)</span>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 px-6 overflow-x-auto scrollbar-hide">
                    {allTabs.map((tab) => {
                        const Icon = tab.icon;
                        // @ts-ignore
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                // @ts-ignore
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${isActive
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
                    {
                        activeTab === 'basic' && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Coluna Esquerda: Informações Principais */}
                                    <div className="lg:col-span-2 space-y-4">
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
                                                rows={5}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Descrição detalhada do produto"
                                            />
                                        </div>
                                    </div>

                                    {/* Coluna Direita: Imagem */}
                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Imagem do Produto
                                        </label>
                                        <ImagePicker
                                            value={formData.image_url}
                                            onChange={(url) => handleChange('image_url', url)}
                                        />
                                    </div>
                                </div>

                                {/* Linha Inferior: Metadados */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
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
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.category_id}
                                                onChange={(e) => handleChange('category_id', e.target.value)}
                                                className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.category_id ? 'border-red-500' : 'border-gray-300'
                                                    }`}
                                            >
                                                <option value="">Selecione...</option>
                                                {categories.map((cat) => (
                                                    <option key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setShowCategoryModal(true)}
                                                className="p-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                                title="Nova Categoria"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                        {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Fornecedor Principal
                                        </label>
                                        <select
                                            value={formData.supplier_id}
                                            onChange={(e) => handleChange('supplier_id', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                        >
                                            <option value="">Selecione...</option>
                                            {suppliers.map((s) => (
                                                <option key={s.id} value={s.id}>
                                                    {s.trade_name || s.company_name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    {/* Aba: Códigos */}
                    {
                        activeTab === 'codes' && (
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
                        )
                    }

                    {/* Aba: Preços */}
                    {
                        activeTab === 'prices' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
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
                                            Margem de Lucro (%)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={formData.profit_margin}
                                            onChange={(e) => handleChange('profit_margin', e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="0.00"
                                        />
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
                                            Resumo do Cálculo:
                                        </p>
                                        <p className="text-sm text-blue-700 mt-1">
                                            Lucro por unidade: R$ {(parseFloat(formData.sale_price) - parseFloat(formData.cost_price)).toFixed(2)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )
                    }

                    {/* Aba: Estoque */}
                    {
                        activeTab === 'stock' && (
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
                        )
                    }

                    {/* Aba: Venda a Granel */}
                    {
                        activeTab === 'bulk' && canCreateBulk && (
                            <div className="space-y-6">
                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Scale className="text-indigo-600 mt-1" size={24} />
                                        <div>
                                            <h3 className="font-medium text-indigo-900">Venda a Granel Automática</h3>
                                            <p className="text-sm text-indigo-700 mt-1">
                                                Ao ativar esta opção, o sistema criará automaticamente um segundo produto
                                                vinculado a este, permitindo a venda fracionada (a granel) e o controle
                                                de estoque através da abertura de pacotes.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="create_bulk"
                                        checked={formData.create_bulk}
                                        onChange={(e) => handleChange('create_bulk', e.target.checked)}
                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500 border-gray-300"
                                    />
                                    <label htmlFor="create_bulk" className="font-medium text-gray-900 select-none cursor-pointer">
                                        Gerar produto a granel para este item
                                    </label>
                                </div>

                                {formData.create_bulk && (
                                    <div className="space-y-4 pl-7 border-l-2 border-indigo-100 ml-2.5">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Fator de Conversão <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.001"
                                                        min="0.001"
                                                        value={formData.bulk_conversion_factor}
                                                        onChange={(e) => handleChange('bulk_conversion_factor', e.target.value)}
                                                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${errors.bulk_conversion_factor ? 'border-red-500' : 'border-gray-300'
                                                            }`}
                                                        placeholder="Ex: 15"
                                                    />
                                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                                        <span className="text-gray-500 sm:text-sm">
                                                            {formData.unit} ➔ {formData.bulk_unit}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Ex: Se o pacote tem 15kg, digite 15.
                                                </p>
                                                {errors.bulk_conversion_factor && <p className="text-red-500 text-sm mt-1">{errors.bulk_conversion_factor}</p>}
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Unidade a Granel <span className="text-red-500">*</span>
                                                </label>
                                                <select
                                                    value={formData.bulk_unit}
                                                    onChange={(e) => handleChange('bulk_unit', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                >
                                                    <option value="KG">KG (Quilograma)</option>
                                                    <option value="L">L (Litro)</option>
                                                    <option value="M">M (Metro)</option>
                                                    <option value="UN">UN (Unidade)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Preço de Venda a Granel (por {formData.bulk_unit})
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={formData.bulk_price}
                                                onChange={(e) => handleChange('bulk_price', e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                                placeholder="Opcional (será R$ 0.00 se vazio)"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">
                                                Defina o preço de venda para cada {formData.bulk_unit} do produto a granel.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    }
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

            {/* Modal de Abertura de Pacote (Aninhado) */}
            <OpenPackageModal
                isOpen={showOpenPackageModal}
                onClose={() => setShowOpenPackageModal(false)}
                onSuccess={() => {
                    onSuccess(); // Recarregar lista de produtos
                    // Opcional: Fechar o modal de edição também, ou manter aberto
                }}
                initialParentId={product?.parent_product_id}
            />

            {/* Modal de Nova Categoria (Aninhado) */}
            <CategoryFormModal
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onSuccess={async () => {
                    // Recarregar categorias
                    await loadCategories();
                    setShowCategoryModal(false);
                }}
            />
        </div>
    );
}
