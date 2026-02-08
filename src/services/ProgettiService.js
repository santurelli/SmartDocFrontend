import api from './api';

class ProgettiService {
    getSuggestion(query) {
        return api.get('/progetti/suggestion', { params: { q: query } });
    }

    create(data) {
        return api.post('/progetti', data);
    }
}

export default new ProgettiService();
