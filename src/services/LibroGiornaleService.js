import api from './api';

const LibroGiornaleService = {
    getList: async (params = {}) => {
        const response = await api.get('/libro-giornale/list', { params });
        return response.data;
    },

    inserisciManuale: async (dto) => {
        const response = await api.post('/libro-giornale/manuale', dto);
        return response.data;
    },

    aggiornaManuale: async (id, dto) => {
        const response = await api.put(`/libro-giornale/manuale/${id}`, dto);
        return response.data;
    },

    eliminaManuale: async (id) => {
        const response = await api.delete(`/libro-giornale/manuale/${id}`);
        return response.data;
    },

    print: (params = {}) => {
        return api.get('/libro-giornale/pdf', { params, responseType: 'blob' });
    }
};

export default LibroGiornaleService;
