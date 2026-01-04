import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X } from 'lucide-react';

import { API_URL, authFetch } from '../services/api';

interface ExpenseCategory {
    id: string;
    name: string;
    description: string;
    color: string;
    is_fixed: boolean;
}

export default function ExpenseCategories() {
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', description: '', color: '#6B7280', is_fixed: false });
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const response = await authFetch(`${API_URL}/accounts-payable/categories`);
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await authFetch(`${API_URL}/accounts-payable/categories/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            } else {
                await authFetch(`${API_URL}/accounts-payable/categories`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });
            }
            setEditingId(null);
            setIsCreating(false);
            setFormData({ name: '', description: '', color: '#6B7280', is_fixed: false });
            loadCategories();
        } catch (error) {
            alert('Erro ao salvar categoria');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;
        try {
            const response = await authFetch(`${API_URL}/accounts-payable/categories/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error);
            }
            loadCategories();
        } catch (error: any) {
            alert(error.message || 'Erro ao excluir categoria');
        }
    };

    const startEdit = (category: ExpenseCategory) => {
        setEditingId(category.id);
        setFormData({ name: category.name, description: category.description, color: category.color, is_fixed: category.is_fixed || false });
        setIsCreating(false);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Categorias de Despesas</h1>
                <button
                    onClick={() => { setIsCreating(true); setEditingId(null); setFormData({ name: '', description: '', color: '#6B7280', is_fixed: false }); }}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} /> Nova Categoria
                </button>
            </div>

            {(isCreating || editingId) && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
                    <h2 className="text-lg font-semibold mb-4">{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cor</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="h-10 w-20 p-1 border rounded-lg cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={formData.color}
                                        onChange={e => setFormData({ ...formData, color: e.target.value })}
                                        className="flex-1 p-2 border rounded-lg uppercase"
                                        maxLength={7}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Custo</label>
                                    <label className="inline-flex items-center mt-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.is_fixed}
                                            onChange={e => setFormData({ ...formData, is_fixed: e.target.checked })}
                                            className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                        />
                                        <span className="ml-2 text-gray-700">Custo Fixo (OPEX/Breakeven)</span>
                                    </label>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-2 border rounded-lg"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsCreating(false); setEditingId(null); }}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                                >
                                    <Save size={18} /> Salvar
                                </button>
                            </div>
                        </div>
                    </form>
                </div >
            )
            }

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {categories.map((category) => (
                            <tr key={category.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div
                                        className="w-6 h-6 rounded-full border border-gray-200"
                                        style={{ backgroundColor: category.color }}
                                    />
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">{category.name}</td>
                                <td className="px-6 py-4">
                                    {category.is_fixed ? (
                                        <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded-full">
                                            Custo Fixo
                                        </span>
                                    ) : (
                                        <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full">
                                            Variável
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-gray-500">{category.description}</td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => startEdit(category)}
                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                            title="Editar"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                            title="Excluir"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {categories.length === 0 && !loading && (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    Nenhuma categoria cadastrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div >
    );
}
