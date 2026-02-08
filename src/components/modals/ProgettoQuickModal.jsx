import React, { useState } from 'react';
import ProgettiService from '../../services/ProgettiService';
import Swal from 'sweetalert2';

const ProgettoQuickModal = ({ isOpen, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        codice: '',
        descrizione: '',
        note: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!formData.descrizione) {
            Swal.fire('Attenzione', 'La descrizione è obbligatoria', 'warning');
            return;
        }

        setLoading(true);
        try {
            const res = await ProgettiService.create(formData);
            Swal.fire('Successo', 'Progetto creato', 'success');
            if (onSave) onSave(res.data);
            onClose();
        } catch (error) {
            console.error("Error creating project:", error);
            Swal.fire('Errore', 'Impossibile creare il progetto', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200 }} role="dialog">
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Nuovo Progetto</h4>
                    </div>
                    <div className="modal-body" style={{ padding: '20px' }}>
                        <div className="form-group mb-3">
                            <label className="premium-label">Codice</label>
                            <input type="text" name="codice" className="form-control premium-input" value={formData.codice} onChange={handleChange} />
                        </div>
                        <div className="form-group mb-3">
                            <label className="premium-label">Descrizione *</label>
                            <input type="text" name="descrizione" className="form-control premium-input" value={formData.descrizione} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label className="premium-label">Note</label>
                            <textarea name="note" className="form-control premium-input" rows="3" value={formData.note} onChange={handleChange}></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-premium-cancel" onClick={onClose}>Annulla</button>
                        <button type="button" className="btn btn-premium-save" onClick={handleSave} disabled={loading}>
                            {loading ? 'Salvataggio...' : 'Salva'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgettoQuickModal;
