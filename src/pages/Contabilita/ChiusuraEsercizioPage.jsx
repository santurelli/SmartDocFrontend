import React, { useState, useEffect } from 'react';
import ChiusuraEsercizioService from '../../services/ChiusuraEsercizioService';
import { FaLock, FaExclamationTriangle } from 'react-icons/fa';
import '../Configurazione/ConfigurazionePage.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
};

const annoCorrente = new Date().getFullYear();

const ChiusuraEsercizioPage = () => {
    const [anno, setAnno] = useState(annoCorrente - 1);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [chiudendo, setChiudendo] = useState(false);
    const [errore, setErrore] = useState('');
    const [esito, setEsito] = useState('');

    const fetchAnteprima = async (annoDaCaricare) => {
        setLoading(true);
        setErrore('');
        setEsito('');
        setPreview(null);
        try {
            const res = await ChiusuraEsercizioService.anteprima(annoDaCaricare);
            if (res.errorText) {
                setErrore(res.errorText);
            } else {
                setPreview(res.payload);
            }
        } catch (err) {
            console.error('Errore nel caricamento dell\'anteprima di chiusura:', err);
            setErrore('Errore nel caricamento dell\'anteprima.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnteprima(anno);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAnnoChange = (e) => {
        const value = parseInt(e.target.value, 10);
        setAnno(value);
        if (!isNaN(value)) {
            fetchAnteprima(value);
        }
    };

    const handleChiudi = async () => {
        if (!window.confirm(`Confermi la chiusura dell'esercizio ${anno}? L'operazione genera la scrittura di chiusura sui conti economici e riporta i saldi patrimoniali sull'esercizio ${anno + 1}. Non e' pensata per essere annullata facilmente.`)) {
            return;
        }
        setChiudendo(true);
        setErrore('');
        setEsito('');
        try {
            const res = await ChiusuraEsercizioService.chiudi(anno);
            if (res.errorText) {
                setErrore(res.errorText);
            } else {
                setEsito(`Esercizio ${anno} chiuso correttamente. I saldi patrimoniali sono stati riportati sull'esercizio ${anno + 1}.`);
                fetchAnteprima(anno);
            }
        } catch (err) {
            console.error('Errore nella chiusura dell\'esercizio:', err);
            setErrore('Errore nella chiusura dell\'esercizio.');
        } finally {
            setChiudendo(false);
        }
    };

    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaLock style={{ marginRight: '10px' }} />Chiusura Esercizio</h2>
            </div>

            <div className="tab-content-wrapper" style={{ border: 'none', padding: '0' }}>
                <div className="dati-azienda-container" style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                    <p className="section-description">
                        Chiude un esercizio: genera la scrittura di chiusura sui conti economici (Costi/Ricavi) verso "Utile (perdita) d'esercizio",
                        e riporta i saldi dei conti patrimoniali (Attivita'/Passivita'/Patrimonio Netto/IVA) come saldo di apertura dell'anno successivo.
                        Dopo la chiusura, i documenti datati in questo esercizio non genereranno piu' scritture contabili automatiche.
                    </p>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>Anno</label>
                            <input type="number" className="form-control" style={{ width: '140px' }} value={anno} onChange={handleAnnoChange} />
                        </div>
                    </div>

                    {errore && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', color: '#b91c1c', marginBottom: '16px' }}>
                            {errore}
                        </div>
                    )}

                    {esito && (
                        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', color: '#15803d', marginBottom: '16px' }}>
                            {esito}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Caricamento...</div>
                    ) : preview && (
                        <>
                            {preview.giaChiuso && (
                                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', color: '#92400e', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaExclamationTriangle /> L'esercizio {anno} risulta gia' chiuso.
                                </div>
                            )}

                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '13px', color: '#64748b' }}>Utile / Perdita d'esercizio {anno}</div>
                                    <div style={{ fontSize: '28px', fontWeight: 'bold', color: (preview.utilePerdita || 0) >= 0 ? '#15803d' : '#b91c1c' }}>
                                        {formatCurrency(preview.utilePerdita)}
                                    </div>
                                </div>
                                <button className="btn btn-primary" onClick={handleChiudi} disabled={preview.giaChiuso || chiudendo}>
                                    {chiudendo ? 'Chiusura in corso...' : `Chiudi Esercizio ${anno}`}
                                </button>
                            </div>

                            <h3 style={{ marginBottom: '8px' }}>Conti economici da azzerare ({(preview.righeEconomiche || []).length})</h3>
                            {(preview.righeEconomiche || []).length === 0 ? (
                                <p style={{ color: '#94a3b8', marginBottom: '20px' }}>Nessun movimento sui conti economici in questo esercizio.</p>
                            ) : (
                                <div className="table-responsive" style={{ marginBottom: '20px' }}>
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Conto</th>
                                                <th>Tipo</th>
                                                <th className="text-right">Saldo (Dare - Avere)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.righeEconomiche.map(r => (
                                                <tr key={r.idConto}>
                                                    <td>{r.codiceConto} - {r.descrizioneConto}</td>
                                                    <td>{r.tipoConto}</td>
                                                    <td className="text-right">{formatCurrency(r.saldo)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            <h3 style={{ marginBottom: '8px' }}>Conti patrimoniali da riportare ({(preview.righePatrimoniali || []).length})</h3>
                            {(preview.righePatrimoniali || []).length === 0 ? (
                                <p style={{ color: '#94a3b8' }}>Nessun saldo patrimoniale da riportare.</p>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>Conto</th>
                                                <th>Tipo</th>
                                                <th className="text-right">Saldo riportato su {anno + 1}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.righePatrimoniali.map(r => (
                                                <tr key={r.idConto}>
                                                    <td>{r.codiceConto} - {r.descrizioneConto}</td>
                                                    <td>{r.tipoConto}</td>
                                                    <td className="text-right">{formatCurrency(r.saldo)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ChiusuraEsercizioPage;
