import api from './api';

class UnitaMisuraService {
    getList(params) {
        const { start, length, orderColumn, orderDir, ...filter } = params;
        const queryParams = new URLSearchParams({
            start: start || 0,
            length: length || 10
        });
        if (orderColumn !== undefined && orderColumn !== null) queryParams.append('orderColumn', orderColumn);
        if (orderDir) queryParams.append('orderDir', orderDir);

        return api.post(`/unitamisura/list?${queryParams.toString()}`, filter);
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
