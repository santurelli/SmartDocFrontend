import api from './api';

const MarcheService = {
    getAll: async (params = {}) => {
        const response = await api.post('/marche/list', params);
        return response.data;
    },

    getCombo: async () => {
        const response = await api.get('/marche/combo');
        return response.data?.payload || [];
    },

    getById: async (id) => {
        const response = await api.get(`/marche/${id}`);
        return response.data?.payload;
    },

    create: async (data) => {
        const response = await api.post('/marche', data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/marche/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/marche/${id}`);
        return response.data;
    }
};

export default MarcheService;
