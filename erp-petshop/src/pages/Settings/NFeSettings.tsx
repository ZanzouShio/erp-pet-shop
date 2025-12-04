import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Settings, ChevronRight, ShieldCheck, AlertCircle, Check } from 'lucide-react';

export default function NFeSettings() {
    const navigate = useNavigate();
    // Mock state
    const [status] = useState({
        certificate: false,
        emissionData: false,
        taxes: false
    });

    const IconWithCheck = ({ icon: Icon, configured }: { icon: any, configured: boolean }) => (
        <div className="relative">
            <div className={`p-3 rounded-full transition-colors ${configured ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                <Icon size={24} />
            </div>
            {configured && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-0.5 border-2 border-white">
                    <Check size={12} strokeWidth={3} />
                </div>
            )}
        </div>
    );

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/settings/invoices')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    title="Voltar"
                >
                    <ArrowLeft size={24} className="text-gray-600" />
                </button>
                <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Emissor de NF-e</h1>
                        <p className="text-sm text-gray-500">Serve para vendas online e para emitir nota de devolução.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Section 1 */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Configure o emissor de NF-e</h2>
                    <div className="space-y-4">
                        {/* Certificate */}
                        <div
                            onClick={() => navigate('/admin/settings/invoices/nfe/certificate')}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <IconWithCheck icon={ShieldCheck} configured={status.certificate} />
                                    <div>
                                        <h3 className="font-medium text-gray-800">Anexar o certificado A1 para autorizar a emissão das notas fiscais</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {status.certificate ? 'Certificado válido.' : 'Necessário arquivo .pfx e senha'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-blue-600 hover:underline">Editar</span>
                            </div>
                        </div>

                        {/* Emission Data */}
                        <div
                            onClick={() => navigate('/admin/settings/invoices/nfe/data')}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <IconWithCheck icon={FileText} configured={status.emissionData} />
                                    <div>
                                        <h3 className="font-medium text-gray-800">Informar os dados usados para emissão das notas fiscais</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {status.emissionData ? 'Dados configurados.' : 'Série e Numeração'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-blue-600 hover:underline">Editar</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2 */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Configuração opcional</h2>
                    <div
                        onClick={() => navigate('/admin/settings/invoices/nfe/taxes')}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-orange-300 transition-colors cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <IconWithCheck icon={AlertCircle} configured={status.taxes} />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-medium text-gray-800">Impostos e mensagem personalizada</h3>
                                        {!status.taxes && <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">PREDEFINIDO</span>}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        PIS/COFINS, ICMS e contatos para envio de XML.
                                    </p>
                                </div>
                            </div>
                            <span className="text-sm font-medium text-blue-600 hover:underline">Editar</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
