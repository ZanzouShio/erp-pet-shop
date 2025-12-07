import { api } from './api';

export interface Appointment {
    id: string;
    customer_id: string;
    pet_id: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    professional_id?: string; // Derived from services in some views
    // ... other fields
    services: any[];
    resources: any[];
    customers: { name: string };
    pets: { name: string; breed?: string };
    conditions?: string[];
}

export const appointmentService = {
    calculateDuration: async (data: {
        serviceIds: string[],
        petId: string,
        professionalId: string,
        conditions: string[]
    }) => {
        const response = await api.post('/appointments/calculate', data);
        return response.data;
    },

    create: async (data: any) => {
        const response = await api.post('/appointments', data);
        return response.data;
    },

    list: async (params: { date?: string, startDate?: string, endDate?: string, professionalId?: string }) => {
        const response = await api.get('/appointments', { params });
        return response.data;
    },

    update: async (id: string, data: any) => {
        const response = await api.patch(`/appointments/${id}`, data);
        return response.data;
    },

    delete: async (id: string) => {
        await api.delete(`/appointments/${id}`);
    },

    getGroomingOptions: async () => {
        const [services, professionals, resources] = await Promise.all([
            api.get('/grooming/services'),
            api.get('/grooming/professionals'),
            api.get('/grooming/resources')
        ]);
        return {
            services: services.data,
            professionals: professionals.data,
            resources: resources.data
        };
    }
};
