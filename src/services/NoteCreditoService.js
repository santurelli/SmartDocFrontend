import api from './api';

const NoteCreditoService = {
    getList: (params) => {
        return api.post('/note-credito/list', params);
    },

    getById: (id) => {
        return api.get(`/note-credito/${id}`);
    },

    getCombosMap: () => {
        return api.get('/note-credito/combos-map');
    },

    getNextNum: (data) => {
        return api.get('/note-credito/nextNum', { params: { data } });
    },

    save: (data) => {
        if (data.id) {
            return api.put(`/note-credito/${data.id}`, data);
        }
        return api.post('/note-credito', data);
    },

    delete: (id) => {
        return api.delete(`/note-credito/${id}`);
    }
};

export default NoteCreditoService;
