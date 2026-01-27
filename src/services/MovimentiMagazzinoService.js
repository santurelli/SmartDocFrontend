import api from './api';

const MovimentiMagazzinoService = {
    insertCarico: async (dto) => {
        try {
            const response = await api.post('/movimenti/carico', dto);
            return response.data;
        } catch (error) {
            console.error("Error inserting carico:", error);
            throw error;
        }
    },

    insertScarico: async (dto) => {
        try {
            const response = await api.post('/movimenti/scarico', dto);
            return response.data;
        } catch (error) {
            console.error("Error inserting scarico:", error);
            throw error;
        }
    },

    insertRettifica: async (dto) => {
        try {
            const response = await api.post('/movimenti/rettifica', dto);
            return response.data;
        } catch (error) {
            console.error("Error inserting rettifica:", error);
            throw error;
        }
    },
    list: async (criteria) => {
        try {
            const response = await api.post('/movimenti/list', criteria);
            return response.data;
        } catch (error) {
            console.error("Error fetching movimenti list:", error);
            throw error;
        }
    }
};

export default MovimentiMagazzinoService;
