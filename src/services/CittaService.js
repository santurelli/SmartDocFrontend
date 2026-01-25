import api from './api';

class CittaService {

    getSuggestion(q) {
        return api.get('/citta/suggestion', { params: { q } });
    }

}

export default new CittaService();
