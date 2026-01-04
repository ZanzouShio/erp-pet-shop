import { useState, useEffect } from 'react';
import { ShoppingBag, ChevronRight, Package } from 'lucide-react';
import { API_URL, authFetch } from '../services/api';

interface CustomerLastSalesProps {
    customerId: string | null;
}

interface SaleItem {
    name: string;
    quantity: number;
    total: number;
}

interface Sale {
    id: string;
    sale_number: number;
    created_at: string;
    total_amount: number;
    items: SaleItem[];
}

export default function CustomerLastSales({ customerId }: CustomerLastSalesProps) {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(false);
    const [hoveredSaleId, setHoveredSaleId] = useState<string | null>(null);

    useEffect(() => {
        if (customerId) {
            fetchLastSales();
        } else {
            setSales([]);
        }
    }, [customerId]);

    const fetchLastSales = async () => {
        setLoading(true);
        try {
            const response = await authFetch(`${API_URL}/sales?customerId=${customerId}&limit=3&includeItems=true`);
            if (response.ok) {
                const data = await response.json();
                setSales(data);
            }
        } catch (error) {
            console.error('Erro ao buscar últimas compras:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!customerId || sales.length === 0) return null;

    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mt-6 md:mt-0 h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingBag size={20} className="text-blue-600" />
                Últimas Compras
            </h3>

            <div className="rounded-lg border border-slate-100 relative">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-medium">
                        <tr>
                            <th className="px-3 py-2 text-left">Pedido</th>
                            <th className="px-3 py-2 text-left">Data</th>
                            <th className="px-3 py-2 text-right">Valor</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sales.map((sale) => (
                            <tr
                                key={sale.id}
                                className="group relative hover:bg-blue-50 transition-colors cursor-help"
                                onMouseEnter={() => setHoveredSaleId(sale.id)}
                                onMouseLeave={() => setHoveredSaleId(null)}
                            >
                                <td className="px-3 py-2 font-medium text-slate-700">#{sale.sale_number}</td>
                                <td className="px-3 py-2 text-slate-500">
                                    {new Date(sale.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-green-600">
                                    R$ {sale.total_amount.toFixed(2)}
                                </td>

                                {/* Hover Card */}
                                {hoveredSaleId === sale.id && (
                                    <td className="absolute left-0 bottom-full mb-1 w-full z-10 p-0 pointer-events-none">
                                        <div className="bg-slate-800 text-white text-xs rounded-lg p-3 shadow-xl w-64 mx-auto md:w-72 md:-ml-12 border border-slate-700 backdrop-blur-sm bg-opacity-95">
                                            <div className="font-bold mb-2 flex items-center gap-2 pb-2 border-b border-slate-600">
                                                <Package size={14} />
                                                Itens do Pedido #{sale.sale_number}
                                            </div>
                                            <ul className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                                {sale.items.map((item, idx) => (
                                                    <li key={idx} className="flex justify-between items-start gap-2">
                                                        <span className="flex-1 text-slate-200">{item.quantity}x {item.name}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                            <div className="mt-2 pt-2 border-t border-slate-600 text-right font-bold text-green-400">
                                                Total: R$ {sale.total_amount.toFixed(2)}
                                            </div>
                                        </div>
                                        {/* Seta do Tooltip */}
                                        <div className="w-3 h-3 bg-slate-800 rotate-45 transform mx-auto -mt-1.5 border-r border-b border-slate-700"></div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
