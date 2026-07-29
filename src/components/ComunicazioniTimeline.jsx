import React, { useState, useEffect } from 'react';
import { FaEnvelopeOpenText, FaCheck, FaExclamation } from 'react-icons/fa';
import ScadenzarioPromemoriaService from '../services/ScadenzarioPromemoriaService';
import './modals/ComunicazioniDocumentoModal.css';

const formatMoney = (v) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(v || 0);

const SERVICE_BY_TIPO = {
    fattura: ScadenzarioPromemoriaService.getInviiByFattura,
    fatturaFornitore: ScadenzarioPromemoriaService.getInviiByFatturaFornitore,
    cliente: ScadenzarioPromemoriaService.getInviiByCliente,
};

/**
 * Timeline delle comunicazioni automatiche (solleciti/promemoria) inviate.
 * tipo: 'fattura' | 'fatturaFornitore' | 'cliente' (storico su tutti i documenti del cliente)
 * Componente "nudo" (senza overlay/modale): utilizzabile sia dentro un modale che come tab-pane.
 */
const ComunicazioniTimeline = ({ idDocumento, tipo = 'fattura' }) => {
    const [lista, setLista] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!idDocumento) return;
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            try {
                const fn = SERVICE_BY_TIPO[tipo] || SERVICE_BY_TIPO.fattura;
                const res = await fn(idDocumento);
                if (!cancelled) setLista(res.data || []);
            } catch {
                if (!cancelled) setLista([]);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [idDocumento, tipo]);

    if (loading) {
        return <div className="cdt-empty"><p>Caricamento...</p></div>;
    }

    if (lista.length === 0) {
        return (
            <div className="cdt-empty">
                <FaEnvelopeOpenText className="cdt-empty-icon" />
                <p>Nessuna comunicazione inviata finora {tipo === 'cliente' ? 'a questo cliente' : 'per questo documento'}.</p>
                <span className="cdt-empty-hint">Le comunicazioni compaiono qui non appena una regola di sollecito viene eseguita.</span>
            </div>
        );
    }

    return (
        <ol className="cdt-timeline">
            {lista.map((item, i) => (
                <li
                    key={item.id}
                    className={`cdt-entry ${item.esito === 'OK' ? 'is-ok' : 'is-ko'}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                >
                    <span className="cdt-dot">{item.esito === 'OK' ? <FaCheck size={9} /> : <FaExclamation size={9} />}</span>
                    <div className="cdt-card">
                        <div className="cdt-card-top">
                            <span className="cdt-date">{item.dtInvio}</span>
                            <span className="cdt-amount">{formatMoney(item.importo)}</span>
                        </div>
                        <div className="cdt-oggetto">{item.oggetto}</div>
                        {tipo === 'cliente' && (
                            <div className="cdt-meta-row">
                                <span className="cdt-doc-badge">Fattura {item.numeroDocumento}</span>
                                <span className="cdt-doc-scadenza">scad. {item.dataScadenza}</span>
                            </div>
                        )}
                        <div className="cdt-card-bottom">
                            <span className="cdt-dest">a {item.destinatario}</span>
                            {item.esito === 'OK' ? (
                                <span className="cdt-status cdt-status-ok">Consegnata</span>
                            ) : (
                                <span className="cdt-status cdt-status-ko" title={item.dettaglioErrore || 'Invio non riuscito'}>Non riuscita</span>
                            )}
                        </div>
                        {item.esito !== 'OK' && item.dettaglioErrore && (
                            <div className="cdt-errore">{item.dettaglioErrore}</div>
                        )}
                    </div>
                </li>
            ))}
        </ol>
    );
};

export default ComunicazioniTimeline;
