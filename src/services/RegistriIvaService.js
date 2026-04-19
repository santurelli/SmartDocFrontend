import http from "./api";

const getAllYears = () => {
  return http.get("/registri-iva/anni");
};

const getDocumentiIva = (periodo, anno) => {
  return http.get(`/registri-iva/documenti?periodo=${periodo}&anno=${anno}`);
};

const exportRegistro = (periodo, anno, tipoRegistro) => {
  return http.get(`/registri-iva/export-pdf?periodo=${periodo}&anno=${anno}&tipoRegistro=${tipoRegistro}`, {
    responseType: 'blob',
    headers: {
      'Accept': 'application/pdf'
    }
  });
};

const RegistriIvaService = {
  getAllYears,
  getDocumentiIva,
  exportRegistro
};

export default RegistriIvaService;
