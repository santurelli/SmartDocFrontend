import api from './api';

const PianoDeiContiService = {
    getList: async (search = '') => {
        const response = await api.get('/piano-conti/list', { params: { search } });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/piano-conti/${id}`);
        return response.data;
    },

    create: async (dto) => {
        const response = await api.post('/piano-conti', dto);
        return response.data;
    },

    update: async (id, dto) => {
        const response = await api.put(`/piano-conti/${id}`, dto);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/piano-conti/${id}`);
        return response.data;
    },

    importaStandard: async () => {
        const response = await api.post('/piano-conti/importa-standard');
        return response.data;
    },

    getSettoreCorrente: async () => {
        const response = await api.get('/piano-conti/settore-corrente');
        return response.data;
    }
};

export default PianoDeiContiService;
