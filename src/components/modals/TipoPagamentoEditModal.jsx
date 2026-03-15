import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import TipiPagamentoService from '../../services/TipiPagamentoService';
import SpeseIncassoService from '../../services/SpeseIncassoService';
import Swal from 'sweetalert2';
import WrenchModalButton from '../WrenchModalButton';
import SpeseIncassoManagementModal from './SpeseIncassoManagementModal';

const TipoPagamentoEditModal = ({ isOpen, onClose, tipoPagamentoId, onSave }) => {
    const [formData, setFormData] = useState({
        descrizione: '',
        modalita: 'MP01', // Default Contanti
        saldaSubito: 0,
        giornoPagamentoMeseSuccessivo: 0, // In db nullable Integer
        spostaScadenze: 0,
        predefinito: 0,
        idSpeseIncasso: null,
        scadenze: []
    });

    const [usaGiornoMeseSucc, setUsaGiornoMeseSucc] = useState(false);
    const [usaSpeseIncasso, setUsaSpeseIncasso] = useState(false);
    const [speseIncassoList, setSpeseIncassoList] = useState([]);

    useEffect(() => {
        if (isOpen) {
            loadSpeseIncasso();
            if (tipoPagamentoId) {
                loadData();
            } else {
                setFormData({
                    descrizione: '',
                    modalita: 'MP01',
                    saldaSubito: 0,
                    giornoPagamentoMeseSuccessivo: null,
                    spostaScadenze: 0,
                    predefinito: 0,
                    idSpeseIncasso: null,
                    scadenze: [{ giorni: 0, percTotale: 100, fineMese: 0 }]
                });
                setUsaGiornoMeseSucc(false);
                setUsaSpeseIncasso(false);
            }
        }
    }, [isOpen, tipoPagamentoId]);

    const loadSpeseIncasso = async () => {
        try {
            const res = await SpeseIncassoService.getAll();
            if (res.data) {
                setSpeseIncassoList(res.data || []);
            }
        } catch (error) {
            console.error("Errore caricamento spese incasso", error);
        }
    };

    const loadData = async () => {
        try {
            const res = await TipiPagamentoService.getById(tipoPagamentoId);
            if (res.data) {
                const data = res.data;
                setFormData(data);
                if (data.giornoPagamentoMeseSuccessivo && data.giornoPagamentoMeseSuccessivo > 0) {
                    setUsaGiornoMeseSucc(true);
                } else {
                    setUsaGiornoMeseSucc(false);
                }
                if (data.idSpeseIncasso) {
                    setUsaSpeseIncasso(true);
                } else {
                    setUsaSpeseIncasso(false);
                }
            }
        } catch (error) {
            Swal.fire('Errore', 'Impossibile caricare il tipo pagamento', 'error');
        }
    };

    const handleAddScadenza = () => {
        setFormData({
            ...formData,
            scadenze: [...formData.scadenze, { giorni: 0, percTotale: 0, fineMese: 0 }]
        });
    };

    const handleRemoveScadenza = (index) => {
        const newScadenze = formData.scadenze.filter((_, i) => i !== index);
        setFormData({ ...formData, scadenze: newScadenze });
    };

    const handleScadenzaChange = (index, field, value) => {
        const newScadenze = [...formData.scadenze];
        if (field === 'fineMese') {
            newScadenze[index][field] = value;
        } else {
            newScadenze[index][field] = value === '' ? '' : Number(value);
        }
        setFormData({ ...formData, scadenze: newScadenze });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const dataToSave = { ...formData };
        if (!usaGiornoMeseSucc) {
            dataToSave.giornoPagamentoMeseSuccessivo = null;
        }
        if (!usaSpeseIncasso) {
            dataToSave.idSpeseIncasso = null;
        }

        if (dataToSave.saldaSubito !== 1) {
            const totalPerc = dataToSave.scadenze.reduce((acc, s) => acc + parseFloat(s.percTotale || 0), 0);
            if (Math.abs(totalPerc - 100) > 0.01 && dataToSave.scadenze.length > 0) {
                Swal.fire('Attenzione', 'La somma delle percentuali deve essere 100%', 'warning');
                return;
            }
        }

        try {
            await TipiPagamentoService.save(dataToSave);
            Swal.fire('Successo', 'Tipo pagamento salvato correttamente', 'success');
            onSave();
            onClose();
        } catch (error) {
            const msg = error.response?.data || 'Errore durante il salvataggio';
            Swal.fire('Errore', typeof msg === 'string' ? msg : 'Errore nel salvataggio', 'error');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <button type="button" className="close" onClick={onClose}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                            <h4 className="modal-title" style={{ fontWeight: 'bold' }}>
                                {tipoPagamentoId ? 'Modifica Tipo Pagamento' : 'Nuovo Tipo Pagamento'}
                            </h4>
                        </div>
                        <div className="modal-body" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
                            <div className="row">
                                <div className="col-md-9">
                                    <div className="form-group">
                                        <label className="required">Descrizione</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={formData.descrizione}
                                            onChange={(e) => setFormData({ ...formData, descrizione: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Modalità (E-Fattura)</label>
                                        <select
                                            className="form-control"
                                            value={formData.modalita || 'MP01'}
                                            onChange={(e) => setFormData({ ...formData, modalita: e.target.value })}
                                        >
                                            <option value="MP01">Contanti</option>
                                            <option value="MP05">Bonifico</option>
                                            <option value="MP08">Carta di Pagamento</option>
                                            <option value="MP12">RiBa</option>
                                            <option value="MP02">Assegno</option>
                                            <option value="MP21">Vaglia Postale</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="row" style={{ marginTop: '10px' }}>
                                <div className="col-md-12">
                                        <div className="checkbox-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                                            <div className="checkbox" style={{ margin: 0 }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '500' }}>
                                                    <input
                                                        type="checkbox"
                                                        style={{ width: '18px', height: '18px', marginRight: '10px' }}
                                                        checked={formData.predefinito === 1}
                                                        onChange={(e) => setFormData({ ...formData, predefinito: e.target.checked ? 1 : 0 })}
                                                    /> <span style={{ fontSize: '14px' }}>Imposta come <strong>Predefinito</strong></span>
                                                </label>
                                            </div>

                                            <div className="checkbox" style={{ margin: 0 }}>
                                                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '500' }}>
                                                    <input
                                                        type="checkbox"
                                                        style={{ width: '18px', height: '18px', marginRight: '10px' }}
                                                        checked={formData.saldaSubito === 1}
                                                        onChange={(e) => setFormData({ ...formData, saldaSubito: e.target.checked ? 1 : 0 })}
                                                    /> <span style={{ fontSize: '14px' }}>Pagamento <strong>Immediata</strong> (Saldo al momento del documento)</span>
                                                </label>
                                            </div>

                                            {formData.saldaSubito !== 1 && (
                                                <div className="checkbox" style={{ margin: 0 }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                                        <input
                                                            type="checkbox"
                                                            style={{ width: '18px', height: '18px', marginRight: '10px' }}
                                                            checked={formData.spostaScadenze === 1}
                                                            onChange={(e) => setFormData({ ...formData, spostaScadenze: e.target.checked ? 1 : 0 })}
                                                        /> <span style={{ fontSize: '14px', color: '#666' }}>Sposta scadenze del <strong>31/08</strong> o <strong>31/12</strong> al 10 del mese successivo</span>
                                                    </label>
                                                </div>
                                            )}
                                        </div>

                                        <div className="extra-options" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #dee2e6' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div className="checkbox" style={{ margin: 0 }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '500', marginBottom: 0 }}>
                                                        <input
                                                            type="checkbox"
                                                            style={{ width: '18px', height: '18px', marginRight: '10px' }}
                                                            checked={usaGiornoMeseSucc}
                                                            onChange={(e) => {
                                                                setUsaGiornoMeseSucc(e.target.checked);
                                                                if (!e.target.checked) setFormData({ ...formData, giornoPagamentoMeseSuccessivo: null });
                                                            }}
                                                        /> <span>Se fine mese paga il</span>
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <input 
                                                        type="number" 
                                                        className="form-control input-sm" 
                                                        style={{ width: '70px', textAlign: 'center', fontWeight: 'bold' }}
                                                        disabled={!usaGiornoMeseSucc}
                                                        value={formData.giornoPagamentoMeseSuccessivo || ''}
                                                        onChange={(e) => setFormData({ ...formData, giornoPagamentoMeseSuccessivo: e.target.value ? Number(e.target.value) : null })}
                                                        placeholder="GG"
                                                    />
                                                    <span className="text-muted" style={{ fontSize: '13px' }}>del mese dopo</span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                                <div className="checkbox" style={{ margin: 0 }}>
                                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontWeight: '500', marginBottom: 0 }}>
                                                        <input
                                                            type="checkbox"
                                                            style={{ width: '18px', height: '18px', marginRight: '10px' }}
                                                            checked={usaSpeseIncasso}
                                                            onChange={(e) => {
                                                                setUsaSpeseIncasso(e.target.checked);
                                                                if (!e.target.checked) setFormData(prev => ({ ...prev, idSpeseIncasso: null }));
                                                            }}
                                                        /> <span>Addebita Spese incasso</span>
                                                    </label>
                                                </div>
                                                {usaSpeseIncasso && (
                                                    <div style={{ flex: 1, maxWidth: '300px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <select 
                                                            className="form-control input-sm" 
                                                            value={formData.idSpeseIncasso || ''}
                                                            onChange={(e) => setFormData({ ...formData, idSpeseIncasso: e.target.value ? Number(e.target.value) : null })}
                                                            required={usaSpeseIncasso}
                                                            style={{ fontWeight: '500', flex: 1 }}
                                                        >
                                                            <option value="">-- Seleziona spesa --</option>
                                                            {speseIncassoList.map(s => (
                                                                <option key={s.id} value={s.id}>{s.descrizione} ({new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(s.importo)})</option>
                                                            ))}
                                                        </select>
                                                        <WrenchModalButton 
                                                            ModalComponent={SpeseIncassoManagementModal}
                                                            title="Gestione Spese Incasso"
                                                            onClose={loadSpeseIncasso}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                </div>
                            </div>

                            {formData.saldaSubito !== 1 && (
                                <>
                                    <h5 style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginTop: '20px', fontWeight: 'bold' }}>Scadenze / Rate</h5>
                                    <table className="table table-condensed table-bordered table-striped">
                                        <thead>
                                            <tr>
                                                <th style={{ textAlign: 'center' }}>Giorni</th>
                                                <th style={{ textAlign: 'center' }}>% Totale</th>
                                                <th style={{ textAlign: 'center' }}>Fine Mese</th>
                                                <th style={{ width: '50px' }}></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.scadenze.map((s, index) => (
                                                <tr key={index}>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="form-control input-sm text-center"
                                                            value={s.giorni}
                                                            onChange={(e) => handleScadenzaChange(index, 'giorni', e.target.value)}
                                                        />
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            className="form-control input-sm text-center"
                                                            value={s.percTotale}
                                                            onChange={(e) => handleScadenzaChange(index, 'percTotale', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={s.fineMese === 1}
                                                            onChange={(e) => handleScadenzaChange(index, 'fineMese', e.target.checked ? 1 : 0)}
                                                        />
                                                    </td>
                                                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                                        <button type="button" className="btn btn-danger btn-sm" onClick={() => handleRemoveScadenza(index)}>
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {formData.scadenze.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="text-center text-muted">Nessuna scadenza definita</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                    <button type="button" className="btn btn-info btn-sm" onClick={handleAddScadenza}>
                                        <FaPlus /> Aggiungi Scadenza
                                    </button>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" onClick={onClose}>Annulla</button>
                            <button type="submit" className="btn btn-primary">Salva</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TipoPagamentoEditModal;
