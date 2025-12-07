import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Clock, DollarSign } from 'lucide-react';
import { managementService } from '../../services/managementService';
import type { GroomingService, ServiceMatrixEntry } from '../../services/managementService';

interface ServiceMatrixModalProps {
    service: GroomingService;
    onClose: () => void;
}

export default function ServiceMatrixModal({ service, onClose }: ServiceMatrixModalProps) {
    const [matrix, setMatrix] = useState<ServiceMatrixEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const [newItem, setNewItem] = useState({
        breed_size: 'P',
        coat_type: 'curto',
        base_duration: 30,
        price_adder: 0
    });

    useEffect(() => {
        loadMatrix();
    }, [service.id]);

    const loadMatrix = async () => {
        setLoading(true);
        try {
            const data = await managementService.getServiceMatrix(service.id);
            setMatrix(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        try {
            const entry = {
                service_id: service.id,
                ...newItem
            };
            await managementService.upsertMatrixEntry(entry as any);
            loadMatrix(); // Reload to get ID
            // Reset form but keep duration/price maybe? No, reset all safer.
            setNewItem({
                breed_size: 'P',
                coat_type: 'curto',
                base_duration: 30,
                price_adder: 0
            });
        } catch (error) {
            console.error(error);
            alert('Erro ao adicionar regra');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await managementService.deleteMatrixEntry(id);
            setMatrix(matrix.filter(item => item.id !== id));
        } catch (error) {
            console.error(error);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Preços Dinâmicos</h3>
                        <p className="text-sm text-gray-500">{service.name} - Base: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(service.base_price)}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6">

                    {/* Add New Rule */}
                    <div className="bg-gray-50 p-4 rounded-lg border mb-6">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <Plus size={16} /> Adicionar Nova Regra
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                            <div>
                                <label className="text-xs font-medium text-gray-500">Porte</label>
                                <select
                                    className="w-full border rounded p-2 text-sm"
                                    value={newItem.breed_size}
                                    onChange={e => setNewItem({ ...newItem, breed_size: e.target.value })}
                                >
                                    <option value="P">Pequeno</option>
                                    <option value="M">Médio</option>
                                    <option value="G">Grande</option>
                                    <option value="GIG">Gigante</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Pelo</label>
                                <select
                                    className="w-full border rounded p-2 text-sm"
                                    value={newItem.coat_type}
                                    onChange={e => setNewItem({ ...newItem, coat_type: e.target.value })}
                                >
                                    <option value="curto">Curto</option>
                                    <option value="longo">Longo</option>
                                    <option value="duplo">Duplo</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Duração (min)</label>
                                <div className="relative">
                                    <Clock className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="number"
                                        className="w-full border rounded p-2 pl-7 text-sm"
                                        value={newItem.base_duration}
                                        onChange={e => setNewItem({ ...newItem, base_duration: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-500">Adicional (R$)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full border rounded p-2 pl-7 text-sm"
                                        value={newItem.price_adder}
                                        onChange={e => setNewItem({ ...newItem, price_adder: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleAdd}
                                className="bg-green-600 text-white p-2 rounded hover:bg-green-700 flex justify-center items-center h-[38px]"
                            >
                                <Plus size={20} />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3">Porte</th>
                                <th className="px-4 py-3">Tipo de Pelo</th>
                                <th className="px-4 py-3">Duração</th>
                                <th className="px-4 py-3">Adicional</th>
                                <th className="px-4 py-3">Total Est.</th>
                                <th className="px-4 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-8 text-gray-500">
                                        Nenhuma regra específica cadastrada. O preço base será usado.
                                    </td>
                                </tr>
                            ) : (
                                matrix.map(item => (
                                    <tr key={item.id} className="border-b hover:bg-gray-50">
                                        <td className="px-4 py-3 font-medium text-gray-900">{item.breed_size}</td>
                                        <td className="px-4 py-3 capitalize">{item.coat_type}</td>
                                        <td className="px-4 py-3">{item.base_duration} min</td>
                                        <td className="px-4 py-3 text-green-600">+{formatCurrency(Number(item.price_adder))}</td>
                                        <td className="px-4 py-3 font-bold text-gray-900">
                                            {formatCurrency(Number(service.base_price) + Number(item.price_adder))}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(item.id!)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                </div>
            </div>
        </div>
    );
}
