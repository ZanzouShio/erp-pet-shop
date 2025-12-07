import { api } from '../services/api';

export interface Groomer {
    id: string;
    name: string;
    email: string;
    seniority_level: 'JUNIOR' | 'MID' | 'SENIOR' | 'EXPERT';
    speed_factor: number;
    commission_rate: number;
    is_active: boolean;
}

export interface GroomingService {
    id: string;
    name: string;
    description: string;
    base_price: number;
    is_active: boolean;
    _count?: { items: number };
}

export interface GroomingResource {
    id: string;
    name: string;
    type: 'BANHEIRA' | 'MESA' | 'SECADOR' | 'OUTRO';
    is_active: boolean;
}

export interface ServiceMatrixEntry {
    id?: string;
    service_id: string;
    breed_size: 'P' | 'M' | 'G' | 'GIG';
    coat_type: 'curto' | 'longo' | 'duplo';
    base_duration: number; // minutes
    price_adder: number;
}

export const managementService = {
    // Groomers
    listGroomers: async (): Promise<Groomer[]> => {
        const response = await api.get('/groomers');
        return response.data;
    },

    createGroomer: async (data: Partial<Groomer>) => {
        const response = await api.post('/groomers', data);
        return response.data;
    },

    updateGroomer: async (id: string, data: Partial<Groomer>) => {
        const response = await api.put(`/groomers/${id}`, data);
        return response.data;
    },

    deleteGroomer: async (id: string) => {
        const response = await api.delete(`/groomers/${id}`);
        return response.data;
    },

    // Services
    listServices: async (): Promise<GroomingService[]> => {
        const response = await api.get('/grooming-services');
        return response.data;
    },

    createService: async (data: Partial<GroomingService>) => {
        const response = await api.post('/grooming-services', data);
        return response.data;
    },

    updateService: async (id: string, data: Partial<GroomingService>) => {
        const response = await api.put(`/grooming-services/${id}`, data);
        return response.data;
    },

    deleteService: async (id: string) => {
        const response = await api.delete(`/grooming-services/${id}`);
        return response.data;
    },

    // Resources
    listResources: async (): Promise<GroomingResource[]> => {
        const response = await api.get('/grooming-resources');
        return response.data;
    },

    createResource: async (data: Partial<GroomingResource>) => {
        const response = await api.post('/grooming-resources', data);
        return response.data;
    },

    updateResource: async (id: string, data: Partial<GroomingResource>) => {
        const response = await api.put(`/grooming-resources/${id}`, data);
        return response.data;
    },

    deleteResource: async (id: string) => {
        const response = await api.delete(`/grooming-resources/${id}`);
        return response.data;
    },

    // Service Matrix
    getServiceMatrix: async (serviceId: string): Promise<ServiceMatrixEntry[]> => {
        const response = await api.get(`/service-matrix/${serviceId}`);
        return response.data;
    },

    upsertMatrixEntry: async (entry: Partial<ServiceMatrixEntry>) => {
        const response = await api.post('/service-matrix', entry);
        return response.data;
    },

    deleteMatrixEntry: async (id: string) => {
        const response = await api.delete(`/service-matrix/${id}`);
        return response.data;
    }
};
