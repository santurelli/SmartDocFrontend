import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    FaTachometerAlt, FaThLarge, FaCubes, FaAngleRight, FaAngleDown,
    FaRegFileAlt, FaTable, FaGavel, FaDesktop, FaRegBookmark, FaChartBar, FaWrench, FaPowerOff, FaLock, FaUser, FaCircle
} from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = ({ user }) => {
    const [openMenus, setOpenMenus] = useState({});
    const navigate = useNavigate();

    const toggleMenu = (menuKey) => {
        setOpenMenus(prevState => {
            const isOpen = prevState[menuKey];
            return {
                [menuKey]: !isOpen
            };
        });
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const userName = user ? `${user.nome} ${user.cognome ? user.cognome.charAt(0) + '.' : ''}` : 'Utente';

    return (
        <div id="nav-col">
            <section id="col-left" className="col-left-nano">
                <div id="col-left-inner" className="col-left-nano-content">

                    {/* User Profile Box */}
                    <div id="user-left-box" className="clearfix hidden-sm hidden-xs dropdown profile2-dropdown">
                        <div className="user-avatar">
                            <FaUser />
                        </div>
                        <div className="user-box">
                            <span className="name">
                                {userName} <FaAngleDown style={{ fontSize: '10px', marginLeft: '3px' }} />
                            </span>
                            <span className="status">
                                <FaCircle style={{ color: '#8bc34a', fontSize: '8px', marginRight: '5px' }} />
                                Online
                            </span>
                        </div>
                    </div>

                    <div className="collapse navbar-collapse navbar-ex1-collapse" id="sidebar-nav">
                        <ul className="nav nav-pills nav-stacked">

                            <li className="nav-header nav-header-first hidden-sm hidden-xs">
                                Navigation
                            </li>

                            <li>
                                <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
                                    <span className="icon-container"><FaTachometerAlt /></span>
                                    <span className="text">Dashboard</span>
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/articoli" className={({ isActive }) => isActive ? "active" : ""}>
                                    <span className="icon-container"><FaThLarge /></span>
                                    <span className="text">Articoli</span>
                                </NavLink>
                            </li>

                            <li className={openMenus['magazzino'] ? 'open' : ''}>
                                <a href="#" className="dropdown-toggle" onClick={(e) => { e.preventDefault(); toggleMenu('magazzino'); }}>
                                    <span className="icon-container"><FaCubes /></span>
                                    <span className="text">Magazzino</span>
                                    <FaAngleRight className="drop-icon" />
                                </a>
                                <ul className="submenu">
                                    <li><NavLink to="/articoli/movimenti">Movimenti</NavLink></li>
                                    <li><NavLink to="/articoli/inventario">Inventario</NavLink></li>
                                </ul>
                            </li>

                            <li className={openMenus['documenti'] ? 'open' : ''}>
                                <a href="#" className="dropdown-toggle" onClick={(e) => { e.preventDefault(); toggleMenu('documenti'); }}>
                                    <span className="icon-container"><FaRegFileAlt /></span>
                                    <span className="text">Documenti</span>
                                    <FaAngleRight className="drop-icon" />
                                </a>
                                <ul className="submenu">
                                    <li><NavLink to="/preventivi">Preventivi</NavLink></li>
                                    <li><NavLink to="/documenti/ddt">Doc. trasporto</NavLink></li>
                                    <li><NavLink to="/documenti/fatture">Fatture/Note debito</NavLink></li>
                                    <li><NavLink to="/documenti/note-credito">Note di credito</NavLink></li>
                                    <li><NavLink to="/documenti/fatture-fornitore">Fatture fornitore</NavLink></li>
                                    <li><NavLink to="/documenti/note-credito-fornitore">Note credito fornitore</NavLink></li>
                                </ul>
                            </li>

                            <li>
                                <NavLink to="/prima-nota">
                                    <span className="icon-container"><FaTable /></span>
                                    <span className="text">Prima nota</span>
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/registri-iva">
                                    <span className="icon-container"><FaGavel /></span>
                                    <span className="text">Registri IVA</span>
                                </NavLink>
                            </li>

                            <li className={openMenus['datiGenerali'] ? 'open' : ''}>
                                <a href="#" className="dropdown-toggle" onClick={(e) => { e.preventDefault(); toggleMenu('datiGenerali'); }}>
                                    <span className="icon-container"><FaRegBookmark /></span>
                                    <span className="text">Dati generali</span>
                                    <FaAngleRight className="drop-icon" />
                                </a>
                                <ul className="submenu">
                                    <li><NavLink to="/clienti">Clienti</NavLink></li>
                                    <li><NavLink to="/fornitori">Fornitori</NavLink></li>
                                    <li><NavLink to="/dipendenti">Dipendenti</NavLink></li>
                                </ul>
                            </li>

                            <li className={openMenus['statistiche'] ? 'open' : ''}>
                                <a href="#" className="dropdown-toggle" onClick={(e) => { e.preventDefault(); toggleMenu('statistiche'); }}>
                                    <span className="icon-container"><FaChartBar /></span>
                                    <span className="text">Statistiche</span>
                                    <FaAngleRight className="drop-icon" />
                                </a>
                                <ul className="submenu">
                                    <li><NavLink to="/statistiche/progetti">Progetti</NavLink></li>
                                    <li><NavLink to="/statistiche/vendite">Vendite</NavLink></li>
                                    <li><NavLink to="/statistiche/acquisti">Acquisti</NavLink></li>
                                    <li><NavLink to="/statistiche/pagamenti">Pagamenti</NavLink></li>
                                </ul>
                            </li>

                            <li className={openMenus['configurazione'] ? 'open' : ''}>
                                <a href="#" className="dropdown-toggle" onClick={(e) => { e.preventDefault(); toggleMenu('configurazione'); }}>
                                    <span className="icon-container"><FaWrench /></span>
                                    <span className="text">Configurazione</span>
                                    <FaAngleRight className="drop-icon" />
                                </a>
                                <ul className="submenu">
                                    <li><NavLink to="/configurazione/dati-azienda">Dati azienda</NavLink></li>
                                    <li><NavLink to="/configurazione/dati-sistema">Dati sistema</NavLink></li>
                                </ul>
                            </li>

                        </ul>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Sidebar;
