import api from './api';

const getListForCombo = () => {
    return api.post('/divisioni/listForCombo', {});
};

const DivisioniService = {
    getListForCombo
};

export default DivisioniService;
