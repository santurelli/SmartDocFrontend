import api from './api';
import authService from './authService';

const BollaCaricoService = {
    getList: (params) => {
        return api.get('/bollecarico', { params });
    },

    getById: (id) => {
        return api.get(`/bollecarico/${id}`);
    },

    getCombosMap: () => {
        return api.get('/bollecarico/combos');
    },

    save: (data) => {
        if (data.id) {
            return api.put(`/bollecarico/${data.id}`, data);
        }
        return api.post('/bollecarico', data);
    },

    delete: (id) => {
        const user = authService.getCurrentUser()?.id;
        return api.delete(`/bollecarico/${id}`, { params: { user } });
    },

    isExistentNumero: (params) => {
        return api.get('/bollecarico/exists', { params });
    },

    getNextNum: (data) => {
        return api.get('/bollecarico/nextNum', { params: { data } });
    }
};

export default BollaCaricoService;
