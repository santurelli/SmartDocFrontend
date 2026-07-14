import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import FattureService from '../../services/FattureService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaSync, FaChevronLeft, FaChevronRight, FaHome, FaAngleRight, FaEllipsisV, FaPrint, FaFilePdf, FaArrowRight, FaCaretDown, FaSort, FaSortUp, FaSortDown, FaExclamationTriangle, FaInfoCircle, FaPaperPlane, FaFileImport, FaFileCode, FaBolt } from 'react-icons/fa';
import printJS from 'print-js';
import storageHelper from '../../utils/storageHelper';
import { getDefaultSearchRange } from '../../utils/dateUtils';
import NoteCreditoService from '../../services/NoteCreditoService';

import { formatStato, formatTipoFattura } from '../../utils/documentUtils';

import './FattureList.css';

const MODULE_NAME = 'fatture';

const FattureList = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const defaultRange = getDefaultSearchRange(30);

    // Load initial state
    const initialState = storageHelper.loadState(MODULE_NAME, {
        numDocumento: '',
        dataDa: defaultRange.dataDa,
        dataA: defaultRange.dataA,
        idCliente: null,
        nomeCliente: '',
        idAgente: null,
        nomeAgente: '',
        currentPage: 0,
        pageSize: 50,
        sortCol: 'data_fattura',
        sortDir: 'desc',
        showFilters: true
    });

    const [loading, setLoading] = useState(false);
    const [fatture, setFatture] = useState([]);
    const [total, setTotal] = useState(0);
    const [totali, setTotali] = useState({ f: 0, s: 0, d: 0 }); // f = fatturato, s = saldato, d = da saldare
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [docConfigs, setDocConfigs] = useState(null);
    const [globalConfigs, setGlobalConfigs] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        numDocumento: initialState.numDocumento || '',
        dataDa: initialState.dataDa || defaultRange.dataDa,
        dataA: initialState.dataA || defaultRange.dataA,
        idCliente: initialState.idCliente || null,
        nomeCliente: initialState.nomeCliente || '',
        idAgente: initialState.idAgente || null,
        nomeAgente: initialState.nomeAgente || '',
        idStato: initialState.idStato || '',
        orderBy: initialState.orderBy || 'data_fattura',
        orderDir: initialState.orderDir || 'DESC'
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(initialState.currentPage || 0);
    const [pageSize, setPageSize] = useState(initialState.pageSize || 50);

    // Dropdowns data
    const [agenti, setAgenti] = useState([]);

    const [showFilters, setShowFilters] = useState(initialState.showFilters);

    // Close action menu on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveActionMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Save state whenever filters or pagination change
    useEffect(() => {
        storageHelper.saveState(MODULE_NAME, {
            ...filters,
            currentPage,
            pageSize,
            showFilters
        });
    }, [filters, currentPage, pageSize, showFilters]);

    useEffect(() => {
        fetchAgenti();
        loadDocConfigs();
        handleSearch();
    }, [currentPage, pageSize, filters.orderBy, filters.orderDir]);

    useEffect(() => {
        window.addEventListener('configupdated', loadDocConfigs);
        return () => window.removeEventListener('configupdated', loadDocConfigs);
    }, []);

    const loadDocConfigs = async () => {
        try {
            const res = await ConfigurazioneService.getByDomain('DOCUMENTI');
            if (res.data) setDocConfigs(res.data);

            const resGlobal = await ConfigurazioneService.getByDomain('GLOBAL');
            if (resGlobal.data) setGlobalConfigs(resGlobal.data);
        } catch (err) {
            console.error("Error loading fatture configurations:", err);
        }
    };

    const isEnabled = (key) => !docConfigs || docConfigs[key] === '1';
    const isEnabledGlobal = (key) => !globalConfigs || globalConfigs[key] === '1';

    const fetchAgenti = async () => {
        try {
            const res = await AgentiService.getAll();
            setAgenti(res.data?.payload || []);
        } catch (error) {
            console.error("Error fetching agenti:", error);
        }
    };

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
                stato: filters.idStato,
                numDocumento: filters.numDocumento,
                orderColumn: filters.orderBy || 'data_fattura',
                orderDir: filters.orderDir || 'DESC',
                start: (e ? 0 : currentPage) * pageSize,
                length: pageSize
            };
            const res = await FattureService.getList(params);
            const payload = res.data?.payload;
            if (payload) {
                setFatture(payload.list || []);
                setTotal(payload.totalCount || 0);
                setTotali({
                    f: payload.totFatturato || 0,
                    s: payload.totSaldato || 0,
                    d: payload.totDaSaldare || 0
                });
            } else {
                setFatture([]);
                setTotal(0);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Errore nel caricamento delle fatture', 'error');
            setFatture([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
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
            orderBy: 'data_fattura',
            orderDir: 'DESC',
            selectedCliente: null,
            selectedAgente: null,
            showFilters: true
        };
        setFilters(reset);
        setCurrentPage(0);
        storageHelper.clearState('fatture_filters');
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
                    await FattureService.delete(id);
                    Swal.fire('Eliminata!', 'La fattura è stata eliminata.', 'success');
                    handleSearch();
                } catch (error) {
                    console.error("Error deleting fattura:", error);
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
        if (selectedIds.length === fatture.length && fatture.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(fatture.map(f => f.idDocumento || f.id));
        }
    };

    const handleBulkDelete = async () => {
        const result = await Swal.fire({
            title: `Elimina ${selectedIds.length} fatture?`,
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
                    await FattureService.delete(id);
                }
                Swal.fire('Eliminate!', 'Le fatture selezionate sono state eliminate.', 'success');
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

    const handleBulkGenerateNoteCredito = () => {
        if (selectedIds.length === 0) return;
        navigate(`/note-credito/new?fromFatture=${selectedIds.join(',')}`);
    };

    const handlePrintItem = async (id) => {
        try {
            const response = await FattureService.print(id);
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
            const response = await FattureService.print(id);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Fattura_${num}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setActiveActionMenu(null);
        } catch (error) {
            console.error("Error exporting PDF:", error);
            Swal.fire('Errore', 'Errore durante l\'esportazione PDF', 'error');
        }
    };

    const handleSendSdi = async (id) => {
        try {
            Swal.fire({
                title: 'Invio a SDI...',
                text: 'Attendere prego',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            await FattureService.sendSdi(id);

            Swal.fire({
                icon: 'success',
                title: 'Successo',
                text: 'Fattura accodata per l\'invio allo SDI. L\'esito sarà disponibile a breve.',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                handleSearch(); // Refresh list
            });
            setActiveActionMenu(null);
        } catch (err) {
            console.error('Errore durante l\'invio a SDI:', err);
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'Si è verificato un errore durante l\'invio a SDI.'
            });
        }
    };

    const handleInviaOra = async (id) => {
        try {
            Swal.fire({
                title: 'Invio a SDI...',
                text: 'Attendere prego',
                allowOutsideClick: false,
                didOpen: () => { Swal.showLoading(); }
            });
            await FattureService.inviaOra(id);
            Swal.fire({
                icon: 'success',
                title: 'Invio avviato',
                text: 'La fattura è stata inviata allo SDI. L\'esito sarà disponibile a breve.',
                timer: 2500,
                showConfirmButton: false
            }).then(() => { handleSearch(); });
            setActiveActionMenu(null);
        } catch (err) {
            console.error('Errore durante l\'invio a SDI:', err);
            Swal.fire({ icon: 'error', title: 'Errore', text: 'Si è verificato un errore durante l\'invio a SDI.' });
        }
    };

    const handleDownloadXml = async (id, num) => {
        try {
            const response = await FattureService.downloadXml(id);
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/xml' }));
            const link = document.createElement('a');
            link.href = url;
            
            // Try to get filename from content-disposition if possible, otherwise use fallback
            const contentDisposition = response.headers['content-disposition'];
            let fileName = `Fattura_${num}.xml`;
            if (contentDisposition) {
                const fileNameMatch = contentDisposition.match(/filename=(.+)/);
                if (fileNameMatch && fileNameMatch.length > 1) fileName = fileNameMatch[1];
            }
            
            link.setAttribute('download', fileName);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setActiveActionMenu(null);
        } catch (error) {
            console.error("Error downloading XML:", error);
            Swal.fire('Errore', 'Errore durante lo scaricamento dell\'XML', 'error');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Reset input to allow selecting the same file again if needed
        e.target.value = '';

        try {
            Swal.fire({
                title: 'Importazione in corso...',
                text: 'Attendere prego',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const res = await FattureService.importXml(file);
            
            Swal.fire({
                icon: 'success',
                title: 'Importazione completata',
                text: 'La fattura è stata importata correttamente.',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                handleSearch(); // Refresh list
            });
        } catch (err) {
            console.error('Errore durante l\'importazione XML:', err);
            const msg = err.response?.data?.message || err.message || 'Si è verificato un errore durante l\'importazione.';
            Swal.fire({
                icon: 'error',
                title: 'Errore Importazione',
                text: msg
            });
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);
    };

    const renderInternalBadge = (f) => {
        const status = f.statoFatturaElettronica;
        if (status === 'BO' || !status) {
            return <span className="internal-status-badge badge-bozza">Bozza</span>;
        } else if (status === 'DI') {
            return <span className="internal-status-badge badge-definitiva">Definitiva</span>;
        }
        return null;
    };

    const renderPaymentProgress = (f) => {
        const hasScadenze = f.scadenzeCount > 0;
        let perc = 0;
        let label = '';

        if (hasScadenze) {
            perc = (f.scadenzePagateCount / f.scadenzeCount) * 100;
            label = `Pagate ${f.scadenzePagateCount} di ${f.scadenzeCount} scadenze`;
        } else {
            const totale = f.totaleDocumento || f.totale || 0;
            const pagato = f.totalePagato || 0;
            perc = totale > 0 ? Math.min(100, Math.max(0, (pagato / totale) * 100)) : 0;
            label = `Pagato: ${formatMoney(pagato)} su ${formatMoney(totale)}`;
        }
        
        // Colore dinamico basato sullo stato
        let barClass = 'bg-danger';
        if (perc >= 100) barClass = 'bg-success';
        else if (perc > 0) barClass = 'bg-warning';

        return (
            <div className="payment-progress-wrapper" title={label}>
                <div className="payment-progress-bar-container">
                    <div 
                        className={`payment-progress-bar ${barClass}`} 
                        style={{ width: `${perc}%` }}
                    ></div>
                </div>
            </div>
        );
    };

    const renderSdiStatus = (f) => {
        const isElettronica = f.flFatturaElettronica === 1;
        const status = f.statoFatturaElettronica;
        
        // Se non è elettronica, lo stato interno è già gestito dal badge
        if (!isElettronica) return null;
        
        // Se è Bozza, non mostriamo nulla nella colonna SDI. Lo stato 'DI' invece lo mostriamo come 'Inviata allo SDI' o 'In attesa'
        if (status === 'BO' || !status) return null;

        const descr = f.descrizioneStatoFatturaElettronica || status;
        const error = f.erroreConsegna || f.erroreXml;

        const badgeClass = `sdi-badge sdi-badge-${(status || '').toLowerCase()}`;

        return (
            <div className="sdi-status-container">
                <span className={badgeClass}>
                    {descr}
                </span>
                {error && (
                    <button
                        className="btn-sdi-error"
                        onClick={(e) => { e.stopPropagation(); showSdiError(f); }}
                        title="Visualizza errore SDI"
                    >
                        <FaExclamationTriangle />
                    </button>
                )}
            </div>
        );
    };

    const showSdiError = (f) => {
        const error = f.erroreConsegna || f.erroreXml;
        Swal.fire({
            title: 'Dettaglio Errore SDI',
            text: error,
            icon: 'error',
            confirmButtonText: 'Chiudi',
            confirmButtonColor: '#03a9f4'
        });
    };

    const totalAmount = totali.f;
    const paidAmount = totali.s;
    const dueAmount = totali.d;

    // Sort columns
    // Data -> data_fattura
    // Numero -> num_fattura
    // Cliente -> d_e_clienti.denominazione

    return (
        <div className="fatture-list-container">
            <div className="header-row">
                <h1>Fatture</h1>
                <div id="total-display-header" className="hidden-xs">
                    <div className="total-display-item total-all">
                        <span className="total-label">Fatturato</span>
                        <strong>{formatMoney(totalAmount)}</strong>
                    </div>
                    <div className="total-display-item total-paid">
                        <span className="total-label">Incassato</span>
                        <strong>{formatMoney(paidAmount)}</strong>
                    </div>
                    <div className="total-display-item total-due">
                        <span className="total-label">Da Incassare</span>
                        <strong>{formatMoney(dueAmount)}</strong>
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
                            {isEnabled('ABILITA_NOTE_CREDITO') && (
                                <button className="btn-bulk-vibrant btn-bulk-generate" onClick={handleBulkGenerateNoteCredito} style={{ backgroundColor: '#e74c3c' }}>
                                    <FaPlus /> Genera Nota Credito ({selectedIds.length})
                                </button>
                            )}
                            <button className="btn-bulk-vibrant btn-bulk-delete" onClick={handleBulkDelete}>
                                <FaTrash /> Elimina ({selectedIds.length})
                            </button>
                        </div>
                    )}
                </div>
                <div className="toolbar-right" style={{ display: 'flex', gap: '10px' }}>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".xml"
                        style={{ display: 'none' }}
                    />
                    <button
                        className="btn-premium-outline"
                        onClick={handleImportClick}
                        style={{ color: '#27ae60', borderColor: '#27ae60' }}
                    >
                        <FaFileImport /> Importa XML
                    </button>
                    <div className="split-btn-container blue-theme" ref={activeActionMenu === 'new-menu' ? null : null /* Ref not needed here as we use state */}>
                        <button
                            className="split-btn-main btn-premium-blue"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenu(activeActionMenu === 'new-menu' ? null : 'new-menu');
                            }}
                        >
                            <FaPlus /> Nuova Fattura
                        </button>
                        <button
                            type="button"
                            className="split-btn-toggle"
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenu(activeActionMenu === 'new-menu' ? null : 'new-menu');
                            }}
                        >
                            <FaCaretDown />
                        </button>
                        {activeActionMenu === 'new-menu' && (
                            <div className="split-btn-menu show" style={{ bottom: 'auto', top: '100%', marginTop: '8px' }}>
                                {isEnabled('ABILITA_FATTURE') && (
                                    <button className="split-btn-item" onClick={() => navigate('/fatture/new?tipo=FATTURA&elet=1')}>
                                        <FaPlus /> Nuova Fattura Elettronica
                                    </button>
                                )}
                                {isEnabled('ABILITA_FATTURE_ACCOMPAGNATORIE') && (
                                    <button className="split-btn-item" onClick={() => navigate('/fatture/new?tipo=FATTURA_ACCOMPAGNATORIA&elet=1')}>
                                        <FaPlus /> Nuova Accompagnatoria El.
                                    </button>
                                )}
                                {isEnabled('ABILITA_FATTURE_PROFORMA') && (
                                    <button className="split-btn-item" onClick={() => navigate('/fatture/new?tipo=FATTURA_PROFORMA')}>
                                        <FaPlus /> Nuova Pro Forma
                                    </button>
                                )}
                                {isEnabled('ABILITA_NOTE_DEBITO') && (
                                    <button className="split-btn-item" onClick={() => navigate('/fatture/new?tipo=NOTA_DEBITO')}>
                                        <FaPlus /> Nuova Nota di Debito
                                    </button>
                                )}
                                {isEnabled('ABILITA_FATTURE_SEMPLIFICATE') && (
                                    <button className="split-btn-item" onClick={() => navigate('/fatture/new?tipo=FATTURA_SEMPLIFICATA&elet=1')}>
                                        <FaPlus /> Nuova Fattura Semplificata
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
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
                                            checked={selectedIds.length === fatture.length && fatture.length > 0}
                                        />
                                    </th>
                                    <th onClick={() => handleSort('data_fattura')} style={{ cursor: 'pointer' }}>
                                        Data {getSortIcon('data_fattura')}
                                    </th>
                                    <th onClick={() => handleSort('tipo_fattura')} style={{ cursor: 'pointer' }}>
                                        Tipo {getSortIcon('tipo_fattura')}
                                    </th>
                                    <th onClick={() => handleSort('num_fattura')} style={{ cursor: 'pointer' }}>
                                        Numero {getSortIcon('num_fattura')}
                                    </th>
                                    <th onClick={() => handleSort('d_e_clienti.denominazione')} style={{ cursor: 'pointer' }}>
                                        Cliente {getSortIcon('d_e_clienti.denominazione')}
                                    </th>
                                    {isEnabledGlobal('AGENTI') && <th>Agente</th>}
                                    <th>Doc. Collegati</th>
                                    <th>Stato</th>
                                    <th className="text-right">Totale</th>
                                    <th style={{ width: '1%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="10" className="text-center">Caricamento...</td></tr>
                                ) : fatture.length === 0 ? (
                                    <tr><td colSpan="10" className="text-center">Nessun dato presente</td></tr>
                                ) : (
                                    fatture.map((f, index) => {
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
                                                <td className="column-tipo">{formatTipoFattura(f.tipoFattura)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <strong>{f.numDocumento}</strong>
                                                        {f.numeroDocumento && f.numeroDocumento !== f.numDocumento && (
                                                            <span className="internal-status-badge badge-particella">
                                                                {f.numeroDocumento.replace(f.numDocumento, '').replace(/^[\s/]+/, '')}
                                                            </span>
                                                        )}
                                                        {renderInternalBadge(f)}
                                                    </div>
                                                </td>
                                                <td>{f.denominazioneCliente}</td>
                                                {isEnabledGlobal('AGENTI') && <td>{f.agente || '-'}</td>}
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {formatStato(f.stato).split('\n').map((line, i) => (
                                                        <React.Fragment key={i}>
                                                            {line}
                                                            {i < formatStato(f.stato).split('\n').length - 1 && <br />}
                                                        </React.Fragment>
                                                    ))}
                                                </td>
                                                <td>{renderSdiStatus(f)}</td>
                                                <td className="text-right">
                                                    <div className="money-cell">
                                                        {formatMoney(f.totaleDocumento || f.totale)}
                                                        {renderPaymentProgress(f)}
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <div className={`action-menu-container${activeActionMenu === docId ? ' is-open' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
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
                                                                <button className="action-dropdown-item" onClick={() => navigate(`/fatture/${docId}`)}>
                                                                    <FaEdit /> Modifica
                                                                </button>
                                                                {isEnabled('ABILITA_NOTE_CREDITO') && (
                                                                    <button className="action-dropdown-item" onClick={() => navigate(`/note-credito/new?fromFatture=${docId}`)}>
                                                                        <FaArrowRight /> Genera Nota Credito
                                                                    </button>
                                                                )}
                                                                <button className="action-dropdown-item" onClick={() => handlePrintItem(docId)}>
                                                                    <FaPrint /> Stampa
                                                                </button>
                                                                <button className="action-dropdown-item" onClick={() => handleExportPdfItem(docId, f.numDocumento)}>
                                                                    <FaFilePdf /> Esporta PDF
                                                                </button>
                                                                {f.flFatturaElettronica === 1 && (f.statoFatturaElettronica === 'DI' || f.descrizioneStatoFatturaElettronica === 'Da inviare') && (
                                                                    <button className="action-dropdown-item" onClick={() => handleInviaOra(docId)}>
                                                                        <FaBolt /> Invia ora a SDI
                                                                    </button>
                                                                )}
                                                                {f.flFatturaElettronica === 1 && f.statoFatturaElettronica === 'NS' && (
                                                                    <button className="action-dropdown-item" onClick={() => handleSendSdi(docId)}>
                                                                        <FaPaperPlane /> Reinvia a SDI
                                                                    </button>
                                                                )}
                                                                {f.flFatturaElettronica === 1 && (
                                                                    <button className="action-dropdown-item" onClick={() => handleDownloadXml(docId, f.numDocumento)}>
                                                                        <FaFileCode /> Scarica XML
                                                                    </button>
                                                                )}
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
                        <span className="pagination-info">Visualizzati {fatture.length} di {total} risultati</span>
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

export default FattureList;
