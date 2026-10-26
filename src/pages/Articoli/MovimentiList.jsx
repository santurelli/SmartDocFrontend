import React, { useState, useEffect, useRef } from 'react';
import MovimentiMagazzinoService from '../../services/MovimentiMagazzinoService';
import ArticoliService from '../../services/ArticoliService';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import MarcheService from '../../services/MarcheService';
import DownloadProgress from '../../components/DownloadProgress';
import { FaSearch, FaChevronLeft, FaChevronRight, FaFileExcel, FaCloudDownloadAlt, FaHome, FaAngleRight, FaFilter, FaEraser } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import Swal from 'sweetalert2';
import './ArticoliList.css'; // Reusing Articoli CSS

import storageHelper from '../../utils/storageHelper';
import { getDefaultSearchRange } from '../../utils/dateUtils';

const MODULE_NAME = 'movimenti';

const MovimentiList = () => {
    const defaultRange = getDefaultSearchRange(30);
    const location = useLocation();

    // Load initial state from storage
    const initialState = storageHelper.loadState(MODULE_NAME, {
        dtFrom: defaultRange.dataDa,
        dtTo: defaultRange.dataA,
        page: 0,
        pageSize: 50,
        selectedArticle: null
    });

    // Check if navigated from an article menu (location.state takes precedence)
    const navArticle = location.state?.filterByArticle || null;

    const [movimenti, setMovimenti] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [page, setPage] = useState(initialState.page || 0);
    const [pageSize, setPageSize] = useState(initialState.pageSize || 50);

    // Filters: if coming from article menu, default to 365 days of history so movements are not cut off
    const [dtFrom, setDtFrom] = useState(() => (navArticle ? getDefaultSearchRange(365).dataDa : (initialState.dtFrom || defaultRange.dataDa)));
    const [dtTo, setDtTo] = useState(initialState.dtTo || defaultRange.dataA);
    const [selectedArticle, setSelectedArticle] = useState(() => (navArticle || initialState.selectedArticle || null));

    // Tyre Management Config & Filters
    const [isGommista, setIsGommista] = useState(false);
    const [marcheList, setMarcheList] = useState([]);
    const [tireFilters, setTireFilters] = useState({
        idMarca: '',
        sezione: '',
        serie: '',
        diametro: '',
        indiceVelocita: '',
        dot: '',
        scultura: ''
    });

    const requestSeqRef = useRef(0);

    // Load tenant configuration & brands
    useEffect(() => {
        MarcheService.getCombo()
            .then(res => setMarcheList(res || []))
            .catch(err => console.error("Error loading marche in MovimentiList", err));

        ConfigurazioneService.getAll().then(res => {
            const data = res.data?.payload || res.data || [];
            let tipoStore = '';
            let gommistaVal = '0';
            if (Array.isArray(data)) {
                const ts = data.find(c => c.chiave === 'TIPO_STORE');
                if (ts) tipoStore = ts.valore;
                const g = data.find(c => c.chiave === 'GOMMISTA');
                if (g) gommistaVal = g.valore;
            } else {
                tipoStore = data['GLOBAL:TIPO_STORE'] || data['TIPO_STORE'] || '';
                gommistaVal = data['GLOBAL:GOMMISTA'] || data['GOMMISTA'] || '0';
            }
            const gommista = (tipoStore === 'PNEUMATICI' || tipoStore === 'GOMMISTA' || gommistaVal === '1');
            setIsGommista(gommista);
        }).catch(err => {
            console.error("Error loading config in MovimentiList", err);
        });
    }, []);

    // Save state whenever filters change
    useEffect(() => {
        storageHelper.saveState(MODULE_NAME, {
            dtFrom,
            dtTo,
            page,
            pageSize,
            selectedArticle
        });
    }, [dtFrom, dtTo, page, pageSize, selectedArticle]);

    // Handle incoming navigation state updates (e.g. repeated navigation)
    useEffect(() => {
        if (location.state?.filterByArticle) {
            setSelectedArticle(location.state.filterByArticle);
            setDtFrom(getDefaultSearchRange(365).dataDa);
            setPage(0);
        }
    }, [location.state]);

    // Format tire / article label for dropdown & table
    const formatTireLabel = (m) => {
        if (!m) return '';
        const isTire = Boolean(m.sezione || m.diametro || m.scultura || m.dot);
        if (isTire || isGommista) {
            const parts = [];
            if (m.sezione && m.serie) parts.push(`${m.sezione}/${m.serie}`);
            else if (m.sezione) parts.push(m.sezione);
            if (m.diametro) parts.push(`R${m.diametro}`);
            if (m.indiceVelocita) parts.push(m.indiceVelocita);
            if (m.scultura) parts.push(m.scultura);
            const spec = parts.join(' ').trim();
            let desc = spec || m.descrizioneProdotto || m.descrizione || '';
            if (m.descMarca && !desc.toLowerCase().includes(m.descMarca.toLowerCase())) {
                desc = `${m.descMarca} ${desc}`;
            }
            const code = m.codiceProdotto || m.codice || '';
            return code ? `${code} - ${desc}` : desc;
        }
        const code = m.codiceProdotto || m.codice || '';
        const desc = m.descrizioneProdotto || m.descrizione || '';
        return code ? `${code} - ${desc}` : desc;
    };

    // Load article suggestions with smart tire dimension parsing
    const loadArticleSuggestions = async (inputValue) => {
        try {
            let params = {
                start: 0,
                length: 40,
                search: inputValue || '',
                orderColumn: 1,
                orderDir: 'asc'
            };

            // Smart parse: e.g. "205/55" or "205 55"
            if (inputValue) {
                const tireMatch = inputValue.trim().match(/^(\d{3})[/\s](\d{2})/);
                if (tireMatch) {
                    params.sezione = parseInt(tireMatch[1], 10);
                    params.serie = parseInt(tireMatch[2], 10);
                }
            }

            // Include active tire filters if any
            if (tireFilters.idMarca) params.idMarca = tireFilters.idMarca;
            if (tireFilters.sezione) params.sezione = tireFilters.sezione;
            if (tireFilters.serie) params.serie = tireFilters.serie;
            if (tireFilters.diametro) params.diametro = tireFilters.diametro;
            if (tireFilters.indiceVelocita) params.indiceVelocita = tireFilters.indiceVelocita;
            if (tireFilters.dot) params.dot = tireFilters.dot;
            if (tireFilters.scultura) params.scultura = tireFilters.scultura;

            const res = await ArticoliService.getList(params);
            const list = res.data?.list || [];
            return list.map(a => ({
                value: a.id,
                label: formatTireLabel(a),
                article: a
            }));
        } catch (e) {
            console.error("Error loading article suggestions", e);
            return [];
        }
    };

    // Reset tire filters
    const handleResetTireFilters = () => {
        setTireFilters({
            idMarca: '',
            sezione: '',
            serie: '',
            diametro: '',
            indiceVelocita: '',
            dot: '',
            scultura: ''
        });
        setSelectedArticle(null);
        setPage(0);
    };

    // Fetch movements (protected against race conditions)
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

        const currentSeq = ++requestSeqRef.current;
        setLoading(true);
        try {
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

            // Discard response if a newer request was initiated
            if (currentSeq !== requestSeqRef.current) {
                return;
            }

            if (response.errorText) {
                Swal.fire('Errore', response.errorText, 'error');
                setMovimenti([]);
                return;
            }

            if (response.payload) {
                setMovimenti(response.payload);
                setTotalCount(response.payload.length > 0 ? (response.payload[0].total || 0) : 0);
            } else {
                setMovimenti([]);
                setTotalCount(0);
            }
        } catch (error) {
            if (currentSeq === requestSeqRef.current) {
                console.error("Error fetching movimenti", error);
                setMovimenti([]);
            }
        } finally {
            if (currentSeq === requestSeqRef.current) {
                setLoading(false);
            }
        }
    };

    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value, 10));
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

                    <div className="filter-block-right" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
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
                        <div className="form-group" style={{ marginBottom: 0, minWidth: '340px' }}>
                            <AsyncSelect
                                key={JSON.stringify(tireFilters)}
                                cacheOptions
                                defaultOptions
                                loadOptions={loadArticleSuggestions}
                                value={selectedArticle}
                                onChange={(val) => { setSelectedArticle(val); setPage(0); }}
                                placeholder="Cerca articolo (codice, marca, misura)..."
                                isClearable
                                styles={{
                                    control: (base) => ({ ...base, minHeight: '34px', height: '34px', fontSize: '13px' }),
                                    menu: (base) => ({ ...base, zIndex: 9999, fontSize: '13px' })
                                }}
                                noOptionsMessage={({ inputValue }) => inputValue ? "Nessun articolo trovato" : "Digita per cercare articolo..."}
                                loadingMessage={() => "Caricamento articoli..."}
                            />
                        </div>
                    </div>
                </div>

                <div className="main-box-body">
                    {/* Filtri Pneumatici (visibili solo se attiva la gestione pneumatici) */}
                    {isGommista && (
                        <div className="filtri-pneumatico-bar" style={{
                            marginBottom: '20px',
                            padding: '12px 16px',
                            backgroundColor: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            borderLeft: '5px solid #27ae60',
                            borderRadius: '6px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                <strong style={{ color: '#1e293b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <FaFilter style={{ color: '#27ae60' }} /> Filtri Pneumatico:
                                </strong>
                                <button
                                    type="button"
                                    className="btn btn-default btn-xs"
                                    onClick={handleResetTireFilters}
                                    style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px' }}
                                    title="Azzera filtri pneumatici"
                                >
                                    <FaEraser className="mr-1" /> Reset
                                </button>
                            </div>
                            <div className="row">
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Marca</label>
                                    <Select
                                        isClearable
                                        isSearchable
                                        placeholder="Tutte"
                                        classNamePrefix="react-select"
                                        options={marcheList.map(m => ({ value: m.id, label: m.descrizione }))}
                                        value={tireFilters.idMarca ? {
                                            value: tireFilters.idMarca,
                                            label: marcheList.find(m => m.id == tireFilters.idMarca)?.descrizione || ''
                                        } : null}
                                        onChange={(opt) => {
                                            setTireFilters(prev => ({ ...prev, idMarca: opt ? opt.value : '' }));
                                            setSelectedArticle(null);
                                            setPage(0);
                                        }}
                                        noOptionsMessage={() => "Nessun risultato trovato"}
                                        styles={{
                                            control: (base) => ({
                                                ...base,
                                                minHeight: '32px',
                                                height: '32px',
                                                fontSize: '12px'
                                            }),
                                            valueContainer: (base) => ({
                                                ...base,
                                                padding: '0 6px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }),
                                            input: (base) => ({
                                                ...base,
                                                margin: 0,
                                                padding: 0
                                            }),
                                            indicatorsContainer: (base) => ({
                                                ...base,
                                                height: '32px'
                                            }),
                                            dropdownIndicator: (base) => ({
                                                ...base,
                                                padding: '2px 4px'
                                            }),
                                            clearIndicator: (base) => ({
                                                ...base,
                                                padding: '2px 4px'
                                            }),
                                            menu: (base) => ({ ...base, zIndex: 9999, fontSize: '12px' })
                                        }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Sezione (L)</label>
                                    <input
                                        type="number"
                                        className="form-control input-sm"
                                        placeholder="es. 205"
                                        value={tireFilters.sezione || ''}
                                        onChange={(e) => {
                                            setTireFilters(prev => ({ ...prev, sezione: e.target.value }));
                                            setSelectedArticle(null);
                                            setPage(0);
                                        }}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Serie (H)</label>
                                    <input
                                        type="number"
                                        className="form-control input-sm"
                                        placeholder="es. 55"
                                        value={tireFilters.serie || ''}
                                        onChange={(e) => {
                                            setTireFilters(prev => ({ ...prev, serie: e.target.value }));
                                            setSelectedArticle(null);
                                            setPage(0);
                                        }}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Diametro (R)</label>
                                    <input
                                        type="number"
                                        className="form-control input-sm"
                                        placeholder="es. 16"
                                        value={tireFilters.diametro || ''}
                                        onChange={(e) => {
                                            setTireFilters(prev => ({ ...prev, diametro: e.target.value }));
                                            setSelectedArticle(null);
                                            setPage(0);
                                        }}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Indice Vel.</label>
                                    <input
                                        type="text"
                                        className="form-control input-sm"
                                        placeholder="es. V"
                                        value={tireFilters.indiceVelocita || ''}
                                        onChange={(e) => {
                                            setTireFilters(prev => ({ ...prev, indiceVelocita: e.target.value }));
                                            setSelectedArticle(null);
                                            setPage(0);
                                        }}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>DOT</label>
                                    <input
                                        type="text"
                                        className="form-control input-sm"
                                        placeholder="es. 2423"
                                        value={tireFilters.dot || ''}
                                        onChange={(e) => {
                                            setTireFilters(prev => ({ ...prev, dot: e.target.value }));
                                            setSelectedArticle(null);
                                            setPage(0);
                                        }}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                                <div className="col-xs-6 col-sm-4 col-md-2 mb-2">
                                    <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#475569', marginBottom: '2px' }}>Modello / Scultura</label>
                                    <input
                                        type="text"
                                        className="form-control input-sm"
                                        placeholder="es. Primacy"
                                        value={tireFilters.scultura || ''}
                                        onChange={(e) => {
                                            setTireFilters(prev => ({ ...prev, scultura: e.target.value }));
                                            setSelectedArticle(null);
                                            setPage(0);
                                        }}
                                        style={{ height: '32px' }}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

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
                                    <tr><td colSpan="7" className="text-center">Caricamento movimenti...</td></tr>
                                ) : movimenti.length === 0 ? (
                                    <tr><td colSpan="7" className="text-center">Nessun movimento trovato per i criteri selezionati.</td></tr>
                                ) : (
                                    movimenti.map((m, index) => (
                                        <tr key={m.id || index}>
                                            <td>{m.dataMovimento}</td>
                                            <td>
                                                <div>
                                                    <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                                        {formatTireLabel(m)}
                                                    </span>
                                                    {m.dot && (
                                                        <span className="badge" style={{ backgroundColor: '#64748b', color: '#fff', marginLeft: '8px', fontSize: '11px', padding: '2px 6px', fontWeight: 'normal', borderRadius: '4px' }}>
                                                            DOT {m.dot}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>{m.numeroDocumento || '-'}</td>
                                            <td>{m.clienteFornitore || '-'}</td>
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
                                <li className={(page + 1) * pageSize >= totalCount ? 'disabled' : ''}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); if ((page + 1) * pageSize < totalCount) setPage(page + 1); }}>
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
