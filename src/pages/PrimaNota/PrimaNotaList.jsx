import React, { useState, useEffect } from 'react';
import PrimaNotaService from '../../services/PrimaNotaService';
import RisorseService from '../../services/RisorseService';
import ClientiService from '../../services/ClientiService';
import FornitoriService from '../../services/FornitoriService';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import Swal from 'sweetalert2';
import { FaSearch, FaSync, FaPlus, FaTrash, FaEdit, FaArrowUp, FaArrowDown, FaLandmark, FaEllipsisV, FaHome, FaAngleRight, FaFileExcel } from 'react-icons/fa';
import PrimaNotaModal from './PrimaNotaModal';
import storageHelper from '../../utils/storageHelper';
import { getDefaultSearchRange } from '../../utils/dateUtils';
import './PrimaNotaList.css';

const MODULE_NAME = 'primanota';

const PrimaNotaList = () => {
    const defaultRange = getDefaultSearchRange(30);

    // Gestione stato tramite storageHelper (mantiene filtri attivi tra le pagine)
    const initialState = storageHelper.loadState(MODULE_NAME, {
        dataDa: defaultRange.dataDa,
        dataA: defaultRange.dataA,
        idRisorsa: null,
        idSoggetto: null
    });

    const [filters, setFilters] = useState({
        ...initialState,
        dataDa: initialState.dataDa || defaultRange.dataDa,
        dataA: initialState.dataA || defaultRange.dataA
    });
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [risorseCombo, setRisorseCombo] = useState([]);
    
    // Pagination & Sort state
    const [page, setPage] = useState(0);
    const [pageSize] = useState(25);
    const [totalRows, setTotalRows] = useState(0);
    const [sort, setSort] = useState({ column: 0, direction: 'desc' });

    // Applied filters (to avoid auto-refreshing while typing)
    const [appliedFilters, setAppliedFilters] = useState({
        ...initialState,
        dataDa: initialState.dataDa || defaultRange.dataDa,
        dataA: initialState.dataA || defaultRange.dataA
    });

    // Cards values
    const [totali, setTotali] = useState({ entrate: 0, uscite: 0, saldo: 0 });

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

    // Salva i filtri nello storage quando cambiano, ma non triggera il caricamento
    useEffect(() => {
        storageHelper.saveState(MODULE_NAME, filters);
    }, [filters]);

    // Effetto per ricaricare quando cambiano pagina o ordinamento
    useEffect(() => {
        fetchData();
    }, [page, sort]);

    useEffect(() => {
        fetchCombos();
    }, []);

    const fetchCombos = async () => {
        try {
            const risRes = await RisorseService.getAllForCombo();
            if (risRes.data) {
                setRisorseCombo(risRes.data.map(r => ({ value: r.id, label: r.descrizione })));
            }
        } catch (err) {
            console.error("Errore caricamento combo:", err);
        }
    };

    const fetchData = async (currentFilters = appliedFilters) => {
        setIsLoading(true);
        try {
            // Backend expects DD/MM/YYYY and DataTables format for sort/paging
            const params = {
                length: pageSize,
                start: page * pageSize,
                'order[0][column]': sort.column,
                'order[0][dir]': sort.direction,
                tipoPagamento: null, // Mappato se necessario
                risorsa: currentFilters.idRisorsa || null,
                tipologia: '',
                soggetto: currentFilters.idSoggetto || null,
                dtFrom: currentFilters.dataDa ? currentFilters.dataDa.split('-').reverse().join('/') : null,
                dtTo: currentFilters.dataA ? currentFilters.dataA.split('-').reverse().join('/') : null,
                divisione: 0
            };
            
            const res = await PrimaNotaService.getAll(params);
            if (res.data) {
                const list = Array.isArray(res.data) ? res.data : (res.data.list || []);
                setData(list);
                // Il totale è presente in ogni riga grazie a COUNT(*) OVER()
                setTotalRows(list.length > 0 ? list[0].total : 0);
                calcolaTotali(list);
            }
        } catch (err) {
            console.error("Errore recupero prima nota", err);
            if (err.response?.status !== 404) {
                 Swal.fire('Errore', 'Impossibile caricare i movimenti di prima nota', 'error');
            } else {
                 setData([]);
                 setTotalRows(0);
                 setTotali({ entrate: 0, uscite: 0, saldo: 0 });
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = () => {
        setAppliedFilters(filters);
        setPage(0); // Torna alla prima pagina quando si cerca
        if (page === 0) {
            fetchData(filters);
        }
    };

    const handleSort = (colIndex) => {
        setSort(prev => ({
            column: colIndex,
            direction: prev.column === colIndex && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
        setPage(0);
    };

    const calcolaTotali = (movimenti) => {
        let entrate = 0;
        let uscite = 0;

        movimenti.forEach(m => {
            const valore = m.totale || m.importo || m.entrate || m.uscite || m.entrata || m.uscita || 0;
            if (m.tipoDocumento === 'E') entrate += valore;
            if (m.tipoDocumento === 'U') uscite += valore;
        });

        setTotali({
            entrate,
            uscite,
            saldo: entrate - uscite
        });
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Vuoi eliminare questa registrazione manuale? Se è collegata a un documento, la scadenza tornerà da saldare.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina'
        });

        if (result.isConfirmed) {
            try {
                await PrimaNotaService.delete(id);
                Swal.fire('Eliminato!', 'Registrazione eliminata con successo.', 'success');
                fetchData();
            } catch (err) {
            // Se 404 non è un vero errore, ma solo lista vuota
            if (err.response?.status !== 404) {
                 Swal.fire('Errore', 'Impossibile eliminare la registrazione', 'error');
            }
        }
        }
    };

    const handleExportExcel = async () => {
        setIsLoading(true);
        try {
            const criteria = {
                idRisorsa: appliedFilters.idRisorsa || null,
                idSoggetto: appliedFilters.idSoggetto || null,
                dataDa: appliedFilters.dataDa ? appliedFilters.dataDa.split('-').reverse().join('/') : null,
                dataA: appliedFilters.dataA ? appliedFilters.dataA.split('-').reverse().join('/') : null,
                idDivisione: 0,
                orderColumn: sort.column,
                orderDir: sort.direction
            };
            
            const res = await PrimaNotaService.exportExcel(criteria);
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `prima_nota_${new Date().getTime()}.xls`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            Swal.fire({
                title: 'Esportazione completata',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Errore esportazione excel:", err);
            Swal.fire('Errore', 'Impossibile esportare il file Excel', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const loadSoggetti = async (inputValue) => {
        if (!inputValue || inputValue.length < 2) return [];
        try {
            const [cliRes, forRes] = await Promise.all([
                ClientiService.getList({ search: inputValue }),
                FornitoriService.getList({ search: inputValue })
            ]);
            
            const options = [];
            if (cliRes.data && cliRes.data.content) {
                cliRes.data.content.forEach(c => options.push({ value: `C_${c.id}`, label: `(CLI) ${c.ragioneSociale}` }));
            }
            if (forRes.data && forRes.data.content) {
                forRes.data.content.forEach(f => options.push({ value: `F_${f.id}`, label: `(FOR) ${f.ragioneSociale}` }));
            }
            return options;
        } catch (error) {
            console.error("Errore caricamento soggetti:", error);
            return [];
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val || 0);
    };

    // Helper per ordinamento date in formato DD/MM/YYYY
    const parseITDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        const [day, month, year] = dateStr.split('/');
        return new Date(year, month - 1, day);
    };

    // Calculate progressivo per visualizzazione (dal più vecchio al più nuovo, o viceversa)
    // Per avere un senso il progressivo andrebbe calcolato ordinando per data crescente
    const dataConProgressivo = [...data].sort((a, b) => parseITDate(a.dtDocumento) - parseITDate(b.dtDocumento));
    let prog = 0;
    dataConProgressivo.forEach(row => {
        const valore = row.totale || row.importo || row.entrate || row.uscite || row.entrata || row.uscita || 0;
        if (row.tipoDocumento === 'E') prog += valore;
        if (row.tipoDocumento === 'U') prog -= valore;
        row.saldoProgressivo = prog;
    });

    // Invertiamo solo se l'utente ha richiesto l'ordine decrescente
    if (sort.direction === 'desc') {
        dataConProgressivo.reverse();
    }

    const [showFilters, setShowFilters] = useState(true);

    return (
        <div className="container-fluid ddt-list-container">
            <ul className="breadcrumb">
                <li><a href="/"><FaHome className="mr-1" /> Home</a></li>
                <li><FaAngleRight /></li>
                <li className="active">Prima Nota</li>
            </ul>

            <div className="header-row">
                <h1>Prima Nota e Movimenti</h1>
            </div>

            <div className="toolbar-row">
                <div className="toolbar-left">
                    {/* Eventuali azioni massive o selettore righe per pagina potrebbero andare qui */}
                </div>
                <div className="toolbar-right">
                    <button className="btn-export-vibrant mr-2" onClick={handleExportExcel} title="Esporta in Excel" disabled={isLoading}>
                        <FaFileExcel size={14} /> Esporta
                    </button>
                    <button className="btn-new-vibrant" onClick={() => { setSelectedId(null); setIsModalOpen(true); }}>
                        <FaPlus size={14} /> Registra Movimento
                    </button>
                </div>
            </div>

            {/* Cards Riepilogo */}
            <div className="row mb-4">
                <div className="col-md-4">
                    <div className="primanota-card">
                        <div className="primanota-card-icon entrate"><FaArrowUp /></div>
                        <div className="primanota-card-content">
                            <h3>Entrate Periodo</h3>
                            <h2>{formatCurrency(totali.entrate)}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="primanota-card">
                        <div className="primanota-card-icon uscite"><FaArrowDown /></div>
                        <div className="primanota-card-content">
                            <h3>Uscite Periodo</h3>
                            <h2>{formatCurrency(totali.uscite)}</h2>
                        </div>
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="primanota-card" style={{ borderLeft: totali.saldo >= 0 ? '4px solid #28a745' : '4px solid #dc3545' }}>
                        <div className="primanota-card-icon saldo"><FaLandmark /></div>
                        <div className="primanota-card-content">
                            <h3>Flusso Periodo</h3>
                            <h2 style={{ color: totali.saldo >= 0 ? '#28a745' : '#dc3545' }}>
                                {totali.saldo > 0 ? '+' : ''}{formatCurrency(totali.saldo)}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtri */}
            <div className="filter-box-vibrant">
                <div className="filter-header-vibrant" onClick={() => setShowFilters(!showFilters)}>
                    <span><FaSearch className="mr-2" /> Filtri di Ricerca</span>
                    <span>{showFilters ? '-' : '+'}</span>
                </div>
                {showFilters && (
                    <div className="filter-body-vibrant">
                        <div className="filter-field" style={{ minWidth: '200px' }}>
                            <label>Data Dal</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={filters.dataDa} 
                                onChange={(e) => setFilters({ ...filters, dataDa: e.target.value })} 
                            />
                        </div>
                        <div className="filter-field" style={{ minWidth: '200px' }}>
                            <label>Data Al</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={filters.dataA} 
                                onChange={(e) => setFilters({ ...filters, dataA: e.target.value })} 
                            />
                        </div>
                        <div className="filter-field" style={{ minWidth: '250px' }}>
                            <label>Banca / Cassa</label>
                            <Select
                                options={[{ value: null, label: 'Tutte le risorse' }, ...risorseCombo]}
                                value={filters.idRisorsa ? risorseCombo.find(r => r.value === filters.idRisorsa) : { value: null, label: 'Tutte le risorse' }}
                                onChange={(opt) => setFilters({ ...filters, idRisorsa: opt ? opt.value : null })}
                                placeholder="Seleziona..."
                                isClearable
                            />
                        </div>
                        <div className="filter-field" style={{ minWidth: '300px' }}>
                            <label>Cliente / Fornitore</label>
                            <AsyncSelect
                                cacheOptions
                                defaultOptions={false}
                                loadOptions={loadSoggetti}
                                onChange={(opt) => setFilters({ ...filters, idSoggetto: opt ? opt.value : null })}
                                placeholder="Cerca soggetto..."
                                isClearable
                            />
                        </div>
                        
                        <button className="btn-search-vibrant" onClick={handleSearch} disabled={isLoading}>
                            <FaSearch className="mr-2" /> {isLoading ? "Caricamento..." : "Cerca"}
                        </button>

                        <button className="btn-paginate" onClick={() => { setFilters(initialState); setAppliedFilters(initialState); setPage(0); }} title="Resetta Filtri">
                            <FaSync className={isLoading ? "fa-spin" : ""} />
                        </button>
                    </div>
                )}
            </div>

            {/* Tabella Dati */}
            <div className="main-box">
                <div className="main-box-body">
                            <div className="table-responsive">
                                <table className="table table-hover table-primanota mb-0">
                                    <thead>
                                        <tr>
                                            <th onClick={() => handleSort(0)} className="sortable-header">
                                                Data {sort.column === 0 && (sort.direction === 'asc' ? <FaArrowUp size={10}/> : <FaArrowDown size={10}/>)}
                                            </th>
                                            <th onClick={() => handleSort(1)} className="sortable-header">
                                                Descrizione / Riferimento {sort.column === 1 && (sort.direction === 'asc' ? <FaArrowUp size={10}/> : <FaArrowDown size={10}/>)}
                                            </th>
                                            <th onClick={() => handleSort(2)} className="sortable-header">
                                                Risorsa {sort.column === 2 && (sort.direction === 'asc' ? <FaArrowUp size={10}/> : <FaArrowDown size={10}/>)}
                                            </th>
                                            <th onClick={() => handleSort(3)} className="text-right sortable-header">
                                                Entrate {sort.column === 3 && (sort.direction === 'asc' ? <FaArrowUp size={10}/> : <FaArrowDown size={10}/>)}
                                            </th>
                                            <th onClick={() => handleSort(4)} className="text-right sortable-header">
                                                Uscite {sort.column === 4 && (sort.direction === 'asc' ? <FaArrowUp size={10}/> : <FaArrowDown size={10}/>)}
                                            </th>
                                            <th className="text-right">Flusso Progr.</th>
                                            <th className="text-center">Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4">
                                                    <FaSync className="fa-spin mr-2" /> Caricamento in corso...
                                                </td>
                                            </tr>
                                        ) : dataConProgressivo.length > 0 ? (
                                            dataConProgressivo.map((row, index) => (
                                                <tr key={row.id || index}>
                                                    <td>{row.dtDocumento}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            {row.tipoDocumento === 'E' && <span className="badge badge-documento tipo-doc-e mr-2">INCASSO</span>}
                                                            {row.tipoDocumento === 'U' && <span className="badge badge-documento tipo-doc-u mr-2">PAGAMENTO</span>}
                                                            {row.tipoDocumento === 'N' && <span className="badge badge-documento tipo-doc-n mr-2">GIROCONTO</span>}
                                                            <span className="font-weight-bold">{row.descrDocumento}</span>
                                                        </div>
                                                        {row.ragioneSocialeSoggetto && (
                                                            <small className="text-muted d-block mt-1">{row.ragioneSocialeSoggetto}</small>
                                                        )}
                                                    </td>
                                                    <td>{row.modalita}</td>
                                                    <td className="text-right primanota-row-entrata">
                                                        {row.tipoDocumento === 'E' ? formatCurrency(row.totale || row.importo || row.entrate || row.uscite || row.entrata || row.uscita) : '-'}
                                                    </td>
                                                    <td className="text-right primanota-row-uscita">
                                                        {row.tipoDocumento === 'U' ? formatCurrency(row.totale || row.importo || row.entrate || row.uscite || row.entrata || row.uscita) : '-'}
                                                    </td>
                                                    <td className="text-right font-weight-bold" style={{ color: row.saldoProgressivo >= 0 ? '#1e7e34' : '#bd2130' }}>
                                                        {formatCurrency(row.saldoProgressivo)}
                                                    </td>
                                                    <td className="text-center">
                                                        {/* Abilitiamo edit/delete solo se è un movimento manuale (type = PPN) */}
                                                        {row.type === 'PPN' && (
                                                            <div className="btn-group">
                                                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => { setSelectedId(row.id); setIsModalOpen(true); }} title="Modifica">
                                                                    <FaEdit />
                                                                </button>
                                                                <button type="button" className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(row.id)} title="Elimina">
                                                                    <FaTrash />
                                                                </button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="7" className="text-center py-4 text-muted">
                                                    Nessun movimento trovato per i filtri selezionati.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginazione */}
                            <div className="pagination-wrapper mt-3">
                                <div className="pagination-info">
                                    Mostrando da {page * pageSize + 1} a {Math.min((page + 1) * pageSize, totalRows)} di {totalRows} movimenti
                                </div>
                                <div className="pagination-buttons">
                                    <button 
                                        className="btn btn-sm btn-outline-secondary mr-2" 
                                        disabled={page === 0 || isLoading}
                                        onClick={() => setPage(page - 1)}
                                    >
                                        Precedente
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-outline-secondary" 
                                        disabled={(page + 1) * pageSize >= totalRows || isLoading}
                                        onClick={() => setPage(page + 1)}
                                    >
                                        Successivo
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

            {isModalOpen && (
                <PrimaNotaModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSave={fetchData}
                    idToEdit={selectedId}
                    risorseCombo={risorseCombo}
                />
            )}
        </div>
    );
};

export default PrimaNotaList;
