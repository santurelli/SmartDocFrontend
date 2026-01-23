import axios from 'axios';

const API_URL = 'http://localhost:8080/smartdoc/progettiService';

class ProgettiService {
    getSuggestion(query) {
        return axios.get(`${API_URL}/getSuggestion`, { params: { q: query } });
    }
}

export default new ProgettiService();
