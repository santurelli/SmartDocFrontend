import api from './api';

const getListForCombo = () => {
    return api.post('/toniarticolo/listForCombo', {});
};

const ToniArticoloService = {
    getListForCombo
};

export default ToniArticoloService;
