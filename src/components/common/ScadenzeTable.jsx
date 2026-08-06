import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaSyncAlt, FaExclamationTriangle, FaCalendarAlt, FaPlus, FaTrash, FaInfoCircle, FaWrench } from 'react-icons/fa';
import Swal from 'sweetalert2';
import TipiPagamentoService from '../../services/TipiPagamentoService';
import WrenchModalButton from '../WrenchModalButton';
import RisorseManagementModal from '../modals/RisorseManagementModal';
import './ScadenzeTable.css';

// Modalità verranno caricate dal backend

const ScadenzeTable = ({ 
    idTipoPagamento, 
    dataDocumento, 
    totaleDocumento, 
    scadenzeIniziali, 
    onScadenzeChange, 
    readOnly = false,
    isDisabled = false,
    conti = [],
    onRefreshConti = () => {}
}) => {
    const isActuallyReadOnly = readOnly || isDisabled;
    const [scadenze, setScadenze] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [modalitaList, setModalitaList] = useState([]);
    const [isManualMode, setIsManualMode] = useState(false);
    
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 1050);
    const initialScadenzeLoaded = useRef(false);
    const prevDeps = useRef({ id: null, tot: null, data: null });
    const scadenzeRef = useRef([]);

    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth <= 1050);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    // Keep scadenzeRef updated with current state
    useEffect(() => {
        scadenzeRef.current = scadenze;
    }, [scadenze]);

    useEffect(() => {
        const loadModalita = async () => {
            try {
                const res = await TipiPagamentoService.getModalitaSdi();
                if (res.data) setModalitaList(res.data);
            } catch (err) {
                console.error("Errore caricamento modalità SDI", err);
            }
        };
        loadModalita();
    }, []);

    useEffect(() => {
        if (!initialScadenzeLoaded.current && scadenzeIniziali && scadenzeIniziali.length > 0) {
            const roundedScadenze = scadenzeIniziali.map(s => ({
                ...s,
                importo: Math.round((s.importo + Number.EPSILON) * 100) / 100
            }));
            setScadenze(roundedScadenze);
            initialScadenzeLoaded.current = true;
            prevDeps.current = { id: idTipoPagamento, tot: totaleDocumento, data: dataDocumento };
        }
    }, [scadenzeIniziali, idTipoPagamento, totaleDocumento, dataDocumento]);

    const lastSentScadenzeRef = useRef(null);

    // Force updates parent component when local scadenze state changes
    useEffect(() => {
        if (onScadenzeChange) {
            const scadenzeJson = JSON.stringify(scadenze);
            if (lastSentScadenzeRef.current !== scadenzeJson) {
                onScadenzeChange(scadenze);
                lastSentScadenzeRef.current = scadenzeJson;
            }
        }
    }, [scadenze, onScadenzeChange]);

    const formatCurrency = (amount) => {
        if (amount == null) return '€ 0,00';
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatDateForInput = (dateString) => {
        if (!dateString) return '';
        if (dateString.includes('/')) {
            const [d, m, y] = dateString.split('/');
            return `${y}-${m}-${d}`;
        }
        return dateString;
    };

    const handleDateChange = (index, value) => {
        setIsManualMode(true);
        const newScadenze = [...scadenze];
        newScadenze[index].dtScadenza = value;
        setScadenze(newScadenze);
    };

    const handleImportoChange = (index, value) => {
        setIsManualMode(true);
        const newScadenze = [...scadenze];
        const val = parseFloat(value) || 0;
        newScadenze[index].importo = Math.round((val + Number.EPSILON) * 100) / 100;
        setScadenze(newScadenze);
    };

    const handleModalitaChange = (index, value) => {
        const newScadenze = [...scadenze];
        newScadenze[index].modalitaPagamento = value;
        setScadenze(newScadenze);
    };
    
    const handleSaldatoChange = (index, value) => {
        const newScadenze = [...scadenze];
        const isSaldato = value === 1;
        newScadenze[index].saldato = value;
        
        if (isSaldato) {
            // Default to today if not set
            if (!newScadenze[index].dtPagamento) {
                newScadenze[index].dtPagamento = new Date().toISOString().split('T')[0];
            }
            // Default to first resource or predefinita if not set
            if (!newScadenze[index].idRisorsa && conti.length > 0) {
                const predefinita = conti.find(c => c.predefinita === 1);
                newScadenze[index].idRisorsa = predefinita ? predefinita.id : conti[0].id;
            }
        } else {
            // Clear payment data if not settled
            newScadenze[index].dtPagamento = null;
            newScadenze[index].idRisorsa = null;
        }
        setScadenze(newScadenze);
    };

    const handleDataPagamentoChange = (index, value) => {
        const newScadenze = [...scadenze];
        newScadenze[index].dtPagamento = value;
        setScadenze(newScadenze);
    };

    const handleContoChange = (index, value) => {
        const newScadenze = [...scadenze];
        newScadenze[index].idRisorsa = parseInt(value) || null;
        setScadenze(newScadenze);
    };

    const addScadenza = () => {
        setIsManualMode(true);
        const newScadenza = {
            dtScadenza: dataDocumento || new Date().toISOString().split('T')[0],
            importo: 0,
            importoSpeseIncasso: 0,
            modalitaPagamento: 'MP05' // Default Bonifico
        };
        setScadenze([...scadenze, newScadenza]);
    };

    const deleteScadenza = (index) => {
        setIsManualMode(true);
        const newScadenze = scadenze.filter((_, i) => i !== index);
        setScadenze(newScadenze);
    };

    const calcolaScadenze = useCallback(async (isManualTrigger = false) => {
        if (!idTipoPagamento || !dataDocumento || totaleDocumento == null || totaleDocumento === 0) {
            setScadenze([]);
            if (isManualTrigger) {
                setIsManualMode(false);
                if (!idTipoPagamento) Swal.fire('Attenzione', 'Selezionare prima un tipo di pagamento.', 'warning');
                else if (!dataDocumento) Swal.fire('Attenzione', 'Manca la data del documento.', 'warning');
                else Swal.fire('Attenzione', 'Totale documento mancante o pari a zero.', 'warning');
            }
            return;
        }

        setIsLoading(true);
        try {
            // Smart logic: preserve paid scadenze
            const currentScadenze = scadenzeRef.current || [];
            const paidScadenze = currentScadenze.filter(s => s.saldato === 1);
            const totalPaid = paidScadenze.reduce((acc, s) => acc + (s.importo || 0), 0);
            
            let finalScadenze = [];
            
            if (paidScadenze.length > 0) {
                const amountToSchedule = Math.round((totaleDocumento - totalPaid + Number.EPSILON) * 100) / 100;
                
                if (amountToSchedule > 0) {
                    const response = await TipiPagamentoService.getScadenzeDocumento(idTipoPagamento, dataDocumento, amountToSchedule);
                    if (response.data) {
                        const newScadenze = response.data.map(s => ({
                            ...s,
                            importo: Math.round((s.importo + Number.EPSILON) * 100) / 100
                        }));
                        finalScadenze = [...paidScadenze, ...newScadenze];
                    }
                } else {
                    // Total already covered (or exceeded) by paid scadenze
                    finalScadenze = paidScadenze;
                }
            } else {
                // No paid scadenze, proceed as usual
                const response = await TipiPagamentoService.getScadenzeDocumento(idTipoPagamento, dataDocumento, totaleDocumento);
                if (response.data) {
                    finalScadenze = response.data.map(s => ({
                        ...s,
                        importo: Math.round((s.importo + Number.EPSILON) * 100) / 100
                    }));
                }
            }

            setScadenze(finalScadenze);
            if (isManualTrigger) setIsManualMode(false);
        } catch (error) {
            console.error("Errore nel calcolo delle scadenze", error);
            if (isManualTrigger) {
                Swal.fire('Errore', 'Impossibile calcolare le scadenze. Riprovare.', 'error');
            }
        } finally {
            setIsLoading(false);
        }
    }, [idTipoPagamento, dataDocumento, totaleDocumento]);

    // Auto-recalculation
    useEffect(() => {
        const idChanged = prevDeps.current.id !== idTipoPagamento;
        const totChanged = prevDeps.current.tot !== totaleDocumento;
        const dataChanged = prevDeps.current.data !== dataDocumento;

        if (idChanged || totChanged || dataChanged) {
            prevDeps.current = { id: idTipoPagamento, tot: totaleDocumento, data: dataDocumento };
            
            if (!initialScadenzeLoaded.current && scadenzeIniziali && scadenzeIniziali.length > 0) {
                return;
            }

            // Don't auto-recalculate if user has manual edits
            if (isManualMode && (totChanged || dataChanged)) {
                return;
            }

            if (idTipoPagamento && totaleDocumento > 0) {
                const timer = setTimeout(() => {
                    calcolaScadenze(false);
                }, 500);
                return () => clearTimeout(timer);
            } else if (!initialScadenzeLoaded.current) {
                setScadenze([]);
            }
        }
    }, [idTipoPagamento, totaleDocumento, dataDocumento, calcolaScadenze, scadenzeIniziali, isManualMode]);

    const sumScadenze = scadenze.reduce((acc, s) => acc + (s.importo || 0), 0);
    const difference = parseFloat((sumScadenze - totaleDocumento).toFixed(2));
    const totaleComplessivo = scadenze.reduce((acc, s) => acc + (s.importo || 0) + (s.importoSpeseIncasso || 0), 0);

    if (isMobile) {
        return (
            <div className="scadenze-container mt-3">
                <div className="scadenze-header">
                    <h6 className="m-0 text-primary" style={{ fontWeight: '600', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        <FaCalendarAlt style={{ color: '#007bff' }} />
                        <span>Piano di Pagamento</span>
                    </h6>
                    <div className="d-flex align-items-center">
                        {!isActuallyReadOnly && (
                            <>
                                <button type="button" className="btn-premium-add" onClick={addScadenza}>
                                    <FaPlus /> Aggiungi riga
                                </button>
                                <button type="button" className="btn-premium-sync" style={{ marginLeft: '10px' }}
                                    onClick={() => calcolaScadenze(true)} disabled={isLoading || !idTipoPagamento}>
                                    <FaSyncAlt className={isLoading ? 'fa-spin' : ''} /> Ricalcola
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {scadenze.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <FaExclamationTriangle className="text-warning" />
                        <span>{idTipoPagamento ? "Nessuna scadenza. Aggiungine una o ricalcola." : "Seleziona un tipo di pagamento per visualizzare le scadenze."}</span>
                    </div>
                ) : (
                    scadenze.map((s, index) => (
                        <div key={s.id || index} style={{
                            background: s.saldato === 1 ? '#f0fdf4' : '#fff',
                            border: `1px solid ${s.saldato === 1 ? '#86efac' : '#e5e7eb'}`,
                            borderRadius: '10px',
                            padding: '12px 14px',
                            marginBottom: '10px',
                        }}>
                            {/* Header: saldato + data scadenza + importo + elimina */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                <input autoComplete="off" type="checkbox" className="custom-checkbox"
                                    checked={s.saldato === 1}
                                    onChange={(e) => handleSaldatoChange(index, e.target.checked ? 1 : 0)}
                                    disabled={isActuallyReadOnly}
                                    title="Saldato"
                                />
                                {isActuallyReadOnly ? (
                                    <span style={{ fontWeight: 700, color: '#333', fontSize: '14px' }}>{s.dtScadenza}</span>
                                ) : (
                                    <input autoComplete="off" type="date" className="form-control form-control-sm"
                                        style={{ flex: '0 0 auto', width: 'auto' }}
                                        value={formatDateForInput(s.dtScadenza)}
                                        onChange={(e) => handleDateChange(index, e.target.value)}
                                    />
                                )}
                                <div style={{ flex: 1 }} />
                                {isActuallyReadOnly ? (
                                    <span style={{ fontWeight: 700, color: '#17a2b8', fontSize: '15px', whiteSpace: 'nowrap' }}>{formatCurrency(s.importo)}</span>
                                ) : (
                                    <input autoComplete="off" type="number" step="0.01" className="form-control form-control-sm text-right"
                                        style={{ color: '#17a2b8', fontWeight: 700, width: '90px', flexShrink: 0 }}
                                        value={s.importo != null ? Math.round((s.importo + Number.EPSILON) * 100) / 100 : ''}
                                        onChange={(e) => handleImportoChange(index, e.target.value)}
                                    />
                                )}
                                {!isActuallyReadOnly && (
                                    <button type="button" className="btn btn-link text-danger p-0" style={{ flexShrink: 0 }}
                                        onClick={() => deleteScadenza(index)} title="Elimina">
                                        <FaTrash />
                                    </button>
                                )}
                            </div>

                            {/* Modalità Pagamento */}
                            <div style={{ marginBottom: s.saldato === 1 ? '10px' : 0 }}>
                                <label style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '3px', display: 'block', fontWeight: 600 }}>Mod. Pagamento</label>
                                {isActuallyReadOnly ? (
                                    <span style={{ fontSize: '13px', padding: '4px 8px', color: '#495057', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px', display: 'inline-block' }}>
                                        {s.modalitaPagamento || '-'}
                                    </span>
                                ) : (
                                    <select autoComplete="off" className="form-control form-control-sm"
                                        value={s.modalitaPagamento || 'MP01'}
                                        onChange={(e) => handleModalitaChange(index, e.target.value)}>
                                        {modalitaList.map(m => (
                                            <option key={m.codiceSdi} value={m.codiceSdi}>{m.descrizione}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Data Pagamento + Conto (solo se saldato) */}
                            {s.saldato === 1 && (
                                <div style={{ borderTop: '1px solid #d1fae5', paddingTop: '10px', display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: '0 0 auto' }}>
                                        <label style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '3px', display: 'block', fontWeight: 600 }}>Data Pag.</label>
                                        <input autoComplete="off" type="date" className="form-control form-control-sm"
                                            value={formatDateForInput(s.dtPagamento)}
                                            onChange={(e) => handleDataPagamentoChange(index, e.target.value)}
                                            disabled={isActuallyReadOnly}
                                        />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <label style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '3px', display: 'block', fontWeight: 600 }}>Conto</label>
                                        <div className="flex-input-group">
                                            <select autoComplete="off" className="form-control form-control-sm"
                                                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, borderRight: 0 }}
                                                value={s.idRisorsa || ''}
                                                onChange={(e) => handleContoChange(index, e.target.value)}
                                                disabled={isActuallyReadOnly}>
                                                <option value="">Conto...</option>
                                                {conti.map(c => (
                                                    <option key={c.id} value={c.id}>{c.descrizione}</option>
                                                ))}
                                            </select>
                                            {!isActuallyReadOnly && (
                                                <WrenchModalButton
                                                    ModalComponent={RisorseManagementModal}
                                                    modalProps={{ initialTipologia: 'BA' }}
                                                    title="Gestione Conti"
                                                    onClose={onRefreshConti}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}

                {/* Footer mobile */}
                <div style={{ borderTop: '2px solid #ebedf2', paddingTop: '12px', marginTop: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 2px 8px' }}>
                        <span style={{ color: '#555', fontWeight: 600 }}>Subtotale:</span>
                        <span style={{ fontWeight: 700, color: difference !== 0 ? '#dc3545' : '#28a745' }}>{formatCurrency(sumScadenze)}</span>
                    </div>
                    {difference !== 0 && (
                        <div style={{ background: '#fff8f8', borderRadius: '8px', padding: '8px 12px', marginBottom: '8px', border: '1px solid #ffe0e0' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <span style={{ color: '#dc3545', fontWeight: 600, fontSize: '13px' }}>Differenza (Abbuono/Magg.):</span>
                                <span style={{ color: '#dc3545', fontWeight: 700 }}>{formatCurrency(difference)}</span>
                            </div>
                            <div style={{ fontSize: '12px', color: '#dc3545', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <FaInfoCircle style={{ flexShrink: 0 }} />
                                <span>{difference > 0 ? "La somma delle rate supera l'importo da incassare (Maggiorazione)." : "La somma delle rate è inferiore all'importo da incassare (Sconto/Abbuono)."}</span>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0f4f8', borderRadius: '8px', padding: '10px 14px' }}>
                        <span style={{ fontWeight: 700, color: '#333', fontSize: '14px' }}>TOTALE COMPLESSIVO:</span>
                        <span style={{ fontWeight: 700, color: '#0056b3', fontSize: '18px' }}>{formatCurrency(totaleComplessivo)}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="scadenze-container mt-3">
            <div className="scadenze-header">
                <h6 className="m-0 text-primary" style={{ fontWeight: '600', fontSize: '15px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <FaCalendarAlt style={{ color: '#007bff' }} /> 
                    <span>Piano di Pagamento</span>
                </h6>
                <div className="d-flex align-items-center">
                    {!isActuallyReadOnly && (
                        <>
                            <button 
                                type="button" 
                                className="btn-premium-add" 
                                onClick={addScadenza}
                                title="Aggiungi una nuova scadenza manuale"
                            >
                                <FaPlus /> Aggiungi riga
                            </button>
                            <button 
                                type="button" 
                                className="btn-premium-sync" 
                                style={{ marginLeft: '15px' }}
                                onClick={() => calcolaScadenze(true)}
                                disabled={isLoading || !idTipoPagamento}
                                title="Forza il ricalcolo delle scadenze"
                            >
                                <FaSyncAlt className={isLoading ? 'fa-spin' : ''} /> Ricalcola
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="table-responsive scadenze-table-wrapper">
                <table className="table mb-0 table-hover" style={{ backgroundColor: '#fff', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f9f9fa', color: '#6c757d', fontSize: '12px', textTransform: 'uppercase' }}>
                        <tr>
                            <th className="col-saldato font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Saldato</th>
                            <th className="col-data-scadenza text-center font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Data Scadenza</th>
                            <th className="col-importo-rata text-right font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Importo Rata</th>
                            <th className="col-mod-pag text-center font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Mod. Pag.</th>
                            <th className="col-data-pag-conto text-center font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Data Pag. / Conto</th>
                            {!isActuallyReadOnly && <th className="text-center font-weight-normal" style={{ borderBottom: 'none', padding: '12px', width: '50px' }}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {scadenze.length > 0 ? (
                            scadenze.map((s, index) => (
                                <tr key={s.id || index} className={`scadenze-row ${s.saldato === 1 ? 'row-saldato' : ''}`}>
                                    <td className="text-center align-middle">
                                        <input autoComplete="off" 
                                            type="checkbox" 
                                            className="custom-checkbox"
                                            checked={s.saldato === 1}
                                            onChange={(e) => handleSaldatoChange(index, e.target.checked ? 1 : 0)}
                                            disabled={isActuallyReadOnly}
                                        />
                                    </td>
                                    <td className="text-center align-middle">
                                        {isActuallyReadOnly ? (
                                            <span className="font-weight-bold" style={{ color: '#333' }}>{s.dtScadenza}</span>
                                        ) : (
                                            <input autoComplete="off" 
                                                type="date" 
                                                className="form-control form-control-sm text-center" 
                                                value={formatDateForInput(s.dtScadenza)} 
                                                onChange={(e) => handleDateChange(index, e.target.value)}
                                            />
                                        )}
                                    </td>
                                    <td className="text-right align-middle">
                                        {isActuallyReadOnly ? (
                                            <span style={{ fontWeight: '600', color: '#17a2b8' }}>{formatCurrency(s.importo)}</span>
                                        ) : (
                                            <input autoComplete="off" 
                                                type="number" 
                                                step="0.01" 
                                                className="form-control form-control-sm text-right font-weight-bold" 
                                                style={{ color: '#17a2b8' }}
                                                value={s.importo != null ? Math.round((s.importo + Number.EPSILON) * 100) / 100 : ''} 
                                                onChange={(e) => handleImportoChange(index, e.target.value)}
                                            />
                                        )}
                                    </td>
                                    <td className="text-center align-middle">
                                        {isActuallyReadOnly ? (
                                            <span style={{ fontSize: '12px', padding: '3px 6px', color: '#495057', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '4px' }}>
                                                {s.modalitaPagamento || '-'}
                                            </span>
                                        ) : (
                                            <select autoComplete="off" 
                                                className="form-control form-control-sm"
                                                value={s.modalitaPagamento || 'MP01'}
                                                onChange={(e) => handleModalitaChange(index, e.target.value)}
                                            >
                                                {modalitaList.map(m => (
                                                    <option key={m.codiceSdi} value={m.codiceSdi}>{m.descrizione}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    <td className="align-middle">
                                        {s.saldato === 1 && (
                                            <div className="payment-inputs-group">
                                                <input autoComplete="off" 
                                                    type="date" 
                                                    className="form-control form-control-sm" 
                                                    style={{ width: '135px', flexShrink: 0 }}
                                                    value={formatDateForInput(s.dtPagamento)} 
                                                    onChange={(e) => handleDataPagamentoChange(index, e.target.value)}
                                                    disabled={isActuallyReadOnly}
                                                />
                                                <div className="flex-input-group" style={{ flex: 1, minWidth: 0 }}>
                                                    <select
autoComplete="off"                                                         className="form-control form-control-sm"
                                                        style={{ 
                                                            borderTopRightRadius: 0, 
                                                            borderBottomRightRadius: 0,
                                                            borderRight: 0 
                                                        }}
                                                        value={s.idRisorsa || ''}
                                                        onChange={(e) => handleContoChange(index, e.target.value)}
                                                        disabled={isActuallyReadOnly}
                                                    >
                                                        <option value="">Conto...</option>
                                                        {conti.map(c => (
                                                            <option key={c.id} value={c.id}>{c.descrizione}</option>
                                                        ))}
                                                    </select>
                                                    {!isActuallyReadOnly && (
                                                        <WrenchModalButton
                                                            ModalComponent={RisorseManagementModal}
                                                            modalProps={{ initialTipologia: 'BA' }}
                                                            title="Gestione Conti"
                                                            onClose={onRefreshConti}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    {!isActuallyReadOnly && (
                                        <td className="text-center align-middle">
                                            <button type="button" className="btn btn-link text-danger p-0" onClick={() => deleteScadenza(index)} title="Elimina riga">
                                                <FaTrash />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={isActuallyReadOnly ? 4 : 5} className="text-center text-muted py-4">
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', verticalAlign: 'middle', justifyContent: 'center' }}>
                                        <FaExclamationTriangle className="text-warning" style={{ fontSize: '18px', flexShrink: 0 }} />
                                        <span>
                                            {idTipoPagamento 
                                                ? "Nessuna scadenza. Aggiungine una o ricalcola." 
                                                : "Seleziona un tipo di pagamento per visualizzare le scadenze."}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot style={{ borderTop: '2px solid #ebedf2', backgroundColor: '#fdfdfe' }}>
                        <tr style={{ borderBottom: '1px solid #ebedf2' }}>
                            <td colSpan="2" className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: '#555' }}>Subtotale:</td>
                            <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: difference !== 0 ? '#dc3545' : '#28a745' }}>
                                {formatCurrency(sumScadenze)}
                            </td>
                            <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: '#6c757d' }}>
                                {formatCurrency(scadenze.reduce((acc, s) => acc + (s.importoSpeseIncasso || 0), 0))}
                            </td>
                            <td colSpan={isActuallyReadOnly ? 1 : 2}></td>
                        </tr>
                        {difference !== 0 && (
                            <tr className="difference-alert-row" style={{ borderBottom: '1px solid #ebedf2' }}>
                                <td colSpan="2" className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: '#dc3545' }}>Differenza (Abbuono/Magg.):</td>
                                <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px' }}>
                                    <span className="difference-indicator">{formatCurrency(difference)}</span>
                                </td>
                                <td colSpan={isActuallyReadOnly ? 2 : 3} className="px-3">
                                    <span className="difference-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                        <FaInfoCircle style={{ fontSize: '14px', flexShrink: 0 }} /> 
                                        <span>
                                            {difference > 0 ? "La somma delle rate supera l'importo da incassare (Maggiorazione)." : "La somma delle rate è inferiore all'importo da incassare (Sconto/Abbuono)."}
                                        </span>
                                    </span>
                                </td>
                            </tr>
                        )}
                        <tr style={{ backgroundColor: '#f0f4f8' }}>
                            <td colSpan="2" className="text-right align-middle font-weight-bold" style={{ padding: '12px', color: '#333', fontSize: '15px', whiteSpace: 'nowrap' }}>TOTALE COMPLESSIVO:</td>
                            <td className="text-center align-middle font-weight-bold" style={{ padding: '12px', color: '#0056b3', fontSize: '18px' }}>
                                {formatCurrency(scadenze.reduce((acc, s) => acc + (s.importo || 0) + (s.importoSpeseIncasso || 0), 0))}
                            </td>
                            <td colSpan={isActuallyReadOnly ? 2 : 3}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ScadenzeTable;
