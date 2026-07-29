import http from "./api";

const get770 = (anno, idFornitore) => {
    const params = new URLSearchParams({ anno });
    if (idFornitore) params.append('idFornitore', idFornitore);
    return http.get(`/ritenute/770?${params.toString()}`);
};

const getCombos = () => http.get('/ritenute/combos');

const RitenuteService = { get770, getCombos };

export default RitenuteService;
