import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Calendar, DollarSign, FileText, Smartphone, Printer } from 'lucide-react';
import NFCeEmissionModal from '../components/NFCeEmissionModal';
import NFeEmissionModal from '../components/NFeEmissionModal';
import { useHardware } from '../hooks/useHardware';

import { API_URL, authFetch } from '../services/api';

interface Sale {
    id: string;
    sale_number: number;
    subtotal: number;
    discount_amount: number;
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    item_count: number;
}

interface SaleItem {
    id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
}

interface SalePayment {
    payment_method: string;
    amount: number;
    installments?: number;
}

interface SaleInstallment {
    number: number;
    total: number;
    amount: number;
    method: string;
}

interface SaleDetails {
    id: string;
    sale_number: number;
    subtotal: number;
    discount_amount: number;
    discount_reason?: string | null;
    total_amount: number;
    status: string;
    created_at: string;
    user_name: string;
    items: SaleItem[];
    payments: SalePayment[];
    installments?: SaleInstallment[]; // New field
}

// ... existing code ...



type DateFilter = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

const paymentMethodLabels: Record<string, string> = {
    money: 'Dinheiro',
    cash: 'Dinheiro',
    debit_card: 'Débito',
    credit_card: 'Crédito',
    pix: 'PIX',
    store_credit: 'Crediário',
    cashback: 'Cashback'
};

