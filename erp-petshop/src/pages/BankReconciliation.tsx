import { useState, useEffect } from 'react';
import { Check, Upload, Link as LinkIcon, Plus, RefreshCw } from 'lucide-react';

import { API_URL, authFetch } from '../services/api';
import { useToast } from '../components/Toast';

interface BankTransaction {
    id: string;
    bank_transaction_date: string;
    bank_description: string;
    bank_amount: number;
    status: string;
}

interface SystemTransaction {
    id: string;
    date: string;
    description: string;
    amount: number;
    type: 'revenue' | 'expense';
    category?: string;
}

interface BankAccount {
    id: string;
    name: string;
    bank_name: string;
}

export default function BankReconciliation() {
    const toast = useToast();
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState('');

    const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([]);
    const [systemTransactions, setSystemTransactions] = useState<SystemTransaction[]>([]);

    const [selectedBankItem, setSelectedBankItem] = useState<string | null>(null);
    const [selectedSystemItem, setSelectedSystemItem] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [importing, setImporting] = useState(false);

    useEffect(() => {
        loadBankAccounts();
    }, []);

    useEffect(() => {
        if (selectedAccount) {
            loadReconciliationData();
        }
    }, [selectedAccount]);

    const loadBankAccounts = async () => {
        try {
            const res = await authFetch(`${API_URL}/financial/bank-accounts`);
            const data = await res.json();
            setBankAccounts(data);
            if (data.length > 0) setSelectedAccount(data[0].id);
        } catch (error) {
            console.error('Erro ao carregar contas:', error);
        }
    };

    const loadReconciliationData = async () => {
        if (!selectedAccount) return;
        setLoading(true);
        try {
            const res = await authFetch(`${API_URL}/bank-reconciliation?bank_account_id=${selectedAccount}`);
            const data = await res.json();
            setBankTransactions(data.bankTransactions || []);
            setSystemTransactions(data.systemTransactions || []);

            // Limpar seleções
            setSelectedBankItem(null);
            setSelectedSystemItem(null);
        } catch (error) {
            console.error('Erro ao carregar dados de conciliação:', error);
        } finally {
            setLoading(false);
        }
    };

    // const fileInputRef = useRef<HTMLInputElement>(null); // Não necessário pois estou usando getElementById por simplicidade

    const parseOFX = (content: string) => {
        const transactions: any[] = [];
        const lines = content.split('\n');
        let currentTransaction: any = {};
        let inTransaction = false;

        for (const line of lines) {
            if (line.includes('<STMTTRN>')) {
                inTransaction = true;
                currentTransaction = {};
            } else if (line.includes('</STMTTRN>')) {
                inTransaction = false;
                if (currentTransaction.date && currentTransaction.amount) {
                    transactions.push(currentTransaction);
                }
            } else if (inTransaction) {
                if (line.includes('<TRNAMT>')) {
                    currentTransaction.amount = parseFloat(line.split('<TRNAMT>')[1].split('<')[0]);
                } else if (line.includes('<MEMO>')) {
                    currentTransaction.description = line.split('<MEMO>')[1].split('<')[0];
                } else if (line.includes('<DTPOSTED>')) {
                    const dateStr = line.split('<DTPOSTED>')[1].split('<')[0];
                    // Formato OFX: YYYYMMDDHHMMSS
                    const year = dateStr.substring(0, 4);
                    const month = dateStr.substring(4, 6);
                    const day = dateStr.substring(6, 8);
                    currentTransaction.date = `${year}-${month}-${day}`;
                }
            }
        }
        return transactions;
    };

    const parseCSV = (content: string) => {
        const lines = content.split('\n');
        const transactions: any[] = [];
        // Tentar detectar separador
        const separator = lines[0].includes(';') ? ';' : ',';

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const parts = line.split(separator);
            if (parts.length >= 3) {
                // Assumindo formato: Data, Descrição, Valor (ou variações simples)
                // Ajustar conforme necessidade ou pedir mapeamento. 
                // Implementação genérica:
                const date = parts[0].trim(); // Tentar parsear data
                const description = parts[1].trim();
                const amount = parseFloat(parts[2].replace(',', '.').trim());

                if (!isNaN(amount)) {
                    transactions.push({
                        date: new Date(date).toISOString().split('T')[0], // Simplificação
                        description,
                        amount
                    });
                }
            }
        }
        return transactions;
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedAccount) return;

        setImporting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            const content = e.target?.result as string;
            let transactions: any[] = [];

            try {
                if (file.name.toLowerCase().endsWith('.ofx')) {
                    transactions = parseOFX(content);
                } else if (file.name.toLowerCase().endsWith('.csv')) {
                    transactions = parseCSV(content);
                } else {
                    toast.error('Formato não suportado. Use .ofx ou .csv');
                    setImporting(false);
                    return;
                }

                if (transactions.length === 0) {
                    toast.warning('Nenhuma transação encontrada no arquivo.');
                    setImporting(false);
                    return;
                }

                const res = await authFetch(`${API_URL}/bank-reconciliation/import`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        bank_account_id: selectedAccount,
                        transactions
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    toast.success(data.message || 'Importação realizada com sucesso!');
                    loadReconciliationData();
                } else {
                    toast.error('Erro ao importar transações.');
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao processar arquivo.');
            } finally {
                setImporting(false);
                if (event.target) event.target.value = ''; // Reset input
            }
        };

        reader.readAsText(file);
    };

    const handleImportClick = () => {
        if (!selectedAccount) { toast.error('Selecione uma conta bancária'); return; }
        document.getElementById('import-file-input')?.click();
    };

    // ... (rest of the component)

    // No JSX:
    // <input 
    //    type="file" 
    //    id="import-file-input" 
    //    className="hidden" 
    //    accept=".ofx,.csv" 
    //    onChange={handleFileSelect} 
    // />
    // <button onClick={handleImportClick} ... >

    const handleMatch = async () => {
        if (!selectedBankItem || !selectedSystemItem) return;

        try {
            const res = await authFetch(`${API_URL}/bank-reconciliation/match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bank_reconciliation_id: selectedBankItem,
                    financial_transaction_id: selectedSystemItem
                })
            });

            if (res.ok) {
                // Remover itens das listas visualmente
                setBankTransactions(prev => prev.filter(i => i.id !== selectedBankItem));
                setSystemTransactions(prev => prev.filter(i => i.id !== selectedSystemItem));
                setSelectedBankItem(null);
                setSelectedSystemItem(null);
                toast.success('Conciliado com sucesso!');
            } else {
                toast.error('Erro ao conciliar');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao conciliar');
        }
    };

    const handleCreateAndMatch = async () => {
        if (!selectedBankItem) return;

        const bankItem = bankTransactions.find(i => i.id === selectedBankItem);
        if (!bankItem) return;

        if (!confirm(`Deseja criar uma transação financeira para "${bankItem.bank_description}" no valor de R$ ${bankItem.bank_amount}?`)) return;

        try {
            const res = await authFetch(`${API_URL}/bank-reconciliation/create-and-match`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bank_reconciliation_id: selectedBankItem,
                    transaction_data: {
                        description: bankItem.bank_description,
                        category: 'Ajuste Bancário' // Poderia abrir modal para escolher
                    }
                })
            });

            if (res.ok) {
                setBankTransactions(prev => prev.filter(i => i.id !== selectedBankItem));
                setSelectedBankItem(null);
                toast.success('Transação criada e conciliada!');
            } else {
                toast.error('Erro ao criar e conciliar');
            }
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar e conciliar');
        }
    };

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

    return (
        <div className="p-6 space-y-6 h-screen flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Conciliação Bancária</h1>
                    <p className="text-gray-500">Compare o extrato bancário com o sistema</p>
                </div>
                <div className="flex gap-3 items-center">
                    <select
                        className="p-2 border rounded-lg bg-white"
                        value={selectedAccount}
                        onChange={(e) => setSelectedAccount(e.target.value)}
                    >
                        {bankAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.bank_name} - {acc.name}</option>
                        ))}
                    </select>
                    <input
                        type="file"
                        id="import-file-input"
                        className="hidden"
                        accept=".ofx,.csv"
                        onChange={handleFileSelect}
                    />
                    <button
                        onClick={handleImportClick}
                        disabled={importing}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                        <Upload size={20} /> {importing ? 'Importando...' : 'Importar Extrato'}
                    </button>
                    <button
                        onClick={loadReconciliationData}
                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                        title="Atualizar"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex justify-between items-center shrink-0">
                <div className="flex gap-4 text-sm text-blue-800">
                    <div className="flex items-center gap-2">
                        <span className="font-bold">Extrato:</span>
                        {selectedBankItem ? '1 Selecionado' : 'Nenhum'}
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold">Sistema:</span>
                        {selectedSystemItem ? '1 Selecionado' : 'Nenhum'}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleMatch}
                        disabled={!selectedBankItem || !selectedSystemItem}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedBankItem && selectedSystemItem
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <LinkIcon size={18} /> Conciliar (Match)
                    </button>
                    <button
                        onClick={handleCreateAndMatch}
                        disabled={!selectedBankItem || selectedSystemItem !== null}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${selectedBankItem && !selectedSystemItem
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <Plus size={18} /> Criar e Conciliar
                    </button>
                </div>
            </div>

            {/* Main Content - Two Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">

                {/* Coluna Extrato */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <Upload size={18} /> Extrato Bancário (Pendentes)
                        </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {loading ? <p className="text-center p-4 text-gray-500">Carregando...</p> :
                            bankTransactions.length === 0 ? <p className="text-center p-4 text-gray-500">Nenhum item pendente.</p> :
                                bankTransactions.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedBankItem(item.id === selectedBankItem ? null : item.id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedBankItem === item.id
                                            ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                                            : 'border-gray-200 bg-white hover:border-blue-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.bank_description}</p>
                                                <p className="text-xs text-gray-500">{formatDate(item.bank_transaction_date)}</p>
                                            </div>
                                            <span className={`font-bold ${item.bank_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatCurrency(Number(item.bank_amount))}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                    </div>
                </div>

                {/* Coluna Sistema */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <h2 className="font-bold text-gray-700 flex items-center gap-2">
                            <Check size={18} /> Transações do Sistema (Não Conciliadas)
                        </h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2 space-y-2">
                        {loading ? <p className="text-center p-4 text-gray-500">Carregando...</p> :
                            systemTransactions.length === 0 ? <p className="text-center p-4 text-gray-500">Nenhuma transação encontrada.</p> :
                                systemTransactions.map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedSystemItem(item.id === selectedSystemItem ? null : item.id)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md ${selectedSystemItem === item.id
                                            ? 'border-green-500 bg-green-50 ring-1 ring-green-500'
                                            : 'border-gray-200 bg-white hover:border-green-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium text-gray-900">{item.description}</p>
                                                <p className="text-xs text-gray-500">
                                                    {formatDate(item.date)} • {item.category || 'Sem Categoria'}
                                                </p>
                                            </div>
                                            <span className={`font-bold ${item.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.type === 'revenue' ? '+' : '-'}{formatCurrency(Number(item.amount))}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
