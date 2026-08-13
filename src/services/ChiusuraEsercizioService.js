import api from './api';

const ChiusuraEsercizioService = {
    anteprima: async (anno) => {
        const response = await api.get(`/chiusura-esercizio/${anno}/anteprima`);
        return response.data;
    },

    chiudi: async (anno) => {
        const response = await api.post(`/chiusura-esercizio/${anno}/chiudi`);
        return response.data;
    }
};

export default ChiusuraEsercizioService;
