import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FornitoriService from '../../services/FornitoriService';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaCloudDownloadAlt, FaChevronLeft, FaChevronRight, FaFileAlt } from 'react-icons/fa';
import './FornitoriList.css';
import Swal from 'sweetalert2';

const FornitoriList = () => {
    const navigate = useNavigate();
    const [fornitori, setFornitori] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [sortCol, setSortCol] = useState(0);
    const [sortDir, setSortDir] = useState('asc');

    const fetchFornitori = async () => {
        setLoading(true);
        try {
            const params = {
                search,
                start: currentPage * pageSize,
                length: pageSize,
                orderColumn: sortCol,
                orderDir: sortDir
            };
            const response = await FornitoriService.getList(params);
            setFornitori(response.data.list || []);
            setTotal(response.data.totalCount || 0);
        } catch (error) {
            console.error("Error fetching fornitori:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFornitori();
    }, [currentPage, pageSize, sortCol, sortDir]);

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(0);
        fetchFornitori();
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Vuoi eliminare questo fornitore?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await FornitoriService.delete(id);
                fetchFornitori();
                Swal.fire(
                    'Eliminato!',
                    'Il fornitore è stato eliminato.',
                    'success'
                );
            } catch (error) {
                console.error("Error deleting fornitore:", error);
                Swal.fire(
                    'Errore',
                    "Errore durante l'eliminazione",
                    'error'
                );
            }
        }
    };

    // Helper to render sort icon
    const renderSortIcon = (colIndex) => {
        if (sortCol !== colIndex) return <span className="sort-icon">▼</span>;
        return <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    // Helper for table header clicks
    const handleSort = (colIndex) => {
        setSortCol(colIndex);
        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    };

    return (
        <div className="fornitori-list-container">
            {/* Header Area */}
            <div id="content-header">
                <ol className="breadcrumb">
                    <li><a href="/">HOME</a></li>
                    <li className="active">Elenco fornitori</li>
                </ol>
                <h1>Elenco fornitori</h1>
            </div>

            <div className="row" style={{ margin: '0 10px' }}>
                <div className="col-lg-12">
                    <div className="main-box">
                        <div className="main-box-body">

                            {/* Toolbar */}
                            <div className="toolbar-container">
                                <div className="toolbar-left">
                                    <button className="btn btn-cloud" title="Esporta">
                                        <FaCloudDownloadAlt />
                                    </button>
                                    <label className="visualizza-label">
                                        Visualizza
                                        <select
                                            className="form-control visualizza-select"
                                            value={pageSize}
                                            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
                                        >
                                            <option value={10}>10</option>
                                            <option value={25}>25</option>
                                            <option value={50}>50</option>
                                            <option value={100}>100</option>
                                        </select>
                                        elementi per pagina
                                    </label>
                                </div>
                                <div className="toolbar-right">
                                    <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="search-wrapper">
                                            <input
                                                type="text"
                                                className="search-input"
                                                placeholder="Cerca..."
                                                value={search}
                                                onChange={(e) => setSearch(e.target.value)}
                                            />
                                            <button type="submit" className="search-btn">
                                                <FaSearch />
                                            </button>
                                        </div>
                                        <button className="btn btn-new-fornitore" type="button" onClick={() => navigate('/fornitori/new')}>
                                            <FaPlus /> Nuovo fornitore
                                        </button>
                                    </form>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort(0)} style={{ cursor: 'pointer' }}>CODICE {renderSortIcon(0)}</th>
                                            <th onClick={() => handleSort(1)} style={{ cursor: 'pointer' }}>DENOMINAZIONE {renderSortIcon(1)}</th>
                                            <th onClick={() => handleSort(2)} style={{ cursor: 'pointer' }}>CITTÀ {renderSortIcon(2)}</th>
                                            <th onClick={() => handleSort(3)} style={{ cursor: 'pointer' }}>REFERENTE {renderSortIcon(3)}</th>
                                            <th onClick={() => handleSort(4)} style={{ cursor: 'pointer' }}>P. IVA / CF {renderSortIcon(4)}</th>
                                            {/* <th>ULTIMO DOC.</th> */}
                                            <th style={{ width: '1%' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="6" className="text-center" style={{ padding: '20px', color: '#777' }}>Caricamento...</td>
                                            </tr>
                                        ) : fornitori.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" style={{ padding: '20px', color: '#777' }}>Nessun dato presente nella tabella</td>
                                            </tr>
                                        ) : (
                                            fornitori.map(fornitore => (
                                                <tr key={fornitore.id}>
                                                    <td>{fornitore.codice}</td>
                                                    <td>{fornitore.denominazione}</td>
                                                    <td>{fornitore.elencoIndirizzi && fornitore.elencoIndirizzi.length > 0 ? fornitore.elencoIndirizzi[0].citta : ''}</td>
                                                    <td>{fornitore.referente}</td>
                                                    <td>{fornitore.partitaIva || fornitore.codiceFiscale}</td>
                                                    {/* <td>{fornitore.ultimoDocAcquisto || '-'}</td> */}
                                                    <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                                                        <button
                                                            className="btn-action btn-action-edit"
                                                            onClick={(e) => { e.preventDefault(); navigate(`/fornitori/${fornitore.id}`); }}
                                                            title="Modifica"
                                                        >
                                                            <FaEdit size={16} color="#ffffff" />
                                                        </button>
                                                        <button
                                                            className="btn-action btn-action-card"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                Swal.fire({
                                                                    icon: 'info',
                                                                    title: 'Funzionalità non disponibile',
                                                                    text: 'La scheda fornitore non è ancora stata implementata.',
                                                                    confirmButtonColor: '#03a9f4',
                                                                    confirmButtonText: 'OK'
                                                                });
                                                            }}
                                                            title="Scheda Fornitore"
                                                        >
                                                            <FaFileAlt size={16} color="#ffffff" />
                                                        </button>
                                                        <button
                                                            className="btn-action btn-action-delete"
                                                            onClick={(e) => { e.preventDefault(); handleDelete(fornitore.id); }}
                                                            title="Elimina"
                                                        >
                                                            <FaTrash size={16} color="#ffffff" />
                                                        </button>

                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="pagination-container">
                                <span className="pagination-info">
                                    Visualizzati {fornitori.length} di {total} risultati
                                </span>
                                <nav>
                                    <ul className="pagination">
                                        <li className={currentPage === 0 ? 'disabled' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 0) setCurrentPage(currentPage - 1); }}>
                                                <FaChevronLeft />
                                            </a>
                                        </li>
                                        {[...Array(Math.ceil(total / pageSize))].map((_, i) => {
                                            const totalPages = Math.ceil(total / pageSize);
                                            if (totalPages > 10) {
                                                if (i > 0 && i < totalPages - 1 && (i < currentPage - 2 || i > currentPage + 2)) {
                                                    if (i === currentPage - 3 || i === currentPage + 3) return <li key={i} className="disabled"><span>...</span></li>;
                                                    return null;
                                                }
                                            }
                                            return (
                                                <li key={i} className={currentPage === i ? 'active' : ''}>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(i); }}>
                                                        {i + 1}
                                                    </a>
                                                </li>
                                            );
                                        })}
                                        <li className={(currentPage + 1) * pageSize >= total ? 'disabled' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); if ((currentPage + 1) * pageSize < total) setCurrentPage(currentPage + 1); }}>
                                                <FaChevronRight />
                                            </a>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default FornitoriList;
