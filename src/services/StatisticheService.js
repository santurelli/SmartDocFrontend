import api from './api';

const StatisticheService = {
    getVendite: (params) => {
        return api.get('/statistiche/vendite', { params });
    },
    getAcquisti: (params) => {
        return api.get('/statistiche/acquisti', { params });
    },
    getPagamenti: (params) => {
        return api.get('/statistiche/pagamenti', { params });
    },
    getDatiGlobali: () => {
        return api.get('/statistiche/globali');
    }
};

export default StatisticheService;
