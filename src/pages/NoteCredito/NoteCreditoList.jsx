import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import NoteCreditoService from '../../services/NoteCreditoService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaSync, FaChevronLeft, FaChevronRight, FaFileAlt, FaHome, FaAngleRight, FaEllipsisV, FaPrint, FaFilePdf, FaArrowRight, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import printJS from 'print-js';
import storageHelper from '../../utils/storageHelper';
import { getDefaultSearchRange } from '../../utils/dateUtils';
import authService from '../../services/authService';

import { formatStato } from '../../utils/documentUtils';

import './NoteCreditoList.css';

const NoteCreditoList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState([]);
    const [total, setTotal] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const [pageSize, setPageSize] = useState((() => {
        const saved = storageHelper.loadState('note_credito_filters', {});
        return saved.pageSize !== undefined ? saved.pageSize : 50;
    })());
    const [currentPage, setCurrentPage] = useState((() => {
        const saved = storageHelper.loadState('note_credito_filters', {});
        return saved.currentPage || 0;
    })());

    const [filters, setFilters] = useState(() => {
        const saved = storageHelper.loadState('note_credito_filters', {});
        const defaultRange = getDefaultSearchRange(30);
        return {
            numDocumento: saved.numDocumento || '',
            dataDa: saved.dataDa || defaultRange.dataDa,
            dataA: saved.dataA || defaultRange.dataA,
            idCliente: saved.idCliente || null,
            nomeCliente: saved.nomeCliente || '',
            idAgente: saved.idAgente || null,
            nomeAgente: saved.nomeAgente || '',
            idStato: saved.idStato || '',
            orderBy: saved.orderBy || 'data_notacredito',
            orderDir: saved.orderDir || 'DESC',
            selectedCliente: saved.selectedCliente || null,
            selectedAgente: saved.selectedAgente || null,
            showFilters: saved.showFilters !== undefined ? saved.showFilters : true
        };
    });

    const [showFilters, setShowFilters] = useState(filters.showFilters);

    const [agenti, setAgenti] = useState([]);
    const [globalConfigs, setGlobalConfigs] = useState(null);

    useEffect(() => {
        fetchAgenti();
        handleSearch();
        loadGlobalConfigs();

        const handleClickOutside = () => setActiveActionMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [currentPage, pageSize, filters.orderBy, filters.orderDir]);

    // Save filters and pagination to local storage whenever they change
    useEffect(() => {
        storageHelper.saveState('note_credito_filters', {
            ...filters,
            showFilters,
            currentPage,
            pageSize
        });
    }, [filters, showFilters, currentPage, pageSize]);

    const fetchAgenti = async () => {
        try {
            const res = await AgentiService.getAll();
            setAgenti(res.data?.payload || []);
        } catch (error) {
            console.error("Error fetching agenti:", error);
        }
    };

    const loadGlobalConfigs = async () => {
        try {
            const res = await ConfigurazioneService.getByDomain('GLOBAL');
            if (res.data) setGlobalConfigs(res.data);
        } catch (err) {
            console.error("Error loading global configurations:", err);
        }
    };

    const isEnabledGlobal = (key) => !globalConfigs || globalConfigs[key] === '1';

    const handleSearch = async (e) => {
        if (e) {
            e.preventDefault();
            setCurrentPage(0);
        }
        setLoading(true);
        try {
            const params = {
                dataInizio: filters.dataDa,
                dataFine: filters.dataA,
                idCliente: filters.idCliente,
                idAgente: filters.idAgente,
                numDocumento: filters.numDocumento,
                stato: filters.idStato,
                orderColumn: filters.orderBy || 'data_notacredito',
                orderDir: filters.orderDir || 'DESC',
                start: (e ? 0 : currentPage) * pageSize,
                length: pageSize
            };
            const res = await NoteCreditoService.getList(params);
            setNote(res.data?.payload || []);
            setTotal(res.data?.totalCount || 0);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        const reset = {
            numDocumento: '',
            dataDa: '',
            dataA: '',
            idCliente: null,
            nomeCliente: '',
            idAgente: null,
            nomeAgente: '',
            idStato: '',
            orderBy: 'data_notacredito',
            orderDir: 'DESC',
            selectedCliente: null,
            selectedAgente: null,
            showFilters: true
        };
        setFilters(reset);
        setCurrentPage(0);
        storageHelper.clearState('note_credito_filters');
    };

    const handleSort = (column) => {
        setFilters(prev => ({
            ...prev,
            orderBy: column,
            orderDir: prev.orderBy === column && prev.orderDir === 'ASC' ? 'DESC' : 'ASC'
        }));
    };

    // Sort Icon Helper
    const getSortIcon = (column) => {
        if (filters.orderBy !== column) return <FaSort style={{ color: '#ccc' }} />;
        return filters.orderDir === 'ASC' ? <FaSortUp /> : <FaSortDown />;
    };

    const loadClienti = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 3) return callback([]);
        ClientiService.getSuggestion(inputValue).then(res => {
            const list = Array.isArray(res.data) ? res.data : (res.data && res.data.payload) || [];
            callback(list.map(c => ({ value: c.id, label: c.denominazione || c.denominazioneData })));
        });
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
                    await NoteCreditoService.delete(id, authService.getCurrentUser()?.id);
                    Swal.fire('Eliminata!', 'La nota di credito è stata eliminata.', 'success');
                    handleSearch();
                } catch (error) {
                    console.error("Error deleting nota:", error);
                    Swal.fire('Errore', "Errore durante l'eliminazione", 'error');
                }
            }
        });
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === note.length && note.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(note.map(n => n.idDocumento || n.id));
        }
    };

    const handleBulkDelete = async () => {
        const result = await Swal.fire({
            title: `Elimina ${selectedIds.length} note di credito?`,
            text: "L'operazione è irreversibile!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sì, elimina tutte'
        });

        if (result.isConfirmed) {
            setLoading(true);
            try {
                for (const id of selectedIds) {
                    await NoteCreditoService.delete(id);
                }
                Swal.fire('Eliminate!', 'Le note di credito selezionate sono state eliminate.', 'success');
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
            const response = await NoteCreditoService.print(id);
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
            const response = await NoteCreditoService.print(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `NotaCredito_${num}.pdf`);
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

    const renderStatus = (f) => {
        const status = f.statoFatturaElettronica || 'BO';
        let label = status;
        let className = 'badge-sdi-';

        switch (status) {
            case 'BO': label = 'Bozza'; className += 'bo'; break;
            case 'DI': label = 'Definitiva'; className += 'di'; break;
            case 'IN': label = 'Inviata'; className += 'in'; break;
            case 'AC': label = 'Accettata'; className += 'ac'; break;
            case 'RC': label = 'Rifiutata'; className += 'rc'; break;
            case 'NS': label = 'Scartata'; className += 'rc'; break;
            case 'MC': label = 'Mancata Cons.'; className += 'mc'; break;
            case 'RF': label = 'Ref. SDI'; className += 'rc'; break;
            default: label = status; className += 'default';
        }

        return (
            <div className="sdi-status-container">
                <span className={`badge-sdi ${className}`}>{label}</span>
            </div>
        );
    };

    const totalAmount = note.reduce((sum, item) => sum + (item.totale || 0), 0);


    return (
        <div className="note-credito-list-container">
            <div className="header-row">
                <h1>Note di Credito</h1>
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
                            <button className="btn-bulk-vibrant btn-bulk-delete" onClick={handleBulkDelete}>
                                <FaTrash /> Elimina ({selectedIds.length})
                            </button>
                        </div>
                    )}
                </div>
                <div className="toolbar-right">
                    <button className="btn-new-vibrant" onClick={() => navigate('/note-credito/new')}>
                        <FaPlus size={14} /> Nuova Nota Credito
                    </button>
                </div>
            </div>

            <div className="filter-box-vibrant">
                <div className="filter-header-vibrant" onClick={() => { }}>
                    <span><FaSearch /> Filtri di ricerca</span>
                </div>
                <div className="filter-body-vibrant">
                    <div className="filter-field">
                        <label>Numero:</label>
                        <input
                            type="text"
                            className="form-control"
                            value={filters.numDocumento}
                            onChange={(e) => setFilters({ ...filters, numDocumento: e.target.value })}
                            placeholder="Cerca numero..."
                        />
                    </div>
                    <div className="filter-field" style={{ minWidth: '300px' }}>
                        <label>Cliente:</label>
                        <AsyncSelect
                            isClearable
                            loadOptions={loadClienti}
                            onChange={(opt) => setFilters({ ...filters, idCliente: opt?.value, nomeCliente: opt?.label })}
                            value={filters.idCliente ? { value: filters.idCliente, label: filters.nomeCliente } : null}
                            placeholder="Cerca cliente..."
                            noOptionsMessage={({ inputValue }) => 
                                !inputValue || inputValue.length < 3 
                                    ? "Digita almeno 3 caratteri per cercare..." 
                                    : "Nessun risultato trovato"
                            }
                            loadingMessage={() => "Caricamento in corso..."}
                            styles={{
                                control: (base) => ({ ...base, minHeight: '38px', borderRadius: '0', borderColor: '#ddd' }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 })
                            }}
                            menuPortalTarget={document.body}
                        />
                    </div>
                    {isEnabledGlobal('AGENTI') && (
                        <div className="filter-field" style={{ minWidth: '200px' }}>
                            <label>Agente:</label>
                            <Select
                                isClearable
                                options={agenti.map(a => ({ value: a.id, label: a.denominazione }))}
                                onChange={(opt) => setFilters({ ...filters, idAgente: opt?.value, nomeAgente: opt?.label })}
                                value={filters.idAgente ? { value: filters.idAgente, label: filters.nomeAgente } : null}
                                placeholder="Tutti..."
                                noOptionsMessage={() => "Nessun risultato trovato"}
                                loadingMessage={() => "Caricamento..."}
                                styles={{
                                    control: (base) => ({ ...base, minHeight: '38px', borderRadius: '0', borderColor: '#ddd' }),
                                    menuPortal: (base) => ({ ...base, zIndex: 9999 })
                                }}
                                menuPortalTarget={document.body}
                            />
                        </div>
                    )}
                    <div className="filter-field">
                        <label>Da Data:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.dataDa}
                            onChange={(e) => setFilters({ ...filters, dataDa: e.target.value })}
                        />
                    </div>
                    <div className="filter-field">
                        <label>A Data:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.dataA}
                            onChange={(e) => setFilters({ ...filters, dataA: e.target.value })}
                        />
                    </div>
                    <button type="button" className="btn-search-vibrant" onClick={handleSearch}>
                        <FaSearch /> Cerca
                    </button>
                    <button type="button" className="btn-paginate" style={{ height: '38px' }} onClick={handleReset}>
                        <FaSync />
                    </button>
                </div>
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
                                            checked={selectedIds.length === note.length && note.length > 0}
                                        />
                                    </th>
                                    <th onClick={() => handleSort('data_notacredito')} style={{ cursor: 'pointer' }}>
                                        Data {getSortIcon('data_notacredito')}
                                    </th>
                                    <th onClick={() => handleSort('num_notacredito')} style={{ cursor: 'pointer' }}>
                                        Numero {getSortIcon('num_notacredito')}
                                    </th>
                                    <th onClick={() => handleSort('d_e_clienti.denominazione')} style={{ cursor: 'pointer' }}>
                                        Cliente {getSortIcon('d_e_clienti.denominazione')}
                                    </th>
                                    {isEnabledGlobal('AGENTI') && <th>Agente</th>}
                                    <th>Stato</th>
                                    <th className="text-right">Totale</th>
                                    <th style={{ width: '1%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="text-center">Caricamento...</td></tr>
                                ) : note.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center">Nessun dato presente</td></tr>
                                ) : (
                                    note.map((f, index) => {
                                        const docId = f.idDocumento || f.id;
                                        return (
                                            <tr key={docId || index}>
                                                <td>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(docId)}
                                                        onChange={() => toggleSelect(docId)}
                                                    />
                                                </td>
                                                <td>{f.dataDocumento}</td>
                                                <td><strong>{f.numDocumento}</strong>{f.particella ? ` / ${f.particella}` : ''}</td>
                                                <td>{f.denominazioneCliente}</td>
                                                {isEnabledGlobal('AGENTI') && <td>{f.agente || '-'}</td>}
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {renderStatus(f)}
                                                </td>
                                                <td className="text-right">{formatMoney(f.totale)}</td>
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
                                                                <button className="action-dropdown-item" onClick={() => navigate(`/note-credito/${docId}`)}>
                                                                    <FaEdit /> Modifica
                                                                </button>
                                                                <button className="action-dropdown-item" onClick={() => handlePrintItem(docId)}>
                                                                    <FaPrint /> Stampa
                                                                </button>
                                                                <button className="action-dropdown-item" onClick={() => handleExportPdfItem(docId, f.numDocumento)}>
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
                        <span className="pagination-info">Visualizzati {note.length} di {total} risultati</span>
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

export default NoteCreditoList;
