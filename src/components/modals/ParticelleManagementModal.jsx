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
            setValore(currentParticelle.join('\n'));
        }
    }, [isOpen, currentParticelle]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const dto = {
                dominio: 'DOCUMENTI',
                chiave: 'PARTICELLE',
                valore: valore
            };
            await ConfigurazioneService.save(dto);

            // Filter out empty lines for the parent state
            const newList = valore.split('\n')
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

    if (!isOpen) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200 }} role="dialog">
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Configurazione suffissi</h4>
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body" style={{ padding: '20px' }}>
                        <div className="alert alert-info" style={{ fontSize: '13px', borderRadius: '8px' }}>
                            <i className="fa fa-info-circle mr-2"></i>
                            Inserisci un suffisso per ogni riga (es. A, B, RE, 01).
                            Verranno visualizzati nel menu a tendina accanto al numero del preventivo.
                        </div>
                        <div className="form-group mb-0">
                            <label className="premium-label">Lista Suffissi</label>
                            <textarea
                                className="form-control premium-input"
                                style={{
                                    height: '250px',
                                    fontFamily: 'monospace',
                                    fontSize: '14px',
                                    resize: 'vertical',
                                    padding: '12px'
                                }}
                                value={valore}
                                onChange={(e) => setValore(e.target.value)}
                                placeholder="A&#10;B&#10;RE"
                                disabled={loading}
                            />
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-premium-cancel" onClick={onClose} disabled={loading}>Annulla</button>
                        <button type="button" className="btn btn-premium-save" onClick={handleSave} disabled={loading}>
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
