import api from './api';

const NazioniService = {
  getAll: () => {
    return api.get('/nazioni');
  }
};

export default NazioniService;
