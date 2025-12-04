import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Download, Printer, Mail, Copy, XCircle, FileText, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CancelInvoiceModal from '../../components/CancelInvoiceModal';

export default function FiscalInvoices() {
    const navigate = useNavigate();
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    // Mock data
    const invoices = [
        { id: '1', number: '5467/101', date: '4/jul/2022 às 10h32', type: 'NFC-e', client: '089.879.687-90', value: 'R$ 100,00', status: 'AUTORIZADA' },
        { id: '2', number: '5546/101', date: '7/jul/2022 às 11h52', type: 'NF-e', client: 'Sem dados', value: 'R$ 100,00', status: 'REJEITADA' },
        { id: '3', number: '5732/101', date: '7/jul/2022 às 14h32', type: 'NF-e', client: '089.879.687-90', value: 'R$ 100,00', status: 'AUTORIZADA' },
        { id: '4', number: '5890/101', date: '8/jul/2022 às 09h15', type: 'NFC-e', client: 'Sem dados', value: 'R$ 50,00', status: 'CANCELADA' },
        { id: '5', number: '6012/101', date: '8/jul/2022 às 16h45', type: 'NFC-e', client: '123.456.789-00', value: 'R$ 250,00', status: 'DEVOLVIDA' },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'AUTORIZADA': return 'bg-blue-100 text-blue-700';
            case 'REJEITADA': return 'bg-pink-100 text-pink-700';
            case 'CANCELADA': return 'bg-gray-100 text-gray-700'; // Darker gray for cancelled
            case 'DEVOLVIDA': return 'bg-yellow-100 text-yellow-700';
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

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestão fiscal</h1>
                    <button className="text-blue-600 text-sm font-medium flex items-center gap-1 mt-1">
                        Últimos 30 dias
                    </button>
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
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 group">
                                    <td className="px-6 py-4 font-medium text-gray-800">{invoice.number}</td>
                                    <td className="px-6 py-4 text-gray-600">{invoice.date}</td>
                                    <td className="px-6 py-4 text-gray-600">{invoice.type}</td>
                                    <td className="px-6 py-4 text-gray-600">{invoice.client}</td>
                                    <td className="px-6 py-4 text-gray-800 font-medium text-right">{invoice.value}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getStatusColor(invoice.status)}`}>
                                            {invoice.status}
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
                            ))}
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
        </div>
    );
}
