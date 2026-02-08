import api from './api';

const getListForCombo = () => {
    return api.post('/calibriarticolo/listForCombo', {});
};

const CalibriArticoloService = {
    getListForCombo
};

export default CalibriArticoloService;
