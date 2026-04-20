import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import PreventiviService from '../../services/PreventiviService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import ProgettiService from '../../services/ProgettiService';
import ArticoliService from '../../services/ArticoliService';
import authService from '../../services/authService';
import DocumentRows from '../../components/common/DocumentRows';
import { getRowValues } from '../../utils/documentUtils';
import ScadenzeTable from '../../components/common/ScadenzeTable';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import ProgettoQuickModal from '../../components/modals/ProgettoQuickModal';
import ClientiManagementModal from '../../components/modals/ClientiManagementModal';
import AgentiManagementModal from '../../components/modals/AgentiManagementModal';
import RisorseManagementModal from '../../components/modals/RisorseManagementModal';
import TipiPagamentoManagementModal from '../../components/modals/TipiPagamentoManagementModal';
import UnitaMisuraManagementModal from '../../components/modals/UnitaMisuraManagementModal';
import AliquoteIvaManagementModal from '../../components/modals/AliquoteIvaManagementModal';
import WrenchModalButton from '../../components/WrenchModalButton';
import EntitySelectGroup from '../../components/EntitySelectGroup';
import IndirizziSelectionModal from '../../components/modals/IndirizziSelectionModal';
import ListiniManagementModal from '../../components/modals/ListiniManagementModal';
import Swal from 'sweetalert2';
import printJS from 'print-js';
import CreatableSelect from 'react-select/creatable';
import ParticelleManagementModal from '../../components/modals/ParticelleManagementModal';
import NazioneSelect from '../../components/common/NazioneSelect';
import { FaSave, FaArrowLeft, FaPlus, FaTrash, FaCalculator, FaHome, FaAngleRight, FaWrench, FaCogs, FaMapMarkerAlt, FaTruck, FaPrint, FaCaretDown, FaFilePdf, FaArrowRight, FaGlobe } from 'react-icons/fa';
import './PreventiviDetail.css';
import '../../components/EntityForms.css';

const premiumSelectStyles = {
    control: (base) => ({
        ...base,
        borderTopLeftRadius: '4px',
        borderBottomLeftRadius: '4px',
        borderTopRightRadius: '0px',
        borderBottomRightRadius: '0px',
        borderColor: '#dfe4e7',
        minHeight: '38px',
        height: '38px',
        boxShadow: 'none',
        '&:hover': { borderColor: '#ccc' }
    }),
    valueContainer: (base) => ({
        ...base,
        height: '38px',
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center'
    }),
    indicatorsContainer: (base) => ({
        ...base,
        height: '36px'
    }),
    menu: (base) => ({ ...base, zIndex: 9999 })
};

