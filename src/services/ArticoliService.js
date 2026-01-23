import api from './api';

class ArticoliService {
    getList(params) {
        return api.post('/articoli/list', params);
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
}

export default new ArticoliService();
