import React, { useState, useEffect } from 'react';
import ArticoliService from '../../services/ArticoliService';
import CategorieArticoliService from '../../services/CategorieArticoliService';
import { useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaSearch, FaChevronLeft, FaChevronRight, FaEdit, FaCog, FaTrash, FaHome, FaAngleRight } from 'react-icons/fa';
import Swal from 'sweetalert2';
import FornitoriService from '../../services/FornitoriService';
import AuthService from '../../services/authService';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import CaricoMagazzinoModal from './CaricoMagazzinoModal';
import ScaricoMagazzinoModal from './ScaricoMagazzinoModal';
import RettificaMagazzinoModal from './RettificaMagazzinoModal';
import storageHelper from '../../utils/storageHelper';
import './ArticoliList.css';

const MODULE_NAME = 'articoli';

const ArticoliList = () => {
    // Load initial state from sessionStorage
    const initialState = storageHelper.loadState(MODULE_NAME, {
        search: '',
        idCategoria: '',
        page: 0,
        pageSize: 50,
        sortCol: 1,
        sortDir: 'asc',
        showAdvancedSearch: false,
        advancedFilters: {
            giacenza: '',
            operatoreGiacenza: '>=',
            idFornitore: null,
            descFornitore: '',
            idTono: '',
            idCalibro: '',
            idFormato: '',
            idScelta: ''
        }
    });

    const [articoli, setArticoli] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState(initialState.search);
    const [idCategoria, setIdCategoria] = useState(initialState.idCategoria);
    const [categorie, setCategorie] = useState([]);
    const [page, setPage] = useState(initialState.page);
    const [pageSize, setPageSize] = useState(initialState.pageSize);
    const [totalItems, setTotalItems] = useState(0);
    const [sortCol, setSortCol] = useState(initialState.sortCol);
    const [sortDir, setSortDir] = useState(initialState.sortDir);
    const [activeDropdownId, setActiveDropdownId] = useState(null);
    const [showCaricoModal, setShowCaricoModal] = useState(false);
    const [showScaricoModal, setShowScaricoModal] = useState(false);
    const [showRettificaModal, setShowRettificaModal] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    // Advanced Search State
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(initialState.showAdvancedSearch);
    const [advancedFilters, setAdvancedFilters] = useState(initialState.advancedFilters);
    const [config, setConfig] = useState({});
    const [combos, setCombos] = useState({
        toni: [],
        calibri: [],
        formati: [],
        scelte: []
    });

    // Save state whenever filters or pagination change
    useEffect(() => {
        storageHelper.saveState(MODULE_NAME, {
            search,
            idCategoria,
            page,
            pageSize,
            sortCol,
            sortDir,
            showAdvancedSearch,
            advancedFilters
        });
    }, [search, idCategoria, page, pageSize, sortCol, sortDir, showAdvancedSearch, advancedFilters]);

    const navigate = useNavigate();

    useEffect(() => {
        fetchCategorie();
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            const res = await ConfigurazioneService.getByDomain('GLOBAL');
            const data = res.data?.payload || res.data || {};

            let isCeramica = false;
            if (Array.isArray(data)) {
                isCeramica = data.some(c => (c.chiave === 'TIPO_STORE' || c.chiave === 'TIPOSTORE') && c.valore === 'CERAMICA');
            } else {
                // It's a Map<String, String>
                isCeramica = data['TIPO_STORE'] === 'CERAMICA' || data['TIPOSTORE'] === 'CERAMICA';
            }

            // Fallback to Auth config
            if (!isCeramica) {
                const authConfig = AuthService.getConfig();
                isCeramica = authConfig['TIPOSTORE'] === 'CERAMICA' || authConfig['TIPO_STORE'] === 'CERAMICA';
            }

            setConfig(prev => ({ ...prev, isCeramica }));

            if (isCeramica) {
                loadCeramicaCombos();
            }
        } catch (error) {
            console.error("Errore caricamento configurazione", error);
        }
    };

    const loadCeramicaCombos = async () => {
        try {
            const [toniRes, calibriRes, formatiRes, scelteRes] = await Promise.all([
                ArticoliService.getToni(),
                ArticoliService.getCalibri(),
                ArticoliService.getFormati(),
                ArticoliService.getScelte()
            ]);
            setCombos({
                toni: toniRes.data.payload || [],
                calibri: calibriRes.data.payload || [],
                formati: formatiRes.data.payload || [],
                scelte: scelteRes.data.payload || []
            });
        } catch (e) {
            console.error("Error loading ceramic combos", e);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchArticoli();
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [search, page, pageSize, idCategoria, sortCol, sortDir, JSON.stringify(advancedFilters)]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown-container') && !event.target.closest('.custom-dropdown-menu')) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleGearClick = (e, art) => {
        e.stopPropagation();
        if (activeDropdownId === art.id) {
            setActiveDropdownId(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        // Calculate position: top = bottom of button, left = right of button - width of menu (approx 250px)
        // Adjust if it goes off screen? For now standard right-alignment.
        const menuWidth = 250;
        setDropdownPosition({
            top: rect.bottom,
            left: rect.left - (menuWidth - rect.width) // Align right edges: left = rect.right - menuWidth
        });
        setActiveDropdownId(art.id);
    };

    const fetchCategorie = async () => {
        try {
            const response = await CategorieArticoliService.getListForCombo();
            if (response.data.payload) {
                setCategorie(response.data.payload);
            }
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    }

    const fetchArticoli = async () => {
        setLoading(true);
        try {
            const response = await ArticoliService.getList({
                start: page * pageSize,
                length: pageSize,
                search: search,
                categoria: idCategoria || '0',
                orderColumn: sortCol,
                orderDir: sortDir,
                // Advanced Filters
                giacenza: advancedFilters.giacenza || null,
                operatoreGiacenza: advancedFilters.operatoreGiacenza,
                idFornitore: advancedFilters.idFornitore,
                idTono: advancedFilters.idTono || null,
                idCalibro: advancedFilters.idCalibro || null,
                idFormato: advancedFilters.idFormato || null,
                idScelta: advancedFilters.idScelta || null
            });
            setArticoli(response.data.list || []);
            setTotalItems(response.data.totalCount || 0);
        } catch (error) {
            console.error("Error fetching articoli", error);
            setArticoli([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const handleCategoriaChange = (e) => {
        setIdCategoria(e.target.value);
        setPage(0);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value));
        setPage(0);
    }

    const handleSort = (colIndex) => {
        if (sortCol === colIndex) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(colIndex);
            setSortDir('asc');
        }
    };

    const renderSortIcon = (colIndex) => {
        if (sortCol !== colIndex) return <span className="sort-icon">▼</span>;
        return <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    const handleDelete = async (art) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: `Eliminare l'articolo ${art.codice} - ${art.descrizione}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina!',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await ArticoliService.delete(art.id);
                Swal.fire(
                    'Eliminato!',
                    'L\'articolo è stato rimosso.',
                    'success'
                );
                fetchArticoli();
            } catch (error) {
                console.error("Error deleting article", error);
                const errorMsg = error.response?.data?.errorText || 'Impossibile eliminare l\'articolo.';
                Swal.fire(
                    'Errore!',
                    errorMsg,
                    'error'
                );
            }
        }
    };

    const handleCaricoClick = (art) => {
        setSelectedArticle(art);
        setShowCaricoModal(true);
        setActiveDropdownId(null);
    };

    const handleCloseCaricoModal = () => {
        setShowCaricoModal(false);
        setSelectedArticle(null);
    };

    const handleScaricoClick = (art) => {
        setSelectedArticle(art);
        setShowScaricoModal(true);
        setActiveDropdownId(null);
    };

    const handleCloseScaricoModal = () => {
        setShowScaricoModal(false);
        setSelectedArticle(null);
    };

    const handleRettificaClick = (art) => {
        setSelectedArticle(art);
        setShowRettificaModal(true);
        setActiveDropdownId(null);
    };

    const handleCloseRettificaModal = () => {
        setShowRettificaModal(false);
        setSelectedArticle(null);
    };

    return (
        <div className="container-fluid page-content">
            <CaricoMagazzinoModal
                show={showCaricoModal}
                handleClose={handleCloseCaricoModal}
                article={selectedArticle}
                refreshList={fetchArticoli}
            />
            <ScaricoMagazzinoModal
                show={showScaricoModal}
                handleClose={handleCloseScaricoModal}
                article={selectedArticle}
                refreshList={fetchArticoli}
            />
            <RettificaMagazzinoModal
                show={showRettificaModal}
                handleClose={handleCloseRettificaModal}
                article={selectedArticle}
                refreshList={fetchArticoli}
            />
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li className="active">Elenco articoli</li>
            </ul>
            <h1>Elenco articoli</h1>

            <div className="main-box">
                <div className="main-box-header">
                    <div className="filter-block-left">
                        <div className="items-per-page">
                            Visualizza
                            <select value={pageSize} onChange={handlePageSizeChange} className="form-control inline-select">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            elementi per pagina
                        </div>
                    </div>

                    <div className="filter-block-right">
                        <div className="filter-group">
                            <select
                                value={idCategoria}
                                onChange={handleCategoriaChange}
                                className="form-control category-select"
                            >
                                <option value="">Scegli categoria...</option>
                                {categorie.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.descrizione}</option>
                                ))}
                            </select>
                        </div>

                        <div className="search-group">
                            <input
                                type="text"
                                className="form-control search-input"
                                placeholder="Cerca..."
                                value={search}
                                onChange={handleSearchChange}
                            />
                            <FaSearch className="search-icon" />
                        </div>

                        <button
                            className={`btn ${showAdvancedSearch ? 'btn-warning' : 'btn-default'}`}
                            onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                            title="Ricerca Avanzata"
                            style={{ height: '44px', width: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', border: '1px solid #ddd' }}
                        >
                            <FaCog />
                        </button>



                        <button className="btn btn-primary add-btn" onClick={() => navigate('/articoli/new')}>
                            <FaPlusCircle className="btn-icon" /> Aggiungi
                        </button>
                    </div>
                </div>

                <div className="main-box-body">
                    {showAdvancedSearch && (
                        <div className="advanced-search-panel">
                            <h5 style={{ marginBottom: '20px', color: '#3498db', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Filtri Avanzati</h5>
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Giacenza</label>
                                        <div className="input-group">
                                            <div className="input-group-btn" style={{ width: 'auto' }}>
                                                <select
                                                    className="form-control"
                                                    style={{ width: '60px', padding: '6px' }}
                                                    value={advancedFilters.operatoreGiacenza}
                                                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, operatoreGiacenza: e.target.value }))}
                                                >
                                                    <option value=">=">&ge;</option>
                                                    <option value="<=">&le;</option>
                                                    <option value="=">=</option>
                                                </select>
                                            </div>
                                            <input
                                                type="number"
                                                className="form-control"
                                                placeholder="Qta"
                                                value={advancedFilters.giacenza}
                                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, giacenza: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-5">
                                    <div className="form-group">
                                        <label>Fornitore</label>
                                        <AsyncSelect
                                            cacheOptions
                                            loadOptions={(inputValue) =>
                                                FornitoriService.getSuggestion(inputValue).then(res => {
                                                    // API returns List<FornitoreDto> directly, so res.data is the array
                                                    return res.data?.map(f => ({ value: f.id, label: f.denominazione })) || [];
                                                })
                                            }
                                            value={advancedFilters.idFornitore ? { value: advancedFilters.idFornitore, label: advancedFilters.descFornitore } : null}
                                            onChange={(opt) => setAdvancedFilters(prev => ({
                                                ...prev,
                                                idFornitore: opt ? opt.value : null,
                                                descFornitore: opt ? opt.label : ''
                                            }))}
                                            placeholder="Cerca fornitore..."
                                            noOptionsMessage={({ inputValue }) => 
                                                !inputValue ? "Inizia a scrivere per cercare..." : "Nessun risultato trovato"
                                            }
                                            loadingMessage={() => "Caricamento..."}
                                            isClearable
                                            styles={{
                                                control: (base) => ({ ...base, height: '34px', minHeight: '34px' }),
                                                menu: (base) => ({ ...base, zIndex: 9999 })
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            {config.isCeramica && (
                                <div className="row" style={{ marginTop: '15px' }}>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Formato</label>
                                            <Select
                                                isClearable
                                                placeholder="Tutti"
                                                classNamePrefix="react-select"
                                                options={combos.formati.map(f => ({ value: f.id, label: f.descrizione }))}
                                                value={advancedFilters.idFormato ? { value: advancedFilters.idFormato, label: combos.formati.find(f => f.id == advancedFilters.idFormato)?.descrizione } : null}
                                                onChange={(opt) => setAdvancedFilters(prev => ({ ...prev, idFormato: opt ? opt.value : '' }))}
                                                noOptionsMessage={() => "Nessun risultato trovato"}
                                                styles={{
                                                    control: (base) => ({ ...base, minHeight: '34px', height: '34px' }),
                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Scelta</label>
                                            <Select
                                                isClearable
                                                placeholder="Tutti"
                                                classNamePrefix="react-select"
                                                options={combos.scelte.map(s => ({ value: s.id, label: s.descrizione }))}
                                                value={advancedFilters.idScelta ? { value: advancedFilters.idScelta, label: combos.scelte.find(s => s.id == advancedFilters.idScelta)?.descrizione } : null}
                                                onChange={(opt) => setAdvancedFilters(prev => ({ ...prev, idScelta: opt ? opt.value : '' }))}
                                                noOptionsMessage={() => "Nessun risultato trovato"}
                                                styles={{
                                                    control: (base) => ({ ...base, minHeight: '34px', height: '34px' }),
                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Tono</label>
                                            <Select
                                                isClearable
                                                placeholder="Tutti"
                                                classNamePrefix="react-select"
                                                options={combos.toni.map(t => ({ value: t.id, label: t.descrizione }))}
                                                value={advancedFilters.idTono ? { value: advancedFilters.idTono, label: combos.toni.find(t => t.id == advancedFilters.idTono)?.descrizione } : null}
                                                onChange={(opt) => setAdvancedFilters(prev => ({ ...prev, idTono: opt ? opt.value : '' }))}
                                                noOptionsMessage={() => "Nessun risultato trovato"}
                                                styles={{
                                                    control: (base) => ({ ...base, minHeight: '34px', height: '34px' }),
                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Calibro</label>
                                            <Select
                                                isClearable
                                                placeholder="Tutti"
                                                classNamePrefix="react-select"
                                                options={combos.calibri.map(c => ({ value: c.id, label: c.descrizione }))}
                                                value={advancedFilters.idCalibro ? { value: advancedFilters.idCalibro, label: combos.calibri.find(c => c.id == advancedFilters.idCalibro)?.descrizione } : null}
                                                onChange={(opt) => setAdvancedFilters(prev => ({ ...prev, idCalibro: opt ? opt.value : '' }))}
                                                noOptionsMessage={() => "Nessun risultato trovato"}
                                                styles={{
                                                    control: (base) => ({ ...base, minHeight: '34px', height: '34px' }),
                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}

                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort(2)} style={{ cursor: 'pointer' }}>CATEGORIA {renderSortIcon(2)}</th>
                                    <th onClick={() => handleSort(0)} style={{ cursor: 'pointer' }}>CODICE {renderSortIcon(0)}</th>
                                    <th onClick={() => handleSort(1)} style={{ cursor: 'pointer' }}>DESCRIZIONE {renderSortIcon(1)}</th>
                                    <th style={{ textAlign: 'right' }}>PREZZO FORN.</th>
                                    <th onClick={() => handleSort(4)} style={{ cursor: 'pointer', textAlign: 'right' }}>ESISTENZA {renderSortIcon(4)}</th>
                                    <th onClick={() => handleSort(5)} style={{ cursor: 'pointer', textAlign: 'right' }}>DISPONIBILE {renderSortIcon(5)}</th>
                                    <th style={{ width: '1%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center">Caricamento...</td></tr>
                                ) : articoli.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center">Nessun articolo presente</td></tr>
                                ) : (
                                    articoli.map(art => (
                                        <tr key={art.id}>
                                            <td>{art.descCategoria}</td>
                                            <td>{art.codice}</td>
                                            <td>
                                                {art.descrizione}
                                                {config.isCeramica && (art.descrFormato || art.descrScelta || art.descrTono || art.descrCalibro) && (
                                                    <div style={{ fontSize: '0.85em', color: '#777', marginTop: '4px' }}>
                                                        {[
                                                            art.descrFormato && `Formato: ${art.descrFormato}`,
                                                            art.descrScelta && `Scelta: ${art.descrScelta}`,
                                                            art.descrTono && `Tono: ${art.descrTono}`,
                                                            art.descrCalibro && `Calibro: ${art.descrCalibro}`
                                                        ].filter(Boolean).join(' - ')}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-right">{(art.prezzoFornitore || 0).toFixed(2)}</td>
                                            <td className="text-right">
                                                { (art.tipologia === 'AM' || art.tipologia === 'AMSC') ? 
                                                  (art.quantitaEsistente || 0).toFixed(2) : 
                                                  '-' 
                                                }
                                            </td>
                                            <td className="text-right">
                                                { (art.tipologia === 'AM' || art.tipologia === 'AMSC') ? 
                                                  ((art.quantitaEsistente || 0) - (art.quantitaImpegnata || 0)).toFixed(2) : 
                                                  '-' 
                                                }
                                            </td>
                                            <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                                                <div className="actions-wrapper">
                                                    <div className="dropdown-container">
                                                        <button
                                                            className="btn-action btn-action-gear"
                                                            onClick={(e) => handleGearClick(e, art)}
                                                            title="Azioni"
                                                        >
                                                            <FaCog size={16} color="#ffffff" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        className="btn-action btn-action-delete"
                                                        title="Elimina"
                                                        onClick={() => handleDelete(art)}
                                                    >
                                                        <FaTrash size={14} color="#ffffff" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-container">
                        <span className="pagination-info">Visualizzati {articoli.length} of {totalItems} risultati</span>
                        <nav>
                            <ul className="pagination">
                                <li className={page === 0 ? 'disabled' : ''}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); if (page > 0) setPage(page - 1); }}>
                                        <FaChevronLeft />
                                    </a>
                                </li>
                                {[...Array(Math.ceil(totalItems / pageSize))].map((_, i) => {
                                    const totalPages = Math.ceil(totalItems / pageSize);
                                    if (totalPages > 10) {
                                        if (i > 0 && i < totalPages - 1 && (i < page - 2 || i > page + 2)) {
                                            if (i === page - 3 || i === page + 3) return <li key={i} className="disabled"><span>...</span></li>;
                                            return null;
                                        }
                                    }
                                    return (
                                        <li key={i} className={page === i ? 'active' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); setPage(i); }}>
                                                {i + 1}
                                            </a>
                                        </li>
                                    );
                                })}
                                <li className={(page + 1) * pageSize >= totalItems ? 'disabled' : ''}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); if ((page + 1) * pageSize < totalItems) setPage(page + 1); }}>
                                        <FaChevronRight />
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Fixed Dropdown Menu */}
            {activeDropdownId && (
                (() => {
                    const art = articoli.find(a => a.id === activeDropdownId);
                    if (!art) return null;
                    
                    const hasStock = art.tipologia === 'AM' || art.tipologia === 'AMSC';

                    return (
                        <div
                            className="custom-dropdown-menu"
                            style={{
                                position: 'fixed',
                                top: dropdownPosition.top,
                                left: dropdownPosition.left,
                                zIndex: 9999,
                                display: 'block',
                                marginTop: '5px'
                            }}
                        >
                            <div className="dropdown-item" onClick={() => navigate(`/articoli/${art.id}`)}>Modifica</div>
                            
                            {hasStock && (
                                <>
                                    <div className="dropdown-divider"></div>
                                    <div className="dropdown-item" onClick={() => handleCaricoClick(art)}>Carica</div>
                                    <div className="dropdown-item" onClick={() => handleScaricoClick(art)}>Scarica</div>
                                    <div className="dropdown-item" onClick={() => handleRettificaClick(art)}>Rettifica</div>
                                    <div className="dropdown-divider"></div>
                                    <div className="dropdown-item" onClick={() => navigate('/articoli/movimenti', { state: { filterByArticle: { value: art.id, label: `${art.codice} - ${art.descrizione}` } } })}>Movimenti magazzino</div>
                                </>
                            )}
                        </div>
                    );
                })()
            )}
        </div>
    );
};

export default ArticoliList;
