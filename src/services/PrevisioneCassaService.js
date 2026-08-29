import api from './api';

const PrevisioneCassaService = {
    get: async () => {
        const response = await api.get('/previsione-cassa');
        return response.data;
    }
};

export default PrevisioneCassaService;
