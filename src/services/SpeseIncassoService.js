import api from './api';

class SpeseIncassoService {
    getAll() {
        return api.get('/spese-incasso/combo');
    }

    getList(params) {
        return api.get('/spese-incasso/list', { params });
    }

    save(data) {
        return api.post('/spese-incasso/save', data);
    }

    delete(id) {
        return api.delete(`/spese-incasso/delete/${id}`);
    }
}

export default new SpeseIncassoService();
