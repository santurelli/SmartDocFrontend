import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import UbicazioniService from '../../services/UbicazioniService';
import Swal from 'sweetalert2';
import { FaMagic } from 'react-icons/fa';

const UbicazioneEditModal = ({ isOpen, onClose, ubicazione, onSave }) => {
    const isNew = !ubicazione?.id;
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        id: 0,
        codUbicazione: '',
        descrizione: '',
        corsia: '',
        ripiano: '',
        livello: '',
        note: ''
    });

    useEffect(() => {
        if (!isOpen) return;
        if (ubicazione) {
            setFormData({
                id: ubicazione.id || 0,
                codUbicazione: ubicazione.codUbicazione || '',
                descrizione: ubicazione.descrizione || '',
                corsia: ubicazione.corsia || '',
                ripiano: ubicazione.ripiano || '',
                livello: ubicazione.livello || '',
                note: ubicazione.note || ''
            });
        } else {
            setFormData({
                id: 0,
                codUbicazione: '',
                descrizione: '',
                corsia: '',
                ripiano: '',
                livello: '',
                note: ''
            });
            // Genera automaticamente un codice progressivo per la nuova ubicazione
            autoGenerateNextCode();
        }
    }, [isOpen, ubicazione]);

    const autoGenerateNextCode = async () => {
        try {
            const res = await UbicazioniService.getList({ start: 0, length: 1000, search: '' });
            const list = res.data?.list || [];
            let maxNum = 0;
            list.forEach(u => {
                const match = (u.codUbicazione || '').match(/UB-?(\d+)/i) || (u.codUbicazione || '').match(/^(\d+)$/);
                if (match && match[1]) {
                    const n = parseInt(match[1], 10);
                    if (n > maxNum) maxNum = n;
                }
            });
            const nextNum = maxNum > 0 ? maxNum + 1 : (list.length + 1);
            const autoCode = `UB-${String(nextNum).padStart(3, '0')}`;
            setFormData(prev => {
                if (!prev.codUbicazione) {
                    return { ...prev, codUbicazione: autoCode };
                }
                return prev;
            });
        } catch (err) {
            setFormData(prev => (!prev.codUbicazione ? { ...prev, codUbicazione: 'UB-001' } : prev));
        }
    };

    const handleGenerateCode = async () => {
        // Se l'utente ha inserito coordinate fisiche (corsia, ripiano, livello), usiamo quelle
        const parts = [];
        if (formData.corsia?.trim()) parts.push(formData.corsia.trim());
        if (formData.ripiano?.trim()) parts.push(formData.ripiano.trim());
        if (formData.livello?.trim()) parts.push(formData.livello.trim());

        if (parts.length > 0) {
            setFormData(prev => ({ ...prev, codUbicazione: parts.join('-') }));
            return;
        }

        // Altrimenti genera progressivo UB-XXX
        try {
            const res = await UbicazioniService.getList({ start: 0, length: 1000, search: '' });
            const list = res.data?.list || [];
            let maxNum = 0;
            list.forEach(u => {
                const match = (u.codUbicazione || '').match(/UB-?(\d+)/i) || (u.codUbicazione || '').match(/^(\d+)$/);
                if (match && match[1]) {
                    const n = parseInt(match[1], 10);
                    if (n > maxNum) maxNum = n;
                }
            });
            const nextNum = maxNum > 0 ? maxNum + 1 : (list.length + 1);
            const autoCode = `UB-${String(nextNum).padStart(3, '0')}`;
            setFormData(prev => ({ ...prev, codUbicazione: autoCode }));
        } catch (err) {
            setFormData(prev => ({ ...prev, codUbicazione: 'UB-001' }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.codUbicazione?.trim()) {
            Swal.fire('Attenzione', 'Il codice ubicazione è obbligatorio', 'warning');
            return;
        }

        setLoading(true);
        try {
            await UbicazioniService.save(formData);
            Swal.fire({
                icon: 'success',
                title: isNew ? 'Ubicazione Creata!' : 'Ubicazione Aggiornata!',
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
            <div className="modal-dialog" style={{ width: '100%', maxWidth: '600px', margin: 'auto' }} role="document">
                <div className="modal-content premium-modal-content">
                    <form onSubmit={handleSubmit} style={{ margin: 0 }}>
                        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', minHeight: 'unset' }}>
                            <h4 className="modal-title" style={{ fontWeight: 'bold', fontSize: '17px', margin: 0, lineHeight: 1.2 }}>
                                {isNew ? 'Nuova Ubicazione' : 'Modifica Ubicazione'}
                            </h4>
                            <button type="button" className="close" onClick={onClose} aria-label="Close" style={{ margin: 0, padding: 0, lineHeight: 1, fontSize: '22px' }}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '20px 25px' }}>
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                            <label style={{ fontWeight: 600, color: '#333', margin: 0, fontSize: '13px' }}>
                                                Codice Ubicazione <span style={{ color: '#e74c3c' }}>*</span>
                                            </label>
                                        </div>
                                        <div className="input-group" style={{ display: 'flex', width: '100%' }}>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="codUbicazione"
                                                placeholder="Es. A-01, UB-001..."
                                                value={formData.codUbicazione}
                                                onChange={handleChange}
                                                required
                                                style={{ height: '40px', borderRadius: '8px 0 0 8px', border: '1px solid #ced4da', padding: '0 12px' }}
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-default"
                                                onClick={handleGenerateCode}
                                                title="Genera codice da coordinate o sequenziale"
                                                style={{
                                                    height: '40px',
                                                    borderRadius: '0 8px 8px 0',
                                                    border: '1px solid #ced4da',
                                                    borderLeft: 'none',
                                                    backgroundColor: '#f8fafc',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    color: '#03a9f4',
                                                    padding: '0 12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px'
                                                }}
                                            >
                                                <FaMagic /> Genera
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ fontWeight: 600, color: '#333', marginBottom: '6px', display: 'block', fontSize: '13px' }}>
                                            Descrizione
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="descrizione"
                                            placeholder="Es. Scaffale Gomme Estive"
                                            value={formData.descrizione}
                                            onChange={handleChange}
                                            style={{ height: '40px', borderRadius: '8px', border: '1px solid #ced4da', padding: '0 12px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ fontWeight: 600, color: '#333', marginBottom: '6px', display: 'block', fontSize: '13px' }}>
                                            Corsia
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="corsia"
                                            placeholder="Es. 1"
                                            value={formData.corsia}
                                            onChange={handleChange}
                                            style={{ height: '40px', borderRadius: '8px', border: '1px solid #ced4da', padding: '0 12px' }}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ fontWeight: 600, color: '#333', marginBottom: '6px', display: 'block', fontSize: '13px' }}>
                                            Ripiano
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="ripiano"
                                            placeholder="Es. 2"
                                            value={formData.ripiano}
                                            onChange={handleChange}
                                            style={{ height: '40px', borderRadius: '8px', border: '1px solid #ced4da', padding: '0 12px' }}
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group" style={{ marginBottom: '16px' }}>
                                        <label style={{ fontWeight: 600, color: '#333', marginBottom: '6px', display: 'block', fontSize: '13px' }}>
                                            Livello
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="livello"
                                            placeholder="Es. B"
                                            value={formData.livello}
                                            onChange={handleChange}
                                            style={{ height: '40px', borderRadius: '8px', border: '1px solid #ced4da', padding: '0 12px' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: '10px' }}>
                                <label style={{ fontWeight: 600, color: '#333', marginBottom: '6px', display: 'block', fontSize: '13px' }}>
                                    Note
                                </label>
                                <textarea
                                    className="form-control"
                                    rows="2"
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

export default UbicazioneEditModal;
