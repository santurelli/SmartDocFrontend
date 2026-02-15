import api from './api';

const NoteCreditoService = {
    getList: (params) => {
        return api.get('/note-credito', { params });
    },

    getById: (id) => {
        return api.get(`/note-credito/${id}`);
    },

    getCombosMap: () => {
        return api.get('/note-credito/combos');
    },

    getNextNum: (data, flElettronica) => {
        return api.get('/note-credito/nextNum', { params: { data, flElettronica } });
    },

    save: (data) => {
        return api.post('/note-credito', data);
    },

    delete: (id, user) => {
        return api.delete(`/note-credito/${id}`, { params: { user } });
    },

    print: (id) => {
        return api.get(`/note-credito/print/${id}`, { responseType: 'blob' });
    }
};

export default NoteCreditoService;
