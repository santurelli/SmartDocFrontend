import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import MarcheService from '../../services/MarcheService';
import Swal from 'sweetalert2';

const MarcaEditModal = ({ isOpen, onClose, marca, onSave }) => {
    const isNew = !marca?.id;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: 0,
        codice: '',
        descrizione: '',
        note: ''
    });

    useEffect(() => {
        if (!isOpen) return;
        if (marca) {
            setFormData({
                id: marca.id || 0,
                codice: marca.codice || '',
                descrizione: marca.descrizione || '',
                note: marca.note || ''
            });
        } else {
            setFormData({
                id: 0,
                codice: '',
                descrizione: '',
                note: ''
            });
        }
    }, [isOpen, marca]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.descrizione?.trim()) {
            Swal.fire('Attenzione', 'La descrizione della marca è obbligatoria', 'warning');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                ...formData,
                codice: formData.codice?.trim() || formData.descrizione.trim()
            };
            if (!isNew) {
                await MarcheService.update(formData.id, payload);
            } else {
                await MarcheService.create(payload);
            }
            Swal.fire({
                icon: 'success',
                title: isNew ? 'Marca Creata!' : 'Marca Aggiornata!',
                text: 'Operazione completata con successo',
                timer: 1500,
                showConfirmButton: false
            });
            if (onSave) onSave();
            onClose();
        } catch (error) {
            const msg = error.response?.data?.errorText || error.message || 'Errore durante il salvataggio';
            Swal.fire('Errore', msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal show premium-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1250 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog" style={{ width: '100%', maxWidth: '540px', margin: 'auto' }} role="document">
                <div className="modal-content premium-modal-content">
                    <form onSubmit={handleSubmit} style={{ margin: 0 }}>
                        <div className="modal-header">
                            <h4 className="modal-title" style={{ fontWeight: 'bold' }}>
                                {isNew ? 'Nuova Marca' : 'Modifica Marca'}
                            </h4>
                            <button type="button" className="close" onClick={onClose} aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '25px' }}>
                            <div className="form-group" style={{ marginBottom: '18px' }}>
                                <label style={{ fontWeight: 600, color: '#333', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                                    Nome Marca <span style={{ color: '#e74c3c' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="descrizione"
                                    placeholder="Es. Michelin, Pirelli, Bridgestone..."
                                    value={formData.descrizione}
                                    onChange={handleChange}
                                    required
                                    style={{ height: '40px', borderRadius: '8px', border: '1px solid #ced4da', padding: '0 12px' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                <label style={{ fontWeight: 600, color: '#333', marginBottom: '8px', display: 'block', fontSize: '14px' }}>
                                    Note
                                </label>
                                <textarea
                                    className="form-control"
                                    rows="3"
                                    name="note"
                                    placeholder="Note interne..."
                                    value={formData.note}
                                    onChange={handleChange}
                                    style={{ borderRadius: '8px', border: '1px solid #ced4da', padding: '10px 12px' }}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid #eee', padding: '15px 25px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" className="btn btn-default" onClick={onClose} style={{ height: '38px', padding: '0 20px', borderRadius: '8px', fontWeight: '500' }}>
                                Annulla
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '38px', padding: '0 25px', borderRadius: '8px', fontWeight: '600', backgroundColor: '#03a9f4', borderColor: '#03a9f4' }}>
                                {loading ? 'Salvataggio...' : 'Salva'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default MarcaEditModal;
