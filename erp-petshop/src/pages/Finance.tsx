import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

const API_URL = 'http://localhost:3001/api';

interface NfeItem {
    code: string;
    ean: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    matchedProduct: any | null;
    matchType: 'EAN' | 'SUPPLIER' | null;
}

interface NfeData {
    number: string;
    series: string;
    date: string;
    supplier: {
        cnpj: string;
        name: string;
        tradeName: string;
    };
    total: number;
}

export default function Finance() {
    const [activeTab, setActiveTab] = useState('import');
    const [dragActive, setDragActive] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [nfeData, setNfeData] = useState<NfeData | null>(null);
    const [items, setItems] = useState<NfeItem[]>([]);
    const [error, setError] = useState('');

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = (file: File) => {
        if (file.type !== 'text/xml' && !file.name.endsWith('.xml')) {
            setError('Por favor, envie um arquivo XML válido.');
            return;
        }
        setFile(file);
        setError('');
        uploadFile(file);
    };

    const uploadFile = async (file: File) => {
        const formData = new FormData();
        formData.append('xml', file);

        try {
            setUploading(true);
            const response = await fetch(`${API_URL}/financial/nfe/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Erro ao processar arquivo');
            }

            const data = await response.json();
            setNfeData(data.nfe);
            setItems(data.items);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro desconhecido');
            setFile(null);
        } finally {
            setUploading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Módulo Financeiro</h1>
                    <p className="text-gray-500 mt-1">Gestão de notas fiscais, contas e fluxo de caixa</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('import')}
                        className={`${activeTab === 'import'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <Upload size={18} />
                        Importação NF-e
                    </button>
                    <button
                        onClick={() => setActiveTab('payable')}
                        className={`${activeTab === 'payable'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <TrendingDown size={18} />
                        Contas a Pagar
                    </button>
                    <button
                        onClick={() => setActiveTab('receivable')}
                        className={`${activeTab === 'receivable'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <TrendingUp size={18} />
                        Contas a Receber
                    </button>
                    <button
                        onClick={() => setActiveTab('cashflow')}
                        className={`${activeTab === 'cashflow'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <DollarSign size={18} />
                        Fluxo de Caixa
                    </button>
                </nav>
            </div>

            {/* Conteúdo da Aba Importação */}
            {activeTab === 'import' && (
                <div className="space-y-6">
                    {!nfeData ? (
                        <div
                            className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'
                                }`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                        >
                            <div className="flex flex-col items-center justify-center">
                                <div className="p-4 bg-indigo-50 rounded-full mb-4">
                                    <FileText className="w-8 h-8 text-indigo-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Arraste o XML da NF-e aqui
                                </h3>
                                <p className="text-gray-500 mb-6">
                                    ou clique para selecionar do seu computador
                                </p>
                                <input
                                    type="file"
                                    id="file-upload"
                                    className="hidden"
                                    accept=".xml"
                                    onChange={handleChange}
                                />
                                <label
                                    htmlFor="file-upload"
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition cursor-pointer"
                                >
                                    Selecionar Arquivo
                                </label>
                                {error && (
                                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        {error}
                                    </div>
                                )}
                                {uploading && (
                                    <p className="mt-4 text-indigo-600 animate-pulse">Processando arquivo...</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            {/* Cabeçalho da Nota */}
                            <div className="p-6 border-b border-gray-200 bg-gray-50">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                                            NF-e {nfeData.number} <span className="text-sm font-normal text-gray-500">Série {nfeData.series}</span>
                                        </h2>
                                        <p className="text-gray-600">{nfeData.supplier.name}</p>
                                        <p className="text-sm text-gray-500">CNPJ: {nfeData.supplier.cnpj}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Valor Total</p>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(nfeData.total)}</p>
                                        <p className="text-sm text-gray-500 mt-1">Emissão: {new Date(nfeData.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabela de Itens */}
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Itens da Nota</h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto (XML)</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">EAN</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qtd</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Un.</th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vínculo</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {items.map((item, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3">
                                                        {item.matchedProduct ? (
                                                            <CheckCircle className="text-green-500 w-5 h-5" />
                                                        ) : (
                                                            <AlertCircle className="text-orange-500 w-5 h-5" />
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{item.code}</td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-500">{item.ean}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-900">{item.quantity}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(item.unitPrice)}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">{formatCurrency(item.totalPrice)}</td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {item.matchedProduct ? (
                                                            <span className="text-green-700 bg-green-100 px-2 py-1 rounded-full text-xs font-medium">
                                                                Encontrado ({item.matchType})
                                                            </span>
                                                        ) : (
                                                            <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">
                                                                Vincular Manualmente
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Ações */}
                            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
                                <button
                                    onClick={() => {
                                        setNfeData(null);
                                        setItems([]);
                                        setFile(null);
                                    }}
                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
                                    onClick={async () => {
                                        try {
                                            setUploading(true);
                                            const response = await fetch(`${API_URL}/financial/nfe/confirm`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify({ items, nfeData })
                                            });

                                            if (!response.ok) {
                                                const errorData = await response.json();
                                                throw new Error(errorData.error || 'Erro ao confirmar entrada');
                                            }

                                            alert('Entrada confirmada com sucesso! Produtos criados/atualizados.');
                                            setNfeData(null);
                                            setItems([]);
                                            setFile(null);
                                        } catch (error) {
                                            alert('Erro ao confirmar: ' + error);
                                        } finally {
                                            setUploading(false);
                                        }
                                    }}
                                    disabled={uploading}
                                >
                                    <CheckCircle size={18} />
                                    {uploading ? 'Processando...' : 'Confirmar Entrada'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab !== 'import' && (
                <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-500 text-lg font-medium">Módulo em desenvolvimento</p>
                    <p className="text-gray-400 text-sm mt-2">Em breve: {activeTab === 'payable' ? 'Contas a Pagar' : activeTab === 'receivable' ? 'Contas a Receber' : 'Fluxo de Caixa'}</p>
                </div>
            )}
        </div>
    );
}
