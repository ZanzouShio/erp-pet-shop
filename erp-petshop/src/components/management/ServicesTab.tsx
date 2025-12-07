import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Check, Search, Scissors, DollarSign } from 'lucide-react';
import { managementService } from '../../services/managementService';
import type { GroomingService } from '../../services/managementService';
import ServiceMatrixModal from './ServiceMatrixModal';

export default function ServicesTab() {
    const [services, setServices] = useState<GroomingService[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<GroomingService | null>(null);
    const [managingMatrixService, setManagingMatrixService] = useState<GroomingService | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        base_price: 0,
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await managementService.listServices();
            setServices(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (service?: GroomingService) => {
        if (service) {
            setEditingService(service);
            setFormData({
                name: service.name,
                description: service.description || '',
                base_price: Number(service.base_price),
                is_active: service.is_active
            });
        } else {
            setEditingService(null);
            setFormData({
                name: '',
                description: '',
                base_price: 0,
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingService) {
                await managementService.updateService(editingService.id, formData);
            } else {
                await managementService.createService(formData);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este serviço?')) return;
        try {
            const res = await managementService.deleteService(id);
            if (res.message) alert(res.message);
            loadData();
        } catch (error) {
            console.error(error);
            alert('Erro ao remover');
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div>
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar serviços..."
                        className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
                >
                    <Plus size={18} /> Novo Serviço
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {services.map(service => (
                        <div key={service.id} className={`border rounded-xl p-4 bg-white shadow-sm flex flex-col justify-between ${!service.is_active ? 'opacity-60 bg-gray-50' : ''}`}>
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-gray-900">{service.name}</h3>
                                    {!service.is_active && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Inativo</span>}
                                </div>
                                <p className="text-sm text-gray-500 mb-4 h-10 line-clamp-2">{service.description || 'Sem descrição'}</p>

                                <div className="flex items-center gap-2 text-green-600 font-bold text-lg">
                                    <DollarSign size={20} />
                                    {Number(service.base_price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                                <button
                                    onClick={() => setManagingMatrixService(service)}
                                    className="p-2 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    title="Configurar Preços/Prazos por Porte"
                                >
                                    <DollarSign size={18} />
                                </button>
                                <button
                                    onClick={() => handleOpenModal(service)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(service.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                        <div className="flex justify-between items-center p-6 border-b">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Serviço</label>
                                <input
                                    required
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    rows={3}
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$)</label>
                                <input
                                    type="number" step="0.01" min="0"
                                    required
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.base_price}
                                    onChange={e => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Este valor pode variar conforme porte/pelo na Matriz de Preços.</p>
                            </div>

                            {editingService && (
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="is_active"
                                        checked={formData.is_active}
                                        onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 rounded"
                                    />
                                    <label htmlFor="is_active" className="text-sm text-gray-700">Serviço Ativo</label>
                                </div>
                            )}

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

            {/* Matrix Modal */}
            {managingMatrixService && (
                <ServiceMatrixModal
                    service={managingMatrixService}
                    onClose={() => setManagingMatrixService(null)}
                />
            )}
        </div>
    );
}
