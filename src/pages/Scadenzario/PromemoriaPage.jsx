import React, { useState, useEffect, useCallback } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEnvelope, FaInfoCircle, FaSave, FaTimes, FaPlay } from 'react-icons/fa';
import Swal from 'sweetalert2';
import ScadenzarioPromemoriaService from '../../services/ScadenzarioPromemoriaService';
import './PromemoriaPage.css';

const PLACEHOLDER_INCASSO = [
    { token: '{{cliente}}', desc: 'Ragione sociale del cliente' },
    { token: '{{numeroFattura}}', desc: 'Numero (e particella) della fattura' },
    { token: '{{dataFattura}}', desc: 'Data della fattura' },
    { token: '{{dataScadenza}}', desc: 'Data della scadenza (della rata, se la fattura è a rate)' },
    { token: '{{importo}}', desc: 'Importo della singola scadenza/rata' },
    { token: '{{totaleFattura}}', desc: 'Importo totale dell\'intera fattura' },
    { token: '{{descrizioneImporto}}', desc: 'Si adatta da sola: "dell\'importo di X" se è l\'unica rata, "di una rata di X (sul totale fattura di Y)" se è una tra più rate' },
    { token: '{{giorniRitardo}}', desc: 'Giorni di ritardo (0 se non scaduta)' },
    { token: '{{ragioneSocialeAzienda}}', desc: 'Ragione sociale della tua azienda' },
];

const PLACEHOLDER_PAGAMENTO = [
    { token: '{{fornitore}}', desc: 'Ragione sociale del fornitore' },
    { token: '{{numeroFattura}}', desc: 'Numero (e particella) della fattura' },
    { token: '{{dataFattura}}', desc: 'Data della fattura' },
    { token: '{{dataScadenza}}', desc: 'Data della scadenza (della rata, se la fattura è a rate)' },
    { token: '{{importo}}', desc: 'Importo della singola scadenza/rata' },
    { token: '{{totaleFattura}}', desc: 'Importo totale dell\'intera fattura' },
    { token: '{{descrizioneImporto}}', desc: 'Si adatta da sola: "dell\'importo di X" se è l\'unica rata, "di una rata di X (sul totale fattura di Y)" se è una tra più rate' },
    { token: '{{giorniRitardo}}', desc: 'Giorni di ritardo (0 se non scaduta)' },
];

const SAMPLE_INCASSO = {
    cliente: 'Rossi S.r.l.', fornitore: 'Rossi S.r.l.', numeroFattura: '128/A', dataFattura: '01/07/2026',
    dataScadenza: '31/07/2026', importo: '550,00 Euro', totaleFattura: '1.100,00 Euro',
    descrizioneImporto: 'di una rata di 550,00 Euro (sul totale fattura di 1.100,00 Euro)',
    giorniRitardo: '7', ragioneSocialeAzienda: 'La Tua Azienda S.r.l.'
};

const emptyRegola = { tipo: 'INCASSO', giorniOffset: -3, oggetto: '', corpo: '', attivo: 1, ordine: 0 };

