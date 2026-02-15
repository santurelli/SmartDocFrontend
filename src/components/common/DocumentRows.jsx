import React from 'react';
import AsyncSelect from 'react-select/async';
import { FaTrash } from 'react-icons/fa';
import ArticoliService from '../../services/ArticoliService';
import { getRowValues } from '../../utils/documentUtils';

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

const DocumentRows = ({
    rows,
    onRowChange,
    onRowUpdate,
    onDeleteRow,
    combos,
    isCeramica,
    showDownloadColumn = false,
    readOnly = false,
    children
}) => {
    // Debug log for isCeramica
    console.log('[DocumentRows] isCeramica prop:', isCeramica);

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

        // For selected value (in the input), show details underneath
        if (context === 'value') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', fontSize: '12px', lineHeight: '1.2', padding: '2px 0', overflow: 'hidden' }}>
                    <div style={{ fontWeight: '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{label}</div>
                    {hasCeramicData && (
                        <div style={{ fontSize: '10px', color: '#666', display: 'flex', gap: '8px', whiteSpace: 'nowrap' }}>
                            {data.descrFormato && <span>F:<b>{data.descrFormato}</b></span>}
                            {data.descrScelta && <span>S:<b>{data.descrScelta}</b></span>}
                            {data.descrTono && <span>T:<b>{data.descrTono}</b></span>}
                            {data.descrCalibro && <span>C:<b>{data.descrCalibro}</b></span>}
                        </div>
                    )}
                </div>
            );
        }

        // For dropdown menu options, show full details in column
        return (
            <div style={{ display: 'flex', flexDirection: 'column', fontSize: '13px', padding: '4px 0', minHeight: '36px', justifyContent: 'center' }}>
                <div style={{ fontWeight: '500', marginBottom: '2px' }}>{label}</div>
                {hasCeramicData && (
                    <div style={{ fontSize: '11px', color: '#666', display: 'flex', gap: '10px', alignItems: 'center' }}>
                        {data.descrFormato && <span>F: <b style={{ color: '#333' }}>{data.descrFormato}</b></span>}
                        {data.descrScelta && <span>S: <b style={{ color: '#333' }}>{data.descrScelta}</b></span>}
                        {data.descrTono && <span>T: <b style={{ color: '#333' }}>{data.descrTono}</b></span>}
                        {data.descrCalibro && <span>C: <b style={{ color: '#333' }}>{data.descrCalibro}</b></span>}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="table-responsive">
            <table className="table table-hover table-items">
                <thead>
                    <tr>
                        <th style={{ width: '60px', textAlign: 'center' }}>Tipo</th>
                        <th>Descrizione / Articolo</th>
                        <th style={{ width: '80px' }}>Q.tà</th>
                        <th style={{ width: '80px' }}>U.M.</th>
                        <th style={{ width: '120px' }}>Prezzo</th>
                        <th style={{ width: '100px' }}>Sconto</th>
                        <th style={{ width: '100px' }}>IVA</th>
                        <th style={{ width: '120px' }}>Totale</th>
                        {showDownloadColumn && <th style={{ width: '60px', textAlign: 'center' }}>Scarica</th>}
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
                                <td colSpan={row.tipo === 'N' ? (showDownloadColumn ? 8 : 7) : 1}>
                                    {row.tipo === 'A' ? (
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
                                            }}
                                            isDisabled={readOnly}
                                        />
                                    ) : row.tipo === 'F' ? (
                                        <div className="flex-column gap-1">
                                            {isCeramica && (
                                                <div style={{ marginBottom: '5px' }}>
                                                    <AsyncSelect
                                                        isClearable
                                                        cacheOptions
                                                        loadOptions={loadArticoli}
                                                        formatOptionLabel={formatArticleOptionLabel}
                                                        styles={tableSelectStyles}
                                                        placeholder="Usa art. come base..."
                                                        noOptionsMessage={() => "Nessun risultato"}
                                                        loadingMessage={() => "Caricamento..."}
                                                        menuPortalTarget={document.body}
                                                        onChange={(opt) => {
                                                            if (opt) {
                                                                const a = opt.data;
                                                                onRowUpdate(idx, {
                                                                    fmDescrizione: a.descProdotto || '',
                                                                    fmScelta: a.descrScelta || '',
                                                                    fmTono: a.descrTono || '',
                                                                    fmTaglia: a.descrCalibro || '',
                                                                    prezzo: a.prezzo || 0,
                                                                    idUnitaMisura: a.idUnitaMisura,
                                                                    idAliquotaIva: a.idAliquotaIva
                                                                });
                                                            }
                                                        }}
                                                        isDisabled={readOnly}
                                                    />
                                                </div>
                                            )}
                                            <input type="text" className="form-control" value={row.fmDescrizione || ''} onChange={(e) => onRowChange(idx, 'fmDescrizione', e.target.value)} placeholder="Descrizione libera..." disabled={readOnly} />
                                            {isCeramica && (
                                                <div className="d-flex gap-2 mt-1">
                                                    <input type="text" className="form-control form-control-xs" value={row.fmScelta || ''} onChange={(e) => onRowChange(idx, 'fmScelta', e.target.value)} placeholder="Scelta" style={{ width: '33%' }} disabled={readOnly} />
                                                    <input type="text" className="form-control form-control-xs" value={row.fmTono || ''} onChange={(e) => onRowChange(idx, 'fmTono', e.target.value)} placeholder="Tono" style={{ width: '33%' }} disabled={readOnly} />
                                                    <input type="text" className="form-control form-control-xs" value={row.fmTaglia || ''} onChange={(e) => onRowChange(idx, 'fmTaglia', e.target.value)} placeholder="Cal." style={{ width: '33%' }} disabled={readOnly} />
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <input type="text" className="form-control" value={row.nota || row.fmDescrizione || row.descrizione || ''} onChange={(e) => onRowChange(idx, 'nota', e.target.value)} placeholder="Testo della nota..." disabled={readOnly} />
                                    )}
                                </td>

                                {row.tipo !== 'N' ? (
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
                                        {showDownloadColumn && (
                                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={row.scaricaMagazzino === true}
                                                    onChange={(e) => onRowChange(idx, 'scaricaMagazzino', e.target.checked)}
                                                    disabled={readOnly}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                />
                                            </td>
                                        )}
                                    </>
                                ) : null}
                                <td>
                                    {!readOnly && (
                                        <button className="btn-delete-row" onClick={() => onDeleteRow(idx)} tabIndex="-1">
                                            <FaTrash />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    {children && (
                        <tr className="row-add-actions">
                            <td colSpan={showDownloadColumn ? 10 : 9} style={{ padding: '0px' }}>
                                {children}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default DocumentRows;
