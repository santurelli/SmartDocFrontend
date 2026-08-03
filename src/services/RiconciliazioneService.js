import http from "./api";

const getListImport = () => http.get('/riconciliazione/import');

const getMovimenti = (idImport) => http.get(`/riconciliazione/import/${idImport}/movimenti`);

const importFile = (file, formato, idRisorsa, userId) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('formato', formato);
    if (idRisorsa) formData.append('idRisorsa', idRisorsa);
    if (userId) formData.append('userId', userId);
    return http.post('/riconciliazione/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
};

const abbina = (idMovimento, tipoScadenza, idScadenza, dataValuta, userId) =>
    http.post(`/riconciliazione/movimenti/${idMovimento}/abbina`, { tipoScadenza, idScadenza, dataValuta, userId });

const ignora = (idMovimento, userId) =>
    http.post(`/riconciliazione/movimenti/${idMovimento}/ignora`, null, { params: { userId } });

const getCsvMapping = (idRisorsa) => http.get('/riconciliazione/csv-mapping', { params: { idRisorsa } });

const saveCsvMapping = (mapping, userId) =>
    http.post('/riconciliazione/csv-mapping', mapping, { params: { userId } });

const RiconciliazioneService = {
    getListImport, getMovimenti, importFile, abbina, ignora, getCsvMapping, saveCsvMapping
};

export default RiconciliazioneService;
