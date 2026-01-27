import React, { useState, useEffect } from 'react';
import MovimentiMagazzinoService from '../../services/MovimentiMagazzinoService';
import ArticoliService from '../../services/ArticoliService';
import { FaSearch, FaChevronLeft, FaChevronRight, FaFileExcel } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import './ArticoliList.css'; // Reusing Articoli CSS

const MovimentiList = () => {
    const [movimenti, setMovimenti] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const location = useLocation();

    // Filters
    const [dtFrom, setDtFrom] = useState('');
    const [dtTo, setDtTo] = useState('');
    const [selectedArticle, setSelectedArticle] = useState(null);

    useEffect(() => {
        // Init dates to current month? Or empty? 
        // Legacy used current month.
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        // Helper to format YYYY-MM-DD for input type="date"
        const fmt = (d) => d.toISOString().split('T')[0];
        setDtFrom(fmt(firstDay));
        setDtTo(fmt(lastDay));

        // Check for navigation state to pre-fill filter
        if (location.state?.filterByArticle) {
            setSelectedArticle(location.state.filterByArticle);
        }
    }, [location.state]);

    // Initial load after dates are set
    useEffect(() => {
        if (dtFrom && dtTo) {
            fetchMovimenti();
        }
    }, [page, pageSize, dtFrom, dtTo, selectedArticle]);

    const fetchMovimenti = async () => {
        setLoading(true);
        try {
            // Backend expects format DD/MM/YYYY
            const formatDate = (isoDate) => {
                if (!isoDate) return '';
                const [yyyy, mm, dd] = isoDate.split('-');
                return `${dd}/${mm}/${yyyy}`;
            };

            const response = await MovimentiMagazzinoService.list({
                start: page * pageSize,
                length: pageSize,
                dtFrom: formatDate(dtFrom),
                dtTo: formatDate(dtTo),
                idProdotto: selectedArticle ? selectedArticle.value : null
            });
            // Backend returns List<MovimentoMagazzinoDto> directly in payload?
            // Yes, GenericResponseDto.payload
            if (response.payload) {
                setMovimenti(response.payload);
            } else {
                setMovimenti([]);
            }
        } catch (error) {
            console.error("Error fetching movimenti", error);
            setMovimenti([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value));
        setPage(0);
    };

    const handleExport = () => {
        alert("Export to Excel not yet implemented");
    };

    return (
        <div className="container-fluid page-content">
            <div className="header-row">
                <div className="breadcrumb">
                    <a href="/">Home</a> / <span>Movimenti magazzino</span>
                </div>
                <h1>Movimenti magazzino</h1>
            </div>

            <div className="main-box">
                <div className="main-box-header">
                    <div className="filter-block-left">
                        <div className="btn-group" style={{ marginRight: '10px' }}>
                            <button type="button" className="btn btn-info" onClick={handleExport}>
                                <FaFileExcel /> Excel
                            </button>
                        </div>
                        <div className="items-per-page" style={{ display: 'inline-block' }}>
                            Visualizza
                            <select value={pageSize} onChange={handlePageSizeChange} className="form-control inline-select">
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                            elementi per pagina
                        </div>
                    </div>

                    <div className="filter-block-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input
                                type="date"
                                className="form-control"
                                value={dtFrom}
                                onChange={(e) => setDtFrom(e.target.value)}
                                title="Dal"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input
                                type="date"
                                className="form-control"
                                value={dtTo}
                                onChange={(e) => setDtTo(e.target.value)}
                                title="Al"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0, minWidth: '300px' }}>
                            <AsyncSelect
                                cacheOptions
                                loadOptions={(inputValue) =>
                                    ArticoliService.getSuggestion(inputValue).then(res => {
                                        // getList returns { list: [], totalCount: ... } inside GenericResponse?
                                        // No, ArticoliService.getList returns response.data
                                        // response.data has { list: [...], ... }
                                        return res.data?.list?.map(a => ({ value: a.id, label: `${a.codice} - ${a.descrizione}` })) || [];
                                    })
                                }
                                value={selectedArticle}
                                onChange={setSelectedArticle}
                                placeholder="Cerca articolo..."
                                isClearable
                                styles={{
                                    control: (base) => ({ ...base, height: '34px', minHeight: '34px' }),
                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="main-box-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>DATA</th>
                                    <th>ARTICOLO</th>
                                    <th>CLIENTE / FORNITORE</th>
                                    <th className="text-right">CARICATO</th>
                                    <th className="text-right">SCARICATO</th>
                                    <th>CAUSALE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" className="text-center">Caricamento...</td></tr>
                                ) : movimenti.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center">Nessun movimento trovato.</td></tr>
                                ) : (
                                    movimenti.map((m, index) => (
                                        <tr key={m.id || index}>
                                            <td>{m.dataMovimento}</td>
                                            <td>{m.descrizioneProdotto}</td>
                                            <td>{m.clienteFornitore}</td>
                                            <td className="text-right">{m.quantitaCarico ? m.quantitaCarico.toFixed(2) : ''}</td>
                                            <td className="text-right">{m.quantitaScarico ? m.quantitaScarico.toFixed(2) : ''}</td>
                                            <td>{m.causale}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-container">
                        {/* Simple pagination: Previous / Next. Since backend list doesn't return total count in this query yet, we just rely on "Results returned < pageSize" to disable Next? 
                            Actually MOVIMENTIMAGAZZINO_S01 just returns rows. It doesn't return total count.
                            Legacy UI had server-side pagination with count. 
                            I only implemented S01 list. I didn't verify if it returns count. (It doesn't, it's just a select).
                            For now I will show Previous/Next buttons. Disable "Next" if current page has < pageSize items.
                         */}
                        <nav>
                            <ul className="pagination">
                                <li className={page === 0 ? 'disabled' : ''}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); if (page > 0) setPage(page - 1); }}>
                                        <FaChevronLeft />
                                    </a>
                                </li>
                                <li className={movimenti.length < pageSize ? 'disabled' : ''}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); if (movimenti.length === pageSize) setPage(page + 1); }}>
                                        <FaChevronRight />
                                    </a>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MovimentiList;
