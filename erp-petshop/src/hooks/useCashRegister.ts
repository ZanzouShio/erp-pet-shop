import { useState, useEffect, useCallback } from 'react';
import { API_URL, authFetch } from '../services/api';

interface CashRegister {
    id: string;
    terminalId: string;
    terminalName?: string;
    operatorId: string;
    operatorName?: string;
    openedAt: string;
    openingBalance: number;
    currentBalance: number;
    status: string;
    movements: any[];
}

interface CashRegisterState {
    isOpen: boolean;
    register: CashRegister | null;
    loading: boolean;
    error: string | null;
}

interface UseCashRegisterReturn {
    state: CashRegisterState;
    checkStatus: (terminalId: string) => Promise<void>;
    openCash: (terminalId: string, openingBalance: number, notes?: string, userId?: string) => Promise<boolean>;
    closeCash: (closingBalance: number, notes?: string, userId?: string) => Promise<{ success: boolean; summary?: any }>;
    sangria: (amount: number, reason: string, userId?: string) => Promise<boolean>;
    suprimento: (amount: number, reason?: string, userId?: string) => Promise<boolean>;
    getReport: () => Promise<any>;
}

const useCashRegister = (): UseCashRegisterReturn => {
    const [state, setState] = useState<CashRegisterState>({
        isOpen: false,
        register: null,
        loading: true,
        error: null
    });

    const checkStatus = useCallback(async (terminalId: string) => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const response = await authFetch(`${API_URL}/cash-registers/status/${terminalId}`);
            const data = await response.json();

            if (data.isOpen) {
                setState({
                    isOpen: true,
                    register: data.register,
                    loading: false,
                    error: null
                });
            } else {
                setState({
                    isOpen: false,
                    register: null,
                    loading: false,
                    error: null
                });
            }
        } catch (error) {
            console.error('Error checking cash register status:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: 'Erro ao verificar status do caixa'
            }));
        }
    }, []);

    const openCash = useCallback(async (
        terminalId: string,
        openingBalance: number,
        notes?: string,
        userId?: string
    ): Promise<boolean> => {
        try {
            setState(prev => ({ ...prev, loading: true, error: null }));

            const storedUser = localStorage.getItem('user');
            const currentUserId = userId || (storedUser ? JSON.parse(storedUser).id : undefined);

            const response = await authFetch(`${API_URL}/cash-registers/open`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    terminalId,
                    openingBalance,
                    notes,
                    userId: currentUserId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao abrir caixa');
            }

            // Refresh status
            await checkStatus(terminalId);
            return true;
        } catch (error: any) {
            console.error('Error opening cash register:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Erro ao abrir caixa'
            }));
            return false;
        }
    }, [checkStatus]);

    const closeCash = useCallback(async (
        closingBalance: number,
        notes?: string,
        userId?: string
    ): Promise<{ success: boolean; summary?: any }> => {
        try {
            if (!state.register?.id) {
                throw new Error('Nenhum caixa aberto');
            }

            setState(prev => ({ ...prev, loading: true, error: null }));

            const storedUser = localStorage.getItem('user');
            const currentUserId = userId || (storedUser ? JSON.parse(storedUser).id : undefined);

            const response = await authFetch(`${API_URL}/cash-registers/${state.register.id}/close`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    closingBalance,
                    notes,
                    userId: currentUserId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao fechar caixa');
            }

            setState({
                isOpen: false,
                register: null,
                loading: false,
                error: null
            });

            return { success: true, summary: data.summary };
        } catch (error: any) {
            console.error('Error closing cash register:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Erro ao fechar caixa'
            }));
            return { success: false };
        }
    }, [state.register?.id]);

    const sangria = useCallback(async (
        amount: number,
        reason: string,
        userId?: string
    ): Promise<boolean> => {
        try {
            if (!state.register?.id) {
                throw new Error('Nenhum caixa aberto');
            }

            setState(prev => ({ ...prev, loading: true, error: null }));

            const storedUser = localStorage.getItem('user');
            const currentUserId = userId || (storedUser ? JSON.parse(storedUser).id : undefined);

            const response = await authFetch(`${API_URL}/cash-registers/${state.register.id}/sangria`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    reason,
                    userId: currentUserId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao realizar sangria');
            }

            // Refresh status to get updated balance
            await checkStatus(state.register.terminalId);
            return true;
        } catch (error: any) {
            console.error('Error performing sangria:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Erro ao realizar sangria'
            }));
            return false;
        }
    }, [state.register?.id, state.register?.terminalId, checkStatus]);

    const suprimento = useCallback(async (
        amount: number,
        reason?: string,
        userId?: string
    ): Promise<boolean> => {
        try {
            if (!state.register?.id) {
                throw new Error('Nenhum caixa aberto');
            }

            setState(prev => ({ ...prev, loading: true, error: null }));

            const storedUser = localStorage.getItem('user');
            const currentUserId = userId || (storedUser ? JSON.parse(storedUser).id : undefined);

            const response = await authFetch(`${API_URL}/cash-registers/${state.register.id}/suprimento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount,
                    reason,
                    userId: currentUserId
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao realizar suprimento');
            }

            // Refresh status to get updated balance
            await checkStatus(state.register.terminalId);
            return true;
        } catch (error: any) {
            console.error('Error performing suprimento:', error);
            setState(prev => ({
                ...prev,
                loading: false,
                error: error.message || 'Erro ao realizar suprimento'
            }));
            return false;
        }
    }, [state.register?.id, state.register?.terminalId, checkStatus]);

    const getReport = useCallback(async (): Promise<any> => {
        try {
            if (!state.register?.id) {
                throw new Error('Nenhum caixa aberto');
            }

            const response = await authFetch(`${API_URL}/cash-registers/${state.register.id}/report`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Erro ao obter relatório');
            }

            return data;
        } catch (error: any) {
            console.error('Error getting report:', error);
            throw error;
        }
    }, [state.register?.id]);

    return {
        state,
        checkStatus,
        openCash,
        closeCash,
        sangria,
        suprimento,
        getReport
    };
};

export default useCashRegister;