const tableSelectStyles = {
    control: (base) => ({
        ...base,
        minHeight: '34px',
        height: '34px',
        fontSize: '12px',
        borderRadius: '4px 0 0 4px',
        borderColor: '#dfe4e7',
        boxShadow: 'none',
        '&:hover': { borderColor: '#ccc' }
    }),
    valueContainer: (base) => ({
        ...base,
        height: '34px',
        padding: '0 8px',
        display: 'flex',
        alignItems: 'center'
    }),
    singleValue: (base) => ({
        ...base,
        margin: 0,
        color: '#333',
        fontWeight: 500
    }),
    input: (base) => ({
        ...base,
        margin: 0,
        padding: 0,
        color: '#333'
    }),
    indicatorsContainer: (base) => ({
        ...base,
        height: '32px'
    }),
    menu: (base) => ({ ...base, zIndex: 9999, fontSize: '12px' }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    dropdownIndicator: (base) => ({ ...base, padding: '2px' }),
    clearIndicator: (base) => ({ ...base, padding: '2px' })
};

const particellaSelectStyles = {
    ...premiumSelectStyles,
    control: (base) => ({
        ...base,
        minHeight: '38px',
        height: '38px',
        borderTopLeftRadius: '0px',
        borderBottomLeftRadius: '0px',
        borderTopRightRadius: '0px',
        borderBottomRightRadius: '0px',
        borderLeft: 'none',
        borderRight: 'none',
        borderColor: '#dfe4e7',
        boxShadow: 'none'
    }),
    valueContainer: (base) => ({
        ...base,
        height: '36px',
        padding: '0 4px'
    }),
    input: (base) => ({
        ...base,
        margin: '0px'
    }),
    indicatorsContainer: (base) => ({
        ...base,
        height: '36px'
    }),
    dropdownIndicator: (base) => ({
        ...base,
        padding: '4px'
    }),
    clearIndicator: (base) => ({
        ...base,
        padding: '4px'
    }),
    menu: (base) => ({ ...base, zIndex: 9999, width: '150px' })
};

const PreventiviDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isNew = !id || id === 'new';
    const [isCeramica, setIsCeramica] = useState(false);

    const [activeTab, setActiveTab] = useState('generale');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false); // New state to prevent double-saves
    const [showProgettoModal, setShowProgettoModal] = useState(false);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showParticelleModal, setShowParticelleModal] = useState(false);
    const [showUMModal, setShowUMModal] = useState(false);
    const [showIVAModal, setShowIVAModal] = useState(false);
    const [addressTarget, setAddressTarget] = useState('intestazione'); // 'intestazione' or 'destinazione'
    const [combos, setCombos] = useState({
        aliquoteIva: [],
        unitaMisura: [],
        particelle: [],
        tipiPagamento: [],
        listini: [],
        risorse: [],
        agenti: [],
        progetti: [],
        flRitenutaAcconto: 0,
        percRitenutaAcconto: 20,
        importoRitenutaAcconto: 0,
        tipoRitenuta: '',
        listaScadenzePagamentiDocumento: []
    });

    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [formData, setFormData] = useState({
        numDocumento: '',
        dataDocumento: new Date().toISOString().split('T')[0],
        particella: '',
        idCliente: null,
        denominazione: '',
        denominazioneCliente: '',
        idAgente: null,
        nomeAgente: '',
        agente: '',
        idProgetto: null,
        nomeProgetto: '',
        progetto: '',
        idTipoPagamento: null,
        idListino: null,
        idNsBanca: null,
        annotazioneEstesa: '',
        indirizzoIntestazione: '',
        capIntestazione: '',
        cittaIntestazione: '',
        provinciaIntestazione: '',
        partitaIva: '',
        codiceFiscale: '',
        indirizzoDestinazione: '',
        capDestinazione: '',
        cittaDestinazione: '',
        provinciaDestinazione: '',
        nazioneIntestazione: 'Italia',
        nazioneDestinazione: 'Italia',
    });

    const [clientIndirizzi, setClientIndirizzi] = useState([]);

    const [prodotti, setProdotti] = useState([]);
    const [totals, setTotals] = useState({
        imponibile: 0,
        iva: 0,
        totale: 0
    });

    useEffect(() => {
        fetchCombos();
    }, []);

    useEffect(() => {
        let isCurrent = true; // Flag to ignore stale async results

        const loadData = async () => {
            if (!isNew) {
                try {
                    setLoading(true);
                    const res = await PreventiviService.getById(id);
                    if (!isCurrent) return; // Ignore if we navigated away

                    const data = res.data.payload;
                    setFormData({
                        ...data,
                        dataDocumento: data.dataDocumento ? data.dataDocumento.split('/').reverse().join('-') : '',
                        denominazione: data.denominazioneCliente || '',
                        nomeAgente: data.agente || '',
                        nomeProgetto: data.progetto || '',
                    });

                    const mappedProdotti = (data.prodotti || []).map(p => ({
                        ...p,
                        tipo: p.idProdotto ? 'A' : (p.fmDescrizione ? 'F' : 'N'),
                        rowTotal: calculateRowTotal(p)
                    }));
                    setProdotti(mappedProdotti);
                    
                    if (data.idCliente) {
                        fetchClientIndirizzi(data.idCliente, false);
                    }
                } catch (error) {
                    if (isCurrent) {
                        console.error("Error loading preventivo:", error);
                        Swal.fire('Errore', 'Impossibile caricare il preventivo', 'error');
                    }
                } finally {
                    if (isCurrent) setLoading(false);
                }
            } else {
                // Reset form for new entry
                setFormData({
                    numDocumento: '',
                    dataDocumento: new Date().toISOString().split('T')[0],
                    particella: '',
                    idCliente: null,
                    denominazione: '',
                    idAgente: null,
                    nomeAgente: '',
                    idProgetto: null,
                    nomeProgetto: '',
                    idTipoPagamento: null,
                    idListino: null,
                    idNsBanca: null,
                    annotazioneEstesa: '',
                    indirizzoIntestazione: '',
                    capIntestazione: '',
                    cittaIntestazione: '',
                    provinciaIntestazione: '',
                    partitaIva: '',
                    codiceFiscale: '',
                    indirizzoDestinazione: '',
                    capDestinazione: '',
                    cittaDestinazione: '',
                    provinciaDestinazione: '',
                    nazioneIntestazione: 'Italia',
                    nazioneDestinazione: 'Italia',
                });
                setProdotti([]);
                setTotals({ imponibile: 0, iva: 0, totale: 0 });
                setClientIndirizzi([]);

                // Then fetch next number
                fetchNextNum(new Date().toISOString().split('T')[0]);
            }
        };

        loadData();

        return () => {
            isCurrent = false; // Cleanup on unmount or id change
        };
    }, [id, isNew, searchParams]);

    const fetchCombos = async () => {
        try {
            const res = await PreventiviService.getCombosMap();
            if (res.data && res.data.payload) {
                const payload = res.data.payload;
                setCombos(prev => ({
                    ...prev,
                    particelle: (payload.PARTICELLE || payload.particelle || prev.particelle || []).flatMap(p => typeof p === 'string' ? p.split(',').map(s => s.trim()).filter(Boolean) : p),
                    listini: payload.LISTINI || payload.listini || prev.listini,
                    tipiPagamento: payload.TIPIPAGAMENTO || payload.tipiPagamento || prev.tipiPagamento,
                    risorse: payload.BANCHE || payload.risorse || prev.risorse,
                    aliquoteIva: payload.ALIQUOTEIVA || payload.aliquoteIva || prev.aliquoteIva,
                    unitaMisura: payload.UNITAMISURA || payload.unitaMisura || prev.unitaMisura,
                    agenti: payload.AGENTI || payload.agenti || prev.agenti,
                    progetti: payload.PROGETTI || payload.progetti || prev.progetti,
                    causaliEsigibilitaDifferita: payload.CAUSALIESIGIBILITADIFFERITA || payload.causaliEsigibilitaDifferita || prev.causaliEsigibilitaDifferita,
                    ...payload
                }));
            }

            // Fetch configuration for Ceramica
            const configRes = await ConfigurazioneService.getByDomain('GLOBAL');
            const data = configRes.data?.payload || configRes.data || {};

            console.log('--- CERAMICA DEBUG ---');
            console.log('API Config Data:', data);

            let ceramica = false;
            if (Array.isArray(data)) {
                ceramica = data.some(c => (c.chiave === 'TIPO_STORE' || c.chiave === 'TIPOSTORE') && c.valore === 'CERAMICA');
            } else {
                ceramica = data['TIPO_STORE'] === 'CERAMICA' || data['TIPOSTORE'] === 'CERAMICA';
            }

            console.log('Is Ceramica after API:', ceramica);

            if (!ceramica) {
                const authConfig = authService.getConfig();
                console.log('Auth Service Config:', authConfig);
                ceramica = authConfig['TIPOSTORE'] === 'CERAMICA' || authConfig['TIPO_STORE'] === 'CERAMICA';
            }

            console.log('Final Is Ceramica:', ceramica);
            console.log('----------------------');

            setIsCeramica(ceramica);
        } catch (error) {
            console.error("Error fetching combos:", error);
        }
    };

    const fetchNextNum = async (date) => {
        try {
            const res = await PreventiviService.getNextNum(date);
            setFormData(prev => ({ ...prev, numDocumento: res.data.payload }));
        } catch (error) {
            console.error("Error fetching next num:", error);
        }
    };

    const loadPreventivo = async () => {
        try {
            setLoading(true);
            const res = await PreventiviService.getById(id);
            const data = res.data.payload;

            setFormData({
                ...data,
                dataDocumento: data.dataDocumento ? data.dataDocumento.split('/').reverse().join('-') : '',
                denominazione: data.denominazioneCliente || '',
                nomeAgente: data.agente || '',
                nomeProgetto: data.progetto || '',
            });

            // Map productos to local state with calculation fields
            const mappedProdotti = (data.prodotti || []).map(p => ({
                ...p,
                tipo: p.idProdotto ? 'A' : (p.fmDescrizione ? 'F' : 'N'),
                rowTotal: calculateRowTotal(p)
            }));
            setProdotti(mappedProdotti);
            if (data.idCliente) {
                fetchClientIndirizzi(data.idCliente, false); // false = don't overwrite existing
            }
        } catch (error) {
            console.error("Error loading preventivo:", error);
            Swal.fire('Errore', 'Impossibile caricare il preventivo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchClientIndirizzi = async (idCliente, autoFill = true) => {
        try {
            // Parallel fetch: addresses + full client details
            const [resIndirizzi, resClient] = await Promise.all([
                ClientiService.getIndirizzi(idCliente),
                ClientiService.getById(idCliente)
            ]);

            const indirizzi = resIndirizzi.data || [];
            const clientFull = resClient.data?.payload || resClient.data || {};

            setClientIndirizzi(indirizzi);

            if (autoFill) {
                // Logic to auto-fill header and shipping
                const sedeLegale = indirizzi.find(i => i.tipologia === 'L');
                const sedeOperativa = indirizzi.find(i => i.tipologia === 'O');
                const destinazioneMerce = indirizzi.find(i => i.tipologia === 'M');

                // Fallback to client main address if no specific address found in list
                const mainAddress = {
                    indirizzo: clientFull.indirizzo,
                    citta: clientFull.citta,
                    cap: clientFull.cap,
                    provincia: clientFull.provincia,
                    nazione: clientFull.nazione
                };

                // Prioritize Sede Legale -> Sede Operativa -> Main Client Address
                // Only use mainAddress if it has at least an address line
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
                        nazioneIntestazione: header.nazione || 'Italia',
                    } : {}),
                    ...(shipping ? {
                        indirizzoDestinazione: shipping.indirizzo || '',
                        cittaDestinazione: shipping.citta || '',
                        capDestinazione: shipping.cap || '',
                        provinciaDestinazione: shipping.provincia || '',
                        nazioneDestinazione: shipping.nazione || 'Italia',
                    } : {}),
                    // Ensure core fields are populated if missing from suggestion
                    partitaIva: clientFull.partitaIva || prev.partitaIva || '',
                    codiceFiscale: clientFull.codiceFiscale || prev.codiceFiscale || '',
                    // Update payment method if not already set or if we want to enforce client's default
                    idTipoPagamento: clientFull.idTipoPagamento || prev.idTipoPagamento
                }));
            }
        } catch (error) {
            console.error("Error fetching client addresses:", error);
        }
    };

    const handleSelectIndirizzo = (ind) => {
        if (addressTarget === 'intestazione') {
            setFormData(prev => ({
                ...prev,
                indirizzoIntestazione: ind.indirizzo || '',
                cittaIntestazione: ind.citta || '',
                capIntestazione: ind.cap || '',
                provinciaIntestazione: ind.provincia || '',
                nazioneIntestazione: ind.nazione || 'Italia',
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                indirizzoDestinazione: ind.indirizzo || '',
                cittaDestinazione: ind.citta || '',
                capDestinazione: ind.cap || '',
                provinciaDestinazione: ind.provincia || '',
                nazioneDestinazione: ind.nazione || 'Italia',
            }));
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

    // Calculation Logic
    // getRowValues imported from utils
    const calculateRowTotal = useCallback((row) => {
        return getRowValues(row, combos.aliquoteIva).total;
    }, [combos.aliquoteIva]);

    useEffect(() => {
        let imp = 0;
        let tot = 0;
        prodotti.forEach(p => {
            const vals = getRowValues(p, combos.aliquoteIva);
            imp += vals.imponibile;
            tot += vals.total;
        });
        setTotals({
            imponibile: imp,
            iva: tot - imp,
            totale: tot
        });
    }, [prodotti, combos.aliquoteIva]);

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };


    const handleDeleteRow = (index) => {
        setProdotti(prev => prev.filter((_, i) => i !== index));
    };

    const handleRowChange = (index, field, value) => {
        setProdotti(prev => {
            const newProdotti = [...prev];
            newProdotti[index] = { ...newProdotti[index], [field]: value };
            return newProdotti;
        });
    };

    const handleRowUpdate = (index, updates) => {
        setProdotti(prev => {
            const newProdotti = [...prev];
            newProdotti[index] = { ...newProdotti[index], ...updates };
            return newProdotti;
        });
    };

    // Async Select Loaders
    const loadClienti = async (inputValue) => {
        if (!inputValue) return [];
        const res = await ClientiService.getSuggestion(inputValue);
        return res.data.map(c => ({ value: c.id, label: c.denominazione, data: c }));
    };

    const loadAgenti = async (inputValue) => {
        const res = await AgentiService.getSuggestion(inputValue || '');
        return res.data.map(a => ({ value: a.id, label: a.descrizione }));
    };

    const loadProgetti = async (inputValue) => {
        const res = await ProgettiService.getSuggestion(inputValue || '');
        return res.data.map(p => ({ value: p.id, label: p.descrizione }));
    };

    const savePreventivo = async () => {
        if (!formData.numDocumento || !formData.dataDocumento || !formData.idCliente) {
            Swal.fire('Attenzione', 'Numero, Data e Cliente sono obbligatori', 'warning');
            return null;
        }

        if (!prodotti || prodotti.length === 0) {
            Swal.fire('Attenzione', 'Inserire almeno un articolo', 'warning');
            return null;
        }

        try {
            const payload = {
                ...formData,
                dataDocumento: formData.dataDocumento.split('-').reverse().join('/'),
                prodotti: prodotti.map(p => {
                    const vals = getRowValues(p, combos.aliquoteIva);
                    const cleaned = { ...p, prezzoImponibile: vals.imponibile };
                    if (p.tipo === 'A') {
                        delete cleaned.fmDescrizione;
                    } else if (p.tipo === 'F') {
                        delete cleaned.idProdotto;
                        cleaned.fuoriMagazzino = true;
                    } else if (p.tipo === 'N') {
                        cleaned.idProdotto = null;
                        cleaned.fmDescrizione = null;
                        cleaned.prezzo = 0;
                        cleaned.quantita = 0;
                    }
                    return cleaned;
                })
            };

            if (isNew) {
                const response = await PreventiviService.insert(payload);
                // Il backend restituisce il nuovo ID nel payload o direttamente
                return response.data?.payload || response.data?.id || response.data;
            } else {
                await PreventiviService.update(id, payload);
                return id;
            }
        } catch (error) {
            console.error("Error saving:", error);
            const msg = error.response?.data || 'Errore durante il salvataggio';
            Swal.fire('Errore', msg, 'error');
            return null;
        }
    };

    const handleSave = async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (saving) return; // Prevent concurrent calls

        setSaving(true);
        try {
            const savedId = await savePreventivo();
            if (savedId) {
                Swal.fire('Successo', 'Preventivo salvato', 'success').then(() => navigate('/preventivi'));
            }
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = async () => {
        const savedId = await savePreventivo();
        if (!savedId) return; // Save failed or validation error

        try {
            // Use the savedId because for new items 'id' variable might be 'new' or undefined
            const response = await PreventiviService.print(savedId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            printJS({
                printable: url,
                type: 'pdf',
                documentTitle: `Preventivo_${savedId}`
            });

            // Cleanup URL after a delay
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);
            setShowActionsMenu(false);

            // If it was new, we should probably navigate to the detail of the new ID or reload
            if (isNew) {
                navigate(`/preventivi/detail/${savedId}`);
            }
        } catch (error) {
            console.error("Error printing:", error);
            Swal.fire('Errore', 'Errore durante la stampa', 'error');
        }
    };

    const handleExportPdf = async () => {
        const savedId = await savePreventivo();
        if (!savedId) return;

        try {
            const response = await PreventiviService.print(savedId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Preventivo_${savedId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            setShowActionsMenu(false);

            if (isNew) {
                navigate(`/preventivi/detail/${savedId}`);
            }
        } catch (error) {
            console.error("Error exporting PDF:", error);
            Swal.fire('Errore', 'Errore durante l\'esportazione PDF', 'error');
        }
    };



    const formatCurrency = (val) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val || 0);
    };

    if (loading) return <div className="loading-container">Caricamento in corso...</div>;

    return (
        <div className="preventivi-detail-container entity-form-shared">
            <div id="preventivi-content-header">
                <div>
                    <ol className="breadcrumb">
                        <li><Link to="/"><FaHome /> HOME</Link></li>
                        <li><Link to="/preventivi">Elenco preventivi</Link></li>
                        <li className="active"><span>{isNew ? 'Nuovo preventivo' : 'Modifica'}</span></li>
                    </ol>
                    <h1>{isNew ? 'Nuovo preventivo' : `Preventivo ${formData.numDocumento || ''}${formData.particella && formData.particella !== 'null' ? `/${formData.particella}` : ''}`}</h1>
                </div>

                <div className="header-totals">
                    <div className="total-box">
                        <span className="label">Imponibile:</span>
                        <span className="value">{formatCurrency(totals.imponibile)}</span>
                    </div>
                    <div className="total-box">
                        <span className="label">IVA:</span>
                        <span className="value">{formatCurrency(totals.iva)}</span>
                    </div>
                    <div className="total-box highlight">
                        <span className="label">TOTALE:</span>
                        <span className="value">{formatCurrency(totals.totale)}</span>
                    </div>
                </div>
            </div>

            <div className="main-box detail-box">
                <header className="main-box-header">
                    <ul className="nav nav-tabs premium-nav-tabs">
                        <li className={`nav-item ${activeTab === 'generale' ? 'active' : ''}`}>
                            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setActiveTab('generale'); }}>
                                <i className="fa fa-info-circle"></i> Generale
                            </a>
                        </li>
                        <li className={`nav-item ${activeTab === 'articoli' ? 'active' : ''}`}>
                            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setActiveTab('articoli'); }}>
                                <i className="fa fa-list"></i> Articoli ({prodotti.length})
                            </a>
                        </li>
                        <li className={`nav-item ${activeTab === 'scadenze' ? 'active' : ''}`}>
                            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setActiveTab('scadenze'); }}>
                                <i className="fa fa-calendar"></i> Scadenze
                            </a>
                        </li>
                        <li className={`nav-item ${activeTab === 'note' ? 'active' : ''}`}>
                            <a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); setActiveTab('note'); }}>
                                <i className="fa fa-sticky-note"></i> Annotazioni
                            </a>
                        </li>
                    </ul>
                </header>

                <form className="preventivi-detail-form" autoComplete="off">
                    <input type="text" style={{ display: 'none' }} autoComplete="off" />
                    <div className="tab-content premium-tab-content">
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
                                                        autoComplete="off"
                                                    />
                                                <span className="input-group-addon">/</span>
                                                <div style={{ flex: '0 0 130px' }}>
                                                    <CreatableSelect
                                                        isClearable
                                                        options={combos.particelle.map(p => ({ value: p, label: p }))}
                                                        value={formData.particella ? { value: formData.particella, label: formData.particella } : null}
                                                        onChange={(opt) => setFormData(prev => ({ ...prev, particella: opt?.value || '' }))}
                                                        styles={particellaSelectStyles}
                                                        placeholder="-"
                                                        noOptionsMessage={() => "Nuovo..."}
                                                        formatCreateLabel={(inputValue) => `Usa "${inputValue}"`}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="premium-wrench-btn"
                                                    onClick={() => setShowParticelleModal(true)}
                                                    title="Configura suffissi"
                                                >
                                                    <FaWrench />
                                                </button>
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
                                                    onChange={(e) => {
                                                        handleHeaderChange(e);
                                                        if (isNew) fetchNextNum(e.target.value);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="compact-col compact-col-xl">
                                        <EntitySelectGroup
                                            label="Cliente"
                                            loadOptions={loadClienti}
                                            value={formData.idCliente ? { value: formData.idCliente, label: formData.denominazione || formData.denominazioneCliente } : null}
                                            onChange={(opt) => {
                                                const c = opt?.data || {};
                                                setFormData(prev => ({
                                                    ...prev,
                                                    idCliente: opt?.value || null,
                                                    denominazione: opt?.label || '',
                                                    indirizzoIntestazione: c.indirizzo || '',
                                                    cittaIntestazione: c.citta || '',
                                                    capIntestazione: c.cap || '',
                                                    provinciaIntestazione: c.provincia || '',
                                                    nazioneIntestazione: c.nazione || 'Italia',
                                                    partitaIva: c.partitaIva || '',
                                                    codiceFiscale: c.codiceFiscale || '',
                                                    idAgente: c.idAgente || prev.idAgente,
                                                    idListino: c.idListino || '',
                                                    indirizzoDestinazione: c.indirizzo || '',
                                                    cittaDestinazione: c.citta || '',
                                                    capDestinazione: c.cap || '',
                                                    provinciaDestinazione: c.provincia || '',
                                                    nazioneDestinazione: c.nazione || 'Italia',
                                                }));
                                                if (opt?.value) {
                                                    fetchClientIndirizzi(opt.value);
                                                }
                                            }}
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
                                            value={formData.idAgente ? { value: formData.idAgente, label: formData.nomeAgente || formData.agente || formData.descAgente } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idAgente: opt?.value, nomeAgente: opt?.label }))}
                                            ModalComponent={AgentiManagementModal}
                                            title="Gestione Agenti"
                                            placeholder="Seleziona agente..."
                                            widthClass="w-md"
                                        />
                                    </div>
                                </div>

                                <hr />

                                <div className="row mt-4">
                                    <div className="col-md-6">
                                        <div className="premium-card address-card">
                                            <div className="card-header-vibrant d-flex justify-content-between align-items-center">
                                                <span><FaHome /> Intestazione</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-xs btn-outline-light"
                                                    onClick={() => openAddressModal('intestazione')}
                                                    title="Cambia indirizzo"
                                                >
                                                    <FaMapMarkerAlt /> Cambia
                                                </button>
                                            </div>
                                            <div className="card-body">
                                                <div className="row mb-4">
                                                    <div className="col-md-12">
                                                        <label className="premium-label">Indi<span>riz</span>zo</label>
                                                        <input type="text" className="form-control premium-input" name="indirizzoIntestazione" value={formData.indirizzoIntestazione} onChange={handleHeaderChange} autoComplete="off" />
                                                    </div>
                                                </div>
                                                <div className="row mb-4">
                                                    <div className="col-md-7">
                                                        <label className="premium-label">Cit<span>tà</span></label>
                                                        <input type="text" className="form-control premium-input" name="cittaIntestazione" value={formData.cittaIntestazione} onChange={handleHeaderChange} autoComplete="off" />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <label className="premium-label">Pr<span>ov</span>.</label>
                                                        <input type="text" className="form-control premium-input" name="provinciaIntestazione" value={formData.provinciaIntestazione} onChange={handleHeaderChange} maxLength="2" autoComplete="off" />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="premium-label">C<span>AP</span></label>
                                                        <input type="text" className="form-control premium-input" name="capIntestazione" value={formData.capIntestazione} onChange={handleHeaderChange} autoComplete="off" />
                                                    </div>
                                                </div>
                                                <div className="row mb-4">
                                                    <div className="col-md-12">
                                                        <label className="premium-label"><FaGlobe style={{marginRight: '5px'}}/> Na<span>zio</span>ne</label>
                                                        <NazioneSelect
                                                            value={formData.nazioneIntestazione}
                                                            onChange={(val) => setFormData(prev => ({ ...prev, nazioneIntestazione: val }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <label className="premium-label">Partita IVA</label>
                                                        <input type="text" className="form-control premium-input" name="partitaIva" value={formData.partitaIva || ''} onChange={handleHeaderChange} autoComplete="off" />
                                                    </div>
                                                    <div className="col-md-6">
                                                        <label className="premium-label">Codice Fiscale</label>
                                                        <input type="text" className="form-control premium-input" name="codiceFiscale" value={formData.codiceFiscale || ''} onChange={handleHeaderChange} autoComplete="off" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="premium-card address-card">
                                            <div className="card-header-vibrant d-flex justify-content-between align-items-center">
                                                <span><FaTruck /> Destinazione Consegna</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-xs btn-outline-light"
                                                    onClick={() => openAddressModal('destinazione')}
                                                    title="Cambia destinazione"
                                                >
                                                    <FaMapMarkerAlt /> Cambia
                                                </button>
                                            </div>
                                            <div className="card-body">
                                                <div className="row mb-4">
                                                    <div className="col-md-12">
                                                        <label className="premium-label">Indi<span>riz</span>zo</label>
                                                        <input type="text" className="form-control premium-input" name="indirizzoDestinazione" value={formData.indirizzoDestinazione} onChange={handleHeaderChange} autoComplete="off" />
                                                    </div>
                                                </div>
                                                <div className="row mb-4">
                                                    <div className="col-md-7">
                                                        <label className="premium-label">Cit<span>tà</span></label>
                                                        <input type="text" className="form-control premium-input" name="cittaDestinazione" value={formData.cittaDestinazione} onChange={handleHeaderChange} autoComplete="off" />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <label className="premium-label">Pr<span>ov</span>.</label>
                                                        <input type="text" className="form-control premium-input" name="provinciaDestinazione" value={formData.provinciaDestinazione} onChange={handleHeaderChange} maxLength="2" autoComplete="off" />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="premium-label">C<span>AP</span></label>
                                                        <input type="text" className="form-control premium-input" name="capDestinazione" value={formData.capDestinazione} onChange={handleHeaderChange} autoComplete="off" />
                                                    </div>
                                                </div>
                                                <div className="row mb-4">
                                                    <div className="col-md-12">
                                                        <label className="premium-label"><FaGlobe style={{marginRight: '5px'}}/> Na<span>zio</span>ne</label>
                                                        <NazioneSelect
                                                            value={formData.nazioneDestinazione}
                                                            onChange={(val) => setFormData(prev => ({ ...prev, nazioneDestinazione: val }))}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <div className="col-md-12">
                                                        <label className="premium-label">Note Consegna</label>
                                                        <input type="text" className="form-control premium-input" name="noteConsegna" value={formData.noteConsegna || ''} onChange={handleHeaderChange} placeholder="Es. Citofono, orari..." autoComplete="off" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row mb-3">
                                    {authService.getConfig()?.PROGETTI === '1' && (
                                        <div className="col-md-4">
                                            <EntitySelectGroup
                                                label="Progetto"
                                                isAsync={false}
                                                options={(combos.progetti || []).map(p => ({ value: p.id, label: p.descrizione }))}
                                                value={formData.idProgetto ? { value: formData.idProgetto, label: formData.nomeProgetto || formData.progetto } : null}
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
                        </div>

                        {/* Tab Pagamento/Scadenze */}
                        <div className={`tab-pane ${activeTab === 'scadenze' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Tipo Pagamento"
                                            isAsync={false}
                                            options={(combos.tipiPagamento || []).map(tp => ({ value: tp.id, label: tp.descrizione }))}
                                            value={formData.idTipoPagamento ? { value: formData.idTipoPagamento, label: combos.tipiPagamento.find(tp => tp.id === formData.idTipoPagamento)?.descrizione } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idTipoPagamento: opt?.value }))}
                                            ModalComponent={TipiPagamentoManagementModal}
                                            modalProps={{}}
                                            title="Gestione Tipi Pagamento"
                                            placeholder="Seleziona..."
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Listino"
                                            isAsync={false}
                                            options={(combos.listini || []).map(l => ({ value: l.id, label: l.descrizione }))}
                                            value={formData.idListino ? { value: formData.idListino, label: combos.listini.find(l => l.id === formData.idListino)?.descrizione } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idListino: opt?.value || '' }))}
                                            ModalComponent={ListiniManagementModal}
                                            title="Gestione Listini"
                                            placeholder="Predefinito"
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Nostra Banca"
                                            isAsync={false}
                                            options={(combos.risorse || []).map(r => ({ value: r.id, label: r.descrizione }))}
                                            value={formData.idNsBanca ? { value: formData.idNsBanca, label: combos.risorse.find(r => r.id === formData.idNsBanca)?.descrizione } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idNsBanca: opt?.value }))}
                                            ModalComponent={RisorseManagementModal}
                                            modalProps={{ initialTipologia: 'BA' }}
                                            title="Gestione Banche"
                                            placeholder="Seleziona banca..."
                                        />
                                    </div>
                                </div>
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <ScadenzeTable
                                            idTipoPagamento={formData.idTipoPagamento}
                                            dataDocumento={formData.dataDocumento}
                                            totaleDocumento={totals.totale}
                                            scadenzeIniziali={formData.listaScadenzePagamentiDocumento || []}
                                            conti={combos.risorse || []}
                                            onScadenzeChange={(newScadenze) => {
                                                setFormData(prev => ({ ...prev, listaScadenzePagamentiDocumento: newScadenze }));
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Articoli */}
                        <div className={`tab-pane ${activeTab === 'articoli' ? 'active' : ''}`}>
                            <DocumentRows
                                rows={prodotti}
                                onRowChange={handleRowChange}
                                onRowUpdate={handleRowUpdate}
                                onDeleteRow={handleDeleteRow}
                                onAddRow={(newRow) => {
                                    setProdotti(prev => [...prev, newRow]);
                                    setActiveTab('articoli');
                                }}
                                combos={combos}
                                isCeramica={isCeramica}
                                showDownloadColumn={false}
                                idListino={formData.idListino}
                            />
                        </div>

                        {/* Tab Note */}
                        <div className={`tab-pane ${activeTab === 'note' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div className="form-group">
                                    <label>Annotazione Estesa (verrà stampata in calce o su pagina separata)</label>
                                    <textarea className="form-control" rows="15" name="annotazioneEstesa" value={formData.annotazioneEstesa || ''} onChange={handleHeaderChange} placeholder="Inserisci qui eventuali termini, condizioni or descrizioni dettagliate..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>

                <footer className="main-box-footer detail-footer">
                    <button type="button" className="btn btn-premium-cancel" onClick={() => navigate('/preventivi')}>
                        <FaArrowLeft /> Torna ai preventivi
                    </button>
                    <div className="footer-right">
                        <div className="split-btn-container">
                            <button
                                type="button"
                                className={`btn-premium-save split-btn-main ${saving ? 'is-saving' : ''}`}
                                onClick={handleSave}
                                disabled={saving || loading}
                                style={{ minWidth: '130px' }}
                            >
                                {saving ? (
                                    <>
                                        <i className="fa fa-spinner fa-spin mr-2"></i> Salvataggio...
                                    </>
                                ) : (
                                    <>
                                        <FaSave /> Salva
                                    </>
                                )}
                            </button>
                            <button type="button" className="split-btn-toggle" onClick={() => !saving && setShowActionsMenu(!showActionsMenu)} disabled={saving || loading}>
                                <FaCaretDown />
                            </button>
                            {showActionsMenu && (
                                <div className="split-btn-menu show">
                                    <button type="button" className="split-btn-item" onClick={handleSave}>
                                        <FaSave /> Salva solo
                                    </button>
                                    <button type="button" className="split-btn-item" onClick={handlePrint}>
                                        <FaPrint /> Stampa
                                    </button>
                                    <button type="button" className="split-btn-item" onClick={handleExportPdf}>
                                        <FaFilePdf /> Esporta PDF
                                    </button>
                                    <div className="action-dropdown-divider"></div>
                                    <button type="button" className="split-btn-item" onClick={async () => {
                                        const savedId = await savePreventivo();
                                        if (savedId) navigate(`/conf-ordine/new?fromPreventivi=${savedId}`);
                                    }}>
                                        <FaArrowRight /> Genera conferma ordine
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </footer>
                {/* Modals */}
                <ProgettoQuickModal
                    isOpen={showProgettoModal}
                    onClose={() => setShowProgettoModal(false)}
                    onSave={(newProj) => {
                        setFormData(prev => ({
                            ...prev,
                            idProgetto: newProj.id,
                            nomeProgetto: `${newProj.codice} - ${newProj.descrizione}`
                        }));
                    }}
                />
                <IndirizziSelectionModal
                    isOpen={showAddressModal}
                    onClose={() => setShowAddressModal(false)}
                    indirizzi={clientIndirizzi}
                    onSelect={handleSelectIndirizzo}
                    title={addressTarget === 'intestazione' ? "Seleziona Indirizzo Intestazione" : "Seleziona Indirizzo Consegna"}
                />
                <ParticelleManagementModal
                    isOpen={showParticelleModal}
                    onClose={() => setShowParticelleModal(false)}
                    currentParticelle={combos.particelle}
                    onSave={(newList) => {
                        setCombos(prev => ({ ...prev, particelle: newList }));
                    }}
                />
                <UnitaMisuraManagementModal
                    isOpen={showUMModal}
                    onClose={() => setShowUMModal(false)}
                    onSave={fetchCombos}
                />
                <AliquoteIvaManagementModal
                    isOpen={showIVAModal}
                    onClose={() => setShowIVAModal(false)}
                    onSave={fetchCombos}
                />
            </div>
        </div>
    );
};

export default PreventiviDetail;
