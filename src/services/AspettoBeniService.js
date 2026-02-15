import api from './api';

const AspettoBeniService = {
    getList: (params) => {
        return api.get('/aspettobeni/list', { params });
    },
    getAllForCombo: () => {
        return api.get('/aspettobeni/combo');
    },
    create: (descrizione) => {
        const formData = new FormData();
        formData.append('descrizione', descrizione);
        return api.post('/aspettobeni/create', formData);
    },
    update: (id, descrizione) => {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('descrizione', descrizione);
        return api.post('/aspettobeni/update', formData);
    },
    delete: (id) => {
        return api.delete(`/aspettobeni/delete?id=${id}`);
    }
};

export default AspettoBeniService;
