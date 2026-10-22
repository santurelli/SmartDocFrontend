import React, { useState, useEffect } from 'react';
import ArticoliService from '../../services/ArticoliService';
import CategorieArticoliService from '../../services/CategorieArticoliService';
import { useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaSearch, FaChevronLeft, FaChevronRight, FaEdit, FaCog, FaTrash, FaHome, FaAngleRight, FaMapMarkerAlt, FaFilter, FaEraser, FaTags } from 'react-icons/fa';
import Swal from 'sweetalert2';
import FornitoriService from '../../services/FornitoriService';
import AuthService from '../../services/authService';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import CaricoMagazzinoModal from './CaricoMagazzinoModal';
import ScaricoMagazzinoModal from './ScaricoMagazzinoModal';
import RettificaMagazzinoModal from './RettificaMagazzinoModal';
import UbicazioniArticoloModal from '../../components/modals/UbicazioniArticoloModal';
import ArticoloPrezziModal from '../../components/modals/ArticoloPrezziModal';
import MarcheService from '../../services/MarcheService';
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
            idScelta: '',
            idMarca: '',
            sezione: '',
            serie: '',
            diametro: '',
            scultura: '',
            indiceVelocita: '',
            dot: ''
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
    const [showUbicazioniModal, setShowUbicazioniModal] = useState(false);
    const [showPrezziModal, setShowPrezziModal] = useState(false);
    const [selectedPrezziArticle, setSelectedPrezziArticle] = useState(null);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 'auto', bottom: 'auto', left: 0, maxHeight: 350 });

    // Advanced Search State
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(initialState.showAdvancedSearch);
    const [advancedFilters, setAdvancedFilters] = useState(initialState.advancedFilters);
    const [marcheList, setMarcheList] = useState([]);
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
        MarcheService.getCombo().then(res => setMarcheList(res || [])).catch(() => {});
        window.addEventListener('configupdated', loadConfig);
        return () => window.removeEventListener('configupdated', loadConfig);
    }, []);

    const loadConfig = async () => {
        try {
            const res = await ConfigurazioneService.getAll();
            const data = res.data?.payload || res.data || [];

            let isCeramica = false;
            let tipoStore = 'GENERALE';
            let gommistaVal = '0';
            let ubicazioniVal = '0';
            let marcheVal = '0';

            let categorieVal = '1';
            let sottoCategorieVal = '1';

            if (Array.isArray(data)) {
                const ts = data.find(c => c.chiave === 'TIPO_STORE' || c.chiave === 'TIPOSTORE');
                if (ts) tipoStore = ts.valore;
                const g = data.find(c => c.chiave === 'GOMMISTA');
                if (g) gommistaVal = g.valore;
                const u = data.find(c => c.chiave === 'UBICAZIONI');
                if (u) ubicazioniVal = u.valore;
                const m = data.find(c => c.chiave === 'MARCHE');
                if (m) marcheVal = m.valore;
                const c = data.find(c => c.chiave === 'CATEGORIE' || c.chiave === 'CATEGORIE_ABILITA');
                if (c) categorieVal = c.valore;
                const sc = data.find(c => c.chiave === 'SOTTOCATEGORIE' || c.chiave === 'SOTTOCATEGORIE_ABILITA');
                if (sc) sottoCategorieVal = sc.valore;
            } else if (data) {
                tipoStore = data['GLOBAL:TIPO_STORE'] || data['TIPO_STORE'] || data['TIPOSTORE'] || 'GENERALE';
                gommistaVal = data['GLOBAL:GOMMISTA'] || data['GOMMISTA'] || '0';
                ubicazioniVal = data['GLOBAL:UBICAZIONI'] || data['UBICAZIONI'] || '0';
                marcheVal = data['GLOBAL:MARCHE'] || data['MARCHE'] || '0';
                categorieVal = data['GLOBAL:CATEGORIE'] || data['ARTICOLI:CATEGORIE_ABILITA'] || data['CATEGORIE'] || '1';
                sottoCategorieVal = data['GLOBAL:SOTTOCATEGORIE'] || data['ARTICOLI:SOTTOCATEGORIE_ABILITA'] || data['SOTTOCATEGORIE'] || '1';
            }

            if (tipoStore === 'GENERALE') {
                const authConfig = AuthService.getConfig() || {};
                const authTs = authConfig['TIPOSTORE'] || authConfig['TIPO_STORE'];
                if (authTs) tipoStore = authTs;
            }

            isCeramica = (tipoStore === 'CERAMICA');
            const isGommista = (tipoStore === 'PNEUMATICI' || tipoStore === 'GOMMISTA' || gommistaVal === '1');
            const hasUbicazioni = (isGommista || ubicazioniVal === '1');
            const hasMarche = (isGommista || marcheVal === '1');
            const abilitaCategorie = (categorieVal !== '0');
            const abilitaSottoCategorie = abilitaCategorie && (sottoCategorieVal !== '0');

            setConfig(prev => ({ ...prev, isCeramica, isGommista, hasUbicazioni, hasMarche, abilitaCategorie, abilitaSottoCategorie }));

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
        const handleScrollOrResize = () => {
            setActiveDropdownId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', handleScrollOrResize, true);
        window.addEventListener('resize', handleScrollOrResize);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScrollOrResize, true);
            window.removeEventListener('resize', handleScrollOrResize);
        };
    }, []);

    const handleGearClick = (e, art) => {
        e.stopPropagation();
        if (activeDropdownId === art.id) {
            setActiveDropdownId(null);
            return;
        }
        const rect = e.currentTarget.getBoundingClientRect();
        const menuWidth = 250;
        const estimatedMenuHeight = 260;

        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const openUp = spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow;

        setDropdownPosition({
            openUp,
            top: openUp ? 'auto' : (rect.bottom + 5),
            bottom: openUp ? (window.innerHeight - rect.top + 5) : 'auto',
            left: Math.max(10, rect.right - menuWidth),
            maxHeight: openUp ? Math.max(160, spaceAbove - 20) : Math.max(160, spaceBelow - 20)
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
                idScelta: advancedFilters.idScelta || null,
                idMarca: advancedFilters.idMarca || null,
                // Tire Filters
                sezione: advancedFilters.sezione || null,
                serie: advancedFilters.serie || null,
                diametro: advancedFilters.diametro || null,
                scultura: advancedFilters.scultura || null,
                indiceVelocita: advancedFilters.indiceVelocita || null,
                dot: advancedFilters.dot || null
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

    const handleUbicazioniClick = (art) => {
        setSelectedArticle(art);
        setShowUbicazioniModal(true);
        setActiveDropdownId(null);
    };

    const handleCloseUbicazioniModal = () => {
        setShowUbicazioniModal(false);
        setSelectedArticle(null);
    };

    const handleOpenPrezziModal = (art) => {
        setSelectedPrezziArticle(art);
        setShowPrezziModal(true);
        setActiveDropdownId(null);
    };

    const handleClosePrezziModal = () => {
        setShowPrezziModal(false);
        setSelectedPrezziArticle(null);
    };

    const handleResetTireFilters = () => {
        setAdvancedFilters(prev => ({
            ...prev,
            idMarca: '',
            sezione: '',
            serie: '',
            diametro: '',
            indiceVelocita: '',
            dot: '',
            scultura: ''
        }));
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
            <UbicazioniArticoloModal
                show={showUbicazioniModal}
                handleClose={handleCloseUbicazioniModal}
                article={selectedArticle}
                refreshList={fetchArticoli}
            />
            <ArticoloPrezziModal
                show={showPrezziModal}
                handleClose={handleClosePrezziModal}
                article={selectedPrezziArticle}
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
                        {config.abilitaCategorie !== false && (
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
                        )}

                        <div className="filter-group">
                            <select
                                value={
                                    advancedFilters.giacenza === '0' && advancedFilters.operatoreGiacenza === '>' ? 'DISP' :
                                    advancedFilters.giacenza === '0' && advancedFilters.operatoreGiacenza === '<=' ? 'NON_DISP' :
                                    advancedFilters.giacenza !== '' ? 'CUSTOM' : ''
                                }
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setPage(0);
                                    if (val === 'DISP') {
                                        setAdvancedFilters(prev => ({ ...prev, giacenza: '0', operatoreGiacenza: '>' }));
                                    } else if (val === 'NON_DISP') {
                                        setAdvancedFilters(prev => ({ ...prev, giacenza: '0', operatoreGiacenza: '<=' }));
                                    } else {
                                        setAdvancedFilters(prev => ({ ...prev, giacenza: '', operatoreGiacenza: '>=' }));
                                    }
                                }}
                                className="form-control category-select"
                                style={{ minWidth: '170px' }}
                            >
                                <option value="">Tutte le disponibilità</option>
                                <option value="DISP">Solo disponibili (&gt; 0)</option>
                                <option value="NON_DISP">Non disponibili (&le; 0)</option>
                                {advancedFilters.giacenza !== '' && !(advancedFilters.giacenza === '0' && (advancedFilters.operatoreGiacenza === '>' || advancedFilters.operatoreGiacenza === '<=')) && (
                                    <option value="CUSTOM">Disp. {advancedFilters.operatoreGiacenza} {advancedFilters.giacenza}</option>
                                )}
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
                    {config.isGommista && (
                        <div className="filtri-pneumatico-bar" style={{
                            marginBottom: '20px',
                            padding: '12px 16px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderLeft: '5px solid #27ae60',
                            borderRadius: '6px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <strong style={{ color: '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaFilter style={{ color: '#27ae60' }} /> Filtri Pneumatico:
                                </strong>
                                <button
                                    type="button"
                                    className="btn btn-default btn-xs"
                                    onClick={handleResetTireFilters}
                                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}
                                    title="Azzera filtri pneumatici"
                                >
                                    <FaEraser className="mr-1" /> Reset
                                </button>
                            </div>
                            <div className="row">
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Marca</label>
                                    <Select
                                        isClearable
                                        isSearchable
                                        placeholder="Tutte"
                                        classNamePrefix="react-select"
                                        options={marcheList.map(m => ({ value: m.id, label: m.descrizione }))}
                                        value={advancedFilters.idMarca ? {
                                            value: advancedFilters.idMarca,
                                            label: marcheList.find(m => m.id == advancedFilters.idMarca)?.descrizione || ''
                                        } : null}
                                        onChange={(opt) => {
                                            setPage(0);
                                            setAdvancedFilters(prev => ({ ...prev, idMarca: opt ? opt.value : '' }));
                                        }}
                                        noOptionsMessage={() => "Nessun risultato trovato"}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: '32px',
                                                height: '32px',
                                                fontSize: '12px'
                                            }),
                                            valueContainer: (base) => ({
                                                ...base,
                                                padding: '0 6px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }),
                                            input: (base) => ({
                                                ...base,
                                                margin: 0,
                                                padding: 0
                                            }),
                                            indicatorsContainer: (base) => ({
                                                ...base,
                                                height: '32px'
                                            }),
                                            dropdownIndicator: (base) => ({
                                                ...base,
                                                padding: '2px 4px'
                                            }),
                                            clearIndicator: (base) => ({
                                                ...base,
                                                padding: '2px 4px'
                                            }),
                                            menu: (base) => ({ ...base, zIndex: 9999, fontSize: '12px' })
                                        }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Sezione (L)</label>
                                    <input
                                        type="number"
                                        className="form-control input-sm"
                                        placeholder="es. 205"
                                        value={advancedFilters.sezione || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, sezione: e.target.value }))}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Serie (H)</label>
                                    <input
                                        type="number"
                                        className="form-control input-sm"
                                        placeholder="es. 55"
                                        value={advancedFilters.serie || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, serie: e.target.value }))}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Diametro (R)</label>
                                    <input
                                        type="number"
                                        className="form-control input-sm"
                                        placeholder="es. 16"
                                        value={advancedFilters.diametro || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, diametro: e.target.value }))}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Indice Vel.</label>
                                    <input
                                        type="text"
                                        className="form-control input-sm"
                                        placeholder="es. V"
                                        value={advancedFilters.indiceVelocita || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, indiceVelocita: e.target.value }))}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>DOT</label>
                                    <input
                                        type="text"
                                        className="form-control input-sm"
                                        placeholder="es. 2423"
                                        value={advancedFilters.dot || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, dot: e.target.value }))}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Modello / Scultura</label>
                                    <input
                                        type="text"
                                        className="form-control input-sm"
                                        placeholder="es. Primacy"
                                        value={advancedFilters.scultura || ''}
                                        onChange={(e) => setAdvancedFilters(prev => ({ ...prev, scultura: e.target.value }))}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {showAdvancedSearch && (
                        <div className="advanced-search-panel">
                            <h5 style={{ marginBottom: '20px', color: '#3498db', fontWeight: 'bold', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Filtri Avanzati</h5>
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Disponibilità</label>
                                        <div className="input-group">
                                            <div className="input-group-btn" style={{ width: 'auto' }}>
                                                <select
                                                    className="form-control"
                                                    style={{ width: '60px', padding: '6px' }}
                                                    value={advancedFilters.operatoreGiacenza}
                                                    onChange={(e) => setAdvancedFilters(prev => ({ ...prev, operatoreGiacenza: e.target.value }))}
                                                >
                                                    <option value=">=">&ge;</option>
                                                    <option value=">">&gt;</option>
                                                    <option value="=">=</option>
                                                    <option value="<=">&le;</option>
                                                    <option value="<">&lt;</option>
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
                                {config.hasMarche && (
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label>Marca</label>
                                            <Select
                                                isClearable
                                                isSearchable
                                                placeholder="Tutte le marche"
                                                classNamePrefix="react-select"
                                                options={marcheList.map(m => ({ value: m.id, label: m.descrizione }))}
                                                value={advancedFilters.idMarca ? {
                                                    value: advancedFilters.idMarca,
                                                    label: marcheList.find(m => m.id == advancedFilters.idMarca)?.descrizione || ''
                                                } : null}
                                                onChange={(opt) => {
                                                    setPage(0);
                                                    setAdvancedFilters(prev => ({ ...prev, idMarca: opt ? opt.value : '' }));
                                                }}
                                                noOptionsMessage={() => "Nessun risultato trovato"}
                                                styles={{
                                                    control: (base) => ({ ...base, minHeight: '34px', height: '34px' }),
                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
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
                                    {config.abilitaCategorie !== false && (
                                        <th onClick={() => handleSort(2)} style={{ cursor: 'pointer' }}>CATEGORIA {renderSortIcon(2)}</th>
                                    )}
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
                                    <tr><td colSpan={config.abilitaCategorie !== false ? "7" : "6"} className="text-center">Caricamento...</td></tr>
                                ) : articoli.length === 0 ? (
                                    <tr><td colSpan={config.abilitaCategorie !== false ? "7" : "6"} className="text-center">Nessun articolo presente</td></tr>
                                ) : (
                                    articoli.map(art => (
                                        <tr key={art.id}>
                                            {config.abilitaCategorie !== false && <td>{art.descCategoria}</td>}
                                            <td>{art.codice}</td>
                                            <td>
                                                {(() => {
                                                    const isTire = Boolean(art.sezione || art.diametro || art.scultura || art.dot);
                                                    if (isTire || config.isGommista) {
                                                        const parts = [];
                                                        if (art.sezione && art.serie) {
                                                            parts.push(`${art.sezione}/${art.serie}`);
                                                        } else if (art.sezione) {
                                                            parts.push(art.sezione);
                                                        }
                                                        if (art.diametro) {
                                                            parts.push(`R${art.diametro}`);
                                                        }
                                                        if (art.indiceVelocita) {
                                                            parts.push(art.indiceVelocita);
                                                        }
                                                        if (art.scultura) {
                                                            parts.push(art.scultura);
                                                        }
                                                        const tireSpec = parts.join(' ').trim();
                                                        let primaryText = tireSpec || art.descrizione;
                                                        if (art.descMarca && !primaryText.toLowerCase().includes(art.descMarca.toLowerCase())) {
                                                            primaryText = `${art.descMarca} ${primaryText}`;
                                                        }

                                                        return (
                                                            <div>
                                                                <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                                                    {primaryText}
                                                                </span>
                                                                {art.dot && (
                                                                    <span className="badge" style={{ backgroundColor: '#64748b', color: '#fff', marginLeft: '8px', fontSize: '11px', padding: '2px 6px', fontWeight: 'normal', borderRadius: '4px' }}>
                                                                        DOT {art.dot}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div>
                                                            {art.descMarca && (
                                                                <span className="badge badge-default mr-1" style={{ fontSize: '11px', backgroundColor: '#e2e8f0', color: '#334155', marginRight: '6px' }}>
                                                                    {art.descMarca}
                                                                </span>
                                                            )}
                                                            <span>{art.descrizione}</span>
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
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="text-right" style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                                                <button
                                                    type="button"
                                                    className="btn-quick-price"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenPrezziModal(art);
                                                    }}
                                                    title="Visualizza rapidamente prezzi e listini di vendita"
                                                >
                                                    <span>{(art.prezzoFornitore || 0).toFixed(2)} €</span>
                                                    <FaTags className="quick-price-icon" />
                                                </button>
                                            </td>
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
                                bottom: dropdownPosition.bottom,
                                left: dropdownPosition.left,
                                maxHeight: dropdownPosition.maxHeight,
                                overflowY: 'auto',
                                zIndex: 9999,
                                display: 'block',
                                marginTop: 0,
                                marginBottom: 0,
                                boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
                                borderRadius: '6px'
                            }}
                        >
                            <div className="dropdown-item" onClick={() => navigate(`/articoli/${art.id}`)}>Modifica</div>
                            <div className="dropdown-item" onClick={() => handleOpenPrezziModal(art)} style={{ color: '#0284c7', fontWeight: '500' }}>
                                <FaTags className="mr-2" /> Prezzi di vendita
                            </div>
                            
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

                            {config.hasUbicazioni && (
                                <>
                                    <div className="dropdown-divider"></div>
                                    <div className="dropdown-item" onClick={() => handleUbicazioniClick(art)} style={{ color: '#27ae60', fontWeight: '500' }}>
                                        <FaMapMarkerAlt className="mr-2" /> Ubicazioni & Prelievo
                                    </div>
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
