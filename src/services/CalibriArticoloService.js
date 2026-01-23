import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/calibriarticolo';

const getListForCombo = () => {
    return axios.post(`${API_URL}/listForCombo`, {}, { headers: AuthService.authHeader() });
};

const CalibriArticoloService = {
    getListForCombo
};

export default CalibriArticoloService;
