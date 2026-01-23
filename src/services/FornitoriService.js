import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/fornitori';

const getListForCombo = () => {
    return axios.post(`${API_URL}/listForCombo`, {}, { headers: AuthService.authHeader() });
};

const getSuggestion = (q) => {
    return axios.get(`${API_URL}/getSuggestion`, {
        headers: AuthService.authHeader(),
        params: { q }
    });
};

const FornitoriService = {
    getListForCombo,
    getSuggestion
};

export default FornitoriService;
