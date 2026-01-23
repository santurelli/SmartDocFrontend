import api from './api';

const NoteDocumentiService = {
    getAll: () => {
        return api.get('/notedocumenti');
    },
    insert: (data) => {
        return api.post('/notedocumenti', data);
    },
    update: (id, data) => {
        return api.put(`/notedocumenti/${id}`, data);
    },
    delete: (id) => {
        return api.delete(`/notedocumenti/${id}`);
    }
};

export default NoteDocumentiService;
