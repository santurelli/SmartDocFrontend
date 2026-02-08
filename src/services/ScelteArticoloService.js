import api from './api';

const getListForCombo = () => {
    return api.post('/sceltearticolo/listForCombo', {});
};

const ScelteArticoloService = {
    getListForCombo
};

export default ScelteArticoloService;
