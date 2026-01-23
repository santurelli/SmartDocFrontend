import api from './api';

const RisorseService = {
    getAll: () => {
        return api.get('/risorse');
    },
    getAllForCombo: (tipologia) => {
        return api.get(`/risorse/combo?tipologia=${tipologia || ''}`);
    },
    insert: (data) => {
        return api.post('/risorse', data);
    },
    update: (id, data) => {
        return api.put(`/risorse/${id}`, data);
    },
    delete: (id) => {
        return api.delete(`/risorse/${id}`);
    }
};

export default RisorseService;
