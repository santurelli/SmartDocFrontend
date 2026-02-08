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

    getCategorie() {
        return api.post('/categorie-articoli/listForCombo');
    }

    getSottoCategorie(idCategoria) {
        return api.post(`/sottocategorie/listForCombo`, { idCategoria });
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
}

export default new ArticoliService();
