import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import authService from '../services/authService';
import './Login.css';
import { FaUser, FaKey, FaBuilding, FaFileSignature, FaEye, FaEyeSlash, FaTimes, FaCheckCircle, FaSpinner } from 'react-icons/fa';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [ente, setEnte] = useState(null); // Selected option object: { value, label, dbName }
    const [error, setError] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Password dimenticata modal state
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotUsername, setForgotUsername] = useState('');
    const [forgotEnte, setForgotEnte] = useState(null);
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotError, setForgotError] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);

    // Pre-seleziona l'azienda quando si arriva da un link di invito (es. email nuovo utente)
    useEffect(() => {
        const entedb = searchParams.get('entedb');
        const entelabel = searchParams.get('entelabel');
        if (entedb && entelabel) {
            setEnte({ value: entelabel, label: entelabel, dbName: entedb });
        }
    }, [searchParams]);

    // Load options for AsyncSelect
    const loadOptions = (inputValue, callback) => {
        authService.getMunicipalities(inputValue).then(options => {
            callback(options);
        });
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!username.trim()) {
            setError('Il campo Username non può essere vuoto.');
            return;
        }
        if (!password.trim()) {
            setError('Il campo Password non può essere vuoto.');
            return;
        }

        try {
            await authService.login(username, password, ente ? ente.dbName : '');
            navigate('/');
        } catch (err) {
            console.error("Login Error:", err);
            if (err.response && (err.response.status === 401 || (err.response.data && err.response.data.erroreUtenteNonTrovato))) {
                setError('Nessun utente corrispondente alla coppia username/password inserita.');
            } else {
                setError('Errore generico durante il login.');
            }
        }
    };

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setForgotError('');
        setForgotSuccess(false);

        if (!forgotUsername.trim()) {
            setForgotError('Inserisci il tuo username o indirizzo email.');
            return;
        }
        if (!forgotEnte || !forgotEnte.dbName) {
            setForgotError('Seleziona la tua azienda.');
            return;
        }

        setForgotLoading(true);
        try {
            await authService.forgotPassword(forgotUsername.trim(), forgotEnte.dbName);
            setForgotSuccess(true);
        } catch (err) {
            console.error("Forgot password error:", err);
            const msg = err.response?.data?.message || err.response?.data;
            setForgotError(typeof msg === 'string' ? msg : 'Errore durante la richiesta di recupero password.');
        } finally {
            setForgotLoading(false);
        }
    };

    // Custom styles for react-select to match legacy input height (48px) and colors
    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            height: '48px',
            minHeight: '48px',
            borderRadius: '4px',
            borderTopLeftRadius: '0',
            borderBottomLeftRadius: '0',
            borderColor: '#dfe4e7',
            boxShadow: 'none',
            '&:hover': {
                borderColor: '#03a9f4'
            },
            backgroundColor: '#fff'
        }),
        valueContainer: (provided, state) => ({
            ...provided,
            height: '48px',
            padding: '0 12px'
        }),
        input: (provided, state) => ({
            ...provided,
            margin: '0px',
        }),
        indicatorSeparator: state => ({
            display: 'none',
        }),
        indicatorsContainer: (provided, state) => ({
            ...provided,
            height: '48px',
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 9999
        })
    };

    const modalSelectStyles = {
        control: (provided) => ({
            ...provided,
            height: '42px',
            minHeight: '42px',
            borderRadius: '8px',
            borderColor: '#cbd5e1',
            boxShadow: 'none',
            fontSize: '14px',
            '&:hover': {
                borderColor: '#03a9f4'
            }
        }),
        valueContainer: (provided) => ({
            ...provided,
            height: '42px',
            padding: '0 12px'
        }),
        indicatorsContainer: (provided) => ({
            ...provided,
            height: '42px',
        }),
        menu: (provided) => ({
            ...provided,
            zIndex: 10001
        })
    };

    const passwordRef = React.useRef(null);
    const aziendaRef = React.useRef(null);

    const handleKeyDown = (e, nextFieldRef) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextFieldRef && nextFieldRef.current) {
                nextFieldRef.current.focus();
            }
        }
    };

    const handleAziendaKeyDown = (e) => {
        if (e.key === 'Enter') {
            if (isMenuOpen) {
                return;
            }
            handleLogin(e);
        }
    };

    return (
        <div id="login-page">
            <div className="container">
                <div className="row">
                    <div className="col-xs-12">
                        <div id="login-box">
                            <div id="login-box-header">
                                <div className="login-box-header-red"></div>
                                <div className="login-box-header-green"></div>
                                <div className="login-box-header-yellow"></div>
                                <div className="login-box-header-purple"></div>
                                <div className="login-box-header-blue"></div>
                                <div className="login-box-header-gray"></div>
                            </div>
                            <div id="login-box-holder">
                                <div className="row">
                                    <div className="col-xs-12">
                                        <header id="login-header">
                                            <div id="login-logo">
                                                <FaFileSignature style={{ fontSize: '2.5em', marginBottom: '10px' }} />
                                                <div style={{ fontWeight: '700', letterSpacing: '2px', fontSize: '1.2em' }}>SmartDOC</div>
                                            </div>
                                        </header>
                                        <div id="login-box-inner">
                                            <form role="form" onSubmit={handleLogin}>
                                                <div className="flex-input-group" id="grp_username">
                                                    <span className="input-group-addon"><FaUser /></span>
                                                    <input
                                                        className="form-control"
                                                        type="text"
                                                        id="frm_username"
                                                        placeholder="Username"
                                                        value={username}
                                                        onChange={(e) => setUsername(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                                                        autoFocus
                                                        autoCapitalize="none"
                                                        autoCorrect="off"
                                                        spellCheck="false"
                                                    />
                                                </div>
                                                <div className="flex-input-group" id="grp_password">
                                                    <span className="input-group-addon"><FaKey /></span>
                                                    <input
                                                        type={showPassword ? 'text' : 'password'}
                                                        className="form-control"
                                                        id="frm_password"
                                                        placeholder="Password"
                                                        value={password}
                                                        onChange={(e) => setPassword(e.target.value)}
                                                        ref={passwordRef}
                                                        onKeyDown={(e) => handleKeyDown(e, aziendaRef)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="input-group-addon"
                                                        onClick={() => setShowPassword(v => !v)}
                                                        tabIndex="-1"
                                                        style={{ cursor: 'pointer', background: 'none', border: 'none', color: '#888' }}
                                                        title={showPassword ? 'Nascondi password' : 'Mostra password'}
                                                    >
                                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                    </button>
                                                </div>
                                                <div className="flex-input-group" id="grp_azienda">
                                                    <span className="input-group-addon"><FaBuilding /></span>
                                                    <div style={{ flexGrow: 1 }}>
                                                        <AsyncSelect
                                                            ref={aziendaRef}
                                                            cacheOptions
                                                            defaultOptions
                                                            loadOptions={loadOptions}
                                                            onChange={setEnte}
                                                            onKeyDown={handleAziendaKeyDown}
                                                            value={ente}
                                                            placeholder="Seleziona Azienda..."
                                                            noOptionsMessage={() => "Inserisci nome azienda..."}
                                                            styles={customStyles}
                                                            components={{ DropdownIndicator: () => null, IndicatorSeparator: () => null }}
                                                            openMenuOnFocus
                                                            onMenuOpen={() => setIsMenuOpen(true)}
                                                            onMenuClose={() => setIsMenuOpen(false)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Link Password Dimenticata */}
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px', marginBottom: '14px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setForgotUsername(username);
                                                            setForgotEnte(ente);
                                                            setForgotError('');
                                                            setForgotSuccess(false);
                                                            setShowForgotModal(true);
                                                        }}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            padding: 0,
                                                            color: '#03a9f4',
                                                            fontSize: '13px',
                                                            cursor: 'pointer',
                                                            fontWeight: '500',
                                                            textDecoration: 'none'
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                        onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                                    >
                                                        Password dimenticata?
                                                    </button>
                                                </div>

                                                {error && (
                                                    <div className="alert alert-danger" style={{ marginTop: '10px', color: '#a94442', backgroundColor: '#f2dede', borderColor: '#ebccd1', padding: '15px', borderRadius: '4px' }}>
                                                        {error}
                                                    </div>
                                                )}

                                                <div className="row">
                                                    <div className="col-xs-12">
                                                        <button type="submit" id="btn_login" className="btn btn-success col-xs-12">Login</button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Password Dimenticata */}
            {showForgotModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(4px)',
                    zIndex: 10000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '16px'
                }}>
                    <div style={{
                        background: '#ffffff',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '460px',
                        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        {/* Header Modale */}
                        <div style={{
                            padding: '18px 24px',
                            borderBottom: '1px solid #e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: '#f8fafc'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                                Recupero Password
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowForgotModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#64748b',
                                    cursor: 'pointer',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '4px'
                                }}
                            >
                                <FaTimes />
                            </button>
                        </div>

                        {/* Corpo Modale */}
                        <div style={{ padding: '24px' }}>
                            {forgotSuccess ? (
                                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                                    <FaCheckCircle style={{ color: '#10b981', fontSize: '48px', marginBottom: '16px' }} />
                                    <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '8px' }}>
                                        Email Inviata!
                                    </h4>
                                    <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                                        Se i dati inseriti sono corretti, abbiamo inviato un'email con il link sicuro per reimpostare la password.
                                        Controlla la tua casella di posta (e la cartella spam).
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotModal(false)}
                                        style={{
                                            background: '#2563eb',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '10px 24px',
                                            borderRadius: '8px',
                                            fontWeight: '600',
                                            fontSize: '14px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Chiudi
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleForgotPassword}>
                                    <p style={{ color: '#475569', fontSize: '14px', lineHeight: '1.5', marginTop: 0, marginBottom: '20px' }}>
                                        Inserisci il tuo username o indirizzo email e seleziona la tua azienda. Ti invieremo un link per reimpostare la password.
                                    </p>

                                    <div style={{ marginBottom: '16px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                                            Username o Email
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Inserisci il tuo username o email"
                                            value={forgotUsername}
                                            onChange={(e) => setForgotUsername(e.target.value)}
                                            style={{
                                                height: '42px',
                                                borderRadius: '8px',
                                                border: '1px solid #cbd5e1',
                                                padding: '0 12px',
                                                fontSize: '14px',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}
                                            autoFocus
                                        />
                                    </div>

                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>
                                            Azienda
                                        </label>
                                        <AsyncSelect
                                            cacheOptions
                                            defaultOptions
                                            loadOptions={loadOptions}
                                            onChange={setForgotEnte}
                                            value={forgotEnte}
                                            placeholder="Seleziona Azienda..."
                                            noOptionsMessage={() => "Digita per cercare azienda..."}
                                            styles={modalSelectStyles}
                                            openMenuOnFocus
                                        />
                                    </div>

                                    {forgotError && (
                                        <div style={{
                                            color: '#b91c1c',
                                            backgroundColor: '#fef2f2',
                                            border: '1px solid #fecaca',
                                            padding: '10px 14px',
                                            borderRadius: '8px',
                                            fontSize: '13px',
                                            marginBottom: '16px'
                                        }}>
                                            {forgotError}
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(false)}
                                            style={{
                                                background: '#f1f5f9',
                                                color: '#475569',
                                                border: '1px solid #e2e8f0',
                                                padding: '10px 18px',
                                                borderRadius: '8px',
                                                fontWeight: '600',
                                                fontSize: '14px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            Annulla
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={forgotLoading}
                                            style={{
                                                background: forgotLoading ? '#94a3b8' : '#2563eb',
                                                color: '#ffffff',
                                                border: 'none',
                                                padding: '10px 20px',
                                                borderRadius: '8px',
                                                fontWeight: '600',
                                                fontSize: '14px',
                                                cursor: forgotLoading ? 'not-allowed' : 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            {forgotLoading && <FaSpinner className="fa-spin" />}
                                            {forgotLoading ? 'Invio in corso...' : 'Invia link di reset'}
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
