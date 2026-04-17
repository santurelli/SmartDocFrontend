import React, { useState, useEffect } from 'react';
import PrimaNotaService from '../../services/PrimaNotaService';
import RisorseService from '../../services/RisorseService';
import ClientiService from '../../services/ClientiService';
import FornitoriService from '../../services/FornitoriService';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import Swal from 'sweetalert2';
import { FaTimes, FaSave, FaExchangeAlt, FaArrowDown, FaArrowUp } from 'react-icons/fa';

const PrimaNotaModal = ({ isOpen, onClose, onSave, idToEdit, risorseCombo }) => {
    const [formData, setFormData] = useState({
        dtPagamento: new Date().toISOString().split('T')[0],
        tipo: 'E', // E = Entrata, U = Uscita
        idRisorsa: null,
        importo: '',
        descrizione: '',
        idSoggetto: null
    });
    
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [selectedSoggetto, setSelectedSoggetto] = useState(null);

    useEffect(() => {
        if (idToEdit) {
            loadData(idToEdit);
        } else {
            // Default resource if none selected
            if (risorseCombo && risorseCombo.length > 0) {
                setFormData(prev => ({ ...prev, idRisorsa: risorseCombo[0].value }));
            }
        }
    }, [idToEdit, risorseCombo]);

    const loadData = async (id) => {
        setIsLoading(true);
        try {
            const res = await PrimaNotaService.getById(id);
            if (res.data) {
                setFormData({
                    dtPagamento: res.data.dtPagamento ? res.data.dtPagamento.split('/').reverse().join('-') : '',
                    tipo: res.data.tipo || res.data.tipoDocumento || 'E',
                    idRisorsa: res.data.idRisorsa || null,
                    importo: res.data.importo || res.data.entrata || res.data.uscita || '',
                    descrizione: res.data.descrizione || res.data.descrDocumento || '',
                    idSoggetto: res.data.idSoggetto || null
                });
                
                // Set initial subject label if it exists
                if (res.data.idSoggetto) {
                    setSelectedSoggetto({ value: res.data.idSoggetto, label: `Soggetto ID: ${res.data.idSoggetto}` });
                    // To do: fetch proper name if needed, or backend should return it
                }
            }
        } catch (err) {
            console.error("Errore caricamento movimento:", err);
            Swal.fire('Errore', 'Impossibile caricare il record', 'error');
            onClose();
        } finally {
            setIsLoading(false);
        }
    };

    const loadSoggetti = async (inputValue) => {
        if (!inputValue || inputValue.length < 2) return [];
        try {
            if (formData.tipo === 'E') {
                const res = await ClientiService.getList({ search: inputValue });
                return res.data?.content?.map(c => ({ value: `C_${c.id}`, label: c.ragioneSociale })) || [];
            } else {
                const res = await FornitoriService.getList({ search: inputValue });
                return res.data?.content?.map(f => ({ value: `F_${f.id}`, label: f.ragioneSociale })) || [];
            }
        } catch (error) {
            console.error("Errore caricamento soggetti:", error);
            return [];
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!formData.idRisorsa || !formData.dtPagamento || !formData.importo) {
            Swal.fire('Attenzione', 'Compilare i campi obbligatori (Data, Risorsa, Importo)', 'warning');
            return;
        }

        setIsSaving(true);
        
        const payload = {
            ...formData,
            dtPagamento: formData.dtPagamento.split('-').reverse().join('/'),
            entrata: formData.tipo === 'E' ? parseFloat(formData.importo) : null,
            uscita: formData.tipo === 'U' ? parseFloat(formData.importo) : null
        };

        try {
            if (idToEdit) {
                await PrimaNotaService.update(idToEdit, payload);
                Swal.fire('Salvato!', 'Movimento aggiornato con successo.', 'success');
            } else {
                await PrimaNotaService.create(payload);
                Swal.fire('Salvato!', 'Nuovo movimento registrato.', 'success');
            }
            onSave();
            onClose();
        } catch (err) {
            console.error("Errore salvataggio movimento:", err);
            Swal.fire('Errore', 'Si è verificato un errore durante il salvataggio.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-backdrop fade in" style={{ opacity: 0.5 }}></div>
            <div className="modal fade in" style={{ display: 'block', overflowY: 'auto' }}>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <form onSubmit={handleSave}>
                            <div className="modal-header">
                                <button type="button" className="close" onClick={onClose}>&times;</button>
                                <h4 className="modal-title">
                                    {idToEdit ? 'Modifica Movimento' : 'Registra Movimento Manuale'}
                                </h4>
                            </div>
                            
                            <div className="modal-body">
                                {isLoading ? (
                                    <div className="text-center py-4"><i className="fa fa-spinner fa-spin fa-2x"></i></div>
                                ) : (
                                    <div className="row">
                                        
                                        <div className="col-md-12 form-group text-center mb-4">
                                            <div className="btn-group w-100" role="group">
                                                <button 
                                                    type="button" 
                                                    className={`btn ${formData.tipo === 'E' ? 'btn-success' : 'btn-default'}`} 
                                                    style={{ width: '50%' }}
                                                    onClick={() => setFormData({...formData, tipo: 'E', idSoggetto: null})}
                                                >
                                                    <FaArrowUp className="mr-2" /> ENTRATA (Incasso)
                                                </button>
                                                <button 
                                                    type="button" 
                                                    className={`btn ${formData.tipo === 'U' ? 'btn-danger' : 'btn-default'}`} 
                                                    style={{ width: '50%' }}
                                                    onClick={() => setFormData({...formData, tipo: 'U', idSoggetto: null})}
                                                >
                                                    <FaArrowDown className="mr-2" /> USCITA (Pagamento)
                                                </button>
                                            </div>
                                        </div>

                                        <div className="col-md-6 form-group">
                                            <label>Data Operazione <span className="text-danger">*</span></label>
                                            <input 
                                                type="date" 
                                                className="form-control" 
                                                required
                                                value={formData.dtPagamento}
                                                onChange={e => setFormData({...formData, dtPagamento: e.target.value})}
                                            />
                                        </div>
                                        
                                        <div className="col-md-6 form-group">
                                            <label>Importo (€) <span className="text-danger">*</span></label>
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                min="0"
                                                className="form-control font-weight-bold text-right" 
                                                style={{ fontSize: '18px', color: formData.tipo === 'E' ? '#28a745' : '#dc3545' }}
                                                required
                                                value={formData.importo}
                                                onChange={e => setFormData({...formData, importo: e.target.value})}
                                            />
                                        </div>

                                        <div className="col-md-12 form-group">
                                            <label>Risorsa (Banca / Cassa) <span className="text-danger">*</span></label>
                                            <Select
                                                options={risorseCombo}
                                                value={risorseCombo.find(r => r.value === formData.idRisorsa) || null}
                                                onChange={opt => setFormData({...formData, idRisorsa: opt ? opt.value : null})}
                                                placeholder="Seleziona conto..."
                                                required
                                            />
                                        </div>

                                        <div className="col-md-12 form-group">
                                            <label>{formData.tipo === 'E' ? 'Cliente' : 'Fornitore'} (Opzionale)</label>
                                            <AsyncSelect
                                                cacheOptions
                                                defaultOptions={false}
                                                loadOptions={loadSoggetti}
                                                value={selectedSoggetto}
                                                onChange={(opt) => {
                                                    setSelectedSoggetto(opt);
                                                    setFormData({...formData, idSoggetto: opt ? opt.value : null});
                                                }}
                                                placeholder={`Cerca ${formData.tipo === 'E' ? 'cliente' : 'fornitore'}...`}
                                                isClearable
                                            />
                                            <small className="text-muted d-block mt-1">Usa questo campo se il movimento è legato a un soggetto specifico ma non a una fattura.</small>
                                        </div>

                                        <div className="col-md-12 form-group">
                                            <label>Descrizione / Causale</label>
                                            <textarea 
                                                className="form-control" 
                                                rows="2"
                                                value={formData.descrizione}
                                                onChange={e => setFormData({...formData, descrizione: e.target.value})}
                                                placeholder="Es. Ricarica cassa, Pagamento F24, ecc..."
                                            ></textarea>
                                        </div>

                                    </div>
                                )}
                            </div>
                            
                            <div className="modal-footer">
                                <button type="button" className="btn btn-default" onClick={onClose} disabled={isSaving}>
                                    <FaTimes className="mr-1" /> Annulla
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={isLoading || isSaving}>
                                    {isSaving ? <i className="fa fa-spinner fa-spin mr-1"></i> : <FaSave className="mr-1" />}
                                    Salva Movimento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PrimaNotaModal;
