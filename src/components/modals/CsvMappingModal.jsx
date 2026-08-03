import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import RiconciliazioneService from '../../services/RiconciliazioneService';

const empty = {
    delimitatore: ';',
    flHaIntestazione: 1,
    formatoData: 'dd/MM/yyyy',
    colData: 0,
    colImporto: 1,
    colCausale: 2,
    colControparte: 3,
    colIbanControparte: '',
    flImportoUnicoConSegno: 1,
    colImportoEntrata: '',
    colImportoUscita: ''
};

const CsvMappingModal = ({ isOpen, onClose, idRisorsa, onSaved }) => {
    const [mapping, setMapping] = useState(empty);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !idRisorsa) return;
        RiconciliazioneService.getCsvMapping(idRisorsa)
            .then(res => setMapping({ ...empty, ...res.data, idRisorsa }))
            .catch(() => setMapping({ ...empty, idRisorsa }));
    }, [isOpen, idRisorsa]);

    if (!isOpen) return null;

    const handleChange = (field, value) => setMapping(prev => ({ ...prev, [field]: value }));

    const handleSave = async () => {
        setLoading(true);
        try {
            const payload = {
                ...mapping,
                idRisorsa,
                colIbanControparte: mapping.colIbanControparte === '' ? null : Number(mapping.colIbanControparte),
                colImportoEntrata: mapping.colImportoEntrata === '' ? null : Number(mapping.colImportoEntrata),
                colImportoUscita: mapping.colImportoUscita === '' ? null : Number(mapping.colImportoUscita)
            };
            await RiconciliazioneService.saveCsvMapping(payload);
            Swal.fire({ title: 'Mapping salvato', icon: 'success', timer: 1500, showConfirmButton: false });
            onSaved();
            onClose();
        } catch {
            Swal.fire('Errore', 'Impossibile salvare il mapping', 'error');
        } finally {
            setLoading(false);
        }
    };

    return ReactDOM.createPortal(
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1300 }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose}>&times;</button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Mapping colonne CSV</h4>
                        <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>
                            Indica in quale colonna del file CSV (0 = prima colonna) si trova ciascuna informazione. Va configurato una sola volta per questa banca/risorsa.
                        </p>
                    </div>
                    <div className="modal-body" style={{ padding: '20px 25px' }}>
                        <div className="row">
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Delimitatore</label>
                                    <select className="form-control" value={mapping.delimitatore} onChange={e => handleChange('delimitatore', e.target.value)}>
                                        <option value=";">Punto e virgola ( ; )</option>
                                        <option value=",">Virgola ( , )</option>
                                        <option value="	">Tabulazione</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Formato data</label>
                                    <select className="form-control" value={mapping.formatoData} onChange={e => handleChange('formatoData', e.target.value)}>
                                        <option value="dd/MM/yyyy">GG/MM/AAAA</option>
                                        <option value="yyyy-MM-dd">AAAA-MM-GG</option>
                                        <option value="dd-MM-yyyy">GG-MM-AAAA</option>
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Prima riga è intestazione?</label>
                                    <select className="form-control" value={mapping.flHaIntestazione} onChange={e => handleChange('flHaIntestazione', Number(e.target.value))}>
                                        <option value={1}>Sì</option>
                                        <option value={0}>No</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <hr />
                        <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '10px' }}>Colonne (indice da 0)</label>
                        <div className="row">
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label>Data</label>
                                    <input type="number" className="form-control" value={mapping.colData} onChange={e => handleChange('colData', Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label>Causale</label>
                                    <input type="number" className="form-control" value={mapping.colCausale} onChange={e => handleChange('colCausale', Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label>Controparte</label>
                                    <input type="number" className="form-control" value={mapping.colControparte} onChange={e => handleChange('colControparte', Number(e.target.value))} />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label>IBAN controparte</label>
                                    <input type="number" className="form-control" placeholder="opz." value={mapping.colIbanControparte} onChange={e => handleChange('colIbanControparte', e.target.value)} />
                                </div>
                            </div>
                        </div>

                        <hr />
                        <div className="form-group">
                            <label>Importo</label>
                            <select className="form-control" style={{ maxWidth: '380px' }} value={mapping.flImportoUnicoConSegno} onChange={e => handleChange('flImportoUnicoConSegno', Number(e.target.value))}>
                                <option value={1}>Una colonna sola, con segno (es. -150,00 / 200,00)</option>
                                <option value={0}>Due colonne separate: Entrate e Uscite</option>
                            </select>
                        </div>
                        {mapping.flImportoUnicoConSegno === 1 ? (
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Colonna importo</label>
                                        <input type="number" className="form-control" value={mapping.colImporto} onChange={e => handleChange('colImporto', Number(e.target.value))} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Colonna Entrate</label>
                                        <input type="number" className="form-control" value={mapping.colImportoEntrata} onChange={e => handleChange('colImportoEntrata', e.target.value)} />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Colonna Uscite</label>
                                        <input type="number" className="form-control" value={mapping.colImportoUscita} onChange={e => handleChange('colImportoUscita', e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-default" onClick={onClose}>Annulla</button>
                        <button type="button" className="btn btn-primary" disabled={loading} onClick={handleSave}>Salva mapping</button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CsvMappingModal;