export default function Sales() {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);

    // Paginação
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const ITEMS_PER_PAGE = 50;

    // Filtros
    const [dateFilter, setDateFilter] = useState<DateFilter>('today');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal de detalhes
    const [selectedSale, setSelectedSale] = useState<SaleDetails | null>(null);
    const [showNFCeModal, setShowNFCeModal] = useState(false);
    const [showNFeModal, setShowNFeModal] = useState(false);
    const [company, setCompany] = useState<any>(null);

    // Hardware Service Integration
    const { printReceipt, printerConnected } = useHardware();

    // Carregar dados da empresa para impressão
    useEffect(() => {
        authFetch(`${API_URL}/settings`)
            .then(res => res.json())
            .then(data => setCompany(data))
            .catch(err => console.error('Erro ao carregar empresa:', err));
    }, []);

    // Resetar para página 1 quando filtros mudam
    useEffect(() => {
        setCurrentPage(1);
    }, [dateFilter, startDate, endDate, paymentMethod, searchTerm]);

    useEffect(() => {
        loadSales();
    }, [dateFilter, startDate, endDate, paymentMethod, searchTerm, currentPage]);

    const getDateRange = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const formatDate = (date: Date) => {
            return date.toISOString().split('T')[0];
        };

        switch (dateFilter) {
            case 'today':
                return {
                    startDate: formatDate(today),
                    endDate: formatDate(today)
                };
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return {
                    startDate: formatDate(yesterday),
                    endDate: formatDate(yesterday)
                };
            case 'week':
                const weekAgo = new Date(today);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return {
                    startDate: formatDate(weekAgo),
                    endDate: formatDate(today)
                };
            case 'month':
                const monthAgo = new Date(today);
                monthAgo.setDate(monthAgo.getDate() - 30);
                return {
                    startDate: formatDate(monthAgo),
                    endDate: formatDate(today)
                };
            case 'custom':
                return { startDate, endDate };
            default:
                return { startDate: '', endDate: '' };
        }
    };

    const loadSales = async () => {
        try {
            setLoading(true);
            const { startDate: start, endDate: end } = getDateRange();

            const params = new URLSearchParams();
            if (start) params.append('startDate', start);
            if (end) params.append('endDate', end);
            if (paymentMethod !== 'all') params.append('paymentMethod', paymentMethod);
            if (searchTerm) params.append('search', searchTerm);
            params.append('limit', String(ITEMS_PER_PAGE));
            params.append('offset', String((currentPage - 1) * ITEMS_PER_PAGE));

            const response = await authFetch(`${API_URL}/sales?${params}`);
            const data = await response.json();

            // Backend agora retorna { data: [...], pagination: {...} }
            if (data.data && data.pagination) {
                setSales(data.data);
                setTotal(data.pagination.total);
                setTotalPages(data.pagination.totalPages);
            } else {
                // Fallback para formato antigo
                const salesArray = Array.isArray(data) ? data : [];
                setSales(salesArray);
                setTotal(salesArray.length);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Erro ao carregar vendas:', error);
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const loadSaleDetails = async (saleId: string) => {
        try {
            const response = await authFetch(`${API_URL}/sales/${saleId}`);
            if (!response.ok) throw new Error('Erro ao carregar detalhes');
            const data = await response.json();
            setSelectedSale(data);
        } catch (error) {
            console.error('Erro ao carregar detalhes:', error);
            alert('Erro ao carregar detalhes da venda');
        }
    };

    const handleCancelSale = async () => {
        if (!selectedSale) return;

        if (!confirm('Tem certeza que deseja cancelar esta venda? O estoque será estornado.')) {
            return;
        }

        try {
            const response = await authFetch(`${API_URL}/sales/${selectedSale.id}/cancel`, {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao cancelar venda');
            }

            alert('Venda cancelada com sucesso!');
            setSelectedSale(null);
            loadSales(); // Recarregar lista
        } catch (error) {
            console.error('Erro ao cancelar venda:', error);
            alert('Erro ao cancelar venda: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        }
    };

    const handleEmitInvoice = async (type: 'NFC-e' | 'NF-e', buyerData?: any) => {
        console.log('🚀 handleEmitInvoice called', { type, buyerData });
        if (!selectedSale) {
            console.error('❌ No selected sale');
            return;
        }

        try {
            console.log('📡 Sending request to', `${API_URL}/invoices`);
            const response = await authFetch(`${API_URL}/invoices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    saleId: selectedSale.id,
                    type,
                    buyerData
                })
            });

            console.log('📥 Response status:', response.status);

            if (!response.ok) {
                const error = await response.json();
                console.error('❌ Error response:', error);
                throw new Error(error.error || 'Erro ao emitir nota fiscal');
            }

            const data = await response.json();
            console.log('✅ Success data:', data);
            alert(data.message);

            if (type === 'NFC-e') setShowNFCeModal(false);
            else setShowNFeModal(false);

            // Reload sale details to show updated status
            loadSaleDetails(selectedSale.id);
            loadSales();
        } catch (error) {
            console.error('Erro ao emitir nota:', error);
            alert('Erro ao emitir nota: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === 'completed') {
            return <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Concluída</span>;
        } else if (status === 'cancelled') {
            return <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">Cancelada</span>;
        } else {
            return <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">{status}</span>;
        }
    };

    const handlePrintReceipt = async () => {
        if (!selectedSale) return;

        // Try thermal printing first if available
        if (printerConnected) {
            try {
                const companyName = company?.trade_name || company?.company_name || 'ERP Pet Shop';
                const address = company?.address ? `${company.address}, ${company.number || ''}`.trim() : '';
                const address2 = [company?.neighborhood, company?.city, company?.state].filter(Boolean).join(', ');
                const contact = [company?.email, company?.phone].filter(Boolean).join(' | ');

                await printReceipt({
                    companyName,
                    address: address || undefined,
                    address2: address2 || undefined,
                    contact: contact || undefined,
                    saleNumber: String(selectedSale.sale_number),
                    date: new Date(selectedSale.created_at).toLocaleString('pt-BR'),
                    items: selectedSale.items.map(item => ({
                        name: item.product_name,
                        quantity: item.quantity,
                        price: item.unit_price,
                        total: item.total
                    })),
                    subtotal: selectedSale.subtotal,
                    discount: selectedSale.discount_amount,
                    total: selectedSale.total_amount,
                    paymentMethod: selectedSale.payments.map(p => paymentMethodLabels[p.payment_method] || p.payment_method).join(', '),
                    change: 0,
                    installments: selectedSale.installments?.length || 1,
                    operator: selectedSale.user_name || 'Operador'
                });
                return; // Success, no need for fallback
            } catch (e) {
                console.error('Thermal print failed, falling back to browser:', e);
            }
        }

        // Fallback: browser print dialog
        const printWindow = window.open('', '', 'width=300,height=600');
        if (!printWindow) return;

        const date = new Date(selectedSale.created_at).toLocaleString('pt-BR');
        const companyName = company?.trade_name || company?.company_name || 'ERP Pet Shop';
        const address = company?.address ? `${company.address}, ${company.number}` : '';
        const city = company?.city && company?.state ? `${company.city} - ${company.state}` : '';
        const fullAddress = [address, company?.neighborhood, city, company?.zip_code].filter(Boolean).join(', ');
        const logo = company?.logo_url ? `<img src="${company.logo_url}" style="max-height: 50px; max-width: 150px;" />` : '';

        printWindow.document.write(`
            <html>
            <head>
                <title>Cupom #${selectedSale.sale_number}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                    body {
                        font-family: 'Roboto', sans-serif;
                        font-size: 12px;
                        margin: 0;
                        padding: 10px;
                        color: #000;
                    }
                    .header {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                        margin-bottom: 20px;
                    }
                    .logo { max-width: 100px; }
                    .company-name { font-weight: bold; font-size: 16px; }

                    .section-title {
                        font-weight: bold;
                        font-size: 14px;
                        text-transform: uppercase;
                        margin-bottom: 2px;
                    }
                    .date { margin-bottom: 15px; color: #333; }

                    .table-header {
                        display: flex;
                        justify-content: space-between;
                        font-weight: bold;
                        border-bottom: 2px solid #000;
                        padding-bottom: 5px;
                        margin-bottom: 10px;
                    }

                    .item-row { margin-bottom: 8px; }
                    .item-name { font-weight: bold; font-size: 13px; }
                    .item-details {
                        display: flex;
                        justify-content: space-between;
                        font-size: 12px;
                    }

                    .totals-section {
                        margin-top: 20px;
                        border-top: 2px solid #000;
                        padding-top: 10px;
                    }

                    .total-row {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 10px;
                    }
                    .total-label { font-size: 20px; font-weight: bold; }
                    .total-value { font-size: 24px; font-weight: bold; }

                    .footer {
                        margin-top: 30px;
                        border-top: 1px solid #000;
                        padding-top: 10px;
                        font-size: 11px;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    ${logo}
                    <div class="company-name">${companyName}</div>
                </div>

                <div class="section-title">DETALHE DE PRODUTOS</div>
                <div class="date">${date}</div>

                <div class="table-header">
                    <span>Prod. e Quant.</span>
                    <span>Valor Subtotal</span>
                </div>

                <div class="items-list">
                    ${selectedSale.items.map(item => `
                        <div class="item-row">
                            <div class="item-name">${item.product_name}</div>
                            <div class="item-details">
                                <span>x${item.quantity} un.</span>
                                <span>${formatCurrency(item.unit_price)}/un.</span>
                                <span>${formatCurrency(item.total)}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="totals-section">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Quant. total de itens</span>
                        <span>${selectedSale.items.length}</span>
                    </div>

                    ${selectedSale.discount_amount > 0 ? `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>Desconto</span>
                            <span>-${formatCurrency(selectedSale.discount_amount)}</span>
                        </div>
                    ` : ''}

                    <div class="total-row">
                        <span class="total-label">Total R$</span>
                        <span class="total-value">${formatCurrency(selectedSale.total_amount)}</span>
                    </div>

                    <div style="margin-top: 10px; font-size: 13px;">
                        <strong>Forma de Pagamento:</strong> ${selectedSale.payments.map(p => paymentMethodLabels[p.payment_method] || p.payment_method).join(', ')}
                    </div>
                </div>

                <div class="footer">
                    <div>${companyName}</div>
                    <div>${fullAddress}</div>
                    <div style="margin-top: 10px; font-weight: bold; text-align: center;">SEM VALOR FISCAL</div>
                </div>

                <script>
                    window.print();
                </script>
            </body>
        </html>
        `);
        printWindow.document.close();
    };

    // Calcular total do dia
    const totalToday = sales.reduce((sum, sale) => {
        if (sale.status === 'completed') {
            return sum + parseFloat(String(sale.total_amount));
        }
        return sum;
    }, 0);

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Histórico de Vendas</h1>
                    <p className="text-gray-500 mt-1">Visualize e gerencie todas as vendas realizadas</p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-500">Total do Período</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalToday)}</p>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Filtro de Data */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar size={16} className="inline mr-1" />
                            Período
                        </label>
                        <select
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="today">Hoje</option>
                            <option value="yesterday">Ontem</option>
                            <option value="week">Últimos 7 dias</option>
                            <option value="month">Últimos 30 dias</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>

                    {/* Data Custom */}
                    {dateFilter === 'custom' && (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </>
                    )}

                    {/* Forma de Pagamento */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <DollarSign size={16} className="inline mr-1" />
                            Pagamento
                        </label>
                        <select
                            value={paymentMethod}
                            onChange={(e) => setPaymentMethod(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        >
                            <option value="all">Todas</option>
                            <option value="cash">Dinheiro</option>
                            <option value="debit_card">Débito</option>
                            <option value="credit_card">Crédito</option>
                            <option value="pix">PIX</option>
                        </select>
                    </div>

                    {/* Busca */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Search size={16} className="inline mr-1" />
                            Buscar Nº Venda
                        </label>
                        <input
                            type="text"
                            placeholder="Digite o número..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        />
                    </div>
                </div>
            </div>

            {/* Tabela de Vendas */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Filter size={48} className="text-gray-400 mx-auto mb-4 animate-pulse" />
                            <p className="text-gray-500">Carregando vendas...</p>
                        </div>
                    </div>
                ) : sales.length === 0 ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <Filter size={48} className="text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500">Nenhuma venda encontrada</p>
                            <p className="text-gray-400 text-sm mt-2">Tente ajustar os filtros</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Nº Venda
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Data/Hora
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Items
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Pagamento
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Desconto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {sales.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-medium text-gray-900">#{sale.sale_number}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(sale.created_at)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {sale.item_count} {sale.item_count === 1 ? 'item' : 'itens'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                {paymentMethodLabels[sale.payment_method] || sale.payment_method}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {parseFloat(String(sale.discount_amount)) > 0 ? (
                                                    <span className="text-red-600 font-medium">
                                                        -{formatCurrency(parseFloat(String(sale.discount_amount)))}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-medium text-gray-900">
                                                    {formatCurrency(parseFloat(String(sale.total_amount)))}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getStatusBadge(sale.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <button
                                                    onClick={() => loadSaleDetails(sale.id)}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                >
                                                    <Eye size={16} />
                                                    Detalhes
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer com paginação */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, total)} de {total} vendas
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    ← Anterior
                                </button>
                                <span className="px-3 py-1.5 text-sm font-medium text-gray-700">
                                    Página {currentPage} de {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage >= totalPages}
                                    className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Próximo →
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Modal: Detalhes da Venda */}
            {selectedSale && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-start">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Venda #{selectedSale.sale_number}</h2>
                                <p className="text-gray-500 mt-1">
                                    {formatDate(selectedSale.created_at)} • {selectedSale.user_name}
                                </p>
                            </div>
                            <button onClick={() => setSelectedSale(null)} className="text-gray-400 hover:text-gray-600 transition">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="px-8 py-6 space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Itens da Venda</h3>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qtd</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Desconto</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedSale.items.map((item) => (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.product_name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{item.sku}</td>
                                                    <td className="px-4 py-3 text-sm text-center text-gray-900">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.unit_price)}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-500">
                                                        {item.discount > 0 ? `-${formatCurrency(item.discount)}` : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(item.total)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Pagamentos</h3>
                                    <div className="space-y-2">
                                        {selectedSale.payments.map((payment, index) => {
                                            const installmentCount = payment.installments || 1;
                                            const installmentValue = payment.amount / installmentCount;

                                            return (
                                                <div key={index} className="bg-gray-50 rounded-lg p-3">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-sm text-gray-700 font-medium">
                                                            {paymentMethodLabels[payment.payment_method] || payment.payment_method}
                                                        </span>
                                                        <span className="text-sm font-bold text-gray-900">
                                                            {formatCurrency(payment.amount)}
                                                        </span>
                                                    </div>
                                                    {installmentCount > 1 && (
                                                        <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-200 pt-1 mt-1">
                                                            <span>Parcelado em {installmentCount}x</span>
                                                            <span>{installmentCount}x de {formatCurrency(installmentValue)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo</h3>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <span className="text-sm text-gray-700">Subtotal</span>
                                            <span className="text-sm font-medium text-gray-900">{formatCurrency(selectedSale.subtotal)}</span>
                                        </div>
                                        {selectedSale.discount_amount > 0 && (
                                            <div
                                                className="flex justify-between items-center p-3 bg-orange-50 rounded-lg cursor-help"
                                                title={selectedSale.discount_reason ? `Motivo: ${selectedSale.discount_reason}` : 'Sem motivo informado'}
                                            >
                                                <span className="text-sm text-orange-700">Desconto</span>
                                                <span className="text-sm font-medium text-orange-700">-{formatCurrency(selectedSale.discount_amount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                                            <span className="text-base font-semibold text-green-800">Total</span>
                                            <span className="text-xl font-bold text-green-800">{formatCurrency(selectedSale.total_amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-8 py-4 flex justify-between items-center gap-3">
                            <div className="flex gap-3">
                                <button
                                    onClick={handlePrintReceipt}
                                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                                >
                                    <Printer size={18} />
                                    Imprimir Cupom
                                </button>
                                <button
                                    onClick={() => setShowNFeModal(true)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                                >
                                    <FileText size={18} />
                                    Emitir NF-e
                                </button>
                                <button
                                    onClick={() => setShowNFCeModal(true)}
                                    className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
                                >
                                    <Smartphone size={18} />
                                    Emitir NFC-e
                                </button>
                            </div>
                            <div className="flex gap-3">
                                {selectedSale.status !== 'cancelled' && (
                                    <button
                                        onClick={handleCancelSale}
                                        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                    >
                                        Cancelar Venda
                                    </button>
                                )}
                                <button onClick={() => setSelectedSale(null)} className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition">
                                    Fechar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <NFCeEmissionModal
                isOpen={showNFCeModal}
                onClose={() => setShowNFCeModal(false)}
                sale={selectedSale}
                onEmit={(data) => handleEmitInvoice('NFC-e', data)}
            />

            <NFeEmissionModal
                isOpen={showNFeModal}
                onClose={() => setShowNFeModal(false)}
                onEmit={(data) => handleEmitInvoice('NF-e', data)}
            />
        </div>
    );
}
