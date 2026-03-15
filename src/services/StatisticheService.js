import api from './api';

const StatisticheService = {
    getDatiGlobali: () => {
        return api.get('/fatture/statistiche-globali');
    }
};

export default StatisticheService;
