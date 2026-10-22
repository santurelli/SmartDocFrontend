import api from './api';
import axios from 'axios';

class UbicazioniService {
    getList(params) {
        return api.post('/ubicazioni/list', params);
    }

    getById(id) {
        return api.get(`/ubicazioni/${id}`);
    }

    save(data) {
        return api.post('/ubicazioni/save', data);
    }

    delete(id) {
        return api.delete(`/ubicazioni/${id}`);
    }

    getByProdotto(idProdotto) {
        return api.get(`/ubicazioni/prodotto/${idProdotto}`);
    }

    getProdottiByUbicazione(idUbicazione) {
        return api.get(`/ubicazioni/${idUbicazione}/prodotti`);
    }

    saveProdottoUbicazione(data) {
        return api.post('/ubicazioni/prodotto/save', data);
    }

    deleteProdottoUbicazione(id) {
        return api.delete(`/ubicazioni/prodotto/${id}`);
    }

    async stampaPrelievo(data) {
        const response = await api.post('/ubicazioni/stampa-prelievo', data);
        const resData = response.data;

        // Se il backend non è riuscito a contattare direttamente il printer bridge
        // (es. backend in cloud/server e printer bridge su localhost del client),
        // il client browser effettua la chiamata locale diretta:
        if (resData && !resData.sentByServer && resData.bridgePayload) {
            const bridgeUrl = resData.bridgeUrl || 'http://localhost:3001';
            try {
                await axios.post(`${bridgeUrl}/printer-command`, resData.bridgePayload, { timeout: 5000 });
                return {
                    success: true,
                    message: `Stampa inviata con successo via PrinterBridge (${resData.printerIp})`
                };
            } catch (err) {
                console.warn('Errore chiamata diretta al PrinterBridge:', err);
                throw new Error(`Impossibile comunicare con il PrinterBridge su ${bridgeUrl}. Verifica che sia avviato.`);
            }
        }

        return {
            success: true,
            message: resData?.message || 'Stampa inviata con successo'
        };
    }
}

export default new UbicazioniService();
