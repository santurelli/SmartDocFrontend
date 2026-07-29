import api from './api';
import authService from './authService';

const FattureFornitoreService = {
    getList: (params) => {
        return api.get('/fatture-fornitore', { params });
    },

    getById: (id) => {
        return api.get(`/fatture-fornitore/${id}`);
    },

    getCombosMap: () => {
        return api.get('/fatture-fornitore/combos');
    },

    save: (data) => {
        if (data.id) {
            return api.put(`/fatture-fornitore/${data.id}`, data);
        }
        return api.post('/fatture-fornitore', data);
    },

    delete: (id) => {
        const user = authService.getCurrentUser()?.id;
        return api.delete(`/fatture-fornitore/${id}`, { params: { user } });
    },

    updateScadenzaPagamento: (data) => {
        return api.put('/fatture-fornitore/scadenze', data);
    },

    getNextNum: (data) => {
        return api.get('/fatture-fornitore/nextNum', { params: { data } });
    }
};

export default FattureFornitoreService;
