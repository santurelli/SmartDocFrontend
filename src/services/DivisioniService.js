import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/divisioni';

const getListForCombo = () => {
    return axios.post(`${API_URL}/listForCombo`, {}, { headers: AuthService.authHeader() });
};

const DivisioniService = {
    getListForCombo
};

export default DivisioniService;
