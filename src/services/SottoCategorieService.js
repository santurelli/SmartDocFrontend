import api from './api';

const getList = (filter, length, start, orderCol, orderDir) => {
    return api.post(`/sottocategorie/list`, filter, {
        params: { length, start, 'order[0][column]': orderCol, 'order[0][dir]': orderDir }
    });
};

const getListForCombo = (idCategoria) => {
    return api.post(`/sottocategorie/listForCombo`, null, {
        params: { idCategoria }
    });
};

const create = (data) => {
    return api.post('/sottocategorie', data);
};

const update = (id, data) => {
    return api.put(`/sottocategorie/${id}`, data);
};

const deleteSottoCategoria = (id) => {
    return api.delete(`/sottocategorie/${id}`);
};

const SottoCategorieService = {
    getList,
    getListForCombo,
    create,
    update,
    delete: deleteSottoCategoria
};

export default SottoCategorieService;
