import api from './api';

const VettoriService = {
    getAll: () => {
        return api.get('/vettori');
    },
    getAllForCombo: () => {
        return api.get('/vettori/combo');
    },
    insert: (data) => {
        return api.post('/vettori', data);
    },
    update: (id, data) => {
        return api.put(`/vettori/${id}`, data);
    },
    delete: (id) => {
        return api.delete(`/vettori/${id}`);
    }
};

export default VettoriService;
