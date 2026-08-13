import api from './api';

const BilancioService = {
    get: async (anno) => {
        const response = await api.get(`/bilancio/${anno}`);
        return response.data;
    },

    print: (anno) => {
        return api.get(`/bilancio/${anno}/pdf`, { responseType: 'blob' });
    }
};

export default BilancioService;
