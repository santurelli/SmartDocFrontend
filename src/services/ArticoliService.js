import api from './api';

class ArticoliService {
    getList(params) {
        return api.post('/articoli/list', params);
    }

    getSuggestion(search) {
        return this.getList({
            start: 0,
            length: 20,
            search: search,
            orderColumn: 1,
            orderDir: 'asc'
        });
    }

    getById(id) {
        return api.get(`/articoli/${id}`);
    }

    checkCode(codice, id) {
        return api.post('/articoli/check-code', { codice, id });
    }

    create(data) {
        return api.post('/articoli/create', data);
    }

    update(data) {
        return api.post('/articoli/update', data);
    }

    getNextCode() {
        return api.get('/articoli/next-code');
    }

    delete(id) {
        return api.delete(`/articoli/${id}`);
    }

    // Alias for getById to match component usage
    getArticolo(id) {
        return this.getById(id);
    }

    createArticolo(data) {
        return this.create(data);
    }

    updateArticolo(id, data) {
        return this.update({ ...data, id });
    }

    getCategorie() {
        return api.post('/categorie-articoli/listForCombo');
    }

    getSottoCategorie(idCategoria) {
        return api.post(`/sottocategorie/listForCombo?idCategoria=${idCategoria}`);
    }

    getDivisioni() {
        return api.post('/divisioni/listForCombo');
    }

    getUnitaMisura() {
        return api.post('/unitamisura/listForCombo');
    }

    getAliquoteIva() {
        return api.post('/aliquoteiva/listForCombo');
    }

    // --- Formati ---
    getFormati() {
        return api.post('/formatiarticolo/listForCombo');
    }

    getListFormati(params) {
        return api.post('/formatiarticolo/list', params);
    }

    createFormato(data) {
        return api.post('/formatiarticolo', data);
    }

    updateFormato(id, data) {
        return api.put(`/formatiarticolo/${id}`, data);
    }

    deleteFormato(id) {
        return api.delete(`/formatiarticolo/${id}`);
    }

    // --- Scelte ---
    getScelte() {
        return api.post('/sceltearticolo/listForCombo');
    }

    getListScelte(params) {
        return api.post('/sceltearticolo/list', params);
    }

    createScelta(data) {
        return api.post('/sceltearticolo', data);
    }

    updateScelta(id, data) {
        return api.put(`/sceltearticolo/${id}`, data);
    }

    deleteScelta(id) {
        return api.delete(`/sceltearticolo/${id}`);
    }

    // --- Toni ---
    getToni() {
        return api.post('/toniarticolo/listForCombo');
    }

    getListToni(params) {
        return api.post('/toniarticolo/list', params);
    }

    createTono(data) {
        return api.post('/toniarticolo', data);
    }

    updateTono(id, data) {
        return api.put(`/toniarticolo/${id}`, data);
    }

    deleteTono(id) {
        return api.delete(`/toniarticolo/${id}`);
    }

    // --- Calibri ---
    getCalibri() {
        return api.post('/calibriarticolo/listForCombo');
    }

    getListCalibri(params) {
        return api.post('/calibriarticolo/list', params);
    }

    createCalibro(data) {
        return api.post('/calibriarticolo', data);
    }

    updateCalibro(id, data) {
        return api.put(`/calibriarticolo/${id}`, data);
    }

    deleteCalibro(id) {
        return api.delete(`/calibriarticolo/${id}`);
    }
}

export default new ArticoliService();
