import api from './api';

const CausaliTrasportoService = {
    getList: (params) => {
        return api.get('/causalitrasporto/list', { params });
    },
    getAllForCombo: () => {
        return api.get('/causalitrasporto/combo');
    },
    create: (descrizione, predefinita = 0) => {
        const formData = new FormData();
        formData.append('descrizione', descrizione);
        formData.append('predefinita', predefinita);
        return api.post('/causalitrasporto/create', formData);
    },
    update: (id, descrizione, predefinita = 0) => {
        const formData = new FormData();
        formData.append('id', id);
        formData.append('descrizione', descrizione);
        formData.append('predefinita', predefinita);
        return api.post('/causalitrasporto/update', formData);
    },
    delete: (id) => {
        return api.delete(`/causalitrasporto/delete?id=${id}`);
    }
};

export default CausaliTrasportoService;
