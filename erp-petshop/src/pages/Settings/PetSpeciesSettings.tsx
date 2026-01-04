import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, AlertCircle } from 'lucide-react';

import { API_URL, authFetch } from '../../services/api';

interface PetSpecies {
    id: string;
    name: string;
    active: boolean;
}

export default function PetSpeciesSettings() {
    const [species, setSpecies] = useState<PetSpecies[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSpecies();
    }, []);

    const fetchSpecies = async () => {
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/pet-species`);
            const data = await res.json();
            setSpecies(data);
        } catch (error) {
            console.error('Erro ao buscar espécies:', error);
            setError('Erro ao carregar espécies');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        try {
            const res = await authFetch(`${API_URL}/pet-species`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                setNewName('');
                fetchSpecies();
            } else {
                const err = await res.json();
                setError(err.error || 'Erro ao adicionar espécie');
            }
        } catch (error) {
            console.error('Erro ao adicionar:', error);
            setError('Erro ao adicionar espécie');
        }
    };

    const handleUpdate = async (id: string) => {
        if (!editName.trim()) return;

        try {
            const res = await authFetch(`${API_URL}/pet-species/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName })
            });

            if (res.ok) {
                setEditingId(null);
                setEditName('');
                fetchSpecies();
            } else {
                const err = await res.json();
                setError(err.error || 'Erro ao atualizar espécie');
            }
        } catch (error) {
            console.error('Erro ao atualizar:', error);
            setError('Erro ao atualizar espécie');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta espécie?')) return;

        try {
            const res = await authFetch(`${API_URL}/pet-species/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchSpecies();
            } else {
                const err = await res.json();
                setError(err.error || 'Erro ao excluir espécie');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
            setError('Erro ao excluir espécie');
        }
    };

    const startEditing = (s: PetSpecies) => {
        setEditingId(s.id);
        setEditName(s.name);
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Configuração de Espécies de Pets</h1>

            {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                    <button onClick={() => setError('')} className="ml-auto hover:text-red-900">
                        <X size={16} />
                    </button>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Adicionar Nova Espécie</h2>
                    <form onSubmit={handleAdd} className="flex gap-4">
                        <input
                            type="text"
                            placeholder="Nome da espécie (ex: Hamster)"
                            className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!newName.trim()}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Plus size={20} /> Adicionar
                        </button>
                    </form>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-semibold text-gray-700">Espécies Cadastradas</h2>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando...</div>
                ) : species.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhuma espécie cadastrada.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium text-sm">
                            <tr>
                                <th className="p-4 w-full">Nome</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {species.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50">
                                    <td className="p-4">
                                        {editingId === s.id ? (
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={editName}
                                                onChange={e => setEditName(e.target.value)}
                                                autoFocus
                                            />
                                        ) : (
                                            <span className="font-medium text-gray-800">{s.name}</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {editingId === s.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdate(s.id)}
                                                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                                                        title="Salvar"
                                                    >
                                                        <Save size={18} />
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded"
                                                        title="Cancelar"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => startEditing(s)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Editar"
                                                    >
                                                        <Edit size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(s.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
