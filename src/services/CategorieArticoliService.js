import api from './api';

class CategorieArticoliService {
    getListForCombo() {
        return api.post('/categorie-articoli/listForCombo');
    }

    getList(params) {
        return api.post('/categorie-articoli/list', params);
    }

    create(data) {
        return api.post('/categorie-articoli', data);
    }

    update(id, data) {
        return api.put(`/categorie-articoli/${id}`, data);
    }

    delete(id) {
        return api.delete(`/categorie-articoli/${id}`);
    }
}

export default new CategorieArticoliService();
