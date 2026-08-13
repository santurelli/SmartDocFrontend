import React, { useState, useEffect, useMemo } from 'react';
import PianoDeiContiService from '../../services/PianoDeiContiService';
import { FaBook, FaPlus, FaEdit, FaTrash, FaDownload, FaLock } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './ConfigurazionePage.css';

const TIPO_LABELS = {
    ATTIVITA: 'Attività',
    PASSIVITA: 'Passività',
    PATRIMONIO_NETTO: 'Patrimonio Netto',
    COSTO: 'Costo',
    RICAVO: 'Ricavo',
    IVA: 'IVA'
};

const TIPO_COLORS = {
    ATTIVITA: { bg: '#eff6ff', color: '#2563eb' },
    PASSIVITA: { bg: '#fef2f2', color: '#dc2626' },
    PATRIMONIO_NETTO: { bg: '#f5f3ff', color: '#7c3aed' },
    COSTO: { bg: '#fff7ed', color: '#c2410c' },
    RICAVO: { bg: '#ecfdf5', color: '#059669' },
    IVA: { bg: '#f8fafc', color: '#64748b' }
};

const SETTORE_LABELS = {
    COMMERCIO: 'Commercio',
    SERVIZI: 'Servizi',
    PRODUZIONE: 'Produzione',
    EDILIZIA: 'Edilizia',
    GENERICO: 'Generico'
};

const emptyForm = { id: null, codice: '', descrizione: '', idPadre: '', tipo: 'COSTO', note: '' };

