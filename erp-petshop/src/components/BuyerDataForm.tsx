import { useState, useEffect } from 'react';
import { maskCEP, unmask, maskCPF, maskCNPJ } from '../utils/masks';

interface BuyerDataFormProps {
    onSubmit: (data: any) => void;
    onCancel: () => void;
    initialData?: any;
}

export default function BuyerDataForm({ onSubmit, onCancel, initialData }: BuyerDataFormProps) {
    const [type, setType] = useState<'PF' | 'PJ'>('PF');
    const [formData, setFormData] = useState({
        cpf: '',
        name: '',
        surname: '',
        cnpj: '',
        corporateName: '', // Razão Social
        stateRegistration: '', // Inscrição Estadual
        zipCode: '',
        state: '',
        city: '',
        neighborhood: '',
        street: '',
        number: '',
        complement: '',
        noNumber: false
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
            if (initialData.cnpj) setType('PJ');
        }
    }, [initialData]);

    const handleCepBlur = async () => {
        const cleanCep = unmask(formData.zipCode);
        if (cleanCep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
                if (!data.erro) {
                    setFormData(prev => ({
                        ...prev,
                        street: data.logradouro,
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ ...formData, type });
    };

    return (
        <div className="p-6">
            <div className="flex border-b mb-6">
                <button
                    type="button"
                    onClick={() => setType('PF')}
                    className={`px-6 py-3 font-medium text-sm ${type === 'PF' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pessoa Física
                </button>
                <button
                    type="button"
                    onClick={() => setType('PJ')}
                    className={`px-6 py-3 font-medium text-sm ${type === 'PJ' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                >
                    Pessoa Jurídica
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {type === 'PF' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.cpf}
                                onChange={e => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                                placeholder="000.000.000-00"
                            />
                            <p className="text-xs text-gray-500 mt-1">Será usado somente para emitir a nota fiscal.</p>
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome (Opcional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sobrenome (Opcional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.surname}
                                onChange={e => setFormData({ ...formData, surname: e.target.value })}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.cnpj}
                                onChange={e => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                                placeholder="00.000.000/0000-00"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual (Opcional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.stateRegistration}
                                onChange={e => setFormData({ ...formData, stateRegistration: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.corporateName}
                                onChange={e => setFormData({ ...formData, corporateName: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-4">Endereço de faturamento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CEP (Opcional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.zipCode}
                                onChange={e => setFormData({ ...formData, zipCode: maskCEP(e.target.value) })}
                                onBlur={handleCepBlur}
                                placeholder="00000-000"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estado (Opcional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.state}
                                onChange={e => setFormData({ ...formData, state: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cidade (Opcional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bairro (Opcional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.neighborhood}
                                onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rua/Avenida (Opcional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.street}
                                onChange={e => setFormData({ ...formData, street: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Informe somente o nome da rua ou avenida.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Número (Opcional)</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100"
                                    value={formData.number}
                                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    disabled={formData.noNumber}
                                />
                                <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap">
                                    <input
                                        type="checkbox"
                                        checked={formData.noNumber}
                                        onChange={e => setFormData({ ...formData, noNumber: e.target.checked, number: e.target.checked ? 'S/N' : '' })}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    Sem número
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Complemento (Opcional)</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.complement}
                                onChange={e => setFormData({ ...formData, complement: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                        Continuar
                    </button>
                </div>
            </form>
        </div>
    );
}
