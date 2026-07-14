import React, { useState } from 'react';
import AsyncSelect from 'react-select/async';
import { FaTrash, FaPlus, FaSearch } from 'react-icons/fa';
import Swal from 'sweetalert2';
import ArticoliService from '../../services/ArticoliService';
import { getRowValues } from '../../utils/documentUtils';
import ArticoliManagementModal from '../modals/ArticoliManagementModal';

const formatCurrency = (val) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val || 0);
};

const tableSelectStyles = {
    control: (base) => ({
        ...base,
        border: '1px solid #ddd',
        boxShadow: 'none',
        minHeight: '30px',
        height: 'auto',
        fontSize: '13px'
    }),
    dropdownIndicator: (base) => ({
        ...base,
        padding: 4
    }),
    clearIndicator: (base) => ({
        ...base,
        padding: 4
    }),
    valueContainer: (base) => ({
        ...base,
        padding: '0 8px',
        minHeight: '30px',
        height: 'auto',
        display: 'flex'
    }),
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0
    }),
    menuPortal: base => ({ ...base, zIndex: 9999 }),
    menu: base => ({ ...base, zIndex: 9999, width: 'max-content', minWidth: '100%' }),
    option: (base) => ({
        ...base,
        padding: '8px 12px',
        cursor: 'pointer'
    })
};

