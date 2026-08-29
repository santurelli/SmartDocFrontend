import React, { useState, useEffect } from 'react';
import PrevisioneCassaService from '../../services/PrevisioneCassaService';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { FaChartLine, FaExclamationTriangle } from 'react-icons/fa';
import '../Configurazione/ConfigurazionePage.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
};

const KpiCard = ({ label, value, evidenzia }) => (
    <div style={{
        background: '#fff', borderRadius: '12px', padding: '18px 22px', flex: 1, minWidth: '180px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: evidenzia && value < 0 ? '1px solid #fca5a5' : '1px solid #e2e8f0'
    }}>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>{label}</div>
        <div style={{ fontSize: '24px', fontWeight: 700, color: value < 0 ? '#b91c1c' : '#0f172a' }}>
            {formatCurrency(value)}
        </div>
    </div>
);

const PrevisioneCassaPage = () => {
    const [dati, setDati] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errore, setErrore] = useState('');

    useEffect(() => {
        fetchDati();
    }, []);

    const fetchDati = async () => {
        setLoading(true);
        setErrore('');
        try {
            const res = await PrevisioneCassaService.get();
            if (res.errorText) {
                setErrore(res.errorText);
            } else {
                setDati(res.payload);
            }
        } catch (err) {
            console.error('Errore nel caricamento della previsione di cassa:', err);
            setErrore('Errore nel caricamento della previsione di cassa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaChartLine style={{ marginRight: '10px' }} />Previsione di Cassa</h2>
            </div>

            <div className="tab-content-wrapper" style={{ border: 'none', padding: '0' }}>
                <div className="dati-azienda-container" style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                    <p className="section-description">
                        Proiezione basata sul saldo attuale dei tuoi conti (impostabile in "Gestisci conti/banche") più le scadenze di incasso e pagamento
                        già pianificate e non ancora saldate. Le scadenze scadute e non ancora incassate/pagate NON sono incluse nella proiezione
                        (potrebbero non arrivare mai) — le trovi elencate a parte come rischio.
                    </p>

                    {errore && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', color: '#b91c1c', marginBottom: '16px' }}>
                            {errore}
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Caricamento...</div>
                    ) : dati && (
                        <>
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px' }}>
                                <KpiCard label="Saldo attuale (tutti i conti)" value={dati.saldoAttualeTotale} />
                                <KpiCard label="Previsto tra 30 giorni" value={dati.saldoPrevisto30} evidenzia />
                                <KpiCard label="Previsto tra 60 giorni" value={dati.saldoPrevisto60} evidenzia />
                                <KpiCard label="Previsto tra 90 giorni" value={dati.saldoPrevisto90} evidenzia />
                            </div>

                            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                                <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '15px', color: '#334155' }}>Andamento previsto (90 giorni)</h3>
                                <ResponsiveContainer width="100%" height={320}>
                                    <LineChart data={dati.serieGiornaliera}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="data" interval={6} tick={{ fontSize: 11 }} />
                                        <YAxis tickFormatter={(v) => new Intl.NumberFormat('it-IT', { notation: 'compact' }).format(v)} />
                                        <Tooltip formatter={(v) => formatCurrency(v)} />
                                        <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" />
                                        <Line type="monotone" dataKey="saldo" stroke="#2563eb" strokeWidth={2} dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {dati.perConto && dati.perConto.length > 0 && (
                                <div style={{ marginBottom: '24px' }}>
                                    <h3 style={{ marginBottom: '12px' }}>Dettaglio per conto</h3>
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Conto</th>
                                                    <th className="text-right">Saldo attuale</th>
                                                    <th className="text-right">Previsto 30gg</th>
                                                    <th className="text-right">Previsto 60gg</th>
                                                    <th className="text-right">Previsto 90gg</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dati.perConto.map(c => (
                                                    <tr key={c.idRisorsa}>
                                                        <td>{c.descrizioneConto}</td>
                                                        <td className="text-right">{formatCurrency(c.saldoAttuale)}</td>
                                                        <td className="text-right">{formatCurrency(c.saldoPrevisto30)}</td>
                                                        <td className="text-right">{formatCurrency(c.saldoPrevisto60)}</td>
                                                        <td className="text-right">{formatCurrency(c.saldoPrevisto90)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div>
                                <h3 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <FaExclamationTriangle style={{ color: '#d97706' }} />
                                    Scadenze scadute non saldate
                                </h3>
                                <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>
                                    Non incluse nella proiezione sopra. Da incassare: {formatCurrency(dati.totaleScadutoDaIncassare)} — Da pagare: {formatCurrency(dati.totaleScadutoDaPagare)}
                                </p>
                                {(!dati.scadute || dati.scadute.length === 0) ? (
                                    <div style={{ background: '#f0fdf4', border: '1px dashed #bbf7d0', borderRadius: '12px', padding: '20px', textAlign: 'center', color: '#15803d' }}>
                                        Nessuna scadenza scaduta non saldata. 🎉
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Tipo</th>
                                                    <th>Documento</th>
                                                    <th>Soggetto</th>
                                                    <th>Scadenza</th>
                                                    <th className="text-right">Giorni di ritardo</th>
                                                    <th className="text-right">Importo</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {dati.scadute.map((s, idx) => (
                                                    <tr key={idx}>
                                                        <td>
                                                            <span style={{
                                                                fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px',
                                                                background: s.tipo === 'INCASSO' ? '#dcfce7' : '#fee2e2',
                                                                color: s.tipo === 'INCASSO' ? '#166534' : '#991b1b'
                                                            }}>
                                                                {s.tipo === 'INCASSO' ? 'DA INCASSARE' : 'DA PAGARE'}
                                                            </span>
                                                        </td>
                                                        <td>{s.tipoDocumento} n. {s.numeroDocumento}</td>
                                                        <td>{s.soggetto || '-'}</td>
                                                        <td>{s.dataScadenza}</td>
                                                        <td className="text-right" style={{ color: '#b91c1c', fontWeight: 600 }}>{s.giorniRitardo} gg</td>
                                                        <td className="text-right">{formatCurrency(s.importo)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrevisioneCassaPage;
