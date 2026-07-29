import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import ConfigurazioneService from '../services/ConfigurazioneService';
import authService from '../services/authService';
import {
    FaTachometerAlt, FaThLarge, FaCubes, FaAngleRight, FaAngleDown,
    FaRegFileAlt, FaTable, FaGavel, FaDesktop, FaRegBookmark, FaChartBar, FaWrench, FaPowerOff, FaLock, FaUser, FaCircle, FaFileAlt, FaBell
} from 'react-icons/fa';
import TipiPagamentoManagementModal from './modals/TipiPagamentoManagementModal';
import UnitaMisuraManagementModal from './modals/UnitaMisuraManagementModal';
import AliquoteIvaManagementModal from './modals/AliquoteIvaManagementModal';
import './Sidebar.css';

const Sidebar = ({ user }) => {
    const [openMenus, setOpenMenus] = useState({});
    const [configs, setConfigs] = useState(null);
    const [showTipiPagamento, setShowTipiPagamento] = useState(false);
    const [showUnitaMisura, setShowUnitaMisura] = useState(false);
    const [showAliquoteIva, setShowAliquoteIva] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchConfigs = async () => {
            try {
                const res = await ConfigurazioneService.getAll();
                const data = res.data || res || [];
                const configMap = {};
                data.forEach(c => {
                    configMap[`${c.dominio}:${c.chiave}`] = c.valore;
                    if (c.dominio === 'DOCUMENTI') {
                        configMap[c.chiave] = c.valore;
                    }
                });
                setConfigs(configMap);
            } catch (err) {
                console.error("Error fetching sidebar configs:", err);
            }
        };
        fetchConfigs();

        window.addEventListener('configupdated', fetchConfigs);
        return () => window.removeEventListener('configupdated', fetchConfigs);
    }, []);

    const toggleMenu = (menuKey) => {
        setOpenMenus(prevState => ({
            [menuKey]: !prevState[menuKey]
        }));
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const isEnabled = (key, domain = 'DOCUMENTI') => {
        if (!configs) return true;
        
        const fullKey = key.includes(':') ? key : `${domain}:${key}`;
        
        // Se la chiave (con o senza dominio) esiste nella mappa, usiamo il suo valore
        if (configs[fullKey] !== undefined) {
            return configs[fullKey] === '1';
        }
        
        // Fallback per compatibilità con il dominio DOCUMENTI (senza prefisso nella mappa)
        if (configs[key] !== undefined) {
            return configs[key] === '1';
        }
        
        // Se la chiave è totalmente assente, la consideriamo abilitata di default
        return true;
    };

    const userName = user ? `${user.nome} ${user.cognome ? user.cognome.charAt(0) + '.' : ''}` : 'Utente';

    return (
        <div id="nav-col">
            <section id="col-left" className="col-left-nano">
                <div id="col-left-inner" className="col-left-nano-content">

                    {/* User Profile Box */}
                    <div id="user-left-box" className="clearfix hidden-sm hidden-xs dropdown profile2-dropdown">
                        <div className="user-avatar-initials">
                            {user && user.nome ? (user.nome[0] + (user.cognome ? user.cognome[0] : '')).toUpperCase() : 'U'}
                        </div>
                        <div className="user-box">
                            <span className="name">
                                {userName} <FaAngleDown style={{ fontSize: '10px', marginLeft: '3px', opacity: 0.7 }} />
                            </span>
                            <span className="status">
                                <FaCircle className="status-icon" /> Online
                            </span>
                        </div>
                    </div>

                    <div className="collapse navbar-collapse navbar-ex1-collapse" id="sidebar-nav">
                        <ul className="nav nav-pills nav-stacked">

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
                                    {isEnabled('ABILITA_PREVENTIVI') && <li><NavLink to="/preventivi">Preventivi</NavLink></li>}
                                    {isEnabled('ABILITA_CONF_ORDINE') && <li><NavLink to="/conf-ordine">Conferme d'ordine</NavLink></li>}
                                    {isEnabled('ABILITA_DDT') && <li><NavLink to="/ddt">Doc. trasporto</NavLink></li>}
                                    {(isEnabled('ABILITA_FATTURE') || isEnabled('ABILITA_NOTE_DEBITO') || isEnabled('ABILITA_FATTURE_PROFORMA') || isEnabled('ABILITA_FATTURE_ACCOMPAGNATORIE')) && (
                                        <li><NavLink to="/fatture">Fatture/Note debito</NavLink></li>
                                    )}
                                    {isEnabled('ABILITA_NOTE_CREDITO') && <li><NavLink to="/note-credito">Note di credito</NavLink></li>}
                                    {isEnabled('ABILITA_FATTURE_FORNITORE') && <li><NavLink to="/fatture-fornitore">Fatture fornitore</NavLink></li>}
                                    {isEnabled('ABILITA_NOTE_CREDITO_FORNITORE') && <li><NavLink to="/note-credito-fornitore">Note credito fornitore</NavLink></li>}
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

                            <li>
                                <NavLink to="/ritenute/770">
                                    <span className="icon-container"><FaFileAlt /></span>
                                    <span className="text">Prospetto 770</span>
                                </NavLink>
                            </li>

                            <li>
                                <NavLink to="/scadenzario/promemoria">
                                    <span className="icon-container"><FaBell /></span>
                                    <span className="text">Promemoria Scadenze</span>
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
                                    {isEnabled('DIPENDENTI', 'GLOBAL') && <li><NavLink to="/dipendenti">Dipendenti</NavLink></li>}
                                    <li><NavLink to="/configurazione/listini">Gestione listini</NavLink></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); setShowTipiPagamento(true); }}>Tipi pagamento</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); setShowUnitaMisura(true); }}>Unità di misura</a></li>
                                    <li><a href="#" onClick={(e) => { e.preventDefault(); setShowAliquoteIva(true); }}>Aliquote IVA</a></li>
                                </ul>
                            </li>

                            <li className={openMenus['statistiche'] ? 'open' : ''}>
                                <a href="#" className="dropdown-toggle" onClick={(e) => { e.preventDefault(); toggleMenu('statistiche'); }}>
                                    <span className="icon-container"><FaChartBar /></span>
                                    <span className="text">Statistiche</span>
                                    <FaAngleRight className="drop-icon" />
                                </a>
                                <ul className="submenu">
                                    {isEnabled('PROGETTI', 'GLOBAL') && <li><NavLink to="/statistiche/progetti">Progetti</NavLink></li>}
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
                                    <li><NavLink to="/configurazione/fatturazione">Fatturazione</NavLink></li>
                                    <li><NavLink to="/configurazione/documenti">Documenti</NavLink></li>
                                    <li><NavLink to="/configurazione/listini">Gestione listini</NavLink></li>
                                    <li><NavLink to="/configurazione/generali">Dati generali</NavLink></li>
                                    {(authService.getConfig()?.role === 'ROLE_ADMIN') && (
                                        <li><NavLink to="/configurazione/utenti">Gestione Utenti</NavLink></li>
                                    )}
                                </ul>
                            </li>

                        </ul>
                    </div>
                </div >
            </section >

            <TipiPagamentoManagementModal isOpen={showTipiPagamento} onClose={() => setShowTipiPagamento(false)} />
            <UnitaMisuraManagementModal isOpen={showUnitaMisura} onClose={() => setShowUnitaMisura(false)} />
            <AliquoteIvaManagementModal isOpen={showAliquoteIva} onClose={() => setShowAliquoteIva(false)} />
        </div >
    );
};

export default Sidebar;
