import api from './api';

const EcommerceService = {
    getConfig: () => {
        return api.get('/ecommerce/config');
    },
    saveConfig: (data) => {
        return api.put('/ecommerce/config', data);
    },
    getLog: () => {
        return api.get('/ecommerce/log');
    },
    syncNow: () => {
        return api.post('/ecommerce/sync-now');
    }
};

export default EcommerceService;
