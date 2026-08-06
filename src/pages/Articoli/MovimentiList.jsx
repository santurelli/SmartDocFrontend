import React, { useState, useEffect } from 'react';
import MovimentiMagazzinoService from '../../services/MovimentiMagazzinoService';
import ArticoliService from '../../services/ArticoliService';
import DownloadProgress from '../../components/DownloadProgress';
import { FaSearch, FaChevronLeft, FaChevronRight, FaFileExcel, FaCloudDownloadAlt, FaHome, FaAngleRight } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Swal from 'sweetalert2';
import './ArticoliList.css'; // Reusing Articoli CSS

import storageHelper from '../../utils/storageHelper';
import { getDefaultSearchRange } from '../../utils/dateUtils';

const MODULE_NAME = 'movimenti';

const MovimentiList = () => {
    const defaultRange = getDefaultSearchRange(30);

    // Load initial state
    const initialState = storageHelper.loadState(MODULE_NAME, {
        dtFrom: defaultRange.dataDa,
        dtTo: defaultRange.dataA,
        page: 0,
        pageSize: 50,
        selectedArticle: null
    });

    const [movimenti, setMovimenti] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [page, setPage] = useState(initialState.page);
    const [pageSize, setPageSize] = useState(initialState.pageSize);
    const location = useLocation();

    // Filters
    const [dtFrom, setDtFrom] = useState(initialState.dtFrom || defaultRange.dataDa);
    const [dtTo, setDtTo] = useState(initialState.dtTo || defaultRange.dataA);
    const [selectedArticle, setSelectedArticle] = useState(initialState.selectedArticle);

    // Save state whenever filters or pagination change
    useEffect(() => {
        storageHelper.saveState(MODULE_NAME, {
            dtFrom,
            dtTo,
            page,
            pageSize,
            selectedArticle
        });
    }, [dtFrom, dtTo, page, pageSize, selectedArticle]);

    useEffect(() => {
        // Check for navigation state to pre-fill filter (overrides saved state if present)
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
        // Validate Date Range
        if (dtFrom && dtTo) {
            const date1 = new Date(dtFrom);
            const date2 = new Date(dtTo);
            const diffTime = Math.abs(date2 - date1);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 365) {
                Swal.fire('Attenzione', 'L\'intervallo di ricerca non può superare i 365 giorni.', 'warning');
                return;
            }
            if (date1 > date2) {
                Swal.fire('Attenzione', 'La data di inizio non può essere successiva alla data di fine.', 'warning');
                return;
            }
        }

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
            if (response.errorText) {
                Swal.fire('Errore', response.errorText, 'error');
                setMovimenti([]);
                return;
            }
            // Backend returns List<MovimentoMagazzinoDto> directly in payload?
            // Yes, GenericResponseDto.payload
            if (response.payload) {
                setMovimenti(response.payload);
                setTotalCount(response.payload.length > 0 ? (response.payload[0].total || 0) : 0);
            } else {
                setMovimenti([]);
                setTotalCount(0);
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

    const handleExport = async () => {
        setDownloading(true);
        try {
            const formatDate = (isoDate) => {
                if (!isoDate) return '';
                const [yyyy, mm, dd] = isoDate.split('-');
                return `${dd}/${mm}/${yyyy}`;
            };

            const criteria = {
                dtFrom: formatDate(dtFrom),
                dtTo: formatDate(dtTo),
                idProdotto: selectedArticle ? selectedArticle.value : null
            };

            const response = await MovimentiMagazzinoService.exportExcel(criteria);

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'movimenti_magazzino.xls');
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Export error", error);
            Swal.fire('Errore', 'Errore durante l\'esportazione excel', 'error');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="container-fluid page-content">
            <DownloadProgress visible={downloading} />
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li><FaAngleRight /></li>
                <li className="active">Movimenti magazzino</li>
            </ul>
            <h1>Movimenti magazzino</h1>

            <div className="main-box">
                <div className="main-box-header">
                    <div className="filter-block-left">
                        <div style={{ marginRight: '10px' }}>
                            <button className="btn btn-cloud" title="Esporta" onClick={handleExport} disabled={downloading}>
                                {downloading ? <span className="fa fa-spinner fa-spin" /> : <FaCloudDownloadAlt />}
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
                                onChange={(e) => { setDtFrom(e.target.value); setPage(0); }}
                                title="Dal"
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <input
                                type="date"
                                className="form-control"
                                value={dtTo}
                                onChange={(e) => { setDtTo(e.target.value); setPage(0); }}
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
                                onChange={(val) => { setSelectedArticle(val); setPage(0); }}
                                placeholder="Cerca articolo..."
                                isClearable
                                styles={{
                                    control: (base) => ({ ...base, height: '34px', minHeight: '34px' }),
                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                }}
                                noOptionsMessage={({ inputValue }) => inputValue ? "Nessun risultato" : "Cerca articolo..."}
                                loadingMessage={() => "Caricamento..."}
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
                                    <th>DOC</th>
                                    <th>CLIENTE / FORNITORE</th>
                                    <th className="text-right" style={{ textAlign: 'right' }}>CARICATO</th>
                                    <th className="text-right" style={{ textAlign: 'right' }}>SCARICATO</th>
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
                                            <td>{m.numeroDocumento}</td>
                                            <td>{m.clienteFornitore}</td>
                                            <td className="text-right">{m.quantitaCarico ? m.quantitaCarico.toFixed(2) : ''}</td>
                                            <td className="text-right">{m.quantitaScarico ? m.quantitaScarico.toFixed(2) : ''}</td>
                                            <td>{m.causale}{m.causale && m.numeroDocumento ? ` n. ${m.numeroDocumento}` : ''}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="pagination-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                        <small style={{ color: '#777' }}>
                            {totalCount > 0
                                ? `Visualizzati ${page * pageSize + 1} - ${Math.min((page + 1) * pageSize, totalCount)} di ${totalCount} risultati`
                                : movimenti.length === 0 ? '' : `${movimenti.length} risultati`}
                        </small>
                        <nav>
                            <ul className="pagination" style={{ margin: 0 }}>
                                <li className={page === 0 ? 'disabled' : ''}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); if (page > 0) setPage(page - 1); }}>
                                        <FaChevronLeft />
                                    </a>
                                </li>
                                <li className="disabled" style={{ padding: '6px 12px', color: '#555' }}>
                                    Pag. {page + 1}{totalCount > 0 ? ` / ${Math.ceil(totalCount / pageSize)}` : ''}
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