const TESTI_SUGGERITI = {
    INCASSO: {
        prima: {
            oggetto: "Promemoria: fattura {{numeroFattura}} in scadenza il {{dataScadenza}}",
            corpo: "Gentile {{cliente}},\n\nle ricordiamo che il {{dataScadenza}} scade il pagamento {{descrizioneImporto}} relativo alla fattura n. {{numeroFattura}} del {{dataFattura}}.\n\nLa ringraziamo per la consueta collaborazione.\n\nCordiali saluti,\n{{ragioneSocialeAzienda}}"
        },
        dopo: {
            oggetto: "Sollecito di pagamento — fattura {{numeroFattura}} scaduta",
            corpo: "Gentile {{cliente}},\n\nle ricordiamo che il pagamento {{descrizioneImporto}}, relativo alla fattura n. {{numeroFattura}} del {{dataFattura}}, risulta scaduto dal {{dataScadenza}} ({{giorniRitardo}} giorni di ritardo) e non ancora saldato.\n\nLa invitiamo a provvedere quanto prima, o a contattarci per eventuali chiarimenti.\n\nCordiali saluti,\n{{ragioneSocialeAzienda}}"
        }
    },
    PAGAMENTO: {
        prima: {
            oggetto: "Promemoria: fattura fornitore {{numeroFattura}} in scadenza il {{dataScadenza}}",
            corpo: "Promemoria pagamento in arrivo.\n\nFornitore: {{fornitore}}\nFattura: {{numeroFattura}} del {{dataFattura}}\nDovuto {{descrizioneImporto}}\nScadenza: {{dataScadenza}}\n\nVerificare che il pagamento sia programmato."
        },
        dopo: {
            oggetto: "Attenzione: fattura fornitore {{numeroFattura}} scaduta e non pagata",
            corpo: "Attenzione, pagamento in ritardo.\n\nFornitore: {{fornitore}}\nFattura: {{numeroFattura}} del {{dataFattura}}\nDovuto {{descrizioneImporto}}\nScadenza: {{dataScadenza}} ({{giorniRitardo}} giorni di ritardo)\n\nVerificare urgentemente lo stato del pagamento."
        }
    }
};

const applyPreview = (text) => {
    if (!text) return '';
    let out = text;
    Object.entries(SAMPLE_INCASSO).forEach(([k, v]) => {
        out = out.split(`{{${k}}}`).join(v);
    });
    return out;
};

