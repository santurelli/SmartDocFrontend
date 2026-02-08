import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import AgentiService from '../../services/AgentiService';

const AgenteEditModal = ({ isOpen, onClose, agenteId, onSave }) => {
    const [formData, setFormData] = useState({
        denominazione: '',
        indirizzo: '',
        cap: '',
        citta: '',
        provincia: '',
        nazione: 'ITALIA',
        telefono: '',
        fax: '',
        cellulare: '',
        email: '',
        percProvvigione: '',
        tipoMaturazioneProvvigione: 'V' // V = Venduto, P = Pagato
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (agenteId) {
                loadAgente();
            } else {
                setFormData({
                    denominazione: '',
                    indirizzo: '',
                    cap: '',
                    citta: '',
                    provincia: '',
                    nazione: 'ITALIA',
                    telefono: '',
                    fax: '',
                    cellulare: '',
                    email: '',
                    percProvvigione: '',
                    tipoMaturazioneProvvigione: 'V'
                });
            }
        }
    }, [isOpen, agenteId]);

    const loadAgente = async () => {
        setLoading(true);
        try {
            const res = await AgentiService.getById(agenteId);
            if (res.data) {
                setFormData({
                    ...res.data,
                    percProvvigione: res.data.percProvvigione || ''
                });
            }
        } catch (error) {
            Swal.fire('Errore', 'Impossibile caricare i dati dell\'agente', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.denominazione) {
            Swal.fire('Attenzione', 'La denominazione è obbligatoria', 'warning');
            return;
        }

        try {
            await AgentiService.save(formData);
            Swal.fire('Successo', 'Agente salvato correttamente', 'success');
            onSave();
            onClose();
        } catch (error) {
            const msg = error.response?.data || 'Errore durante il salvataggio';
            Swal.fire('Errore', typeof msg === 'string' ? msg : 'Errore nel salvataggio', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200 }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <button type="button" className="close" onClick={onClose}>&times;</button>
                            <h4 className="modal-title" style={{ fontWeight: 'bold' }}>
                                {agenteId ? 'Modifica Agente' : 'Nuovo Agente'}
                            </h4>
                        </div>
                        <div className="modal-body" style={{ padding: '25px' }}>
                            <div className="row">
                                <div className="col-md-12 form-group">
                                    <label className="premium-label">Denominazione *</label>
                                    <input type="text" className="form-control premium-input" name="denominazione" value={formData.denominazione} onChange={handleChange} required />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col-md-6 form-group">
                                    <label className="premium-label">Indirizzo</label>
                                    <input type="text" className="form-control premium-input" name="indirizzo" value={formData.indirizzo} onChange={handleChange} />
                                </div>
                                <div className="col-md-2 form-group">
                                    <label className="premium-label">CAP</label>
                                    <input type="text" className="form-control premium-input" name="cap" value={formData.cap} onChange={handleChange} maxLength="5" />
                                </div>
                                <div className="col-md-4 form-group">
                                    <label className="premium-label">Città</label>
                                    <input type="text" className="form-control premium-input" name="citta" value={formData.citta} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col-md-3 form-group">
                                    <label className="premium-label">Provincia</label>
                                    <input type="text" className="form-control premium-input" name="provincia" value={formData.provincia} onChange={handleChange} maxLength="2" />
                                </div>
                                <div className="col-md-3 form-group">
                                    <label className="premium-label">Nazione</label>
                                    <input type="text" className="form-control premium-input" name="nazione" value={formData.nazione} onChange={handleChange} />
                                </div>
                                <div className="col-md-6 form-group">
                                    <label className="premium-label">Email</label>
                                    <input type="email" className="form-control premium-input" name="email" value={formData.email} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col-md-4 form-group">
                                    <label className="premium-label">Telefono</label>
                                    <input type="text" className="form-control premium-input" name="telefono" value={formData.telefono} onChange={handleChange} />
                                </div>
                                <div className="col-md-4 form-group">
                                    <label className="premium-label">Cellulare</label>
                                    <input type="text" className="form-control premium-input" name="cellulare" value={formData.cellulare} onChange={handleChange} />
                                </div>
                                <div className="col-md-4 form-group">
                                    <label className="premium-label">Fax</label>
                                    <input type="text" className="form-control premium-input" name="fax" value={formData.fax} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="row mt-3">
                                <div className="col-md-4 form-group">
                                    <label className="premium-label">% Provvigione</label>
                                    <input type="number" step="0.01" className="form-control premium-input" name="percProvvigione" value={formData.percProvvigione} onChange={handleChange} />
                                </div>
                                <div className="col-md-8 form-group">
                                    <label className="premium-label">Maturazione Provvigione</label>
                                    <select className="form-control premium-input" name="tipoMaturazioneProvvigione" value={formData.tipoMaturazioneProvvigione} onChange={handleChange}>
                                        <option value="V">Al Venduto</option>
                                        <option value="P">Al Pagato</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-premium-cancel" onClick={onClose}>Annulla</button>
                            <button type="submit" className="btn btn-premium-save">Salva</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AgenteEditModal;
