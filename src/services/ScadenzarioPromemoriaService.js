import http from "./api";

const getList = (tipo) => {
    const params = tipo ? `?tipo=${tipo}` : '';
    return http.get(`/scadenzario/promemoria${params}`);
};

const getById = (id) => http.get(`/scadenzario/promemoria/${id}`);

const create = (data) => http.post('/scadenzario/promemoria', data);

const update = (id, data) => http.put(`/scadenzario/promemoria/${id}`, data);

const remove = (id) => http.delete(`/scadenzario/promemoria/${id}`);

const getInviiByCliente = (idCliente) => http.get(`/scadenzario/promemoria/invii?idCliente=${idCliente}`);

const getInviiByFattura = (idFattura) => http.get(`/scadenzario/promemoria/invii/fattura?idFattura=${idFattura}`);

const getInviiByFatturaFornitore = (idFatturaFornitore) => http.get(`/scadenzario/promemoria/invii/fattura-fornitore?idFatturaFornitore=${idFatturaFornitore}`);

const eseguiOra = () => http.post('/scadenzario/promemoria/esegui-ora');

const ScadenzarioPromemoriaService = {
    getList, getById, create, update, remove,
    getInviiByCliente, getInviiByFattura, getInviiByFatturaFornitore,
    eseguiOra
};

export default ScadenzarioPromemoriaService;
