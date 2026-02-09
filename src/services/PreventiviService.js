import api from './api';

class PreventiviService {
    getList(params) {
        return api.post('/preventivi/list', params);
    }

    exportExcel(params) {
        return api.post('/preventivi/export-excel', params, { responseType: 'blob' });
    }

    getCombosMap() {
        return api.get('/preventivi/combos-map');
    }

    getById(id) {
        return api.get(`/preventivi/${id}`);
    }

    getNextNum(data) {
        return api.get(`/preventivi/nextNum`, { params: { data } });
    }

    insert(data) {
        return api.post(`/preventivi`, data);
    }

    update(id, data) {
        return api.put(`/preventivi/${id}`, data);
    }

    delete(id) {
        return api.delete(`/preventivi/${id}`);
    }

    print(id) {
        return api.get(`/preventivi/print/${id}`, { responseType: 'blob' });
    }
}

export default new PreventiviService();
