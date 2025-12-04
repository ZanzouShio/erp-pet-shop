import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Smartphone, ArrowLeft, ChevronRight } from 'lucide-react';

export default function InvoiceSettings() {
    const navigate = useNavigate();

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/settings/business')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Voltar"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-bold text-gray-800">
                    Configurações de notas fiscais
                </h1>
            </div>

            <div className="space-y-4">
                {/* NFC-e Card */}
                <div
                    onClick={() => navigate('/admin/settings/invoices/nfce')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                            <Smartphone size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-600 transition-colors">
                                Emissor de NFC-e
                            </h3>
                            <p className="text-sm text-gray-500">
                                Exclusivo para vendas presenciais feitas diretamente para um consumidor.
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                </div>

                {/* NF-e Card */}
                <div
                    onClick={() => navigate('/admin/settings/invoices/nfe')}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
                            <FileText size={32} />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                                Emissor de NF-e
                            </h3>
                            <p className="text-sm text-gray-500">
                                Serve para vendas online e para emitir nota de devolução.
                            </p>
                        </div>
                    </div>
                    <ChevronRight className="text-gray-400 group-hover:text-orange-600 transition-colors" />
                </div>
            </div>
        </div>
    );
}
