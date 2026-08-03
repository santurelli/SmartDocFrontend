import axios from 'axios';
import authStorage from './authStorage';

const instance = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

instance.interceptors.request.use(
    (config) => {
        const user = authStorage.getCurrentUser();
        if (user && user.token) {
            config.headers['Authorization'] = 'Bearer ' + user.token;
        }

        const impersonated = sessionStorage.getItem('impersonated_tenant');
        if (impersonated) {
            try {
                const tenantData = JSON.parse(impersonated);
                const dbName = tenantData.nome_db || tenantData.nomeDb;
                const tenantId = tenantData.k_d_e_enti || tenantData.idCliente || tenantData.id;
                if (dbName) {
                    config.headers['X-Impersonated-Tenant-Db'] = dbName;
                }
                if (tenantId) {
                    config.headers['X-Impersonated-Tenant-Id'] = String(tenantId);
                }
            } catch (e) {
                console.error("Error parsing impersonated_tenant in api.js", e);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

instance.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            authStorage.logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default instance;
