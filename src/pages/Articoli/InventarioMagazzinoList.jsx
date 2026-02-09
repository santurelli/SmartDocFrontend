import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaHome, FaAngleRight, FaCloudDownloadAlt } from 'react-icons/fa';
import AsyncSelect from 'react-select/async';
import ArticoliService from '../../services/ArticoliService';
import FornitoriService from '../../services/FornitoriService';
import CategorieArticoliService from '../../services/CategorieArticoliService';
import SottoCategorieService from '../../services/SottoCategorieService';
import InventarioMagazzinoService from '../../services/InventarioMagazzinoService';
import DownloadProgress from '../../components/DownloadProgress';
import './ArticoliList.css';

import storageHelper from '../../utils/storageHelper';

const MODULE_NAME = 'inventario';

const InventarioMagazzinoList = () => {
    // Load initial state
    const initialState = storageHelper.loadState(MODULE_NAME, {
        idCategoria: '',
        idSottoCategoria: '',
        selectedFornitore: null,
        selectedArticolo: null,
        dataAl: new Date().toISOString().split('T')[0],
        showFilters: true,
        page: 0,
        pageSize: 50,
        sortCol: 1,
        sortDir: 'asc'
    });

    const [inventario, setInventario] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [idCategoria, setIdCategoria] = useState(initialState.idCategoria);
    const [idSottoCategoria, setIdSottoCategoria] = useState(initialState.idSottoCategoria);
    const [selectedFornitore, setSelectedFornitore] = useState(initialState.selectedFornitore);
    const [selectedArticolo, setSelectedArticolo] = useState(initialState.selectedArticolo);
    const [dataAl, setDataAl] = useState(initialState.dataAl);
    const [showFilters, setShowFilters] = useState(initialState.showFilters);
    const [error, setError] = useState(null);

    const [categorie, setCategorie] = useState([]);
    const [sottoCategorie, setSottoCategorie] = useState([]);

    const [page, setPage] = useState(initialState.page);
    const [pageSize, setPageSize] = useState(initialState.pageSize);
    const [totalItems, setTotalItems] = useState(0);
    const [sortCol, setSortCol] = useState(initialState.sortCol); // Default to Descrizione
    const [sortDir, setSortDir] = useState(initialState.sortDir);

    // Save state whenever filters or pagination change
    useEffect(() => {
        storageHelper.saveState(MODULE_NAME, {
            idCategoria,
            idSottoCategoria,
            selectedFornitore,
            selectedArticolo,
            dataAl,
            showFilters,
            page,
            pageSize,
            sortCol,
            sortDir
        });
    }, [idCategoria, idSottoCategoria, selectedFornitore, selectedArticolo, dataAl, showFilters, page, pageSize, sortCol, sortDir]);

    useEffect(() => {
        fetchCombos();
    }, []);

    const fetchCombos = async () => {
        try {
            const res = await CategorieArticoliService.getListForCombo();
            setCategorie(res.data.payload || []);
        } catch (e) {
            console.error("Error fetching combos", e);
        }
    };

    useEffect(() => {
        if (idCategoria) {
            fetchSottoCategorie(idCategoria);
        } else {
            setSottoCategorie([]);
            setIdSottoCategoria('');
        }
    }, [idCategoria]);

    const fetchSottoCategorie = async (catId) => {
        try {
            const res = await SottoCategorieService.getListForCombo(catId);
            setSottoCategorie(res.data.payload || []);
        } catch (e) {
            console.error("Error fetching subcategories", e);
        }
    };

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await InventarioMagazzinoService.getList({
                idArticolo: selectedArticolo ? selectedArticolo.value : 0,
                idFornitore: selectedFornitore ? selectedFornitore.value : 0,
                idCategoria: idCategoria || 0,
                idSottoCategoria: idSottoCategoria || 0,
                idMagazzino: 1, // Defaulting to 1
                dataAl: dataAl,
                start: page * pageSize,
                length: pageSize,
                orderColumn: sortCol,
                orderDir: sortDir
            });

            if (response.data.errorText) {
                setError(response.data.errorText);
                setInventario([]);
                setTotalItems(0);
            } else if (response.data.payload) {
                setInventario(response.data.payload);
                setTotalItems(response.data.payload[0]?.total || 0);
            } else {
                setInventario([]);
                setTotalItems(0);
            }
        } catch (e) {
            console.error("Error fetching data", e);
            setError("Si è verificato un errore durante il caricamento dei dati.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, pageSize, idCategoria, idSottoCategoria, selectedFornitore, selectedArticolo, dataAl, sortCol, sortDir]);

    const loadArticoli = (inputValue) => {
        if (!inputValue) return Promise.resolve([]);
        return ArticoliService.getSuggestion(inputValue).then(res => {
            return res.data?.list?.map(a => ({ value: a.id, label: `${a.codice} - ${a.descrizione}` })) || [];
        });
    };

    const loadFornitori = (inputValue) => {
        if (!inputValue) return Promise.resolve([]);
        return FornitoriService.getSuggestion(inputValue).then(res => {
            return res.map(f => ({ value: f.id, label: f.denominazione }));
        });
    };

    const handleExport = async () => {
        setDownloading(true);
        setError(null);
        try {
            const response = await InventarioMagazzinoService.exportExcel({
                idArticolo: selectedArticolo ? selectedArticolo.value : 0,
                idFornitore: selectedFornitore ? selectedFornitore.value : 0,
                idCategoria: idCategoria || 0,
                idSottoCategoria: idSottoCategoria || 0,
                idMagazzino: 1,
                dataAl: dataAl,
                orderColumn: sortCol,
                orderDir: sortDir
            });

            if (response.headers['content-type'] === 'application/json' || response.data instanceof Blob && response.data.type === 'application/json') {
                // Handle potential JSON error response from blob endpoint
                const text = await response.data.text();
                const json = JSON.parse(text);
                if (json.errorText) {
                    setError(json.errorText);
                    return;
                }
            }

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `inventario_${dataAl}.xls`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            console.error("Error exporting excel", e);
            setError("Si è verificato un errore durante l'esportazione Excel.");
        } finally {
            setDownloading(false);
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
    };

    const handleSort = (colIndex) => {
        if (sortCol === colIndex) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(colIndex);
            setSortDir('asc');
        }
    };

    const renderSortIcon = (colIndex) => {
        if (sortCol !== colIndex) return <span className="sort-icon" style={{ opacity: 0.3 }}>⇅</span>;
        return <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
    };

    const formatNumber = (value) => {
        return new Intl.NumberFormat('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
    };

    return (
        <div className="page-content">
            <DownloadProgress visible={downloading} />
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li className="active"><FaAngleRight /> Inventario Magazzino</li>
            </ul>
            <div className="inventory-header-container">
                <div className="inventory-title-section">
                    <h1 className="inventory-title">Inventario Magazzino</h1>
                    <button className="btn btn-cloud" onClick={handleExport} disabled={downloading} title="Esporta Excel">
                        {downloading ? <FaCloudDownloadAlt className="fa-spin" /> : <FaCloudDownloadAlt />}
                    </button>
                </div>

                <div className="inventory-pagination-section">
                    <div className="items-per-page-top">
                        Visualizza
                        <select
                            className="form-control inline-select"
                            value={pageSize}
                            onChange={(e) => { setPageSize(parseInt(e.target.value)); setPage(0); }}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        elementi per pagina
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger alert-dismissable">
                    <button type="button" className="close" onClick={() => setError(null)}>&times;</button>
                    <i className="fa fa-exclamation-triangle"></i> {error}
                </div>
            )}

            <div className="main-box filter-panel-full">
                <header className="main-box-header filter-header" onClick={() => setShowFilters(!showFilters)}>
                    <h2>Filtri ricerca</h2>
                    <div className="filter-toggle">
                        {showFilters ? <span className="minus-icon">-</span> : <span className="plus-icon">+</span>}
                    </div>
                </header>

                {showFilters && (
                    <div className="main-box-body filter-body">
                        <div className="row">
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Articolo</label>
                                    <AsyncSelect
                                        cacheOptions
                                        loadOptions={loadArticoli}
                                        value={selectedArticolo}
                                        onChange={(val) => { setSelectedArticolo(val); setPage(0); }}
                                        placeholder="Cerca articolo..."
                                        isClearable
                                        classNamePrefix="react-select"
                                        noOptionsMessage={({ inputValue }) => inputValue ? "Nessun risultato" : "Cerca articolo..."}
                                        loadingMessage={() => "Caricamento..."}
                                        styles={{
                                            control: (base) => ({ ...base, minHeight: '34px', borderRadius: '4px' }),
                                            menu: (base) => ({ ...base, zIndex: 9999 })
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Fornitore</label>
                                    <AsyncSelect
                                        cacheOptions
                                        loadOptions={loadFornitori}
                                        value={selectedFornitore}
                                        onChange={(val) => { setSelectedFornitore(val); setPage(0); }}
                                        placeholder="Cerca fornitore..."
                                        isClearable
                                        classNamePrefix="react-select"
                                        noOptionsMessage={({ inputValue }) => inputValue ? "Nessun risultato" : "Cerca fornitore..."}
                                        loadingMessage={() => "Caricamento..."}
                                        styles={{
                                            control: (base) => ({ ...base, minHeight: '34px', borderRadius: '4px' }),
                                            menu: (base) => ({ ...base, zIndex: 9999 })
                                        }}
                                    />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Al</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={dataAl}
                                        onChange={(e) => { setDataAl(e.target.value); setPage(0); }}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="row mt-3">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <select
                                        className="form-control category-select"
                                        value={idCategoria}
                                        onChange={(e) => { setIdCategoria(e.target.value); setPage(0); }}
                                    >
                                        <option value="">Tutte le Categorie</option>
                                        {categorie.map(c => (
                                            <option key={c.id} value={c.id}>{c.descrizione}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label>Sottocategoria</label>
                                    <select
                                        className="form-control category-select"
                                        value={idSottoCategoria}
                                        onChange={(e) => { setIdSottoCategoria(e.target.value); setPage(0); }}
                                        disabled={!idCategoria}
                                    >
                                        <option value="">Tutte le Sottocategorie</option>
                                        {sottoCategorie.map(sc => (
                                            <option key={sc.id} value={sc.id}>{sc.descrizione}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="main-box">
                <div className="main-box-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort(2)} style={{ cursor: 'pointer' }}>CATEGORIA {renderSortIcon(2)}</th>
                                    <th onClick={() => handleSort(1)} style={{ cursor: 'pointer' }}>ARTICOLO {renderSortIcon(1)}</th>
                                    <th onClick={() => handleSort(4)} style={{ cursor: 'pointer' }}>FORNITORE {renderSortIcon(4)}</th>
                                    <th onClick={() => handleSort(6)} className="text-right" style={{ cursor: 'pointer' }}>Q.TÀ {renderSortIcon(6)}</th>
                                    <th className="text-right">VALORE UNITARIO</th>
                                    <th className="text-right">VALORE TOTALE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center">Caricamento in corso...</td></tr>
                                ) : inventario.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center">Nessun articolo trovato</td></tr>
                                ) : (
                                    inventario.map(item => {
                                        const valoreTotale = (item.quantita || 0) * (item.valoreUnitario || 0);
                                        return (
                                            <tr key={item.id}>
                                                <td>{item.descCategoria}</td>
                                                <td>{item.descrizioneProdotto}</td>
                                                <td>{item.descrizioneFornitore}</td>
                                                <td className={`text-right ${item.quantita < 0 ? 'text-danger' : ''}`}>
                                                    <strong>{formatNumber(item.quantita)}</strong>
                                                </td>
                                                <td className="text-right">
                                                    {formatCurrency(item.valoreUnitario)}
                                                </td>
                                                <td className="text-right">
                                                    <strong>{formatCurrency(valoreTotale)}</strong>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-container">
                        <div className="pagination-info">
                            Mostrando da {page * pageSize + 1} a {Math.min((page + 1) * pageSize, totalItems)} di {totalItems} elementi
                        </div>
                        <div className="pagination-controls">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 0}
                                className="btn-paginate"
                            >
                                <FaChevronLeft />
                            </button>
                            <span className="page-number">Pagina {page + 1}</span>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={(page + 1) * pageSize >= totalItems}
                                className="btn-paginate"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InventarioMagazzinoList;
