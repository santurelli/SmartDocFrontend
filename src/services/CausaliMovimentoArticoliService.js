import api from './api';

const CausaliMovimentoArticoliService = {
    getList: async (params) => {
        try {
            // Transform params for backend expectation if needed
            // The backend expects order[0][column] and order[0][dir]
            const datatablesParams = {
                search: params.search || '',
                start: params.start || 0,
                length: params.length || 10,
                'order[0][column]': params.orderColumn || 0,
                'order[0][dir]': params.orderDir || 'asc'
            };
            const response = await api.get('/causaliMovimentiArticoli/list', { params: datatablesParams });
            return response;
        } catch (error) {
            console.error("Error fetching list:", error);
            throw error;
        }
    },

    getSuggestion: async (q) => {
        try {
            const response = await api.get('/causaliMovimentiArticoli/suggestion', { params: { q } });
            return response.data;
        } catch (error) {
            console.error("Error fetching suggestions:", error);
            throw error;
        }
    },

    create: async (descrizione) => {
        try {
            const response = await api.post('/causaliMovimentiArticoli/create', null, { params: { descrizione } });
            return response.data;
        } catch (error) {
            console.error("Error creating causale:", error);
            throw error;
        }
    },

    update: async (id, descrizione) => {
        try {
            const response = await api.post('/causaliMovimentiArticoli/update', null, { params: { id, descrizione } });
            return response.data;
        } catch (error) {
            console.error("Error updating causale:", error);
            throw error;
        }
    },

    delete: async (id) => {
        try {
            const response = await api.delete('/causaliMovimentiArticoli/delete', { params: { id } });
            return response.data;
        } catch (error) {
            console.error("Error deleting causale:", error);
            throw error;
        }
    }
};

export default CausaliMovimentoArticoliService;
