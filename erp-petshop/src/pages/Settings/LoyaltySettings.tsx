import React, { useState, useEffect } from 'react';
import { Save, Gift, Wallet } from 'lucide-react';
import { API_URL, authFetch } from '../../services/api';
import { useToast } from '../../components/Toast';

interface Settings {
    loyalty_enabled: boolean;
    loyalty_points_per_real: number;
    cashback_enabled: boolean;
    cashback_percentage: number;
    cashback_expire_days: number;
}

export default function LoyaltySettings() {
    const toast = useToast();
    const [settings, setSettings] = useState<Settings>({
        loyalty_enabled: false,
        loyalty_points_per_real: 1,
        cashback_enabled: false,
        cashback_percentage: 0,
        cashback_expire_days: 90
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const response = await authFetch(`${API_URL}/settings`);
            if (response.ok) {
                const data = await response.json();
                setSettings({
                    loyalty_enabled: data.loyalty_enabled || false,
                    loyalty_points_per_real: Number(data.loyalty_points_per_real) || 1,
                    cashback_enabled: data.cashback_enabled || false,
                    cashback_percentage: Number(data.cashback_percentage) || 0,
                    cashback_expire_days: Number(data.cashback_expire_days) || 90
                });
            }
        } catch (error) {
            console.error('Erro ao carregar configurações:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await authFetch(`${API_URL}/settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                toast.success('Configurações salvas com sucesso!');
            } else {
                toast.error('Erro ao salvar configurações');
            }
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Carregando...</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Gift className="text-pink-600" />
                Fidelidade e Cashback
            </h1>

            <div className="space-y-6">
                {/* Programa de Pontos */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Gift className="text-purple-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Programa de Pontos</h2>
                                <p className="text-sm text-gray-500">Acúmulo de pontos para troca por prêmios</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.loyalty_enabled}
                                onChange={e => setSettings(prev => ({ ...prev, loyalty_enabled: e.target.checked }))}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                    </div>

                    {settings.loyalty_enabled && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Pontos por Real (R$)
                            </label>
                            <input
                                type="number"
                                value={settings.loyalty_points_per_real}
                                onChange={e => setSettings(prev => ({ ...prev, loyalty_points_per_real: Number(e.target.value) }))}
                                className="w-full max-w-xs p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                min="0.1"
                                step="0.1"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Ex: 1 ponto a cada R$ 1,00 gasto.
                            </p>
                        </div>
                    )}
                </div>

                {/* Cashback */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Wallet className="text-green-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800">Cashback (Carteira Virtual)</h2>
                                <p className="text-sm text-gray-500">Devolve parte do valor gasto como saldo para próximas compras</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={settings.cashback_enabled}
                                onChange={e => setSettings(prev => ({ ...prev, cashback_enabled: e.target.checked }))}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                    </div>

                    {settings.cashback_enabled && (
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Porcentagem de Cashback (%)
                                </label>
                                <input
                                    type="number"
                                    value={settings.cashback_percentage}
                                    onChange={e => setSettings(prev => ({ ...prev, cashback_percentage: Number(e.target.value) }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Validade do Saldo (Dias)
                                </label>
                                <input
                                    type="number"
                                    value={settings.cashback_expire_days}
                                    onChange={e => setSettings(prev => ({ ...prev, cashback_expire_days: Number(e.target.value) }))}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                    min="1"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={20} />
                        {saving ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                </div>
            </div>
        </div>
    );
}
