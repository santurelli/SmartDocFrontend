import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaCaretDown, FaThLarge, FaEdit, FaUser, FaTruck, FaLock, FaPowerOff, FaCogs, FaFileSignature, FaPlus } from 'react-icons/fa';
import authService from '../services/authService';
import authStorage from '../services/authStorage';
import ConfigurazioneService from '../services/ConfigurazioneService';
import ChangePasswordModal from './modals/ChangePasswordModal';
import './Header.css';

const Header = ({ user, onLogout, toggleSidebar }) => {
    const navigate = useNavigate();
    const [inserisciOpen, setInserisciOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [docConfigs, setDocConfigs] = useState(null);

    useEffect(() => {
        const fetchDocConfigs = async () => {
            try {
                const res = await ConfigurazioneService.getByDomain('DOCUMENTI');
                if (res.data) setDocConfigs(res.data);
            } catch (err) {
                console.error("Error fetching header configs:", err);
            }
        };
        fetchDocConfigs();

        window.addEventListener('configupdated', fetchDocConfigs);
        return () => window.removeEventListener('configupdated', fetchDocConfigs);
    }, []);

    const isEnabled = (key) => !docConfigs || docConfigs[key] === '1';

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    const userName = user ? `${user.nome} ${user.cognome}` : 'Utente';
    const appConfig = authService.getConfig();
    const enteLabel = appConfig?.enteLabel || '';

    return (
        <header className="navbar" id="header-navbar">
            <div className="container">
                <div className="navbar-brand" id="logo">
                    <FaFileSignature style={{ fontSize: '1.5em', marginRight: '10px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                        <span className="logo-text">SmartDOC</span>
                        {enteLabel && (
                            <span style={{ fontSize: '0.65em', color: '#a0b4c3', fontWeight: 400, letterSpacing: '0.02em' }}>{enteLabel}</span>
                        )}
                    </div>
                </div>

                <div className="clearfix">
                    <button className="navbar-toggle" type="button" onClick={toggleSidebar}>
                        <FaBars />
                    </button>

                    <div className="nav-no-collapse navbar-left pull-left hidden-sm hidden-xs">
                        <ul className="nav navbar-nav pull-left">
                            <li className={`dropdown hidden-xs ${inserisciOpen ? 'open' : ''}`}>
                                <a className="btn dropdown-toggle" onClick={() => setInserisciOpen(!inserisciOpen)}>
                                    Inserisci <FaCaretDown />
                                </a>
                                {inserisciOpen && (
                                    <ul className="dropdown-menu">
                                        {/* DOCUMENTI SECTION */}
                                        {isEnabled('ABILITA_FATTURE') && (
                                            <li className="item">
                                                <NavLink to="/fatture/new?tipo=FATTURA&elet=1" onClick={() => setInserisciOpen(false)}>
                                                    <FaPlus /> Nuova fattura
                                                </NavLink>
                                            </li>
                                        )}
                                        {isEnabled('ABILITA_FATTURE_ACCOMPAGNATORIE') && (
                                            <li className="item">
                                                <NavLink to="/fatture/new?tipo=FATTURA_ACCOMPAGNATORIA&elet=1" onClick={() => setInserisciOpen(false)}>
                                                    <FaPlus /> Nuova accomp. elettr.
                                                </NavLink>
                                            </li>
                                        )}
                                        {isEnabled('ABILITA_FATTURE_PROFORMA') && (
                                            <li className="item">
                                                <NavLink to="/fatture/new?tipo=FATTURA_PROFORMA" onClick={() => setInserisciOpen(false)}>
                                                    <FaPlus /> Nuova proforma
                                                </NavLink>
                                            </li>
                                        )}

                                        {/* DIVIDER IF DOCUMENTS ENABLED */}
                                        {(isEnabled('ABILITA_FATTURE') || isEnabled('ABILITA_FATTURE_ACCOMPAGNATORIE') || isEnabled('ABILITA_FATTURE_PROFORMA')) && (
                                            <li className="divider"></li>
                                        )}

                                        {/* ANAGRAFICHE SECTION */}
                                        <li className="item">
                                            <NavLink to="/clienti/new" onClick={() => setInserisciOpen(false)}>
                                                <FaUser /> Nuovo cliente
                                            </NavLink>
                                        </li>
                                        <li className="item">
                                            <NavLink to="/articoli/new" onClick={() => setInserisciOpen(false)}>
                                                <FaThLarge /> Nuovo articolo
                                            </NavLink>
                                        </li>
                                        <li className="item">
                                            <NavLink to="/fornitori/new" onClick={() => setInserisciOpen(false)}>
                                                <FaTruck /> Nuovo fornitore
                                            </NavLink>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        </ul>
                    </div>

                    <div className="nav-no-collapse pull-right" id="header-nav">
                        <ul className="nav navbar-nav pull-right">
                            <li className={`dropdown profile-dropdown ${userOpen ? 'open' : ''}`}>
                                <a href="#" className="dropdown-toggle" onClick={(e) => { e.preventDefault(); setUserOpen(!userOpen); }}>
                                    <div className="user-avatar-small">
                                        {user && user.nome ? (user.nome[0] + (user.cognome ? user.cognome[0] : '')).toUpperCase() : 'U'}
                                    </div>
                                    <span className="hidden-xs">{userName}</span> <b className="caret"></b>
                                </a>
                                {userOpen && (
                                    <ul className="dropdown-menu dropdown-menu-right">
                                        <li><a href="#" className="change-pwd" onClick={(e) => { e.preventDefault(); setIsChangePasswordOpen(true); setUserOpen(false); }}><FaLock /> Cambia password</a></li>
                                        <li><a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}><FaPowerOff /> Logout</a></li>
                                    </ul>
                                )}
                            </li>
                            <li className="hidden-xxs">
                                <a className="btn" onClick={handleLogout}>
                                    <FaPowerOff />
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
            <ChangePasswordModal 
                isOpen={isChangePasswordOpen} 
                onClose={() => setIsChangePasswordOpen(false)} 
            />
        </header>
    );
};

export default Header;
