import api from './api';

class ClientiService {

    getList(params) {
        return api.get('/clienti', { params });
    }

    getById(id) {
        return api.get(`/clienti/${id}`);
    }

    insert(data) {
        return api.post('/clienti', data);
    }

    update(id, data) {
        return api.put(`/clienti/${id}`, data);
    }

    delete(id) {
        return api.delete(`/clienti/${id}`);
    }

    getSuggestion(q) {
        return api.get('/clienti/suggestion', { params: { q } });
    }

    checkUniqueness(codice, denominazione, id) {
        return api.get('/clienti/check-uniqueness', {
            params: { codice, denominazione, id }
        });
    }
    generateCodice() {
        return api.get('/clienti/generate-code');
    }

    exportExcel(params) {
        return api.get('/clienti/export-excel', { params, responseType: 'blob' });
    }
}

export default new ClientiService();
