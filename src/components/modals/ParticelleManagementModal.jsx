import React, { useState, useEffect } from 'react';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import Swal from 'sweetalert2';

/**
 * Modal to manage quote suffixes (particelle) in bulk via textarea.
 * Replicates legacy behavior but with a modern UI.
 */
const ParticelleManagementModal = ({ isOpen, onClose, currentParticelle, onSave }) => {
    const [valore, setValore] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && currentParticelle) {
            // currentParticelle is the array returned by getAsArray.
            // But if the backend mistakenly saved it as a single string with newlines,
            // the array might just have 1 element with \n in it.
            // Let's normalize it to ensure the textarea sees distinct lines.
            const normalized = currentParticelle.join('\n').replace(/,/g, '\n');
            const lines = normalized.split('\n').filter(s => s.trim() !== '');
            setValore(lines.join('\n'));
        }
    }, [isOpen, currentParticelle]);

    const handleSave = async () => {
        setLoading(true);
        try {
            // Backend expects comma-separated string
            const commaSeparatedValue = valore.split('\n')
                .map(s => s.trim())
                .filter(s => s !== '')
                .join(',');

            const dto = {
                dominio: 'DOCUMENTI',
                chiave: 'PARTICELLE',
                valore: commaSeparatedValue
            };
            await ConfigurazioneService.save(dto);

            // Filter out empty lines for the parent state
            const newList = commaSeparatedValue.split(',')
                .map(s => s.trim())
                .filter(s => s !== '');

            Swal.fire({
                title: 'Successo',
                text: 'Suffissi aggiornati correttamente',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            if (onSave) onSave(newList);
            onClose();
        } catch (error) {
            console.error('Error saving particelle:', error);
            Swal.fire('Errore', 'Impossibile salvare i suffissi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const textareaRef = React.useRef(null);

    useEffect(() => {
        if (loading) return;
        // Force height overrides to combat existing !important CSS rules
        if (textareaRef.current) {
            textareaRef.current.style.setProperty('height', '250px', 'important');
            textareaRef.current.style.setProperty('min-height', '250px', 'important');
            textareaRef.current.style.setProperty('max-height', 'none', 'important');
        }
    }, [isOpen, loading]);

    if (!isOpen) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200 }} role="dialog">
            <div className="modal-dialog" role="document">
                <div className="modal-content" style={{ border: 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.3)', borderRadius: '6px' }}>
                    <div className="modal-header bg-primary" style={{ color: 'white', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
                        <button type="button" className="close" onClick={onClose} aria-label="Close" style={{ color: 'white', opacity: 0.8, textShadow: 'none' }}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold', margin: 0 }}>Configurazione suffissi</h4>
                    </div>
                    <div className="modal-body" style={{ padding: '20px' }}>
                        <div className="alert alert-info" style={{ fontSize: '13px', borderRadius: '8px', border: 'none', backgroundColor: '#e3f2fd', color: '#0d47a1' }}>
                            <i className="fa fa-info-circle mr-2"></i>
                            Inserisci un suffisso per ogni riga (es. A, B, RE, 01).
                            Verranno visualizzati nel menu a tendina accanto al numero del preventivo.
                        </div>
                        <div className="form-group mb-0">
                            <label className="premium-label" style={{ fontWeight: '600', color: '#555', marginBottom: '8px', display: 'block' }}>Lista Suffissi</label>
                            <textarea
                                ref={textareaRef}
                                className="form-control premium-input"
                                style={{
                                    fontFamily: 'monospace',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    padding: '12px',
                                    borderRadius: '6px',
                                    borderColor: '#ddd'
                                }}
                                value={valore}
                                onChange={(e) => setValore(e.target.value)}
                                placeholder="A&#10;B&#10;RE"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div className="modal-footer" style={{ borderTop: '1px solid #eee', padding: '15px 20px', backgroundColor: '#f9f9f9', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px' }}>
                        <button type="button" className="btn btn-default" onClick={onClose} disabled={loading} style={{ marginRight: '10px' }}>Annulla</button>
                        <button type="button" className="btn btn-primary" onClick={handleSave} disabled={loading} style={{ fontWeight: '600', padding: '6px 20px' }}>
                            {loading ? <i className="fa fa-spinner fa-spin mr-2"></i> : null}
                            Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParticelleManagementModal;
