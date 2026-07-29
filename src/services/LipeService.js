import http from "./api";

const getAnteprima = (anno, trimestre) => {
    return http.get(`/lipe/anteprima?anno=${anno}&trimestre=${trimestre}`);
};

const generaXml = (dto) => {
    return http.post('/lipe/genera-xml', dto, {
        responseType: 'blob',
        headers: { 'Accept': 'application/xml' }
    });
};

const LipeService = { getAnteprima, generaXml };

export default LipeService;
