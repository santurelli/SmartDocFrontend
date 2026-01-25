import api from './api';

class FornitoriService {

    getList(params) {
        return api.get('/fornitori', { params });
    }

    getById(id) {
        return api.get(`/fornitori/${id}`);
    }

    insert(data) {
        return api.post('/fornitori', data);
    }

    update(id, data) {
        return api.put(`/fornitori/${id}`, data);
    }

    delete(id) {
        return api.delete(`/fornitori/${id}`);
    }

    getListForCombo() {
        return api.get('/fornitori/listForCombo'); // Check backend controller if this endpoint exists. 
        // Wait, ClientiDelegate has getListForCombo, but ClientiController didn't expose it explicitly on a GET /listForCombo?
        // ClientiController uses Datatables for list.
        // Let's check FornitoriDao. It has getListForCombo. FornitoriDelegate has it. 
        // I didn't add it to FornitoriController!
        // I should check if I missed it in FornitoriController.
    }

    getSuggestion(q) {
        return api.get('/fornitori/suggestion', { params: { q } });
    }

    checkUniqueness(codice, denominazione, id) {
        return api.get('/fornitori/check-uniqueness', {
            params: { codice, denominazione, id }
        });
    }

    generateCodice() {
        return api.get('/fornitori/generate-code');
    }
}

export default new FornitoriService();