const PianoDeiContiPage = () => {
    const [conti, setConti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [settore, setSettore] = useState(null);

    useEffect(() => {
        fetchConti();
        PianoDeiContiService.getSettoreCorrente().then(res => setSettore(res.payload || null)).catch(() => {});
    }, []);

    const fetchConti = async (s) => {
        setLoading(true);
        try {
            const res = await PianoDeiContiService.getList(s !== undefined ? s : search);
            setConti(res.payload || []);
        } catch (err) {
            console.error('Errore nel caricamento del piano dei conti:', err);
            Swal.fire('Errore', 'Impossibile caricare il piano dei conti.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Costruisce l'elenco ordinato per visualizzazione ad albero (indentazione in base al codice)
    const alberoConti = useMemo(() => {
        return [...conti].sort((a, b) => (a.codice || '').localeCompare(b.codice || '', undefined, { numeric: true }));
    }, [conti]);

    const handleSearch = (e) => {
        const value = e.target.value;
        setSearch(value);
        fetchConti(value);
    };

    const openNew = (idPadre) => {
        setForm({ ...emptyForm, idPadre: idPadre || '' });
        setShowForm(true);
    };

    const openEdit = (conto) => {
        setForm({
            id: conto.id,
            codice: conto.codice,
            descrizione: conto.descrizione,
            idPadre: conto.idPadre || '',
            tipo: conto.tipo,
            note: conto.note || ''
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!form.codice || !form.descrizione) {
            Swal.fire('Attenzione', 'Codice e Descrizione sono obbligatori.', 'warning');
            return;
        }
        const dto = {
            codice: form.codice,
            descrizione: form.descrizione,
            idPadre: form.idPadre || null,
            tipo: form.tipo,
            note: form.note
        };
        try {
            const res = form.id
                ? await PianoDeiContiService.update(form.id, dto)
                : await PianoDeiContiService.create(dto);
            if (res.errorText) {
                Swal.fire('Errore', res.errorText, 'error');
                return;
            }
            setShowForm(false);
            fetchConti();
        } catch (err) {
            Swal.fire('Errore', err.response?.data?.errorText || 'Errore nel salvataggio del conto.', 'error');
        }
    };

    const handleDelete = async (conto) => {
        const result = await Swal.fire({
            title: 'Eliminare il conto?',
            text: `"${conto.codice} - ${conto.descrizione}" verrà eliminato.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });
        if (result.isConfirmed) {
            try {
                await PianoDeiContiService.delete(conto.id);
                fetchConti();
            } catch (err) {
                Swal.fire('Errore', 'Impossibile eliminare il conto (potrebbe avere sottoconti collegati).', 'error');
            }
        }
    };

    const handleImportaStandard = async () => {
        const settoreLabel = settore ? SETTORE_LABELS[settore] || settore : null;
        const result = await Swal.fire({
            title: 'Importare il piano dei conti standard?',
            text: settoreLabel
                ? `Verrà creato un set di conti di partenza per il settore "${settoreLabel}" (mastri, conti e sottoconti), personalizzabile in seguito.`
                : 'Verrà creato un set di conti di partenza generico (mastri, conti e sottoconti), personalizzabile in seguito. Puoi impostare il Settore Merceologico in Dati Azienda per un template più mirato.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sì, importa',
            cancelButtonText: 'Annulla'
        });
        if (!result.isConfirmed) return;
        try {
            const res = await PianoDeiContiService.importaStandard();
            if (res.errorText) {
                Swal.fire('Errore', res.errorText, 'error');
                return;
            }
            Swal.fire('Fatto!', `Importati ${res.payload.count} conti.`, 'success');
            fetchConti();
        } catch (err) {
            Swal.fire('Errore', err.response?.data?.errorText || 'Errore durante l\'importazione.', 'error');
        }
    };

    const contiSelezionabiliComePadre = conti.filter(c => c.id !== form.id);

    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaBook style={{ marginRight: '10px' }} />Piano dei Conti</h2>
            </div>

            <div className="tab-content-wrapper" style={{ border: 'none', padding: '0' }}>
                <div className="dati-azienda-container" style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                    <p className="section-description">
                        Gestisci la struttura dei conti (mastri, conti e sottoconti) usata per la contabilità in partita doppia e per l'export DATEV.
                    </p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            className="form-control"
                            style={{ maxWidth: '320px' }}
                            placeholder="Cerca per codice o descrizione..."
                            value={search}
                            onChange={handleSearch}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {conti.length === 0 && !loading && (
                                <button type="button" className="btn btn-info" onClick={handleImportaStandard}>
                                    <FaDownload /> Importa piano standard
                                </button>
                            )}
                            <button type="button" className="btn btn-success" onClick={() => openNew(null)}>
                                <FaPlus /> Nuovo Conto
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Caricamento...</div>
                    ) : conti.length === 0 ? (
                        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            Nessun conto presente. Importa il piano dei conti standard per iniziare, oppure crea i tuoi conti manualmente.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th style={{ width: '140px' }}>Codice</th>
                                        <th>Descrizione</th>
                                        <th style={{ width: '160px' }}>Tipo</th>
                                        <th style={{ width: '100px' }} className="text-center">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {alberoConti.map(conto => {
                                        const livello = (conto.codice || '').split('.').length - 1;
                                        const colors = TIPO_COLORS[conto.tipo] || {};
                                        return (
                                            <tr key={conto.id}>
                                                <td style={{ paddingLeft: `${20 + livello * 22}px`, fontFamily: 'monospace' }}>
                                                    {conto.codice}
                                                </td>
                                                <td>
                                                    {conto.descrizione}
                                                    {conto.bloccato === 1 && (
                                                        <FaLock size={11} style={{ marginLeft: '8px', color: '#94a3b8' }} title="Conto standard" />
                                                    )}
                                                </td>
                                                <td>
                                                    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '20px', background: colors.bg, color: colors.color }}>
                                                        {TIPO_LABELS[conto.tipo] || conto.tipo}
                                                    </span>
                                                </td>
                                                <td className="text-center">
                                                    <button type="button" className="btn btn-xs btn-default" onClick={() => openEdit(conto)} title="Modifica" style={{ marginRight: '6px' }}>
                                                        <FaEdit />
                                                    </button>
                                                    {conto.bloccato !== 1 && (
                                                        <button type="button" className="btn btn-xs btn-danger" onClick={() => handleDelete(conto)} title="Elimina">
                                                            <FaTrash />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {showForm && (
                <div className="modal-overlay" style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050
                }}>
                    <div style={{ background: '#fff', borderRadius: '10px', padding: '24px', width: '460px', maxWidth: '90vw' }}>
                        <h4 style={{ marginTop: 0 }}>{form.id ? 'Modifica Conto' : 'Nuovo Conto'}</h4>

                        <div className="form-group">
                            <label>Codice *</label>
                            <input type="text" className="form-control" value={form.codice}
                                onChange={(e) => setForm({ ...form, codice: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <label>Descrizione *</label>
                            <input type="text" className="form-control" value={form.descrizione}
                                onChange={(e) => setForm({ ...form, descrizione: e.target.value })} />
                        </div>

                        <div className="form-group">
                            <label>Tipo</label>
                            <select className="form-control" value={form.tipo}
                                onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                                {Object.entries(TIPO_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Conto Padre</label>
                            <select className="form-control" value={form.idPadre || ''}
                                onChange={(e) => setForm({ ...form, idPadre: e.target.value })}>
                                <option value="">- Nessuno (conto di primo livello) -</option>
                                {contiSelezionabiliComePadre.map(c => (
                                    <option key={c.id} value={c.id}>{c.codice} - {c.descrizione}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Note</label>
                            <textarea className="form-control" rows={2} value={form.note}
                                onChange={(e) => setForm({ ...form, note: e.target.value })} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                            <button type="button" className="btn btn-default" onClick={() => setShowForm(false)}>Annulla</button>
                            <button type="button" className="btn btn-success" onClick={handleSave}>Salva</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PianoDeiContiPage;
