import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import Swal from 'sweetalert2';
import { FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const db = searchParams.get('db');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!token) {
            Swal.fire('Errore', 'Token di ripristino mancante o non valido.', 'error');
            return;
        }

        if (password.length < 6) {
            Swal.fire('Attenzione', 'La nuova password deve contenere almeno 6 caratteri.', 'warning');
            return;
        }

        if (password !== confirmPassword) {
            Swal.fire('Attenzione', 'Le password inserite non coincidono.', 'warning');
            return;
        }

        setLoading(true);
        try {
            const res = await authService.resetPassword(token, password, db);

            if (res.data && (res.data.success || res.status === 200)) {
                await Swal.fire({
                    title: 'Password Reimpostata!',
                    text: 'La tua password è stata aggiornata con successo. Ora puoi effettuare il login.',
                    icon: 'success',
                    confirmButtonText: 'Vai al Login'
                });
                navigate('/login');
            } else {
                Swal.fire('Errore', res.data || 'Errore durante il ripristino della password.', 'error');
            }
        } catch (err) {
            console.error(err);
            const msg = err.response?.data?.message || err.response?.data || 'Link di ripristino non valido o scaduto.';
            Swal.fire('Operazione non riuscita', typeof msg === 'string' ? msg : 'Errore durante il ripristino della password.', 'error');
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
                        Reimposta la tua Password
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        Inserisci la tua nuova password per accedere al tuo account SmartDoc.
                    </p>
                </div>

                {!token ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '15px', fontWeight: '600' }}>
                            Link non valido: il token di ripristino è mancante.
                        </div>
                        <Link to="/login" style={{
                            display: 'inline-block',
                            background: '#2563eb',
                            color: '#fff',
                            textDecoration: 'none',
                            padding: '10px 20px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}>
                            Torna al Login
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                                Nuova Password
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Almeno 6 caratteri"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 40px 12px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '14px',
                                        outline: 'none',
                                        transition: 'border-color 0.2s',
                                        boxSizing: 'border-box'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#94a3b8',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontSize: '16px'
                                    }}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                                Conferma Nuova Password
                            </label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                placeholder="Ripeti la password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    border: '1.5px solid #cbd5e1',
                                    fontSize: '14px',
                                    outline: 'none',
                                    transition: 'border-color 0.2s',
                                    boxSizing: 'border-box'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: '8px',
                                width: '100%',
                                padding: '14px',
                                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontWeight: '700',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                                transition: 'transform 0.1s, box-shadow 0.1s'
                            }}
                        >
                            {loading ? 'Aggiornamento in corso...' : 'Aggiorna Password'}
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '12px' }}>
                            <Link to="/login" style={{
                                color: '#64748b',
                                fontSize: '13px',
                                textDecoration: 'none',
                                fontWeight: '500'
                            }}>
                                ← Torna al Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
