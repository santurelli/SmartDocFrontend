import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import PreventiviService from '../../services/PreventiviService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaSync, FaChevronLeft, FaChevronRight, FaHome, FaAngleRight, FaEllipsisV, FaPrint, FaFilePdf, FaArrowRight } from 'react-icons/fa';
import printJS from 'print-js';
import storageHelper from '../../utils/storageHelper';
import { formatStato } from '../../utils/documentUtils';
import './PreventiviList.css';

const MODULE_NAME = 'preventivi';

const PreventiviList = () => {
    const navigate = useNavigate();

    // Load initial state
    const initialState = storageHelper.loadState(MODULE_NAME, {
        idCliente: '',
        idAgente: '',
        dtFrom: '',
        dtTo: '',
        currentPage: 0,
        pageSize: 50,
        sortCol: 'data_preventivo',
        sortDir: 'desc',
        selectedCliente: null,
        selectedAgente: null,
        showFilters: true
    });

    const [preventivi, setPreventivi] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [docConfigs, setDocConfigs] = useState(null);

    // Filters
    const [idCliente, setIdCliente] = useState(initialState.idCliente);
    const [idAgente, setIdAgente] = useState(initialState.idAgente);
    const [dtFrom, setDtFrom] = useState(initialState.dtFrom);
    const [dtTo, setDtTo] = useState(initialState.dtTo);

    // Pagination
    const [currentPage, setCurrentPage] = useState(initialState.currentPage);
    const [pageSize, setPageSize] = useState(initialState.pageSize);
    const [sortCol, setSortCol] = useState(initialState.sortCol || 'data_preventivo');
    const [sortDir, setSortDir] = useState(initialState.sortDir || 'desc');

    // Dropdowns data
    const [agentiOptions, setAgentiOptions] = useState([]);

    // Selected objects for React Select
    const [selectedCliente, setSelectedCliente] = useState(initialState.selectedCliente);
    const [selectedAgente, setSelectedAgente] = useState(initialState.selectedAgente);

    const [showFilters, setShowFilters] = useState(initialState.showFilters);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    // Close action menu on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveActionMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Selection handlers
    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === preventivi.length && preventivi.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(preventivi.map(c => String(c.idDocumento || c.id)));
        }
    };

    // Save state whenever filters or pagination change
    useEffect(() => {
        storageHelper.saveState(MODULE_NAME, {
            idCliente,
            idAgente,
            dtFrom,
            dtTo,
            currentPage,
            pageSize,
            sortCol,
            sortDir,
            selectedCliente,
            selectedAgente,
            showFilters
        });
    }, [idCliente, idAgente, dtFrom, dtTo, currentPage, pageSize, sortCol, sortDir, selectedCliente, selectedAgente, showFilters]);

    useEffect(() => {
        loadAgenti();
        loadDocConfigs();
        handleSearch();
    }, [currentPage, pageSize, sortCol, sortDir]);

    useEffect(() => {
        window.addEventListener('configupdated', loadDocConfigs);
        return () => window.removeEventListener('configupdated', loadDocConfigs);
    }, []);

    const loadDocConfigs = async () => {
        try {
            const res = await ConfigurazioneService.getByDomain('DOCUMENTI');
            if (res.data) setDocConfigs(res.data);
        } catch (err) {
            console.error("Error loading preventivi configurations:", err);
        }
    };

    const isEnabled = (key) => !docConfigs || docConfigs[key] === '1';

    const loadAgenti = async () => {
        try {
            const res = await AgentiService.getAll();
            if (res.data && Array.isArray(res.data)) {
                const options = res.data.map(a => ({
                    value: a.id,
                    label: a.descrizione || a.nome
                }));
                setAgentiOptions(options);
            }
        } catch (error) {
            console.error("Error loading agenti:", error);
        }
    };

    const loadClientiOptions = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 3) {
            callback([]);
            return;
        }
        ClientiService.getSuggestion(inputValue).then(res => {
            if (res.data) {
                const options = res.data.map(c => ({
                    value: c.id,
                    label: c.denominazione
                }));
                callback(options);
            } else {
                callback([]);
            }
        }).catch(err => {
            console.error("Error loading clienti:", err);
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
                idCliente,
                idAgente,
                dtFrom,
                dtTo,
                start: (e ? 0 : currentPage) * pageSize,
                length: pageSize,
                orderColumn: sortCol,
                orderDir: sortDir
            };
            const response = await PreventiviService.getList(params);
            setPreventivi(response.data.list || []);
            setTotal(response.data.totalCount || 0);
        } catch (error) {
            console.error("Error fetching preventivi:", error);
            Swal.fire('Errore', 'Errore nel caricamento dei preventivi', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setIdCliente('');
        setIdAgente('');
        setDtFrom('');
        setDtTo('');
        setSelectedCliente(null);
        setSelectedAgente(null);
        setCurrentPage(0);
        storageHelper.clearState(MODULE_NAME);
        // fetchPreventivi will be triggered by useEffect due to state changes
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Vuoi eliminare questo preventivo?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await PreventiviService.delete(id);
                handleSearch();
                Swal.fire('Eliminato!', 'Il preventivo è stato eliminato.', 'success');
            } catch (error) {
                console.error("Error deleting preventivo:", error);
                Swal.fire('Errore', "Errore durante l'eliminazione", 'error');
            }
        }
    };

    const handleSort = (column) => {
        if (sortCol === column) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(column);
            setSortDir('asc');
        }
    };

    const renderSortIcon = (column) => {
        if (sortCol !== column) return <span className="sort-icon" style={{ opacity: 0.3 }}>▼</span>;
        return <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    const handleBulkGenerateConf = () => {
        if (selectedIds.length === 0) return;
        navigate(`/conf-ordine/new?fromPreventivi=${selectedIds.join(',')}`);
    };

    const handleBulkGenerateDDT = () => {
        if (selectedIds.length === 0) return;
        navigate(`/ddt/new?fromPreventivi=${selectedIds.join(',')}`);
    };

    const handleBulkGenerateFattura = () => {
        if (selectedIds.length === 0) return;
        navigate(`/fatture/new?fromPreventivi=${selectedIds.join(',')}`);
    };

    const handleBulkDelete = async () => {
        const result = await Swal.fire({
            title: `Elimina ${selectedIds.length} preventiv${selectedIds.length === 1 ? 'o' : 'i'}?`,
            text: "L'operazione è irreversibile!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sì, elimina tutti'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                for (const id of selectedIds) {
                    await PreventiviService.delete(id);
                }
                Swal.fire('Eliminati!', 'I preventivi selezionati sono stati eliminati.', 'success');
                setSelectedIds([]);
                handleSearch();
            } catch (error) {
                console.error("Bulk delete error:", error);
                Swal.fire('Errore', "Errore durante l'eliminazione massiva", 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const handlePrintItem = async (id) => {
        try {
            const response = await PreventiviService.print(id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            printJS({ printable: url, type: 'pdf' });
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            setActiveActionMenu(null);
        } catch (error) {
            console.error("Error printing:", error);
            Swal.fire('Errore', 'Errore durante la stampa', 'error');
        }
    };

    const handleExportPdfItem = async (id, num) => {
        try {
            const response = await PreventiviService.print(id);
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Preventivo_${num}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setActiveActionMenu(null);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            Swal.fire('Errore', 'Errore durante l\'esportazione PDF', 'error');
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);
    };

    const totalAmount = preventivi.reduce((sum, item) => sum + (item.totale || 0), 0);

    return (
        <div className="preventivi-list-container">
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li><FaAngleRight /></li>
                <li className="active">Preventivi</li>
            </ul>

            <div className="header-row">
                <h1>Preventivi</h1>
                <div id="total-display-header" className="hidden-xs">
                    <strong>{formatMoney(totalAmount)}</strong> Totale
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
                            {isEnabled('ABILITA_CONF_ORDINE') && (
                                <button className="btn-bulk-vibrant btn-bulk-generate" onClick={handleBulkGenerateConf}>
                                    <FaArrowRight /> Genera Conferma ({selectedIds.length})
                                </button>
                            )}
                            {isEnabled('ABILITA_DDT') && (
                                <button className="btn-bulk-vibrant btn-bulk-generate ddt" onClick={handleBulkGenerateDDT} style={{ backgroundColor: '#e67e22' }}>
                                    <FaArrowRight /> Genera DDT ({selectedIds.length})
                                </button>
                            )}
                            {isEnabled('ABILITA_FATTURE') && (
                                <button className="btn-bulk-vibrant btn-bulk-generate fattura" onClick={handleBulkGenerateFattura} style={{ backgroundColor: '#2ecc71' }}>
                                    <FaArrowRight /> Genera Fattura ({selectedIds.length})
                                </button>
                            )}
                            <button className="btn-bulk-vibrant btn-bulk-delete" onClick={handleBulkDelete}>
                                <FaTrash /> Elimina ({selectedIds.length})
                            </button>
                        </div>
                    )}
                </div>
                <div className="toolbar-right">
                    <button className="btn-new-vibrant" onClick={() => navigate('/preventivi/new')}>
                        <FaPlus size={14} /> Nuovo Preventivo
                    </button>
                </div>
            </div>

            <div className="filter-box-vibrant">
                <div className="filter-header-vibrant" onClick={() => setShowFilters(!showFilters)}>
                    <span><FaSearch /> Filtri ricerca</span>
                    <span>{showFilters ? '-' : '+'}</span>
                </div>
                {showFilters && (
                    <form className="filter-body-vibrant" onSubmit={handleSearch}>
                        <div className="filter-field">
                            <label>Dal:</label>
                            <input type="date" className="form-control" value={dtFrom} onChange={e => setDtFrom(e.target.value)} />
                        </div>
                        <div className="filter-field">
                            <label>Al:</label>
                            <input type="date" className="form-control" value={dtTo} onChange={e => setDtTo(e.target.value)} />
                        </div>
                        <div className="filter-field" style={{ minWidth: '300px' }}>
                            <label>Cliente:</label>
                            <AsyncSelect
                                cacheOptions
                                defaultOptions
                                loadOptions={loadClientiOptions}
                                onChange={(opt) => {
                                    setSelectedCliente(opt);
                                    setIdCliente(opt ? opt.value : '');
                                }}
                                value={selectedCliente}
                                placeholder="Scegli cliente..."
                                isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                 noOptionsMessage={({ inputValue }) =>
                                    !inputValue || inputValue.length < 3
                                        ? "Digita almeno 3 caratteri per cercare..."
                                        : "Nessun risultato trovato"
                                }
                                loadingMessage={() => "Ricerca in corso..."}
                                styles={{
                                    control: (base) => ({ ...base, minHeight: '38px', borderRadius: '0', borderColor: '#ddd' }),
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                                }}
                            />
                        </div>
                        <div className="filter-field" style={{ minWidth: '250px' }}>
                            <label>Agente:</label>
                            <Select
                                options={agentiOptions}
                                onChange={(opt) => {
                                    setSelectedAgente(opt);
                                    setIdAgente(opt ? opt.value : '');
                                }}
                                value={selectedAgente}
                                placeholder="Scegli agente..."
                                isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                 noOptionsMessage={() => "Nessun risultato trovato"}
                                loadingMessage={() => "Caricamento..."}
                                styles={{
                                    control: (base) => ({ ...base, minHeight: '38px', borderRadius: '0', borderColor: '#ddd' }),
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                                }}
                            />
                        </div>
                        <button type="submit" className="btn-search-vibrant">
                            <FaSearch /> Cerca
                        </button>
                        <button type="button" className="btn-paginate" style={{ height: '38px' }} onClick={handleReset}>
                            <FaSync />
                        </button>
                    </form>
                )}
            </div>

            <div className="main-box">
                <div className="main-box-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th style={{ width: '40px' }}>
                                        <input
                                            type="checkbox"
                                            onChange={toggleSelectAll}
                                            checked={selectedIds.length === preventivi.length && preventivi.length > 0}
                                        />
                                    </th>
                                    <th onClick={() => handleSort('data_preventivo')} style={{ cursor: 'pointer' }}>Data {renderSortIcon('data_preventivo')}</th>
                                    <th onClick={() => handleSort('num_preventivo')} style={{ cursor: 'pointer' }}>Numero {renderSortIcon('num_preventivo')}</th>
                                    <th onClick={() => handleSort('d_e_clienti.denominazione')} style={{ cursor: 'pointer' }}>Cliente {renderSortIcon('d_e_clienti.denominazione')}</th>
                                    <th onClick={() => handleSort('d_e_agenti.denominazione')} style={{ cursor: 'pointer' }}>Agente {renderSortIcon('d_e_agenti.denominazione')}</th>
                                    <th>Stato</th>
                                    <th>Totale</th>
                                    <th style={{ width: '1%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="text-center">Caricamento...</td></tr>
                                ) : preventivi.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center">Nessun dato presente</td></tr>
                                ) : (
                                    preventivi.map((prev, index) => {
                                        const docId = prev.idDocumento || prev.id;
                                        const strId = String(docId);
                                        return (
                                            <tr key={docId || index}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(strId)}
                                                            onChange={() => toggleSelect(strId)}
                                                            disabled={!docId}
                                                        />
                                                    </div>
                                                </td>
                                                <td>{prev.dataDocumento}</td>
                                                <td>{prev.numeroDocumento}</td>
                                                <td>{prev.soggetto}</td>
                                                <td>{prev.agente}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {formatStato(prev.stato).split('\n').map((line, i) => (
                                                        <React.Fragment key={i}>
                                                            {line}
                                                            {i < formatStato(prev.stato).split('\n').length - 1 && <br />}
                                                        </React.Fragment>
                                                    ))}
                                                </td>
                                                <td className="text-right">{formatMoney(prev.totale)}</td>
                                                <td className="text-right">
                                                    <div className="action-menu-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                                                        <button
                                                            className="btn-action btn-action-ellipsis"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActiveActionMenu(activeActionMenu === docId ? null : docId);
                                                            }}
                                                            title="Altre azioni"
                                                        >
                                                            <FaEllipsisV size={14} />
                                                        </button>
                                                        {activeActionMenu === docId && (
                                                            <div className="action-dropdown-menu">
                                                                <button className="action-dropdown-item" onClick={() => navigate(`/preventivi/${docId}`)}>
                                                                    <FaEdit /> Modifica
                                                                </button>
                                                                {isEnabled('ABILITA_CONF_ORDINE') && (
                                                                    <button className="action-dropdown-item" onClick={() => navigate(`/conf-ordine/new?fromPreventivi=${docId}`)}>
                                                                        <FaArrowRight /> Genera Conferma
                                                                    </button>
                                                                )}
                                                                {isEnabled('ABILITA_DDT') && (
                                                                    <button className="action-dropdown-item" onClick={() => navigate(`/ddt/new?fromPreventivi=${docId}`)}>
                                                                        <FaArrowRight /> Genera DDT
                                                                    </button>
                                                                )}
                                                                {isEnabled('ABILITA_FATTURE') && (
                                                                    <button className="action-dropdown-item" onClick={() => navigate(`/fatture/new?fromPreventivi=${docId}`)}>
                                                                        <FaArrowRight /> Genera Fattura
                                                                    </button>
                                                                )}
                                                                <button className="action-dropdown-item" onClick={() => handlePrintItem(docId)}>
                                                                    <FaPrint /> Stampa
                                                                </button>
                                                                <button className="action-dropdown-item" onClick={() => handleExportPdfItem(docId, prev.numeroDocumento)}>
                                                                    <FaFilePdf /> Esporta PDF
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
                        <span className="pagination-info">Visualizzati {preventivi.length} di {total} risultati</span>
                        <div className="btn-group">
                            <button className="btn btn-paginate" disabled={currentPage === 0} onClick={() => setCurrentPage(c => c - 1)}><FaChevronLeft /></button>
                            <button className="btn btn-paginate" disabled={(currentPage + 1) * pageSize >= total} onClick={() => setCurrentPage(c => c + 1)}><FaChevronRight /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreventiviList;
