import React, { useState, useEffect } from 'react';
import { FaHome, FaBook, FaSearch, FaArrowUp, FaArrowDown, FaFileInvoiceDollar, FaPrint, FaCalculator, FaFileDownload, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';
import RegistriIvaService from '../../services/RegistriIvaService';
import LipeService from '../../services/LipeService';
import './RegistriIvaPage.css';

const PERIODI = [
    { value: 'GENNAIO', label: 'Gennaio' },
    { value: 'FEBBRAIO', label: 'Febbraio' },
    { value: 'MARZO', label: 'Marzo' },
    { value: 'APRILE', label: 'Aprile' },
    { value: 'MAGGIO', label: 'Maggio' },
    { value: 'GIUGNO', label: 'Giugno' },
    { value: 'LUGLIO', label: 'Luglio' },
    { value: 'AGOSTO', label: 'Agosto' },
    { value: 'SETTEMBRE', label: 'Settembre' },
    { value: 'OTTOBRE', label: 'Ottobre' },
    { value: 'NOVEMBRE', label: 'Novembre' },
    { value: 'DICEMBRE', label: 'Dicembre' },
    { value: 'PRIMO_TIMESTRE', label: '1° Trimestre' },
    { value: 'SECONDO_TIMESTRE', label: '2° Trimestre' },
    { value: 'TERZO_TRIMESTRE', label: '3° Trimestre' },
    { value: 'QUARTO_TRIMESTRE', label: '4° Trimestre' },
    { value: 'ANNUALE', label: 'Annuale' }
];

const TRIMESTRE_MAP = {
    'PRIMO_TIMESTRE': 1,
    'SECONDO_TIMESTRE': 2,
    'TERZO_TRIMESTRE': 3,
    'QUARTO_TRIMESTRE': 4
};

const LIPE_INTEGRATIVI_FIELDS = [
    { key: 'debitoIvaPrecedente',      label: 'Debito IVA periodo precedente',   addend: true  },
    { key: 'creditoIvaPrecedente',     label: 'Credito IVA periodo precedente',  addend: false },
    { key: 'creditoIvaAnnoPrecedente', label: 'Credito IVA anno precedente',      addend: false },
    { key: 'versamentiAutoUE',         label: 'Versamenti auto UE',               addend: false },
    { key: 'creditiImposta',           label: "Crediti d'imposta",                addend: false },
    { key: 'interessiDovuti',          label: 'Interessi dovuti (rateazione)',     addend: true  },
    { key: 'acconto',                  label: 'Acconto versato',                  addend: false },
];

const fmt = (v) => {
    if (v === null || v === undefined) return '€ 0,00';
    return `€ ${parseFloat(v).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const calcImportoFinale = (lipeData, integrativi) => {
    const nvl = (k) => parseFloat(integrativi[k] || 0) || 0;
    const result =
        parseFloat(lipeData.ivaDovuta  || 0)
        + nvl('debitoIvaPrecedente')
        + nvl('interessiDovuti')
        - parseFloat(lipeData.ivaCredito || 0)
        - nvl('creditoIvaPrecedente')
        - nvl('creditoIvaAnnoPrecedente')
        - nvl('versamentiAutoUE')
        - nvl('creditiImposta')
        - nvl('acconto');
    return parseFloat(result.toFixed(2));
};

const RegistriIvaPage = () => {
    const [anniDisponibili, setAnniDisponibili] = useState([]);
    const [selectedAnno, setSelectedAnno] = useState(new Date().getFullYear());
    const currentMonthIndex = new Date().getMonth();
    const defaultMese = currentMonthIndex === 0 ? 'DICEMBRE' : PERIODI[currentMonthIndex - 1].value;
    const [selectedPeriodo, setSelectedPeriodo] = useState(defaultMese);

    const [documenti, setDocumenti] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exportingLabel, setExportingLabel] = useState(null);
    const [activeTab, setActiveTab] = useState('vendite');

    // LIPE state
    const [lipeOpen, setLipeOpen] = useState(false);
    const [lipeLoading, setLipeLoading] = useState(false);
    const [lipeDownloading, setLipeDownloading] = useState(false);
    const [lipeData, setLipeData] = useState(null);
    const [lipeIntegrativi, setLipeIntegrativi] = useState({});

    const isTrimestre = TRIMESTRE_MAP.hasOwnProperty(selectedPeriodo);

    useEffect(() => {
        fetchAnni();
        if (currentMonthIndex === 0) setSelectedAnno(new Date().getFullYear() - 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentMonthIndex]);

    const fetchAnni = async () => {
        try {
            const res = await RegistriIvaService.getAllYears();
            const anni = res.data || res || [];
            if (anni.length === 0) anni.push(new Date().getFullYear());
            anni.sort((a, b) => b - a);
            setAnniDisponibili(anni);
            if (!anni.includes(selectedAnno) && anni.length > 0) setSelectedAnno(anni[0]);
        } catch (error) {
            console.error("Errore caricamento anni", error);
            Swal.fire('Errore', "Impossibile caricare l'elenco degli anni disponibili", 'error');
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const res = await RegistriIvaService.getDocumentiIva(selectedPeriodo, selectedAnno);
            const data = (res.data && res.data.list) ? res.data.list : (res.list ? res.list : []);
            setDocumenti(data);
        } catch (error) {
            console.error("Errore ricerca registri", error);
            Swal.fire('Errore', 'Impossibile estrarre i dati dei registri IVA', 'error');
            setDocumenti([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (anniDisponibili.length > 0) handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anniDisponibili]);

    const handleExport = async (tipoRegistro) => {
        setExportingLabel(tipoRegistro);
        try {
            const res = await RegistriIvaService.exportRegistro(selectedPeriodo, selectedAnno, tipoRegistro);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `registro_iva_${tipoRegistro}_${selectedPeriodo}_${selectedAnno}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            Swal.fire('Errore', "Impossibile generare il PDF del registro", 'error');
        } finally {
            setExportingLabel(null);
        }
    };

    const handleGeneraLipe = async () => {
        const trimestre = TRIMESTRE_MAP[selectedPeriodo];
        setLipeLoading(true);
        setLipeOpen(true);
        setLipeData(null);
        setLipeIntegrativi({});
        try {
            const res = await LipeService.getAnteprima(selectedAnno, trimestre);
            setLipeData(res.data);
        } catch (error) {
            Swal.fire('Errore', 'Impossibile calcolare i dati LIPE dal database', 'error');
            setLipeOpen(false);
        } finally {
            setLipeLoading(false);
        }
    };

    const handleScaricaXml = async () => {
        if (!lipeData) return;
        const trimestre = TRIMESTRE_MAP[selectedPeriodo];
        const nvl = (k) => parseFloat(lipeIntegrativi[k] || 0) || 0;
        const finale = calcImportoFinale(lipeData, lipeIntegrativi);

        const dto = {
            ...lipeData,
            trimestre,
            debitoIvaPrecedente:      nvl('debitoIvaPrecedente'),
            creditoIvaPrecedente:     nvl('creditoIvaPrecedente'),
            creditoIvaAnnoPrecedente: nvl('creditoIvaAnnoPrecedente'),
            versamentiAutoUE:         nvl('versamentiAutoUE'),
            creditiImposta:           nvl('creditiImposta'),
            interessiDovuti:          nvl('interessiDovuti'),
            acconto:                  nvl('acconto'),
            importoDaVersare:         finale > 0 ? finale : 0,
            importoACredito:          finale < 0 ? Math.abs(finale) : 0,
        };

        setLipeDownloading(true);
        try {
            const res = await LipeService.generaXml(dto);
            const blob = new Blob([res.data], { type: 'application/xml' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `LIPE_${selectedAnno}_T${trimestre}.xml`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (error) {
            Swal.fire('Errore', 'Impossibile generare il file XML LIPE', 'error');
        } finally {
            setLipeDownloading(false);
        }
    };

    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '€ 0,00';
        return `€ ${parseFloat(val).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const venditeList   = documenti.filter(d => d.gruppoDocumento?.toLowerCase().includes('vendit') && d.esigibilitaDifferita !== 1);
    const differitaList = documenti.filter(d => d.gruppoDocumento?.toLowerCase().includes('vendit') && d.esigibilitaDifferita === 1);
    const acquistiList  = documenti.filter(d => d.gruppoDocumento?.toLowerCase().includes('acquist'));

    const renderTable = (docs, title, isVendita, tipoRegistroKey) => {
        const totImponibile = docs.reduce((sum, d) => sum + (d.totale || 0), 0);
        const totIva = docs.reduce((sum, d) => {
            return sum + (isVendita ? (d.ivaDebito || d.iva || 0) : (d.ivaCredito || d.iva || 0));
        }, 0);

        if (!docs || docs.length === 0) {
            return (
                <div className="ri-empty">
                    <FaFileInvoiceDollar size={32} />
                    <p>Nessun documento in questa categoria per il periodo selezionato.</p>
                </div>
            );
        }

        return (
            <div className="main-box" style={{ marginTop: '0' }}>
                <div className="ri-table-header">
                    <div className="ri-table-title">
                        {isVendita
                            ? <FaArrowUp color="#2ecc71" />
                            : <FaArrowDown color="#e74c3c" />}
                        <span>{title}</span>
                    </div>
                    <button
                        className="btn-action btn-secondary"
                        onClick={() => handleExport(tipoRegistroKey)}
                        disabled={exportingLabel === tipoRegistroKey}
                    >
                        {exportingLabel === tipoRegistroKey
                            ? <><span className="spinner-border spinner-border-sm mr-1" /> Generazione...</>
                            : <><FaPrint className="mr-1" /> Stampa PDF</>}
                    </button>
                </div>
                <div className="main-box-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th style={{ width: '8%' }}>N. Doc</th>
                                    <th style={{ width: '12%' }}>Data</th>
                                    <th>Soggetto</th>
                                    <th style={{ width: '15%', textAlign: 'right' }}>Imponibile</th>
                                    <th style={{ width: '15%', textAlign: 'right' }}>IVA {isVendita ? 'Debito' : 'Credito'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {docs.map((d, idx) => (
                                    <tr key={idx}>
                                        <td>
                                            <strong>{d.numeroDocumento}</strong>
                                            {d.esigibilitaDifferita === 1 && (
                                                <span className="ri-badge-differita" title="Esigibilità Differita">DIFF.</span>
                                            )}
                                        </td>
                                        <td>{d.dataDocumento}</td>
                                        <td>{d.soggetto}</td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrency(d.totale)}</td>
                                        <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                            {formatCurrency(isVendita ? (d.ivaDebito || d.iva) : (d.ivaCredito || d.iva))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="ri-total-row">
                                    <td colSpan="3" style={{ textAlign: 'right', fontWeight: 700 }}>TOTALE</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(totImponibile)}</td>
                                    <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrency(totIva)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    const renderLipePanel = () => {
        if (!lipeOpen) return null;
        const periodoLabel = PERIODI.find(p => p.value === selectedPeriodo)?.label;
        const finale = lipeData ? calcImportoFinale(lipeData, lipeIntegrativi) : null;

        return (
            <div className="lipe-panel">
                <div className="lipe-panel-header">
                    <span><FaCalculator className="mr-2" />LIPE — Liquidazione IVA {periodoLabel} {selectedAnno}</span>
                    <button className="lipe-close-btn" onClick={() => setLipeOpen(false)}><FaTimes /></button>
                </div>

                {lipeLoading ? (
                    <div className="lipe-loading">
                        <div className="spinner-border spinner-border-sm text-primary" />
                        <span>Calcolo dati in corso...</span>
                    </div>
                ) : lipeData && (
                    <div className="lipe-body">
                        <div className="lipe-columns">
                            {/* Colonna sinistra: dati contabili */}
                            <div className="lipe-col">
                                <div className="lipe-col-title">Dati contabili (calcolati)</div>
                                <div className="lipe-field readonly">
                                    <span className="lipe-field-label">Totale operazioni attive</span>
                                    <span className="lipe-field-value">{fmt(lipeData.totaleOperazioniAttive)}</span>
                                </div>
                                <div className="lipe-field readonly">
                                    <span className="lipe-field-label">IVA esigibile</span>
                                    <span className="lipe-field-value green">{fmt(lipeData.ivaEsigibile)}</span>
                                </div>
                                <div className="lipe-field readonly">
                                    <span className="lipe-field-label">Totale operazioni passive</span>
                                    <span className="lipe-field-value">{fmt(lipeData.totaleOperazioniPassive)}</span>
                                </div>
                                <div className="lipe-field readonly">
                                    <span className="lipe-field-label">IVA detratta</span>
                                    <span className="lipe-field-value red">{fmt(lipeData.ivaDetratta)}</span>
                                </div>
                                <div className="lipe-field readonly highlight">
                                    <span className="lipe-field-label">
                                        {parseFloat(lipeData.ivaDovuta || 0) > 0 ? 'IVA dovuta' : 'IVA a credito'}
                                    </span>
                                    <span className={`lipe-field-value ${parseFloat(lipeData.ivaDovuta || 0) > 0 ? 'orange' : 'blue'}`}>
                                        {parseFloat(lipeData.ivaDovuta || 0) > 0 ? fmt(lipeData.ivaDovuta) : fmt(lipeData.ivaCredito)}
                                    </span>
                                </div>
                            </div>

                            {/* Colonna destra: integrativi */}
                            <div className="lipe-col">
                                <div className="lipe-col-title">Dati integrativi</div>
                                {LIPE_INTEGRATIVI_FIELDS.map(f => (
                                    <div className="lipe-field editable" key={f.key}>
                                        <span className="lipe-field-label">
                                            <span className={`lipe-sign ${f.addend ? 'plus' : 'minus'}`}>{f.addend ? '+' : '−'}</span>
                                            {f.label}
                                        </span>
                                        <div className="lipe-input-wrap">
                                            <span className="lipe-euro">€</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="lipe-input"
                                                value={lipeIntegrativi[f.key] ?? ''}
                                                placeholder="0.00"
                                                onChange={e => setLipeIntegrativi(prev => ({ ...prev, [f.key]: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Risultato */}
                        <div className="lipe-result">
                            <span className="lipe-result-label">
                                {finale !== null && finale >= 0 ? 'Importo da versare' : 'Importo a credito'}
                            </span>
                            <span className={`lipe-result-value ${finale !== null && finale >= 0 ? 'da-versare' : 'a-credito'}`}>
                                {finale !== null ? fmt(Math.abs(finale)) : '—'}
                            </span>
                            <button className="btn-search-vibrant lipe-dl-btn" onClick={handleScaricaXml} disabled={lipeDownloading}>
                                {lipeDownloading
                                    ? <><span className="spinner-border spinner-border-sm mr-1" /> Generazione...</>
                                    : <><FaFileDownload className="mr-1" /> Scarica XML LIPE</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const periodoLabel = PERIODI.find(p => p.value === selectedPeriodo)?.label;

    return (
        <div className="fatture-list-container">
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li>Fatturazione</li>
                <li className="active">Registri IVA</li>
            </ul>

            <div className="header-row">
                <h1><FaBook className="mr-2" style={{ color: '#03a9f4', fontSize: '28px' }} /> Registri IVA</h1>
            </div>

            {/* Filter box stile app */}
            <div className="filter-box-vibrant">
                <div className="filter-header-vibrant">
                    <span><FaSearch className="mr-1" /> Selezione periodo</span>
                </div>
                <div className="filter-body-vibrant">
                    <div className="filter-field">
                        <label>Anno</label>
                        <select
                            className="form-control"
                            value={selectedAnno}
                            onChange={(e) => setSelectedAnno(e.target.value)}
                            style={{ minWidth: '120px' }}
                        >
                            {anniDisponibili.map(anno => (
                                <option key={anno} value={anno}>{anno}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-field">
                        <label>Periodo</label>
                        <select
                            className="form-control"
                            value={selectedPeriodo}
                            onChange={(e) => setSelectedPeriodo(e.target.value)}
                            style={{ minWidth: '180px' }}
                        >
                            {PERIODI.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </select>
                    </div>
                    <button className="btn-search-vibrant" onClick={handleSearch} disabled={loading}>
                        <FaSearch /> Estrai Dati
                    </button>
                    <div title={!isTrimestre ? 'Seleziona un trimestre per generare la LIPE' : ''}>
                        <button
                            className="btn-lipe-filter"
                            onClick={handleGeneraLipe}
                            disabled={!isTrimestre || lipeLoading}
                        >
                            <FaCalculator className="mr-1" />
                            Genera LIPE
                        </button>
                    </div>
                </div>
            </div>

            {renderLipePanel()}

            {loading ? (
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status" />
                    <p className="mt-3 text-muted">Estrazione dei registri in corso...</p>
                </div>
            ) : documenti.length === 0 ? (
                <div className="ri-empty-state">
                    <FaFileInvoiceDollar size={48} />
                    <h3>Nessun movimento trovato</h3>
                    <p>Non risultano documenti IVA per {periodoLabel} {selectedAnno}.</p>
                </div>
            ) : (
                <div>
                    {/* Tab Navigation stile app */}
                    <div className="toolbar-row" style={{ marginBottom: '0', borderBottom: 'none', borderRadius: '3px 3px 0 0' }}>
                        <div className="ri-tabs">
                            <button
                                className={`ri-tab ${activeTab === 'vendite' ? 'active vendite' : ''}`}
                                onClick={() => setActiveTab('vendite')}
                            >
                                <FaArrowUp /> Vendite
                                <span className="ri-tab-count">{venditeList.length}</span>
                            </button>
                            <button
                                className={`ri-tab ${activeTab === 'differita' ? 'active differita' : ''}`}
                                onClick={() => setActiveTab('differita')}
                            >
                                <FaFileInvoiceDollar /> Differita
                                <span className="ri-tab-count">{differitaList.length}</span>
                            </button>
                            <button
                                className={`ri-tab ${activeTab === 'acquisti' ? 'active acquisti' : ''}`}
                                onClick={() => setActiveTab('acquisti')}
                            >
                                <FaArrowDown /> Acquisti
                                <span className="ri-tab-count">{acquistiList.length}</span>
                            </button>
                        </div>
                    </div>

                    {activeTab === 'vendite'   && renderTable(venditeList,   "Registro Vendite", true, "vendite")}
                    {activeTab === 'differita' && renderTable(differitaList, "Registro Vendite (Esigibilità Differita)", true, "differita")}
                    {activeTab === 'acquisti'  && renderTable(acquistiList,  "Registro Acquisti", false, "acquisti")}
                </div>
            )}
        </div>
    );
};

export default RegistriIvaPage;
