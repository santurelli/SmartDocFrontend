import api from './api';

class AgentiService {
    getAll() {
        return api.get('/risorse/combo?tipologia=AG');
    }
}

export default new AgentiService();
