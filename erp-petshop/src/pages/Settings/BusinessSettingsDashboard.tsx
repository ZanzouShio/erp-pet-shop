import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, FileText, CreditCard, Share2, Store, Mail } from 'lucide-react';

export default function BusinessSettingsDashboard() {
    const navigate = useNavigate();

    const cards = [
        {
            title: 'Dados do seu negócio',
            description: 'Nome, categoria e dados para que seus clientes te identifiquem.',
            icon: <Building2 className="w-6 h-6 text-gray-600" />,
            path: '/admin/settings/company'
        },
        {
            title: 'Dados de contato',
            description: 'Canais para receber comunicações e dúvidas de clientes.',
            icon: <Mail className="w-6 h-6 text-gray-600" />,
            path: '/admin/settings/company' // Reusing company settings for now, maybe scroll to contact section?
        },
        {
            title: 'Emissão de notas fiscais',
            description: 'Gestão de dados para emitir notas fiscais das suas vendas.',
            icon: <FileText className="w-6 h-6 text-gray-600" />,
            path: '/admin/settings/invoices'
        },
        {
            title: 'Preferências de cobrança',
            description: 'Configurações gerais para suas cobranças.',
            icon: <CreditCard className="w-6 h-6 text-gray-600" />,
            path: '/admin/settings/payments' // Existing payment settings
        },
        {
            title: 'Integrações',
            description: 'Parcerias para seu site e credenciais para integrar seu sistema.',
            icon: <Share2 className="w-6 h-6 text-gray-600" />,
            path: '/admin/settings/integrations'
        },
        {
            title: 'Lojas e caixas',
            description: 'Informações, meios de pagamento, caixas e colaboradores de cada loja.',
            icon: <Store className="w-6 h-6 text-gray-600" />,
            path: '/admin/settings/stores'
        }
    ];

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6">Configurações do Negócio</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cards.map((card, index) => (
                    <div
                        key={index}
                        onClick={() => navigate(card.path)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
                    >
                        <div className="mb-4">
                            {card.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{card.title}</h3>
                        <p className="text-sm text-gray-500">{card.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
