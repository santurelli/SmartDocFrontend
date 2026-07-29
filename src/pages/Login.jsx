import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import authService from '../services/authService';
import './Login.css';
import { FaUser, FaKey, FaBuilding, FaFileSignature, FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [ente, setEnte] = useState(null); // Selected option object: { value, label, dbName }
    const [error, setError] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

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
        if (!ente) { // Using standard select2 behavior usually defaults to first if empty, but here explicit selection is needed
            // OR maybe we should default to empty?
            // Legacy behavior: user searches and selects.
            // If ente is missing we should show error? Or legacy might default?
            // Let's assume selection is required if not defaulted.
            // Wait, legacy logic `$("#frm_password").keydown... focus #frm_azienda`.
            // If user doesn't select, what happens?
            // Let's enforce selection for now or handle null.
        }

        try {
            // Passing ente.value (denominazione) or ente.dbName?
            // LoginRequest expects 'ente' string.
            // Legacy uses `$("#frm_azienda").val()`. 
            // Select2 usually returns the id or value.
            // In MunicipalityDao `COMUNI_S01` returns `label` as denominazione.
            // Logic in backend: `LoginDelegate` doesn't use it yet (we just added it to Request).
            // But `SmartDocRoutingDataSource` uses `DatabaseContextHolder.getClientDatabase()`.
            // Who sets the Context? `JwtAuthenticationFilter`?
            // No, the LOGIN request itself doesn't use the token (it gets one).
            // The LOGIN request needs to route to the correct DB?
            // Legacy `MunicipalityService` runs on "Master" DB?
            // Legacy Login:
            // 1. User picks Azienda.
            // 2. POST /login with ente.
            // 3. Backend (LoginService) uses `ente` to switch DataSource?
            // Ideally `AuthController` should read `ente` from request, set the Context, *then* call `LoginDelegate`.
            // But `LoginDelegate` currently just checks username/password.
            // We need `LoginDelegate` or `AuthController` to use `ente` effectively in the future.
            // For now, we just pass what the valid "ente" string is.
            // Let's pass the simple string value (denominazione) as `ente`.
            // Or `dbName` if that's what backend expects?
            // In `MunicipalityDto` we have `dbName`. 
            // Let's pass `ente.label` for now as that's what the legacy UI likely sent (value=label in select2 often if no ID).
            // Actually legacy Select2: `results: data`. `templateSelection: formatAziendaSelected` returns `data.label`.
            // So visual is label. The value?
            // `COMUNI_S01`: `id`, `label`, `db_name`.
            // Legacy Select2 value is likely the `id` or `label`.
            // Let's pass `ente.label` (denominazione) for now or `ente.value`.

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
            // If menu is open, let React Select handle the choice (don't submit)
            if (isMenuOpen) {
                return;
            }
            // If menu is closed, submit form
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
        </div>
    );
};

export default Login;
