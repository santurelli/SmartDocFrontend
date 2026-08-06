import api from './api';
import authService from './authService';

const OrdiniService = {
    getList: (params) => {
        return api.get('/ordini', { params });
    },

    getOrdiniAperti: (idFornitore) => {
        return api.get('/ordini/aperti', { params: { idFornitore } });
    },

    getById: (id) => {
        return api.get(`/ordini/${id}`);
    },

    getCombosMap: () => {
        return api.get('/ordini/combos');
    },

    save: (data) => {
        if (data.id) {
            return api.put(`/ordini/${data.id}`, data);
        }
        return api.post('/ordini', data);
    },

    delete: (id) => {
        const user = authService.getCurrentUser()?.id;
        return api.delete(`/ordini/${id}`, { params: { user } });
    },

    isExistentNumero: (params) => {
        return api.get('/ordini/exists', { params });
    },

    getNextNum: (data) => {
        return api.get('/ordini/nextNum', { params: { data } });
    }
};

export default OrdiniService;
