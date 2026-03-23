import React, { useState, useEffect } from 'react';
import ListiniService from '../../services/ListiniService';
import Swal from 'sweetalert2';

const ListinoEditModal = ({ show, handleClose, listino, refreshList, allListini }) => {
    const initialState = {
        descrizione: '',
        idParent: '',
        derivationSource: 'LISTINO',
        derivationType: 'NONE',
        derivationValue: 0,
        roundingRule: 0,
        flDefault: 0
    };

    const [formData, setFormData] = useState(initialState);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (listino) {
            setFormData({
                ...listino,
                idParent: listino.idParent || '',
                derivationValue: listino.derivationValue || 0,
                roundingRule: listino.roundingRule || 0
            });
        } else {
            setFormData(initialState);
        }
    }, [listino, show]);

    // Handle inconsistencies
    useEffect(() => {
        if (!formData.idParent && formData.derivationSource === 'LISTINO' && formData.derivationType !== 'NONE') {
            setFormData(prev => ({ ...prev, derivationSource: 'ULTIMO_ACQUISTO' }));
        }
    }, [formData.idParent, formData.derivationType]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await ListiniService.save(formData);
            Swal.fire('Successo', 'Listino salvato correttamente', 'success');
            refreshList();
            handleClose();
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Impossibile salvare il listino', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    if (!show) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={handleClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>
                            {listino ? 'Modifica Listino' : 'Nuovo Listino'}
                        </h4>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label>Descrizione</label>
                                        <input 
                                            type="text" 
                                            className="form-control"
                                            name="descrizione"
                                            value={formData.descrizione}
                                            onChange={handleChange}
                                            required
                                            placeholder="Es: Listino Rivenditori"
                                            style={{ borderRadius: '8px', height: '40px' }}
                                        />
                                    </div>
                                </div>
                                
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>Sorgente Prezzo</label>
                                        <select 
                                            className="form-control"
                                            name="derivationSource"
                                            value={formData.derivationSource}
                                            onChange={handleChange}
                                            disabled={formData.derivationType === 'NONE'}
                                            style={{ borderRadius: '8px', height: '40px', backgroundColor: formData.derivationType === 'NONE' ? '#f5f5f5' : 'white' }}
                                        >
                                            <option 
                                                value="LISTINO" 
                                                disabled={!formData.idParent}
                                                style={{ color: !formData.idParent ? '#999' : 'inherit' }}
                                            >
                                                Altro Listino (Padre) {!formData.idParent ? '(Scegli un padre)' : ''}
                                            </option>
                                            <option value="ULTIMO_ACQUISTO">Ultimo Prezzo Acquisto</option>
                                            <option value="MEDIO_ACQUISTO">Prezzo Medio Acquisto</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>Listino Padre</label>
                                        <select 
                                            className="form-control"
                                            name="idParent"
                                            value={formData.idParent}
                                            onChange={handleChange}
                                            required={formData.derivationSource === 'LISTINO' && formData.derivationType !== 'NONE'}
                                            style={{ borderRadius: '8px', height: '40px' }}
                                        >
                                            <option value="">Nessuno (Radice)</option>
                                            {allListini
                                                .filter(l => l.id !== formData.id)
                                                .map(l => (
                                                    <option key={l.id} value={l.id}>{l.descrizione}</option>
                                                ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Tipo Regola</label>
                                        <select 
                                            className="form-control"
                                            name="derivationType"
                                            value={formData.derivationType}
                                            onChange={handleChange}
                                            style={{ borderRadius: '8px', height: '40px' }}
                                        >
                                            <option value="NONE">Prezzo Manuale (Radice)</option>
                                            <option value="PERCENTAGE">Ricarico Percentuale (%)</option>
                                            <option value="FIXED_MARKUP">Ricarico Fisso (€)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Valore Ricarico</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            className="form-control"
                                            name="derivationValue"
                                            value={formData.derivationValue}
                                            onChange={handleChange}
                                            disabled={formData.derivationType === 'NONE'}
                                            style={{ borderRadius: '8px', height: '40px' }}
                                        />
                                    </div>
                                </div>

                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Arrotondamento</label>
                                        <select 
                                            className="form-control"
                                            name="roundingRule"
                                            value={formData.roundingRule}
                                            onChange={handleChange}
                                            style={{ borderRadius: '8px', height: '40px' }}
                                        >
                                            <option value={0}>Standard (2 decimali)</option>
                                            <option value={0.05}>Al 0.05 più vicino</option>
                                            <option value={0.10}>Al 0.10 più vicino</option>
                                            <option value={0.50}>Al 0.50 più vicino</option>
                                            <option value={1.00}>All'Euro più vicino</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-12" style={{ marginTop: '10px' }}>
                                    <div className="checkbox">
                                        <label>
                                            <input 
                                                type="checkbox"
                                                name="flDefault"
                                                checked={formData.flDefault === 1}
                                                onChange={handleChange}
                                            /> Listino Predefinito
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-default" onClick={handleClose} style={{ borderRadius: '8px' }}>Annulla</button>
                            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ borderRadius: '8px' }}>
                                {submitting ? 'Salvataggio...' : 'Salva Listino'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ListinoEditModal;
