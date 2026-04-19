import React, { useState, useEffect } from 'react';
import { FaHome, FaBook, FaSearch, FaArrowUp, FaArrowDown, FaFileInvoiceDollar, FaPrint } from 'react-icons/fa';
import Swal from 'sweetalert2';
import RegistriIvaService from '../../services/RegistriIvaService';
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

const RegistriIvaPage = () => {
    const [anniDisponibili, setAnniDisponibili] = useState([]);
    const [selectedAnno, setSelectedAnno] = useState(new Date().getFullYear());
    // Di default prendiamo il mese precedente (se siamo a gennaio prende dicembre anno precedente, da gestire meglio, usiamo il mese corrente - 1 per semplicità o gennaio come fallback)
    const currentMonthIndex = new Date().getMonth();
    const defaultMese = currentMonthIndex === 0 ? 'DICEMBRE' : PERIODI[currentMonthIndex - 1].value;
    const [selectedPeriodo, setSelectedPeriodo] = useState(defaultMese);
    
    const [documenti, setDocumenti] = useState([]);
    const [loading, setLoading] = useState(false);
    const [exportingLabel, setExportingLabel] = useState(null);
    const [activeTab, setActiveTab] = useState('vendite');

    useEffect(() => {
        fetchAnni();
        if (currentMonthIndex === 0) {
            setSelectedAnno(new Date().getFullYear() - 1);
        }
    }, [currentMonthIndex]);

    const fetchAnni = async () => {
        try {
            const res = await RegistriIvaService.getAllYears();
            const anni = res.data || res || [];
            if (anni.length === 0) anni.push(new Date().getFullYear());
            anni.sort((a, b) => b - a);
            setAnniDisponibili(anni);
            
            if (!anni.includes(selectedAnno) && anni.length > 0) {
                setSelectedAnno(anni[0]);
            }
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
        if (anniDisponibili.length > 0) {
            handleSearch();
        }
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
            console.error("Errore esportazione registro", error);
            Swal.fire('Errore', "Impossibile generare il PDF del registro", 'error');
        } finally {
            setExportingLabel(null);
        }
    };

    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '€ 0,00';
        return `€ ${parseFloat(val).toLocaleString('it-IT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return dateString; 
    };

    const venditeList = documenti.filter(d => d.gruppoDocumento && d.gruppoDocumento.toLowerCase().includes('vendit') && d.esigibilitaDifferita !== 1);
    const differitaList = documenti.filter(d => d.gruppoDocumento && d.gruppoDocumento.toLowerCase().includes('vendit') && d.esigibilitaDifferita === 1);
    const acquistiList = documenti.filter(d => d.gruppoDocumento && d.gruppoDocumento.toLowerCase().includes('acquist'));

    const renderTable = (docs, title, isVendita, tipoRegistroKey) => {
        if (!docs || docs.length === 0) {
            return (
                <div className="text-center py-5 bg-white rounded-lg shadow-sm mt-2 border">
                    <p className="text-muted mb-0">Nessun documento trovato in questa categoria.</p>
                </div>
            );
        }

        const totImponibile = docs.reduce((sum, d) => sum + (d.totale || 0), 0);
        
        const totIva = docs.reduce((sum, d) => {
            const ivaVal = isVendita ? (d.ivaDebito || d.iva || 0) : (d.ivaCredito || d.iva || 0);
            return sum + ivaVal;
        }, 0);
        
        return (
            <div className="registro-section">
                <div className={`registro-header ${isVendita ? 'vendite' : 'acquisti'} d-flex justify-content-between align-items-center`}>
                    <div className="d-flex align-items-center gap-2">
                        {isVendita ? <FaArrowUp size={24} color="#2ecc71" /> : <FaArrowDown size={24} color="#e74c3c" />}
                        <h3 className="registro-title mb-0" style={{marginLeft: '12px'}}>{title}</h3>
                    </div>
                    <button 
                        className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
                        onClick={() => handleExport(tipoRegistroKey)}
                        disabled={exportingLabel === tipoRegistroKey}
                        title="Esporta questo registro in formato PDF"
                    >
                        {exportingLabel === tipoRegistroKey ? (
                            <><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Generazione...</>
                        ) : (
                            <><FaPrint style={{marginRight: '6px'}} /> Stampa PDF</>
                        )}
                    </button>
                </div>
                <div className="table-responsive">
                    <table className="premium-table">
                        <thead>
                            <tr>
                                <th width="10%">N. Doc</th>
                                <th width="15%">Data</th>
                                <th>Soggetto</th>
                                <th width="15%" className="amount-cell">Imponibile</th>
                                <th width="15%" className="amount-cell">IVA {isVendita ? 'Debito' : 'Credito'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {docs.map((d, idx) => (
                                <tr key={idx}>
                                    <td>
                                        <strong>{d.numeroDocumento}</strong>
                                        {d.esigibilitaDifferita === 1 && (
                                            <span className="badge-differita" title="Esigibilità Differita">ESIG. DIFF.</span>
                                        )}
                                    </td>
                                    <td>{formatDate(d.dataDocumento)}</td>
                                    <td>{d.soggetto}</td>
                                    <td className="amount-cell">{formatCurrency(d.totale)}</td>
                                    <td className="amount-cell">
                                        {formatCurrency(isVendita ? (d.ivaDebito || d.iva) : (d.ivaCredito || d.iva))}
                                    </td>
                                </tr>
                            ))}
                            <tr className="total-row">
                                <td colSpan="3" style={{textAlign: 'right'}}>TOTALE {title}</td>
                                <td className="amount-cell">{formatCurrency(totImponibile)}</td>
                                <td className="amount-cell">{formatCurrency(totIva)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="container-fluid page-content registri-container">
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li>Fatturazione</li>
                <li className="active">Registri IVA</li>
            </ul>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div className="d-flex align-items-center">
                    <h1 className="m-0 mr-3 d-flex align-items-center">
                        <FaBook className="mr-2" color="#3498db" /> Registri IVA
                    </h1>
                </div>
            </div>

            <div className="document-config-card mb-4" style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}>
                    <label className="config-label mb-2 d-block">Anno</label>
                    <select 
                        className="form-control w-100" 
                        value={selectedAnno} 
                        onChange={(e) => setSelectedAnno(e.target.value)}
                        style={{ height: '45px', borderRadius: '8px', border: '1px solid #ced4da' }}
                    >
                        {anniDisponibili.map(anno => (
                            <option key={anno} value={anno}>{anno}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: '1', minWidth: '200px', maxWidth: '300px' }}>
                    <label className="config-label mb-2 d-block">Periodo</label>
                    <select 
                        className="form-control w-100" 
                        value={selectedPeriodo} 
                        onChange={(e) => setSelectedPeriodo(e.target.value)}
                        style={{ height: '45px', borderRadius: '8px', border: '1px solid #ced4da' }}
                    >
                        {PERIODI.map(p => (
                            <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                    </select>
                </div>
                <div style={{ flex: '0 0 auto' }}>
                    <button className="btn btn-primary premium-btn" style={{ height: '45px', padding: '0 30px' }} onClick={handleSearch} disabled={loading}>
                        <FaSearch className="mr-2" /> Estrai Dati
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center p-5">
                    <div className="spinner-border text-primary" role="status">
                        <span className="sr-only">Caricamento...</span>
                    </div>
                    <p className="mt-3 text-muted">Estrazione dei registri in corso...</p>
                </div>
            ) : documenti.length === 0 ? (
                <div className="empty-state">
                    <FaFileInvoiceDollar className="empty-state-icon" />
                    <h3>Nessun movimento trovato</h3>
                    <p>Non risultano documenti IVA per il periodo selezionato ({PERIODI.find(p => p.value === selectedPeriodo)?.label} {selectedAnno}).</p>
                </div>
            ) : (
                <div className="registri-content">
                    {/* Tab Navigation */}
                    <div className="tabs-container">
                        <button 
                            className={`registro-tab vendite ${activeTab === 'vendite' ? 'active' : ''}`}
                            onClick={() => setActiveTab('vendite')}
                        >
                            <FaArrowUp /> Vendite
                            <span className="tab-badge">{venditeList.length}</span>
                        </button>
                        <button 
                            className={`registro-tab differita ${activeTab === 'differita' ? 'active' : ''}`}
                            onClick={() => setActiveTab('differita')}
                        >
                            <FaFileInvoiceDollar /> Differita
                            <span className="tab-badge">{differitaList.length}</span>
                        </button>
                        <button 
                            className={`registro-tab acquisti ${activeTab === 'acquisti' ? 'active' : ''}`}
                            onClick={() => setActiveTab('acquisti')}
                        >
                            <FaArrowDown /> Acquisti
                            <span className="tab-badge">{acquistiList.length}</span>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="tab-content">
                        {activeTab === 'vendite' && renderTable(venditeList, "Registro Vendite", true, "vendite")}
                        {activeTab === 'differita' && renderTable(differitaList, "Registro Vendite (Esigibilità Differita)", true, "differita")}
                        {activeTab === 'acquisti' && renderTable(acquistiList, "Registro Acquisti", false, "acquisti")}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistriIvaPage;
