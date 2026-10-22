import React, { useState, useEffect } from 'react';
import AsyncSelect from 'react-select/async';
import AsyncCreatableSelect from 'react-select/async-creatable';
import FornitoriService from '../../services/FornitoriService';
import CausaliMovimentoArticoliService from '../../services/CausaliMovimentoArticoliService';
import MovimentiMagazzinoService from '../../services/MovimentiMagazzinoService';
import UbicazioniService from '../../services/UbicazioniService';

import { FaPlus, FaTrash, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa';
import FornitoriManagementModal from '../../components/modals/FornitoriManagementModal';
import CausaliManagementModal from '../../components/modals/CausaliManagementModal';
import UbicazioniManagementModal from '../../components/modals/UbicazioniManagementModal';
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

const CaricoMagazzinoModal = ({ show, handleClose, article, refreshList }) => {
    const [activeTab, setActiveTab] = useState('dati'); // 'dati' | 'ubicazioni'
    const [formData, setFormData] = useState({
        dataOperazione: formatYYYYMMDD(new Date()),
        quantita: '',
        prezzoUnitario: '',
        fornitore: null, // { label, value }
        causale: null // { label, value }
    });

    const [ubicazioniRows, setUbicazioniRows] = useState([
        { idUbicazione: '', dot: '', quantita: '' }
    ]);

    const [availableLocations, setAvailableLocations] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show && article) {
            setFormData({
                dataOperazione: formatYYYYMMDD(new Date()),
                quantita: '',
                prezzoUnitario: article.prezzo || '',
                fornitore: article.idFornitore ? { label: article.descFornitore, value: article.idFornitore } : null,
                causale: null
            });
            setUbicazioniRows([
                { idUbicazione: '', dot: article.dot || '', quantita: '' }
            ]);
            setActiveTab('dati');
            setError(null);
            loadLocations();
        }
    }, [show, article]);

    const loadLocations = async () => {
        try {
            const res = await UbicazioniService.getList({ start: 0, length: 200, search: '' });
            setAvailableLocations(res.data?.list || []);
        } catch (err) {
            console.error("Errore caricamento ubicazioni", err);
        }
    };

    const handleQuantitaChange = (newVal) => {
        const oldQty = formData.quantita;
        setFormData(prev => ({ ...prev, quantita: newVal }));

        // Se c'è solo una riga ubicazioni e la sua quantità era vuota o uguale a quella vecchia, sincronizza
        setUbicazioniRows(prevRows => {
            if (prevRows.length === 1) {
                const row = prevRows[0];
                if (!row.quantita || row.quantita === oldQty) {
                    return [{ ...row, quantita: newVal }];
                }
            }
            return prevRows;
        });
    };

    const handleAddUbicazioneRow = () => {
        const caricoQty = parseFloat(formData.quantita) || 0;
        const currentTot = ubicazioniRows.reduce((sum, r) => sum + (parseFloat(r.quantita) || 0), 0);
        const remaining = Math.max(0, caricoQty - currentTot);

        setUbicazioniRows([
            ...ubicazioniRows,
            {
                idUbicazione: '',
                dot: article?.dot || '',
                quantita: remaining > 0 ? remaining : ''
            }
        ]);
    };

    const handleRemoveUbicazioneRow = (index) => {
        if (ubicazioniRows.length <= 1) {
            setUbicazioniRows([{ idUbicazione: '', dot: article?.dot || '', quantita: '' }]);
        } else {
            setUbicazioniRows(ubicazioniRows.filter((_, i) => i !== index));
        }
    };

    const handleUbicazioneRowChange = (index, field, value) => {
        setUbicazioniRows(prev => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            return copy;
        });
    };

    const handleFornitoreChange = (selectedOption) => {
        setFormData({ ...formData, fornitore: selectedOption });
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

    const loadFornitoriOptions = (inputValue) => {
        return FornitoriService.getSuggestion(inputValue).then(results =>
            results.map(item => ({ label: item.denominazione, value: item.id }))
        );
    };

    const loadCausaliOptions = (inputValue) => {
        return CausaliMovimentoArticoliService.getSuggestion(inputValue).then(results =>
            results.map(item => ({ label: item.descrizione, value: item.descrizione }))
        );
    };

    const caricoQty = parseFloat(formData.quantita) || 0;
    const totaleUbicato = ubicazioniRows.reduce((sum, r) => sum + (parseFloat(r.quantita) || 0), 0);
    const rimanenza = caricoQty - totaleUbicato;
    const isOverallocated = formData.quantita && totaleUbicato > caricoQty;

    const handleSubmit = async () => {
        if (!formData.dataOperazione || !formData.quantita) {
            setError("Data operazione e Quantità sono obbligatorie.");
            setActiveTab('dati');
            return;
        }

        if (caricoQty <= 0) {
            setError("La quantità del carico deve essere maggiore di zero.");
            setActiveTab('dati');
            return;
        }

        // Validazione righe ubicazioni
        const validRows = [];
        let sumUbi = 0;

        for (let i = 0; i < ubicazioniRows.length; i++) {
            const row = ubicazioniRows[i];
            const hasUbi = !!row.idUbicazione;
            const rowQty = parseFloat(row.quantita) || 0;

            if (hasUbi && rowQty <= 0) {
                setError(`Nella riga ${i + 1} delle ubicazioni, inserire una quantità maggiore di zero.`);
                setActiveTab('ubicazioni');
                return;
            }

            if (!hasUbi && rowQty > 0) {
                setError(`Nella riga ${i + 1} delle ubicazioni, selezionare un'ubicazione.`);
                setActiveTab('ubicazioni');
                return;
            }

            if (hasUbi && rowQty > 0) {
                validRows.push({
                    idUbicazione: parseInt(row.idUbicazione),
                    dot: (row.dot || '').trim(),
                    quantita: rowQty
                });
                sumUbi += rowQty;
            }
        }

        if (sumUbi > caricoQty) {
            setError(`La somma delle quantità assegnate alle ubicazioni (${sumUbi}) non può superare la quantità del carico (${caricoQty}).`);
            setActiveTab('ubicazioni');
            return;
        }

        try {
            const dto = {
                idProdotto: article.id,
                quantita: formData.quantita,
                prezzoUnitario: formData.prezzoUnitario,
                dataMovimento: formatDDMMYYYY(formData.dataOperazione),
                idFornitore: formData.fornitore?.value,
                descrCausale: formData.causale?.label || formData.causale?.value || '',
                idUnitaMisura: article.idUnitaMisura1
            };

            const response = await MovimentiMagazzinoService.insertCarico(dto);
            if (response && response.errorText) {
                setError(response.errorText);
                return;
            }

            // Se sono state assegnate ubicazioni, le salviamo
            if (validRows.length > 0) {
                try {
                    const existingRes = await UbicazioniService.getByProdotto(article.id);
                    const existingList = existingRes.data || [];

                    for (const row of validRows) {
                        const match = existingList.find(x =>
                            x.idUbicazione === row.idUbicazione &&
                            (x.dot || '').trim().toLowerCase() === row.dot.toLowerCase()
                        );

                        if (match) {
                            const newStock = (parseFloat(match.quantita) || 0) + row.quantita;
                            await UbicazioniService.saveProdottoUbicazione({
                                id: match.id,
                                idProdotto: article.id,
                                idUbicazione: row.idUbicazione,
                                dot: row.dot,
                                quantita: newStock
                            });
                            match.quantita = newStock;
                        } else {
                            const saveRes = await UbicazioniService.saveProdottoUbicazione({
                                id: 0,
                                idProdotto: article.id,
                                idUbicazione: row.idUbicazione,
                                dot: row.dot,
                                quantita: row.quantita
                            });
                            if (saveRes && saveRes.data) {
                                existingList.push(saveRes.data);
                            }
                        }
                    }
                } catch (ubiErr) {
                    console.error("Errore salvataggio ubicazioni durante carico", ubiErr);
                }
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
            <div className="modal-dialog modal-lg" role="document" style={{ width: '820px', maxWidth: '95vw', margin: '30px auto' }}>
                <div className="modal-content premium-modal-content" style={{ width: '100%', borderRadius: '14px', overflow: 'hidden' }}>
                    <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px', minHeight: 'unset' }}>
                        <div>
                            <h4 className="modal-title" style={{ fontWeight: 'bold', margin: 0, fontSize: '18px', lineHeight: 1.2 }}>Carico magazzino</h4>
                            <div className="modal-header-article" style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                                Articolo: <strong>{article?.codice}</strong> - {article?.descrizione}
                            </div>
                        </div>
                        <button type="button" className="close" onClick={handleClose} aria-label="Close" style={{ margin: 0, padding: 0, lineHeight: 1, fontSize: '24px' }}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                    <div className="modal-body" style={{ padding: '22px 24px', minHeight: '390px' }}>
                        {error && (
                            <div className="alert alert-danger" role="alert" style={{ marginBottom: '16px' }}>
                                {error}
                            </div>
                        )}

                        {/* Schede / Tabs Navigation */}
                        <ul className="nav nav-tabs nav-tabs-custom" style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
                            <li className={activeTab === 'dati' ? 'active' : ''}>
                                <a 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); setActiveTab('dati'); }} 
                                    style={{ fontWeight: 600, outline: 'none' }}
                                >
                                    Dati Carico
                                </a>
                            </li>
                            <li className={activeTab === 'ubicazioni' ? 'active' : ''}>
                                <a 
                                    href="#" 
                                    onClick={(e) => { e.preventDefault(); setActiveTab('ubicazioni'); }} 
                                    style={{ fontWeight: 600, display: 'flex', alignItems: 'center', outline: 'none' }}
                                >
                                    <span>Ubicazioni & DOT</span>
                                    {totaleUbicato > 0 && (
                                        <span className="badge" style={{ marginLeft: '8px', backgroundColor: isOverallocated ? '#dc2626' : '#2563eb', color: '#fff', fontSize: '11px', padding: '3px 8px' }}>
                                            {totaleUbicato} pz
                                        </span>
                                    )}
                                </a>
                            </li>
                        </ul>

                        {/* Tab Content */}
                        {activeTab === 'dati' && (
                            <div>
                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Fornitore</label>
                                    <div className="input-group" style={{ display: 'flex', width: '100%', alignItems: 'stretch' }}>
                                        <div style={{ flex: 1 }}>
                                            <AsyncSelect
                                                cacheOptions
                                                defaultOptions
                                                loadOptions={loadFornitoriOptions}
                                                onChange={handleFornitoreChange}
                                                value={formData.fornitore}
                                                placeholder="Seleziona fornitore..."
                                                styles={{
                                                    control: (base) => ({
                                                        ...base,
                                                        borderTopLeftRadius: '8px',
                                                        borderBottomLeftRadius: '8px',
                                                        borderTopRightRadius: '0px',
                                                        borderBottomRightRadius: '0px',
                                                        borderColor: '#ddd',
                                                        minHeight: '40px',
                                                        height: '40px',
                                                        boxShadow: 'none'
                                                    }),
                                                    valueContainer: (base) => ({
                                                        ...base,
                                                        height: '38px',
                                                        padding: '0 8px'
                                                    }),
                                                    indicatorsContainer: (base) => ({
                                                        ...base,
                                                        height: '38px'
                                                    }),
                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                }}
                                            />
                                        </div>
                                        <WrenchModalButton
                                            ModalComponent={FornitoriManagementModal}
                                            title="Gestione Fornitori"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '15px', marginBottom: '16px', width: '100%' }}>
                                    <div style={{ flex: 1 }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Data operazione *</label>
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
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Quantità *</label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={formData.quantita}
                                                onChange={(e) => handleQuantitaChange(e.target.value)}
                                                placeholder="Inserisci quantità"
                                                style={{ borderRadius: '8px', height: '40px' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Prezzo unitario</label>
                                            <input
                                                className="form-control"
                                                type="number"
                                                step="0.01"
                                                value={formData.prezzoUnitario}
                                                onChange={(e) => setFormData({ ...formData, prezzoUnitario: e.target.value })}
                                                placeholder="Inserisci prezzo unitario"
                                                style={{ borderRadius: '8px', height: '40px' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group" style={{ marginBottom: '16px' }}>
                                    <label style={{ display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>Causale</label>
                                    <div className="input-group" style={{ display: 'flex', width: '100%', alignItems: 'stretch' }}>
                                        <div style={{ flex: 1 }}>
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
                                                        height: '40px',
                                                        boxShadow: 'none'
                                                    }),
                                                    valueContainer: (base) => ({
                                                        ...base,
                                                        height: '38px',
                                                        padding: '0 8px'
                                                    }),
                                                    indicatorsContainer: (base) => ({
                                                        ...base,
                                                        height: '38px'
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
                            </div>
                        )}

                        {activeTab === 'ubicazioni' && (
                            <div>
                                {/* Riepilogo Quantità Bilancio */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    backgroundColor: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    padding: '12px 18px',
                                    marginBottom: '15px'
                                }}>
                                    <div>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block' }}>Q.TÀ CARICO</span>
                                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{caricoQty || 0} pz</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block' }}>TOTALE ASSEGNATO</span>
                                        <span style={{ fontSize: '16px', fontWeight: 'bold', color: isOverallocated ? '#dc2626' : '#16a34a' }}>
                                            {totaleUbicato} pz
                                        </span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, display: 'block' }}>DA ASSEGNARE</span>
                                        <span style={{
                                            fontSize: '16px',
                                            fontWeight: 'bold',
                                            color: rimanenza < 0 ? '#dc2626' : (rimanenza === 0 ? '#16a34a' : '#2563eb')
                                        }}>
                                            {rimanenza} pz
                                        </span>
                                    </div>
                                </div>

                                {isOverallocated && (
                                    <div className="alert alert-danger" style={{ padding: '9px 14px', fontSize: '13px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <FaExclamationTriangle />
                                        <span><strong>Attenzione:</strong> La quantità totale assegnata ({totaleUbicato}) supera la quantità del carico ({caricoQty})!</span>
                                    </div>
                                )}

                                <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                                    <FaInfoCircle style={{ marginRight: '5px' }} />
                                    È possibile ripartire gli pneumatici su più ubicazioni e specificare per ciascuna il rispettivo codice DOT (l'assegnazione è opzionale).
                                </p>

                                {/* Tabella righe ubicazioni */}
                                <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden', marginBottom: '12px' }}>
                                    <table className="table" style={{ marginBottom: 0 }}>
                                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                            <tr>
                                                <th style={{ width: '48%', padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>UBICAZIONE</th>
                                                <th style={{ width: '24%', padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>DOT</th>
                                                <th style={{ width: '18%', padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: '#475569' }}>QUANTITÀ</th>
                                                <th style={{ width: '10%', padding: '10px 14px', textAlign: 'center', fontSize: '12px', fontWeight: 700, color: '#475569' }}>AZIONI</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ubicazioniRows.map((row, idx) => (
                                                <tr key={idx} style={{ verticalAlign: 'middle', borderBottom: idx < ubicazioniRows.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                                                    <td style={{ padding: '8px 14px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                                            <select
                                                                className="form-control"
                                                                value={row.idUbicazione}
                                                                onChange={(e) => handleUbicazioneRowChange(idx, 'idUbicazione', e.target.value)}
                                                                style={{
                                                                    borderTopRightRadius: 0,
                                                                    borderBottomRightRadius: 0,
                                                                    height: '38px',
                                                                    fontSize: '13px'
                                                                }}
                                                            >
                                                                <option value="">-- Seleziona Ubicazione --</option>
                                                                {availableLocations.map(u => (
                                                                    <option key={u.id} value={u.id}>
                                                                        {u.codUbicazione} {u.corsia ? `(Corsia ${u.corsia})` : ''} {u.descrizione ? `- ${u.descrizione}` : ''}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <WrenchModalButton
                                                                ModalComponent={UbicazioniManagementModal}
                                                                onClose={loadLocations}
                                                                title="Gestione Ubicazioni"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '8px 14px' }}>
                                                        <input
                                                            type="text"
                                                            className="form-control"
                                                            placeholder="es. 2423"
                                                            value={row.dot}
                                                            onChange={(e) => handleUbicazioneRowChange(idx, 'dot', e.target.value)}
                                                            style={{ height: '38px', borderRadius: '6px', fontSize: '13px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px 14px' }}>
                                                        <input
                                                            type="number"
                                                            className="form-control"
                                                            placeholder="Q.tà"
                                                            min="1"
                                                            step="1"
                                                            value={row.quantita}
                                                            onChange={(e) => handleUbicazioneRowChange(idx, 'quantita', e.target.value)}
                                                            style={{ height: '38px', borderRadius: '6px', fontSize: '13px' }}
                                                        />
                                                    </td>
                                                    <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                                        <button
                                                            type="button"
                                                            className="btn btn-default"
                                                            onClick={() => handleRemoveUbicazioneRow(idx)}
                                                            title={ubicazioniRows.length > 1 ? "Elimina riga" : "Svuota riga"}
                                                            style={{
                                                                color: '#ef4444',
                                                                borderColor: '#fca5a5',
                                                                padding: '6px 10px',
                                                                height: '38px',
                                                                borderRadius: '6px'
                                                            }}
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-default"
                                    onClick={handleAddUbicazioneRow}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: '#2563eb',
                                        borderColor: '#93c5fd',
                                        backgroundColor: '#eff6ff',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        borderRadius: '6px',
                                        padding: '7px 14px'
                                    }}
                                >
                                    <FaPlus /> Aggiungi riga ubicazione
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 22px' }}>
                        <button type="button" className="btn btn-premium-cancel" onClick={handleClose}>Chiudi</button>
                        <button type="button" className="btn btn-premium-save" onClick={handleSubmit}>Salva Carico</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CaricoMagazzinoModal;
