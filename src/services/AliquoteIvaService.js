import api from './api';

class AliquoteIvaService {
    getList(params) {
        const { start, length, orderColumn, orderDir, ...filter } = params;
        const queryParams = new URLSearchParams({
            start: start || 0,
            length: length || 10
        });
        if (orderColumn !== undefined) queryParams.append('orderColumn', orderColumn);
        if (orderDir) queryParams.append('orderDir', orderDir);

        return api.post(`/aliquoteiva/list?${queryParams.toString()}`, filter);
    }

    getListForCombo() {
        return api.post('/aliquoteiva/listForCombo');
    }

    getById(id) {
        return api.get(`/aliquoteiva/${id}`);
    }

    create(data) {
        return api.post('/aliquoteiva', data);
    }

    update(id, data) {
        return api.put(`/aliquoteiva/${id}`, data);
    }

    delete(id) {
        return api.delete(`/aliquoteiva/${id}`);
    }
}

export default new AliquoteIvaService();
