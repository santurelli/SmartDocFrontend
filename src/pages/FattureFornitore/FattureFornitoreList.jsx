import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaPlus, FaEllipsisV, FaSearch, FaSync, FaChevronLeft, FaChevronRight, FaEnvelopeOpenText } from 'react-icons/fa';
import Swal from 'sweetalert2';
import AsyncSelect from 'react-select/async';
import FattureFornitoreService from '../../services/FattureFornitoreService';
import FornitoriService from '../../services/FornitoriService';
import ComunicazioniDocumentoModal from '../../components/modals/ComunicazioniDocumentoModal';
import '../Fatture/FattureList.css';

const FattureFornitoreList = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [fatture, setFatture] = useState([]);
    const [total, setTotal] = useState(0);
    const [totali, setTotali] = useState({ f: 0, s: 0, d: 0 }); // f = totale, s = pagato, d = da saldare
    const [activeActionMenu, setActiveActionMenu] = useState(null);
    const [comunicazioniDoc, setComunicazioniDoc] = useState(null);

    // Filters
    const [filters, setFilters] = useState({
        numDocumento: '',
        idFornitore: null,
        nomeFornitore: '',
        dataDa: '',
        dataA: ''
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);

    // Close action menu on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveActionMenu(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const fetchFatture = async () => {
        setLoading(true);
        try {
            const params = {
                idFornitore: filters.idFornitore || null,
                numeroDocumento: filters.numDocumento || null,
                dtRegistrazioneFrom: filters.dataDa || null,
                dtRegistrazioneTo: filters.dataA || null,
                start: currentPage * pageSize,
                length: pageSize,
                orderColumn: 0,
                orderDir: 'desc'
            };
            const res = await FattureFornitoreService.getList(params);
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
            console.error('Errore nel caricamento delle fatture fornitore:', error);
            Swal.fire('Errore', 'Impossibile caricare le fatture fornitore', 'error');
            setFatture([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFatture();
    }, [currentPage, pageSize]);

    const handleSearch = (e) => {
        if (e) e.preventDefault();
        setCurrentPage(0);
        fetchFatture();
    };

    const handleReset = () => {
        setFilters({
            numDocumento: '',
            idFornitore: null,
            nomeFornitore: '',
            dataDa: '',
            dataA: ''
        });
        setCurrentPage(0);
        setLoading(true);
        FattureFornitoreService.getList({
            start: 0,
            length: pageSize,
            orderColumn: 0,
            orderDir: 'desc'
        }).then(res => {
            const payload = res.data?.payload;
            if (payload) {
                setFatture(payload.list || []);
                setTotal(payload.totalCount || 0);
                setTotali({
                    f: payload.totFatturato || 0,
                    s: payload.totSaldato || 0,
                    d: payload.totDaSaldare || 0
                });
            }
        }).catch(err => console.error(err))
          .finally(() => setLoading(false));
    };

    const loadFornitori = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 3) return callback([]);
        FornitoriService.getSuggestion(inputValue).then(res => {
            const list = Array.isArray(res.data) ? res.data : (res.data && res.data.payload) || [];
            callback(list.map(f => ({ value: f.id, label: f.denominazione || f.denominazioneData })));
        }).catch(err => {
            console.error("Errore nel caricamento dei fornitori:", err);
            callback([]);
        });
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Non potrai recuperare questa fattura!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sì, elimina!'
        });

        if (result.isConfirmed) {
            try {
                await FattureFornitoreService.delete(id);
                Swal.fire('Eliminata!', 'La fattura è stata eliminata.', 'success');
                fetchFatture();
            } catch (error) {
                console.error('Errore durante l\'eliminazione:', error);
                Swal.fire('Errore', 'Impossibile eliminare la fattura', 'error');
            }
        }
    };

    const formatMoney = (amount) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount || 0);
    };

    return (
        <div className="fatture-list-container">
            <div className="header-row">
                <h1>Fatture Fornitore</h1>
                <div id="total-display-header" className="hidden-xs">
                    <div className="total-display-item total-all">
                        <span className="total-label">Totale Invoiced</span>
                        <strong>{formatMoney(totali.f)}</strong>
                    </div>
                    <div className="total-display-item total-paid">
                        <span className="total-label">Pagato</span>
                        <strong>{formatMoney(totali.s)}</strong>
                    </div>
                    <div className="total-display-item total-due">
                        <span className="total-label">Da Saldare</span>
                        <strong>{formatMoney(totali.d)}</strong>
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
                </div>
                <div className="toolbar-right">
                    <button 
                        className="btn-new-vibrant" 
                        onClick={() => navigate('/fatture-fornitore/new')}
                    >
                        <FaPlus /> Nuova Fattura Fornitore
                    </button>
                </div>
            </div>

            <div className="filter-box-vibrant">
                <div className="filter-header-vibrant">
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
                        <label>Fornitore:</label>
                        <AsyncSelect
                            isClearable
                            loadOptions={loadFornitori}
                            onChange={(opt) => setFilters({ ...filters, idFornitore: opt?.value, nomeFornitore: opt?.label })}
                            value={filters.idFornitore ? { value: filters.idFornitore, label: filters.nomeFornitore } : null}
                            placeholder="Cerca fornitore..."
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
                    <div className="filter-field">
                        <label>Da Data reg.:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filters.dataDa}
                            onChange={(e) => setFilters({ ...filters, dataDa: e.target.value })}
                        />
                    </div>
                    <div className="filter-field">
                        <label>A Data reg.:</label>
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
                                    <th>Data reg.</th>
                                    <th>N. reg.</th>
                                    <th>Data doc.</th>
                                    <th>N. doc.</th>
                                    <th>Fornitore</th>
                                    <th className="text-right">Totale</th>
                                    <th className="text-right">Da saldare</th>
                                    <th>&nbsp;</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center">Caricamento in corso...</td>
                                    </tr>
                                ) : fatture.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center">Nessuna fattura trovata.</td>
                                    </tr>
                                ) : (
                                    fatture.map(item => (
                                        <tr key={item.id} style={item.tipoDocumentoSdi ? { borderLeft: '3px solid #f59e0b' } : { borderLeft: '3px solid transparent' }}>
                                            <td>{item.dataDocumento}</td>
                                            <td>{item.numDocumento}</td>
                                            <td>{item.dataDocumentoFornitore}</td>
                                            <td>{item.numeroDocumentoFornitore}</td>
                                            <td>
                                                <div>{item.descFornitore || item.fornitoreDto?.denominazione || 'N/D'}</div>
                                                {item.tipoDocumentoSdi && (
                                                    <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                                                        <span style={{
                                                            display: 'inline-block',
                                                            padding: '1px 7px',
                                                            borderRadius: '3px',
                                                            fontSize: '10px',
                                                            fontWeight: 700,
                                                            letterSpacing: '0.4px',
                                                            textTransform: 'uppercase',
                                                            background: '#fffbeb',
                                                            color: '#92400e',
                                                            border: '1px solid #fde68a'
                                                        }}>
                                                            {item.tipoDocumentoSdi} · Autofattura
                                                        </span>
                                                        {item.statoFatturaElettronica === 'DI' && (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                padding: '1px 7px',
                                                                borderRadius: '3px',
                                                                fontSize: '10px',
                                                                fontWeight: 700,
                                                                letterSpacing: '0.4px',
                                                                textTransform: 'uppercase',
                                                                background: '#fff7ed',
                                                                color: '#c2410c',
                                                                border: '1px solid #fed7aa'
                                                            }}>In coda SDI</span>
                                                        )}
                                                        {item.statoFatturaElettronica === 'IN' && (
                                                            <span style={{
                                                                display: 'inline-block',
                                                                padding: '1px 7px',
                                                                borderRadius: '3px',
                                                                fontSize: '10px',
                                                                fontWeight: 700,
                                                                letterSpacing: '0.4px',
                                                                textTransform: 'uppercase',
                                                                background: '#f0fdf4',
                                                                color: '#166534',
                                                                border: '1px solid #bbf7d0'
                                                            }}>Inviata</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="text-right">€ {item.totale?.toFixed(2) || item.totaleDocumento?.toFixed(2) || '0.00'}</td>
                                            <td className="text-right">€ {item.totaleDaPagare?.toFixed(2) || item.totaleDaSaldare?.toFixed(2) || '0.00'}</td>
                                            <td className="text-right">
                                                <div className={`action-menu-container${activeActionMenu === item.id ? ' is-open' : ''}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', whiteSpace: 'nowrap' }}>
                                                    <button
                                                        className="btn-action btn-action-ellipsis"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setActiveActionMenu(activeActionMenu === item.id ? null : item.id);
                                                        }}
                                                        title="Altre azioni"
                                                    >
                                                        <FaEllipsisV size={14} />
                                                    </button>
                                                    {activeActionMenu === item.id && (
                                                        <div className="action-dropdown-menu">
                                                            <button className="action-dropdown-item" onClick={() => navigate(`/fatture-fornitore/${item.id}`)}>
                                                                <FaEdit /> Modifica
                                                            </button>
                                                            <button className="action-dropdown-item" onClick={() => { setActiveActionMenu(null); setComunicazioniDoc(item); }}>
                                                                <FaEnvelopeOpenText /> Comunicazioni inviate
                                                            </button>
                                                            <div className="action-dropdown-divider"></div>
                                                            <button className="action-dropdown-item text-danger" onClick={() => handleDelete(item.id)}>
                                                                <FaTrash /> Elimina
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
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

            <ComunicazioniDocumentoModal
                isOpen={!!comunicazioniDoc}
                onClose={() => setComunicazioniDoc(null)}
                idDocumento={comunicazioniDoc?.id}
                tipo="fatturaFornitore"
                titolo={`Fattura fornitore ${comunicazioniDoc?.numeroDocumentoFornitore || comunicazioniDoc?.numDocumento || ''}`}
                sottotitolo={comunicazioniDoc?.descFornitore || comunicazioniDoc?.fornitoreDto?.denominazione}
            />
        </div>
    );
};

export default FattureFornitoreList;
