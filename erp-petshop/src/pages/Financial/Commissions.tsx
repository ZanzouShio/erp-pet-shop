import React, { useState, useEffect } from 'react';
import { commissionService } from '../../services/commissionService';
import type { Commission } from '../../services/commissionService';
import { managementService } from '../../services/managementService'; // Assuming this exists or similar
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    DollarSign,
    Calendar,
    User,
    Filter,
    Printer,
    CheckCircle,
    AlertCircle
} from 'lucide-react';
import { useToast } from '../../components/Toast';

export default function Commissions() {
    const toast = useToast();
    const [commissions, setCommissions] = useState<Commission[]>([]);
    const [professionals, setProfessionals] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        start_date: format(new Date(), 'yyyy-MM-01'), // First day of month
        end_date: format(new Date(), 'yyyy-MM-dd'),
        professional_id: '',
        status: 'pending'
    });

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('pix');
    const [paymentNotes, setPaymentNotes] = useState('');

    useEffect(() => {
        loadProfessionals();
    }, []);

    useEffect(() => {
        loadCommissions();
    }, [filters]);

    const loadProfessionals = async () => {
        try {
            const response = await managementService.listGroomers();
            setProfessionals(response);
        } catch (error) {
            console.error("Error loading professionals", error);
        }
    };

    const loadCommissions = async () => {
        setLoading(true);
        try {
            const data = await commissionService.list(filters);
            setCommissions(data);
            setSelectedIds([]); // Clear selection on filter change
        } catch (error) {
            console.error("Error loading commissions", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(commissions.filter(c => c.status === 'pending').map(c => c.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(itemId => itemId !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handlePay = async () => {
        if (selectedIds.length === 0) return;

        try {
            await commissionService.pay(selectedIds, paymentMethod, paymentNotes);
            toast.success('Pagamento registrado com sucesso!');
            setPaymentModalOpen(false);
            loadCommissions(); // Refresh
            setSelectedIds([]);
        } catch (error) {
            toast.error('Erro ao registrar pagamento.');
            console.error(error);
        }
    };

    // Stats
    const totalValue = commissions.reduce((acc, curr) => acc + curr.commission_value, 0);
    const totalSelected = commissions
        .filter(c => selectedIds.includes(c.id))
        .reduce((acc, curr) => acc + curr.commission_value, 0);

    return (
        <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <DollarSign className="w-8 h-8 text-green-600" />
                    Comissões
                </h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
                    >
                        <Printer size={18} />
                        Imprimir
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Data Início</label>
                    <input
                        type="date"
                        value={filters.start_date}
                        onChange={e => setFilters({ ...filters, start_date: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Data Fim</label>
                    <input
                        type="date"
                        value={filters.end_date}
                        onChange={e => setFilters({ ...filters, end_date: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Profissional</label>
                    <select
                        value={filters.professional_id}
                        onChange={e => setFilters({ ...filters, professional_id: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos</option>
                        {professionals.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
                    <select
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Todos</option>
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                    </select>
                </div>
            </div>

            {/* Dashboard Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Total no Período</p>
                        <p className="text-2xl font-bold text-gray-800">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                        </p>
                    </div>
                    <div className="bg-blue-100 p-3 rounded-full">
                        <Filter className="w-6 h-6 text-blue-600" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Selecionado para Pagar</p>
                        <p className="text-2xl font-bold text-green-600">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSelected)}
                        </p>
                    </div>
                    <div>
                        {selectedIds.length > 0 && (
                            <button
                                onClick={() => setPaymentModalOpen(true)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all active:scale-95"
                            >
                                Pagar ({selectedIds.length})
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="p-4 w-10">
                                    {filters.status !== 'paid' && (
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    )}
                                </th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Data</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Profissional</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Cliente / Pet</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Serviço</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Valor Serviço</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Comissão</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-500">Carregando...</td></tr>
                            ) : commissions.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-500">Nenhuma comissão encontrada.</td></tr>
                            ) : (
                                commissions.map(commission => (
                                    <tr key={commission.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            {commission.status === 'pending' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(commission.id)}
                                                    onChange={() => handleSelectOne(commission.id)}
                                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {format(new Date(commission.date), 'dd/MM/yyyy HH:mm')}
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-800">{commission.professional_name}</td>
                                        <td className="p-4 text-sm text-gray-600">
                                            <div className="font-medium">{commission.customer_name}</div>
                                            <div className="text-xs text-gray-400">{commission.pet_name}</div>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">{commission.service_name}</td>
                                        <td className="p-4 text-sm text-gray-600 text-right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.price)}
                                        </td>
                                        <td className="p-4 text-sm font-bold text-green-600 text-right">
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commission.commission_value)}
                                        </td>
                                        <td className="p-4 text-center">
                                            {commission.status === 'paid' ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                                    <CheckCircle size={12} /> Pago
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-medium">
                                                    <AlertCircle size={12} /> Pendente
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payment Modal */}
            {paymentModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-xl w-full max-w-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">Registrar Pagamento</h2>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="flex justify-between mb-2">
                                    <span className="text-gray-600">Itens selecionados:</span>
                                    <span className="font-bold">{selectedIds.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Valor Total:</span>
                                    <span className="font-bold text-green-600 text-lg">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalSelected)}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pagamento</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    value={paymentMethod}
                                    onChange={e => setPaymentMethod(e.target.value)}
                                >
                                    <option value="pix">PIX</option>
                                    <option value="transfer">Transferência Bancária</option>
                                    <option value="cash">Dinheiro</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea
                                    className="w-full p-2 border border-gray-300 rounded-lg"
                                    rows={3}
                                    value={paymentNotes}
                                    onChange={e => setPaymentNotes(e.target.value)}
                                    placeholder="Ex: Comprovante #1234..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setPaymentModalOpen(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handlePay}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                                Confirmar Pagamento
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
