import api from './api';

const MastriniService = {
    get: async (idConto, params = {}) => {
        const response = await api.get(`/mastrini/${idConto}`, { params });
        return response.data;
    },

    print: (idConto, params = {}) => {
        return api.get(`/mastrini/${idConto}/pdf`, { params, responseType: 'blob' });
    }
};

export default MastriniService;
