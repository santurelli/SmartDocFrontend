import React, { useState, useEffect } from 'react';
import StudioService from '../services/StudioService';
import Swal from 'sweetalert2';
import { FaUserTie, FaCheck, FaTimes, FaShieldAlt } from 'react-icons/fa';

const CommercialistaSection = () => {
    const [deleghe, setDeleghe] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDeleghe();
    }, []);

    const loadDeleghe = async () => {
        setLoading(true);
        try {
            const res = await StudioService.getDelegheRicevute();
            setDeleghe(res.data || []);
            try {
                const auditRes = await StudioService.getAuditLog();
                setAuditLogs(auditRes.data || []);
            } catch (ignored) {}
        } catch (err) {
            console.error('Errore nel caricamento delle deleghe studio:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAccetta = async (idDelega, nomeStudio) => {
        try {
            await StudioService.accettaDelega(idDelega);
            Swal.fire('Delega Accettata', `Hai autorizzato lo ${nomeStudio} a consultare i tuoi dati contabili.`, 'success');
            loadDeleghe();
        } catch (err) {
            Swal.fire('Errore', err.response?.data || 'Impossibile accettare la delega.', 'error');
        }
    };

    const handleRevoca = async (idDelega, nomeStudio) => {
        const result = await Swal.fire({
            title: 'Revocare l\'accesso?',
            text: `Lo ${nomeStudio} non potrà più accedere ai tuoi dati di fatturazione e prima nota.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, Revoca Accesso',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await StudioService.revocaDelega(idDelega);
                Swal.fire('Accesso Revocato', 'La delega è stata revocata con successo.', 'info');
                loadDeleghe();
            } catch (err) {
                Swal.fire('Errore', err.response?.data || 'Impossibile revocare la delega.', 'error');
            }
        }
    };

    return (
        <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            marginTop: '24px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px'
                    }}>
                        <FaUserTie />
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontWeight: '800', color: '#0f172a', fontSize: '18px' }}>
                            Il tuo Commercialista / Studio Contabile
                        </h4>
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                            Gestisci le autorizzazioni di accesso del tuo consulente ai dati aziendali.
                        </span>
                    </div>
                </div>
                <span style={{
                    fontSize: '11px',
                    fontWeight: '700',
                    color: '#059669',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <FaShieldAlt /> Protetto da GDPR
                </span>
            </div>

            {loading ? (
                <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    Caricamento deleghe in corso...
                </div>
            ) : deleghe.length === 0 ? (
                <div style={{
                    background: '#f8fafc',
                    border: '1px dashed #cbd5e1',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '13px'
                }}>
                    Nessuno Studio Contabile è attualmente collegato al tuo account.<br />
                    Se il tuo commercialista usa SmartDoc, forniscigli la tua Partita IVA per farti inviare una richiesta di collegamento.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {deleghe.map(d => (
                        <div key={d.k_d_r_deleghe_studio} style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: d.stato === 'PENDING' ? '#fffbe6' : '#f8fafc',
                            border: `1px solid ${d.stato === 'PENDING' ? '#fde68a' : '#e2e8f0'}`,
                            borderRadius: '12px',
                            padding: '16px',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <div>
                                <div style={{ fontWeight: '800', color: '#0f172a', fontSize: '15px' }}>
                                    {d.ragione_sociale_studio || 'Studio Contabile'}
                                </div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>
                                    P.IVA: {d.piva_studio || 'N/D'} | Email: {d.email_studio || 'N/D'}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {d.stato === 'PENDING' ? (
                                    <>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            color: '#d97706',
                                            background: '#fef3c7',
                                            padding: '4px 10px',
                                            borderRadius: '20px'
                                        }}>
                                            ⏳ IN ATTESA DI CONFERMA
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleAccetta(d.k_d_r_deleghe_studio, d.ragione_sociale_studio)}
                                            className="btn btn-success btn-xs"
                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                                        >
                                            <FaCheck /> Autorizza Accesso
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <span style={{
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            color: '#059669',
                                            background: '#d1fae5',
                                            padding: '4px 10px',
                                            borderRadius: '20px'
                                        }}>
                                            ✓ COLLEGAMENTO ATTIVO
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleRevoca(d.k_d_r_deleghe_studio, d.ragione_sociale_studio)}
                                            className="btn btn-danger btn-xs"
                                            style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}
                                        >
                                            <FaTimes /> Revoca Accesso
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* REGISTRO ACCESSI AUDIT LOG GDPR */}
            {auditLogs && auditLogs.length > 0 && (
                <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
                    <h5 style={{ fontWeight: '800', color: '#334155', fontSize: '14px', marginBottom: '12px' }}>
                        📋 Registro Accessi & Tracciabilità GDPR (Ultimi accessi dello Studio)
                    </h5>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="table table-condensed table-striped" style={{ fontSize: '12px' }}>
                            <thead>
                                <tr>
                                    <th>Data & Ora</th>
                                    <th>Studio Contabile</th>
                                    <th>Operatore</th>
                                    <th>Operazione</th>
                                    <th>IP Address</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.slice(0, 10).map((log, idx) => (
                                    <tr key={idx}>
                                        <td>{log.dt_accesso ? new Date(log.dt_accesso).toLocaleString() : 'N/D'}</td>
                                        <td>{log.ragione_sociale_studio || 'Studio Contabile'}</td>
                                        <td>{log.username_operatore}</td>
                                        <td>
                                            <span className="label label-info">{log.azione}</span>
                                        </td>
                                        <td><code>{log.ip_address || '127.0.0.1'}</code></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommercialistaSection;
