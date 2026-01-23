import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/unitamisura';

const getListForCombo = () => {
    return axios.post(`${API_URL}/listForCombo`, {}, { headers: AuthService.authHeader() });
};

const UnitaMisuraService = {
    getListForCombo
};

export default UnitaMisuraService;