const PromemoriaPage = () => {
    const [tipo, setTipo] = useState('INCASSO');
    const [regole, setRegole] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null); // null = chiuso, {} = nuova, {...} = modifica
    const [eseguendo, setEseguendo] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await ScadenzarioPromemoriaService.getList(tipo);
            setRegole(res.data || []);
        } catch {
            Swal.fire('Errore', 'Impossibile caricare le regole di promemoria', 'error');
        } finally {
            setLoading(false);
        }
    }, [tipo]);

    useEffect(() => { load(); }, [load]);

    const handleNuova = () => setEditing({ ...emptyRegola, tipo });

    const handleUsaEsempio = async (fase) => {
        const hasContent = (editing.oggetto || '').trim() || (editing.corpo || '').trim();
        if (hasContent) {
            const result = await Swal.fire({
                title: 'Sostituire il testo attuale?',
                text: 'Oggetto e corpo verranno sovrascritti con il testo di esempio.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sì, sostituisci',
                cancelButtonText: 'Annulla'
            });
            if (!result.isConfirmed) return;
        }
        const template = TESTI_SUGGERITI[editing.tipo]?.[fase];
        if (!template) return;
        setEditing(prev => ({ ...prev, oggetto: template.oggetto, corpo: template.corpo }));
    };

    const handleEseguiOra = async () => {
        const result = await Swal.fire({
            title: 'Eseguire ora i promemoria?',
            text: 'Verranno inviate subito tutte le comunicazioni dovute oggi, per tutte le regole attive (incasso e pagamento). Utile solo per test.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sì, esegui ora',
            cancelButtonText: 'Annulla'
        });
        if (!result.isConfirmed) return;
        setEseguendo(true);
        try {
            await ScadenzarioPromemoriaService.eseguiOra();
            Swal.fire({
                title: 'Eseguito',
                text: 'Il batch è stato eseguito. Controlla le comunicazioni inviate sul cliente o sul documento interessato.',
                icon: 'success',
                timer: 2500,
                showConfirmButton: false
            });
        } catch {
            Swal.fire('Errore', 'Esecuzione non riuscita', 'error');
        } finally {
            setEseguendo(false);
        }
    };

    const handleEdit = (regola) => setEditing({ ...regola });

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Eliminare la regola?',
            text: 'I promemoria futuri basati su questa regola non verranno più inviati.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });
        if (!result.isConfirmed) return;
        try {
            await ScadenzarioPromemoriaService.remove(id);
            load();
        } catch {
            Swal.fire('Errore', 'Impossibile eliminare la regola', 'error');
        }
    };

    const handleSave = async () => {
        if (!editing.oggetto?.trim() || !editing.corpo?.trim()) {
            Swal.fire('Attenzione', 'Oggetto e corpo del messaggio sono obbligatori', 'warning');
            return;
        }
        try {
            if (editing.id) {
                await ScadenzarioPromemoriaService.update(editing.id, editing);
            } else {
                await ScadenzarioPromemoriaService.create(editing);
            }
            setEditing(null);
            load();
        } catch {
            Swal.fire('Errore', 'Impossibile salvare la regola', 'error');
        }
    };

    const placeholders = editing?.tipo === 'PAGAMENTO' ? PLACEHOLDER_PAGAMENTO : PLACEHOLDER_INCASSO;

    return (
        <div className="promemoria-container">
            <div className="promemoria-header">
                <div>
                    <div className="promemoria-eyebrow">Scadenzario</div>
                    <h1 className="promemoria-title">Promemoria Automatici</h1>
                    <p className="promemoria-subtitle">Solleciti di incasso inviati ai clienti e avvisi interni per non dimenticare i pagamenti ai fornitori</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-esegui-ora" onClick={handleEseguiOra} disabled={eseguendo} title="Esegue subito il batch dei promemoria, utile per verificare che tutto funzioni prima di aspettare la schedulazione giornaliera">
                        <FaPlay /> {eseguendo ? 'Esecuzione...' : 'Esegui ora (test)'}
                    </button>
                    <button className="btn-nuova-regola" onClick={handleNuova}>
                        <FaPlus /> Nuova regola
                    </button>
                </div>
            </div>

            <div className="promemoria-tabs">
                <button className={`promemoria-tab ${tipo === 'INCASSO' ? 'active' : ''}`} onClick={() => setTipo('INCASSO')}>
                    Solleciti di incasso <span className="promemoria-tab-hint">inviati ai clienti</span>
                </button>
                <button className={`promemoria-tab ${tipo === 'PAGAMENTO' ? 'active' : ''}`} onClick={() => setTipo('PAGAMENTO')}>
                    Promemoria di pagamento <span className="promemoria-tab-hint">avviso interno, non va ai fornitori</span>
                </button>
            </div>

            <div className="main-box">
                <div className="main-box-body">
                    {loading ? (
                        <div className="promemoria-empty"><p>Caricamento...</p></div>
                    ) : regole.length === 0 ? (
                        <div className="promemoria-empty">
                            <FaEnvelope className="promemoria-empty-icon" />
                            <p>Nessuna regola configurata per {tipo === 'INCASSO' ? 'i solleciti di incasso' : 'i promemoria di pagamento'}.</p>
                            <button className="btn-nuova-regola" onClick={handleNuova}><FaPlus /> Crea la prima regola</button>
                        </div>
                    ) : (
                        <div className="promemoria-lista">
                            {regole.map(r => (
                                <div key={r.id} className={`promemoria-card ${!r.attivo ? 'disattiva' : ''}`}>
                                    <div className="promemoria-card-offset">
                                        <span className="promemoria-offset-numero">{r.giorniOffset > 0 ? `+${r.giorniOffset}` : r.giorniOffset}</span>
                                        <span className="promemoria-offset-label">{r.giorniOffset < 0 ? 'giorni prima' : r.giorniOffset === 0 ? 'il giorno stesso' : 'giorni di ritardo'}</span>
                                    </div>
                                    <div className="promemoria-card-body">
                                        <div className="promemoria-card-oggetto">{r.oggetto}</div>
                                        <div className="promemoria-card-corpo">{r.corpo}</div>
                                    </div>
                                    <div className="promemoria-card-actions">
                                        {!r.attivo && <span className="promemoria-badge-disattiva">Disattivata</span>}
                                        <button className="btn-icon" onClick={() => handleEdit(r)} title="Modifica"><FaEdit /></button>
                                        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(r.id)} title="Elimina"><FaTrash /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {editing && (
                <div className="promemoria-modal-overlay" onClick={() => setEditing(null)}>
                    <div className="promemoria-modal" onClick={e => e.stopPropagation()}>
                        <div className="promemoria-modal-header">
                            <h3>{editing.id ? 'Modifica regola' : 'Nuova regola'}</h3>
                            <button className="btn-icon" onClick={() => setEditing(null)}><FaTimes /></button>
                        </div>
                        <div className="promemoria-modal-body">
                            <div className="promemoria-form-row">
                                <div className="promemoria-form-field">
                                    <label>Tipo</label>
                                    <select value={editing.tipo} onChange={e => setEditing({ ...editing, tipo: e.target.value })}>
                                        <option value="INCASSO">Sollecito di incasso (al cliente)</option>
                                        <option value="PAGAMENTO">Promemoria di pagamento (interno)</option>
                                    </select>
                                </div>
                                <div className="promemoria-form-field" style={{ maxWidth: '220px' }}>
                                    <label>Quando inviare</label>
                                    <input
                                        type="number"
                                        value={editing.giorniOffset}
                                        onChange={e => setEditing({ ...editing, giorniOffset: parseInt(e.target.value) || 0 })}
                                    />
                                    <span className="promemoria-form-hint">Negativo = giorni prima della scadenza. Positivo = giorni di ritardo.</span>
                                </div>
                                <div className="promemoria-form-field" style={{ maxWidth: '140px' }}>
                                    <label>Attiva</label>
                                    <label className="promemoria-switch">
                                        <input
                                            type="checkbox"
                                            checked={!!editing.attivo}
                                            onChange={e => setEditing({ ...editing, attivo: e.target.checked ? 1 : 0 })}
                                        />
                                        <span className="promemoria-switch-slider"></span>
                                    </label>
                                </div>
                            </div>

                            <div className="promemoria-esempi-row">
                                <span className="promemoria-esempi-label">Parti da un testo suggerito:</span>
                                <button type="button" className="btn-esempio" onClick={() => handleUsaEsempio('prima')}>Prima della scadenza</button>
                                <button type="button" className="btn-esempio" onClick={() => handleUsaEsempio('dopo')}>Dopo la scadenza (scaduta)</button>
                            </div>

                            <div className="promemoria-form-field">
                                <label>Oggetto email</label>
                                <input
                                    type="text"
                                    value={editing.oggetto}
                                    onChange={e => setEditing({ ...editing, oggetto: e.target.value })}
                                    placeholder="Scrivi l'oggetto, oppure usa un testo suggerito qui sopra"
                                />
                            </div>

                            <div className="promemoria-form-field">
                                <label>Corpo del messaggio</label>
                                <textarea
                                    rows={8}
                                    value={editing.corpo}
                                    onChange={e => setEditing({ ...editing, corpo: e.target.value })}
                                    placeholder="Scrivi il testo del messaggio, oppure usa un testo suggerito qui sopra"
                                />
                            </div>

                            <div className="promemoria-placeholder-legend">
                                <div className="promemoria-legend-title"><FaInfoCircle /> Placeholder disponibili</div>
                                <div className="promemoria-legend-chips">
                                    {placeholders.map(p => (
                                        <span key={p.token} className="promemoria-chip" title={p.desc}>{p.token}</span>
                                    ))}
                                </div>
                            </div>

                            {editing.corpo && (
                                <div className="promemoria-preview">
                                    <div className="promemoria-legend-title">Anteprima (con dati d'esempio)</div>
                                    <div className="promemoria-preview-oggetto">{applyPreview(editing.oggetto)}</div>
                                    <div className="promemoria-preview-corpo">{applyPreview(editing.corpo)}</div>
                                </div>
                            )}
                        </div>
                        <div className="promemoria-modal-footer">
                            <button className="btn-annulla" onClick={() => setEditing(null)}>Annulla</button>
                            <button className="btn-salva" onClick={handleSave}><FaSave /> Salva regola</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PromemoriaPage;
