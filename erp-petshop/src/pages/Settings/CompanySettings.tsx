import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Building2, MapPin, Phone, Upload, ArrowLeft } from 'lucide-react';
import { API_URL } from '../../services/api';
import { maskCNPJ, maskPhone, maskCEP } from '../../utils/masks';

export default function CompanySettings() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        company_name: '',
        trade_name: '',
        cnpj: '',
        state_registration: '',
        email: '',
        phone: '',
        zip_code: '',
        address: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        logo_url: '',
        loyalty_enabled: false,
        cashback_enabled: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch(`${API_URL}/settings`);
            const data = await response.json();

            // Convert nulls to empty strings
            const sanitizedData = Object.keys(data).reduce((acc, key) => {
                acc[key] = data[key] === null ? '' : data[key];
                return acc;
            }, {} as any);

            setFormData(prev => ({ ...prev, ...sanitizedData }));
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let finalValue = value;

        if (name === 'cnpj') finalValue = maskCNPJ(value);
        if (name === 'phone') finalValue = maskPhone(value);
        if (name === 'zip_code') finalValue = maskCEP(value);

        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleBlurCEP = async () => {
        const cep = formData.zip_code.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await res.json();
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Configurações salvas com sucesso!');
            } else {
                throw new Error('Erro ao salvar');
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Carregando...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/settings/business')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Voltar"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <Building2 className="text-blue-600" />
                    Dados da Empresa
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Básicos */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">Identificação</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                            <input
                                type="text"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                            <input
                                type="text"
                                name="trade_name"
                                value={formData.trade_name}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                            <input
                                type="text"
                                name="cnpj"
                                value={formData.cnpj}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
                            <input
                                type="text"
                                name="state_registration"
                                value={formData.state_registration}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                    </div>
                </div>

                {/* Contato e Logo */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2 flex items-center gap-2">
                        <Phone size={20} /> Contato & Logo
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                            <input
                                type="text"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">URL do Logo</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    name="logo_url"
                                    value={formData.logo_url}
                                    onChange={handleChange}
                                    placeholder="https://exemplo.com/logo.png"
                                    className="w-full p-2 border rounded-lg"
                                />
                                {formData.logo_url && (
                                    <img src={formData.logo_url} alt="Logo Preview" className="h-10 w-10 object-contain border rounded" />
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Cole o link direto da imagem do seu logo.</p>
                        </div>
                    </div>
                </div>

                {/* Endereço */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2 flex items-center gap-2">
                        <MapPin size={20} /> Endereço
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                            <input
                                type="text"
                                name="zip_code"
                                value={formData.zip_code}
                                onChange={handleChange}
                                onBlur={handleBlurCEP}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Logradouro</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                            <input
                                type="text"
                                name="number"
                                value={formData.number}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                            <input
                                type="text"
                                name="neighborhood"
                                value={formData.neighborhood}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full p-2 border rounded-lg"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
                            <input
                                type="text"
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                maxLength={2}
                                className="w-full p-2 border rounded-lg uppercase"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </form>
        </div>
    );
}
