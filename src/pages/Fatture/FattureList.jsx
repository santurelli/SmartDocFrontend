import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import FattureService from '../../services/FattureService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaSync, FaChevronLeft, FaChevronRight, FaFileAlt, FaHome, FaAngleRight, FaEllipsisV, FaPrint, FaFilePdf, FaArrowRight, FaCaretDown, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import printJS from 'print-js';
import storageHelper from '../../utils/storageHelper';
import NoteCreditoService from '../../services/NoteCreditoService';

import { formatStato } from '../../utils/documentUtils';

import './FattureList.css';

const FattureList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fatture, setFatture] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const [filters, setFilters] = useState(() => {
        return storageHelper.loadState('fatture_filters', {
            numDocumento: '',
            dataDa: '',
            dataA: '',
            idCliente: null,
            nomeCliente: '',
            idAgente: null,
            nomeAgente: '',
            idStato: '',
            orderBy: 'data_fattura',
            orderDir: 'DESC'
        });
    });

    const [agenti, setAgenti] = useState([]);

    useEffect(() => {
        fetchAgenti();
        handleSearch();

        const handleClickOutside = () => setActiveActionMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

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
        storageHelper.saveState('fatture_filters', filters);
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
                start: 0,
                length: 100
            };
            const res = await FattureService.getList(params);
            setFatture(res.data?.payload || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (column) => {
        setFilters(prev => {
            const newDir = prev.orderBy === column && prev.orderDir === 'ASC' ? 'DESC' : 'ASC';
            const newFilters = { ...prev, orderBy: column, orderDir: newDir };
            // Trigger search with new filters immediately is tricky because setFilters is async and handleSearch uses state.
            // Better to just update state and let user click search, OR use a useEffect that triggers on sort change?
            // Actually, standard pattern here is just update state and call search directly with new params.
            // But handleSearch uses 'filters' state. So we must pass params to handleSearch or use a dedicated effect.
            // For simplicity, let's update state and manually trigger search logic or use an effect.
            // Given existing structure, let's update state and then call a modified search function or useEffect.
            // Actually, let's just update state and modify handleSearch to accept overrides or use a separate effect for sort?
            // A common pattern:
            // update state -> useEffect([filters.orderBy, filters.orderDir]) -> handleSearch()
            // But handleSearch is called on mount.
            return newFilters;
        });

        // We need to trigger the search with the new values.
        // Since setFilters is async, we can't rely on 'filters' immediately.
        // But we computed newDir and column.

        setLoading(true);
        const newDir = filters.orderBy === column && filters.orderDir === 'ASC' ? 'DESC' : 'ASC';
        const params = {
            dataInizio: filters.dataDa,
            dataFine: filters.dataA,
            idCliente: filters.idCliente,
            idAgente: filters.idAgente,
            stato: filters.idStato,
            numDocumento: filters.numDocumento,
            orderColumn: column,
            orderDir: newDir,
            start: 0,
            length: 100
        };
        // Also update storage
        storageHelper.saveState('fatture_filters', { ...filters, orderBy: column, orderDir: newDir });

        FattureService.getList(params).then(res => {
            setFatture(res.data?.payload || []);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
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
            orderDir: 'DESC'
        };
        setFilters(reset);
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

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);
    };

    const totalAmount = fatture.reduce((sum, item) => sum + (item.totale || 0), 0);

    // Sort columns
    // Data -> data_fattura
    // Numero -> num_fattura
    // Cliente -> d_e_clienti.denominazione

    return (
        <div className="fatture-list-container">
            <div className="header-row">
                <h1>Fatture</h1>
                <div id="total-display-header" className="hidden-xs">
                    <strong>{formatMoney(totalAmount)}</strong> Totale
                </div>
            </div>

            <div className="toolbar-row">
                <div className="toolbar-left">
                    <div className="rows-per-page">
                        <span>Mostra</span>
                        <select value={50} disabled>
                            <option value={50}>50</option>
                        </select>
                        <span>righe</span>
                    </div>

                </div>
                <div className="toolbar-right">
                    <div className="action-menu-container" style={{ position: 'relative' }}>
                        <button className="btn-new-vibrant" onClick={() => navigate('/fatture/new')}>
                            <FaPlus size={14} /> Nuova Fattura
                        </button>
                        <button
                            className="btn-new-vibrant"
                            style={{ marginLeft: '1px', paddingLeft: '8px', paddingRight: '8px' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionMenu(activeActionMenu === 'new-menu' ? null : 'new-menu');
                            }}
                        >
                            <FaCaretDown />
                        </button>
                        {activeActionMenu === 'new-menu' && (
                            <div className="action-dropdown-menu" style={{ right: 0, top: '40px', minWidth: '220px' }}>
                                <button className="action-dropdown-item" onClick={() => navigate('/fatture/new?tipo=FATTURA&elet=1')}>
                                    <FaPlus /> Nuova Fattura Elettronica
                                </button>
                                <button className="action-dropdown-item" onClick={() => navigate('/fatture/new?tipo=FATTURA_ACCOMPAGNATORIA&elet=1')}>
                                    <FaPlus /> Nuova Accompagnatoria El.
                                </button>
                                <button className="action-dropdown-item" onClick={() => navigate('/fatture/new?tipo=FATTURA_PROFORMA')}>
                                    <FaPlus /> Nuova Pro Forma
                                </button>
                                <button className="action-dropdown-item" onClick={() => navigate('/fatture/new?tipo=NOTA_DEBITO')}>
                                    <FaPlus /> Nuova Nota di Debito
                                </button>
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
                    {selectedIds.length > 0 && (
                        <div className="vibrant-bulk-toolbar">
                            <div className="toolbar-divider"></div>
                            <span className="selected-count-vibrant">{selectedIds.length} selezionat{selectedIds.length === 1 ? 'o' : 'i'}</span>
                            <button className="btn-bulk-vibrant btn-bulk-generate" onClick={handleBulkGenerateNoteCredito}>
                                <FaArrowRight /> Genera Nota Credito ({selectedIds.length})
                            </button>
                            <button className="btn-bulk-vibrant btn-bulk-delete" onClick={handleBulkDelete}>
                                <FaTrash /> Elimina ({selectedIds.length})
                            </button>
                        </div>
                    )}
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
                                    <th onClick={() => handleSort('num_fattura')} style={{ cursor: 'pointer' }}>
                                        Numero {getSortIcon('num_fattura')}
                                    </th>
                                    <th onClick={() => handleSort('d_e_clienti.denominazione')} style={{ cursor: 'pointer' }}>
                                        Cliente {getSortIcon('d_e_clienti.denominazione')}
                                    </th>
                                    <th>Agente</th>
                                    <th>Stato</th>
                                    <th className="text-right">Totale</th>
                                    <th style={{ width: '1%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="8" className="text-center">Caricamento...</td></tr>
                                ) : fatture.length === 0 ? (
                                    <tr><td colSpan="8" className="text-center">Nessun dato presente</td></tr>
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
                                                <td><strong>{f.numDocumento}</strong>{f.particella ? ` / ${f.particella}` : ''}</td>
                                                <td>{f.denominazioneCliente}</td>
                                                <td>{f.agente || '-'}</td>
                                                <td style={{ whiteSpace: 'nowrap' }}>
                                                    {formatStato(f.stato).split('\n').map((line, i) => (
                                                        <React.Fragment key={i}>
                                                            {line}
                                                            {i < formatStato(f.stato).split('\n').length - 1 && <br />}
                                                        </React.Fragment>
                                                    ))}
                                                </td>
                                                <td className="text-right">{formatMoney(f.totaleDocumento || f.totale)}</td>
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
                                                                <button className="action-dropdown-item" onClick={() => navigate(`/fatture/${docId}`)}>
                                                                    <FaEdit /> Modifica
                                                                </button>
                                                                <button className="action-dropdown-item" onClick={() => navigate(`/note-credito/new?fromFatture=${docId}`)}>
                                                                    <FaArrowRight /> Genera Nota Credito
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
                        <span className="pagination-info">Visualizzati {fatture.length} risultati</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FattureList;
