import React, { useState, useEffect } from 'react';
import UbicazioniService from '../../services/UbicazioniService';
import Swal from 'sweetalert2';
import { FaPrint, FaMapMarkerAlt, FaCogs, FaBoxes } from 'react-icons/fa';
import UbicazioniManagementModal from './UbicazioniManagementModal';

const UbicazioniArticoloModal = ({ show, handleClose, article, refreshList }) => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [printing, setPrinting] = useState(false);
    const [quantitiesToPick, setQuantitiesToPick] = useState({});
    const [scaricaGiacenza, setScaricaGiacenza] = useState(true);
    const [showUbicazioniManagement, setShowUbicazioniManagement] = useState(false);
    const [currentGiacenza, setCurrentGiacenza] = useState(article?.quantitaEsistente || 0);

    useEffect(() => {
        if (show && article?.id) {
            setCurrentGiacenza(article.quantitaEsistente || 0);
            loadData();
        }
    }, [show, article]);

    const loadData = async () => {
        setLoading(true);
        try {
            const prodUbiRes = await UbicazioniService.getByProdotto(article.id);
            const locList = prodUbiRes.data || [];
            setLocations(locList);

            // Inizializza le quantità da prelevare (se c'è 1 sola ubicazione, imposta default 4 o giacenza)
            const qMap = {};
            if (locList.length === 1) {
                const loc = locList[0];
                qMap[loc.id] = loc.quantita > 0 ? (loc.quantita >= 4 ? 4 : loc.quantita) : 0;
            } else {
                locList.forEach(loc => {
                    qMap[loc.id] = 0;
                });
            }
            setQuantitiesToPick(qMap);
        } catch (error) {
            console.error("Errore caricamento dati ubicazioni", error);
            Swal.fire('Errore', 'Impossibile caricare le ubicazioni dell\'articolo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleQtyChange = (id, val, maxAvailable) => {
        if (val === '') {
            setQuantitiesToPick(prev => ({
                ...prev,
                [id]: ''
            }));
            return;
        }
        let num = parseInt(val, 10);
        if (isNaN(num) || num < 0) num = 0;
        if (maxAvailable !== undefined && num > maxAvailable) {
            num = maxAvailable;
        }
        setQuantitiesToPick(prev => ({
            ...prev,
            [id]: num
        }));
    };

    const totalSelectedQty = locations.reduce((sum, loc) => {
        const q = parseFloat(quantitiesToPick[loc.id]) || 0;
        return sum + q;
    }, 0);

    const getItemsToPick = () => {
        return locations
            .map(loc => {
                const qty = parseFloat(quantitiesToPick[loc.id]) || 0;
                return {
                    id: loc.id,
                    idUbicazione: loc.idUbicazione,
                    codUbicazione: loc.codUbicazione,
                    corsia: loc.corsia,
                    ripiano: loc.ripiano,
                    livello: loc.livello,
                    dot: loc.dot,
                    quantita: qty,
                    maxAvailable: loc.quantita
                };
            })
            .filter(item => item.quantita > 0);
    };

    const handleSoloPrelievo = async () => {
        const itemsToPick = getItemsToPick();

        if (itemsToPick.length === 0) {
            Swal.fire('Attenzione', 'Inserisci una quantità da prelevare maggiore di 0 per almeno una ubicazione.', 'warning');
            return;
        }

        for (const it of itemsToPick) {
            if (it.quantita > it.maxAvailable) {
                Swal.fire('Attenzione', `La quantità da prelevare per ${it.codUbicazione} (${it.quantita} pz) non può superare la giacenza disponibile (${it.maxAvailable} pz).`, 'warning');
                return;
            }
        }

        setPrinting(true);
        try {
            const result = await UbicazioniService.prelievo({
                idProdotto: article.id,
                items: itemsToPick
            });

            Swal.fire({
                icon: 'success',
                title: 'Prelievo Effettuato',
                text: result.message || `Prelievo di ${totalSelectedQty} pz registrato con successo. Giacenza generale e ubicazioni aggiornate.`,
                timer: 3000,
                showConfirmButton: false
            });

            const newTotal = Math.max(0, currentGiacenza - totalSelectedQty);
            setCurrentGiacenza(newTotal);
            if (article) {
                article.quantitaEsistente = newTotal;
            }

            loadData();
            if (refreshList) refreshList();
        } catch (err) {
            console.error("Errore durante il prelievo", err);
            Swal.fire({
                icon: 'error',
                title: 'Errore durante il prelievo',
                text: err.response?.data || err.message || 'Impossibile completare il prelievo'
            });
        } finally {
            setPrinting(false);
        }
    };

    const handleStampaPrelievo = async () => {
        const itemsToPick = getItemsToPick();

        if (itemsToPick.length === 0) {
            Swal.fire('Attenzione', 'Inserisci una quantità da prelevare maggiore di 0 per almeno una ubicazione.', 'warning');
            return;
        }

        // Verifica che la quantità non ecceda la disponibilità
        for (const it of itemsToPick) {
            if (it.quantita > it.maxAvailable) {
                Swal.fire('Attenzione', `La quantità da prelevare per ${it.codUbicazione} (${it.quantita} pz) non può superare la giacenza disponibile (${it.maxAvailable} pz).`, 'warning');
                return;
            }
        }

        setPrinting(true);
        try {
            const result = await UbicazioniService.stampaPrelievo({
                idProdotto: article.id,
                items: itemsToPick,
                scaricaGiacenza: scaricaGiacenza
            });

            const successMsg = scaricaGiacenza
                ? `Scheda di prelievo inviata (${totalSelectedQty} pz). Giacenza generale e ubicazioni aggiornate.`
                : `Scheda di prelievo inviata alla stampante (${totalSelectedQty} pz).`;

            if (result.warning) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Giacenze Aggiornate',
                    text: result.warning
                });
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Stampa Inviata!',
                    text: result.message || successMsg,
                    timer: 3000,
                    showConfirmButton: false
                });
            }

            if (scaricaGiacenza) {
                const newTotal = Math.max(0, currentGiacenza - totalSelectedQty);
                setCurrentGiacenza(newTotal);
                if (article) {
                    article.quantitaEsistente = newTotal;
                }
                loadData();
                if (refreshList) refreshList();
            }
        } catch (err) {
            console.error("Errore durante la stampa", err);
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: err.message || 'Impossibile completare l\'operazione.'
            });
        } finally {
            setPrinting(false);
        }
    };

    if (!show) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content premium-modal-content">
                    <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', minHeight: 'unset' }}>
                        <div>
                            <h4 className="modal-title" style={{ fontWeight: 'bold', margin: 0, fontSize: '18px', lineHeight: 1.2 }}>
                                Scheda Prelievo Ubicazioni
                            </h4>
                            <div className="modal-header-article" style={{ fontSize: '13px', color: '#64748b', marginTop: '3px' }}>
                                Articolo: {article?.codice} - {article?.descrizione}
                            </div>
                        </div>
                        <button type="button" className="close" onClick={handleClose} aria-label="Close" style={{ margin: 0, padding: 0, lineHeight: 1, fontSize: '22px' }}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>

                    <div className="modal-body" style={{ padding: '20px' }}>
                        {/* Articolo Info Card */}
                        <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 18px', marginBottom: '20px' }}>
                            <div className="row" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div className="col-xs-6 col-sm-3 col-md-3" style={{ marginBottom: '8px' }}>
                                    <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>
                                        Codice Articolo
                                    </span>
                                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>
                                        {article?.codice || '-'}
                                    </strong>
                                </div>
                                <div className="col-xs-6 col-sm-3 col-md-3" style={{ marginBottom: '8px' }}>
                                    <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>
                                        Marca
                                    </span>
                                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: '#334155' }}>
                                        {article?.descMarca || article?.marca || '-'}
                                    </span>
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-4" style={{ marginBottom: '8px' }}>
                                    <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>
                                        Descrizione
                                    </span>
                                    <span style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#1e293b' }}>
                                        {article?.descrizione || '-'}
                                    </span>
                                </div>
                                <div className="col-xs-6 col-sm-2 col-md-2 text-right" style={{ marginBottom: '8px', marginLeft: 'auto' }}>
                                    <span style={{ display: 'block', fontSize: '11px', textTransform: 'uppercase', color: '#64748b', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '4px' }}>
                                        Giacenza Totale
                                    </span>
                                    <span className="badge" style={{ backgroundColor: '#10b981', fontSize: '13px', padding: '6px 12px', borderRadius: '12px', fontWeight: 600 }}>
                                        {(currentGiacenza || 0).toFixed(0)} pz
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Toolbar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h5 style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>
                                Stock per Ubicazione e Prelievo
                            </h5>
                            <button
                                className="btn btn-sm btn-default"
                                onClick={() => setShowUbicazioniManagement(true)}
                                style={{ borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
                                title="Anagrafica Ubicazioni di Magazzino"
                            >
                                <FaMapMarkerAlt /> Gestione Ubicazioni
                            </button>
                        </div>

                        {/* Tabella Ubicazioni */}
                        {loading ? (
                            <div className="text-center p-4">Caricamento ubicazioni in corso...</div>
                        ) : locations.length === 0 ? (
                            <div className="alert alert-info text-center" style={{ borderRadius: '8px', padding: '24px 20px', margin: '10px 0' }}>
                                <FaMapMarkerAlt style={{ marginRight: '8px', fontSize: '18px', color: '#0284c7' }} />
                                <strong style={{ fontSize: '15px' }}>Nessuna ubicazione assegnata a questo articolo.</strong>
                                <div style={{ marginTop: '8px', fontSize: '13px', color: '#475569' }}>
                                    L'ubicazione e il DOT vengono registrati durante il <strong>Carico di Magazzino</strong>.<br />
                                    Una volta caricata la merce, qui potrai indicare le quantità da prelevare e scaricare la giacenza.
                                </div>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-bordered table-striped" style={{ marginBottom: 0 }}>
                                    <thead style={{ backgroundColor: '#f1f4f8' }}>
                                        <tr>
                                            <th>Ubicazione</th>
                                            <th>Dettaglio (Corsia/Rip/Liv)</th>
                                            <th style={{ width: '120px' }}>DOT</th>
                                            <th style={{ textAlign: 'right', width: '90px' }}>Giacenza</th>
                                            <th style={{ width: '150px', textAlign: 'center' }}>Q.tà da prelevare</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {locations.map(loc => (
                                             <tr key={loc.id}>
                                                <td>
                                                    <strong style={{ color: '#2980b9' }}>{loc.codUbicazione}</strong>
                                                    {loc.descUbicazione && <small className="text-muted" style={{ display: 'block', marginTop: '2px' }}>{loc.descUbicazione}</small>}
                                                </td>
                                                <td>
                                                    {[
                                                        loc.corsia && `Corsia: ${loc.corsia}`,
                                                        loc.ripiano && `Rip.: ${loc.ripiano}`,
                                                        loc.livello && `Liv.: ${loc.livello}`
                                                    ].filter(Boolean).join(' | ') || '-'}
                                                </td>
                                                <td>
                                                    <span className="badge" style={{ backgroundColor: '#7f8c8d' }}>
                                                        {loc.dot || 'N.D.'}
                                                    </span>
                                                </td>
                                                <td className="text-right" style={{ verticalAlign: 'middle' }}>
                                                    <strong style={{ fontSize: '15px' }}>{(loc.quantita || 0).toFixed(0)}</strong>
                                                </td>
                                                <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        className="form-control input-sm text-center"
                                                        style={{ width: '75px', height: '34px', margin: '0 auto', fontSize: '14px', fontWeight: 'bold', borderRadius: '6px' }}
                                                        min="0"
                                                        max={loc.quantita || 0}
                                                        value={quantitiesToPick[loc.id] !== undefined ? quantitiesToPick[loc.id] : 0}
                                                        onChange={(e) => handleQtyChange(loc.id, e.target.value, loc.quantita)}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="modal-footer" style={{ borderTop: '1px solid #e5e5e5', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexWrap: 'wrap' }}>
                            {locations.length > 0 && (
                                <span style={{ fontSize: '13px', color: '#475569' }}>
                                    Totale da prelevare: <strong style={{ color: totalSelectedQty > 0 ? '#10b981' : '#64748b', fontSize: '16px', marginLeft: '4px' }}>{totalSelectedQty} pz</strong>
                                </span>
                            )}
                            <label style={{ fontSize: '13px', fontWeight: '500', color: '#334155', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', margin: 0, userSelect: 'none' }}>
                                <input
                                    type="checkbox"
                                    checked={scaricaGiacenza}
                                    onChange={(e) => setScaricaGiacenza(e.target.checked)}
                                    style={{ margin: 0, width: '15px', height: '15px', cursor: 'pointer' }}
                                />
                                Scala giacenza (ubicazioni e generale)
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" className="btn btn-default" onClick={handleClose} style={{ borderRadius: '6px' }}>
                                Chiudi
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleSoloPrelievo}
                                disabled={printing || locations.length === 0 || totalSelectedQty <= 0}
                                style={{ borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', padding: '6px 14px' }}
                                title="Preleva la merce aggiornando le ubicazioni e la giacenza generale senza stampare"
                            >
                                <FaBoxes /> {printing ? 'Attendere...' : 'Solo Prelievo'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={handleStampaPrelievo}
                                disabled={printing || locations.length === 0 || totalSelectedQty <= 0}
                                style={{ borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 'bold', padding: '6px 16px' }}
                                title="Stampa la scheda di prelievo e scala le giacenze"
                            >
                                <FaPrint /> {printing ? 'Invio Stampa...' : 'Stampa Scheda Prelievo'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {showUbicazioniManagement && (
                <UbicazioniManagementModal onClose={() => { setShowUbicazioniManagement(false); loadData(); }} />
            )}
        </div>
    );
};

export default UbicazioniArticoloModal;
