import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, Search, Package } from 'lucide-react';
import { managementService } from '../../services/managementService';
import type { GroomingResource } from '../../services/managementService';

export default function ResourcesTab() {
    const [resources, setResources] = useState<GroomingResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<GroomingResource | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        type: 'BANHEIRA',
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await managementService.listResources();
            setResources(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (resource?: GroomingResource) => {
        if (resource) {
            setEditingResource(resource);
            setFormData({
                name: resource.name,
                type: resource.type,
                is_active: resource.is_active
            });
        } else {
            setEditingResource(null);
            setFormData({
                name: '',
                type: 'BANHEIRA',
                is_active: true
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingResource) {
                await managementService.updateResource(editingResource.id, formData as any);
            } else {
                await managementService.createResource(formData as any);
            }
            setIsModalOpen(false);
            loadData();
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover este recurso?')) return;
        try {
            await managementService.deleteResource(id);
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
                        placeholder="Buscar recursos..."
                        className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-sm"
                >
                    <Plus size={18} /> Novo Recurso
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-10 text-gray-500">Carregando...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {resources.map(resource => (
                        <div key={resource.id} className="border rounded-xl p-4 bg-white shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${resource.type === 'BANHEIRA' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">{resource.name}</h3>
                                    <span className="text-xs text-gray-500 font-medium px-2 py-0.5 bg-gray-100 rounded-full">{resource.type}</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleOpenModal(resource)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(resource.id)}
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
                                {editingResource ? 'Editar Recurso' : 'Novo Recurso'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Recurso</label>
                                <input
                                    required
                                    placeholder="Ex: Banheira 01"
                                    className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                <select
                                    className="w-full border rounded-lg p-2"
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="BANHEIRA">BANHEIRA</option>
                                    <option value="MESA">MESA</option>
                                    <option value="SECADOR">SECADOR</option>
                                    <option value="OUTRO">OUTRO</option>
                                </select>
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
