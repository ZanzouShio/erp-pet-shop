import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, User, Phone, MapPin, ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { API_URL } from '../../services/api';

export default function CustomerList() {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [species, setSpecies] = useState('all');
    const [speciesOptions, setSpeciesOptions] = useState<any[]>([]);

    useEffect(() => {
        fetchCustomers();
    }, [page, search, sortBy, sortOrder, species]);

    useEffect(() => {
        fetchSpecies();
    }, []);

    const fetchSpecies = async () => {
        try {
            const res = await fetch(`${API_URL}/pet-species`);
            if (res.ok) {
                const data = await res.json();
                setSpeciesOptions(data);
            }
        } catch (error) {
            console.error('Erro ao carregar espécies:', error);
        }
    };

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10',
                search,
                sortBy,
                sortOrder,
                species
            });
            const res = await fetch(`${API_URL}/customers?${params}`);
            const data = await res.json();
            setCustomers(data.data);
            setTotalPages(data.meta.pages);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este cliente?')) return;
        try {
            const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchCustomers();
            } else {
                alert('Erro ao excluir cliente');
            }
        } catch (error) {
            console.error('Erro ao excluir:', error);
        }
    };

    const handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Clientes</h1>
                <button
                    onClick={() => navigate('/admin/customers/new')}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                    <Plus size={20} /> Novo Cliente
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nome, CPF, email ou telefone..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Filter size={16} />
                        <span>Filtrar por Espécie:</span>
                    </div>
                    <select
                        value={species}
                        onChange={(e) => {
                            setSpecies(e.target.value);
                            setPage(1);
                        }}
                        className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                    >
                        <option value="all">Todas</option>
                        {speciesOptions.map(s => (
                            <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                    </select>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600 font-medium">
                            <tr>
                                <th className="p-4 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">
                                        Nome
                                        {sortBy === 'name' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4">Contato</th>
                                <th className="p-4">Localização</th>
                                <th className="p-4 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('pet_count')}>
                                    <div className="flex items-center justify-center gap-1">
                                        Pets
                                        {sortBy === 'pet_count' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:bg-gray-100" onClick={() => handleSort('loyalty_points')}>
                                    <div className="flex items-center justify-center gap-1">
                                        Pontos
                                        {sortBy === 'loyalty_points' && (sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />)}
                                    </div>
                                </th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : customers.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Nenhum cliente encontrado.</td></tr>
                            ) : (
                                customers.map((customer: any) => (
                                    <tr key={customer.id} className="hover:bg-gray-50">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                                    {customer.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">{customer.name}</div>
                                                    <div className="text-sm text-gray-500">{customer.cpf_cnpj || 'CPF não inf.'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Phone size={14} /> {customer.mobile || customer.phone || '-'}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-1">{customer.email}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} /> {customer.city ? `${customer.city}/${customer.state}` : '-'}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 rounded-full text-xs font-medium text-gray-600">
                                                {customer._count?.pets || 0}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="font-bold text-blue-600">
                                                {customer.loyalty_points || 0}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                {customer.status === 'active' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => navigate(`/admin/customers/${customer.id}`)}
                                                    className="p-2 hover:bg-gray-200 rounded-lg text-blue-600"
                                                    title="Editar"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(customer.id)}
                                                    className="p-2 hover:bg-gray-200 rounded-lg text-red-600"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginação */}
                <div className="p-4 border-t border-gray-100 flex justify-between items-center">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-600">
                        Página {page} de {totalPages}
                    </span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50"
                    >
                        Próxima
                    </button>
                </div>
            </div>
        </div>
    );
}
