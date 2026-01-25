import React, { useState, useEffect } from 'react';
import ArticoliService from '../../services/ArticoliService';
import CategorieArticoliService from '../../services/CategorieArticoliService';
import { useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaSearch, FaChevronLeft, FaChevronRight, FaEdit, FaCog, FaTrash } from 'react-icons/fa';
import Swal from 'sweetalert2';
import FornitoriService from '../../services/FornitoriService';
import ToniArticoloService from '../../services/ToniArticoloService';
import CalibriArticoloService from '../../services/CalibriArticoloService';
import AuthService from '../../services/authService';
import AsyncSelect from 'react-select/async';
import './ArticoliList.css';

const ArticoliList = () => {
    const [articoli, setArticoli] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [idCategoria, setIdCategoria] = useState('');
    const [categorie, setCategorie] = useState([]);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [totalItems, setTotalItems] = useState(0);
    const [sortCol, setSortCol] = useState(1);
    const [sortDir, setSortDir] = useState('asc');
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    // Advanced Search State
    const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
    const [advancedFilters, setAdvancedFilters] = useState({
        giacenza: '',
        operatoreGiacenza: '>=',
        idFornitore: null,
        descFornitore: '', // for AsyncSelect label
        idTono: '',
        idCalibro: ''
    });
    const [config, setConfig] = useState({});
    const [combos, setCombos] = useState({
        toni: [],
        calibri: []
    });

    const navigate = useNavigate();

    useEffect(() => {
        fetchCategorie();
        const conf = AuthService.getConfig();
        const isCeramica = conf['TIPOSTORE'] === 'CERAMICA';
        setConfig({ isCeramica });
        if (isCeramica) {
            loadCeramicaCombos();
        }
    }, []);

    const loadCeramicaCombos = async () => {
        try {
            const [toniRes, calibriRes] = await Promise.all([
                ToniArticoloService.getListForCombo(),
                CalibriArticoloService.getListForCombo()
            ]);
            setCombos({
                toni: toniRes.data.payload || [],
                calibri: calibriRes.data.payload || []
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
            if (!event.target.closest('.dropdown-container')) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                idCalibro: advancedFilters.idCalibro || null
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

    return (
        <div className="container-fluid page-content">
            <div className="header-row">
                <div className="breadcrumb">
                    <a href="/">Home</a> / <span>Elenco articoli</span>
                </div>
                <h1>Elenco articoli</h1>
            </div>

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
                        <div className="advanced-search-panel row" style={{ paddingBottom: '20px', borderBottom: '1px solid #eee', marginBottom: '20px' }}>
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
                            <div className="col-md-3">
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
                                        loadingMessage={() => "Caricamento..."}
                                        noOptionsMessage={() => "Nessun risultato"}
                                        isClearable
                                        styles={{
                                            control: (base) => ({ ...base, height: '34px', minHeight: '34px' }),
                                            menu: (base) => ({ ...base, zIndex: 9999 })
                                        }}
                                    />
                                </div>
                            </div>
                            {config.isCeramica && (
                                <>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Tono</label>
                                            <select
                                                className="form-control"
                                                value={advancedFilters.idTono}
                                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, idTono: e.target.value }))}
                                            >
                                                <option value="">Tutti</option>
                                                {combos.toni.map(t => <option key={t.id} value={t.id}>{t.descrizione}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Calibro</label>
                                            <select
                                                className="form-control"
                                                value={advancedFilters.idCalibro}
                                                onChange={(e) => setAdvancedFilters(prev => ({ ...prev, idCalibro: e.target.value }))}
                                            >
                                                <option value="">Tutti</option>
                                                {combos.calibri.map(c => <option key={c.id} value={c.id}>{c.descrizione}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </>
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
                                            <td>{art.descrizione}</td>
                                            <td className="text-right">{(art.quantitaEsistente || 0).toFixed(2)}</td>
                                            <td className="text-right">{((art.quantitaEsistente || 0) - (art.quantitaImpegnata || 0)).toFixed(2)}</td>
                                            <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                                                <div className="actions-wrapper">
                                                    <div className="dropdown-container">
                                                        <button
                                                            className="btn-action btn-action-gear"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveDropdownId(activeDropdownId === art.id ? null : art.id);
                                                            }}
                                                            title="Azioni"
                                                        >
                                                            <FaCog size={16} color="#ffffff" />
                                                        </button>
                                                        {activeDropdownId === art.id && (
                                                            <div className="custom-dropdown-menu">
                                                                <div className="dropdown-item" onClick={() => navigate(`/articoli/${art.id}`)}>Modifica</div>
                                                                <div className="dropdown-divider"></div>
                                                                <div className="dropdown-item">Carica</div>
                                                                <div className="dropdown-item">Scarica</div>
                                                                <div className="dropdown-item">Rettifica</div>
                                                                <div className="dropdown-divider"></div>
                                                                <div className="dropdown-item">Movimenti magazzino</div>
                                                            </div>
                                                        )}
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
        </div>
    );
};

export default ArticoliList;
