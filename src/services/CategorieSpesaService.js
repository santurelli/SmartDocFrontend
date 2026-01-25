import api from './api';

const CategorieSpesaService = {
    getAll: (descrizione) => {
        return api.get('/categoriespesa', {
            params: { descrizione }
        });
    },

    // Alias for consistency with other services
    getAllForCombo: () => {
        return api.get('/categoriespesa');
    }
};

export default CategorieSpesaService;
