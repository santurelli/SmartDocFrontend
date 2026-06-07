import api from './api';
import authService from './authService';

const NoteCreditoFornitoreService = {
    getList: (params) => {
        return api.get('/note-credito-fornitore', { params });
    },

    getById: (id) => {
        return api.get(`/note-credito-fornitore/${id}`);
    },

    getCombosMap: () => {
        return api.get('/note-credito-fornitore/combos');
    },

    save: (data) => {
        return api.post('/note-credito-fornitore', data);
    },

    delete: (id) => {
        const user = authService.getCurrentUser()?.id;
        return api.delete(`/note-credito-fornitore/${id}`, { params: { user } });
    },

    updateScadenzaPagamento: (data) => {
        return api.put('/note-credito-fornitore/scadenze', data);
    },

    getNextNum: (data) => {
        return api.get('/note-credito-fornitore/nextNum', { params: { data } });
    }
};

export default NoteCreditoFornitoreService;
