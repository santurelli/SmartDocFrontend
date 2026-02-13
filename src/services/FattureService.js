import api from './api';

const FattureService = {
    getList: (params) => {
        return api.post('/fatture/list', params);
    },

    getById: (id) => {
        return api.get(`/fatture/${id}`);
    },

    getCombosMap: () => {
        return api.get('/fatture/combos-map');
    },

    getNextNum: (data) => {
        return api.get('/fatture/nextNum', { params: { data } });
    },

    save: (data) => {
        if (data.id) {
            return api.put(`/fatture/${data.id}`, data);
        }
        return api.post('/fatture', data);
    },

    delete: (id) => {
        return api.delete(`/fatture/${id}`);
    }
};

export default FattureService;
