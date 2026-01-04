import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, ShoppingBag, Calendar, DollarSign } from 'lucide-react';
import { isValidCPF, formatCPF } from '../../utils/validators';
import { maskMobile, maskPhone, maskCEP, unmask } from '../../utils/masks';

import { API_URL, authFetch } from '../../services/api';

export default function CustomerForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = id && id !== 'new';
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('data'); // data, address, pets, history

    const [formData, setFormData] = useState({
        name: '',
        cpf_cnpj: '',
        email: '',
        phone: '',
        mobile: '',
        birth_date: '',
        zip_code: '',
        address: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        notes: '',
        status: 'active',
        loyalty_points: 0,
        wallet_balance: 0,
        total_spent: 0
    });

    const [pets, setPets] = useState<any[]>([]);
    const [sales, setSales] = useState<any[]>([]);
    const [loadingSales, setLoadingSales] = useState(false);
    const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
    const [loadingWallet, setLoadingWallet] = useState(false);
    const [speciesOptions, setSpeciesOptions] = useState<any[]>([]);

    useEffect(() => {
        fetchSpecies();
    }, []);

    const fetchSpecies = async () => {
        try {
            const res = await authFetch(`${API_URL}/pet-species`);
            if (res.ok) {
                const data = await res.json();
                setSpeciesOptions(data);
            }
        } catch (error) {
            console.error('Erro ao carregar espécies:', error);
        }
    };

    useEffect(() => {
        if (isEditing) {
            fetchCustomer();
        }
    }, [id]);

    useEffect(() => {
        if (isEditing) {
            if (activeTab === 'history') fetchSales();
            if (activeTab === 'wallet') fetchWalletTransactions();
        }
    }, [activeTab, id]);

    const fetchCustomer = async () => {
        try {
            const res = await authFetch(`${API_URL}/customers/${id}`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    ...data,
                    birth_date: data.birth_date ? data.birth_date.split('T')[0] : '',
                    mobile: maskMobile(data.mobile || ''),
                    phone: maskPhone(data.phone || '')
                });
                setPets(data.pets || []);
            }
        } catch (error) {
            console.error('Erro ao carregar cliente:', error);
        }
    };

    const fetchSales = async () => {
        setLoadingSales(true);
        try {
            const res = await authFetch(`${API_URL}/sales?customerId=${id}&limit=20`);
            if (res.ok) {
                const data = await res.json();
                setSales(data);
            }
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        } finally {
            setLoadingSales(false);
        }
    };

    const fetchWalletTransactions = async () => {
        setLoadingWallet(true);
        try {
            // Precisamos criar essa rota no backend ou usar uma query customizada
            // Por enquanto, vamos assumir que existe ou criar em breve.
            // Vou usar uma rota genérica de transações ou adicionar ao customer details
            // Melhor: adicionar endpoint /customers/:id/wallet-transactions
            const res = await authFetch(`${API_URL}/customers/${id}/wallet-transactions`);
            if (res.ok) {
                const data = await res.json();
                setWalletTransactions(data);
            }
        } catch (error) {
            console.error('Erro ao carregar transações:', error);
        } finally {
            setLoadingWallet(false);
        }
    };

    const handleCepBlur = async () => {
        const cleanCep = unmask(formData.zip_code);
        if (cleanCep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
                const data = await response.json();
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

        // Validação de CPF
        if (!formData.cpf_cnpj) {
            alert('CPF é obrigatório.');
            return;
        }

        if (formData.cpf_cnpj && !isValidCPF(formData.cpf_cnpj)) {
            alert('CPF inválido. Por favor, verifique o número digitado.');
            return;
        }

        setLoading(true);
        try {
            const url = isEditing ? `${API_URL}/customers/${id}` : `${API_URL}/customers`;
            const method = isEditing ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                birth_date: formData.birth_date ? new Date(formData.birth_date) : null,
                mobile: unmask(formData.mobile), // Remove máscara antes de enviar
                pets: !isEditing ? pets : undefined // Envia pets apenas na criação
            };

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                navigate('/admin/customers');
            } else {
                const err = await res.json();
                alert(err.error || 'Erro ao salvar');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar');
        } finally {
            setLoading(false);
        }
    };

    const handleAddPet = () => {
        setPets([...pets, { name: '', species: 'Cachorro', breed: '', gender: 'male', birth_date: '' }]);
    };

    const handleRemovePet = async (index: number, petId?: string) => {
        if (petId && isEditing) {
            if (!confirm('Deseja remover este pet do banco de dados?')) return;
            try {
                await authFetch(`${API_URL}/customers/pets/${petId}`, { method: 'DELETE' });
            } catch (e) {
                console.error(e);
                return;
            }
        }
        const newPets = [...pets];
        newPets.splice(index, 1);
        setPets(newPets);
    };

    const handlePetChange = (index: number, field: string, value: string) => {
        const newPets = [...pets];
        newPets[index] = { ...newPets[index], [field]: value };
        setPets(newPets);
    };

    // Se estiver editando, salvar pet individualmente (mini-feature para simplificar)
    const handleSavePet = async (index: number) => {
        if (!isEditing) return; // Na criação, salva tudo junto
        const pet = pets[index];
        try {
            const url = pet.id ? `${API_URL}/customers/pets/${pet.id}` : `${API_URL}/customers/${id}/pets`;
            const method = pet.id ? 'PUT' : 'POST';

            const res = await authFetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...pet,
                    birth_date: pet.birth_date ? new Date(pet.birth_date) : null
                })
            });

            if (res.ok) {
                alert('Pet salvo!');
                fetchCustomer(); // Recarrega para pegar ID
            }
        } catch (e) {
            console.error(e);
            alert('Erro ao salvar pet');
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate('/admin/customers')} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Tabs */}
                <div className="flex border-b overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setActiveTab('data')}
                        className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'data' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Dados Pessoais
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('address')}
                        className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'address' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Endereço
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('pets')}
                        className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'pets' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Pets ({pets.length})
                    </button>
                    {isEditing && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('history')}
                            className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'history' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Histórico de Compras
                        </button>
                    )}
                    {isEditing && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('wallet')}
                            className={`px-6 py-3 font-medium text-sm whitespace-nowrap ${activeTab === 'wallet' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Carteira / Cashback
                        </button>
                    )}
                </div>

                <div className="p-6">
                    {activeTab === 'data' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Card de Fidelidade */}
                            {isEditing && (
                                <div className="col-span-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white flex justify-between items-center shadow-md">
                                    <div>
                                        <p className="text-blue-100 text-sm font-medium">Programa de Fidelidade</p>
                                        <div className="flex items-baseline gap-2">
                                            <h3 className="text-3xl font-bold">{formData.loyalty_points || 0}</h3>
                                            <span className="text-blue-100">pontos</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-blue-100 text-sm">Total Gasto</p>
                                        <p className="text-xl font-semibold">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(formData.total_spent || 0))}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Opcional se CPF for informado"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ *</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.cpf_cnpj}
                                    onChange={e => {
                                        const val = e.target.value;
                                        setFormData({ ...formData, cpf_cnpj: formatCPF(val) })
                                    }}
                                    maxLength={14}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                                <input
                                    type="date"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.birth_date}
                                    onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.mobile}
                                    onChange={e => setFormData({ ...formData, mobile: maskMobile(e.target.value) })}
                                    maxLength={15}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea
                                    className="w-full p-2 border rounded-lg"
                                    rows={3}
                                    value={formData.notes}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'address' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.zip_code}
                                    onChange={e => setFormData({ ...formData, zip_code: maskCEP(e.target.value) })}
                                    onBlur={handleCepBlur}
                                    maxLength={9}
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.number}
                                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.neighborhood}
                                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Estado (UF)</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border rounded-lg"
                                    maxLength={2}
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === 'pets' && (
                        <div className="space-y-4">
                            {pets.map((pet, index) => (
                                <div key={index} className="border rounded-lg p-4 bg-gray-50 relative">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Nome</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded bg-white"
                                                value={pet.name}
                                                onChange={e => handlePetChange(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Espécie</label>
                                            <select
                                                className="w-full p-2 border rounded bg-white"
                                                value={pet.species}
                                                onChange={e => handlePetChange(index, 'species', e.target.value)}
                                            >
                                                {speciesOptions.map(s => (
                                                    <option key={s.id} value={s.name}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Raça</label>
                                            <input
                                                type="text"
                                                className="w-full p-2 border rounded bg-white"
                                                value={pet.breed}
                                                onChange={e => handlePetChange(index, 'breed', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Gênero</label>
                                            <select
                                                className="w-full p-2 border rounded bg-white"
                                                value={pet.gender || 'male'}
                                                onChange={e => handlePetChange(index, 'gender', e.target.value)}
                                            >
                                                <option value="male">Macho</option>
                                                <option value="female">Fêmea</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Data de Nascimento</label>
                                            <input
                                                type="date"
                                                className="w-full p-2 border rounded bg-white"
                                                value={pet.birth_date ? pet.birth_date.split('T')[0] : ''}
                                                onChange={e => handlePetChange(index, 'birth_date', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePet(index, pet.id)}
                                        className="absolute top-2 right-2 text-red-500 hover:bg-red-50 p-1 rounded"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    {isEditing && (
                                        <div className="mt-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleSavePet(index)}
                                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                            >
                                                Salvar Pet
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                            <button
                                type="button"
                                onClick={handleAddPet}
                                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> Adicionar Pet
                            </button>
                        </div>
                    )}

                    {activeTab === 'history' && (
                        <div className="space-y-4">
                            {loadingSales ? (
                                <div className="text-center py-8 text-gray-500">Carregando histórico...</div>
                            ) : sales.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                    <ShoppingBag className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                                    <p>Nenhuma compra encontrada para este cliente.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3">Data</th>
                                                <th className="px-4 py-3">Venda #</th>
                                                <th className="px-4 py-3">Itens</th>
                                                <th className="px-4 py-3">Total</th>
                                                <th className="px-4 py-3">Pagamento</th>
                                                <th className="px-4 py-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sales.map((sale) => (
                                                <tr key={sale.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        {new Date(sale.created_at).toLocaleDateString()} {new Date(sale.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-gray-900">
                                                        #{sale.sale_number}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {sale.item_count}
                                                    </td>
                                                    <td className="px-4 py-3 font-medium text-green-600">
                                                        R$ {sale.total_amount.toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {sale.payment_method === 'credit_card' ? 'Cartão de Crédito' :
                                                            sale.payment_method === 'debit_card' ? 'Cartão de Débito' :
                                                                sale.payment_method === 'money' ? 'Dinheiro' :
                                                                    sale.payment_method === 'pix' ? 'PIX' : sale.payment_method}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs ${sale.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            sale.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {sale.status === 'completed' ? 'Concluída' :
                                                                sale.status === 'cancelled' ? 'Cancelada' : sale.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'wallet' && (
                        <div className="space-y-6">
                            <div className="bg-green-50 p-4 rounded-lg border border-green-200 flex justify-between items-center">
                                <div>
                                    <p className="text-green-800 text-sm font-medium">Saldo Disponível em Cashback</p>
                                    <h3 className="text-3xl font-bold text-green-700">
                                        R$ {Number(formData.wallet_balance || 0).toFixed(2)}
                                    </h3>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full text-green-600">
                                    <DollarSign size={32} />
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-800">Histórico de Transações</h3>

                            {loadingWallet ? (
                                <div className="text-center py-8 text-gray-500">Carregando transações...</div>
                            ) : walletTransactions.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                                    <p>Nenhuma transação encontrada.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3">Data</th>
                                                <th className="px-4 py-3">Tipo</th>
                                                <th className="px-4 py-3">Descrição</th>
                                                <th className="px-4 py-3">Valor</th>
                                                <th className="px-4 py-3">Validade</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {walletTransactions.map((tx) => (
                                                <tr key={tx.id} className="bg-white border-b hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${tx.type === 'credit' ? 'bg-green-100 text-green-800' :
                                                            tx.type === 'debit' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {tx.type === 'credit' ? 'Crédito' :
                                                                tx.type === 'debit' ? 'Débito' : 'Expirado'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-600">
                                                        {tx.description}
                                                    </td>
                                                    <td className={`px-4 py-3 font-bold ${tx.type === 'credit' ? 'text-green-600' : 'text-red-600'
                                                        }`}>
                                                        {tx.type === 'credit' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">
                                                        {tx.expires_at ? new Date(tx.expires_at).toLocaleDateString() : '-'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/customers')}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? 'Salvando...' : (
                            <>
                                <Save size={20} /> Salvar Cliente
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
