import React, { useState, useEffect, useRef } from 'react';
import { Search, User, X } from 'lucide-react';
import { API_URL } from '../services/api';

interface Customer {
    id: string;
    name: string;
    cpf_cnpj: string;
    wallet_balance: number;
    loyalty_points: number;
}

interface CustomerSearchProps {
    onSelectCustomer: (customer: Customer | null) => void;
    selectedCustomer: Customer | null;
}

export default function CustomerSearch({ onSelectCustomer, selectedCustomer }: CustomerSearchProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm.length >= 2) {
                searchCustomers();
            } else {
                setCustomers([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const searchCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/customers?search=${searchTerm}&limit=5`);
            if (response.ok) {
                const data = await response.json();
                setCustomers(data.data || []);
                setShowResults(true);
            }
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (customer: Customer) => {
        onSelectCustomer(customer);
        setSearchTerm('');
        setShowResults(false);
    };

    const handleClear = () => {
        onSelectCustomer(null);
        setSearchTerm('');
    };

    if (selectedCustomer) {
        return (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                        <User size={20} />
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800">{selectedCustomer.name}</p>
                        <div className="flex gap-4 text-xs text-gray-500">
                            <span>CPF/CNPJ: {selectedCustomer.cpf_cnpj || 'N/A'}</span>
                            <span className="text-green-600 font-medium">
                                Cashback: R$ {Number(selectedCustomer.wallet_balance || 0).toFixed(2)}
                            </span>
                            <span className="text-purple-600 font-medium">
                                Pontos: {selectedCustomer.loyalty_points || 0}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={handleClear}
                    className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors"
                    title="Remover cliente"
                >
                    <X size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="relative" ref={searchRef}>
            <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar cliente (Nome, CPF, Telefone)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
                {loading && (
                    <div className="absolute right-3 top-3.5">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
                    </div>
                )}
            </div>

            {showResults && customers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {customers.map((customer) => (
                        <button
                            key={customer.id}
                            onClick={() => handleSelect(customer)}
                            className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-center justify-between group"
                        >
                            <div>
                                <p className="font-medium text-gray-800 group-hover:text-blue-600">{customer.name}</p>
                                <p className="text-xs text-gray-500">{customer.cpf_cnpj || 'Sem documento'}</p>
                            </div>
                            {Number(customer.wallet_balance) > 0 && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                    R$ {Number(customer.wallet_balance).toFixed(2)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
