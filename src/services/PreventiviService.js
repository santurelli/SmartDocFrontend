import axios from 'axios';

const API_URL = 'http://localhost:8080/smartdoc/preventivi';

class PreventiviService {
    getList(params) {
        // Convert params to URLSearchParams or pass as object
        // The backend expects @RequestParam Map<String, String>
        const formData = new FormData();
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                formData.append(key, params[key]);
            }
        });
        return axios.post(`${API_URL}/list`, formData);
    }

    getById(id) {
        return axios.get(`${API_URL}/${id}`);
    }

    getNextNum(data) {
        return axios.get(`${API_URL}/nextNum`, { params: { data } });
    }

    insert(data) {
        return axios.post(`${API_URL}`, data);
    }

    update(id, data) {
        return axios.put(`${API_URL}/${id}`, data);
    }

    delete(id) {
        return axios.delete(`${API_URL}/${id}`);
    }
}

export default new PreventiviService();
