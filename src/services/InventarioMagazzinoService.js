import api from './api';

class InventarioMagazzinoService {
    getList(params) {
        return api.post('/inventario/list', params);
    }

    exportExcel(params) {
        return api.post('/inventario/export-excel', params, { responseType: 'blob' });
    }
}

export default new InventarioMagazzinoService();
