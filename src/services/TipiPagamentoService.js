import api from './api';

class TipiPagamentoService {
    getList(params) {
        return api.get('/tipi-pagamento', { params });
    }

    getById(id) {
        return api.get(`/tipi-pagamento/${id}`);
    }

    save(dto) {
        if (dto.id) {
            return api.put(`/tipi-pagamento/${dto.id}`, dto);
        } else {
            return api.post('/tipi-pagamento', dto);
        }
    }

    delete(id) {
        return api.delete(`/tipi-pagamento/${id}`);
    }

    getAll() {
        return api.get('/tipi-pagamento/combo');
    }

    getScadenzeDocumento(idTipoPagamento, dataDocumento, totaleDocumento) {
        let dataFormatted = dataDocumento;
        if (dataFormatted && dataFormatted.includes('-')) {
            const [y, m, d] = dataFormatted.split('-');
            dataFormatted = `${d}/${m}/${y}`;
        }
        return api.get(`/tipi-pagamento/${idTipoPagamento}/scadenze-documento`, {
            params: {
                dataDocumento: dataFormatted,
                totaleDocumento
            }
        });
    }
}

export default new TipiPagamentoService();
