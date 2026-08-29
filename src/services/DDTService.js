import api from './api';

const DDTService = {
    getList: (params) => {
        return api.post('/ddt/list', params);
    },

    exportExcel: (params) => {
        return api.post('/ddt/export-excel', params, { responseType: 'blob' });
    },

    search: (params) => {
        return api.post('/ddt/list', params);
    },

    getById: (id) => {
        return api.get(`/ddt/${id}`);
    },

    getCombosMap: () => {
        return api.get('/ddt/combos-map');
    },

    getNextNum: (data) => {
        return api.get('/ddt/nextNum', { params: { data } });
    },

    save: (data) => {
        if (data.id) {
            return api.put(`/ddt/${data.id}`, data);
        }
        return api.post('/ddt', data);
    },

    delete: (id) => {
        return api.delete(`/ddt/${id}`);
    },

    print: (id) => {
        return api.get(`/ddt/print/${id}`, { responseType: 'blob' });
    }
};

export default DDTService;
