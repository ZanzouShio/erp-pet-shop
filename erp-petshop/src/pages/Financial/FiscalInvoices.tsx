import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Download, Printer, Mail, Copy, XCircle, FileText, AlertCircle, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CancelInvoiceModal from '../../components/CancelInvoiceModal';

import { API_URL } from '../../services/api';

export default function FiscalInvoices() {
    const navigate = useNavigate();
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        loadInvoices();
    }, []);

    const loadInvoices = async () => {
        try {
            setLoading(true);
            let url = `${API_URL}/invoices`;
            if (dateRange.start && dateRange.end) {
                url += `?startDate=${dateRange.start}&endDate=${dateRange.end}`;
            }
            const response = await fetch(url);
            if (!response.ok) throw new Error('Erro ao carregar notas');
            const data = await response.json();
            setInvoices(data);
        } catch (error) {
            console.error('Erro ao carregar notas:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AUTORIZADA':
            case 'authorized':
            case 'pending': return 'bg-blue-100 text-blue-700';
            case 'REJEITADA':
            case 'rejected': return 'bg-pink-100 text-pink-700';
            case 'CANCELADA':
            case 'cancelled': return 'bg-gray-100 text-gray-700'; // Darker gray for cancelled
            case 'DEVOLVIDA':
            case 'returned': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleAction = (action: string, invoice: any) => {
        console.log(`Action: ${action} on invoice ${invoice.number}`);
        setActiveMenu(null);

        if (action === 'cancel') {
            setSelectedInvoice(invoice);
            setIsCancelModalOpen(true);
        }
    };

    const [dateRange, setDateRange] = useState(() => {
        const today = new Date();
        const start = new Date();
        start.setDate(today.getDate() - 30);
        return {
            start: start.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
        };
    });
    const [selectedPeriod, setSelectedPeriod] = useState('Últimos 30 dias');

    const handlePeriodChange = (period: string) => {
        setSelectedPeriod(period);
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (period) {
            case 'Hoje':
                start = today;
                end = today;
                break;
            case 'Ontem':
                start.setDate(today.getDate() - 1);
                end.setDate(today.getDate() - 1);
                break;
            case 'Últimos 7 dias':
                start.setDate(today.getDate() - 7);
                break;
            case 'Últimos 30 dias':
                start.setDate(today.getDate() - 30);
                break;
            case 'Personalizado':
                setDateRange({ start: '', end: '' });
                return;
            default:
                break;
        }

        setDateRange({
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        });
    };

    React.useEffect(() => {
        if (selectedPeriod !== 'Personalizado') {
            loadInvoices();
        } else if (dateRange.start && dateRange.end) {
            loadInvoices();
        }
    }, [dateRange, selectedPeriod]);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestão fiscal</h1>
                    <div className="flex items-center gap-4 mt-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Período</label>
                            <div className="relative">
                                <select
                                    value={selectedPeriod}
                                    onChange={(e) => handlePeriodChange(e.target.value)}
                                    className="appearance-none bg-white border border-blue-500 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-blue-500 text-sm font-medium w-40"
                                >
                                    <option>Hoje</option>
                                    <option>Ontem</option>
                                    <option>Últimos 7 dias</option>
                                    <option>Últimos 30 dias</option>
                                    <option>Personalizado</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        </div>

                        {selectedPeriod === 'Personalizado' && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Data Início</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={dateRange.start}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                            className="bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-3 rounded-lg focus:outline-none focus:border-blue-500 text-sm w-36"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Data Fim</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={dateRange.end}
                                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                            className="bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-3 rounded-lg focus:outline-none focus:border-blue-500 text-sm w-36"
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/sales')}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    + Emitir notas fiscais
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-2">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-gray-600 mb-1">Total de notas autorizadas</p>
                            <div className="flex items-baseline gap-2">
                                <h2 className="text-2xl font-bold text-gray-800">R$ 40.500,00</h2>
                                <span className="text-green-500 text-sm font-medium">▲ 4%</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Representa 25% do total vendido em reais.</p>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-lg text-sm">
                            <button className="px-3 py-1 bg-white rounded shadow-sm text-gray-800 font-medium">Todas</button>
                            <button className="px-3 py-1 text-gray-600 hover:text-gray-800">NFC-e</button>
                            <button className="px-3 py-1 text-gray-600 hover:text-gray-800">NF-e</button>
                        </div>
                    </div>

                    <h3 className="font-semibold text-gray-800 mb-3">Resumo das notas fiscais</h3>
                    <div className="flex h-2 rounded-full overflow-hidden mb-4">
                        <div className="bg-blue-600 w-[45%]"></div>
                        <div className="bg-pink-400 w-[30%]"></div>
                        <div className="bg-indigo-900 w-[15%]"></div>
                        <div className="bg-yellow-400 w-[10%]"></div>
                    </div>
                    <div className="flex flex-wrap gap-6 text-sm">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600"></div><span className="text-gray-600">Autorizadas 45%</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-pink-400"></div><span className="text-gray-600">Rejeitadas 30%</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-900"></div><span className="text-gray-600">Canceladas 15%</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-400"></div><span className="text-gray-600">Devolvidas 10%</span></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">Produtos sem dados fiscais</h3>
                        <AlertCircle size={16} className="text-blue-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-1">22 itens</h2>
                    <p className="text-xs text-gray-400 mb-6">Representa 25% do total dos produtos.</p>
                    <button className="w-full py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors">
                        Revisar produtos
                    </button>
                </div>
            </div>

            {/* Invoices List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 justify-between items-center">
                    <div className="flex gap-4 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por número da nota"
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                            />
                        </div>
                        <button className="flex items-center gap-2 text-blue-600 font-medium px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors">
                            <Filter size={20} />
                            Filtrar
                        </button>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-600">1-5 de 5 notas</span>
                        <button className="text-blue-600 text-sm font-medium hover:underline">Baixar documentos fiscais</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">Número/Série</th>
                                <th className="px-6 py-3 font-medium">Data e hora</th>
                                <th className="px-6 py-3 font-medium">Tipo de nota</th>
                                <th className="px-6 py-3 font-medium">Cliente</th>
                                <th className="px-6 py-3 font-medium text-right">Valor</th>
                                <th className="px-6 py-3 font-medium">Situação</th>
                                <th className="px-6 py-3 font-medium"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Carregando...</td>
                                </tr>
                            ) : invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">Nenhuma nota fiscal encontrada</td>
                                </tr>
                            ) : (
                                invoices.map((invoice) => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4 font-medium text-gray-800">{invoice.number}</td>
                                        <td className="px-6 py-4 text-gray-600">{invoice.date}</td>
                                        <td className="px-6 py-4 text-gray-600">{invoice.type}</td>
                                        <td className="px-6 py-4 text-gray-600">{invoice.client}</td>
                                        <td className="px-6 py-4 text-gray-800 font-medium text-right">{invoice.value}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(invoice.status)}`}>
                                                {invoice.status === 'authorized' || invoice.status === 'pending' ? 'AUTORIZADA' :
                                                    invoice.status === 'rejected' ? 'REJEITADA' :
                                                        invoice.status === 'cancelled' ? 'CANCELADA' :
                                                            invoice.status === 'returned' ? 'DEVOLVIDA' :
                                                                invoice.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right relative">
                                            <div className="flex items-center justify-end gap-2">
                                                <span className="text-blue-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:underline">
                                                    Ver detalhes
                                                </span>
                                                <button
                                                    onClick={() => setActiveMenu(activeMenu === invoice.id ? null : invoice.id)}
                                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                                                >
                                                    <MoreVertical size={20} />
                                                </button>
                                            </div>

                                            {/* Dropdown Menu */}
                                            {activeMenu === invoice.id && (
                                                <div className="absolute right-6 top-12 w-64 bg-white rounded-lg shadow-xl border border-gray-100 z-10 py-2 text-left">
                                                    <button onClick={() => handleAction('print', invoice)} className="w-full px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                                        <Printer size={18} /> Imprimir
                                                    </button>
                                                    <button onClick={() => handleAction('xml', invoice)} className="w-full px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                                        <FileText size={18} /> Baixar XML
                                                    </button>
                                                    <button onClick={() => handleAction('pdf', invoice)} className="w-full px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                                        <Download size={18} /> Baixar PDF
                                                    </button>
                                                    <button onClick={() => handleAction('email', invoice)} className="w-full px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                                        <Mail size={18} /> Enviar por e-mail
                                                    </button>
                                                    <button onClick={() => handleAction('copy', invoice)} className="w-full px-4 py-2 text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                                                        <Copy size={18} /> Copiar chave da Nota Fiscal
                                                    </button>
                                                    <div className="h-px bg-gray-100 my-1"></div>
                                                    <button onClick={() => handleAction('cancel', invoice)} className="w-full px-4 py-2 text-red-600 hover:bg-red-50 flex items-center gap-3">
                                                        <XCircle size={18} /> Cancelar nota
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CancelInvoiceModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={(reason) => {
                    console.log('Cancelling invoice', selectedInvoice?.number, 'Reason:', reason);
                    setIsCancelModalOpen(false);
                    // Here you would call the API to cancel the invoice
                }}
            />
        </div >
    );
}
