import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, FileText, Settings, ChevronRight, ShieldCheck, AlertCircle, Check } from 'lucide-react';

export default function NFCeSettings() {
    const navigate = useNavigate();
    // Mock state for demonstration - in real app this would come from backend
    const [status] = useState({
        certificate: true,
        emissionData: true,
        taxes: true
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
                    <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        <Settings size={24} />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-800">Emissor de NFC-e</h1>
                        <p className="text-sm text-gray-500">Exclusivo para vendas presenciais feitas diretamente para um consumidor.</p>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Section 1 */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Configure o emissor de NFC-e</h2>
                    <div className="space-y-4">
                        {/* Certificate */}
                        <div
                            onClick={() => navigate('/admin/settings/invoices/nfce/certificate')}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <IconWithCheck icon={ShieldCheck} configured={status.certificate} />
                                    <div>
                                        <h3 className="font-medium text-gray-800">Anexar o certificado A1 para autorizar a emissão das notas fiscais</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {status.certificate ? 'Válido até 01 de dezembro de 2025.' : 'Necessário arquivo .pfx e senha'}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-sm font-medium text-blue-600 hover:underline">Editar</span>
                            </div>
                        </div>

                        {/* Emission Data */}
                        <div
                            onClick={() => navigate('/admin/settings/invoices/nfce/data')}
                            className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer group"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <IconWithCheck icon={FileText} configured={status.emissionData} />
                                    <div>
                                        <h3 className="font-medium text-gray-800">Informar os dados usados para emissão das notas fiscais</h3>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {status.emissionData ? 'CSC informado. Série 2. Acréscimo no preço do produto incluído.' : 'Série, Número e Token CSC'}
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
                        onClick={() => navigate('/admin/settings/invoices/nfce/taxes')}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer group"
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
                                        PIS/COFINS - Operação Isenta da Contribuição e ICMS - Não tributada pelo Simples Nacional. Sem mensagem personalizada na nota fiscal.
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
