import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import OrdiniService from '../../services/OrdiniService';
import FornitoriService from '../../services/FornitoriService';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaSync, FaChevronLeft, FaChevronRight, FaHome, FaAngleRight, FaEllipsisV, FaArrowRight, FaTruckLoading, FaFileInvoiceDollar } from 'react-icons/fa';
import storageHelper from '../../utils/storageHelper';
import { getDefaultSearchRange } from '../../utils/dateUtils';
import './OrdiniList.css';

const MODULE_NAME = 'ordini';

const getStatoBadgeClass = (stato) => {
    if (!stato) return 'stato-in-corso';
    const s = stato.toLowerCase();
    if (s.includes('conclus') && !s.includes('parz')) return 'stato-concluso';
    if (s.includes('parz')) return 'stato-parziale';
    return 'stato-in-corso';
};

const OrdiniList = () => {
    const navigate = useNavigate();

    const defaultRange = getDefaultSearchRange(30);

    const initialState = storageHelper.loadState(MODULE_NAME, {
        idFornitore: '',
        dtFrom: defaultRange.dataDa,
        dtTo: defaultRange.dataA,
        currentPage: 0,
        pageSize: 50,
        sortCol: 'd_e_ordini.data_ordine',
        sortDir: 'desc',
        selectedFornitore: null,
        showFilters: true
    });

    const [ordini, setOrdini] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    const [filters, setFilters] = useState({
        idFornitore: initialState.idFornitore,
        dataDa: initialState.dtFrom || defaultRange.dataDa,
        dataA: initialState.dtTo || defaultRange.dataA
    });

    const [currentPage, setCurrentPage] = useState(initialState.currentPage);
    const [pageSize, setPageSize] = useState(initialState.pageSize);
    const [sortCol, setSortCol] = useState(initialState.sortCol);
    const [sortDir, setSortDir] = useState(initialState.sortDir);

    const [selectedFornitore, setSelectedFornitore] = useState(initialState.selectedFornitore);
    const [showFilters, setShowFilters] = useState(initialState.showFilters);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const handleClickOutside = () => setActiveActionMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === ordini.length && ordini.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(ordini.map(o => o.id));
        }
    };

    useEffect(() => {
        storageHelper.saveState(MODULE_NAME, {
            idFornitore: filters.idFornitore,
            dtFrom: filters.dataDa,
            dtTo: filters.dataA,
            currentPage,
            pageSize,
            sortCol,
            sortDir,
            selectedFornitore,
            showFilters
        });
    }, [filters, currentPage, pageSize, sortCol, sortDir, selectedFornitore, showFilters]);

    useEffect(() => {
        handleSearch();
    }, [currentPage, pageSize, sortCol, sortDir]);

    const loadFornitori = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 3) return callback([]);
        FornitoriService.getSuggestion(inputValue).then(res => {
            const list = Array.isArray(res.data) ? res.data : (res.data && res.data.payload) || [];
            callback(list.map(f => ({ value: f.id, label: f.denominazione || f.denominazioneData })));
        }).catch(err => {
            console.error("Errore nel caricamento dei fornitori:", err);
            callback([]);
        });
    };

    const handleSearch = async (e) => {
        if (e) {
            e.preventDefault();
            setCurrentPage(0);
        }
        setLoading(true);
        try {
            const params = {
                ...filters,
                start: (e ? 0 : currentPage) * pageSize,
                length: pageSize,
                orderColumn: sortCol,
                orderDir: sortDir
            };
            const res = await OrdiniService.getList(params);
            const payload = res.data?.payload || res.data;
            setOrdini(payload?.list || []);
            setTotal(payload?.totalCount || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFilters({ idFornitore: '', dataDa: '', dataA: '' });
        setSelectedFornitore(null);
        setCurrentPage(0);
        storageHelper.clearState(MODULE_NAME);
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Sei sicuro?',
            text: "Non potrai annullare questa operazione!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina!',
            cancelButtonText: 'Annulla'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await OrdiniService.delete(id);
                    Swal.fire('Eliminato!', "L'ordine è stato eliminato.", 'success');
                    handleSearch();
                } catch (error) {
                    Swal.fire('Errore', "Errore durante l'eliminazione", 'error');
                }
            }
        });
    };

    const handleSort = (col) => {
        if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortCol(col); setSortDir('asc'); }
    };

    const renderSortIcon = (col) => {
        if (sortCol !== col) return <span className="sort-icon" style={{ opacity: 0.3 }}>▼</span>;
        return <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    const formatMoney = (amount) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);

    const totalAmount = ordini.reduce((sum, item) => sum + (item.totale || 0), 0);

    return (
        <div className="ordini-list-container">
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li><FaAngleRight /></li>
                <li className="active">Ordini a fornitori</li>
            </ul>

            <div className="header-row">
                <h1>Ordini a fornitori</h1>
                <div id="total-display-header" className="hidden-xs">
                    <div className="total-display-item total-all">
                        <span className="total-label">Totale</span>
                        <strong>{formatMoney(totalAmount)}</strong>
                    </div>
                </div>
            </div>

            <div className="toolbar-row">
                <div className="toolbar-left">
                    <div className="rows-per-page">
                        <span>Mostra</span>
                        <select value={pageSize} onChange={e => { setPageSize(parseInt(e.target.value)); setCurrentPage(0); }}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>righe per pagina</span>
                    </div>

                    {selectedIds.length > 0 && (
                        <div className="vibrant-bulk-toolbar">
                            <div className="toolbar-divider"></div>
                            <span className="selected-count-vibrant">{selectedIds.length} selezionat{selectedIds.length === 1 ? 'o' : 'i'}</span>
                        </div>
                    )}
                </div>
                <div className="toolbar-right">
                    <button className="btn-new-vibrant" onClick={() => navigate('/ordini/new')}>
                        <FaPlus size={14} /> Nuovo Ordine
                    </button>
                </div>
            </div>

            <div className="filter-box-vibrant">
                <div className="filter-header-vibrant" onClick={() => setShowFilters(!showFilters)}>
                    <span><FaSearch /> Filtri ricerca</span>
                    <span>{showFilters ? '-' : '+'}</span>
                </div>
                {showFilters && (
                    <div className="filter-body-vibrant">
                        <div className="filter-field" style={{ minWidth: '300px' }}>
                            <label>Fornitore:</label>
                            <AsyncSelect
                                cacheOptions
                                defaultOptions
                                loadOptions={loadFornitori}
                                onChange={(opt) => {
                                    setSelectedFornitore(opt);
                                    setFilters({ ...filters, idFornitore: opt ? opt.value : '' });
                                }}
                                value={selectedFornitore}
                                placeholder="Scegli fornitore..."
                                noOptionsMessage={({ inputValue }) =>
                                    !inputValue || inputValue.length < 3
                                        ? "Digita almeno 3 caratteri per cercare..."
                                        : "Nessun risultato trovato"
                                }
                                loadingMessage={() => "Caricamento in corso..."}
                                isClearable
                                menuPortalTarget={document.body}
                                styles={{ menuPortal: base => ({ ...base, zIndex: 9999 }) }}
                            />
                        </div>
                        <div className="filter-field">
                            <label>Dal:</label>
                            <input type="date" className="form-control" value={filters.dataDa} onChange={(e) => setFilters({ ...filters, dataDa: e.target.value })} />
                        </div>
                        <div className="filter-field">
                            <label>Al:</label>
                            <input type="date" className="form-control" value={filters.dataA} onChange={(e) => setFilters({ ...filters, dataA: e.target.value })} />
                        </div>
                        <button type="button" className="btn-search-vibrant" onClick={handleSearch}>
                            <FaSearch /> Cerca
                        </button>
                        <button type="button" className="btn-paginate" style={{ height: '38px' }} onClick={handleReset}>
                            <FaSync />
                        </button>
                    </div>
                )}
            </div>

            <div className="main-box">
                <div className="main-box-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <input type="checkbox" onChange={toggleSelectAll} checked={selectedIds.length === ordini.length && ordini.length > 0} />
                                    </th>
                                    <th onClick={() => handleSort('d_e_ordini.data_ordine')} style={{ cursor: 'pointer' }}>
                                        Data {renderSortIcon('d_e_ordini.data_ordine')}
                                    </th>
                                    <th onClick={() => handleSort('d_e_ordini.num_ordine')} style={{ cursor: 'pointer' }}>
                                        Numero {renderSortIcon('d_e_ordini.num_ordine')}
                                    </th>
                                    <th>Fornitore</th>
                                    <th>Stato</th>
                                    <th className="text-right">Totale</th>
                                    <th style={{ width: '1%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center">Caricamento...</td></tr>
                                ) : ordini.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center">Nessun dato presente</td></tr>
                                ) : (
                                    ordini.map((o, index) => {
                                        const docId = o.id;
                                        const fornitoreLabel = o.descFornitore || o.nomeFornitore || o.fornitoreDto?.denominazione || '';
                                        return (
                                            <tr key={docId || index}>
                                                <td>
                                                    <input type="checkbox" checked={selectedIds.includes(docId)} onChange={() => toggleSelect(docId)} />
                                                </td>
                                                <td>{o.dataDocumento}</td>
                                                <td><strong>{o.numDocumento}</strong>{o.particella ? ` / ${o.particella}` : ''}</td>
                                                <td>{fornitoreLabel}</td>
                                                <td>
                                                    <span className={`stato-badge ${getStatoBadgeClass(o.statoOrdine)}`}>
                                                        {o.statoOrdine || 'In corso'}
                                                    </span>
                                                </td>
                                                <td className="text-right">{formatMoney(o.totale)}</td>
                                                <td className="text-right">
                                                    <div className="action-menu-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                                                        <button
                                                            className="btn-action btn-action-ellipsis"
                                                            onClick={(e) => { e.stopPropagation(); setActiveActionMenu(activeActionMenu === docId ? null : docId); }}
                                                            title="Altre azioni"
                                                        >
                                                            <FaEllipsisV size={14} />
                                                        </button>
                                                        {activeActionMenu === docId && (
                                                            <div className="action-dropdown-menu">
                                                                <button className="action-dropdown-item" onClick={() => navigate(`/ordini/${docId}`)}>
                                                                    <FaEdit /> Visualizza/Modifica
                                                                </button>
                                                                {o.statoOrdine !== 'Concluso' && (
                                                                    <button className="action-dropdown-item" onClick={() => navigate(`/bollecarico/new?fromOrdine=${docId}`)}>
                                                                        <FaTruckLoading /> Genera Bolla di carico
                                                                    </button>
                                                                )}
                                                                <button className="action-dropdown-item" onClick={() => navigate(`/fatture-fornitore/new?fromOrdine=${docId}`)}>
                                                                    <FaFileInvoiceDollar /> Genera Fattura Fornitore
                                                                </button>
                                                                <div className="action-dropdown-divider"></div>
                                                                <button className="action-dropdown-item text-danger" onClick={() => handleDelete(docId)}>
                                                                    <FaTrash /> Elimina
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-container">
                        <span className="pagination-info">Visualizzati {ordini.length} di {total} risultati</span>
                        <div className="btn-group" style={{ display: 'flex', alignItems: 'center' }}>
                            <button className="btn btn-paginate" disabled={currentPage === 0} onClick={() => setCurrentPage(c => c - 1)}><FaChevronLeft /></button>
                            <span style={{ padding: '6px 12px', color: '#555', fontSize: '0.9em' }}>Pag. {currentPage + 1} / {Math.ceil(total / pageSize) || 1}</span>
                            <button className="btn btn-paginate" disabled={(currentPage + 1) * pageSize >= total} onClick={() => setCurrentPage(c => c + 1)}><FaChevronRight /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrdiniList;
