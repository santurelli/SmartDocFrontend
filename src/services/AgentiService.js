import api from './api';

class AgentiService {
    getList(params) {
        // params: { search, length, start, order[0][column], order[0][dir] }
        return api.get('/agenti', { params });
    }

    getById(id) {
        return api.get(`/agenti/${id}`);
    }

    save(dto) {
        if (dto.id) {
            return api.put(`/agenti/${dto.id}`, dto);
        } else {
            return api.post('/agenti', dto);
        }
    }

    delete(id) {
        return api.delete(`/agenti/${id}`);
    }

    getAll() {
        return api.get('/risorse/combo?tipologia=AG');
    }

    getSuggestion(search) {
        return api.get('/agenti/suggestion', { params: { q: search } });
    }
}

export default new AgentiService();
