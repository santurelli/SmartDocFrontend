import React from 'react';
import { FaMapMarkerAlt, FaBuilding, FaTruck, FaHome } from 'react-icons/fa';

const IndirizziSelectionModal = ({ isOpen, onClose, indirizzi, onSelect, title = "Seleziona Indirizzo" }) => {
    if (!isOpen) return null;

    const getIcon = (tipologia) => {
        switch (tipologia) {
            case 'L': return <FaBuilding className="text-primary" title="Sede Legale" />;
            case 'O': return <FaHome className="text-success" title="Sede Operativa" />;
            case 'M': return <FaTruck className="text-warning" title="Destinazione Merce" />;
            default: return <FaMapMarkerAlt className="text-muted" />;
        }
    };

    const getLabel = (tipologia) => {
        switch (tipologia) {
            case 'L': return "Sede Legale";
            case 'O': return "Sede Operativa";
            case 'M': return "Destinazione Merce";
            default: return "Altro";
        }
    };

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1200 }} role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>{title}</h4>
                    </div>
                    <div className="modal-body" style={{ padding: '20px', maxHeight: '60vh', overflowY: 'auto' }}>
                        {indirizzi.length === 0 ? (
                            <div className="text-center text-muted p-4">
                                Nessun indirizzo trovato per questo cliente.
                            </div>
                        ) : (
                            <div className="list-group">
                                {indirizzi.map((ind, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className="list-group-item list-group-item-action d-flex align-items-center"
                                        style={{ padding: '15px' }}
                                        onClick={() => {
                                            onSelect(ind);
                                            onClose();
                                        }}
                                    >
                                        <div style={{ fontSize: '20px', marginRight: '20px' }}>
                                            {getIcon(ind.tipologia)}
                                        </div>
                                        <div style={{ flexGrow: 1 }}>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <strong style={{ color: '#333' }}>{ind.descrizione || getLabel(ind.tipologia)}</strong>
                                                <span className="badge badge-info">{getLabel(ind.tipologia)}</span>
                                            </div>
                                            <div className="text-muted small mt-1">
                                                {ind.indirizzo}, {ind.cap} {ind.citta} ({ind.provincia}) - {ind.nazione}
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-premium-cancel" onClick={onClose}>Chiudi</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IndirizziSelectionModal;
