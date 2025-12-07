import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Search } from 'lucide-react';
import { managementService } from '../../services/managementService';
import type { Groomer } from '../../services/managementService';

export default function ProfessionalsTab() {
    const [groomers, setGroomers] = useState<Groomer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingGroomer, setEditingGroomer] = useState<Groomer | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        seniority_level: 'JUNIOR',
        speed_factor: 1.0,
        commission_rate: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await managementService.listGroomers();
            setGroomers(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (groomer?: Groomer) => {
        if (groomer) {
            setEditingGroomer(groomer);
            setFormData({
                name: groomer.name,
                email: groomer.email,
                seniority_level: groomer.seniority_level,
                speed_factor: Number(groomer.speed_factor), // Ensure number
                commission_rate: Number(groomer.commission_rate)
            });
        } else {
            setEditingGroomer(null);
            setFormData({
                name: '',
                email: '',
                seniority_level: 'JUNIOR',
                speed_factor: 1.0,
                commission_rate: 0
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingGroomer) {
                await managementService.updateGroomer(editingGroomer.id, formData as any);
            } else {
                await managementService.createGroomer(formData as any);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.error || 'Erro ao salvar';
            alert(msg);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este profissional?')) return;
        try {
            await managementService.deleteGroomer(id);
            loadData();
        } catch (error) {
            console.error(error);
            alert('Erro ao remover');
        }
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar profissionais..."
                        className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
                >
                    <Plus size={18} /> Novo Profissional
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Carregando...</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wide">
                                <th className="p-4 rounded-tl-lg font-semibold">Nome</th>
                                <th className="p-4 font-semibold">Nível</th>
                                <th className="p-4 font-semibold">Fator Velocidade</th>
                                <th className="p-4 font-semibold">Comissão (%)</th>
                                <th className="p-4 rounded-tr-lg font-semibold text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {groomers.map(groomer => (
                                <tr key={groomer.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-medium text-gray-900">{groomer.name}</div>
                                        <div className="text-xs text-gray-500">{groomer.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                                            ${groomer.seniority_level === 'SENIOR' ? 'bg-purple-100 text-purple-700' :
                                                groomer.seniority_level === 'MID' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-green-100 text-green-700'}
                                        `}>
                                            {groomer.seniority_level}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600">{groomer.speed_factor}x</td>
                                    <td className="p-4 text-gray-600">{groomer.commission_rate}%</td>
                                    <td className="p-4 text-right flex justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenModal(groomer)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(groomer.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingGroomer ? 'Editar Profissional' : 'Novo Profissional'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    required
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    required
                                    type="email"
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nível</label>
                                    <select
                                        className="w-full border rounded-lg p-2"
                                        value={formData.seniority_level}
                                        onChange={e => setFormData({ ...formData, seniority_level: e.target.value })}
                                    >
                                        <option value="JUNIOR">JUNIOR</option>
                                        <option value="MID">MID</option>
                                        <option value="SENIOR">SENIOR</option>
                                        <option value="EXPERT">EXPERT</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Velocidade (x)</label>
                                    <input
                                        type="number" step="0.1" min="0.5"
                                        className="w-full border rounded-lg p-2"
                                        value={formData.speed_factor}
                                        onChange={e => setFormData({ ...formData, speed_factor: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Comissão (%)</label>
                                <input
                                    type="number" step="0.5" min="0" max="100"
                                    className="w-full border rounded-lg p-2"
                                    value={formData.commission_rate}
                                    onChange={e => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) })}
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-sm">
                                    Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
