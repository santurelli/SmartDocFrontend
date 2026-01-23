import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/aliquoteiva';

const getListForCombo = () => {
    return axios.post(`${API_URL}/listForCombo`, {}, { headers: AuthService.authHeader() });
};

const AliquoteIvaService = {
    getListForCombo
};

export default AliquoteIvaService;
