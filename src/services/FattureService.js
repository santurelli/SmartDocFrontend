import api from './api';
import authService from './authService';

const FattureService = {
    getList: (params) => {
        return api.get('/fatture', { params });
    },

    getById: (id) => {
        return api.get(`/fatture/${id}`);
    },

    getCombosMap: () => {
        return api.get('/fatture/combos');
    },

    getNextNum: (data, flElettronica, tipo) => {
        return api.get('/fatture/nextNum', { params: { data, flElettronica, tipo } });
    },

    save: (data) => {
        return api.post('/fatture', data);
    },

    delete: (id) => {
        const user = authService.getCurrentUser()?.id;
        return api.delete(`/fatture/${id}`, { params: { user } });
    },

    print: (id) => {
        return api.get(`/fatture/print/${id}`, { responseType: 'blob' });
    }
};

export default FattureService;
