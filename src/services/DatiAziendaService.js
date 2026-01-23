import api from './api';

class DatiAziendaService {
    get() {
        return api.get('/dati-azienda');
    }

    save(formData) {
        return api.post('/dati-azienda', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
}

export default new DatiAziendaService();
