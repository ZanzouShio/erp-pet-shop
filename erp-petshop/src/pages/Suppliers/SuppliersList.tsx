import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Truck, Phone, Mail, MapPin, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../services/api';
import { maskPhone, maskMobile } from '../../utils/masks';
import SupplierProductsModal from './SupplierProductsModal';

interface Supplier {
    id: string;
    company_name: string;
    trade_name: string | null;
    cnpj: string;
    email: string | null;
    phone: string | null;
    mobile?: string | null;
    city: string | null;
    state: string | null;
    status: string;
}

export default function SuppliersList() {
    const navigate = useNavigate();
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSupplierForProducts, setSelectedSupplierForProducts] = useState<Supplier | null>(null);
    const [showProductsModal, setShowProductsModal] = useState(false);

    useEffect(() => {
        loadSuppliers();
    }, []);

    const loadSuppliers = async () => {
        try {
            const response = await fetch(`${API_URL}/suppliers`);
            if (!response.ok) throw new Error('Falha ao carregar fornecedores');
            const data = await response.json();
            setSuppliers(data);
        } catch (error) {
            console.error('Erro ao carregar fornecedores:', error);
            alert('Erro ao carregar fornecedores');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

        try {
            const response = await fetch(`${API_URL}/suppliers/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao excluir fornecedor');
            }

            loadSuppliers();
        } catch (error: any) {
            console.error('Erro ao excluir:', error);
            alert(error.message || 'Erro ao excluir fornecedor');
        }
    };

    const filteredSuppliers = suppliers.filter(s =>
        s.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.trade_name && s.trade_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        s.cnpj.includes(searchTerm)
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Truck className="text-indigo-600" />
                        Fornecedores
                    </h1>
                    <p className="text-gray-500">Gerencie seus parceiros de negócio</p>
                </div>
                <button
                    onClick={() => navigate('/admin/suppliers/new')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={20} />
                    Novo Fornecedor
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, fantasia ou CNPJ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 text-sm">
                            <tr>
                                <th className="p-4 font-medium">Empresa</th>
                                <th className="p-4 font-medium">Contato</th>
                                <th className="p-4 font-medium">Localização</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        Nenhum fornecedor encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((supplier) => (
                                    <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-800">{supplier.company_name}</div>
                                            {supplier.trade_name && (
                                                <div className="text-sm text-gray-500">{supplier.trade_name}</div>
                                            )}
                                            <div className="text-xs text-gray-400 mt-1">CNPJ: {supplier.cnpj}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1 text-sm text-gray-600">
                                                {supplier.email && (
                                                    <div className="flex items-center gap-1">
                                                        <Mail size={14} /> {supplier.email}
                                                    </div>
                                                )}
                                                {supplier.phone && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone size={14} /> {maskPhone(supplier.phone)}
                                                    </div>
                                                )}
                                                {supplier.mobile && (
                                                    <div className="flex items-center gap-1">
                                                        <Phone size={14} /> {maskMobile(supplier.mobile)}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {supplier.city && supplier.state ? (
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={14} />
                                                    {supplier.city}/{supplier.state}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${supplier.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {supplier.status === 'active' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/suppliers/${supplier.id}`)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedSupplierForProducts(supplier);
                                                        setShowProductsModal(true);
                                                    }}
                                                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                    title="Ver Produtos"
                                                >
                                                    <Package size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(supplier.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <SupplierProductsModal
                isOpen={showProductsModal}
                onClose={() => setShowProductsModal(false)}
                supplierId={selectedSupplierForProducts?.id || null}
                supplierName={selectedSupplierForProducts?.company_name || ''}
            />
        </div>
    );
}
