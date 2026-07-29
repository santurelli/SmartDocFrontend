import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaSync, FaFileAlt } from 'react-icons/fa';
import AsyncSelect from 'react-select/async';
import Swal from 'sweetalert2';
import RitenuteService from '../../services/RitenuteService';
import FornitoriService from '../../services/FornitoriService';
import './Prospetto770Page.css';

const CAUSALI_DESC = {
    A: 'Lavoro autonomo abituale',
    B: 'Opere dell\'ingegno / brevetti (autore)',
    C: 'Utili da associazione in partecipazione',
    D: 'Utili soci promotori',
    G: 'Cessazione attività sportiva',
    H: 'Cessazione rapporti agenzia',
    L: 'Opere dell\'ingegno (sogg. diverso autore)',
    M: 'Lavoro autonomo non abituale / obblighi',
    O: 'Lavoro autonomo non abituale (no gest. sep.)',
    Q: 'Provvigioni agente monomandatario',
    R: 'Provvigioni agente plurimandatario',
    S: 'Provvigioni commissionario',
    T: 'Provvigioni mediatore',
    U: 'Provvigioni procacciatore d\'affari',
    V: 'Provvigioni vendite a domicilio',
    Z: 'Altro titolo',
    M1: 'Obblighi di fare / non fare / permettere',
    V1: 'Attività commerciali non abituali',
};

const TIPO_RITENUTA_DESC = {
    PERSONE_FISICHE: 'Pers. fisiche',
    PERSONE_GIURIDICHE: 'Pers. giuridiche',
};

const formatMoney = (v) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(v || 0);

const currentYear = new Date().getFullYear();

