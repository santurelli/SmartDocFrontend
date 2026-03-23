import api from './api';

class ListiniService {
    async getAll() {
        const response = await api.get('/listini/list');
        return response.data;
    }

    async getById(id) {
        const response = await api.get(`/listini/${id}`);
        return response.data;
    }

    async save(listino) {
        if (listino.id) {
            const response = await api.put(`/listini/${listino.id}`, listino);
            return response.data;
        } else {
            const response = await api.post('/listini', listino);
            return response.data;
        }
    }

    async delete(id) {
        const response = await api.delete(`/listini/${id}`);
        return response.data;
    }
}

export default new ListiniService();
