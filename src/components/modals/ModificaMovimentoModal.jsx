import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import MovimentiMagazzinoService from '../../services/MovimentiMagazzinoService';
import UbicazioniService from '../../services/UbicazioniService';
import Swal from 'sweetalert2';
import { 
    FaSave, 
    FaTimes, 
    FaBoxes, 
    FaMapMarkerAlt, 
    FaCalendarAlt, 
    FaEuroSign, 
    FaEdit, 
    FaPlus, 
    FaTrash, 
    FaInfoCircle, 
    FaExclamationTriangle 
} from 'react-icons/fa';
import UbicazioniManagementModal from './UbicazioniManagementModal';
import WrenchModalButton from '../WrenchModalButton';

const parseDateToYYYYMMDD = (dStr) => {
    if (!dStr) return '';
    if (dStr.includes('-')) return dStr;
    const parts = dStr.split('/');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return '';
};

const formatDDMMYYYY = (dateStr) => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
};

const ModificaMovimentoModal = ({ show, handleClose, movimento, onSaveSuccess, hasUbicazioni }) => {
    const [activeTab, setActiveTab] = useState('dati'); // 'dati' | 'ubicazioni'
    const [formData, setFormData] = useState({
        dataMovimento: '',
        quantita: '',
        prezzoUnitario: '',
        causale: ''
    });

    const [ubicazioniRows, setUbicazioniRows] = useState([]);
    const [initialLocationRows, setInitialLocationRows] = useState([]);
    const [availableLocations, setAvailableLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (show && movimento) {
            const isCarico = movimento.tipoMovimento === 'I';
            const initialQty = isCarico ? (movimento.quantitaCarico || movimento.quantita || 0) : (movimento.quantitaScarico || movimento.quantita || 0);

            setFormData({
                dataMovimento: parseDateToYYYYMMDD(movimento.dataMovimento) || new Date().toISOString().split('T')[0],
                quantita: initialQty,
                prezzoUnitario: movimento.prezzoUnitario != null ? movimento.prezzoUnitario : '',
                causale: movimento.causale || ''
            });
            setError(null);
            setActiveTab('dati');

            if (hasUbicazioni) {
                loadAvailableLocations();
                if (movimento.idProdotto) {
                    loadProductLocations(movimento.idProdotto, initialQty);
                }
            } else {
                setUbicazioniRows([]);
                setInitialLocationRows([]);
            }
        }
    }, [show, movimento, hasUbicazioni]);

    const loadAvailableLocations = async () => {
        try {
            const res = await UbicazioniService.getList({ start: 0, length: 1000, search: '' });
            setAvailableLocations(res.data?.list || []);
        } catch (err) {
            console.error("Errore caricamento ubicazioni disponibili", err);
        }
    };

    const loadProductLocations = async (idProdotto, fallbackQty) => {
        setLoadingLocations(true);
        try {
            const res = await UbicazioniService.getByProdotto(idProdotto);
            const currentList = res.data || [];
            setInitialLocationRows(currentList);

            if (currentList.length > 0) {
                setUbicazioniRows(currentList.map(loc => ({
                    id: loc.id,
                    idUbicazione: loc.idUbicazione,
                    dot: loc.dot || '',
                    quantita: loc.quantita
                })));
            } else {
                setUbicazioniRows([
                    { id: 0, idUbicazione: '', dot: movimento?.dot || '', quantita: fallbackQty || '' }
                ]);
            }
        } catch (err) {
            console.error("Errore caricamento ubicazioni del prodotto", err);
        } finally {
            setLoadingLocations(false);
        }
    };

    if (!show || !movimento) return null;

    const isCarico = movimento.tipoMovimento === 'I';
    const originalQty = isCarico ? (movimento.quantitaCarico || movimento.quantita || 0) : (movimento.quantitaScarico || movimento.quantita || 0);
    const currentQtyNum = parseFloat(formData.quantita) || 0;
    const delta = currentQtyNum - originalQty;

    const totaleUbicato = ubicazioniRows.reduce((sum, r) => sum + (parseFloat(r.quantita) || 0), 0);
    const rimanenza = currentQtyNum - totaleUbicato;
    const isOverallocated = formData.quantita && totaleUbicato > currentQtyNum;

    const ubicazioneOptions = availableLocations.map(u => ({
        value: u.id,
        label: `${u.descrizione ? u.descrizione : u.codUbicazione}${u.corsia ? ` (Corsia ${u.corsia})` : ''}${u.descrizione && u.codUbicazione ? ` [${u.codUbicazione}]` : ''}`
    }));

    const handleQuantitaChange = (newVal) => {
        const oldQty = formData.quantita;
        setFormData(prev => ({ ...prev, quantita: newVal }));

        // Se c'è una sola riga ubicazioni ed era uguale alla vecchia quantità o vuota, sincronizza
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
        const currentTot = ubicazioniRows.reduce((sum, r) => sum + (parseFloat(r.quantita) || 0), 0);
        const remaining = Math.max(0, currentQtyNum - currentTot);

        setUbicazioniRows([
            ...ubicazioniRows,
            {
                id: 0,
                idUbicazione: '',
                dot: movimento?.dot || '',
                quantita: remaining > 0 ? remaining : ''
            }
        ]);
    };

    const handleRemoveUbicazioneRow = (index) => {
        if (ubicazioniRows.length <= 1) {
            setUbicazioniRows([{ id: 0, idUbicazione: '', dot: movimento?.dot || '', quantita: '' }]);
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

    const formatTireLabel = () => {
        const parts = [];
        if (movimento.descMarca) parts.push(movimento.descMarca);
        if (movimento.sezione && movimento.serie) {
            parts.push(`${movimento.sezione}/${movimento.serie}`);
        } else if (movimento.sezione) {
            parts.push(movimento.sezione);
        }
        if (movimento.diametro) parts.push(`R${movimento.diametro}`);
        if (movimento.indiceVelocita) parts.push(movimento.indiceVelocita);
        if (movimento.scultura) parts.push(movimento.scultura);
        if (movimento.dot) parts.push(`(DOT ${movimento.dot})`);

        return parts.length > 0 ? parts.join(' ') : (movimento.descrizioneProdotto || movimento.codiceProdotto || '-');
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError(null);

        if (!formData.dataMovimento) {
            setError("La data del movimento è obbligatoria.");
            setActiveTab('dati');
            return;
        }

        if (currentQtyNum <= 0) {
            setError("La quantità deve essere maggiore di zero.");
            setActiveTab('dati');
            return;
        }

        // Se la gestione ubicazioni è abilitata, validiamo le righe
        const validRows = [];
        if (hasUbicazioni && ubicazioniRows.length > 0) {
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
                        id: row.id || 0,
                        idUbicazione: parseInt(row.idUbicazione),
                        dot: (row.dot || '').trim(),
                        quantita: rowQty
                    });
                    sumUbi += rowQty;
                }
            }

            if (sumUbi > currentQtyNum) {
                setError(`La somma delle quantità assegnate alle ubicazioni (${sumUbi}) non può superare la quantità del carico (${currentQtyNum}).`);
                setActiveTab('ubicazioni');
                return;
            }
        }

        setSaving(true);
        try {
            const movId = movimento.id || movimento.idDocumento;
            const dto = {
                id: movId,
                idProdotto: movimento.idProdotto,
                tipoMovimento: movimento.tipoMovimento,
                quantita: currentQtyNum,
                prezzoUnitario: formData.prezzoUnitario !== '' ? parseFloat(formData.prezzoUnitario) : null,
                dataMovimento: formatDDMMYYYY(formData.dataMovimento),
                causale: formData.causale,
                descrCausale: formData.causale
            };

            const res = await MovimentiMagazzinoService.update(movId, dto);
            if (res && res.errorText) {
                setError(res.errorText);
                setSaving(false);
                return;
            }

            // Sincronizzazione delle Ubicazioni del prodotto
            if (hasUbicazioni && movimento.idProdotto) {
                try {
                    // 1. Identifica le ubicazioni rimosse da eliminare su DB
                    const activeIds = validRows.map(r => r.id).filter(id => id > 0);
                    for (const initialRow of initialLocationRows) {
                        if (!activeIds.includes(initialRow.id)) {
                            await UbicazioniService.deleteProdottoUbicazione(initialRow.id);
                        }
                    }

                    // 2. Salva o aggiorna le righe valide
                    for (const row of validRows) {
                        await UbicazioniService.saveProdottoUbicazione({
                            id: row.id,
                            idProdotto: movimento.idProdotto,
                            idUbicazione: row.idUbicazione,
                            dot: row.dot,
                            quantita: row.quantita
                        });
                    }
                } catch (ubiErr) {
                    console.error("Errore salvataggio ubicazioni durante modifica movimento", ubiErr);
                }
            }

            Swal.fire({
                icon: 'success',
                title: 'Movimento Aggiornato',
                text: 'Il movimento e le relative ubicazioni sono stati aggiornati con successo.',
                timer: 2000,
                showConfirmButton: false
            });

            if (onSaveSuccess) onSaveSuccess();
            handleClose();
        } catch (err) {
            console.error("Errore salvataggio modifica movimento", err);
            setError(err.response?.data?.message || err.message || "Errore durante il salvataggio.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document" style={{ width: '820px', maxWidth: '95vw', margin: '30px auto' }}>
                <div className="modal-content premium-modal-content" style={{ borderRadius: '14px', overflow: 'hidden' }}>
                    <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 22px' }}>
                        <div>
                            <h4 className="modal-title" style={{ fontWeight: 'bold', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaEdit style={{ color: '#2563eb' }} />
                                {isCarico ? 'Modifica Carico Manuale' : 'Modifica Scarico Manuale'}
                            </h4>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                                Movimento #{movimento.id || movimento.idDocumento}
                            </div>
                        </div>
                        <button type="button" className="close" onClick={handleClose} aria-label="Close" style={{ margin: 0, padding: 0, fontSize: '22px' }}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body" style={{ padding: '20px 22px' }}>
                            {/* Articolo Info Card */}
                            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '18px' }}>
                                <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>
                                    Articolo
                                </div>
                                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>
                                    {formatTireLabel()}
                                </div>
                                {movimento.codiceProdotto && (
                                    <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px' }}>
                                        Codice: <code style={{ backgroundColor: '#e2e8f0', color: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>{movimento.codiceProdotto}</code>
                                    </div>
                                )}
                            </div>

                            {error && (
                                <div className="alert alert-danger" style={{ fontSize: '13px', padding: '10px 14px', marginBottom: '16px', borderRadius: '6px' }}>
                                    {error}
                                </div>
                            )}

                            {/* Schede / Tabs Navigation (se Ubicazioni abilitate) */}
                            {hasUbicazioni && (
                                <ul className="nav nav-tabs nav-tabs-custom" style={{ marginBottom: '20px', borderBottom: '2px solid #e2e8f0' }}>
                                    <li className={activeTab === 'dati' ? 'active' : ''}>
                                        <a 
                                            href="#" 
                                            onClick={(e) => { e.preventDefault(); setActiveTab('dati'); }} 
                                            style={{ fontWeight: 600, outline: 'none' }}
                                        >
                                            Dati Movimento
                                        </a>
                                    </li>
                                    <li className={activeTab === 'ubicazioni' ? 'active' : ''}>
                                        <a 
                                            href="#" 
                                            onClick={(e) => { e.preventDefault(); setActiveTab('ubicazioni'); }} 
                                            style={{ fontWeight: 600, display: 'flex', alignItems: 'center', outline: 'none' }}
                                        >
                                            <FaMapMarkerAlt style={{ marginRight: '6px' }} />
                                            <span>Ubicazioni & DOT</span>
                                            {totaleUbicato > 0 && (
                                                <span className="badge" style={{ marginLeft: '8px', backgroundColor: isOverallocated ? '#dc2626' : '#2563eb', color: '#fff', fontSize: '11px', padding: '3px 8px' }}>
                                                    {totaleUbicato} pz
                                                </span>
                                            )}
                                        </a>
                                    </li>
                                </ul>
                            )}

                            {/* TAB DATI */}
                            {(activeTab === 'dati' || !hasUbicazioni) && (
                                <div>
                                    <div className="row">
                                        <div className="col-xs-12 col-sm-6">
                                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <FaCalendarAlt style={{ color: '#64748b' }} /> Data Movimento *
                                                </label>
                                                <input
                                                    type="date"
                                                    className="form-control"
                                                    value={formData.dataMovimento}
                                                    onChange={(e) => setFormData({ ...formData, dataMovimento: e.target.value })}
                                                    required
                                                    style={{ height: '38px', borderRadius: '6px' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-xs-12 col-sm-6">
                                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <FaBoxes style={{ color: '#64748b' }} /> Quantità (Pezzi) *
                                                </label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    min="0.01"
                                                    className="form-control"
                                                    value={formData.quantita}
                                                    onChange={(e) => handleQuantitaChange(e.target.value)}
                                                    required
                                                    style={{ height: '38px', borderRadius: '6px', fontWeight: 'bold', fontSize: '15px' }}
                                                />
                                                {delta !== 0 && (
                                                    <small style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: delta > 0 ? '#16a34a' : '#dc2626' }}>
                                                        Delta giacenza: {delta > 0 ? `+${delta.toFixed(2)}` : delta.toFixed(2)} pz (quantità prima della modifica: {originalQty.toFixed(2)} pz)
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-xs-12 col-sm-6">
                                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <FaEuroSign style={{ color: '#64748b' }} /> Prezzo Unitario (€)
                                                </label>
                                                <input
                                                    type="number"
                                                    step="any"
                                                    min="0"
                                                    className="form-control"
                                                    placeholder="Opzionale"
                                                    value={formData.prezzoUnitario}
                                                    onChange={(e) => setFormData({ ...formData, prezzoUnitario: e.target.value })}
                                                    style={{ height: '38px', borderRadius: '6px' }}
                                                />
                                            </div>
                                        </div>

                                        <div className="col-xs-12 col-sm-6">
                                            <div className="form-group" style={{ marginBottom: '16px' }}>
                                                <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                                    Causale
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="es. Carico rapido magazzino"
                                                    value={formData.causale}
                                                    onChange={(e) => setFormData({ ...formData, causale: e.target.value })}
                                                    style={{ height: '38px', borderRadius: '6px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB UBICAZIONI & DOT */}
                            {hasUbicazioni && activeTab === 'ubicazioni' && (
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
                                            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>{currentQtyNum || 0} pz</span>
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
                                        <div className="alert alert-danger" style={{ padding: '9px 14px', fontSize: '13px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '6px' }}>
                                            <FaExclamationTriangle />
                                            <span><strong>Attenzione:</strong> La quantità totale assegnata ({totaleUbicato}) supera la quantità del carico ({currentQtyNum})!</span>
                                        </div>
                                    )}

                                    <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '12px' }}>
                                        <FaInfoCircle style={{ marginRight: '5px' }} />
                                        Modifica la collocazione, il codice DOT o la quantità assegnata alle ubicazioni per questo articolo.
                                    </p>

                                    {/* Tabella righe ubicazioni */}
                                    <div className="table-responsive" style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'visible', marginBottom: '12px' }}>
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
                                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                                    <Select
                                                                        options={ubicazioneOptions}
                                                                        value={ubicazioneOptions.find(opt => opt.value === Number(row.idUbicazione)) || null}
                                                                        onChange={(selectedOption) => handleUbicazioneRowChange(idx, 'idUbicazione', selectedOption ? selectedOption.value : '')}
                                                                        placeholder="Cerca o seleziona ubicazione..."
                                                                        isClearable
                                                                        isSearchable
                                                                        noOptionsMessage={({ inputValue }) => !inputValue ? "Nessuna ubicazione disponibile" : `Nessuna ubicazione trovata per "${inputValue}"`}
                                                                        menuPortalTarget={document.body}
                                                                        styles={{
                                                                            control: (base) => ({
                                                                                ...base,
                                                                                borderTopLeftRadius: '6px',
                                                                                borderBottomLeftRadius: '6px',
                                                                                borderTopRightRadius: '0px',
                                                                                borderBottomRightRadius: '0px',
                                                                                borderColor: '#cbd5e1',
                                                                                minHeight: '38px',
                                                                                height: '38px',
                                                                                boxShadow: 'none',
                                                                                fontSize: '13px'
                                                                            }),
                                                                            menuPortal: (base) => ({
                                                                                ...base,
                                                                                zIndex: 9999
                                                                            })
                                                                        }}
                                                                    />
                                                                </div>
                                                                <WrenchModalButton
                                                                    ModalComponent={UbicazioniManagementModal}
                                                                    onClose={loadAvailableLocations}
                                                                    onSelect={(selectedUbi) => {
                                                                        loadAvailableLocations();
                                                                        if (selectedUbi && selectedUbi.id) {
                                                                            handleUbicazioneRowChange(idx, 'idUbicazione', selectedUbi.id);
                                                                        }
                                                                    }}
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
                                                                step="any"
                                                                min="0.01"
                                                                className="form-control"
                                                                placeholder="Pz"
                                                                value={row.quantita}
                                                                onChange={(e) => handleUbicazioneRowChange(idx, 'quantita', e.target.value)}
                                                                style={{ height: '38px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold' }}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                                                            <button
                                                                type="button"
                                                                className="btn btn-default btn-sm"
                                                                onClick={() => handleRemoveUbicazioneRow(idx)}
                                                                style={{
                                                                    borderColor: '#fca5a5',
                                                                    color: '#dc2626',
                                                                    borderRadius: '6px',
                                                                    height: '38px',
                                                                    width: '38px',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center'
                                                                }}
                                                                title="Rimuovi riga"
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
                                        className="btn btn-default btn-sm"
                                        onClick={handleAddUbicazioneRow}
                                        style={{
                                            borderRadius: '6px',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            fontWeight: 600,
                                            fontSize: '12px',
                                            color: '#2563eb',
                                            borderColor: '#bfdbfe',
                                            backgroundColor: '#eff6ff'
                                        }}
                                    >
                                        <FaPlus /> Aggiungi Ubicazione
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer" style={{ padding: '14px 22px', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
                            <button
                                type="button"
                                className="btn btn-default"
                                onClick={handleClose}
                                disabled={saving}
                                style={{ borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', height: '38px', padding: '0 16px' }}
                            >
                                <FaTimes /> Annulla
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={saving}
                                style={{ borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', height: '38px', padding: '0 18px', backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                            >
                                <FaSave /> {saving ? 'Salvataggio...' : 'Salva Modifiche'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModificaMovimentoModal;