const DocumentRows = (props) => {
    const {
        rows,
        onRowChange,
        onRowUpdate,
        onDeleteRow,
        onAddRow,
        addExtraProps = {},
        combos,
        isCeramica,
        showRitenuta = false,
        readOnly = false,
        idListino = null,
        children
    } = props;

    const [modalOpen, setModalOpen] = useState(false);
    const [activeRowIdx, setActiveRowIdx] = useState(null);

    const loadArticoli = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 3) return callback([]);
        ArticoliService.getSuggestion(inputValue).then(res => {
            const list = res.data?.list || [];
            if (list.length > 0) {
                callback(list.map(a => ({
                    value: a.id,
                    label: `${a.codice} - ${a.descrizione}`,
                    data: {
                        ...a,
                        codiceProdotto: a.codice,
                        descProdotto: a.descrizione
                    }
                })));
            } else callback([]);
        }).catch(err => {
            console.error("Error loading articoli:", err);
            callback([]);
        });
    };

    const formatArticleOptionLabel = (option, { context }) => {
        const { label, data } = option;

        // Auto-detect ceramic article if format is present, even if global setting is off
        const hasCeramicData = isCeramica || (data.descrFormato && data.descrFormato.length > 0) || (data.descrScelta && data.descrScelta.length > 0);
        
        // Calcolo disponibilità (solo se gestito a magazzino)
        const disponib = (data.quantitaEsistente || 0) - (data.quantitaImpegnata || 0);
        // Mostriamo la disponibilità solo per "Articolo con magazzino" (AM) o "Articolo con scelte/colori" (AMSC)
        const showStock = data.tipologia === 'AM' || data.tipologia === 'AMSC';

        // For selected value (in the input), show details underneath
        if (context === 'value') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', lineHeight: '1.2', padding: '2px 0', overflow: 'hidden' }}>
                    <div style={{ fontWeight: '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{label}</div>
                    <div style={{ fontSize: '10px', color: '#666', display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
                        {showStock && (
                            <span style={{ color: disponib <= 0 ? '#d32f2f' : '#2e7d32' }}>
                                Disp: <b>{disponib}</b>
                            </span>
                        )}
                        {hasCeramicData && (
                            <>
                                {data.descrFormato && <span>F:<b>{data.descrFormato}</b></span>}
                                {data.descrScelta && <span>S:<b>{data.descrScelta}</b></span>}
                                {data.descrTono && <span>T:<b>{data.descrTono}</b></span>}
                                {data.descrCalibro && <span>C:<b>{data.descrCalibro}</b></span>}
                            </>
                        )}
                    </div>
                </div>
            );
        }

        // For dropdown menu options, show full details in column
        return (
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', padding: '4px 0', minWidth: '300px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: '500', marginBottom: '2px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{label}</div>
                    {hasCeramicData && (
                        <div style={{ fontSize: '11px', color: '#666', display: 'flex', gap: '10px', alignItems: 'center' }}>
                            {data.descrFormato && <span>F: <b style={{ color: '#333' }}>{data.descrFormato}</b></span>}
                            {data.descrScelta && <span>S: <b style={{ color: '#333' }}>{data.descrScelta}</b></span>}
                            {data.descrTono && <span>T: <b style={{ color: '#333' }}>{data.descrTono}</b></span>}
                            {data.descrCalibro && <span>C: <b style={{ color: '#333' }}>{data.descrCalibro}</b></span>}
                        </div>
                    )}
                </div>
                {showStock && (
                    <div style={{ marginLeft: '15px', padding: '2px 6px', borderRadius: '4px', background: disponib <= 0 ? '#ffebee' : '#e8f5e9', color: disponib <= 0 ? '#c62828' : '#2e7d32', fontWeight: 'bold', fontSize: '11px', whiteSpace: 'nowrap' }}>
                        Disp: {disponib}
                    </div>
                )}
            </div>
        );
    };

    const addRow = (type) => {
        const defaultAliquota = (combos.aliquoteIva || []).find(a => a.predefinita === 1) || (combos.aliquoteIva || [])[0] || null;
        const defaultUM = (combos.unitaMisura || [])[0] || null;

        let newRow = { tipo: type };
        if (type === 'N') {
            newRow.nota = '';
        } else {
            newRow = {
                ...newRow,
                idProdotto: null,
                codiceProdotto: '',
                descProdotto: '',
                quantita: 1,
                idUnitaMisura: defaultUM?.id || null,
                prezzo: 0,
                sconto: '',
                idAliquotaIva: defaultAliquota?.id || null,
                nota: '',
                ...addExtraProps
            };
            if (type === 'F') {
                newRow.fmDescrizione = '';
            }
        }
        if (onAddRow) onAddRow(newRow);
    };

    const handleDelete = (index) => {
        Swal.fire({
            title: 'Sei sicuro?',
            text: "Vuoi eliminare questo articolo dal documento?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        }).then((result) => {
            if (result.isConfirmed) {
                onDeleteRow(index);
            }
        });
    };

    const openArticoliModal = (idx) => {
        setActiveRowIdx(idx);
        setModalOpen(true);
    };

    const handleModalSelect = (opt) => {
        if (activeRowIdx !== null) {
            const a = opt.data || {};
            onRowUpdate(activeRowIdx, {
                idProdotto: opt.value,
                codiceProdotto: a.codiceProdotto || '',
                descProdotto: a.descProdotto || '',
                prezzo: a.prezzo || 0,
                idUnitaMisura: a.idUnitaMisura,
                idAliquotaIva: a.idAliquotaIva,
                descrFormato: a.descrFormato,
                descrScelta: a.descrScelta,
                descrTono: a.descrTono,
                descrCalibro: a.descrCalibro
            });
        }
        setModalOpen(false);
        setActiveRowIdx(null);
    };

    return (
        <div className="table-responsive">
            <table className="table table-hover table-items">
                <thead>
                    <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>Tipo</th>
                        <th>Descrizione / Articolo</th>
                        <th style={{ width: '110px' }}>Q.tà</th>
                        <th style={{ width: '70px' }}>U.M.</th>
                        <th style={{ width: '120px' }}>Prezzo</th>
                        <th style={{ width: '100px' }}>Sconto</th>
                        <th style={{ width: '100px' }}>IVA</th>
                        <th style={{ width: '120px' }}>Totale</th>
                        <th style={{ width: '40px' }}></th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, idx) => {
                        const vals = getRowValues(row, combos.aliquoteIva);
                        return (
                            <tr key={idx} className={`row-${row.tipo ? row.tipo.toLowerCase() : 'a'}`}>
                                <td className="cell-tipo" style={{ textAlign: 'center' }}>
                                    {row.tipo === 'A' && <span className="label label-primary">ART</span>}
                                    {row.tipo === 'F' && <span className="label label-info">F.M.</span>}
                                    {row.tipo === 'N' && <span className="label label-default">NOTA</span>}
                                </td>
                                <td colSpan={row.tipo === 'N' ? 7 : 1}>
                                    {row.tipo === 'A' ? (
                                        <>
                                            <div style={{ display: 'flex', gap: '5px' }}>
                                                <div style={{ flex: 1 }}>
                                                    <AsyncSelect
                                                        isClearable
                                                        cacheOptions
                                                        loadOptions={loadArticoli}
                                                        formatOptionLabel={formatArticleOptionLabel}
                                                        styles={tableSelectStyles}
                                                        placeholder="Cerca art..."
                                                        noOptionsMessage={() => "Nessun risultato"}
                                                        loadingMessage={() => "Caricamento..."}
                                                        menuPortalTarget={document.body}
                                                        value={row.idProdotto ? { value: row.idProdotto, label: `${row.codiceProdotto} - ${row.descProdotto}`, data: row } : null}
                                                        onChange={(opt) => {
                                                            const a = opt?.data || {};
                                                            onRowUpdate(idx, {
                                                                idProdotto: opt?.value,
                                                                codiceProdotto: a.codiceProdotto || '',
                                                                descProdotto: a.descProdotto || '',
                                                                prezzo: a.prezzo || 0,
                                                                idUnitaMisura: a.idUnitaMisura,
                                                                idAliquotaIva: a.idAliquotaIva,
                                                                descrFormato: a.descrFormato,
                                                                descrScelta: a.descrScelta,
                                                                descrTono: a.descrTono,
                                                                descrCalibro: a.descrCalibro
                                                            });

                                                            if (opt?.value) {
                                                                ArticoliService.getArticlePrice(opt.value, idListino).then(res => {
                                                                    if (res.data && res.data.prezzo !== undefined) {
                                                                        onRowChange(idx, 'prezzo', res.data.prezzo);
                                                                    }
                                                                }).catch(err => console.error("Error fetching dynamic price:", err));
                                                            }
                                                        }}
                                                        isDisabled={readOnly}
                                                    />
                                                </div>
                                                {!readOnly && (
                                                    <button
                                                        type="button"
                                                        className="btn btn-default btn-sm"
                                                        style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '32px', padding: '0' }}
                                                        onClick={() => openArticoliModal(idx)}
                                                        title="Sfoglia elenco articoli"
                                                    >
                                                        <FaSearch />
                                                    </button>
                                                )}
                                            </div>
                                            {showRitenuta && (
                                                <div className="ritenuta-inline-box" style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#d32f2f' }}>
                                                    <input
                                                        type="checkbox"
                                                        id={`ritenuta-${idx}`}
                                                        checked={row.flRitenuta === 1}
                                                        onChange={(e) => onRowChange(idx, 'flRitenuta', e.target.checked ? 1 : 0)}
                                                        disabled={readOnly}
                                                        style={{ cursor: 'pointer', margin: 0, width: '15px', height: '15px' }}
                                                    />
                                                    <label htmlFor={`ritenuta-${idx}`} style={{ cursor: 'pointer', fontWeight: 500, margin: 0 }}>Soggetto a Ritenuta</label>
                                                </div>
                                            )}
                                        </>
                                    ) : row.tipo === 'F' ? (
                                        <div className="flex-column gap-1">
                                            <input type="text" className="form-control" value={row.fmDescrizione || ''} onChange={(e) => onRowChange(idx, 'fmDescrizione', e.target.value)} placeholder="Descrizione libera..." disabled={readOnly} />
                                            {isCeramica && (
                                                <div className="d-flex gap-2 mt-1">
                                                    <input type="text" className="form-control form-control-xs" value={row.fmScelta || ''} onChange={(e) => onRowChange(idx, 'fmScelta', e.target.value)} placeholder="Scelta" style={{ width: '50%' }} disabled={readOnly} />
                                                    <input type="text" className="form-control form-control-xs" value={row.fmTono || ''} onChange={(e) => onRowChange(idx, 'fmTono', e.target.value)} placeholder="Tono" style={{ width: '50%' }} disabled={readOnly} />
                                                </div>
                                            )}
                                            {showRitenuta && (
                                                <div className="ritenuta-inline-box" style={{ marginTop: '5px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#d32f2f' }}>
                                                    <input
                                                        type="checkbox"
                                                        id={`ritenuta-${idx}`}
                                                        checked={row.flRitenuta === 1}
                                                        onChange={(e) => onRowChange(idx, 'flRitenuta', e.target.checked ? 1 : 0)}
                                                        disabled={readOnly}
                                                        style={{ cursor: 'pointer', margin: 0, width: '15px', height: '15px' }}
                                                    />
                                                    <label htmlFor={`ritenuta-${idx}`} style={{ cursor: 'pointer', fontWeight: 500, margin: 0 }}>Soggetto a Ritenuta</label>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <input type="text" className="form-control" value={row.nota || row.fmDescrizione || row.descrizione || ''} onChange={(e) => onRowChange(idx, 'nota', e.target.value)} placeholder="Testo della nota..." disabled={readOnly} />
                                    )}
                                </td>

                                {
                                    row.tipo !== 'N' ? (
                                        <>
                                            <td><input type="number" step="0.01" className="form-control text-right" value={row.quantita} onChange={(e) => onRowChange(idx, 'quantita', e.target.value)} disabled={readOnly} /></td>
                                            <td>
                                                <div className="cell-select-group">
                                                    <select className="form-control input-sm" value={row.idUnitaMisura || ''} onChange={(e) => onRowChange(idx, 'idUnitaMisura', e.target.value)} disabled={readOnly}>
                                                        <option value="">-</option>
                                                        {(combos.unitaMisura || []).map(u => <option key={u.id} value={u.id}>{u.descrizione}</option>)}
                                                    </select>
                                                </div>
                                            </td>
                                            <td><input type="number" step="0.01" className="form-control text-right" value={row.prezzo} onChange={(e) => onRowChange(idx, 'prezzo', e.target.value)} disabled={readOnly} /></td>
                                            <td><input type="text" className="form-control text-right" value={row.sconto || ''} onChange={(e) => onRowChange(idx, 'sconto', e.target.value)} disabled={readOnly} /></td>
                                            <td>
                                                <div className="cell-select-group">
                                                    <select className="form-control input-sm" value={row.idAliquotaIva || ''} onChange={(e) => onRowChange(idx, 'idAliquotaIva', e.target.value)} disabled={readOnly}>
                                                        <option value="">-</option>
                                                        {(combos.aliquoteIva || []).map(a => <option key={a.id} value={a.id}>{a.codice}</option>)}
                                                    </select>
                                                </div>
                                            </td>
                                            <td className="text-right" style={{ verticalAlign: 'middle', fontWeight: 600 }}>
                                                {formatCurrency(vals.total)}
                                            </td>
                                        </>
                                    ) : null
                                }
                                <td>
                                    {!readOnly && (
                                        <button type="button" className="btn-delete-row" onClick={() => handleDelete(idx)} tabIndex="-1">
                                            <FaTrash />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {onAddRow && !readOnly && (
                        <tr className="row-add-actions">
                            <td colSpan={9} style={{ padding: '0px' }}>
                                <div className="table-row-add-toolbar">
                                    <button type="button" className="btn-add-inline" onClick={() => addRow('A')}>
                                        <FaPlus /> ARTICOLO
                                    </button>
                                    <button type="button" className="btn-add-inline fm" onClick={() => addRow('F')}>
                                        <FaPlus /> FUORI MAGAZZINO
                                    </button>
                                    <button type="button" className="btn-add-inline note" onClick={() => addRow('N')}>
                                        <FaPlus /> NOTA
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )}
                    {children && (
                        <tr className="row-add-actions">
                            <td colSpan={9} style={{ padding: '0px' }}>
                                {children}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <ArticoliManagementModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSelect={handleModalSelect}
                idListino={idListino}
            />
        </div >
    );
};

export default DocumentRows;
