import axios from 'axios';

const API_URL = 'http://localhost:8080/smartdoc/agentiService'; // Check correct endpoint from legacy or new logic

class AgentiService {
    getSuggestion(query) {
        return axios.get(`${API_URL}/getSuggestion`, { params: { q: query } });
    }

    // Add other methods if needed
}

export default new AgentiService();
