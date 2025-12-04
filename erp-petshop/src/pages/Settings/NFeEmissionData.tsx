import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';

export default function NFeEmissionData() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        series: '',
        include_surcharge: true
    });

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/admin/settings/invoices/nfe')}
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                    <ArrowLeft size={20} />
                    Voltar
                </button>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-6">
                Informe os dados usados para emissão das notas fiscais
            </h1>

            <div className="space-y-6">
                {/* Series Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex justify-between items-start gap-4">
                        <div>
                            <h3 className="font-semibold text-gray-800 mb-2">
                                Revise o número de série para emissão de NFC-e
                            </h3>
                            <p className="text-gray-500 text-sm">
                                O número de série serve para controlar as emissões das notas e identificar o tipo de emissão.
                            </p>
                        </div>
                        <div className="w-32">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Série</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={formData.series}
                                    onChange={e => setFormData({ ...formData, series: e.target.value })}
                                />
                                <HelpCircle className="absolute right-3 top-3 text-blue-400 cursor-help" size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Surcharge Toggle */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                    <div className="max-w-2xl">
                        <h3 className="font-semibold text-gray-800 mb-2">
                            Incluir o acréscimo no preço do produto pago pelo comprador na nota fiscal
                        </h3>
                        <p className="text-gray-500 text-sm">
                            Se ativar esta opção, o valor pago pelo comprador quando escolhe parcelas com acréscimo, será incluído no valor total das notas fiscais emitidas.
                        </p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.include_surcharge}
                            onChange={e => setFormData({ ...formData, include_surcharge: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
