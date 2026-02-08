import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import AsyncCreatableSelect from 'react-select/async-creatable';
import ClientiService from '../../services/ClientiService';
import CausaliMovimentoArticoliService from '../../services/CausaliMovimentoArticoliService';
import MovimentiMagazzinoService from '../../services/MovimentiMagazzinoService';

import { FaWrench } from 'react-icons/fa';
import ClientiManagementModal from '../../components/modals/ClientiManagementModal';
import CausaliManagementModal from '../../components/modals/CausaliManagementModal';
import WrenchModalButton from '../../components/WrenchModalButton';

const formatYYYYMMDD = (date) => {
    const d = new Date(date);
    const month = '' + (d.getMonth() + 1);
    const day = '' + d.getDate();
    const year = d.getFullYear();
    return [year, month.padStart(2, '0'), day.padStart(2, '0')].join('-');
};

const formatDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

const ScaricoMagazzinoModal = ({ show, handleClose, article, refreshList }) => {
    const [formData, setFormData] = useState({
        dataOperazione: formatYYYYMMDD(new Date()),
        quantita: '',
        prezzoUnitario: '',
        cliente: null, // { label, value }
        causale: null, // { label, value }
    });
    const [error, setError] = useState(null);
    const [showClientiModal, setShowClientiModal] = useState(false);
    const [showCausaliModal, setShowCausaliModal] = useState(false);

    useEffect(() => {
        if (show && article) {
            setFormData({
                dataOperazione: formatYYYYMMDD(new Date()),
                quantita: '',
                prezzoUnitario: article.prezzo || '',
                cliente: null,
                causale: null
            });
            setError(null);
        }
    }, [show, article]);


    const handleClienteChange = (selectedOption) => {
        setFormData({ ...formData, cliente: selectedOption });
    };

    const handleCausaleChange = (selectedOption) => {
        setFormData({ ...formData, causale: selectedOption });
    };

    const handleCausaleCreate = async (inputValue) => {
        try {
            await CausaliMovimentoArticoliService.create(inputValue);
            setFormData({ ...formData, causale: { label: inputValue, value: inputValue, isNew: true } });
        } catch (err) {
            console.error(err);
        }
    };

    const loadClientiOptions = (inputValue) => {
        return ClientiService.getSuggestion(inputValue).then(results =>
            results.data.map(item => ({ label: item.denominazione, value: item.id }))
        );
    };

    const loadCausaliOptions = (inputValue) => {
        return CausaliMovimentoArticoliService.getSuggestion(inputValue).then(results =>
            results.map(item => ({ label: item.descrizione, value: item.descrizione }))
        );
    };

    const handleSubmit = async () => {
        if (!formData.dataOperazione || !formData.quantita) {
            setError("Data e Quantità sono obbligatorie.");
            return;
        }

        try {
            const dto = {
                idProdotto: article.id,
                quantita: formData.quantita,
                prezzoUnitario: formData.prezzoUnitario,
                dataMovimento: formatDDMMYYYY(formData.dataOperazione),
                idCliente: formData.cliente?.value,
                descrCausale: formData.causale?.label || formData.causale?.value || '',
                idMagazzino: 1,
                idUnitaMisura: article.idUnitaMisura1
            };

            const response = await MovimentiMagazzinoService.insertScarico(dto);
            if (response.errorText) {
                setError(response.errorText);
                return;
            }
            handleClose();
            refreshList();
        } catch (err) {
            setError("Errore durante il salvataggio: " + err.message);
        }
    };

    if (!show) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={handleClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Scarico magazzino</h4>
                        <div className="modal-header-article">
                            Articolo: {article?.codice} - {article?.descrizione}
                        </div>
                    </div>
                    <div className="modal-body">
                        {error && (
                            <div className="alert alert-danger" role="alert" style={{ marginBottom: '20px' }}>
                                {error}
                            </div>
                        )}

                        <form>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Cliente</label>
                                <div className="input-group">
                                    <div>
                                        <AsyncSelect
                                            cacheOptions
                                            defaultOptions
                                            loadOptions={loadClientiOptions}
                                            onChange={handleClienteChange}
                                            value={formData.cliente}
                                            placeholder="Seleziona cliente..."
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    borderTopLeftRadius: '8px',
                                                    borderBottomLeftRadius: '8px',
                                                    borderTopRightRadius: '0px',
                                                    borderBottomRightRadius: '0px',
                                                    borderColor: '#ddd',
                                                    minHeight: '40px',
                                                    boxShadow: 'none'
                                                }),
                                                menu: (base) => ({ ...base, zIndex: 9999 })
                                            }}
                                        />
                                    </div>
                                    <WrenchModalButton
                                        ModalComponent={ClientiManagementModal}
                                        title="Gestione Clienti"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px', width: '100%' }}>
                                <div style={{ flex: 1 }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Data operazione *</label>
                                        <input
                                            className="form-control"
                                            type="date"
                                            value={formData.dataOperazione}
                                            onChange={(e) => setFormData({ ...formData, dataOperazione: e.target.value })}
                                            style={{ borderRadius: '8px', height: '40px' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div className="form-group">
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantità *</label>
                                        <input
                                            className="form-control"
                                            type="number"
                                            value={formData.quantita}
                                            onChange={(e) => setFormData({ ...formData, quantita: e.target.value })}
                                            placeholder="Inserisci quantità"
                                            style={{ borderRadius: '8px', height: '40px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Prezzo unitario</label>
                                <input
                                    className="form-control"
                                    type="number"
                                    value={formData.prezzoUnitario}
                                    onChange={(e) => setFormData({ ...formData, prezzoUnitario: e.target.value })}
                                    placeholder="Inserisci prezzo unitario"
                                    style={{ borderRadius: '8px', height: '40px' }}
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Causale</label>
                                <div className="input-group">
                                    <div>
                                        <AsyncCreatableSelect
                                            cacheOptions
                                            defaultOptions
                                            loadOptions={loadCausaliOptions}
                                            onChange={handleCausaleChange}
                                            onCreateOption={handleCausaleCreate}
                                            value={formData.causale}
                                            placeholder="Inserisci causale movimento"
                                            formatCreateLabel={(inputValue) => `Crea "${inputValue}"`}
                                            styles={{
                                                control: (base) => ({
                                                    ...base,
                                                    borderTopLeftRadius: '8px',
                                                    borderBottomLeftRadius: '8px',
                                                    borderTopRightRadius: '0px',
                                                    borderBottomRightRadius: '0px',
                                                    borderColor: '#ddd',
                                                    minHeight: '40px',
                                                    boxShadow: 'none'
                                                }),
                                                menu: (base) => ({ ...base, zIndex: 9999 })
                                            }}
                                        />
                                    </div>
                                    <WrenchModalButton
                                        ModalComponent={CausaliManagementModal}
                                        title="Gestione Causali"
                                    />
                                </div>
                            </div>
                        </form>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-premium-cancel" onClick={handleClose}>Chiudi</button>
                        <button type="button" className="btn btn-premium-save" onClick={handleSubmit}>Salva</button>
                    </div>
                </div>
            </div>
            {showClientiModal && <ClientiManagementModal onClose={() => setShowClientiModal(false)} />}
            {showCausaliModal && <CausaliManagementModal onClose={() => setShowCausaliModal(false)} />}
        </div>
    );
};

export default ScaricoMagazzinoModal;
