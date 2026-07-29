import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ClientiService from '../services/ClientiService';
import CittaService from '../services/CittaService';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { components } from 'react-select';
import ConfigurazioneService from '../services/ConfigurazioneService';
import AvvisiService from '../services/AvvisiService';
import NoteDocumentiService from '../services/NoteDocumentiService';
import TipiPortoService from '../services/TipiPortoService';
import VettoriService from '../services/VettoriService';
import RisorseService from '../services/RisorseService';
import { parseIban } from '../utils/ibanUtils';
import { FaWrench } from 'react-icons/fa';
import ListiniService from '../services/ListiniService';
import ComunicazioniTimeline from './ComunicazioniTimeline';
import './EntityForms.css';

// Sub-modals
import AvvisiManagementModal from './modals/AvvisiManagementModal';
import NoteDocumentiManagementModal from './modals/NoteDocumentiManagementModal';
import TipiPortoManagementModal from './modals/TipiPortoManagementModal';
import VettoriManagementModal from './modals/VettoriManagementModal';
import RisorseManagementModal from './modals/RisorseManagementModal';
import ListiniManagementModal from './modals/ListiniManagementModal';
import NazioneSelect from './common/NazioneSelect';

const ClienteForm = ({ data, onChange, isNew, onConfigLoaded }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [showCommercialData, setShowCommercialData] = useState(true);
    const [activeAddressIndex, setActiveAddressIndex] = useState(0);
    const [activeContactIndex, setActiveContactIndex] = useState(0);

    // Lists for combos
    const [avvisiList, setAvvisiList] = useState([]);
    const [noteDocumentiList, setNoteDocumentiList] = useState([]);
    const [tipiPortoList, setTipiPortoList] = useState([]);
    const [vettoriList, setVettoriList] = useState([]);
    const [bancheList, setBancheList] = useState([]);
    const [listiniList, setListiniList] = useState([]);

    // Sub-modal states
    const [showAvvisiModal, setShowAvvisiModal] = useState(false);
    const [showNoteModal, setShowNoteModal] = useState(false);
    const [showPortoModal, setShowPortoModal] = useState(false);
    const [showVettoriModal, setShowVettoriModal] = useState(false);
    const [showRisorseModal, setShowRisorseModal] = useState(false);
    const [showListiniModal, setShowListiniModal] = useState(false);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [avvisi, notes, porto, vect, banks, config, listini] = await Promise.all([
                    AvvisiService.getAll(),
                    NoteDocumentiService.getAll(),
                    TipiPortoService.getAllForCombo(),
                    VettoriService.getAllForCombo(),
                    RisorseService.getAllForCombo('BA'),
                    ConfigurazioneService.getByDomain('CLIENTI'),
                    ListiniService.getAll()
                ]);

                if (avvisi.data) setAvvisiList(avvisi.data.filter(a => a.descrizione && a.descrizione.trim() !== ''));
                if (notes.data) setNoteDocumentiList(notes.data.filter(n => n.descrizione && n.descrizione.trim() !== ''));
                if (porto.data) setTipiPortoList(porto.data);
                if (vect.data) setVettoriList(vect.data);
                if (banks.data) setBancheList(banks.data);
                if (listini) setListiniList(Array.isArray(listini) ? listini : (listini.payload || []));

                if (config.data) {
                    const val = config.data['ABILITA_DATI_COMMERCIALI'] || config.data['ABILITA_DATICOMMERCIALI'];
                    const enabled = val !== '0';
                    setShowCommercialData(enabled);
                    if (onConfigLoaded) onConfigLoaded(enabled);
                }
            } catch (error) {
                console.error("Error loading common data:", error);
            }
        };
        loadInitialData();
    }, [onConfigLoaded]);

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        onChange({ ...data, [name]: value });
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        const updatedIndirizzi = [...data.elencoIndirizzi];
        updatedIndirizzi[activeAddressIndex] = { ...updatedIndirizzi[activeAddressIndex], [name]: value };
        onChange({ ...data, elencoIndirizzi: updatedIndirizzi });
    };

    const handleNazioneChange = (value) => {
        const updatedIndirizzi = [...data.elencoIndirizzi];
        updatedIndirizzi[activeAddressIndex] = { ...updatedIndirizzi[activeAddressIndex], nazione: value };
        onChange({ ...data, elencoIndirizzi: updatedIndirizzi });
    };

    const handleCityChange = (selectedOption) => {
        const updatedIndirizzi = [...data.elencoIndirizzi];
        let newValues = {};
        if (selectedOption) {
            if (selectedOption.__isNew__ || !selectedOption.nome) {
                newValues = { citta: selectedOption.label || selectedOption.value || selectedOption, cap: '', provincia: '', nazione: '' };
            } else {
                newValues = { citta: selectedOption.nome, cap: selectedOption.cap, provincia: selectedOption.provincia, nazione: 'Italia' };
            }
        } else {
            newValues = { citta: '', cap: '', provincia: '', nazione: '' };
        }
        updatedIndirizzi[activeAddressIndex] = { ...updatedIndirizzi[activeAddressIndex], ...newValues };
        onChange({ ...data, elencoIndirizzi: updatedIndirizzi });
    };

    const handleContactChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? (checked ? 1 : 0) : value;
        const updatedContatti = [...data.elencoContatti];
        updatedContatti[activeContactIndex] = { ...updatedContatti[activeContactIndex], [name]: val };
        if (name === 'referente' && activeContactIndex === 0) {
            onChange({ ...data, referente: value, elencoContatti: updatedContatti });
        } else {
            onChange({ ...data, elencoContatti: updatedContatti });
        }
    };

    const handleIbanChange = (e) => {
        const newIban = e.target.value.toUpperCase();
        const parsed = parseIban(newIban);
        onChange({
            ...data,
            iban: newIban,
            ...(parsed.country === 'IT' ? { abi: parsed.abi, cab: parsed.cab, cin: parsed.cin, conto: parsed.conto } : {})
        });
    };

    const handleAddAddress = () => {
        const newAddr = { tipologia: 'O', indirizzo: '', citta: '', cap: '', provincia: '', nazione: '', codiceUfficio: '' };
        onChange({ ...data, elencoIndirizzi: [...data.elencoIndirizzi, newAddr] });
        setActiveAddressIndex(data.elencoIndirizzi.length);
    };

    const handleRemoveAddress = (index) => {
        if (data.elencoIndirizzi.length <= 1) return;
        const updated = data.elencoIndirizzi.filter((_, i) => i !== index);
        onChange({ ...data, elencoIndirizzi: updated });
        if (activeAddressIndex >= updated.length) setActiveAddressIndex(updated.length - 1);
    };

    const handleAddContact = () => {
        const newCont = { referente: '', telefono: '', cellulare: '', fax: '', email: '', pec: '' };
        onChange({ ...data, elencoContatti: [...data.elencoContatti, newCont] });
        setActiveContactIndex(data.elencoContatti.length);
    };

    const handleRemoveContact = (index) => {
        if (data.elencoContatti.length <= 1) return;
        const updated = data.elencoContatti.filter((_, i) => i !== index);
        onChange({ ...data, elencoContatti: updated });
        if (activeContactIndex >= updated.length) setActiveContactIndex(updated.length - 1);
    };

    const generateCodice = async () => {
        try {
            const resCode = await ClientiService.generateCodice();
            onChange({ ...data, codice: resCode.data?.payload || '' });
        } catch (e) {
            console.error("Error generating code", e);
        }
    };

    const refreshAvvisi = async () => {
        const res = await AvvisiService.getAll();
        if (res.data) setAvvisiList(res.data);
    };
    const refreshNote = async () => {
        const res = await NoteDocumentiService.getAll();
        if (res.data) setNoteDocumentiList(res.data);
    };
    const refreshPorto = async () => {
        const res = await TipiPortoService.getAllForCombo();
        if (res.data) setTipiPortoList(res.data);
    };
    const refreshVettori = async () => {
        const res = await VettoriService.getAllForCombo();
        if (res.data) setVettoriList(res.data);
    };
    const refreshBanche = async () => {
        const res = await RisorseService.getAllForCombo('BA');
        if (res.data) setBancheList(res.data);
    };
    const refreshListini = async () => {
        const res = await ListiniService.getAll();
        if (res) setListiniList(Array.isArray(res) ? res : (res.payload || []));
    };

    const currentAddress = data.elencoIndirizzi[activeAddressIndex] || {};
    const currentContact = data.elencoContatti[activeContactIndex] || {};

    const getAddressLabel = (addr, index) => {
        const typeMap = { 'O': 'Op.', 'L': 'Leg.', 'A': 'Amm.', 'M': 'Merc.', 'T': 'Alt.' };
        return `${typeMap[addr.tipologia] || 'Ind.'} ${index + 1}`;
    };

    return (
        <div className="entity-form-shared">
            <ul className="nav nav-tabs nav-tabs-custom">
                <li className={activeTab === 'general' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('general'); }}>Informazioni generali</a>
                </li>
                <li className={activeTab === 'other' ? 'active' : ''}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('other'); }}>Altre informazioni</a>
                </li>
                {!isNew && (
                    <li className={activeTab === 'comunicazioni' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('comunicazioni'); }}>Comunicazioni inviate</a>
                    </li>
                )}
            </ul>

            <div className="tab-content" style={{ padding: '20px 0' }}>
                {activeTab === 'general' && (
                    <div className="tab-pane active">
                        <div className="compact-row">
                            <div className="compact-col compact-col-md">
                                <div className="form-group">
                                    <label className="required">Codice</label>
                                    <div className="flex-input-group">
                                        <input type="text" style={{ display: 'none' }} autoComplete="off" />
                                        <input type="text" className="form-control" name="codice" value={data.codice} onChange={handleFormChange} required autoComplete="off" />
                                        <button className="btn btn-default" type="button" onClick={generateCodice} title="Genera codice automatico">Genera</button>
                                    </div>
                                </div>
                            </div>
                            <div className="compact-col compact-col-sm">
                                <div className="form-group">
                                    <label className="required">Tipologia</label>
                                    <select className="form-control" name="tipologia" value={data.tipologia} onChange={handleFormChange} required>
                                        <option value="PRIVATO">Privato</option>
                                        <option value="AZIENDA">Azienda</option>
                                        <option value="PUBBLICA_AMMINISTRAZIONE">P.A.</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="row" style={{ height: '1px', background: '#eee', margin: '5px 0 20px 0' }}></div>

                        <div className="row">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label className="required">Denominazione</label>
                                    <input type="text" className="form-control" name="denominazione" value={data.denominazione} onChange={handleFormChange} required />
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Codice Fiscale</label>
                                    <input type="text" className="form-control" name="codiceFiscale" value={data.codiceFiscale} onChange={handleFormChange} autoComplete="off" />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Partita IVA</label>
                                    <input type="text" className="form-control" name="partitaIva" value={data.partitaIva} onChange={handleFormChange} autoComplete="off" />
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="form-group">
                                    <label>Referente Principale</label>
                                    <input type="text" className="form-control" name="referente" value={data.referente} onChange={handleFormChange} autoComplete="off" />
                                </div>
                            </div>
                        </div>

                        <div className="smart-tabs-container">
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Indirizzi</label>
                            <div className="smart-tabs">
                                {data.elencoIndirizzi.map((addr, index) => (
                                    <div key={index} className={`smart-tab ${activeAddressIndex === index ? 'active' : ''}`} onClick={() => setActiveAddressIndex(index)}>
                                        {getAddressLabel(addr, index)}
                                        {data.elencoIndirizzi.length > 1 && <span className="remove-tab" onClick={(e) => { e.stopPropagation(); handleRemoveAddress(index); }}>×</span>}
                                    </div>
                                ))}
                                <button type="button" className="btn-add-tab" onClick={handleAddAddress}>+</button>
                            </div>
                        </div>

                        <div className="smart-fields-panel">
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Tipo</label>
                                        <select className="form-control" name="tipologia" value={currentAddress.tipologia || 'O'} onChange={handleAddressChange}>
                                            <option value="O">Sede Operativa</option>
                                            <option value="L">Sede Legale</option>
                                            <option value="A">Sede Amministrativa</option>
                                            <option value="M">Dest. Merce</option>
                                            <option value="T">Altro</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="form-group">
                                        <label>Indirizzo</label>
                                        <input type="text" className="form-control" name="indirizzo" value={currentAddress.indirizzo || ''} onChange={handleAddressChange} autoComplete="off" />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Città</label>
                                        <AsyncCreatableSelect
                                            cacheOptions
                                            loadOptions={(val) => val.length > 2 ? CittaService.getSuggestion(val).then(res => res.data) : Promise.resolve([])}
                                            onChange={handleCityChange}
                                            value={currentAddress.citta ? { nome: currentAddress.citta, label: currentAddress.citta } : null}
                                            getOptionLabel={(o) => o.nome || o.label}
                                            getOptionValue={(o) => o.nome || o.value}
                                            placeholder="Cerca città..."
                                            styles={{ control: (b) => ({ ...b, minHeight: '34px' }) }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="form-group"><label>Cap</label><input type="text" className="form-control" name="cap" value={currentAddress.cap || ''} onChange={handleAddressChange} autoComplete="off" /></div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group"><label>Provincia</label><input type="text" className="form-control" name="provincia" value={currentAddress.provincia || ''} onChange={handleAddressChange} maxLength="2" autoComplete="off" /></div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Nazione</label>
                                        <NazioneSelect 
                                            value={currentAddress.nazione || ''} 
                                            onChange={handleNazioneChange} 
                                        />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group"><label>Codice SDI</label><input type="text" className="form-control" name="codiceUfficio" value={currentAddress.codiceUfficio || ''} onChange={handleAddressChange} maxLength="7" autoComplete="off" placeholder="7 caratteri" /></div>
                                </div>
                            </div>
                        </div>

                        <div className="smart-tabs-container">
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>Contatti</label>
                            <div className="smart-tabs">
                                {data.elencoContatti.map((cont, index) => (
                                    <div key={index} className={`smart-tab ${activeContactIndex === index ? 'active' : ''}`} onClick={() => setActiveContactIndex(index)}>
                                        {cont.referente || `Contatto ${index + 1}`}
                                        {data.elencoContatti.length > 1 && <span className="remove-tab" onClick={(e) => { e.stopPropagation(); handleRemoveContact(index); }}>×</span>}
                                    </div>
                                ))}
                                <button type="button" className="btn-add-tab" onClick={handleAddContact}>+</button>
                            </div>
                        </div>

                        <div className="smart-fields-panel">
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Referente Contatto</label>
                                        <input type="text" className="form-control" name="referente" value={currentContact.referente || ''} onChange={handleContactChange} autoComplete="off" />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input type="email" className="form-control" name="email" value={currentContact.email || ''} onChange={handleContactChange} autoComplete="off" />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Telefono</label>
                                        <input type="text" className="form-control" name="telefono" value={currentContact.telefono || ''} onChange={handleContactChange} autoComplete="off" />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>PEC</label>
                                        <input type="email" className="form-control" name="pec" value={currentContact.pec || ''} onChange={handleContactChange} autoComplete="off" />
                                    </div>
                                </div>
                            </div>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '5px' }}>
                                        <input
                                            type="checkbox"
                                            id="flUsaPerSolleciti"
                                            name="flUsaPerSolleciti"
                                            checked={!!currentContact.flUsaPerSolleciti}
                                            onChange={handleContactChange}
                                            style={{ width: '16px', height: '16px' }}
                                        />
                                        <label htmlFor="flUsaPerSolleciti" style={{ margin: 0, fontWeight: 'normal', cursor: 'pointer' }}>
                                            Usa per l'invio dei solleciti di pagamento automatici
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'other' && (
                    <div className="tab-pane active">
                        <div className="compact-row">
                            <div className="compact-col compact-col-lg">
                                <div className="form-group">
                                    <label>IBAN</label>
                                    <input type="text" className="form-control" name="iban" value={data.iban || ''} onChange={handleIbanChange} autoComplete="off" />
                                </div>
                            </div>
                            <div className="compact-col compact-col-lg">
                                <div className="form-group">
                                    <label>Banca Cliente</label>
                                    <input type="text" className="form-control" name="banca" value={data.banca || ''} onChange={handleFormChange} autoComplete="off" />
                                </div>
                            </div>
                        </div>

                        <div className="compact-row">
                            <div className="compact-col compact-col-lg">
                                <div className="form-group">
                                    <label>Avviso</label>
                                    <div className="flex-input-group">
                                        <select className="form-control" name="idAvviso" value={data.idAvviso || ''} onChange={handleFormChange}>
                                            <option value="">Nessuno</option>
                                            {avvisiList.map(a => <option key={a.id} value={a.id}>{a.descrizione}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-default" onClick={() => setShowAvvisiModal(true)} title="Gestione avvisi"><FaWrench /></button>
                                    </div>
                                </div>
                            </div>
                            <div className="compact-col compact-col-lg">
                                <div className="form-group">
                                    <label>Nota Documento</label>
                                    <div className="flex-input-group">
                                        <select className="form-control" name="idNota" value={data.idNota || ''} onChange={handleFormChange}>
                                            <option value="">Nessuna</option>
                                            {noteDocumentiList.map(n => <option key={n.id} value={n.id}>{n.descrizione}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-default" onClick={() => setShowNoteModal(true)} title="Gestione note documenti"><FaWrench /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="compact-row">
                            <div className="compact-col compact-col-lg">
                                <div className="form-group">
                                    <label>Nostra Banca</label>
                                    <div className="flex-input-group">
                                        <select className="form-control" name="idRisorsa" value={data.idRisorsa || ''} onChange={handleFormChange}>
                                            <option value="">Seleziona...</option>
                                            {bancheList.map(b => <option key={b.id} value={b.id}>{b.descrizione}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-default" onClick={() => setShowRisorseModal(true)} title="Gestione conti/banche"><FaWrench /></button>
                                    </div>
                                </div>
                            </div>
                            <div className="compact-col compact-col-lg">
                                <div className="form-group">
                                    <label>Tipo Porto</label>
                                    <div className="flex-input-group">
                                        <select className="form-control" name="idTipoPorto" value={data.idTipoPorto || ''} onChange={handleFormChange}>
                                            <option value="">Seleziona...</option>
                                            {tipiPortoList.map(tp => <option key={tp.id} value={tp.id}>{tp.descrizione}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-default" onClick={() => setShowPortoModal(true)} title="Gestione tipi porto"><FaWrench /></button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {showCommercialData && (
                            <div className="compact-row">
                                <div className="compact-col compact-col-lg">
                                    <div className="form-group">
                                        <label>Vettore</label>
                                        <div className="flex-input-group">
                                            <select className="form-control" name="idVettore" value={data.idVettore || ''} onChange={handleFormChange}>
                                                <option value="">Seleziona...</option>
                                                {vettoriList.map(v => <option key={v.id} value={v.id}>{v.denominazione}</option>)}
                                            </select>
                                            <button type="button" className="btn btn-default" onClick={() => setShowVettoriModal(true)} title="Gestione vettori"><FaWrench /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="compact-row">
                            <div className="compact-col compact-col-lg">
                                <div className="form-group">
                                    <label>Listino Predefinito</label>
                                    <div className="flex-input-group">
                                        <select className="form-control" name="idListino" value={data.idListino || ''} onChange={handleFormChange}>
                                            <option value="">Seleziona...</option>
                                            {listiniList.map(l => <option key={l.id} value={l.id}>{l.descrizione}</option>)}
                                        </select>
                                        <button type="button" className="btn btn-default" onClick={() => setShowListiniModal(true)} title="Gestione listini"><FaWrench /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-md-12">
                                <div className="form-group">
                                    <label>Note</label>
                                    <textarea className="form-control" name="note" value={data.note || ''} onChange={handleFormChange} rows="3"></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'comunicazioni' && !isNew && (
                    <div className="tab-pane active">
                        <ComunicazioniTimeline idDocumento={data.id} tipo="cliente" />
                    </div>
                )}
            </div>

            {/* Sub-modals rendered via Portal */}
            {showAvvisiModal && createPortal(<AvvisiManagementModal onClose={() => { setShowAvvisiModal(false); refreshAvvisi(); }} style={{ zIndex: 1300 }} />, document.body)}
            {showNoteModal && createPortal(<NoteDocumentiManagementModal onClose={() => { setShowNoteModal(false); refreshNote(); }} style={{ zIndex: 1300 }} />, document.body)}
            {showPortoModal && createPortal(<TipiPortoManagementModal onClose={() => { setShowPortoModal(false); refreshPorto(); }} style={{ zIndex: 1300 }} />, document.body)}
            {showVettoriModal && createPortal(<VettoriManagementModal onClose={() => { setShowVettoriModal(false); refreshVettori(); }} style={{ zIndex: 1300 }} />, document.body)}
            {showRisorseModal && createPortal(<RisorseManagementModal onClose={() => { setShowRisorseModal(false); refreshBanche(); }} style={{ zIndex: 1300 }} />, document.body)}
            {showListiniModal && createPortal(<ListiniManagementModal isOpen={true} onClose={() => { setShowListiniModal(false); refreshListini(); }} onSelect={(opt) => handleFormChange({ target: { name: 'idListino', value: opt.value } })} style={{ zIndex: 1300 }} />, document.body)}
        </div>
    );
};

export default ClienteForm;
