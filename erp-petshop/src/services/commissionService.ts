import { api } from './api';

export interface Commission {
    id: string;
    date: string;
    customer_name: string;
    pet_name: string;
    service_name: string;
    professional_name: string;
    price: number;
    commission_value: number;
    status: 'pending' | 'paid' | 'cancelled';
    paid_at?: string;
}

export interface CommissionFilters {
    start_date?: string;
    end_date?: string;
    professional_id?: string;
    status?: string;
}

export const commissionService = {
    list: async (filters: CommissionFilters): Promise<Commission[]> => {
        // Filter empty values
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });

        const response = await api.get(`/commissions?${params.toString()}`);
        return response.data;
    },

    pay: async (ids: string[], payment_method: string, notes: string) => {
        const response = await api.post('/commissions/pay', {
            ids,
            payment_method,
            notes
        });
        return response.data;
    }
};
