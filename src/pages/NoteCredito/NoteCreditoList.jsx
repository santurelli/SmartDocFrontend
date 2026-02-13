import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import NoteCreditoService from '../../services/NoteCreditoService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaSync, FaChevronLeft, FaChevronRight, FaFileAlt, FaHome, FaAngleRight, FaEllipsisV, FaPrint, FaFilePdf, FaArrowRight } from 'react-icons/fa';
import printJS from 'print-js';
import storageHelper from '../../utils/storageHelper';

import { formatStato } from '../../utils/documentUtils';

import './NoteCreditoList.css';

const NoteCreditoList = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [note, setNote] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [activeActionMenu, setActiveActionMenu] = useState(null);

    const [filters, setFilters] = useState(() => {
        const saved = storageHelper.get('note_credito_filters');
        return saved || {
            numDocumento: '',
            dataDa: '',
            dataA: '',
            idCliente: null,
            nomeCliente: '',
            idAgente: null,
            nomeAgente: '',
            idStato: ''
        };
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
        storageHelper.set('note_credito_filters', filters);
        try {
            const res = await NoteCreditoService.search(filters);
            setNote(res.data?.payload || []);
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
        storageHelper.remove('note_credito_filters');
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
                    await NoteCreditoService.delete(id);
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

    const totalAmount = note.reduce((sum, item) => sum + (item.totale || 0), 0);


    return (
        <div className="note-credito-list-container">
            <div className="header-row">
                <h1>Note di Credito</h1>
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

                    {selectedIds.length > 0 && (
                        <div className="vibrant-bulk-toolbar">
                            <div className="toolbar-divider"></div>
                            <span className="selected-count-vibrant">{selectedIds.length} selezionat{selectedIds.length === 1 ? 'o' : 'i'}</span>
                            <button className="btn-bulk-vibrant btn-bulk-delete" onClick={handleBulkDelete}>
                                <FaTrash /> Elimina ({selectedIds.length})
                            </button>
                        </div>
                    )}

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
                                            checked={selectedIds.length === note.length && note.length > 0}
                                        />
                                    </th>
                                    <th>Data</th>
                                    <th>Numero</th>
                                    <th>Cliente</th>
                                    <th>Agente</th>
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
                                                <td>{f.nomeCliente}</td>
                                                <td>{f.nomeAgente || '-'}</td>
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
                        <span className="pagination-info">Visualizzati {note.length} risultati</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NoteCreditoList;
