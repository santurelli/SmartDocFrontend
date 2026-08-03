import axios from 'axios';
import authService from './authService';

const getAuthHeaders = () => {
    const user = authService.getCurrentUser();
    const token = user?.token;
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

const StudioService = {
    getClienti: () => {
        return axios.get('/api/studio/clienti', getAuthHeaders());
    },

    invitaCliente: (search) => {
        return axios.post('/api/studio/deleghe/invita', { search }, getAuthHeaders());
    },

    getDelegheRicevute: () => {
        return axios.get('/api/studio/deleghe/ricevute', getAuthHeaders());
    },

    accettaDelega: (idDelega) => {
        return axios.post(`/api/studio/deleghe/${idDelega}/accetta`, {}, getAuthHeaders());
    },

    revocaDelega: (idDelega) => {
        return axios.post(`/api/studio/deleghe/${idDelega}/revoca`, {}, getAuthHeaders());
    },

    impersonate: (idCliente) => {
        return axios.post(`/api/studio/impersonate/${idCliente}`, {}, getAuthHeaders());
    },

    getAuditLog: () => {
        return axios.get('/api/studio/audit-log', getAuthHeaders());
    },

    downloadBatchZip: (clientIds) => {
        const user = authService.getCurrentUser();
        const token = user?.token;
        return axios.post('/api/studio/export/batch', { clientIds }, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            responseType: 'blob'
        });
    },

    downloadSingleClientZip: (idCliente) => {
        const user = authService.getCurrentUser();
        const token = user?.token;
        return axios.post(`/api/studio/export/client/${idCliente}`, {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            responseType: 'blob'
        });
    }
};

export default StudioService;
