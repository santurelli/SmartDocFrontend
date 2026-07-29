import React from 'react';
import ReactDOM from 'react-dom';
import { FaEnvelopeOpenText, FaTimes } from 'react-icons/fa';
import ComunicazioniTimeline from '../ComunicazioniTimeline';
import './ComunicazioniDocumentoModal.css';

/**
 * Modale con la timeline delle comunicazioni automatiche (solleciti/promemoria) inviate.
 * tipo: 'fattura' | 'fatturaFornitore' | 'cliente' (storico su tutti i documenti del cliente)
 */
const ComunicazioniDocumentoModal = ({ isOpen, onClose, idDocumento, tipo = 'fattura', titolo, sottotitolo }) => {
    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="cdt-overlay" onClick={onClose}>
            <div className="cdt-panel" onClick={e => e.stopPropagation()}>
                <div className="cdt-header">
                    <div className="cdt-header-icon"><FaEnvelopeOpenText /></div>
                    <div className="cdt-header-text">
                        <span className="cdt-eyebrow">Comunicazioni automatiche</span>
                        <h3>{titolo}</h3>
                        {sottotitolo && <span className="cdt-sottotitolo">{sottotitolo}</span>}
                    </div>
                    <button className="cdt-close" onClick={onClose} aria-label="Chiudi"><FaTimes /></button>
                </div>

                <div className="cdt-body">
                    <ComunicazioniTimeline idDocumento={idDocumento} tipo={tipo} />
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ComunicazioniDocumentoModal;
