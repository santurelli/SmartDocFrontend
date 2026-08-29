import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';

const CompletaRegistrazione = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const db = searchParams.get('db');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            Swal.fire('Errore', 'Token di attivazione mancante o non valido.', 'error');
            return;
        }

        if (password.length < 6) {
            Swal.fire('Attenzione', 'La password deve contenere almeno 6 caratteri.', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            Swal.fire('Attenzione', 'Le password non coincidono.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const res = await api.post('/auth/completa-registrazione', {
                token,
                password,
                db
            });

            if (res.data && (res.data.success || res.status === 200)) {
                await Swal.fire({
                    title: 'Account Attivato!',
                    text: 'La tua password è stata impostata con successo. Ora puoi accedere a SmartDoc.',
                    icon: 'success',
                    confirmButtonText: 'Vai al Login'
                });
                navigate('/login');
            } else {
                Swal.fire('Errore', res.data || 'Errore durante l\'attivazione dell\'account.', 'error');
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.response?.data || 'Token non valido o già utilizzato.';
            Swal.fire('Attivazione fallita', typeof msg === 'string' ? msg : 'Errore durante l\'attivazione.', 'error');
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
                maxWidth: '460px',
                background: '#ffffff',
                borderRadius: '24px',
                padding: '36px 32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
                {/* Logo & Header */}
                <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{
                            width: '40px', height: '40px', background: '#2563eb', borderRadius: '12px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: '900', fontSize: '18px', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}>
                            SD
                        </div>
                        <span style={{ fontSize: '28px', fontWeight: '900', color: '#0f172a' }}>
                            Smart<span style={{ color: '#2563eb' }}>Doc</span>
                        </span>
                    </div>

                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#0f172a', margin: '8px 0 4px 0' }}>
                        Imposta la tua Password
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        Scegli una password per accedere al tuo nuovo account SmartDoc.
                    </p>
                </div>

                {!token ? (
                    <div style={{
                        padding: '16px',
                        borderRadius: '12px',
                        background: '#fef2f2',
                        border: '1px solid #fca5a5',
                        color: '#991b1b',
                        fontSize: '13px',
                        fontWeight: '600',
                        textAlign: 'center'
                    }}>
                        Token di attivazione non valido o mancante nell'URL.
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                                Nuova Password <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Inserisci almeno 6 caratteri..."
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                                Conferma Password <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <input
                                type="password"
                                placeholder="Ripeti la tua nuova password..."
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '8px',
                                width: '100%',
                                padding: '15px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: '#ffffff',
                                fontSize: '16px',
                                fontWeight: '800',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {loading ? 'Attivazione in corso...' : 'Attiva Account e Accedi 🚀'}
                        </button>
                    </form>
                )}

                {/* Footer link */}
                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: '#64748b' }}>
                    Torna al{' '}
                    <Link to="/login" style={{ color: '#2563eb', fontWeight: '700', textDecoration: 'none' }}>
                        Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CompletaRegistrazione;
