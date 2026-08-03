import api from './api';
import authStorage from './authStorage';

const PrimaNotaService = {
    getAll: (params) => {
        return api.get('/primanota', { params });
    },

    getById: (id) => {
        return api.get(`/primanota/${id}`);
    },

    create: (data) => {
        return api.post('/primanota', data);
    },

    update: (id, data) => {
        return api.put(`/primanota/${id}`, data);
    },

    delete: (id) => {
        // Assume ID utente 1 per default (andrebbe preso dallo storage o dal token backend in una app reale)
        const user = authStorage.getCurrentUser();
        const idUtente = user && user.user ? user.user.id : 1;
        return api.delete(`/primanota/${id}/${idUtente}`);
    },

    getRisorseCombo: () => {
        return api.get('/risorse/combo');
    },

    getTipiPagamentoCombo: () => {
        return api.get('/tipi-pagamento/combo');
    },

    exportExcel: (criteria) => {
        return api.post('/primanota/export-excel', criteria, {
            responseType: 'blob'
        });
    },

    exportCsv: (criteria) => {
        return api.post('/primanota/export-csv', criteria, {
            responseType: 'blob'
        });
    },

    exportDatev: (criteria, beraterNr, mandantNr) => {
        const params = {};
        if (beraterNr) params.beraterNr = beraterNr;
        if (mandantNr) params.mandantNr = mandantNr;
        return api.post('/primanota/export-datev', criteria, {
            params,
            responseType: 'blob'
        });
    }
};

export default PrimaNotaService;
