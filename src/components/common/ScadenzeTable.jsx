import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaSyncAlt, FaExclamationTriangle, FaCalendarAlt } from 'react-icons/fa';
import Swal from 'sweetalert2';
import TipiPagamentoService from '../../services/TipiPagamentoService';

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
            setScadenze(scadenzeIniziali);
            initialScadenzeLoaded.current = true;
            prevDeps.current = { id: idTipoPagamento, tot: totaleDocumento, data: dataDocumento };
        }
    }, [scadenzeIniziali, idTipoPagamento, totaleDocumento, dataDocumento]);

    // Force updates parent component when local scadenze state changes
    useEffect(() => {
        if (onScadenzeChange) {
            onScadenzeChange(scadenze);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [scadenze]);

    const formatCurrency = (amount) => {
        if (amount == null) return '€ 0,00';
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        if (dateString.includes('-')) {
            const [y, m, d] = dateString.split('-');
            return `${d}/${m}/${y}`;
        }
        return dateString;
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
                setScadenze(response.data);
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
            
            // Skip auto calculation on first render if we are waiting for scadenzeIniziali
            if (!initialScadenzeLoaded.current && scadenzeIniziali && scadenzeIniziali.length > 0) {
                return;
            }

            if (idTipoPagamento && totaleDocumento > 0) {
                const timer = setTimeout(() => {
                    calcolaScadenze(false);
                }, 500); // 500ms debounce
                return () => clearTimeout(timer);
            } else {
                setScadenze([]);
            }
        }
    }, [idTipoPagamento, totaleDocumento, dataDocumento, calcolaScadenze, scadenzeIniziali]);

    return (
        <div className="scadenze-container mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="m-0 text-primary" style={{ fontWeight: '600', fontSize: '15px' }}>
                    <FaCalendarAlt className="mr-2" style={{ color: '#007bff' }} /> 
                    Piano di Pagamento
                </h6>
                {!readOnly && (
                    <button 
                        type="button" 
                        className="btn btn-sm btn-light" 
                        style={{ border: '1px solid #ced4da', borderRadius: '4px', fontSize: '13px', fontWeight: '500', color: '#495057' }}
                        onClick={() => calcolaScadenze(true)}
                        disabled={isLoading || !idTipoPagamento}
                        title="Forza il ricalcolo delle scadenze"
                    >
                        <FaSyncAlt className={isLoading ? 'fa-spin mr-1' : 'mr-1'} /> Ricalcola
                    </button>
                )}
            </div>

            <div className="table-responsive" style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #ebedf2' }}>
                <table className="table mb-0 table-hover" style={{ backgroundColor: '#fff', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f9f9fa', color: '#6c757d', fontSize: '12px', textTransform: 'uppercase' }}>
                        <tr>
                            <th className="text-center font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Data Scadenza</th>
                            <th className="text-right font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Importo Rata</th>
                            <th className="text-right font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Spese Incasso</th>
                            <th className="text-center font-weight-normal" style={{ borderBottom: 'none', padding: '12px' }}>Mod. Pag.</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scadenze.length > 0 ? (
                            scadenze.map((s, index) => (
                                <tr key={s.id || index}>
                                    <td className="text-center align-middle font-weight-bold" style={{ color: '#333' }}>
                                        {formatDate(s.dtScadenza)}
                                    </td>
                                    <td className="text-right align-middle" style={{ fontWeight: '600', color: '#17a2b8' }}>
                                        {formatCurrency(s.importo)}
                                    </td>
                                    <td className="text-right align-middle text-muted" style={{ fontStyle: s.importoSpeseIncasso > 0 ? 'normal' : 'italic' }}>
                                        {s.importoSpeseIncasso > 0 ? formatCurrency(s.importoSpeseIncasso) : '-'}
                                    </td>
                                    <td className="text-center align-middle">
                                        <span style={{ fontSize: '13px', padding: '4px 8px', color: '#495057', backgroundColor: '#e9ecef', border: '1px solid #ced4da', borderRadius: '4px', fontWeight: '500', display: 'inline-block' }}>
                                            {s.modalitaPagamento || '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted py-4">
                                    <FaExclamationTriangle className="text-warning mr-2 mb-1" style={{ fontSize: '16px' }} />
                                    {idTipoPagamento 
                                        ? "Dati scadenze non disponibili. Assicurati che il totale sia maggiore di zero." 
                                        : "Seleziona un tipo di pagamento per visualizzare le scadenze."}
                                </td>
                            </tr>
                        )}
                    </tbody>
                        <tfoot style={{ borderTop: '2px solid #ebedf2', backgroundColor: '#fdfdfe' }}>
                            <tr style={{ borderBottom: '1px solid #ebedf2' }}>
                                <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: '#555' }}>Subtotale:</td>
                                <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: '#28a745' }}>
                                    {formatCurrency(scadenze.reduce((acc, s) => acc + (s.importo || 0), 0))}
                                </td>
                                <td className="text-right align-middle font-weight-bold" style={{ padding: '8px 12px', color: '#6c757d' }}>
                                    {formatCurrency(scadenze.reduce((acc, s) => acc + (s.importoSpeseIncasso || 0), 0))}
                                </td>
                                <td></td>
                            </tr>
                            <tr style={{ backgroundColor: '#f0f4f8' }}>
                                <td className="text-right align-middle font-weight-bold" style={{ padding: '12px', color: '#333', fontSize: '15px' }}>TOTALE COMPLESSIVO:</td>
                                <td colSpan="2" className="text-center align-middle font-weight-bold" style={{ padding: '12px', color: '#0056b3', fontSize: '18px' }}>
                                    {formatCurrency(scadenze.reduce((acc, s) => acc + (s.importo || 0) + (s.importoSpeseIncasso || 0), 0))}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                </table>
            </div>
        </div>
    );
};

export default ScadenzeTable;
