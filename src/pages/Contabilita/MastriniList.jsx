import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import MastriniService from '../../services/MastriniService';
import PianoDeiContiService from '../../services/PianoDeiContiService';
import { FaListAlt, FaFilePdf, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import EntitySelectGroup from '../../components/EntitySelectGroup';
import '../Configurazione/ConfigurazionePage.css';

const formatCurrency = (value) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value || 0);
};

const formatData = (iso) => {
    if (!iso) return '-';
    const [y, m, d] = iso.split('-');
    return d && m && y ? `${d}/${m}/${y}` : iso;
};

const MastrinoTable = ({ mastrino, showTitle = true }) => (
    <>
        {showTitle && <h3 style={{ marginBottom: '12px' }}>{mastrino.codiceConto} - {mastrino.descrizioneConto}</h3>}
        <div className="table-responsive">
            <table className="table table-hover">
                <thead>
                    <tr>
                        <th style={{ width: '110px' }}>Data</th>
                        <th>Descrizione</th>
                        <th style={{ width: '140px' }}>Documento</th>
                        <th style={{ width: '130px' }} className="text-right">Dare</th>
                        <th style={{ width: '130px' }} className="text-right">Avere</th>
                        <th style={{ width: '140px' }} className="text-right">Saldo progressivo</th>
                    </tr>
                </thead>
                <tbody>
                    {mastrino.righe.map((riga, idx) => (
                        <tr key={idx}>
                            <td>{formatData(riga.dataRegistrazione)}</td>
                            <td>{riga.descrizione}</td>
                            <td>{riga.tipoDocumento} n. {riga.numeroDocumento}</td>
                            <td className="text-right">{riga.importoDare > 0 ? formatCurrency(riga.importoDare) : ''}</td>
                            <td className="text-right">{riga.importoAvere > 0 ? formatCurrency(riga.importoAvere) : ''}</td>
                            <td className="text-right">{formatCurrency(riga.saldoProgressivo)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr style={{ fontWeight: 'bold', background: '#f8fafc' }}>
                        <td colSpan={3}>Totali</td>
                        <td className="text-right">{formatCurrency(mastrino.totaleDare)}</td>
                        <td className="text-right">{formatCurrency(mastrino.totaleAvere)}</td>
                        <td className="text-right">{formatCurrency(mastrino.saldoFinale)}</td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </>
);

const MastrinoAccordionItem = ({ mastrino }) => {
    const [aperto, setAperto] = useState(false);
    const segnoSaldo = (mastrino.saldoFinale || 0) < 0 ? '#b91c1c' : '#1e293b';

    return (
        <div style={{ border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '10px', overflow: 'hidden' }}>
            <button
                type="button"
                onClick={() => setAperto(o => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', background: aperto ? '#f8fafc' : '#fff', border: 'none', cursor: 'pointer', textAlign: 'left'
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600, color: '#334155' }}>
                    {aperto ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                    {mastrino.codiceConto} - {mastrino.descrizioneConto}
                    <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: '12px' }}>({(mastrino.righe || []).length} movimenti)</span>
                </span>
                <span style={{ fontWeight: 700, color: segnoSaldo }}>{formatCurrency(mastrino.saldoFinale)}</span>
            </button>
            {aperto && (
                <div style={{ padding: '0 16px 16px' }}>
                    <MastrinoTable mastrino={mastrino} showTitle={false} />
                </div>
            )}
        </div>
    );
};

const MastriniList = () => {
    const [conti, setConti] = useState([]);
    const [idConto, setIdConto] = useState('');
    const [dataDa, setDataDa] = useState('');
    const [dataA, setDataA] = useState('');
    const [mastrino, setMastrino] = useState(null);
    const [mastriniTutti, setMastriniTutti] = useState(null);
    const [loading, setLoading] = useState(false);
    const [loadingConti, setLoadingConti] = useState(true);
    const [stampando, setStampando] = useState(false);
    const [ricercaEseguita, setRicercaEseguita] = useState(false);

    useEffect(() => {
        const fetchConti = async () => {
            setLoadingConti(true);
            try {
                const res = await PianoDeiContiService.getList('');
                const lista = (res.payload || []).filter(c => c.idPadre != null);
                setConti(lista);
            } catch (err) {
                console.error('Errore nel caricamento del piano dei conti:', err);
            } finally {
                setLoadingConti(false);
            }
        };
        fetchConti();
    }, []);

    const fetchMastrino = async (id) => {
        setRicercaEseguita(true);
        if (!id) {
            setMastrino(null);
            setLoading(true);
            try {
                const params = {};
                if (dataDa) params.dataDa = dataDa;
                if (dataA) params.dataA = dataA;
                const res = await MastriniService.getTutti(params);
                if (res.errorText) {
                    Swal.fire({ title: 'Errore', text: res.errorText, icon: 'error' });
                    setMastriniTutti([]);
                } else {
                    setMastriniTutti(res.payload || []);
                }
            } catch (err) {
                console.error('Errore nel caricamento dei mastrini:', err);
                setMastriniTutti([]);
            } finally {
                setLoading(false);
            }
            return;
        }
        setMastriniTutti(null);
        setLoading(true);
        try {
            const params = {};
            if (dataDa) params.dataDa = dataDa;
            if (dataA) params.dataA = dataA;
            const res = await MastriniService.get(id, params);
            setMastrino(res.payload || null);
        } catch (err) {
            console.error('Errore nel caricamento del mastrino:', err);
            setMastrino(null);
        } finally {
            setLoading(false);
        }
    };

    const handleContoChange = (opt) => {
        const value = opt ? opt.value : '';
        setIdConto(value);
        fetchMastrino(value);
    };

    const contoOptions = conti.map(c => ({ value: c.id, label: `${c.codice} - ${c.descrizione}` }));

    const handleFiltraPeriodo = () => {
        fetchMastrino(idConto);
    };

    const handleStampa = async () => {
        setStampando(true);
        try {
            const params = {};
            if (dataDa) params.dataDa = dataDa;
            if (dataA) params.dataA = dataA;
            const res = await MastriniService.print(idConto, params);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error('Errore nella stampa del mastrino:', err);
            Swal.fire({ title: 'Errore', text: 'Errore nella generazione del PDF.', icon: 'error' });
        } finally {
            setStampando(false);
        }
    };

    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaListAlt style={{ marginRight: '10px' }} />Mastrini</h2>
            </div>

            <div className="tab-content-wrapper" style={{ border: 'none', padding: '0' }}>
                <div className="dati-azienda-container" style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                    <p className="section-description">
                        Elenco cronologico dei movimenti di un singolo conto, con saldo progressivo. Il saldo di apertura e' sempre zero (non e' ancora gestita l'apertura di un nuovo esercizio con riporto dei saldi).
                    </p>

                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '20px' }}>
                        <div className="inline-select-group" style={{ minWidth: '320px' }}>
                            <EntitySelectGroup
                                label="Conto"
                                isAsync={false}
                                options={contoOptions}
                                value={contoOptions.find(o => o.value === parseInt(idConto)) || null}
                                onChange={handleContoChange}
                                placeholder={loadingConti ? 'Caricamento...' : 'Seleziona un conto...'}
                                isDisabled={loadingConti}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>Da</label>
                            <input type="date" className="form-control" value={dataDa} onChange={(e) => setDataDa(e.target.value)} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>A</label>
                            <input type="date" className="form-control" value={dataA} onChange={(e) => setDataA(e.target.value)} />
                        </div>
                        <button className="btn btn-primary" style={{ fontSize: '14px', fontWeight: 500 }} onClick={handleFiltraPeriodo}>Filtra</button>
                        <button className="btn btn-secondary" style={{ fontSize: '14px', fontWeight: 500 }} onClick={handleStampa} disabled={!idConto || !mastrino || stampando} title={!idConto ? 'Seleziona un conto per stampare il PDF' : undefined}>
                            <FaFilePdf style={{ marginRight: '6px' }} />{stampando ? 'Generazione...' : 'Stampa PDF'}
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Caricamento...</div>
                    ) : !ricercaEseguita ? (
                        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            Seleziona un conto per vederne il mastrino, oppure premi Filtra senza selezionarne uno per vederli tutti.
                        </div>
                    ) : idConto ? (
                        !mastrino || (mastrino.righe || []).length === 0 ? (
                            <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b' }}>
                                Nessun movimento presente su questo conto nel periodo selezionato.
                            </div>
                        ) : (
                            <MastrinoTable mastrino={mastrino} />
                        )
                    ) : !mastriniTutti || mastriniTutti.length === 0 ? (
                        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            Nessun movimento presente su nessun conto nel periodo selezionato.
                        </div>
                    ) : (
                        <div>
                            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                                {mastriniTutti.length} cont{mastriniTutti.length === 1 ? 'o' : 'i'} con movimenti nel periodo. Clicca su un conto per vedere il dettaglio.
                            </div>
                            {mastriniTutti.map(m => (
                                <MastrinoAccordionItem key={m.idConto} mastrino={m} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MastriniList;
