import api from './api';

class ConfigurazioneService {

    getByDomain(domain) {
        return api.get('/configurazione/get-by-domain', { params: { domain } });
    }

    getAll() {
        return api.get('/configurazione/get-all');
    }

    save(dto) {
        return api.post('/configurazione/save', dto);
    }
}

export default new ConfigurazioneService();
