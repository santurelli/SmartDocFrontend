import api from './api';

const AiService = {
    estraiFatturaFornitore: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/ai/estrai-fattura-fornitore', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

export default AiService;
