import api from './api';

class PreventiviService {
    getList(params) {
        // Backend uses @RequestParam Map<String, String> on a POST /list
        // We need to send form-data or x-www-form-urlencoded, not JSON.
        const formData = new FormData();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                formData.append(key, params[key]);
            }
        });
        return api.post('/preventivi/list', formData);
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
}

export default new PreventiviService();
