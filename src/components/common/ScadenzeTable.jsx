import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaSyncAlt, FaExclamationTriangle, FaCalendarAlt, FaPlus, FaTrash, FaInfoCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import TipiPagamentoService from '../../services/TipiPagamentoService';
import './ScadenzeTable.css';

const MODALITA_PAGAMENTO = [
    { value: 'CONTANTI', label: 'Contanti' },
    { value: 'ASSEGNO', label: 'Assegno' },
    { value: 'ASSEGNO_CIRCOLARE', label: 'Assegno circolare' },
    { value: 'BONIFICO', label: 'Bonifico' },
    { value: 'RIBA', label: 'Riba' },
    { value: 'MAV', label: 'MAV' },
    { value: 'RID', label: 'RID' },
    { value: 'CARTA_CREDITO', label: 'Carta di credito' },
    { value: 'BOLLETTINO_POSTA', label: 'Bollettino postale' },
];

const ScadenzeTable = ({ 
    idTipoPagamento, 
    dataDocumento, 
    totaleDocumento, 
    scadenzeIniziali, 
    onScadenzeChange, 
    readOnly = false 
}) => {
    const [scadenze, setScadenze] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    
    const initialScadenzeLoaded = useRef(false);
    const prevDeps = useRef({ id: null, tot: null, data: null });

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
        const newScadenze = [...scadenze];
        newScadenze[index].dtScadenza = value;
        setScadenze(newScadenze);
    };

    const handleImportoChange = (index, value) => {
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

    const addScadenza = () => {
        const newScadenza = {
            dtScadenza: dataDocumento || new Date().toISOString().split('T')[0],
            importo: 0,
            importoSpeseIncasso: 0,
            modalitaPagamento: 'BONIFICO'
        };
        setScadenze([...scadenze, newScadenza]);
    };

    const deleteScadenza = (index) => {
        const newScadenze = scadenze.filter((_, i) => i !== index);
        setScadenze(newScadenze);
    };

    const calcolaScadenze = useCallback(async (isManualTrigger = false) => {
        if (!idTipoPagamento || !dataDocumento || totaleDocumento == null || totaleDocumento === 0) {
            setScadenze([]);
            if (isManualTrigger) {
                if (!idTipoPagamento) Swal.fire('Attenzione', 'Selezionare prima un tipo di pagamento.', 'warning');
                else if (!dataDocumento) Swal.fire('Attenzione', 'Manca la data del documento.', 'warning');
                else Swal.fire('Attenzione', 'Totale documento mancante o pari a zero.', 'warning');
            }
            return;
        }

        setIsLoading(true);
        try {
            const response = await TipiPagamentoService.getScadenzeDocumento(idTipoPagamento, dataDocumento, totaleDocumento);
            if (response.data) {
                const rounded = response.data.map(s => ({
                    ...s,
                    importo: Math.round((s.importo + Number.EPSILON) * 100) / 100
                }));
                setScadenze(rounded);
            }
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

            if (idTipoPagamento && totaleDocumento > 0) {
                const timer = setTimeout(() => {
                    calcolaScadenze(false);
                }, 500);
                return () => clearTimeout(timer);
            } else if (!initialScadenzeLoaded.current) {
                setScadenze([]);
            }
        }
    }, [idTipoPagamento, totaleDocumento, dataDocumento, calcolaScadenze, scadenzeIniziali]);

    const sumScadenze = scadenze.reduce((acc, s) => acc + (s.importo || 0), 0);
    const difference = parseFloat((sumScadenze - totaleDocumento).toFixed(2));

    return (
        <div className="scadenze-container mt-3">
            <div className="scadenze-header">
                <h6 className="m-0 text-primary" style={{ fontWeight: '600', fontSize: '15px' }}>
                    <FaCalendarAlt className="mr-2" style={{ color: '#007bff' }} /> 
                    Piano di Pagamento
                </h6>
                <div className="d-flex align-items-center">
                    {!readOnly && (
                        <>
                            <button 
                                type="button" 
                                className="btn-premium-add" 
                                onClick={addScadenza}
                                title="Aggiungi una nuova scadenza manuale"
                            >
                                <FaPlus className="mr-2" /> Aggiungi riga
                            </button>
                            <button 
                                type="button" 
                                className="btn-premium-sync" 
                                style={{ marginLeft: '15px' }}
                                onClick={() => calcolaScadenze(true)}
                                disabled={isLoading || !idTipoPagamento}
                                title="Forza il ricalcolo delle scadenze"
                            >
                                <FaSyncAlt className={isLoading ? 'fa-spin mr-2' : 'mr-2'} /> Ricalcola
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="table-responsive scadenze-table-wrapper">
                <table className="table mb-0 table-hover" style={{ backgroundColor: '#fff', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f9f9fa', color: '#6c757d', fontSize: '12px', textTransform: 'uppercase' }}>
                        <tr>
                            <th className="text-center font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Data Scadenza</th>
                            <th className="text-right font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Importo Rata</th>
                            <th className="text-right font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Spese Incasso</th>
                            <th className="text-center font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Mod. Pag.</th>
                            {!readOnly && <th className="text-center font-weight-normal" style={{ borderBottom: 'none', padding: '12px', width: '50px' }}></th>}
                        </tr>
                    </thead>
                    <tbody>
                        {scadenze.length > 0 ? (
                            scadenze.map((s, index) => (
                                <tr key={s.id || index} className="scadenze-row">
                                    <td className="text-center align-middle">
                                        {readOnly ? (
                                            <span className="font-weight-bold" style={{ color: '#333' }}>{s.dtScadenza}</span>
                                        ) : (
                                            <input 
                                                type="date" 
                                                className="form-control form-control-sm text-center" 
                                                value={formatDateForInput(s.dtScadenza)} 
                                                onChange={(e) => handleDateChange(index, e.target.value)}
                                            />
                                        )}
                                    </td>
                                    <td className="text-right align-middle">
                                        {readOnly ? (
                                            <span style={{ fontWeight: '600', color: '#17a2b8' }}>{formatCurrency(s.importo)}</span>
                                        ) : (
                                            <input 
                                                type="number" 
                                                step="0.01" 
                                                className="form-control form-control-sm text-right font-weight-bold" 
                                                style={{ color: '#17a2b8' }}
                                                value={s.importo != null ? Math.round((s.importo + Number.EPSILON) * 100) / 100 : ''} 
                                                onChange={(e) => handleImportoChange(index, e.target.value)}
                                            />
                                        )}
                                    </td>
                                    <td className="text-right align-middle text-muted">
                                        {formatCurrency(s.importoSpeseIncasso || 0)}
                                    </td>
                                    <td className="text-center align-middle">
                                        {readOnly ? (
                                            <span style={{ fontSize: '13px', padding: '4px 8px', color: '#495057', backgroundColor: '#e9ecef', border: '1px solid #ced4da', borderRadius: '4px', fontWeight: '500' }}>
                                                {s.modalitaPagamento || '-'}
                                            </span>
                                        ) : (
                                            <select 
                                                className="form-control form-control-sm"
                                                value={s.modalitaPagamento || 'BONIFICO'}
                                                onChange={(e) => handleModalitaChange(index, e.target.value)}
                                            >
                                                {MODALITA_PAGAMENTO.map(m => (
                                                    <option key={m.value} value={m.value}>{m.label}</option>
                                                ))}
                                            </select>
                                        )}
                                    </td>
                                    {!readOnly && (
                                        <td className="text-center align-middle">
                                            <button type="button" className="btn btn-link text-danger p-0" onClick={() => deleteScadenza(index)}>
                                                <FaTrash />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={readOnly ? 4 : 5} className="text-center text-muted py-4">
                                    <FaExclamationTriangle className="text-warning mr-2 mb-1" style={{ fontSize: '16px' }} />
                                    {idTipoPagamento 
                                        ? "Nessuna scadenza. Aggiungine una o ricalcola." 
                                        : "Seleziona un tipo di pagamento per visualizzare le scadenze."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot style={{ borderTop: '2px solid #ebedf2', backgroundColor: '#fdfdfe' }}>
                        <tr style={{ borderBottom: '1px solid #ebedf2' }}>
                            <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: '#555' }}>Subtotale:</td>
                            <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: difference !== 0 ? '#dc3545' : '#28a745' }}>
                                {formatCurrency(sumScadenze)}
                            </td>
                            <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: '#6c757d' }}>
                                {formatCurrency(scadenze.reduce((acc, s) => acc + (s.importoSpeseIncasso || 0), 0))}
                            </td>
                            <td colSpan={readOnly ? 1 : 2}></td>
                        </tr>
                        {difference !== 0 && (
                            <tr className="difference-alert-row" style={{ borderBottom: '1px solid #ebedf2' }}>
                                <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: '#dc3545' }}>Differenza (Abbuono/Magg.):</td>
                                <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px' }}>
                                    <span className="difference-indicator">{formatCurrency(difference)}</span>
                                </td>
                                <td colSpan={readOnly ? 2 : 3} className="px-3">
                                    <span className="difference-text">
                                        <FaInfoCircle className="mr-2" /> 
                                        {difference > 0 ? "La somma delle rate supera l'importo da incassare (Maggiorazione)." : "La somma delle rate è inferiore all'importo da incassare (Sconto/Abbuono)."}
                                    </span>
                                </td>
                            </tr>
                        )}
                        <tr style={{ backgroundColor: '#f0f4f8' }}>
                            <td className="text-right align-middle font-weight-bold" style={{ padding: '12px', color: '#333', fontSize: '15px' }}>TOTALE COMPLESSIVO:</td>
                            <td colSpan="2" className="text-center align-middle font-weight-bold" style={{ padding: '12px', color: '#0056b3', fontSize: '18px' }}>
                                {formatCurrency(scadenze.reduce((acc, s) => acc + (s.importo || 0) + (s.importoSpeseIncasso || 0), 0))}
                            </td>
                            <td colSpan={readOnly ? 1 : 2}></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ScadenzeTable;
