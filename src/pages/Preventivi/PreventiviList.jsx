import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PreventiviService from '../../services/PreventiviService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaCloudDownloadAlt, FaChevronLeft, FaChevronRight, FaFileAlt } from 'react-icons/fa';
import './PreventiviList.css'; // Assume CSS exists or reuse generic
// import DateRangePicker from 'react-bootstrap-daterangepicker'; // If available, or use standard date inputs for now
// Assuming simple date inputs for now as in legacy migration plan to keep it simple or check "ClientiList" dependencies.
// ClientiList used custom CSS.

const PreventiviList = () => {
    const navigate = useNavigate();
    const [preventivi, setPreventivi] = useState([]);
    const [loading, setLoading] = useState(false);
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
    const [clientiOptions, setClientiOptions] = useState([]); // Or use async select
    const [agentiOptions, setAgentiOptions] = useState([]);

    useEffect(() => {
        // Load initial data for filters (or just rely on Typeahead/Select2 logic if implemented)
        // For simplicity, we might load list on mount.
        fetchPreventivi();
    }, [currentPage, pageSize, sortCol, sortDir]);

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

    const handleSort = (colIndex) => {
        setSortCol(colIndex);
        setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    };

    const renderSortIcon = (colIndex) => {
        if (sortCol !== colIndex) return <span className="sort-icon">▼</span>;
        return <span className="sort-icon">{sortDir === 'asc' ? '▲' : '▼'}</span>;
    };

    // Format currency
    const formatMoney = (amount) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);
    };

    return (
        <div className="preventivi-list-container">
            <div id="content-header">
                <ol className="breadcrumb">
                    <li><a href="/">HOME</a></li>
                    <li className="active">Elenco preventivi</li>
                </ol>
                <h1>Elenco preventivi</h1>
            </div>

            <div className="row" style={{ margin: '0 10px' }}>
                <div className="col-lg-12">
                    <div className="main-box">
                        <header className="main-box-header clearfix">
                            {/* Filter Block - simplified version */}
                            <div className="filter-block">
                                <form className="form-inline" onSubmit={handleSearch}>
                                    <div className="form-group">
                                        <label>Dal: </label>
                                        <input type="date" className="form-control" value={dtFrom} onChange={e => setDtFrom(e.target.value)} />
                                    </div>
                                    <div className="form-group" style={{ marginLeft: '10px' }}>
                                        <label>Al: </label>
                                        <input type="date" className="form-control" value={dtTo} onChange={e => setDtTo(e.target.value)} />
                                    </div>
                                    {/* Client/Agent Selects would go here, maybe AsyncSelect */}
                                    <button type="submit" className="btn btn-primary pull-right" style={{ marginLeft: '10px' }}>
                                        <FaSearch /> Cerca
                                    </button>
                                </form>
                            </div>
                            <div className="filter-block pull-right">
                                <a href="/preventivi/new" className="btn btn-primary" onClick={(e) => { e.preventDefault(); navigate('/preventivi/new'); }}>
                                    <FaPlus /> Nuovo preventivo
                                </a>
                            </div>
                        </header>

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
                                                            <FaEdit size={16} color="#ffffff" />
                                                        </button>
                                                        <button className="btn-action btn-action-delete" onClick={() => handleDelete(prev.id)} title="Elimina">
                                                            <FaTrash size={16} color="#ffffff" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination - Reuse logic from ClientiList */}
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
            </div>
        </div>
    );
};

export default PreventiviList;
