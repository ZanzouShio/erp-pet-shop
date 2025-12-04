import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Plus, Trash2 } from 'lucide-react';

export default function NFeTaxes() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        pis_cofins_cst: '07',
        icms_csosn: '102',
        custom_message: ''
    });

    const [contacts, setContacts] = useState([
        { name: 'Contador', document: '' }
    ]);

    const addContact = () => {
        if (contacts.length < 9) {
            setContacts([...contacts, { name: '', document: '' }]);
        }
    };

    const removeContact = (index: number) => {
        setContacts(contacts.filter((_, i) => i !== index));
    };

    const updateContact = (index: number, field: 'name' | 'document', value: string) => {
        const newContacts = [...contacts];
        newContacts[index][field] = value;
        setContacts(newContacts);
    };

    return (
        <div className="p-6 max-w-4xl mx-auto pb-24">
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
                Definir impostos e mensagem personalizada
            </h1>

            <div className="space-y-6">
                {/* PIS/COFINS */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-2">CST do PIS/COFINS</h3>
                    <p className="text-gray-500 text-sm mb-4">
                        O Código de Situação Tributária (CST) de PIS/COFINS serve para definir se o imposto vai ser retido em suas notas fiscais de venda.
                    </p>

                    <label className="block text-sm font-medium text-gray-700 mb-1">CST do PIS/COFINS</label>
                    <div className="relative">
                        <select
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white"
                            value={formData.pis_cofins_cst}
                            onChange={e => setFormData({ ...formData, pis_cofins_cst: e.target.value })}
                        >
                            <option value="07">07 - Operação Isenta da Contribuição</option>
                            <option value="01">01 - Operação Tributável</option>
                            <option value="08">08 - Operação sem Incidência da Contribuição</option>
                        </select>
                        <HelpCircle className="absolute right-3 top-3 text-blue-400 cursor-help" size={20} />
                    </div>
                </div>

                {/* ICMS CSOSN */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-800">CSOSN do ICMS</h3>
                    </div>

                    <div className="divide-y divide-gray-100">
                        {[
                            { id: '102', label: '102 - Tributada pelo Simples Nacional sem permissão de Crédito', desc: 'Vendas aos consumidores finais sem destaque da alíquota do ICMS devido pelo Simples Nacional' },
                            { id: '103', label: '103 - Isenção do ICMS no Simples Nacional para faixa de receita bruta', desc: 'Vendas contempladas com isenção do ICMS para receita bruta até R$360.000 (em 2016) nos termos da LC 123/06.' },
                            { id: '300', label: '300 - Imune', desc: 'Vendas contempladas com imunidade do ICMS. Atenção: obrigatório credenciamento no RECOPI NACIONAL.' },
                            { id: '400', label: '400 - Não tributada pelo Simples Nacional', desc: 'Vendas não sujeitas à tributação pelo ICMS dentro do Simples Nacional.' },
                            { id: '500', label: '500 - ICMS cobrado anteriormente por substituição tributária (substituído) ou por antecipação', desc: 'Vendas de produtos cujo ICMS já tenha sido retido anteriormente por substituição tributária.' }
                        ].map(option => (
                            <label key={option.id} className="flex items-start gap-4 p-6 cursor-pointer hover:bg-gray-50 transition-colors">
                                <input
                                    type="radio"
                                    name="csosn"
                                    value={option.id}
                                    checked={formData.icms_csosn === option.id}
                                    onChange={e => setFormData({ ...formData, icms_csosn: e.target.value })}
                                    className="mt-1 w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="block font-medium text-gray-800">{option.label}</span>
                                    <span className="block text-sm text-gray-500 mt-1">{option.desc}</span>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Custom Message */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-2">Adicione mensagens personalizadas nas suas notas fiscais <span className="text-gray-400 font-normal text-sm">| Opcional</span></h3>
                    <p className="text-gray-500 text-sm mb-4">
                        Aqui você adiciona informações que podem ser exigidas para a sua empresa, como benefícios, isenções ou tributos diferenciados.
                    </p>

                    <textarea
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-32 resize-none"
                        value={formData.custom_message}
                        onChange={e => setFormData({ ...formData, custom_message: e.target.value })}
                        maxLength={300}
                    ></textarea>
                    <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>Você pode digitar # e inserir informações específicas da venda.</span>
                        <span>{formData.custom_message.length}/300</span>
                    </div>

                    <div className="bg-gray-100 p-4 rounded-lg mt-4 text-sm text-gray-600">
                        <p className="font-medium mb-2">Informações que exibimos obrigatoriamente:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li>Emitido por ME/EPP optante do Simples Nacional.</li>
                            <li>Sem direito a crédito fiscal de ICMS/ISS/IPI.</li>
                            <li>Valor aproximado dos tributos (IBPT).</li>
                        </ul>
                    </div>
                </div>

                {/* XML Contacts */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-2">Cadastre até 9 contatos para acessar o XML de suas notas <span className="text-gray-400 font-normal text-sm">| Opcional</span></h3>
                    <p className="text-gray-500 text-sm mb-6">
                        Esses contatos vão poder acessar as notas no Portal da Nota Fiscal Eletrônica que forem emitidas a partir da data de cadastro.
                    </p>

                    <div className="space-y-4">
                        {contacts.map((contact, index) => (
                            <div key={index} className="flex gap-4 items-end">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome do contato</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={contact.name}
                                        onChange={e => updateContact(index, 'name', e.target.value)}
                                        placeholder="Ex: Contador"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF/CNPJ</label>
                                    <input
                                        type="text"
                                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                        value={contact.document}
                                        onChange={e => updateContact(index, 'document', e.target.value)}
                                    />
                                </div>
                                <button
                                    onClick={() => removeContact(index)}
                                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                    </div>

                    {contacts.length < 9 && (
                        <button
                            onClick={addContact}
                            className="mt-6 w-full py-3 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus size={20} />
                            Adicionar contato
                        </button>
                    )}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-10">
                <div className="max-w-4xl mx-auto flex justify-end">
                    <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                        Salvar
                    </button>
                </div>
            </div>
        </div>
    );
}
