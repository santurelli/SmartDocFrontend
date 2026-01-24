import api from './api';

class UnitaMisuraService {
    getList(params) {
        return api.post('/unitamisura/list', params);
    }

    getListForCombo() {
        return api.post('/unitamisura/listForCombo');
    }

    getById(id) {
        return api.get(`/unitamisura/${id}`); // Assuming you might add a GET endpoint or use search for this
    }

    create(data) {
        return api.post('/unitamisura', data);
    }

    update(id, data) {
        return api.put(`/unitamisura/${id}`, data);
    }

    delete(id) {
        return api.delete(`/unitamisura/${id}`);
    }
}

export default new UnitaMisuraService();
