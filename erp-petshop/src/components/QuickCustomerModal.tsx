import { useState } from 'react';
import { X, Save, User as UserIcon } from 'lucide-react';
import { API_URL, authFetch } from '../services/api';
import { maskCPF, maskMobile } from '../utils/masks';

interface QuickCustomerModalProps {
    onClose: () => void;
    onSuccess: (customer: any) => void;
    initialSearchTerm?: string;
}

export default function QuickCustomerModal({ onClose, onSuccess, initialSearchTerm = '' }: QuickCustomerModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        cpf_cnpj: '',
        phone: '',
        mobile: '',
        email: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await authFetch(`${API_URL}/customers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao cadastrar cliente');
            }

            alert('Cliente cadastrado com sucesso!');
            onSuccess(data);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <UserIcon className="text-blue-600" />
                        Novo Cliente Rápido
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                        <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Opcional se CPF for informado"
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ *</label>
                            <input
                                required
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.cpf_cnpj}
                                onChange={e => setFormData({ ...formData, cpf_cnpj: maskCPF(e.target.value) })}
                                placeholder="000.000.000-00"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Celular / WhatsApp</label>
                            <input
                                type="text"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.mobile}
                                onChange={e => setFormData({ ...formData, mobile: maskMobile(e.target.value) })}
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Opcional)</label>
                        <input
                            type="email"
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            <Save size={18} />
                            {loading ? 'Salvando...' : 'Cadastrar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
