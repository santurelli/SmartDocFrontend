import api from './api';

const ConfOrdineService = {
    getList: (params) => {
        return api.post('/conf-ordine/list', params);
    },

    getById: (id) => {
        return api.get(`/conf-ordine/${id}`);
    },

    getCombosMap: () => {
        return api.get('/conf-ordine/combos-map');
    },

    getNextNum: (data) => {
        return api.get('/conf-ordine/nextNum', { params: { data } });
    },

    save: (data) => {
        if (data.id) {
            return api.put(`/conf-ordine/${data.id}`, data);
        }
        return api.post('/conf-ordine', data);
    },

    delete: (id) => {
        return api.delete(`/conf-ordine/${id}`);
    },

    print: (id) => {
        return api.get(`/conf-ordine/print/${id}`, { responseType: 'blob' });
    }
};

export default ConfOrdineService;
