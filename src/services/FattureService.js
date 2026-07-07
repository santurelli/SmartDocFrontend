import api from './api';
import authService from './authService';

const FattureService = {
    getList: (params) => {
        return api.get('/fatture', { params });
    },

    getById: (id) => {
        return api.get(`/fatture/${id}`);
    },

    getCombosMap: (tipo) => {
        return api.get('/fatture/combos', { params: { tipo } });
    },

    getNextNum: (data, flElettronica, tipo) => {
        return api.get('/fatture/nextNum', { params: { data, flElettronica, tipo } });
    },

    save: (data) => {
        return api.post('/fatture', data);
    },

    delete: (id) => {
        const user = authService.getCurrentUser()?.id;
        return api.delete(`/fatture/${id}`, { params: { user } });
    },

    print: (id) => {
        return api.get(`/fatture/print/${id}`, { responseType: 'blob' });
    },

    getUltimeFatture: () => {
        return api.get('/fatture/ultime');
    },

    sendSdi: (id) => {
        return api.put(`/fatture/${id}/send-sdi`);
    },

    inviaOra: (id) => {
        return api.get(`/batch/run-invio-fattura/${id}`);
    },

    importXml: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/fatture/import-xml', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },

    downloadXml: (id) => {
        return api.get(`/fatture/download-xml/${id}`, { responseType: 'blob' });
    }
};

export default FattureService;
