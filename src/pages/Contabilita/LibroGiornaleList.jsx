import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import LibroGiornaleService from '../../services/LibroGiornaleService';
import PianoDeiContiService from '../../services/PianoDeiContiService';
import { FaBook, FaChevronDown, FaChevronRight, FaPlus, FaTrash, FaPencilAlt, FaFilePdf } from 'react-icons/fa';
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

const oggiIso = () => new Date().toISOString().substring(0, 10);

const rigaVuota = () => ({ idConto: '', segno: 'dare', importo: '', descrizione: '' });

const formVuoto = () => ({
    dataRegistrazione: oggiIso(),
    descrizione: '',
    numeroDocumento: '',
    righe: [rigaVuota(), rigaVuota()]
});

const LibroGiornaleList = () => {
    const [registrazioni, setRegistrazioni] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [dataDa, setDataDa] = useState('');
    const [dataA, setDataA] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const [conti, setConti] = useState([]);
    const contoOptions = conti.map(c => ({ value: c.id, label: `${c.codice} - ${c.descrizione}` }));
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(formVuoto());
    const [salvando, setSalvando] = useState(false);
    const [erroreForm, setErroreForm] = useState('');
    const [stampando, setStampando] = useState(false);

    useEffect(() => {
        fetchData();
        PianoDeiContiService.getList('').then(res => {
            setConti((res.payload || []).filter(c => c.idPadre != null));
        }).catch(err => console.error('Errore nel caricamento del piano dei conti:', err));
    }, []);

    const fetchData = async (s) => {
        setLoading(true);
        try {
            const params = { search: s !== undefined ? s : search };
            if (dataDa) params.dataDa = dataDa;
            if (dataA) params.dataA = dataA;
            const res = await LibroGiornaleService.getList(params);
            setRegistrazioni(res.payload || []);
        } catch (err) {
            console.error('Errore nel caricamento del libro giornale:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        fetchData(value);
    };

    const handleFiltraPeriodo = () => {
        fetchData();
    };

    const handleStampa = async () => {
        setStampando(true);
        try {
            const params = { search };
            if (dataDa) params.dataDa = dataDa;
            if (dataA) params.dataA = dataA;
            const res = await LibroGiornaleService.print(params);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (err) {
            console.error('Errore nella stampa del libro giornale:', err);
            Swal.fire({ title: 'Errore', text: 'Errore nella generazione del PDF.', icon: 'error' });
        } finally {
            setStampando(false);
        }
    };

    const apriNuova = () => {
        setEditingId(null);
        setForm(formVuoto());
        setErroreForm('');
        setShowForm(true);
    };

    const apriModifica = (reg) => {
        setEditingId(reg.id);
        setForm({
            dataRegistrazione: reg.dataRegistrazione,
            descrizione: reg.descrizione || '',
            numeroDocumento: reg.numeroDocumento || '',
            righe: (reg.righe || []).map(r => ({
                idConto: r.idConto,
                segno: (r.importoDare > 0) ? 'dare' : 'avere',
                importo: (r.importoDare > 0) ? r.importoDare : r.importoAvere,
                descrizione: r.descrizione || ''
            }))
        });
        setErroreForm('');
        setShowForm(true);
    };

    const chiudiForm = () => {
        setShowForm(false);
        setEditingId(null);
    };

    const handleRigaChange = (idx, campo, valore) => {
        setForm(prev => {
            const righe = [...prev.righe];
            righe[idx] = { ...righe[idx], [campo]: valore };
            return { ...prev, righe };
        });
    };

    const aggiungiRiga = () => {
        setForm(prev => ({ ...prev, righe: [...prev.righe, rigaVuota()] }));
    };

    const rimuoviRiga = (idx) => {
        setForm(prev => ({ ...prev, righe: prev.righe.filter((_, i) => i !== idx) }));
    };

    const totaleDare = form.righe.reduce((tot, r) => tot + (r.segno === 'dare' ? (parseFloat(r.importo) || 0) : 0), 0);
    const totaleAvere = form.righe.reduce((tot, r) => tot + (r.segno === 'avere' ? (parseFloat(r.importo) || 0) : 0), 0);
    const bilanciata = Math.abs(totaleDare - totaleAvere) < 0.005 && totaleDare > 0;

    const handleSalva = async () => {
        setErroreForm('');
        setSalvando(true);
        try {
            const dto = {
                dataRegistrazione: form.dataRegistrazione,
                descrizione: form.descrizione,
                numeroDocumento: form.numeroDocumento,
                righe: form.righe.map(r => ({
                    idConto: parseInt(r.idConto, 10),
                    importoDare: r.segno === 'dare' ? parseFloat(r.importo) || 0 : 0,
                    importoAvere: r.segno === 'avere' ? parseFloat(r.importo) || 0 : 0,
                    descrizione: r.descrizione
                }))
            };
            const res = editingId
                ? await LibroGiornaleService.aggiornaManuale(editingId, dto)
                : await LibroGiornaleService.inserisciManuale(dto);
            if (res.errorText) {
                setErroreForm(res.errorText);
            } else {
                setShowForm(false);
                setEditingId(null);
                fetchData();
            }
        } catch (err) {
            console.error('Errore nel salvataggio della scrittura manuale:', err);
            setErroreForm('Errore nel salvataggio della scrittura.');
        } finally {
            setSalvando(false);
        }
    };

    const handleElimina = async (reg) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: `Vuoi eliminare la scrittura manuale del ${formatData(reg.dataRegistrazione)} (${reg.descrizione})?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });
        if (!result.isConfirmed) {
            return;
        }
        try {
            const res = await LibroGiornaleService.eliminaManuale(reg.id);
            if (res.errorText) {
                Swal.fire({ title: 'Errore', text: res.errorText, icon: 'error' });
            } else {
                fetchData();
            }
        } catch (err) {
            console.error('Errore nell\'eliminazione della scrittura manuale:', err);
        }
    };

    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaBook style={{ marginRight: '10px' }} />Libro Giornale</h2>
            </div>

            <div className="tab-content-wrapper" style={{ border: 'none', padding: '0' }}>
                <div className="dati-azienda-container" style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                    <p className="section-description">
                        Registrazioni contabili generate automaticamente dai documenti (Fatture, Note di Debito, Note di Credito, ciclo attivo e passivo)
                        e scritture manuali (giroconti, rettifiche). Le scritture manuali possono essere modificate o eliminate direttamente da qui.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>Cerca</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ maxWidth: '320px' }}
                                    placeholder="Cerca per numero o descrizione..."
                                    value={search}
                                    onChange={handleSearch}
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
                            <button className="btn btn-primary" onClick={handleFiltraPeriodo}>Filtra</button>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button className="btn btn-secondary" style={{ fontSize: '14px', fontWeight: 500 }} onClick={handleStampa} disabled={stampando}>
                                <FaFilePdf style={{ marginRight: '6px' }} />{stampando ? 'Generazione...' : 'Stampa PDF'}
                            </button>
                            <button className="btn btn-primary" style={{ fontSize: '14px', fontWeight: 500 }} onClick={apriNuova}>
                                <FaPlus style={{ marginRight: '6px' }} />Nuova scrittura manuale
                            </button>
                        </div>
                    </div>

                    {showForm && (
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
                            <h3 style={{ marginTop: 0 }}>{editingId ? 'Modifica scrittura manuale' : 'Nuova scrittura manuale'}</h3>

                            {erroreForm && (
                                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '10px 14px', color: '#b91c1c', marginBottom: '14px' }}>
                                    {erroreForm}
                                </div>
                            )}

                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '14px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>Data</label>
                                    <input type="date" className="form-control" value={form.dataRegistrazione}
                                        onChange={e => setForm(prev => ({ ...prev, dataRegistrazione: e.target.value }))} />
                                </div>
                                <div style={{ flex: 1, minWidth: '260px' }}>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>Descrizione</label>
                                    <input type="text" className="form-control" value={form.descrizione}
                                        onChange={e => setForm(prev => ({ ...prev, descrizione: e.target.value }))} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', color: '#475569' }}>Causale / riferimento</label>
                                    <input type="text" className="form-control" value={form.numeroDocumento}
                                        onChange={e => setForm(prev => ({ ...prev, numeroDocumento: e.target.value }))} />
                                </div>
                            </div>

                            <table className="table" style={{ marginBottom: '10px' }}>
                                <thead>
                                    <tr style={{ fontSize: '12px', color: '#666' }}>
                                        <th>Conto</th>
                                        <th style={{ width: '110px' }}>Dare/Avere</th>
                                        <th style={{ width: '140px' }}>Importo</th>
                                        <th>Descrizione riga</th>
                                        <th style={{ width: '40px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {form.righe.map((riga, idx) => (
                                        <tr key={idx}>
                                            <td style={{ minWidth: '260px', verticalAlign: 'middle' }}>
                                                <div className="inline-select-group">
                                                    <EntitySelectGroup
                                                        isAsync={false}
                                                        options={contoOptions}
                                                        value={contoOptions.find(o => o.value === parseInt(riga.idConto)) || null}
                                                        onChange={opt => handleRigaChange(idx, 'idConto', opt ? opt.value : '')}
                                                        placeholder="Seleziona..."
                                                    />
                                                </div>
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                <select className="form-control" value={riga.segno} onChange={e => handleRigaChange(idx, 'segno', e.target.value)}>
                                                    <option value="dare">Dare</option>
                                                    <option value="avere">Avere</option>
                                                </select>
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                <input type="number" step="0.01" className="form-control" value={riga.importo}
                                                    onChange={e => handleRigaChange(idx, 'importo', e.target.value)} />
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                <input type="text" className="form-control" value={riga.descrizione}
                                                    onChange={e => handleRigaChange(idx, 'descrizione', e.target.value)} />
                                            </td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                {form.righe.length > 2 && (
                                                    <button className="btn btn-sm btn-danger" onClick={() => rimuoviRiga(idx)} title="Rimuovi riga">
                                                        <FaTrash />
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <button className="btn btn-secondary" style={{ marginBottom: '16px' }} onClick={aggiungiRiga}>
                                <FaPlus style={{ marginRight: '6px' }} />Aggiungi riga
                            </button>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '14px' }}>
                                    Totale Dare: <strong>{formatCurrency(totaleDare)}</strong> &nbsp;|&nbsp;
                                    Totale Avere: <strong>{formatCurrency(totaleAvere)}</strong> &nbsp;
                                    {bilanciata
                                        ? <span style={{ color: '#15803d' }}>Bilanciata</span>
                                        : <span style={{ color: '#b91c1c' }}>Non bilanciata</span>}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button className="btn btn-light" style={{ fontSize: '14px', fontWeight: 500 }} onClick={chiudiForm}>Annulla</button>
                                    <button className="btn btn-primary" style={{ fontSize: '14px', fontWeight: 500 }} onClick={handleSalva} disabled={!bilanciata || salvando}>
                                        {salvando ? 'Salvataggio...' : 'Salva'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Caricamento...</div>
                    ) : registrazioni.length === 0 ? (
                        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            Nessuna registrazione contabile presente.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th style={{ width: '30px' }}></th>
                                        <th style={{ width: '110px' }}>Data</th>
                                        <th>Descrizione</th>
                                        <th style={{ width: '140px' }}>Documento</th>
                                        <th style={{ width: '130px' }} className="text-right">Totale Dare</th>
                                        <th style={{ width: '130px' }} className="text-right">Totale Avere</th>
                                        <th style={{ width: '80px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {registrazioni.map(reg => (
                                        <React.Fragment key={reg.id}>
                                            <tr style={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === reg.id ? null : reg.id)}>
                                                <td>{expandedId === reg.id ? <FaChevronDown /> : <FaChevronRight />}</td>
                                                <td>{formatData(reg.dataRegistrazione)}</td>
                                                <td>{reg.descrizione}</td>
                                                <td>{reg.tipoDocumento} n. {reg.numeroDocumento}</td>
                                                <td className="text-right">{formatCurrency(reg.totaleDare)}</td>
                                                <td className="text-right">{formatCurrency(reg.totaleAvere)}</td>
                                                <td onClick={e => e.stopPropagation()}>
                                                    {reg.tipoDocumento === 'MANUALE' && (
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button className="btn btn-sm btn-light" title="Modifica" onClick={() => apriModifica(reg)}>
                                                                <FaPencilAlt />
                                                            </button>
                                                            <button className="btn btn-sm btn-danger" title="Elimina" onClick={() => handleElimina(reg)}>
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                            {expandedId === reg.id && (
                                                <tr>
                                                    <td></td>
                                                    <td colSpan={6} style={{ padding: '0 0 16px 0' }}>
                                                        <table className="table table-condensed" style={{ marginBottom: 0, background: '#f8fafc' }}>
                                                            <thead>
                                                                <tr style={{ fontSize: '11px', color: '#666' }}>
                                                                    <th>Conto</th>
                                                                    <th>Descrizione</th>
                                                                    <th className="text-right">Dare</th>
                                                                    <th className="text-right">Avere</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {(reg.righe || []).map(riga => (
                                                                    <tr key={riga.id} style={{ fontSize: '13px' }}>
                                                                        <td>{riga.codiceConto} - {riga.descrizioneConto}</td>
                                                                        <td>{riga.descrizione}</td>
                                                                        <td className="text-right">{riga.importoDare > 0 ? formatCurrency(riga.importoDare) : ''}</td>
                                                                        <td className="text-right">{riga.importoAvere > 0 ? formatCurrency(riga.importoAvere) : ''}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
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
        </div>
    );
};

export default LibroGiornaleList;
