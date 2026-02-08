import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import PreventiviService from '../../services/PreventiviService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaCloudDownloadAlt, FaSync, FaChevronLeft, FaChevronRight, FaFileAlt, FaHome, FaAngleRight } from 'react-icons/fa';
import './PreventiviList.css'; // Assume CSS exists or reuse generic

// ...

const PreventiviList = () => {
    const navigate = useNavigate();
    const [preventivi, setPreventivi] = useState([]);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [total, setTotal] = useState(0);

    // Filters
    const [idCliente, setIdCliente] = useState('');
    const [idAgente, setIdAgente] = useState('');
    const [dtFrom, setDtFrom] = useState(''); // Initialize with start of year if needed
    const [dtTo, setDtTo] = useState('');   // Initialize with end of year

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [sortCol, setSortCol] = useState(0);
    const [sortDir, setSortDir] = useState('asc');

    // Dropdowns data
    const [agentiOptions, setAgentiOptions] = useState([]);

    // Selected objects for React Select
    const [selectedCliente, setSelectedCliente] = useState(null);
    const [selectedAgente, setSelectedAgente] = useState(null);

    useEffect(() => {
        // Load initial data
        loadAgenti();
        fetchPreventivi();
    }, [currentPage, pageSize, sortCol, sortDir]);

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

    const fetchPreventivi = async () => {
        setLoading(true);
        try {
            const params = {
                idCliente,
                idAgente,
                dtFrom,
                dtTo,
                start: currentPage * pageSize,
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

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(0);
        fetchPreventivi();
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
                fetchPreventivi();
                Swal.fire('Eliminato!', 'Il preventivo è stato eliminato.', 'success');
            } catch (error) {
                console.error("Error deleting preventivo:", error);
                Swal.fire('Errore', "Errore durante l'eliminazione", 'error');
            }
        }
    };

    const handleExport = async () => {
        setDownloading(true);
        try {
            const params = {
                idCliente,
                idAgente,
                dtFrom,
                dtTo,
                orderColumn: sortCol,
                orderDir: sortDir
            };
            const response = await PreventiviService.exportExcel(params);
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'elenco_preventivi.xls');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error exporting:", error);
            Swal.fire('Errore', "Errore durante l'esportazione", 'error');
        } finally {
            setDownloading(false);
        }
    };

    const handleSort = (colIndex) => {
        setSortCol(colIndex);
        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    };

    const renderSortIcon = (colIndex) => {
        if (sortCol !== colIndex) return <span className="sort-icon">▼</span>;
        return <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    const [showFilters, setShowFilters] = useState(true);

    // Format currency
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);
    };

    const totalAmount = preventivi.reduce((sum, item) => sum + (item.totale || 0), 0);

    return (
        <div className="preventivi-list-container">
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li><FaAngleRight /></li>
                <li className="active">Elenco preventivi</li>
            </ul>

            <div className="header-row">
                <h1>Elenco preventivi</h1>
                <div id="total-display-header" className="hidden-xs">
                    <strong>{formatMoney(totalAmount)}</strong> Totale
                </div>
            </div>

            {/* Toolbar Row */}
            <div className="toolbar-row">
                <div className="toolbar-left">
                    <button className="btn btn-cloud" title="Esporta" onClick={handleExport} disabled={downloading}>
                        {downloading ? <FaSync className="fa-spin" /> : <FaCloudDownloadAlt />}
                    </button>
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
                </div>
                <div className="toolbar-right">
                    <button className="btn-new-vibrant" onClick={() => navigate('/preventivi/new')}>
                        <FaPlus size={14} /> Nuovo preventivo
                    </button>
                </div>
            </div>

            {/* Filter Box */}
            <div className="filter-box-vibrant">
                <div className="filter-header-vibrant" onClick={() => setShowFilters(!showFilters)}>
                    <span>Filtri ricerca</span>
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
                                noOptionsMessage={({ inputValue }) => {
                                    if (!inputValue) return "Inizia a scrivere per cercare un cliente...";
                                    if (inputValue.length < 3) return "Scrivi almeno 3 caratteri...";
                                    return "Nessun cliente trovato.";
                                }}
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
                                noOptionsMessage={() => "Nessun agente trovato."}
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
                    </form>
                )}
            </div>

            <div className="main-box">
                <div className="main-box-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th onClick={() => handleSort(0)} style={{ cursor: 'pointer' }}>Data {renderSortIcon(0)}</th>
                                    <th onClick={() => handleSort(1)} style={{ cursor: 'pointer' }}>Numero {renderSortIcon(1)}</th>
                                    <th onClick={() => handleSort(2)} style={{ cursor: 'pointer' }}>Cliente {renderSortIcon(2)}</th>
                                    <th onClick={() => handleSort(3)} style={{ cursor: 'pointer' }}>Agente {renderSortIcon(3)}</th>
                                    <th>Stato</th>
                                    <th>Totale</th>
                                    <th style={{ width: '1%' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="7" className="text-center">Caricamento...</td></tr>
                                ) : preventivi.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center">Nessun dato presente</td></tr>
                                ) : (
                                    preventivi.map(prev => (
                                        <tr key={prev.id}>
                                            <td>{prev.dataDocumento}</td>
                                            <td>{prev.numeroDocumento}</td>
                                            <td>{prev.soggetto}</td>
                                            <td>{prev.agente}</td>
                                            <td>{prev.stato}</td>
                                            <td className="text-right">{formatMoney(prev.totale)}</td>
                                            <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                                                <button className="btn-action btn-action-edit" onClick={() => navigate(`/preventivi/${prev.id}`)} title="Modifica">
                                                    <FaEdit size={16} />
                                                </button>
                                                <button className="btn-action btn-action-delete" onClick={() => handleDelete(prev.id)} title="Elimina">
                                                    <FaTrash size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
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
