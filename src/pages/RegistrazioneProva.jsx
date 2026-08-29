import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

const RegistrazioneProva = () => {
    const [searchParams] = useSearchParams();
    const initialPlan = searchParams.get('plan') || '3';
    const isStudioParam = searchParams.get('type') === 'studio';
    const navigate = useNavigate();

    const [accountCategory, setAccountCategory] = useState(isStudioParam ? 'STUDIO' : 'AZIENDA');
    const [ragioneSociale, setRagioneSociale] = useState('');
    const [partitaIva, setPartitaIva] = useState('');
    const [email, setEmail] = useState('');
    const [tipoAccount, setTipoAccount] = useState(isStudioParam ? '5' : initialPlan);
    const [loading, setLoading] = useState(false);

    const handleCategoryChange = (cat) => {
        setAccountCategory(cat);
        if (cat === 'STUDIO') {
            setTipoAccount('5');
        } else {
            setTipoAccount(initialPlan);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!ragioneSociale || !partitaIva || !email) {
            Swal.fire('Attenzione', 'Compila tutti i campi obbligatori.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const finalAccountType = accountCategory === 'STUDIO' ? 5 : parseInt(tipoAccount);
            const res = await api.post('/auth/registrazione-prova', {
                ragioneSociale,
                partitaIva,
                email,
                tipoAccount: finalAccountType
            });

            if (res.data && (res.data.success || res.status === 200)) {
                await Swal.fire({
                    title: accountCategory === 'STUDIO' ? 'Studio Contabile Attivato! 💼' : 'Prova Gratuita Attivata! 🚀',
                    text: `Abbiamo inviato un'email a ${email}. Clicca sul link nell'email per impostare la tua password ed accedere!`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                navigate('/login');
            } else {
                Swal.fire('Errore', res.data || 'Errore durante la registrazione.', 'error');
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.response?.data || 'Errore durante la registrazione.';
            Swal.fire('Registrazione fallita', typeof msg === 'string' ? msg : 'Dati non validi o già presenti.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(circle at top right, #1e40af 0%, #1e3a8a 40%, #0f172a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px 16px',
            fontFamily: "'Inter', system-ui, sans-serif"
        }}>
            <div style={{
                width: '100%',
                maxWidth: '500px',
                background: '#ffffff',
                borderRadius: '24px',
                padding: '36px 32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                {/* TAB SELECTOR: AZIENDA vs STUDIO */}
                <div style={{
                    display: 'flex',
                    background: '#f1f5f9',
                    borderRadius: '14px',
                    padding: '4px',
                    marginBottom: '24px'
                }}>
                    <button
                        type="button"
                        onClick={() => handleCategoryChange('AZIENDA')}
                        style={{
                            flex: 1,
                            padding: '10px 12px',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '13px',
                            cursor: 'pointer',
                            background: accountCategory === 'AZIENDA' ? '#ffffff' : 'transparent',
                            color: accountCategory === 'AZIENDA' ? '#2563eb' : '#64748b',
                            boxShadow: accountCategory === 'AZIENDA' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        🏢 Azienda / Professionista
                    </button>
                    <button
                        type="button"
                        onClick={() => handleCategoryChange('STUDIO')}
                        style={{
                            flex: 1,
                            padding: '10px 12px',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '800',
                            fontSize: '13px',
                            cursor: 'pointer',
                            background: accountCategory === 'STUDIO' ? '#ffffff' : 'transparent',
                            color: accountCategory === 'STUDIO' ? '#d97706' : '#64748b',
                            boxShadow: accountCategory === 'STUDIO' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        💼 Studio Contabile (Gratis)
                    </button>
                </div>

                {/* Logo & Header */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', background: '#2563eb', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: '900', fontSize: '18px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}>
                            SD
                        </div>
                        <span style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a', tracking: '-0.5px' }}>
                            Smart<span style={{ color: '#2563eb' }}>Doc</span>
                        </span>
                    </div>

                    <div>
                        {accountCategory === 'AZIENDA' ? (
                            <span style={{
                                background: '#fef3c7', color: '#92400e', fontWeight: '800', fontSize: '11px',
                                padding: '6px 14px', borderRadius: '20px', display: 'inline-block', letterSpacing: '0.5px', textTransform: 'uppercase'
                            }}>
                                🎁 PROVA GRATIS PER 3 MESI — €0,00
                            </span>
                        ) : (
                            <span style={{
                                background: '#d1fae5', color: '#047857', fontWeight: '800', fontSize: '11px',
                                padding: '6px 14px', borderRadius: '20px', display: 'inline-block', letterSpacing: '0.5px', textTransform: 'uppercase'
                            }}>
                                💼 PORTALE STUDIO CONTABILE — 100% GRATIS PER IL COMMERCIALISTA
                            </span>
                        )}
                    </div>

                    <p style={{ marginTop: '12px', color: '#64748b', fontSize: '14px', lineHeight: '1.5' }}>
                        {accountCategory === 'AZIENDA' ? (
                            <>Inizia subito i tuoi 90 giorni di prova completa.<br/><strong style={{ color: '#334155' }}>Nessuna carta di credito richiesta.</strong></>
                        ) : (
                            <>Attiva il tuo pannello multi-aziendale e collega le aziende dei tuoi clienti.<br/><strong style={{ color: '#334155' }}>Gratuito per sempre per lo Studio.</strong></>
                        )}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                            {accountCategory === 'STUDIO' ? 'Nome dello Studio Contabile / Ragione Sociale' : 'Ragione Sociale / Nome Attività'} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            placeholder={accountCategory === 'STUDIO' ? 'Es. Studio Rossi & Associati' : 'Es. Mario Rossi S.r.l.'}
                            value={ragioneSociale}
                            onChange={(e) => setRagioneSociale(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                            {accountCategory === 'STUDIO' ? 'Partita IVA dello Studio / Codice Fiscale' : 'Partita IVA / Codice Fiscale'} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Es. 12345678901"
                            value={partitaIva}
                            onChange={(e) => setPartitaIva(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                            {accountCategory === 'STUDIO' ? 'Email Referente Studio' : 'Email'} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                            type="email"
                            placeholder={accountCategory === 'STUDIO' ? 'dove riceverai il link di attivazione dello studio...' : 'dove riceverai il link di attivazione...'}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '12px 14px',
                                borderRadius: '12px',
                                border: '1.5px solid #cbd5e1',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {accountCategory === 'AZIENDA' ? (
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                Piano Scelto (3 Mesi a €0,00)
                            </label>
                            <select
                                value={tipoAccount}
                                onChange={(e) => setTipoAccount(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #cbd5e1',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    backgroundColor: '#f8fafc',
                                    outline: 'none',
                                    cursor: 'pointer',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <option value="1">Smart — Fatture SDI Illimitate (€1,90/m dopo prova)</option>
                                <option value="3">Professional — Preventivi, DDT & API POS (€4,90/m dopo prova)</option>
                                <option value="4">Enterprise — Magazzino, LIPE & Prima Nota (€9,90/m dopo prova)</option>
                            </select>
                        </div>
                    ) : (
                        <div style={{
                            background: '#ecfdf5',
                            border: '1px solid #a7f3d0',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            fontSize: '13px',
                            color: '#065f46',
                            fontWeight: '700'
                        }}>
                            ✓ Dashboard Studio Multi-Tenant (Incluso Gratis per sempre)
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: '8px',
                            width: '100%',
                            padding: '15px',
                            borderRadius: '12px',
                            border: 'none',
                            background: accountCategory === 'STUDIO'
                                ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            color: '#ffffff',
                            fontSize: '16px',
                            fontWeight: '900',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 10px 20px -5px rgba(5, 150, 105, 0.4)',
                            transition: 'all 0.2s transform'
                        }}
                    >
                        {loading ? 'Attivazione in corso...' : accountCategory === 'STUDIO' ? 'Attiva Studio Contabile Gratis 💼' : 'Attiva i tuoi 3 Mesi Gratis 🚀'}
                    </button>
                </form>

                {/* Footer link */}
                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                    Hai già un account?{' '}
                    <Link to="/login" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
                        Accedi qui
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default RegistrazioneProva;
