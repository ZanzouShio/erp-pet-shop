import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { API_URL } from '../../services/api';

interface AuditLog {
    id: string;
    action: string;
    entity_type: string;
    entity_id: string;
    description: string;
    reason?: string;
    metadata?: any;
    user_name: string;
    created_at: string;
}

type Period = 'today' | 'week' | 'month' | 'all' | 'custom';

export default function AuditLogs() {
    const navigate = useNavigate();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState<Period>('week');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [entityTypes, setEntityTypes] = useState<string[]>([]);
    const [selectedEntityType, setSelectedEntityType] = useState('');
    const [actions, setActions] = useState<string[]>([]);
    const [selectedAction, setSelectedAction] = useState('');
    const [expandedLog, setExpandedLog] = useState<string | null>(null);

    // Update dates when period changes
    useEffect(() => {
        const today = new Date();
        let start = new Date();
        let end = new Date();

        switch (period) {
            case 'today':
                break;
            case 'week':
                const day = today.getDay();
                start.setDate(today.getDate() - day);
                break;
            case 'month':
                start.setDate(1);
                break;
            case 'all':
                start = new Date(2020, 0, 1);
                break;
            case 'custom':
                return;
        }

        setStartDate(format(start, 'yyyy-MM-dd'));
        setEndDate(format(end, 'yyyy-MM-dd'));
    }, [period]);

    // Load logs
    useEffect(() => {
        if (startDate && endDate) loadLogs();
    }, [startDate, endDate, selectedEntityType, selectedAction]);

    // Load filters on mount
    useEffect(() => {
        loadFilters();
    }, []);

    const loadFilters = async () => {
        try {
            const [typesRes, actionsRes] = await Promise.all([
                fetch(`${API_URL}/audit-logs/entity-types`),
                fetch(`${API_URL}/audit-logs/actions`)
            ]);
            if (typesRes.ok) {
                setEntityTypes(await typesRes.json());
            }
            if (actionsRes.ok) {
                setActions(await actionsRes.json());
            }
        } catch (error) {
            console.error('Erro ao carregar filtros:', error);
        }
    };

    const loadLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                limit: '200'
            });
            if (selectedEntityType) params.append('entity_type', selectedEntityType);
            if (selectedAction) params.append('action', selectedAction);

            const response = await fetch(`${API_URL}/audit-logs?${params}`);
            if (response.ok) {
                setLogs(await response.json());
            }
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatEntityType = (type: string) => {
        const types: Record<string, string> = {
            'accounts_payable': 'Contas a Pagar',
            'sales': 'Vendas',
            'products': 'Produtos',
            'customers': 'Clientes',
            'suppliers': 'Fornecedores'
        };
        return types[type] || type;
    };

    const formatAction = (action: string) => {
        const actions: Record<string, { label: string; color: string }> = {
            'CANCEL': { label: 'Cancelamento', color: 'red' },
            'DELETE': { label: 'Exclusão', color: 'red' },
            'UPDATE': { label: 'Alteração', color: 'yellow' },
            'CREATE': { label: 'Criação', color: 'green' },
            'REFUND': { label: 'Estorno', color: 'orange' }
        };
        const config = actions[action] || { label: action, color: 'gray' };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Back Button */}
            <button
                onClick={() => navigate('/admin/settings')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
                <ArrowLeft size={20} />
                <span>Voltar para Configurações</span>
            </button>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <FileText className="text-indigo-600" />
                        Logs de Auditoria
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Histórico de ações críticas no sistema
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Período</label>
                    <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
                        {(['today', 'week', 'month', 'all', 'custom'] as Period[]).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${period === p
                                    ? 'bg-white text-indigo-700 shadow-sm border border-gray-100'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                {p === 'today' && 'Hoje'}
                                {p === 'week' && 'Esta Semana'}
                                {p === 'month' && 'Este Mês'}
                                {p === 'all' && 'Todos'}
                                {p === 'custom' && 'Personalizado'}
                            </button>
                        ))}
                    </div>
                </div>

                {period === 'custom' && (
                    <>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            />
                        </div>
                    </>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Entidade</label>
                    <select
                        value={selectedEntityType}
                        onChange={e => setSelectedEntityType(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="">Todas</option>
                        {entityTypes.map(type => (
                            <option key={type} value={type}>{formatEntityType(type)}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ação</label>
                    <select
                        value={selectedAction}
                        onChange={e => setSelectedAction(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="">Todas</option>
                        {actions.map(action => (
                            <option key={action} value={action}>{action}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando...</div>
                ) : logs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum log encontrado.</div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {logs.map(log => (
                            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            {formatAction(log.action)}
                                            <span className="text-sm font-medium text-gray-700">
                                                {formatEntityType(log.entity_type)}
                                            </span>
                                        </div>
                                        <p className="text-gray-800">{log.description}</p>
                                        {log.reason && (
                                            <p className="text-sm text-gray-500 mt-1">
                                                <span className="font-medium">Motivo:</span> {log.reason}
                                            </p>
                                        )}
                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Clock size={12} />
                                                {new Date(log.created_at).toLocaleString('pt-BR')}
                                            </span>
                                            <span>por {log.user_name}</span>
                                        </div>
                                    </div>
                                    {log.metadata && (
                                        <button
                                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                                            className="text-xs text-indigo-600 hover:text-indigo-800"
                                        >
                                            {expandedLog === log.id ? 'Ocultar' : 'Detalhes'}
                                        </button>
                                    )}
                                </div>
                                {expandedLog === log.id && log.metadata && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-xs font-mono overflow-x-auto">
                                        <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