const Prospetto770Page = () => {
    const navigate = useNavigate();
    const [anno, setAnno] = useState(currentYear);
    const [idFornitore, setIdFornitore] = useState(null);
    const [fornitoreOption, setFornitoreOption] = useState(null);
    const [righe, setRighe] = useState([]);
    const [loading, setLoading] = useState(false);
    const [cercato, setCercato] = useState(false);

    const loadFornitori = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 3) return callback([]);
        FornitoriService.getSuggestion(inputValue)
            .then(res => {
                const list = Array.isArray(res.data) ? res.data : (res.data?.payload || []);
                callback(list.map(f => ({ value: f.id, label: f.denominazione || f.denominazioneData })));
            })
            .catch(() => callback([]));
    };

    const cerca = useCallback(async () => {
        setLoading(true);
        try {
            const res = await RitenuteService.get770(anno, idFornitore);
            setRighe(res.data || []);
            setCercato(true);
        } catch {
            Swal.fire('Errore', 'Impossibile caricare il prospetto 770', 'error');
        } finally {
            setLoading(false);
        }
    }, [anno, idFornitore]);

    const totCompensi = righe.reduce((s, r) => s + (r.totaleCompensi || 0), 0);
    const totRitenute = righe.reduce((s, r) => s + (r.totaleRitenute || 0), 0);
    const totFatture = righe.reduce((s, r) => s + (r.numeroFatture || 0), 0);

    const anni = Array.from({ length: 6 }, (_, i) => currentYear - i);

    return (
        <div className="p770-container">
            {/* Header istituzionale */}
            <div className="p770-header">
                <div className="p770-header-left">
                    <div className="p770-eyebrow">Dichiarazioni fiscali</div>
                    <h1 className="p770-title">Prospetto 770</h1>
                    <p className="p770-subtitle">Riepilogo ritenute d'acconto operate su compensi a fornitori</p>
                </div>
                <div className="p770-anno-box">
                    <div className="p770-anno-label">ANNO DI IMPOSTA</div>
                    <select
                        className="p770-anno-select"
                        value={anno}
                        onChange={e => setAnno(parseInt(e.target.value))}
                    >
                        {anni.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            {/* Filtri */}
            <div className="filter-box-vibrant" style={{ marginBottom: '20px' }}>
                <div className="filter-header-vibrant"><span><FaSearch /> Filtri</span></div>
                <div className="filter-body-vibrant">
                    <div className="filter-field" style={{ minWidth: '320px' }}>
                        <label>Fornitore (lascia vuoto per tutti):</label>
                        <AsyncSelect
                            isClearable
                            loadOptions={loadFornitori}
                            value={fornitoreOption}
                            onChange={opt => { setFornitoreOption(opt); setIdFornitore(opt?.value || null); }}
                            placeholder="Tutti i fornitori..."
                            noOptionsMessage={({ inputValue }) =>
                                !inputValue || inputValue.length < 3 ? 'Digita almeno 3 caratteri' : 'Nessun risultato'}
                            loadingMessage={() => 'Caricamento...'}
                            styles={{
                                control: (b) => ({ ...b, minHeight: '38px', borderRadius: '0', borderColor: '#ddd' }),
                                menuPortal: (b) => ({ ...b, zIndex: 9999 })
                            }}
                            menuPortalTarget={document.body}
                        />
                    </div>
                    <button className="btn-search-vibrant" onClick={cerca} disabled={loading}>
                        <FaSearch /> {loading ? 'Calcolo...' : 'Calcola'}
                    </button>
                    <button className="btn-paginate" style={{ height: '38px' }} onClick={() => {
                        setFornitoreOption(null); setIdFornitore(null); setRighe([]); setCercato(false);
                    }}>
                        <FaSync />
                    </button>
                </div>
            </div>

            {/* Strip totali aggregati */}
            {cercato && (
                <div className="p770-totals-strip">
                    <div className="p770-total-item">
                        <span className="p770-total-label">Totale compensi erogati</span>
                        <span className="p770-total-value">{formatMoney(totCompensi)}</span>
                    </div>
                    <div className="p770-total-sep" />
                    <div className="p770-total-item p770-total-accent">
                        <span className="p770-total-label">Totale ritenute operate</span>
                        <span className="p770-total-value">{formatMoney(totRitenute)}</span>
                    </div>
                    <div className="p770-total-sep" />
                    <div className="p770-total-item">
                        <span className="p770-total-label">Documenti considerati</span>
                        <span className="p770-total-value p770-total-count">{totFatture}</span>
                    </div>
                </div>
            )}

            {/* Tabella */}
            <div className="main-box">
                <div className="main-box-body">
                    {!cercato ? (
                        <div className="p770-empty-state">
                            <FaFileAlt className="p770-empty-icon" />
                            <p>Seleziona l'anno di imposta e premi <strong>Calcola</strong> per generare il prospetto.</p>
                        </div>
                    ) : loading ? (
                        <div className="p770-empty-state"><p>Calcolo in corso...</p></div>
                    ) : righe.length === 0 ? (
                        <div className="p770-empty-state">
                            <FaFileAlt className="p770-empty-icon" />
                            <p>Nessuna ritenuta d'acconto registrata per l'anno {anno}.</p>
                            <p style={{ fontSize: '12px', color: '#aaa', marginTop: '6px' }}>
                                Verifica che le fatture fornitore abbiano il flag "Soggetto a ritenuta d'acconto" attivo.
                            </p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table p770-table">
                                <thead>
                                    <tr>
                                        <th>Fornitore / Codice fiscale</th>
                                        <th className="p770-col-causale">Causale</th>
                                        <th>Tipo ritenuta</th>
                                        <th className="text-right">Compensi erogati</th>
                                        <th className="text-right">Ritenute operate</th>
                                        <th className="text-right">Aliquota eff.</th>
                                        <th className="text-right p770-col-ndoc">Doc.</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {righe.map((r, i) => {
                                        const aliquota = r.totaleCompensi
                                            ? ((r.totaleRitenute / r.totaleCompensi) * 100).toFixed(1)
                                            : '—';
                                        return (
                                            <tr key={i}>
                                                <td>
                                                    <div className="p770-fornitore-name">{r.denominazioneFornitore}</div>
                                                    <div className="p770-fornitore-cf">
                                                        {r.codiceFiscaleFornitore && <span>CF {r.codiceFiscaleFornitore}</span>}
                                                        {r.codiceFiscaleFornitore && r.partitaIvaFornitore && <span className="p770-cf-sep">·</span>}
                                                        {r.partitaIvaFornitore && <span>P.IVA {r.partitaIvaFornitore}</span>}
                                                    </div>
                                                </td>
                                                <td className="p770-col-causale">
                                                    {r.causalePagamento ? (
                                                        <div className="p770-causale-cell">
                                                            <span className="p770-causale-code">{r.causalePagamento}</span>
                                                            <span className="p770-causale-desc">
                                                                {CAUSALI_DESC[r.causalePagamento] || r.causalePagamento}
                                                            </span>
                                                        </div>
                                                    ) : <span className="p770-missing">—</span>}
                                                </td>
                                                <td>
                                                    {r.tipoRitenuta ? (
                                                        <span className="p770-tipo-badge">
                                                            {TIPO_RITENUTA_DESC[r.tipoRitenuta] || r.tipoRitenuta}
                                                        </span>
                                                    ) : <span className="p770-missing">—</span>}
                                                </td>
                                                <td className="text-right p770-money">{formatMoney(r.totaleCompensi)}</td>
                                                <td className="text-right p770-money p770-ritenuta">{formatMoney(r.totaleRitenute)}</td>
                                                <td className="text-right p770-aliquota">{aliquota !== '—' ? `${aliquota}%` : '—'}</td>
                                                <td className="text-right p770-col-ndoc">{r.numeroFatture}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot>
                                    <tr className="p770-footer-row">
                                        <td colSpan={3}><strong>Totale anno {anno}</strong></td>
                                        <td className="text-right p770-money"><strong>{formatMoney(totCompensi)}</strong></td>
                                        <td className="text-right p770-money p770-ritenuta"><strong>{formatMoney(totRitenute)}</strong></td>
                                        <td className="text-right p770-aliquota">
                                            {totCompensi > 0 ? <strong>{((totRitenute / totCompensi) * 100).toFixed(1)}%</strong> : '—'}
                                        </td>
                                        <td className="text-right p770-col-ndoc"><strong>{totFatture}</strong></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Prospetto770Page;
