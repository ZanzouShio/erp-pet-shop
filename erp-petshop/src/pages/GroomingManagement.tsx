import React, { useState } from 'react';
import { Users, Scissors, Package, Settings, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ProfessionalsTab from '../components/management/ProfessionalsTab';
import ServicesTab from '../components/management/ServicesTab';
import ResourcesTab from '../components/management/ResourcesTab';

export default function GroomingManagement() {
    const [activeTab, setActiveTab] = useState<'professionals' | 'services' | 'resources'>('professionals');
    const navigate = useNavigate();

    return (
        <div className="h-full flex flex-col bg-gray-50">
            <header className="bg-white border-b px-6 py-4 flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/scheduler')}
                    className="p-2 -ml-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Gestão do Banho & Tosa</h1>
                    <p className="text-sm text-gray-500">Gerencie profissionais, serviços e recursos</p>
                </div>
            </header>

            <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">
                {/* Tabs */}
                <div className="flex space-x-1 bg-gray-200 p-1 rounded-xl mb-6 w-fit">
                    <button
                        onClick={() => setActiveTab('professionals')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'professionals' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Users size={18} /> Profissionais
                    </button>
                    <button
                        onClick={() => setActiveTab('services')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'services' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Scissors size={18} /> Serviços & Preços
                    </button>
                    <button
                        onClick={() => setActiveTab('resources')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'resources' ? 'bg-white text-blue-600 shadow' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <Package size={18} /> Recursos
                    </button>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-xl shadow-sm border p-6 flex-1">
                    {activeTab === 'professionals' && (
                        <ProfessionalsTab />
                    )}
                    {activeTab === 'services' && (
                        <ServicesTab />
                    )}
                    {activeTab === 'resources' && (
                        <ResourcesTab />
                    )}
                </div>
            </div>
        </div>
    );
}
