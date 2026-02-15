import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import FattureService from '../../services/FattureService';
import DDTService from '../../services/DDTService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import ArticoliService from '../../services/ArticoliService';
import { FaSave, FaArrowLeft, FaPlus, FaTrash, FaPrint, FaFilePdf, FaWrench, FaHome, FaTruck, FaMapMarkerAlt, FaCaretDown, FaArrowRight } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import CreatableSelect from 'react-select/creatable';
import './FattureDetail.css';
import '../../components/EntityForms.css';
import ClientiManagementModal from '../../components/modals/ClientiManagementModal';
import AgentiManagementModal from '../../components/modals/AgentiManagementModal';
import EntitySelectGroup from '../../components/EntitySelectGroup';
import IndirizziSelectionModal from '../../components/modals/IndirizziSelectionModal';
import TipiPagamentoManagementModal from '../../components/modals/TipiPagamentoManagementModal';
import ProgettoQuickModal from '../../components/modals/ProgettoQuickModal';
import RisorseManagementModal from '../../components/modals/RisorseManagementModal';

import authService from '../../services/authService';
import DocumentRows from '../../components/common/DocumentRows';
import { getRowValues } from '../../utils/documentUtils';

const particellaSelectStyles = {
    control: (base) => ({
        ...base,
        borderTopLeftRadius: '0px',
        borderBottomLeftRadius: '0px',
        borderTopRightRadius: '0px',
        borderBottomRightRadius: '0px',
        borderColor: '#dfe4e7',
        borderLeft: 'none',
        minHeight: '38px',
        height: '38px',
        boxShadow: 'none',
        backgroundColor: '#f8f9fa',
        '&:hover': { borderColor: '#ccc' }
    }),
    valueContainer: (base) => ({
        ...base,
        height: '38px',
        padding: '0 4px',
        display: 'flex',
        alignItems: 'center'
    }),
    indicatorsContainer: (base) => ({
        ...base,
        height: '36px'
    }),
    dropdownIndicator: (base) => ({
        ...base,
        padding: '4px',
    }),
    clearIndicator: (base) => ({
        ...base,
        padding: '4px',
    }),
    menu: (base) => ({ ...base, zIndex: 9999 })
};

const FattureDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const fromDDTId = searchParams.get('fromDDT');
    const isNew = !id || id === 'new';
    const [activeTab, setActiveTab] = useState('generale'); // legale, articoli, note, pagamento
    const [isCeramica, setIsCeramica] = useState(false);

    const [formData, setFormData] = useState({
        numDocumento: '',
        particella: '',
        dataDocumento: new Date().toISOString().split('T')[0],
        idCliente: null,
        nomeCliente: '',
        idAgente: null,
        nomeAgente: '',
        idProgetto: null,
        nomeProgetto: '',
        idListino: '',
        idTipoPagamento: null,
        idNsBanca: null,
        descrizioneBanca: '',
        iban: '',
        cittaIntestazione: '',
        indirizzoIntestazione: '',
        capIntestazione: '',
        provinciaIntestazione: '',
        codiceFiscale: '',
        partitaIva: '',
        cittaDestinazione: '',
        indirizzoDestinazione: '',
        capDestinazione: '',
        provinciaDestinazione: '',
        noteConsegna: '',
        annotazioneEstesa: '',
        tipoFattura: 'FATTURA',
        flFatturaElettronica: 0,
        pec: '',
        codiceUfficioDestinazione: ''
    });

    const [prodotti, setProdotti] = useState([]);

    // Combos
    const [combos, setCombos] = useState({
        particelle: [],
        listini: [],
        tipiPagamento: [],
        risorse: [], // Banche
        aliquoteIva: [],
        unitaMisura: [],
        agenti: [],
        progetti: []
    });

    const [clientIndirizzi, setClientIndirizzi] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressTarget, setAddressTarget] = useState('intestazione');
    const [showProgettoModal, setShowProgettoModal] = useState(false);
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const saveMenuRef = useRef(null);

    useEffect(() => {
        checkCeramica();
        fetchCombos();
        if (!isNew) {
            fetchData();
        } else {
            const tipoParam = searchParams.get('tipo');
            const eletParam = searchParams.get('elet');

            if (tipoParam || eletParam) {
                setFormData(prev => ({
                    ...prev,
                    tipoFattura: tipoParam || prev.tipoFattura,
                    flFatturaElettronica: eletParam === '1' ? 1 : 0
                }));
            }

            if (fromDDTId) {
                fetchDataFromDDT(fromDDTId);
            } else {
                fetchNextNum(formData.dataDocumento, eletParam === '1' ? 1 : 0, tipoParam || 'FATTURA');
            }
        }

        const handleClickOutside = (event) => {
            if (saveMenuRef.current && !saveMenuRef.current.contains(event.target)) {
                setShowSaveMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [id]);

    const checkCeramica = async () => {
        const conf = authService.getConfig();
        if (conf && conf.TIPO_NEGOZIO === 'ceramica') {
            setIsCeramica(true);
        }
    };

    const fetchCombos = async () => {
        try {
            const res = await FattureService.getCombosMap();
            if (res.data && res.data.payload) {
                setCombos(res.data.payload);
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchDataFromDDT = async (ddtIdsStr) => {
        try {
            const ids = ddtIdsStr.split(',');
            let allProdotti = [];
            let firstDDTData = null;

            for (const ddtId of ids) {
                const res = await DDTService.getById(ddtId);
                if (res.data && res.data.payload) {
                    const ddtData = res.data.payload;
                    if (!firstDDTData) firstDDTData = ddtData;

                    // Aggiunge riga di riferimento
                    allProdotti.push({
                        id: 0,
                        idDocumento: 0,
                        tipo: 'N',
                        fmDescrizione: `Rif. DDT num. ${ddtData.numDocumento} del ${ddtData.dataDocumento}`,
                        quantita: 0,
                        prezzo: 0,
                        sconto: 0,
                        iva: 0
                    });

                    // Aggiunge prodotti
                    if (ddtData.prodotti) {
                        const mappedProdotti = ddtData.prodotti.map(p => ({
                            ...p,
                            id: 0,
                            idDocumento: 0,
                            tipo: p.idProdotto ? 'A' : (p.fmDescrizione ? 'F' : 'N')
                        }));
                        allProdotti = [...allProdotti, ...mappedProdotti];
                    }
                }
            }

            if (firstDDTData) {
                setFormData(prev => ({
                    ...prev,
                    idCliente: firstDDTData.idCliente,
                    nomeCliente: firstDDTData.nomeCliente,
                    idAgente: firstDDTData.idAgente,
                    idProgetto: firstDDTData.idProgetto,
                    idListino: firstDDTData.idListino || '',
                    idTipoPagamento: firstDDTData.idTipoPagamento,
                    idNsBanca: firstDDTData.idNsBanca,
                    descrizioneBanca: firstDDTData.descrizioneBanca,
                    iban: firstDDTData.iban,
                    cittaIntestazione: firstDDTData.cittaIntestazione,
                    indirizzoIntestazione: firstDDTData.indirizzoIntestazione,
                    capIntestazione: firstDDTData.capIntestazione,
                    provinciaIntestazione: firstDDTData.provinciaIntestazione,
                    codiceFiscale: firstDDTData.codiceFiscale,
                    partitaIva: firstDDTData.partitaIva,
                    cittaDestinazione: firstDDTData.cittaDestinazione,
                    indirizzoDestinazione: firstDDTData.indirizzoDestinazione,
                    capDestinazione: firstDDTData.capDestinazione,
                    provinciaDestinazione: firstDDTData.provinciaDestinazione
                }));
                setProdotti(allProdotti);
                if (firstDDTData.idCliente) {
                    loadClientAddresses(firstDDTData.idCliente, false);
                }
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Impossibile caricare i dati dai DDT', 'error');
        }
    };

    const fetchData = async () => {
        try {
            const res = await FattureService.getById(id);
            if (res.data && res.data.payload) {
                const data = res.data.payload;
                if (data.dataDocumento && data.dataDocumento.includes('/')) {
                    const parts = data.dataDocumento.split('/');
                    data.dataDocumento = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                setFormData(prev => ({ ...prev, ...data }));
                const mappedProdotti = (data.prodotti || []).map(p => ({
                    ...p,
                    tipo: p.idProdotto ? 'A' : (p.fmDescrizione ? 'F' : 'N')
                }));
                setProdotti(mappedProdotti);

                if (data.idCliente) {
                    loadClientAddresses(data.idCliente, false);
                }
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Impossibile caricare la fattura', 'error');
            navigate('/fatture');
        }
    };

    const fetchNextNum = async (dateStr, flElettronica = 0, tipo = 'FATTURA') => {
        if (!dateStr) return;
        try {
            const formattedDate = dateStr.split('-').reverse().join('/');
            const res = await FattureService.getNextNum(formattedDate, flElettronica, tipo);
            if (res.data && res.data.payload) {
                setFormData(prev => ({ ...prev, numDocumento: res.data.payload }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadClientAddresses = async (clientId, autoFill = true) => {
        try {
            const [resIndirizzi, resClient] = await Promise.all([
                ClientiService.getIndirizzi(clientId),
                ClientiService.getById(clientId)
            ]);

            const indirizzi = resIndirizzi.data?.payload || resIndirizzi.data || [];
            const clientFull = resClient.data?.payload || resClient.data || {};

            setClientIndirizzi(indirizzi);

            if (autoFill) {
                const sedeLegale = indirizzi.find(i => i.tipologia === 'L');
                const sedeOperativa = indirizzi.find(i => i.tipologia === 'O');
                const destinazioneMerce = indirizzi.find(i => i.tipologia === 'M');

                const mainAddress = {
                    indirizzo: clientFull.indirizzo,
                    citta: clientFull.citta,
                    cap: clientFull.cap,
                    provincia: clientFull.provincia,
                    nazione: clientFull.nazione
                };

                const validMain = mainAddress.indirizzo ? mainAddress : null;
                const header = sedeLegale || sedeOperativa || validMain;
                const shipping = destinazioneMerce || sedeOperativa || sedeLegale || validMain;

                setFormData(prev => ({
                    ...prev,
                    ...(header ? {
                        indirizzoIntestazione: header.indirizzo || '',
                        cittaIntestazione: header.citta || '',
                        capIntestazione: header.cap || '',
                        provinciaIntestazione: header.provincia || '',
                    } : {}),
                    ...(shipping ? {
                        indirizzoDestinazione: shipping.indirizzo || '',
                        cittaDestinazione: shipping.citta || '',
                        capDestinazione: shipping.cap || '',
                        provinciaDestinazione: shipping.provincia || '',
                    } : {}),
                    partitaIva: clientFull.partitaIva || prev.partitaIva || '',
                    codiceFiscale: clientFull.codiceFiscale || prev.codiceFiscale || '',
                    idTipoPagamento: clientFull.idTipoPagamento || prev.idTipoPagamento
                }));
            }
        } catch (error) {
            console.error("Error loading client addresses:", error);
        }
    };

    const handleHeaderChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? (checked ? 1 : 0) : value;
        setFormData(prev => {
            const next = { ...prev, [name]: val };
            if ((name === 'dataDocumento' || name === 'tipoFattura' || name === 'flFatturaElettronica') && isNew) {
                fetchNextNum(next.dataDocumento, next.flFatturaElettronica, next.tipoFattura);
            }
            return next;
        });
    };

    const handleRecalculate = (newProdotti) => {
        setProdotti(newProdotti);
    };

    const calculateTotalDocument = () => {
        return prodotti.reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).total || 0), 0);
    };

    const calculateTotalImponibile = () => {
        return prodotti.reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).imponibile || 0), 0);
    };

    const loadClienti = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 3) return callback([]);
        ClientiService.getSuggestion(inputValue).then(res => {
            const list = Array.isArray(res.data) ? res.data : (res.data && res.data.payload) || [];
            if (list.length > 0) {
                callback(list.map(c => ({
                    value: c.id,
                    label: c.denominazione || c.denominazioneData,
                    data: c
                })));
            } else callback([]);
        }).catch(err => {
            console.error("Error loading clienti:", err);
            callback([]);
        });
    };

    const handleSelectCliente = (opt) => {
        if (opt) {
            const c = opt.data;
            setFormData(prev => ({
                ...prev,
                idCliente: c.id,
                nomeCliente: c.denominazione,
                idListino: c.idListino || '',
                idTipoPagamento: c.idTipoPagamento,
                idAgente: c.idAgente,
                nomeAgente: c.agnRagioneSociale,
                cittaIntestazione: c.citta,
                indirizzoIntestazione: c.indirizzo,
                capIntestazione: c.cap,
                provinciaIntestazione: c.provincia,
                partitaIva: c.partitaIva || '',
                codiceFiscale: c.codiceFiscale || '',
                cittaDestinazione: c.citta,
                indirizzoDestinazione: c.indirizzo,
                capDestinazione: c.cap,
                provinciaDestinazione: c.provincia
            }));
            loadClientAddresses(c.id);
        } else {
            setFormData(prev => ({ ...prev, idCliente: null, nomeCliente: '', idListino: '', idTipoPagamento: null, idAgente: null }));
            setClientIndirizzi([]);
        }
    };

    const openAddressModal = (target) => {
        if (!formData.idCliente) {
            Swal.fire('Attenzione', 'Seleziona prima un cliente', 'warning');
            return;
        }
        setAddressTarget(target);
        setShowAddressModal(true);
    };

    const handleSelectIndirizzo = (addr) => {
        if (addressTarget === 'intestazione') {
            setFormData(prev => ({
                ...prev,
                indirizzoIntestazione: addr.indirizzo,
                cittaIntestazione: addr.citta,
                capIntestazione: addr.cap,
                provinciaIntestazione: addr.provincia
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                indirizzoDestinazione: addr.indirizzo,
                cittaDestinazione: addr.citta,
                capDestinazione: addr.cap,
                provinciaDestinazione: addr.provincia
            }));
        }
        setShowAddressModal(false);
    };

    const validate = () => {
        if (!formData.numDocumento) { Swal.fire('Errore', 'Inserire il numero documento', 'error'); return false; }
        if (!formData.dataDocumento) { Swal.fire('Errore', 'Inserire la data documento', 'error'); return false; }
        if (!formData.idCliente) { Swal.fire('Errore', 'Selezionare un cliente', 'error'); return false; }
        return true;
    };

    const saveFattura = async () => {
        if (!validate()) return null;

        const parts = formData.dataDocumento.split('-');
        const dtFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;

        const payload = {
            ...formData,
            dataDocumento: dtFormatted,
            prodotti: prodotti
        };

        try {
            const res = await FattureService.save(payload);
            return res.data.payload?.id || res.data.payload || (isNew ? res.data : id);
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Errore durante il salvataggio', 'error');
            return null;
        }
    };

    const handleSave = async (e, options = {}) => {
        if (e) e.preventDefault();
        const savedId = await saveFattura();
        if (savedId) {
            if (options.print) {
                try {
                    const printRes = await FattureService.print(savedId);
                    const blob = new Blob([printRes.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    printJS({ printable: url, type: 'pdf' });
                    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                } catch (err) {
                    console.error("Print error:", err);
                }
            }
            if (options.pdf) {
                try {
                    const printRes = await FattureService.print(savedId);
                    const url = window.URL.createObjectURL(new Blob([printRes.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `Fattura_${formData.numDocumento}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                } catch (err) {
                    console.error("PDF error:", err);
                }
            }
            if (!options.print && !options.pdf) {
                Swal.fire({
                    title: 'Salvato!',
                    text: 'Fattura salvata con successo',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    navigate('/fatture');
                });
            }
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
    };

    return (
        <div className="fatture-detail-container entity-form-shared">
            <div id="fatture-content-header">
                <div>
                    <h1>{isNew ? 'Nuova' : 'Modifica'} Fattura</h1>
                    <div className="breadcrumb">
                        <span onClick={() => navigate('/fatture')}>Elenco Fatture</span> / <span>{isNew ? 'Nuova' : formData.numDocumento}</span>
                    </div>
                </div>
                <div className="header-totals">
                    <div className="total-box">
                        <span className="label">Imponibile</span>
                        <span className="value">{formatCurrency(calculateTotalImponibile())}</span>
                    </div>
                    <div className="total-box highlight">
                        <span className="label">Totale Doc.</span>
                        <span className="value">{formatCurrency(calculateTotalDocument())}</span>
                    </div>
                </div>
            </div>

            <div className="detail-box main-box">
                <ul className="nav nav-tabs nav-tabs-custom">
                    <li className={activeTab === 'generale' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('generale'); }}>Generale</a>
                    </li>
                    <li className={activeTab === 'articoli' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('articoli'); }}>Articoli ({prodotti.length})</a>
                    </li>
                    <li className={activeTab === 'pagamento' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('pagamento'); }}>Pagamento</a>
                    </li>
                    <li className={activeTab === 'note' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('note'); }}>Annotazioni</a>
                    </li>
                </ul>

                <div className="main-box-body">
                    <form className="tab-content" onSubmit={handleSave}>
                        {/* Tab Generale */}
                        <div className={`tab-pane ${activeTab === 'generale' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div className="compact-row">
                                    <div className="compact-col compact-col-md">
                                        <div className="form-group">
                                            <label>Numero</label>
                                            <div className="flex-input-group w-md">
                                                <input
                                                    type="text"
                                                    className="form-control premium-input"
                                                    name="numDocumento"
                                                    value={formData.numDocumento}
                                                    onChange={handleHeaderChange}
                                                />
                                                <span className="input-group-addon" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: '#eee', borderTop: '1px solid #dfe4e7', borderBottom: '1px solid #dfe4e7' }}>/</span>
                                                <div style={{ flex: '0 0 130px' }}>
                                                    <CreatableSelect
                                                        isClearable
                                                        options={(combos.particelle || []).map(p => ({ value: p, label: p }))}
                                                        value={formData.particella ? { value: formData.particella, label: formData.particella } : null}
                                                        onChange={(opt) => setFormData(prev => ({ ...prev, particella: opt?.value || '' }))}
                                                        styles={particellaSelectStyles}
                                                        placeholder="-"
                                                        noOptionsMessage={() => "Nuovo..."}
                                                        formatCreateLabel={(inputValue) => `Usa "${inputValue}"`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="compact-col compact-col-sm">
                                        <div className="form-group">
                                            <label>Data</label>
                                            <div className="flex-input-group">
                                                <input
                                                    type="date"
                                                    className="form-control premium-input"
                                                    name="dataDocumento"
                                                    value={formData.dataDocumento}
                                                    onChange={handleHeaderChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="compact-col compact-col-md">
                                        <div className="form-group">
                                            <label>Tipo Documento</label>
                                            <select
                                                className="form-control premium-input"
                                                name="tipoFattura"
                                                value={formData.tipoFattura}
                                                onChange={handleHeaderChange}
                                            >
                                                <option value="FATTURA">Fattura</option>
                                                <option value="FATTURA_ACCOMPAGNATORIA">Accompagnatoria</option>
                                                <option value="FATTURA_ACCONTO">Acconto</option>
                                                <option value="FATTURA_PROFORMA">Pro Forma</option>
                                                <option value="NOTA_DEBITO">Nota Debito</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="compact-col compact-col-sm" style={{ alignSelf: 'center', marginTop: '10px' }}>
                                        <div className="form-group mb-0">
                                            <div className="premium-checkbox-group">
                                                <input
                                                    type="checkbox"
                                                    id="flFatturaElettronica"
                                                    name="flFatturaElettronica"
                                                    checked={formData.flFatturaElettronica === 1}
                                                    onChange={handleHeaderChange}
                                                />
                                                <label htmlFor="flFatturaElettronica" style={{ marginLeft: '8px' }}>Elettronica</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="compact-col compact-col-xl">
                                        <EntitySelectGroup
                                            label="Cliente"
                                            isAsync={true}
                                            loadOptions={loadClienti}
                                            value={formData.idCliente ? { value: formData.idCliente, label: formData.nomeCliente } : null}
                                            onChange={handleSelectCliente}
                                            ModalComponent={ClientiManagementModal}
                                            title="Gestione Clienti"
                                            placeholder="Cerca cliente..."
                                            widthClass="w-lg"
                                        />
                                    </div>
                                    <div className="compact-col compact-col-md">
                                        <EntitySelectGroup
                                            label="Agente"
                                            isAsync={false}
                                            options={(combos.agenti || []).map(a => ({ value: a.id, label: a.denominazione }))}
                                            value={formData.idAgente ? { value: formData.idAgente, label: formData.nomeAgente } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idAgente: opt?.value, nomeAgente: opt?.label }))}
                                            ModalComponent={AgentiManagementModal}
                                            title="Gestione Agenti"
                                            placeholder="Seleziona agente..."
                                            widthClass="w-md"
                                        />
                                    </div>
                                </div>

                                {formData.flFatturaElettronica === 1 && (
                                    <div className="compact-row" style={{ marginTop: '10px', background: '#e3f2fd', padding: '10px', borderRadius: '4px', border: '1px solid #90caf9' }}>
                                        <div className="compact-col compact-col-md">
                                            <div className="form-group mb-0">
                                                <label>Codice Univoco (SDI)</label>
                                                <input
                                                    type="text"
                                                    className="form-control premium-input"
                                                    name="codiceUfficioDestinazione"
                                                    value={formData.codiceUfficioDestinazione || ''}
                                                    onChange={handleHeaderChange}
                                                    placeholder="XXXXXXX"
                                                    maxLength={7}
                                                />
                                            </div>
                                        </div>
                                        <div className="compact-col compact-col-lg">
                                            <div className="form-group mb-0">
                                                <label>PEC</label>
                                                <input
                                                    type="email"
                                                    className="form-control premium-input"
                                                    name="pec"
                                                    value={formData.pec || ''}
                                                    onChange={handleHeaderChange}
                                                    placeholder="indirizzo@pec.it"
                                                />
                                            </div>
                                        </div>
                                        <div className="compact-col compact-col-md" style={{ alignSelf: 'center', color: '#1976d2', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                            <FaWrench style={{ marginRight: '5px' }} /> Dati per Fatturazione Elettronica
                                        </div>
                                    </div>
                                )}
                            </div>

                            <hr />

                            <div className="row mt-4">
                                <div className="col-md-6">
                                    <div className="premium-card address-card">
                                        <div className="card-header-vibrant d-flex justify-content-between align-items-center">
                                            <span><FaHome /> Intestazione</span>
                                            <button type="button" className="btn btn-xs btn-outline-light" onClick={() => openAddressModal('intestazione')} title="Cambia indirizzo"><FaMapMarkerAlt /> Cambia</button>
                                        </div>
                                        <div className="card-body">
                                            <div className="row mb-4">
                                                <div className="col-md-12">
                                                    <label className="premium-label">Indirizzo</label>
                                                    <input type="text" className="form-control premium-input" name="indirizzoIntestazione" value={formData.indirizzoIntestazione || ''} onChange={handleHeaderChange} />
                                                </div>
                                            </div>
                                            <div className="row mb-4">
                                                <div className="col-md-7">
                                                    <label className="premium-label">Città</label>
                                                    <input type="text" className="form-control premium-input" name="cittaIntestazione" value={formData.cittaIntestazione || ''} onChange={handleHeaderChange} />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="premium-label">Prov.</label>
                                                    <input type="text" className="form-control premium-input" name="provinciaIntestazione" value={formData.provinciaIntestazione || ''} onChange={handleHeaderChange} maxLength="2" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="premium-label">CAP</label>
                                                    <input type="text" className="form-control premium-input" name="capIntestazione" value={formData.capIntestazione || ''} onChange={handleHeaderChange} />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <label className="premium-label">Partita IVA</label>
                                                    <input type="text" className="form-control premium-input" name="partitaIva" value={formData.partitaIva || ''} onChange={handleHeaderChange} />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="premium-label">Codice Fiscale</label>
                                                    <input type="text" className="form-control premium-input" name="codiceFiscale" value={formData.codiceFiscale || ''} onChange={handleHeaderChange} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="premium-card address-card">
                                        <div className="card-header-vibrant d-flex justify-content-between align-items-center">
                                            <span><FaTruck /> Destinazione Consegna</span>
                                            <button type="button" className="btn btn-xs btn-outline-light" onClick={() => openAddressModal('destinazione')} title="Cambia destinazione"><FaMapMarkerAlt /> Cambia</button>
                                        </div>
                                        <div className="card-body">
                                            <div className="row mb-4">
                                                <div className="col-md-12">
                                                    <label className="premium-label">Indirizzo</label>
                                                    <input type="text" className="form-control premium-input" name="indirizzoDestinazione" value={formData.indirizzoDestinazione || ''} onChange={handleHeaderChange} />
                                                </div>
                                            </div>
                                            <div className="row mb-4">
                                                <div className="col-md-7">
                                                    <label className="premium-label">Città</label>
                                                    <input type="text" className="form-control premium-input" name="cittaDestinazione" value={formData.cittaDestinazione || ''} onChange={handleHeaderChange} />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="premium-label">Prov.</label>
                                                    <input type="text" className="form-control premium-input" name="provinciaDestinazione" value={formData.provinciaDestinazione || ''} onChange={handleHeaderChange} maxLength="2" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="premium-label">CAP</label>
                                                    <input type="text" className="form-control premium-input" name="capDestinazione" value={formData.capDestinazione || ''} onChange={handleHeaderChange} />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-12">
                                                    <label className="premium-label">Note Consegna</label>
                                                    <input type="text" className="form-control premium-input" name="noteConsegna" value={formData.noteConsegna || ''} onChange={handleHeaderChange} placeholder="Es. Citofono, orari..." />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row mb-3 mt-3">
                                {authService.getConfig()?.PROGETTI === '1' && (
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Progetto"
                                            isAsync={false}
                                            options={(combos.progetti || []).map(p => ({ value: p.id, label: p.descrizione }))}
                                            value={formData.idProgetto ? { value: formData.idProgetto, label: formData.nomeProgetto } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idProgetto: opt?.value, nomeProgetto: opt?.label }))}
                                            ModalComponent={ProgettoQuickModal}
                                            modalProps={{ isOpen: showProgettoModal }}
                                            placeholder="Senza progetto"
                                            title="Nuovo Progetto"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tab Articoli */}
                        <div className={`tab-pane ${activeTab === 'articoli' ? 'active' : ''}`}>
                            <DocumentRows
                                rows={prodotti}
                                onRowChange={handleRecalculate}
                                onRowUpdate={(idx, update) => {
                                    const newP = [...prodotti];
                                    newP[idx] = { ...newP[idx], ...update };
                                    setProdotti(newP);
                                }}
                                onDeleteRow={(idx) => {
                                    const newP = [...prodotti];
                                    newP.splice(idx, 1);
                                    setProdotti(newP);
                                }}
                                combos={combos}
                                isCeramica={isCeramica}
                            />
                        </div>

                        {/* Tab Pagamento */}
                        <div className={`tab-pane ${activeTab === 'pagamento' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Tipo Pagamento"
                                            isAsync={false}
                                            options={(combos.tipiPagamento || []).map(tp => ({ value: tp.id, label: tp.descrizione }))}
                                            value={formData.idTipoPagamento ? { value: formData.idTipoPagamento, label: (combos.tipiPagamento || []).find(tp => tp.id === formData.idTipoPagamento)?.descrizione } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idTipoPagamento: opt?.value }))}
                                            ModalComponent={TipiPagamentoManagementModal}
                                            modalProps={{ isOpen: false }}
                                            title="Gestione Tipi Pagamento"
                                            placeholder="Seleziona..."
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label>Listino</label>
                                            <div className="input-group input-group-premium">
                                                <select className="form-control" name="idListino" value={formData.idListino || ''} onChange={handleHeaderChange} style={{ height: '38px', borderTopRightRadius: 0, borderBottomRightRadius: 0, borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                                                    <option value="">Predefinito</option>
                                                    {(combos.listini || []).map(l => <option key={l.id} value={l.id}>{l.descrizione}</option>)}
                                                </select>
                                                <button type="button" className="premium-wrench-btn" onClick={() => navigate('/configurazione/listini')} title="Gestione Listini">
                                                    <FaWrench />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Nostra Banca"
                                            isAsync={false}
                                            options={(combos.risorse || []).map(r => ({ value: r.id, label: r.descrizione }))}
                                            value={formData.idNsBanca ? { value: formData.idNsBanca, label: (combos.risorse || []).find(r => r.id === formData.idNsBanca)?.descrizione } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idNsBanca: opt?.value }))}
                                            ModalComponent={RisorseManagementModal}
                                            modalProps={{ initialTipologia: 'BA', isOpen: false }}
                                            title="Gestione Banche"
                                            placeholder="Seleziona..."
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-4">
                                        <div className="form-group mb-0" style={{ marginTop: '25px' }}>
                                            <div className="premium-checkbox-group">
                                                <input
                                                    type="checkbox"
                                                    id="splitPayment"
                                                    name="splitPayment"
                                                    checked={formData.splitPayment === 1}
                                                    onChange={handleHeaderChange}
                                                />
                                                <label htmlFor="splitPayment" style={{ marginLeft: '8px' }}>Split Payment</label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-8">
                                        <div className="form-group">
                                            <label>Causale</label>
                                            <input
                                                type="text"
                                                className="form-control premium-input"
                                                name="causale"
                                                value={formData.causale || ''}
                                                onChange={handleHeaderChange}
                                                placeholder="Causale del documento..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Note */}
                        <div className={`tab-pane ${activeTab === 'note' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div className="form-group">
                                    <label>Annotazioni estese</label>
                                    <textarea
                                        className="form-control"
                                        rows="10"
                                        name="annotazioneEstesa"
                                        value={formData.annotazioneEstesa || ''}
                                        onChange={handleHeaderChange}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <footer className="main-box-footer detail-footer">
                            <button type="button" className="btn btn-premium-cancel" onClick={() => navigate('/fatture')}>
                                <FaArrowLeft /> Indietro
                            </button>
                            <div className="footer-right">
                                <div className="split-btn-container" ref={saveMenuRef}>
                                    <button type="submit" className="split-btn-main btn-premium-save">
                                        <FaSave /> Salva
                                    </button>
                                    <button type="button" className="split-btn-toggle" onClick={() => setShowSaveMenu(!showSaveMenu)}>
                                        <FaCaretDown />
                                    </button>
                                    <div className={`split-btn-menu ${showSaveMenu ? 'show' : ''}`}>
                                        <button type="button" className="split-btn-item" onClick={handleSave}>
                                            <FaSave /> Salva solo
                                        </button>
                                        <button type="button" className="split-btn-item" onClick={(e) => handleSave(e, { print: true })}>
                                            <FaPrint /> Stampa Diretto
                                        </button>
                                        <button type="button" className="split-btn-item" onClick={(e) => handleSave(e, { pdf: true })}>
                                            <FaFilePdf /> Esporta PDF
                                        </button>
                                        <div className="action-dropdown-divider"></div>
                                        <button type="button" className="split-btn-item" onClick={async () => {
                                            const savedId = await saveFattura();
                                            if (savedId) navigate(`/note-credito/new?fromFatture=${savedId}`);
                                        }}>
                                            <FaArrowRight /> Genera nota credito
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </form>
                </div>
            </div>

            {showAddressModal && (
                <IndirizziSelectionModal
                    isOpen={showAddressModal}
                    onClose={() => setShowAddressModal(false)}
                    indirizzi={clientIndirizzi}
                    onSelect={handleSelectIndirizzo}
                    target={addressTarget}
                />
            )}
        </div>
    );
};

export default FattureDetail;
