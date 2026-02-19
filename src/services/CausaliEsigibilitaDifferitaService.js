import api from './api';

const CausaliEsigibilitaDifferitaService = {
    getList: (params) => {
        return api.get('/causaliesigibilita/list', { params });
    },
    getListForCombo: () => {
        return api.get('/causaliesigibilita/combo');
    },
    create: (descrizione) => {
        const params = new URLSearchParams();
        params.append('descrizione', descrizione);
        return api.post('/causaliesigibilita/create', params);
    },
    update: (id, descrizione) => {
        const params = new URLSearchParams();
        params.append('id', id);
        params.append('descrizione', descrizione);
        return api.post('/causaliesigibilita/update', params);
    },
    delete: (id) => {
        return api.delete('/causaliesigibilita/delete', { params: { id } });
    }
};

export default CausaliEsigibilitaDifferitaService;
