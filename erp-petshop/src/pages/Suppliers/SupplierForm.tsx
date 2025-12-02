import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import { API_URL } from '../../services/api';
import { maskCNPJ, maskPhone, maskMobile, maskCEP, unmask } from '../../utils/masks';
import { validateCNPJ } from '../../utils/validators';

interface SupplierFormData {
    company_name: string;
    trade_name: string;
    cnpj: string;
    email: string;
    phone: string;
    mobile: string;
    website: string;
    zip_code: string;
    address: string;
    number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    payment_terms: string;
    discount_for_early_payment: string;
    rating: string;
    status: string;
    notes: string;
    products?: any[];
    id?: string;
    created_at?: string;
    updated_at?: string;
}

const initialData: SupplierFormData = {
    company_name: '',
    trade_name: '',
    cnpj: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    zip_code: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    payment_terms: '',
    discount_for_early_payment: '',
    rating: '0',
    status: 'active',
    notes: ''
};

export default function SupplierForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [formData, setFormData] = useState<SupplierFormData>(initialData);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) {
            loadSupplier(id);
        }
    }, [id]);

    const loadSupplier = async (supplierId: string) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/suppliers/${supplierId}`);
            if (!response.ok) throw new Error('Falha ao carregar fornecedor');
            const data = await response.json();
            setFormData({
                ...data,
                trade_name: data.trade_name || '',
                email: data.email || '',
                phone: maskPhone(data.phone || ''),
                mobile: maskMobile(data.mobile || ''),
                website: data.website || '',
                zip_code: data.zip_code || '',
                address: data.address || '',
                number: data.number || '',
                complement: data.complement || '',
                neighborhood: data.neighborhood || '',
                city: data.city || '',
                state: data.state || '',
                payment_terms: data.payment_terms || '',
                discount_for_early_payment: data.discount_for_early_payment || '',
                rating: data.rating || '0',
                notes: data.notes || ''
            });
        } catch (error) {
            console.error('Erro ao carregar fornecedor:', error);
            alert('Erro ao carregar dados do fornecedor');
            navigate('/admin/suppliers');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateCNPJ(formData.cnpj)) {
            alert('CNPJ inválido! Verifique o número digitado.');
            return;
        }

        setSaving(true);

        try {
            const url = id ? `${API_URL}/suppliers/${id}` : `${API_URL}/suppliers`;
            const method = id ? 'PUT' : 'POST';

            // Preparar dados para envio (remover máscaras e campos desnecessários)
            const payload = {
                ...formData,
                cnpj: unmask(formData.cnpj),
                phone: unmask(formData.phone),
                mobile: unmask(formData.mobile),
                zip_code: unmask(formData.zip_code),
                // Remover campos que não devem ser enviados ou que causam erro no prisma
                products: undefined,
                id: undefined,
                created_at: undefined,
                updated_at: undefined
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao salvar fornecedor');
            }

            alert(id ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!');
            navigate('/admin/suppliers');
        } catch (error: any) {
            console.error('Erro ao salvar:', error);
            alert(error.message || 'Erro ao salvar fornecedor');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let maskedValue = value;

        if (name === 'cnpj') maskedValue = maskCNPJ(value);
        if (name === 'phone') maskedValue = maskPhone(value);
        if (name === 'mobile') maskedValue = maskMobile(value);
        if (name === 'zip_code') maskedValue = maskCEP(value);

        setFormData(prev => ({ ...prev, [name]: maskedValue }));
    };

    const handleCnpjBlur = () => {
        if (formData.cnpj && !validateCNPJ(formData.cnpj)) {
            alert('CNPJ inválido!');
        }
    };

    const handleCepBlur = async () => {
        const cleanCep = unmask(formData.zip_code);
        if (cleanCep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        address: data.logradouro,
                        neighborhood: data.bairro,
                        city: data.localidade,
                        state: data.uf
                    }));
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
            }
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Carregando...</div>;
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/suppliers')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Truck className="text-indigo-600" />
                        {id ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                    </h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Gerais */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Dados Gerais</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ *</label>
                            <input
                                type="text"
                                name="cnpj"
                                required
                                value={formData.cnpj}
                                onChange={handleChange}
                                onBlur={handleCnpjBlur}
                                placeholder="00.000.000/0000-00"
                                maxLength={18}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social *</label>
                            <input
                                type="text"
                                name="company_name"
                                required
                                value={formData.company_name}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                            <input
                                type="text"
                                name="trade_name"
                                value={formData.trade_name}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Contato */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Contato</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Site</label>
                            <input
                                type="text"
                                name="website"
                                value={formData.website}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                maxLength={14}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Celular/WhatsApp</label>
                            <input
                                type="text"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                maxLength={15}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Endereço */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Endereço</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                            <input
                                type="text"
                                name="zip_code"
                                value={formData.zip_code}
                                onChange={handleChange}
                                onBlur={handleCepBlur}
                                maxLength={9}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                            <input
                                type="text"
                                name="number"
                                value={formData.number}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento</label>
                            <input
                                type="text"
                                name="complement"
                                value={formData.complement}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                            <input
                                type="text"
                                name="neighborhood"
                                value={formData.neighborhood}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                maxLength={2}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Condições Comerciais */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Condições Comerciais</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Termos de Pagamento (Formas aceitas)</label>
                            <input
                                type="text"
                                name="payment_terms"
                                value={formData.payment_terms}
                                onChange={handleChange}
                                placeholder="Ex: Boleto 30/60/90, PIX à vista"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Desconto Pagto. Antecipado (%)</label>
                            <input
                                type="number"
                                name="discount_for_early_payment"
                                value={formData.discount_for_early_payment}
                                onChange={handleChange}
                                step="0.01"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Avaliação (0-5)</label>
                            <input
                                type="number"
                                name="rating"
                                value={formData.rating}
                                onChange={handleChange}
                                min="0"
                                max="5"
                                step="0.1"
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                rows={4}
                                className="w-full p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/suppliers')}
                        className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? 'Salvando...' : 'Salvar Fornecedor'}
                    </button>
                </div>
            </form>
        </div>
    );
}
