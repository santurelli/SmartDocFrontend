import React, { useState, useEffect, useCallback, useRef } from 'react';
import { FaHome, FaAngleRight, FaUpload, FaCheckCircle, FaExclamationTriangle, FaBan, FaCog, FaFileImport, FaChevronDown, FaChevronUp, FaLink } from 'react-icons/fa';
import Swal from 'sweetalert2';
import RiconciliazioneService from '../../services/RiconciliazioneService';
import RisorseService from '../../services/RisorseService';
import CsvMappingModal from '../../components/modals/CsvMappingModal';
import authService from '../../services/authService';
import './RiconciliazioneBancariaPage.css';

const formatMoney = (v) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(v || 0);

const STATO_LABEL = {
    NON_ABBINATO: 'Da rivedere',
    ABBINATO_AUTO: 'Abbinato automaticamente',
    ABBINATO_MANUALE: 'Abbinato manualmente',
    IGNORATO: 'Ignorato'
};

const RiconciliazioneBancariaPage = () => {
    const currentUser = authService.getCurrentUser()?.user;

    const [risorseCombo, setRisorseCombo] = useState([]);
    const [imports, setImports] = useState([]);
    const [selectedImportId, setSelectedImportId] = useState(null);
    const [movimenti, setMovimenti] = useState([]);
    const [loadingMovimenti, setLoadingMovimenti] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    // Upload form
    const [formato, setFormato] = useState('MT940');
    const [idRisorsa, setIdRisorsa] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const [showMappingModal, setShowMappingModal] = useState(false);

    const loadImports = useCallback(async () => {
        try {
            const res = await RiconciliazioneService.getListImport();
            setImports(res.data || []);
        } catch {
            Swal.fire('Errore', 'Impossibile caricare lo storico degli import', 'error');
        }
    }, []);

    useEffect(() => {
        RisorseService.getAllForCombo().then(res => {
            setRisorseCombo((res.data || []).map(r => ({ value: r.id, label: r.descrizione })));
        }).catch(() => {});
        loadImports();
    }, [loadImports]);

    const loadMovimenti = useCallback(async (idImport) => {
        setLoadingMovimenti(true);
        try {
            const res = await RiconciliazioneService.getMovimenti(idImport);
            setMovimenti(res.data || []);
        } catch {
            Swal.fire('Errore', 'Impossibile caricare i movimenti', 'error');
        } finally {
            setLoadingMovimenti(false);
        }
    }, []);

    useEffect(() => {
        if (selectedImportId) loadMovimenti(selectedImportId);
    }, [selectedImportId, loadMovimenti]);

    const handleUpload = async () => {
        const file = fileInputRef.current?.files?.[0];
        if (!file) {
            Swal.fire('Attenzione', 'Seleziona un file di estratto conto', 'warning');
            return;
        }
        setUploading(true);
        try {
            const res = await RiconciliazioneService.importFile(file, formato, idRisorsa || null, currentUser?.id);
            const result = res.data;
            if (result.stato === 'ERRORE') {
                Swal.fire('Import non riuscito', result.dettaglioErrore || 'Errore sconosciuto', 'error');
            } else {
                Swal.fire({
                    title: 'Import completato',
                    html: `${result.numMovimenti} movimenti letti, <strong>${result.numAbbinatiAuto} abbinati automaticamente</strong>. Il resto è in attesa di revisione.`,
                    icon: 'success'
                });
                fileInputRef.current.value = '';
            }
            await loadImports();
            setSelectedImportId(result.id);
        } catch (err) {
            const msg = err.response?.data || 'Impossibile importare il file';
            Swal.fire('Errore', typeof msg === 'string' ? msg : 'Impossibile importare il file', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleAbbina = async (movimento, candidato) => {
        const result = await Swal.fire({
            title: 'Confermare l\'abbinamento?',
            html: `Movimento di ${formatMoney(movimento.importo)} del ${movimento.dataValuta}<br/>→ ${candidato.tipo === 'INCASSO' ? 'Fattura' : 'Fattura fornitore'} ${candidato.numeroDocumento} — ${candidato.soggetto}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sì, abbina',
            cancelButtonText: 'Annulla'
        });
        if (!result.isConfirmed) return;
        try {
            await RiconciliazioneService.abbina(movimento.id, candidato.tipo, candidato.idScadenza, movimento.dataValuta, currentUser?.id);
            loadMovimenti(selectedImportId);
        } catch {
            Swal.fire('Errore', 'Impossibile confermare l\'abbinamento', 'error');
        }
    };

    const handleIgnora = async (movimento) => {
        try {
            await RiconciliazioneService.ignora(movimento.id, currentUser?.id);
            loadMovimenti(selectedImportId);
        } catch {
            Swal.fire('Errore', 'Impossibile ignorare il movimento', 'error');
        }
    };

    const selectedImport = imports.find(i => i.id === selectedImportId);
    const daRivedere = movimenti.filter(m => m.stato === 'NON_ABBINATO').length;

    return (
        <div className="rb-container">
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li className="active">Riconciliazione bancaria</li>
            </ul>
            <h1>Riconciliazione bancaria</h1>
            <p className="rb-subtitle">Importa l'estratto conto e abbina automaticamente i movimenti alle scadenze aperte.</p>

            {/* Upload box */}
            <div className="filter-box-vibrant" style={{ marginBottom: '20px' }}>
                <div className="filter-header-vibrant"><span><FaUpload /> Importa estratto conto</span></div>
                <div className="filter-body-vibrant">
                    <div className="filter-field">
                        <label>Formato</label>
                        <select className="form-control" value={formato} onChange={e => setFormato(e.target.value)} style={{ minWidth: '160px' }}>
                            <option value="MT940">MT940 (SWIFT)</option>
                            <option value="CSV">CSV</option>
                        </select>
                    </div>
                    <div className="filter-field">
                        <label>Banca / Cassa</label>
                        <select className="form-control" value={idRisorsa} onChange={e => setIdRisorsa(e.target.value)} style={{ minWidth: '200px' }}>
                            <option value="">Non specificata</option>
                            {risorseCombo.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>
                    <div className="filter-field" style={{ flex: 1, minWidth: '220px' }}>
                        <label>File</label>
                        <input type="file" ref={fileInputRef} accept=".csv,.txt,.sta,.940" className="form-control" style={{ height: '38px', padding: '6px' }} />
                    </div>
                    {formato === 'CSV' && (
                        <button
                            className="btn-paginate"
                            style={{ height: '38px' }}
                            disabled={!idRisorsa}
                            title={idRisorsa ? 'Configura le colonne del CSV per questa banca' : 'Seleziona prima una banca/cassa'}
                            onClick={() => setShowMappingModal(true)}
                        >
                            <FaCog /> Mapping colonne
                        </button>
                    )}
                    <button className="btn-search-vibrant" onClick={handleUpload} disabled={uploading}>
                        <FaFileImport /> {uploading ? 'Importazione...' : 'Importa'}
                    </button>
                </div>
            </div>

            <div className="rb-layout">
                {/* Import history */}
                <div className="rb-sidebar">
                    <div className="rb-sidebar-title">Import recenti</div>
                    {imports.length === 0 ? (
                        <div className="rb-empty-small">Nessun import ancora effettuato.</div>
                    ) : imports.map(imp => (
                        <div
                            key={imp.id}
                            className={`rb-import-item ${selectedImportId === imp.id ? 'active' : ''} ${imp.stato === 'ERRORE' ? 'is-error' : ''}`}
                            onClick={() => setSelectedImportId(imp.id)}
                        >
                            <div className="rb-import-item-top">
                                <span className="rb-import-file">{imp.nomeFile}</span>
                                <span className={`rb-format-badge ${imp.formato === 'MT940' ? 'mt940' : 'csv'}`}>{imp.formato}</span>
                            </div>
                            <div className="rb-import-item-meta">{imp.dtImport}</div>
                            {imp.stato === 'ERRORE' ? (
                                <div className="rb-import-item-error"><FaExclamationTriangle /> {imp.dettaglioErrore}</div>
                            ) : (
                                <div className="rb-import-item-stats">
                                    <span>{imp.numMovimenti} movimenti</span>
                                    <span className="rb-stat-ok">{imp.numAbbinatiAuto} auto</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Movements */}
                <div className="rb-main">
                    {!selectedImport ? (
                        <div className="main-box"><div className="main-box-body rb-empty-state">
                            <FaFileImport className="rb-empty-icon" />
                            <p>Seleziona un import dallo storico, o caricane uno nuovo, per vedere i movimenti.</p>
                        </div></div>
                    ) : (
                        <>
                            <div className="rb-summary-strip">
                                <div className="rb-summary-item">
                                    <span className="rb-summary-label">Movimenti</span>
                                    <span className="rb-summary-value">{movimenti.length}</span>
                                </div>
                                <div className="rb-summary-item ok">
                                    <span className="rb-summary-label">Abbinati</span>
                                    <span className="rb-summary-value">{movimenti.filter(m => m.stato === 'ABBINATO_AUTO' || m.stato === 'ABBINATO_MANUALE').length}</span>
                                </div>
                                <div className="rb-summary-item warn">
                                    <span className="rb-summary-label">Da rivedere</span>
                                    <span className="rb-summary-value">{daRivedere}</span>
                                </div>
                            </div>

                            <div className="main-box">
                                <div className="main-box-body" style={{ padding: 0 }}>
                                    {loadingMovimenti ? (
                                        <div className="rb-empty-state"><p>Caricamento...</p></div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover rb-table">
                                                <thead>
                                                    <tr>
                                                        <th>Data</th>
                                                        <th>Descrizione / Controparte</th>
                                                        <th className="text-right">Importo</th>
                                                        <th>Stato</th>
                                                        <th style={{ width: '1%' }}></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {movimenti.map(m => (
                                                        <React.Fragment key={m.id}>
                                                            <tr>
                                                                <td style={{ whiteSpace: 'nowrap' }}>{m.dataValuta}</td>
                                                                <td>
                                                                    <div className="rb-causale">{m.causaleBanca || '—'}</div>
                                                                    {m.controparte && <div className="rb-controparte">{m.controparte}</div>}
                                                                </td>
                                                                <td className={`text-right rb-importo ${m.importo >= 0 ? 'entrata' : 'uscita'}`}>
                                                                    {m.importo >= 0 ? '+' : ''}{formatMoney(m.importo)}
                                                                </td>
                                                                <td>
                                                                    <span className={`rb-stato-badge rb-stato-${m.stato?.toLowerCase()}`}>
                                                                        {m.stato === 'ABBINATO_AUTO' && <FaCheckCircle />}
                                                                        {m.stato === 'ABBINATO_MANUALE' && <FaCheckCircle />}
                                                                        {m.stato === 'NON_ABBINATO' && <FaExclamationTriangle />}
                                                                        {m.stato === 'IGNORATO' && <FaBan />}
                                                                        {STATO_LABEL[m.stato] || m.stato}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {m.stato === 'NON_ABBINATO' && (
                                                                        <button className="btn-icon" onClick={() => setExpandedId(expandedId === m.id ? null : m.id)} title="Vedi candidati">
                                                                            {expandedId === m.id ? <FaChevronUp /> : <FaChevronDown />}
                                                                        </button>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                            {expandedId === m.id && m.stato === 'NON_ABBINATO' && (
                                                                <tr className="rb-candidates-row">
                                                                    <td colSpan={5}>
                                                                        {!m.candidati || m.candidati.length === 0 ? (
                                                                            <div className="rb-no-candidates">
                                                                                Nessuna scadenza aperta compatibile trovata.
                                                                                <button className="rb-ignora-link" onClick={() => handleIgnora(m)}>Ignora questo movimento</button>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="rb-candidates-list">
                                                                                {m.candidati.map((c, i) => (
                                                                                    <div key={i} className="rb-candidate-card">
                                                                                        <div className="rb-candidate-info">
                                                                                            <span className={`rb-tipo-badge ${c.tipo === 'INCASSO' ? 'incasso' : 'pagamento'}`}>{c.tipo === 'INCASSO' ? 'Fattura' : 'Fattura fornitore'}</span>
                                                                                            <span className="rb-candidate-doc">{c.numeroDocumento}</span>
                                                                                            <span className="rb-candidate-soggetto">{c.soggetto}</span>
                                                                                            <span className="rb-candidate-scadenza">scad. {c.dataScadenza}</span>
                                                                                            <span className="rb-candidate-importo">{formatMoney(c.importo)}</span>
                                                                                        </div>
                                                                                        <div className="rb-candidate-actions">
                                                                                            <span className="rb-score" title="Affidabilità del match">{c.score}%</span>
                                                                                            <button className="rb-abbina-btn" onClick={() => handleAbbina(m, c)}><FaLink /> Abbina</button>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                                <button className="rb-ignora-link" onClick={() => handleIgnora(m)}>Nessuno di questi: ignora il movimento</button>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <CsvMappingModal
                isOpen={showMappingModal}
                onClose={() => setShowMappingModal(false)}
                idRisorsa={idRisorsa}
                onSaved={() => {}}
            />
        </div>
    );
};

export default RiconciliazioneBancariaPage;
