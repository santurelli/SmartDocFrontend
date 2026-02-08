import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';
import TipiPagamentoService from '../../services/TipiPagamentoService';
import Swal from 'sweetalert2';

const TipoPagamentoEditModal = ({ isOpen, onClose, tipoPagamentoId, onSave }) => {
    const [formData, setFormData] = useState({
        descrizione: '',
        modalita: 'MP01', // Default Contanti
        saldaSubito: 0,
        giornoPagamentoMeseSuccessivo: 0,
        spostaScadenze: 0,
        predefinito: 0,
        scadenze: []
    });

    useEffect(() => {
        if (isOpen) {
            if (tipoPagamentoId) {
                loadData();
            } else {
                setFormData({
                    descrizione: '',
                    modalita: 'MP01',
                    saldaSubito: 0,
                    giornoPagamentoMeseSuccessivo: 0,
                    spostaScadenze: 0,
                    predefinito: 0,
                    scadenze: [{ giorni: 0, percTotale: 100, fineMese: 0 }]
                });
            }
        }
    }, [isOpen, tipoPagamentoId]);

    const loadData = async () => {
        try {
            const res = await TipiPagamentoService.getById(tipoPagamentoId);
            if (res.data) {
                setFormData(res.data);
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

        const totalPerc = formData.scadenze.reduce((acc, s) => acc + parseFloat(s.percTotale || 0), 0);
        if (Math.abs(totalPerc - 100) > 0.01) {
            Swal.fire('Attenzione', 'La somma delle percentuali deve essere 100%', 'warning');
            return;
        }

        try {
            await TipiPagamentoService.save(formData);
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
                                            value={formData.modalita}
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
                                <div className="col-md-4">
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.saldaSubito === 1}
                                                onChange={(e) => setFormData({ ...formData, saldaSubito: e.target.checked ? 1 : 0 })}
                                            /> Salda Subito
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.predefinito === 1}
                                                onChange={(e) => setFormData({ ...formData, predefinito: e.target.checked ? 1 : 0 })}
                                            /> Predefinito
                                        </label>
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="checkbox">
                                        <label>
                                            <input
                                                type="checkbox"
                                                checked={formData.spostaScadenze === 1}
                                                onChange={(e) => setFormData({ ...formData, spostaScadenze: e.target.checked ? 1 : 0 })}
                                            /> Sposta Scadenze
                                        </label>
                                    </div>
                                </div>
                            </div>

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
