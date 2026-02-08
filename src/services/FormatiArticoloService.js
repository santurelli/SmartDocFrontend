import api from './api';

const getListForCombo = () => {
    return api.post('/formatiarticolo/listForCombo', {});
};

const FormatiArticoloService = {
    getListForCombo
};

export default FormatiArticoloService;
