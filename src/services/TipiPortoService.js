import api from './api';

const TipiPortoService = {
    getAll: () => {
        return api.get('/tipiporto');
    },
    getAllForCombo: () => {
        return api.get('/tipiporto/combo');
    },
    insert: (data) => {
        return api.post('/tipiporto', data);
    },
    update: (id, data) => {
        return api.put(`/tipiporto/${id}`, data);
    },
    delete: (id) => {
        return api.delete(`/tipiporto/${id}`);
    }
};

export default TipiPortoService;
