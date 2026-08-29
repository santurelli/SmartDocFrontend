import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import BilancioService from '../../services/BilancioService';
import { FaBalanceScale, FaExclamationTriangle, FaFilePdf } from 'react-icons/fa';
import '../Configurazione/ConfigurazionePage.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
};

const annoCorrente = new Date().getFullYear();

const RigheTable = ({ righe, totale, labelTotale }) => (
    <table className="table table-hover">
        <tbody>
            {(righe || []).map(r => (
                <tr key={r.idConto}>
                    <td>{r.codiceConto} - {r.descrizioneConto}</td>
                    <td className="text-right">{formatCurrency(r.saldo)}</td>
                </tr>
            ))}
            <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                <td>{labelTotale}</td>
                <td className="text-right">{formatCurrency(totale)}</td>
            </tr>
        </tbody>
    </table>
);

const BilancioPage = () => {
    const [anno, setAnno] = useState(annoCorrente);
    const [bilancio, setBilancio] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errore, setErrore] = useState('');
    const [stampando, setStampando] = useState(false);

    const fetchBilancio = async (annoDaCaricare) => {
        setLoading(true);
        setErrore('');
        setBilancio(null);
        try {
            const res = await BilancioService.get(annoDaCaricare);
            if (res.errorText) {
                setErrore(res.errorText);
            } else {
                setBilancio(res.payload);
            }
        } catch (err) {
            console.error('Errore nel caricamento del bilancio:', err);
            setErrore('Errore nel caricamento del bilancio.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBilancio(anno);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnnoChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setAnno(value);
        if (!isNaN(value)) {
            fetchBilancio(value);
        }
    };

    const pareggiato = bilancio && Math.abs((bilancio.totaleAttivo || 0) - (bilancio.totalePassivo || 0)) < 0.005;

    const handleStampa = async () => {
        setStampando(true);
        try {
            const res = await BilancioService.print(anno);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error('Errore nella stampa del bilancio:', err);
            Swal.fire({ title: 'Errore', text: 'Errore nella generazione del PDF.', icon: 'error' });
        } finally {
            setStampando(false);
        }
    };

    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaBalanceScale style={{ marginRight: '10px' }} />Bilancio</h2>
            </div>

            <div className="tab-content-wrapper" style={{ border: 'none', padding: '0' }}>
                <div className="dati-azienda-container" style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                    <p className="section-description">
                        Stato Patrimoniale e Conto Economico dell'anno selezionato, calcolati sui saldi di apertura e sui movimenti registrati.
                        Se l'esercizio non e' ancora chiuso, l'utile/perdita e' provvisorio (calcolato sui movimenti fin qui registrati).
                    </p>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>Anno</label>
                            <input type="number" className="form-control" style={{ width: '140px' }} value={anno} onChange={handleAnnoChange} />
                        </div>
                        <button className="btn btn-secondary" onClick={handleStampa} disabled={!bilancio || stampando}>
                            <FaFilePdf style={{ marginRight: '6px' }} />{stampando ? 'Generazione...' : 'Stampa PDF'}
                        </button>
                    </div>

                    {errore && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', color: '#b91c1c', marginBottom: '16px' }}>
                            {errore}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Caricamento...</div>
                    ) : bilancio && (
                        <>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
                                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px 20px', flex: 1, minWidth: '220px' }}>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Stato esercizio {bilancio.anno}</div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{bilancio.esercizioChiuso ? 'Chiuso' : 'Aperto (bilancio provvisorio)'}</div>
                                </div>
                                <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px 20px', flex: 1, minWidth: '220px' }}>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Utile / Perdita d'esercizio</div>
                                    <div style={{ fontSize: '20px', fontWeight: 'bold', color: (bilancio.utilePerdita || 0) >= 0 ? '#15803d' : '#b91c1c' }}>
                                        {formatCurrency(bilancio.utilePerdita)}
                                    </div>
                                </div>
                                <div style={{ background: pareggiato ? '#f0fdf4' : '#fffbeb', borderRadius: '12px', padding: '16px 20px', flex: 1, minWidth: '220px' }}>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Quadratura</div>
                                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: pareggiato ? '#15803d' : '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        {pareggiato ? 'Attivo = Passivo' : <><FaExclamationTriangle /> Non quadra</>}
                                    </div>
                                </div>
                            </div>

                            <h3>Stato Patrimoniale</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                                <div>
                                    <h4 style={{ color: '#475569' }}>Attivo</h4>
                                    <div className="table-responsive">
                                        <RigheTable righe={bilancio.attivo} totale={bilancio.totaleAttivo} labelTotale="Totale Attivo" />
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ color: '#475569' }}>Passivo (incluso Patrimonio Netto)</h4>
                                    <div className="table-responsive">
                                        <RigheTable righe={bilancio.passivo} totale={bilancio.totalePassivo} labelTotale="Totale Passivo" />
                                    </div>
                                </div>
                            </div>

                            <h3>Conto Economico</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <h4 style={{ color: '#475569' }}>Costi</h4>
                                    <div className="table-responsive">
                                        <RigheTable righe={bilancio.costi} totale={bilancio.totaleCosti} labelTotale="Totale Costi" />
                                    </div>
                                </div>
                                <div>
                                    <h4 style={{ color: '#475569' }}>Ricavi</h4>
                                    <div className="table-responsive">
                                        <RigheTable righe={bilancio.ricavi} totale={bilancio.totaleRicavi} labelTotale="Totale Ricavi" />
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BilancioPage;
