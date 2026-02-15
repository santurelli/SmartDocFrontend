import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import DDTService from '../../services/DDTService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaSync, FaChevronLeft, FaChevronRight, FaEllipsisV, FaPrint, FaFilePdf, FaArrowRight } from 'react-icons/fa';
import printJS from 'print-js';
import storageHelper from '../../utils/storageHelper';
import { formatStato } from '../../utils/documentUtils';
import './DDTList.css';

const MODULE_NAME = 'ddt';

const DDTList = () => {
    const navigate = useNavigate();

    // Load initial state
    const initialState = storageHelper.loadState(MODULE_NAME, {
        numDocumento: '',
        dataDa: '',
        dataA: '',
        idCliente: null,
        nomeCliente: '',
        idAgente: null,
        nomeAgente: '',
        idStato: '',
        currentPage: 0,
        pageSize: 50,
        sortCol: 'd_e_ddt.data_ddt',
        sortDir: 'desc'
    });

    const [loading, setLoading] = useState(false);
    const [ddts, setDdts] = useState([]);
    const [total, setTotal] = useState(0);
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const [filters, setFilters] = useState({
        numDocumento: initialState.numDocumento,
        dataDa: initialState.dataDa,
        dataA: initialState.dataA,
        idCliente: initialState.idCliente,
        nomeCliente: initialState.nomeCliente,
        idAgente: initialState.idAgente,
        nomeAgente: initialState.nomeAgente,
        idStato: initialState.idStato
    });

    const [pageSize, setPageSize] = useState(initialState.pageSize);
    const [currentPage, setCurrentPage] = useState(initialState.currentPage);
    const [sortCol, setSortCol] = useState(initialState.sortCol || 'd_e_ddt.data_ddt');
    const [sortDir, setSortDir] = useState(initialState.sortDir || 'desc');

    const [agenti, setAgenti] = useState([]);

    // Save state whenever filters or pagination change
    useEffect(() => {
        storageHelper.saveState(MODULE_NAME, {
            ...filters,
            currentPage,
            pageSize,
            sortCol,
            sortDir
        });
    }, [filters, currentPage, pageSize, sortCol, sortDir]);

    useEffect(() => {
        fetchAgenti();
        handleSearch();

        const handleClickOutside = () => setActiveActionMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [currentPage, pageSize, sortCol, sortDir]);

    const fetchAgenti = async () => {
        try {
            const res = await AgentiService.getAll();
            setAgenti(res.data?.payload || []);
        } catch (error) {
            console.error("Error fetching agenti:", error);
        }
    };

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const params = {
                ...filters,
                start: currentPage * pageSize,
                length: pageSize,
                orderColumn: sortCol,
                orderDir: sortDir
            };
            const res = await DDTService.getList(params);
            setDdts(res.data?.list || []);
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
            idStato: ''
        };
        setFilters(reset);
        setCurrentPage(0);
        storageHelper.clearState(MODULE_NAME);
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
                    await DDTService.delete(id);
                    Swal.fire('Eliminato!', 'Il DDT è stato eliminato.', 'success');
                    handleSearch();
                } catch (error) {
                    Swal.fire('Errore', 'Errore durante l\'eliminazione', 'error');
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
        if (selectedIds.length === ddts.length && ddts.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(ddts.map(d => d.idDocumento || d.id));
        }
    };

    const handleBulkDelete = async () => {
        const result = await Swal.fire({
            title: `Elimina ${selectedIds.length} DDT?`,
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
                    await DDTService.delete(id);
                }
                Swal.fire('Eliminati!', 'I DDT selezionati sono stati eliminati.', 'success');
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

    const handleBulkGenerateFattura = () => {
        if (selectedIds.length === 0) return;
        navigate(`/fatture/new?fromDDT=${selectedIds.join(',')}`);
    };

    const handlePrintItem = async (id) => {
        try {
            const printRes = await DDTService.print(id);
            if (printRes.data.type === 'application/json') {
                const text = await printRes.data.text();
                const err = JSON.parse(text);
                throw new Error(err.message || 'Errore generazione PDF');
            }
            if (printRes.data.size < 100) {
                throw new Error("Il file generato è vuoto o non valido");
            }
            const blob = new Blob([printRes.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            printJS({
                printable: url,
                type: 'pdf',
                onPrintDialogClose: () => {
                    window.URL.revokeObjectURL(url);
                },
                onError: (err) => {
                    console.error("printJS error:", err);
                    window.open(url);
                }
            });
            setActiveActionMenu(null);
        } catch (error) {
            console.error("Error printing:", error);
            Swal.fire('Errore Stampa', error.message || 'Errore durante la stampa', 'error');
        }
    };

    const handleExportPdfItem = async (id, num) => {
        try {
            const printRes = await DDTService.print(id);
            if (printRes.data.type === 'application/json') {
                const text = await printRes.data.text();
                const err = JSON.parse(text);
                throw new Error(err.message || 'Errore generazione PDF');
            }
            const url = window.URL.createObjectURL(new Blob([printRes.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `DDT_${num}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            setActiveActionMenu(null);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            Swal.fire('Errore PDF', error.message || 'Errore durante l\'esportazione PDF', 'error');
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);
    };

    const totalAmount = ddts.reduce((sum, item) => sum + (item.totale || 0), 0);

    const handleSort = (col) => {
        if (sortCol === col) {
            setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        } else {
            setSortCol(col);
            setSortDir('asc');
        }
    };

    const renderSortIcon = (col) => {
        if (sortCol !== col) return <span style={{ opacity: 0.3 }}>▼</span>;
        return <span>{sortDir === 'asc' ? '▲' : '▼'}</span>;
    };


    return (
        <div className="ddt-list-container">
            <div className="header-row">
                <h1>DDT</h1>
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
                            <button className="btn-bulk-vibrant btn-bulk-generate" onClick={handleBulkGenerateFattura}>
                                <FaArrowRight /> Genera fattura ({selectedIds.length})
                            </button>
                            <button className="btn-bulk-vibrant btn-bulk-delete" onClick={handleBulkDelete}>
                                <FaTrash /> Elimina ({selectedIds.length})
                            </button>
                        </div>
                    )}
                </div>
                <div className="toolbar-right">
                    <button className="btn-new-vibrant" onClick={() => navigate('/ddt/new')}>
                        <FaPlus size={14} /> Nuovo DDT
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
                            styles={{
                                control: (base) => ({ ...base, minHeight: '38px', borderRadius: '0', borderColor: '#ddd' }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 })
                            }}
                            menuPortalTarget={document.body}
                        />
                    </div>
                    <div className="filter-field" style={{ minWidth: '200px' }}>
                        <label>Agente:</label>
                        <Select
                            isClearable
                            options={agenti.map(a => ({ value: a.id, label: a.denominazione }))}
                            onChange={(opt) => setFilters({ ...filters, idAgente: opt?.value, nomeAgente: opt?.label })}
                            value={filters.idAgente ? { value: filters.idAgente, label: filters.nomeAgente } : null}
                            placeholder="Tutti..."
                            styles={{
                                control: (base) => ({ ...base, minHeight: '38px', borderRadius: '0', borderColor: '#ddd' }),
                                menuPortal: (base) => ({ ...base, zIndex: 9999 })
                            }}
                            menuPortalTarget={document.body}
                        />
                    </div>
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
                                            checked={selectedIds.length === ddts.length && ddts.length > 0}
                                        />
                                    </th>
                                    <th onClick={() => handleSort('d_e_ddt.data_ddt')} style={{ cursor: 'pointer' }}>
                                        Data {renderSortIcon('d_e_ddt.data_ddt')}
                                    </th>
                                    <th onClick={() => handleSort('d_e_ddt.num_ddt')} style={{ cursor: 'pointer' }}>
                                        Numero {renderSortIcon('d_e_ddt.num_ddt')}
                                    </th>
                                    <th onClick={() => handleSort('d_e_clienti.denominazione')} style={{ cursor: 'pointer' }}>
                                        Cliente {renderSortIcon('d_e_clienti.denominazione')}
                                    </th>
                                    <th>Agente</th>
                                    <th>Stato</th>
                                    <th className="text-right">Totale</th>
                                    <th style={{ width: '1%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center">Caricamento...</td></tr>
                                ) : ddts.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center">Nessun dato presente</td></tr>
                                ) : (
                                    ddts.map((f, index) => {
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
                                                <td><strong>{f.numeroDocumento}</strong>{f.particella ? ` / ${f.particella}` : ''}</td>
                                                <td>{f.soggetto}</td>
                                                <td>{f.agente || '-'}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {formatStato(f.stato).split('\n').map((line, i) => (
                                                        <React.Fragment key={i}>
                                                            {line}
                                                            {i < formatStato(f.stato).split('\n').length - 1 && <br />}
                                                        </React.Fragment>
                                                    ))}
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
                                                                <button className="action-dropdown-item" onClick={() => navigate(`/ddt/${docId}`)}>
                                                                    <FaEdit /> Modifica
                                                                </button>
                                                                <button className="action-dropdown-item" onClick={() => navigate(`/fatture/new?fromDDT=${docId}`)}>
                                                                    <FaArrowRight /> Genera Fattura
                                                                </button>
                                                                <button className="action-dropdown-item" onClick={() => handlePrintItem(docId)}>
                                                                    <FaPrint /> Stampa
                                                                </button>
                                                                <button className="action-dropdown-item" onClick={() => handleExportPdfItem(docId, f.numeroDocumento)}>
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
                        <span className="pagination-info">Visualizzati {ddts.length} di {total} risultati</span>
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

export default DDTList;
