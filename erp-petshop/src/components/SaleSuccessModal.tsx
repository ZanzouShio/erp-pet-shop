import React, { useEffect, useState } from 'react';
import { CheckCircle, Printer, ArrowRight } from 'lucide-react';
import { API_URL } from '../services/api';

interface SaleSuccessModalProps {
    saleNumber: string;
    total: number;
    paymentMethod: string;
    change?: number;
    items?: any[];
    installments?: number;
    onClose: () => void;
}

export default function SaleSuccessModal({
    saleNumber,
    total,
    paymentMethod,
    change = 0,
    items = [],
    installments,
    onClose
}: SaleSuccessModalProps) {
    const [company, setCompany] = useState<any>(null);

    useEffect(() => {
        fetch(`${API_URL}/settings`)
            .then(res => res.json())
            .then(data => setCompany(data))
            .catch(err => console.error('Erro ao carregar empresa:', err));
    }, []);

    // Fechar com ESC ou Enter
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' || e.key === 'Enter') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const translatePaymentMethod = (method: string) => {
        const map: Record<string, string> = {
            money: 'Dinheiro',
            cash: 'Dinheiro',
            credit_card: 'Cartão de Crédito',
            debit_card: 'Cartão de Débito',
            pix: 'PIX',
            store_credit: 'Crediário',
            cashback: 'Cashback'
        };
        return map[method.toLowerCase()] || method;
    };

    const handlePrint = () => {
        const printWindow = window.open('', '', 'width=300,height=600');
        if (!printWindow) return;

        const date = new Date().toLocaleString('pt-BR');
        const companyName = company?.trade_name || company?.company_name || 'ERP Pet Shop';
        const address = company?.address ? `${company.address}, ${company.number}` : '';
        const city = company?.city && company?.state ? `${company.city} - ${company.state}` : '';
        const fullAddress = [address, company?.neighborhood, city, company?.zip_code].filter(Boolean).join(', ');
        const logo = company?.logo_url ? `<img src="${company.logo_url}" style="max-height: 50px; max-width: 150px;" />` : '';

        // Mock items if not available (since we only passed total/saleNumber, we might need to fetch items or pass them. 
        // For now, I will assume we might need to fetch them or just show a summary if items aren't passed.
        // Wait, the modal props don't have items. The user wants "Product Details".
        // I need to fetch the sale details to get the items, or pass them to the modal.
        // Given the current flow, fetching is safer.

        // However, to be quick and since I can't easily change the parent flow right now without more edits, 
        // I will check if I can fetch the sale items by saleNumber or ID.
        // The modal receives `saleNumber`. I can fetch `${API_URL}/sales?saleNumber=${saleNumber}` or similar if it exists,
        // or just use the `/sales/:id` if I had the ID. I don't have the ID, only saleNumber.
        // Actually, `POS.tsx` has `result.sale` which has the ID. I should pass the ID to the modal.

        // BUT, for this immediate step, I will format the layout. 
        // If I don't have items, I will show a placeholder or try to fetch.
        // Let's assume for this step I'll just format the header/footer and total, 
        // and I'll add a TODO to pass items.
        // WAIT, the user's image shows items. I MUST show items.
        // I will update the component to fetch sale details using the saleNumber (assuming I can find it) 
        // OR better, update POS.tsx to pass the items.
        // `POS.tsx` has `cart` state which are the items! 
        // But `POS.tsx` clears the cart after success.
        // `POS.tsx` sets `lastSale` state. I should add `items` to `lastSale`.

        // Let's update the layout first with what I have, and I'll update POS.tsx in the next step to pass items.

        printWindow.document.write(`
            <html>
            <head>
                <title>Cupom #${saleNumber}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap');
                    body {
                        font - family: 'Roboto', sans-serif;
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
                    .logo {max - width: 100px; }
                    .company-name {font - weight: bold; font-size: 16px; }

                    .section-title {
                        font - weight: bold;
                    font-size: 14px;
                    text-transform: uppercase;
                    margin-bottom: 2px;
                        }
                    .date {margin - bottom: 15px; color: #333; }

                    .table-header {
                        display: flex;
                    justify-content: space-between;
                    font-weight: bold;
                    border-bottom: 2px solid #000;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                        }

                    .item-row {margin - bottom: 8px; }
                    .item-name {font - weight: bold; font-size: 13px; }
                    .item-details {
                        display: flex;
                    justify-content: space-between;
                    font-size: 12px; 
                        }

                    .totals-section {
                        margin - top: 20px;
                    border-top: 2px solid #000;
                    padding-top: 10px; 
                        }

                    .total-row {
                        display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 10px;
                        }
                    .total-label {font - size: 20px; font-weight: bold; }
                    .total-value {font - size: 24px; font-weight: bold; }

                    .footer {
                        margin - top: 30px;
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
                    ${items.map(item => `
                        <div class="item-row">
                            <div class="item-name">${item.name}</div>
                            <div class="item-details">
                                <span>x${item.quantity} ${item.unit || 'un.'}</span>
                                <span>${formatCurrency(item.sale_price || item.price || 0)}/${item.unit || 'un.'}</span>
                                <span>${formatCurrency(item.total || item.subtotal || 0)}</span>
                            </div>
                        </div>
                        `).join('')}
                </div>

                <div class="totals-section">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Quant. total de itens</span>
                        <span>${items.length}</span>
                    </div>

                    <div class="total-row">
                        <span class="total-label">Total R$</span>
                        <span class="total-value">${formatCurrency(total)}</span>
                    </div>

                    <div style="margin-top: 10px; font-size: 13px;">
                        <strong>Forma de Pagamento:</strong> ${translatePaymentMethod(paymentMethod)}
                        ${installments && installments > 1 ? `<br/><strong>Parcelamento:</strong> ${installments}x de ${formatCurrency(total / installments)}` : ''}
                    </div>
                </div>

                <div class="footer">
                    <div>${companyName}</div>
                    <div>${fullAddress}</div>
                    <div style="margin-top: 10px; font-weight: bold; text-align: center;">SEM VALOR FISCAL</div>
                </div>

                <script>
                    window.print();
                        // window.onafterprint = function() {window.close(); }
                </script>
            </body>
        </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100">
                {/* Header com Gradiente */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-center">
                    <div className="mx-auto bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm">
                        <CheckCircle size={40} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Venda Concluída!</h2>
                    <p className="text-green-100 mt-1">Venda #{saleNumber} registrada com sucesso</p>
                </div>

                {/* Conteúdo */}
                <div className="p-8 space-y-6">
                    <div className="text-center space-y-2">
                        <p className="text-gray-500 uppercase text-xs font-semibold tracking-wider">Valor Total</p>
                        <p className="text-4xl font-bold text-gray-900">{formatCurrency(total)}</p>
                    </div>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Pagamento via</span>
                            <span className="font-medium text-gray-900">
                                {translatePaymentMethod(paymentMethod)}
                                {installments && installments > 1 ? ` (${installments}x)` : ''}
                            </span>
                        </div>
                        {change > 0 && (
                            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                                <span className="text-gray-600">Troco</span>
                                <span className="font-bold text-green-600">{formatCurrency(change)}</span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={handlePrint}
                            className="flex-1 py-3 px-4 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <Printer size={20} />
                            Imprimir Cupom
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-200"
                            autoFocus
                        >
                            Nova Venda
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>

    );
}
