import api from './api';

const AvvisiService = {
    getAll: async () => {
        return await api.get('/avvisi');
    },

    insert: async (avviso) => {
        return await api.post('/avvisi', avviso);
    },

    update: async (id, avviso) => {
        return await api.put(`/avvisi/${id}`, avviso);
    },

    delete: async (id) => {
        return await api.delete(`/avvisi/${id}`);
    }
};

export default AvvisiService;
