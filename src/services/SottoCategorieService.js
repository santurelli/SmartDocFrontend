import axios from 'axios';
import AuthService from './authService';

const API_URL = 'http://localhost:8080/api/sottocategorie';

const getList = (filter, length, start, orderCol, orderDir) => {
    return axios.post(`${API_URL}/list`, filter, {
        headers: AuthService.authHeader(),
        params: { length, start, 'order[0][column]': orderCol, 'order[0][dir]': orderDir }
    });
};

const getListForCombo = (idCategoria) => {
    return axios.post(`${API_URL}/listForCombo`, null, {
        headers: AuthService.authHeader(),
        params: { idCategoria }
    });
};

const create = (data) => {
    return axios.post(API_URL, data, { headers: AuthService.authHeader() });
};

const update = (id, data) => {
    return axios.put(`${API_URL}/${id}`, data, { headers: AuthService.authHeader() });
};

const deleteSottoCategoria = (id) => {
    return axios.delete(`${API_URL}/${id}`, { headers: AuthService.authHeader() });
};

const SottoCategorieService = {
    getList,
    getListForCombo,
    create,
    update,
    delete: deleteSottoCategoria
};

export default SottoCategorieService;
