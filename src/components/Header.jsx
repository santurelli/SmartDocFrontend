import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FaBars, FaCaretDown, FaThLarge, FaEdit, FaUser, FaTruck, FaLock, FaPowerOff, FaCogs, FaFileSignature } from 'react-icons/fa';
import authService from '../services/authService';
import './Header.css';

const Header = ({ user, onLogout, toggleSidebar }) => {
    const navigate = useNavigate();
    const [inserisciOpen, setInserisciOpen] = useState(false);
    const [userOpen, setUserOpen] = useState(false);

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    const userName = user ? `${user.nome} ${user.cognome}` : 'Utente';

    return (
        <header className="navbar" id="header-navbar">
            <div className="container">
                <div className="navbar-brand" id="logo">
                    <FaFileSignature style={{ fontSize: '1.5em', marginRight: '10px' }} />
                    <span className="logo-text">SmartDOC</span>
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
                                        <li className="item">
                                            <NavLink to="/nuovo-articolo" onClick={() => setInserisciOpen(false)}>
                                                <FaThLarge /> Nuovo articolo
                                            </NavLink>
                                        </li>
                                        <li className="item">
                                            <NavLink to="/nuova-fattura" onClick={() => setInserisciOpen(false)}>
                                                <FaEdit /> Nuova fattura
                                            </NavLink>
                                        </li>
                                        <li className="item">
                                            <NavLink to="/nuovo-cliente" onClick={() => setInserisciOpen(false)}>
                                                <FaUser /> Nuovo cliente
                                            </NavLink>
                                        </li>
                                        <li className="item">
                                            <NavLink to="/nuovo-fornitore" onClick={() => setInserisciOpen(false)}>
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
                                        <li><a href="#" className="change-pwd" onClick={(e) => { e.preventDefault(); alert('Change Password unimplemented'); setUserOpen(false); }}><FaLock /> Cambia password</a></li>
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
        </header>
    );
};

export default Header;
