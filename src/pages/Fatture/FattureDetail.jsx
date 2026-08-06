import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import FattureService from '../../services/FattureService';
import DDTService from '../../services/DDTService';
import PreventiviService from '../../services/PreventiviService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import ArticoliService from '../../services/ArticoliService';
import ConfOrdineService from '../../services/ConfOrdineService';
import { FaSave, FaArrowLeft, FaPlus, FaTrash, FaPrint, FaFilePdf, FaWrench, FaHome, FaTruck, FaMapMarkerAlt, FaCaretDown, FaArrowRight, FaPaperPlane, FaExclamationTriangle, FaGlobe, FaBoxOpen } from 'react-icons/fa';
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
import CausaliEsigibilitaDifferitaManagementModal from '../../components/modals/CausaliEsigibilitaDifferitaManagementModal';
import CausaliEsigibilitaDifferitaService from '../../services/CausaliEsigibilitaDifferitaService';
import ParticelleManagementModal from '../../components/modals/ParticelleManagementModal';
import ListiniManagementModal from '../../components/modals/ListiniManagementModal';
import NazioneSelect from '../../components/common/NazioneSelect';

import authService from '../../services/authService';
import DocumentRows from '../../components/common/DocumentRows';
import ScadenzeTable from '../../components/common/ScadenzeTable';
import ComunicazioniTimeline from '../../components/ComunicazioniTimeline';
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
    const fromPreventiviId = searchParams.get('fromPreventivi');
    const fromConfermeId = searchParams.get('fromConferme');
    const tipoParam = searchParams.get('tipo');
    const eletParam = searchParams.get('elet');
    const isNew = !id || id === 'new';
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('generale'); // legale, articoli, note, pagamento
    const [isCeramica, setIsCeramica] = useState(false);
    const [ritenutaEnabled, setRitenutaEnabled] = useState(false);
    const [rivalsaEnabled, setRivalsaEnabled] = useState(false);
    const [dicituraRitenuta, setDicituraRitenuta] = useState('');
    const [dicituraRivalsa, setDicituraRivalsa] = useState('');
    const [bolloAutomaticoEnabled, setBolloAutomaticoEnabled] = useState(false);


    const [formData, setFormData] = useState({
        numDocumento: '',
        particella: '',
        dataDocumento: new Date().toISOString().split('T')[0],
        idCliente: null,
        nomeCliente: '',
        denominazioneCliente: '',
        idAgente: null,
        nomeAgente: '',
        agente: '',
        idProgetto: null,
        nomeProgetto: '',
        progetto: '',
        idListino: '',
        idTipoPagamento: null,
        idNsBanca: null,
        descrizioneBanca: '',
        iban: '',
        cittaIntestazione: '',
        indirizzoIntestazione: '',
        capIntestazione: '',
        provinciaIntestazione: '',
        nazioneIntestazione: 'Italia',
        codiceFiscale: '',
        partitaIva: '',
        cittaDestinazione: '',
        indirizzoDestinazione: '',
        capDestinazione: '',
        provinciaDestinazione: '',
        nazioneDestinazione: 'Italia',
        noteConsegna: '',
        annotazioneEstesa: '',
        tipoFattura: 'FATTURA',
        flFatturaElettronica: 1, // Default to Electronic
        pec: '',
        codiceUfficioDestinazione: '',
        causale: '',
        esigibilitaDifferita: 0,
        idCausaleEsigibilitaDifferita: null,
        flRitenutaAcconto: 0,
        percRitenutaAcconto: 20,
        importoRitenutaAcconto: 0,
        tipoRitenuta: '',
        flRivalsaInps: 0,
        percRivalsaInps: 4,
        importoRivalsaInps: 0,
        tipoCassaInps: 'TC22',
        percImponibileRivalsa: 100,
        idAliquotaIvaRivalsa: 0,
        sconto: 0,
        listaScadenzePagamentiDocumento: [],
        statoFatturaElettronica: 'BO'
    });

    const [globalConfigs, setGlobalConfigs] = useState(null);
    const isEnabledGlobal = (key) => !globalConfigs || globalConfigs[key] === '1';

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
        progetti: [],
        causaliEsigibilitaDifferita: []
    });

    const [clientIndirizzi, setClientIndirizzi] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressTarget, setAddressTarget] = useState('intestazione');
    const [isLocked, setIsLocked] = useState(false);
    const [showProgettoModal, setShowProgettoModal] = useState(false);
    const [showCausaleEsigibilitaModal, setShowCausaleEsigibilitaModal] = useState(false);
    const [showSaveMenu, setShowSaveMenu] = useState(false);
    const [showParticelleModal, setShowParticelleModal] = useState(false);
    const saveMenuRef = useRef(null);
    const isReadOnly = !isNew && ['IN', 'AC', 'MC', 'RF'].includes(formData.statoFatturaElettronica);

    // Derived locking state
    useEffect(() => {
        const lockedStatuses = ['DI', 'IN', 'AC', 'NS', 'MC', 'RF'];
        setIsLocked(!isNew && lockedStatuses.includes(formData.statoFatturaElettronica));
    }, [formData.statoFatturaElettronica, isNew]);

    const handleUnlock = () => {
        Swal.fire({
            title: 'Sbloccare il documento?',
            text: "Il documento verrà riportato in stato 'Bozza' per consentire le modifiche. Se è una fattura elettronica già inviata, assicurati di sapere cosa stai facendo.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#03a9f4',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Sì, sblocca',
            cancelButtonText: 'Annulla'
        }).then((result) => {
            if (result.isConfirmed) {
                setFormData(prev => ({ ...prev, statoFatturaElettronica: 'BO' }));
                setIsLocked(false);
            }
        });
    };

    const getDocTitle = () => {
        let prefix = isNew ? 'Nuova ' : 'Modifica ';
        let type = 'Fattura';
        if (formData.tipoFattura === 'FATTURA_ACCOMPAGNATORIA') type = 'Fattura Accompagnatoria';
        if (formData.tipoFattura === 'FATTURA_PROFORMA') type = 'Fattura Pro Forma';
        if (formData.tipoFattura === 'NOTA_DEBITO') type = 'Nota di Debito';
        if (formData.tipoFattura === 'FATTURA_SEMPLIFICATA') type = 'Fattura Semplificata (TD07)';
        return prefix + type;
    };

    useEffect(() => {
        checkCeramica();
        fetchCombos();
        fetchGlobalConfigs();
        fetchFatturazionePreferences();
        if (!isNew) {
            fetchData();
        } else {

            if (tipoParam || eletParam) {
                setFormData(prev => ({
                    ...prev,
                    tipoFattura: tipoParam || prev.tipoFattura,
                    flFatturaElettronica: eletParam === '1' ? 1 : 0
                }));
            }

            if (fromDDTId) {
                fetchDataFromDDT(fromDDTId);
            } else if (fromPreventiviId) {
                fetchDataFromPreventivo(fromPreventiviId);
            } else if (fromConfermeId) {
                fetchDataFromConfOrdine(fromConfermeId);
            } else {
                fetchNextNum(formData.dataDocumento, (tipoParam === 'FATTURA_PROFORMA') ? 0 : 1, tipoParam || 'FATTURA');
            }
        }

        const handleClickOutside = (event) => {
            if (saveMenuRef.current && !saveMenuRef.current.contains(event.target)) {
                setShowSaveMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [id, searchParams]);

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
        } catch (error) {
            console.error(error);
        }
    };

    const fetchGlobalConfigs = async () => {
        try {
            const res = await ConfigurazioneService.getByDomain('GLOBAL');
            if (res.data) setGlobalConfigs(res.data);
        } catch (err) {
            console.error("Error loading global configurations:", err);
        }
    };

    const fetchFatturazionePreferences = async () => {
        try {
            const res = await ConfigurazioneService.getByDomain('FATTURAZIONE');
            if (res.data) {
                const prefs = res.data;
                const isRitenutaEnabled = prefs.EMETTI_RITENUTA === '1';
                setRitenutaEnabled(isRitenutaEnabled);
                setBolloAutomaticoEnabled(prefs.ABILITA_BOLLO_AUTOMATICO === '1');
                
                const defaultType = prefs.DEFAULT_TIPO_FATTURA || 'FATTURA';
                
                const dRitenuta = prefs.DICITURA_RITENUTA || 'Soggetto a ritenuta d\'acconto ai sensi del DPR 600/73';
                const dRivalsa = prefs.DICITURA_RIVALSA || 'Contributo previdenziale 4% ex art. 2 comma 26 Legge 335/95';
                setDicituraRitenuta(dRitenuta);
                setDicituraRivalsa(dRivalsa);

                setFormData(prev => {
                    const isRitenuta = isRitenutaEnabled || prev.flRitenutaAcconto === 1;
                    const isRivalsa = (prefs.EMETTI_RIVALSA_INPS === '1') || prev.flRivalsaInps === 1;
                    
                    let nextData = {
                        ...prev,
                        tipoFattura: (isNew && !tipoParam && (fromDDTId || fromPreventiviId || fromConfermeId)) ? defaultType : prev.tipoFattura,
                        flRitenutaAcconto: isRitenuta ? 1 : prev.flRitenutaAcconto,
                        percRitenutaAcconto: prefs.PERC_RITENUTA ? parseFloat(prefs.PERC_RITENUTA) : prev.percRitenutaAcconto,
                        tipoRitenuta: prefs.TIPO_RITENUTA ? prefs.TIPO_RITENUTA : prev.tipoRitenuta,
                        flRivalsaInps: isRivalsa ? 1 : prev.flRivalsaInps,
                        percRivalsaInps: prefs.PERC_RIVALSA_INPS ? parseFloat(prefs.PERC_RIVALSA_INPS) : prev.percRivalsaInps,
                        percImponibileRivalsa: prefs.PERC_IMPONIBILE_RIVALSA ? parseFloat(prefs.PERC_IMPONIBILE_RIVALSA) : 100,
                        idAliquotaIvaRivalsa: prefs.ID_ALIQUOTA_IVA_RIVALSA ? parseInt(prefs.ID_ALIQUOTA_IVA_RIVALSA) : 0,
                        tipoCassaInps: prefs.TIPO_CASSA_INPS ? prefs.TIPO_CASSA_INPS : prev.tipoCassaInps
                    };

                    // Auto-inject legal notes for new documents if flags are active
                    if (isNew) {
                        let newNote = nextData.annotazioneEstesa || '';
                        if (isRitenuta && dRitenuta && !newNote.includes(dRitenuta)) {
                            newNote = newNote + (newNote ? '\n' : '') + dRitenuta;
                        }
                        if (isRivalsa && dRivalsa && !newNote.includes(dRivalsa)) {
                            newNote = newNote + (newNote ? '\n' : '') + dRivalsa;
                        }
                        nextData.annotazioneEstesa = newNote;
                    }
                    return nextData;
                });

                // Auto-set flFatturaElettronica and fetch numbering
                if (isNew && (fromDDTId || fromPreventiviId || fromConfermeId)) {
                   const effectiveType = tipoParam || defaultType;
                   const effectiveElet = (effectiveType === 'FATTURA_PROFORMA') ? 0 : 1;
                   
                   setFormData(prev => ({
                       ...prev,
                       flFatturaElettronica: effectiveElet
                   }));

                   fetchNextNum(formData.dataDocumento, effectiveElet, effectiveType);
                }
            }
        } catch (error) {
            console.error("Errore nel recupero delle preferenze fatturazione", error);
        }
    };


    const fetchDataFromDDT = async (ddtIdsStr) => {
        setLoading(true);
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
                            tipo: p.idProdotto ? 'A' : (p.fmDescrizione ? 'F' : 'N'),
                            scarica: 0, // <--- Da DDT: NON scaricare magazzino (gia' scaricato al salvataggio del DDT)
                            daDDT: true
                        }));
                        allProdotti = [...allProdotti, ...mappedProdotti];
                    }
                }
            }

            setProdotti(allProdotti);

            if (firstDDTData) {
                await loadClientAddresses(firstDDTData.idCliente, true);
                setFormData(prev => ({
                    ...prev,
                    idCliente: firstDDTData.idCliente,
                    denominazioneCliente: firstDDTData.denominazioneCliente || '',
                    soggetto: firstDDTData.soggetto || (firstDDTData.idCliente ? { value: firstDDTData.idCliente, label: firstDDTData.denominazioneCliente || '' } : null),
                    idAgente: firstDDTData.idAgente,
                    agente: firstDDTData.agente,
                    idTipoPagamento: firstDDTData.idTipoPagamento || prev.idTipoPagamento,
                    idProgetto: firstDDTData.idProgetto,
                    nomeProgetto: firstDDTData.nomeProgetto,
                    idListino: firstDDTData.idListino || prev.idListino || '',
                    codiceFiscale: firstDDTData.codiceFiscale || prev.codiceFiscale || '',
                    partitaIva: firstDDTData.partitaIva || prev.partitaIva || '',
                    ...(firstDDTData.indirizzoIntestazione ? { indirizzoIntestazione: firstDDTData.indirizzoIntestazione } : {}),
                    ...(firstDDTData.cittaIntestazione ? { cittaIntestazione: firstDDTData.cittaIntestazione } : {}),
                    ...(firstDDTData.capIntestazione ? { capIntestazione: firstDDTData.capIntestazione } : {}),
                    ...(firstDDTData.provinciaIntestazione ? { provinciaIntestazione: firstDDTData.provinciaIntestazione } : {}),
                    ...(firstDDTData.indirizzoDestinazione ? { indirizzoDestinazione: firstDDTData.indirizzoDestinazione } : {}),
                    ...(firstDDTData.cittaDestinazione ? { cittaDestinazione: firstDDTData.cittaDestinazione } : {}),
                    ...(firstDDTData.capDestinazione ? { capDestinazione: firstDDTData.capDestinazione } : {}),
                    ...(firstDDTData.provinciaDestinazione ? { provinciaDestinazione: firstDDTData.provinciaDestinazione } : {}),
                }));
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Errore nel caricamento dati dal DDT', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDataFromPreventivo = async (prevIdsStr) => {
        setLoading(true);
        try {
            const ids = prevIdsStr.split(',');
            let allProdotti = [];
            let firstPrevData = null;

            for (const prevId of ids) {
                const res = await PreventiviService.getById(prevId);
                if (res.data && res.data.payload) {
                    const prevData = res.data.payload;
                    if (!firstPrevData) firstPrevData = prevData;

                    // Add a reference note row
                    const refNum = prevData.numDocumento || prevData.numeroDocumento || prevId || '';
                    const refDate = prevData.dataDocumento || prevData.dataDoc || '';
                    const refText = `Rif. preventivo num. ${refNum} del ${refDate}`;

                    allProdotti.push({
                        id: 0,
                        idDocumento: 0,
                        tipo: 'N',
                        fmDescrizione: refText,
                        quantita: 0,
                        prezzo: 0,
                        sconto: 0,
                        iva: 0
                    });

                    // Add products of this preventivo
                    if (prevData.prodotti) {
                        const mappedProdotti = prevData.prodotti.map(p => ({
                            ...p,
                            id: 0,
                            idDocumento: 0,
                            tipo: p.idProdotto ? 'A' : (p.fmDescrizione ? 'F' : 'N'),
                            scarica: 1
                        }));
                        allProdotti = [...allProdotti, ...mappedProdotti];
                    }
                }
            }

            setProdotti(allProdotti);

            if (firstPrevData) {
                // Load client addresses first (autoFill=true for defaults),
                // then overlay with any non-null address values from the preventivo
                await loadClientAddresses(firstPrevData.idCliente, true);
                setFormData(prev => ({
                    ...prev,
                    idCliente: firstPrevData.idCliente,
                    denominazioneCliente: firstPrevData.denominazioneCliente || '',
                    soggetto: firstPrevData.soggetto || (firstPrevData.idCliente ? { value: firstPrevData.idCliente, label: firstPrevData.denominazioneCliente || '' } : null),
                    idAgente: firstPrevData.idAgente,
                    agente: firstPrevData.agente,
                    idTipoPagamento: firstPrevData.idTipoPagamento || prev.idTipoPagamento,
                    idProgetto: firstPrevData.idProgetto,
                    nomeProgetto: firstPrevData.nomeProgetto,
                    idListino: firstPrevData.idListino || prev.idListino || '',
                    codiceFiscale: firstPrevData.codiceFiscale || prev.codiceFiscale || '',
                    partitaIva: firstPrevData.partitaIva || prev.partitaIva || '',
                    ...(firstPrevData.indirizzoIntestazione ? { indirizzoIntestazione: firstPrevData.indirizzoIntestazione } : {}),
                    ...(firstPrevData.cittaIntestazione ? { cittaIntestazione: firstPrevData.cittaIntestazione } : {}),
                    ...(firstPrevData.capIntestazione ? { capIntestazione: firstPrevData.capIntestazione } : {}),
                    ...(firstPrevData.provinciaIntestazione ? { provinciaIntestazione: firstPrevData.provinciaIntestazione } : {}),
                    ...(firstPrevData.nazioneIntestazione ? { nazioneIntestazione: firstPrevData.nazioneIntestazione } : {}),
                    ...(firstPrevData.indirizzoDestinazione ? { indirizzoDestinazione: firstPrevData.indirizzoDestinazione } : {}),
                    ...(firstPrevData.cittaDestinazione ? { cittaDestinazione: firstPrevData.cittaDestinazione } : {}),
                    ...(firstPrevData.capDestinazione ? { capDestinazione: firstPrevData.capDestinazione } : {}),
                    ...(firstPrevData.provinciaDestinazione ? { provinciaDestinazione: firstPrevData.provinciaDestinazione } : {}),
                    ...(firstPrevData.nazioneDestinazione ? { nazioneDestinazione: firstPrevData.nazioneDestinazione } : {}),
                }));
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Errore nel caricamento dati dal preventivo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchDataFromConfOrdine = async (confIdsStr) => {
        setLoading(true);
        try {
            const ids = confIdsStr.split(',');
            let allProdotti = [];
            let firstConfData = null;

            for (const confId of ids) {
                const res = await ConfOrdineService.getById(confId);
                if (res.data && res.data.payload) {
                    const confData = res.data.payload;
                    if (!firstConfData) firstConfData = confData;

                    // Aggiunge riga di riferimento
                    const refNum = confData.numDocumento || confData.numeroDocumento || confId || '';
                    const refDate = confData.dataDocumento || confData.dataDoc || '';
                    const refText = `Rif. conferma d'ordine num. ${refNum} del ${refDate}`;

                    allProdotti.push({
                        id: 0,
                        idDocumento: 0,
                        tipo: 'N',
                        fmDescrizione: refText,
                        quantita: 0,
                        prezzo: 0,
                        sconto: 0,
                        iva: 0
                    });

                    // Aggiunge prodotti della conferma
                    if (confData.prodotti) {
                        const mappedProdotti = confData.prodotti.map(p => ({
                            ...p,
                            id: 0,
                            idDocumento: 0,
                            tipo: p.idProdotto ? 'A' : (p.fmDescrizione ? 'F' : 'N'),
                            scarica: 1 // <--- Da Conf Ordine: scarica magazzino
                        }));
                        allProdotti = [...allProdotti, ...mappedProdotti];
                    }
                }
            }

            setProdotti(allProdotti);

            if (firstConfData) {
                await loadClientAddresses(firstConfData.idCliente, true);
                setFormData(prev => ({
                    ...prev,
                    idCliente: firstConfData.idCliente,
                    denominazioneCliente: firstConfData.denominazioneCliente || '',
                    soggetto: firstConfData.soggetto || (firstConfData.idCliente ? { value: firstConfData.idCliente, label: firstConfData.denominazioneCliente || '' } : null),
                    idAgente: firstConfData.idAgente,
                    agente: firstConfData.agente,
                    idTipoPagamento: firstConfData.idTipoPagamento || prev.idTipoPagamento,
                    idProgetto: firstConfData.idProgetto,
                    nomeProgetto: firstConfData.nomeProgetto,
                    idListino: firstConfData.idListino || prev.idListino || '',
                    codiceFiscale: firstConfData.codiceFiscale || prev.codiceFiscale || '',
                    partitaIva: firstConfData.partitaIva || prev.partitaIva || '',
                    ...(firstConfData.indirizzoIntestazione ? { indirizzoIntestazione: firstConfData.indirizzoIntestazione } : {}),
                    ...(firstConfData.cittaIntestazione ? { cittaIntestazione: firstConfData.cittaIntestazione } : {}),
                    ...(firstConfData.capIntestazione ? { capIntestazione: firstConfData.capIntestazione } : {}),
                    ...(firstConfData.provinciaIntestazione ? { provinciaIntestazione: firstConfData.provinciaIntestazione } : {}),
                    ...(firstConfData.nazioneIntestazione ? { nazioneIntestazione: firstConfData.nazioneIntestazione } : {}),
                    ...(firstConfData.indirizzoDestinazione ? { indirizzoDestinazione: firstConfData.indirizzoDestinazione } : {}),
                    ...(firstConfData.cittaDestinazione ? { cittaDestinazione: firstConfData.cittaDestinazione } : {}),
                    ...(firstConfData.capDestinazione ? { capDestinazione: firstConfData.capDestinazione } : {}),
                    ...(firstConfData.provinciaDestinazione ? { provinciaDestinazione: firstConfData.provinciaDestinazione } : {}),
                    ...(firstConfData.nazioneDestinazione ? { nazioneDestinazione: firstConfData.nazioneDestinazione } : {}),
                }));
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', "Errore nel caricamento dati dalla conferma d'ordine", 'error');
        } finally {
            setLoading(false);
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
        if (!clientId) return;
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

                // Trova la prima PEC disponibile tra i contatti
                const firstPec = (clientFull.elencoContatti || []).find(c => c.pec)?.pec || '';

                setFormData(prev => ({
                    ...prev,
                    ...(header ? {
                        indirizzoIntestazione: header.indirizzo || '',
                        cittaIntestazione: header.citta || '',
                        capIntestazione: header.cap || '',
                        provinciaIntestazione: header.provincia || '',
                        nazioneIntestazione: header.nazione || 'Italia',
                        codiceUfficioDestinazione: header.codiceUfficio || '',
                    } : {}),
                    ...(shipping ? {
                        indirizzoDestinazione: shipping.indirizzo || '',
                        cittaDestinazione: shipping.citta || '',
                        capDestinazione: shipping.cap || '',
                        provinciaDestinazione: shipping.provincia || '',
                        nazioneDestinazione: shipping.nazione || 'Italia',
                    } : {}),
                    partitaIva: clientFull.partitaIva || prev.partitaIva || '',
                    codiceFiscale: clientFull.codiceFiscale || prev.codiceFiscale || '',
                    idTipoPagamento: clientFull.idTipoPagamento || prev.idTipoPagamento,
                    idListino: clientFull.idListino || prev.idListino || '',
                    pec: firstPec || clientFull.pecPrincipale || prev.pec || '',
                    codiceUfficioDestinazione: (header?.codiceUfficio || shipping?.codiceUfficio || indirizzi.find(i => i.codiceUfficio)?.codiceUfficio) || prev.codiceUfficioDestinazione || ''
                }));
            }
        } catch (error) {
            console.error("Error loading client addresses:", error);
        }
    };    const handleHeaderChange = (e) => {
        const { name, value, type, checked } = e.target;
        let newValue = type === 'checkbox' ? (checked ? 1 : 0) : value;

        setFormData(prev => {
            let nextData = { ...prev, [name]: newValue };
            
            // Auto-append legal diciture when toggling checkboxes
            if (name === 'flRitenutaAcconto' && newValue === 1 && dicituraRitenuta) {
                if (!nextData.annotazioneEstesa || !nextData.annotazioneEstesa.includes(dicituraRitenuta)) {
                    nextData.annotazioneEstesa = (nextData.annotazioneEstesa || '') + 
                        (nextData.annotazioneEstesa ? '\n' : '') + dicituraRitenuta;
                }
            }
            if (name === 'flRivalsaInps' && newValue === 1 && dicituraRivalsa) {
                if (!nextData.annotazioneEstesa || !nextData.annotazioneEstesa.includes(dicituraRivalsa)) {
                    nextData.annotazioneEstesa = (nextData.annotazioneEstesa || '') + 
                        (nextData.annotazioneEstesa ? '\n' : '') + dicituraRivalsa;
                }
            }
            
            // Handle dependent logic for date/type
            if ((name === 'dataDocumento' || name === 'tipoFattura') && isNew) {
                fetchNextNum(nextData.dataDocumento, nextData.flFatturaElettronica, nextData.tipoFattura);
            }
            
            // Auto-set flFatturaElettronica based on tipoFattura
            if (name === 'tipoFattura') {
                nextData.flFatturaElettronica = (newValue === 'FATTURA_PROFORMA') ? 0 : 1;
            }

            if ((name === 'dataDocumento' || name === 'tipoFattura' || name === 'flFatturaElettronica') && isNew) {
                fetchNextNum(nextData.dataDocumento, nextData.flFatturaElettronica, nextData.tipoFattura);
            }
            return nextData;
        });
    };

    const handleListinoChange = (opt) => {
        const newListinoId = opt?.value || '';
        const oldListinoId = formData.idListino;

        if (newListinoId === oldListinoId) return;

        setFormData(prev => ({ ...prev, idListino: newListinoId }));

        const productRows = prodotti.filter(p => p.idProdotto);
        if (productRows.length > 0) {
            Swal.fire({
                title: 'Aggiornare i prezzi?',
                text: "Hai cambiato il listino. Vuoi aggiornare i prezzi degli articoli già inseriti?",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#03a9f4',
                cancelButtonColor: '#95a5a6',
                confirmButtonText: 'Sì, aggiorna',
                cancelButtonText: 'No, mantieni'
            }).then((result) => {
                if (result.isConfirmed) {
                    recalculatePrices(newListinoId);
                }
            });
        }
    };

    const recalculatePrices = async (listinoId) => {
        setLoading(true);
        try {
            const newProdotti = [...prodotti];
            for (let i = 0; i < newProdotti.length; i++) {
                const p = newProdotti[i];
                if (p.idProdotto) {
                    try {
                        const res = await ArticoliService.getArticlePrice(p.idProdotto, listinoId);
                        if (res.data && res.data.prezzo !== undefined) {
                            newProdotti[i] = { ...newProdotti[i], prezzo: res.data.prezzo };
                        }
                    } catch (err) {
                        console.error(`Error fetching price for product ${p.idProdotto}:`, err);
                    }
                }
            }
            setProdotti(newProdotti);
            Swal.fire({
                title: 'Aggiornati!',
                text: 'I prezzi sono stati aggiornati correttamente.',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            console.error("Error recalculating prices:", error);
            Swal.fire('Errore', 'Si è verificato un errore durante il ricalcolo dei prezzi.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRowChange = (index, field, value) => {
        setProdotti(prev => {
            const newProdotti = [...prev];
            newProdotti[index] = { ...newProdotti[index], [field]: value };
            return newProdotti;
        });
    };

    const toggleScarica = (idx) => {
        setProdotti(prev => {
            const newP = [...prev];
            const cur = newP[idx].scarica === 0 ? 0 : 1;
            newP[idx] = { ...newP[idx], scarica: cur === 1 ? 0 : 1 };
            return newP;
        });
    };

    // Gestione reattiva del bollo automatico
    useEffect(() => {
        if (!bolloAutomaticoEnabled || !combos.aliquoteIva.length || isLocked) return;

        const soglia = 77.47;
        let totaleEsente = 0;
        let bolloRowIndex = -1;

        prodotti.forEach((p, idx) => {
            if (p.fmCodice === 'BOLLO_SISTEMA') {
                bolloRowIndex = idx;
                return;
            }
            if (p.tipo === 'N') return;

            const values = getRowValues(p, combos.aliquoteIva);
            const ai = combos.aliquoteIva.find(a => a.id === parseInt(p.idAliquotaIva));
            
            // Consideriamo esente se l'aliquota non è impostata o se ha imposta 0
            if (!ai || ai.imposta === 0 || ai.imposta === null) {
                totaleEsente += (values.imponibile || 0);
            }
        });

        const deveAvereBollo = totaleEsente > soglia;
        
        if (deveAvereBollo && bolloRowIndex === -1) {
            // Cerca un'aliquota N2.2 o simile
            const aiBollo = combos.aliquoteIva.find(a => a.classe === 'N2.2' || (a.imposta === 0 && a.descrizione.toUpperCase().includes('BOLLO'))) 
                         || combos.aliquoteIva.find(a => a.imposta === 0);
            
            if (aiBollo) {
                const newBolloRow = {
                    id: 0,
                    idDocumento: isNew ? 0 : parseInt(id),
                    tipo: 'F',
                    idProdotto: null,
                    fmCodice: 'BOLLO_SISTEMA',
                    fmDescrizione: 'Bollo in fattura',
                    quantita: 1,
                    prezzo: 2.00,
                    sconto: 0,
                    idAliquotaIva: aiBollo.id,
                    scarica: 0,
                    isAutogenerated: true
                };
                setProdotti(prev => [...prev, newBolloRow]);
            }
        } else if (!deveAvereBollo && bolloRowIndex !== -1) {
            // Rimuovi se non più necessario
            setProdotti(prev => prev.filter((p, idx) => idx !== bolloRowIndex));
        } else if (bolloRowIndex !== -1 && bolloRowIndex !== prodotti.length - 1) {
            // Se il bollo c'è ma non è l'ultimo, spostalo in coda
            const bolloRow = prodotti[bolloRowIndex];
            const otherRows = prodotti.filter((_, idx) => idx !== bolloRowIndex);
            setProdotti([...otherRows, bolloRow]);
        }
    }, [prodotti, bolloAutomaticoEnabled, combos.aliquoteIva, id, isNew, isLocked]);


    const calculateTotalDocument = (includeFees = true, forScadenze = false) => {
        const prodTotal = prodotti.reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).total || 0), 0);
        const rivalsa = calculateRivalsaInps();
        
        // Find VAT rate for rivalsa
        let aliquotaIvaRivalsa = 22;
        if (formData.idAliquotaIvaRivalsa > 0) {
            const selectedIva = combos.aliquoteIva.find(a => a.id === formData.idAliquotaIvaRivalsa);
            if (selectedIva) aliquotaIvaRivalsa = selectedIva.imposta;
        } else if (prodotti.length > 0) {
            const firstRowIva = (combos.aliquoteIva || []).find(ai => ai.id === prodotti[0].idAliquotaIva);
            if (firstRowIva) aliquotaIvaRivalsa = firstRowIva.imposta;
        }
        const ivaRivalsa = (rivalsa * aliquotaIvaRivalsa) / 100;
        
        const globalDiscount = parseFloat(formData.sconto) || 0;
        
        // If it's for scadenze calculation, we need the "Collectible" part of products
        let base = prodTotal + rivalsa + ivaRivalsa - globalDiscount;
        if (forScadenze) {
            const ritenuta = calculateRitenutaAcconto();
            base = base - ritenuta;
            if (formData.splitPayment === 1) {
                const totalIva = prodotti.reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).iva || 0), 0);
                base = base - totalIva - ivaRivalsa;
            }
            return base;
        }

        if (!includeFees) return base;
        
        const feesTotal = (formData.listaScadenzePagamentiDocumento || []).reduce((acc, s) => acc + (s.importoSpeseIncasso || 0), 0);
        return base + feesTotal;
    };

    const calculateTotalImponibile = () => {
        return prodotti.reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).imponibile || 0), 0);
    };

    const calculateRivalsaInps = () => {
        if (formData.flRivalsaInps !== 1) return 0;
        const base = prodotti
            .filter(row => row.tipo !== 'N' && (row.flRitenuta === 1 || row.flRitenuta === undefined))
            .reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).imponibile || 0), 0);
        const baseProporzionale = (base * (formData.percImponibileRivalsa || 100)) / 100;
        return (baseProporzionale * (formData.percRivalsaInps || 0)) / 100;
    };

    const calculateRitenutaAcconto = () => {
        if (formData.flRitenutaAcconto !== 1) return 0;
        const baseItems = prodotti
            .filter(row => row.tipo !== 'N' && (row.flRitenuta === 1 || row.flRitenuta === undefined))
            .reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).imponibile || 0), 0);
        const rivalsa = calculateRivalsaInps();
        const base = baseItems + rivalsa;
        return (base * (formData.percRitenutaAcconto || 0)) / 100;
    };

    const calculateNettoAPagare = () => {
        let total = calculateTotalDocument(true);
        const ritenuta = calculateRitenutaAcconto();
        
        if (formData.splitPayment === 1) {
            const totalIva = prodotti.reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).iva || 0), 0);
            const rivalsa = calculateRivalsaInps();
            let aliquotaIvaRivalsa = 22;
            if (formData.idAliquotaIvaRivalsa > 0) {
                const selectedIva = combos.aliquoteIva.find(a => a.id === formData.idAliquotaIvaRivalsa);
                if (selectedIva) aliquotaIvaRivalsa = selectedIva.imposta;
            } else if (prodotti.length > 0) {
                const firstRowIva = (combos.aliquoteIva || []).find(ai => ai.id === prodotti[0].idAliquotaIva);
                if (firstRowIva) aliquotaIvaRivalsa = firstRowIva.imposta;
            }
            const ivaRivalsa = (rivalsa * aliquotaIvaRivalsa) / 100;

            // Consider also VAT of expenses stored in scadenze
            const feesIva = (formData.listaScadenzePagamentiDocumento || []).reduce((acc, s) => acc + (s.ivaSpeseIncasso || 0), 0);
            total = total - totalIva - feesIva - ivaRivalsa;
        }
        
        return total - ritenuta;
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
                provinciaDestinazione: c.provincia,
                nazioneIntestazione: c.nazione || 'Italia',
                nazioneDestinazione: c.nazione || 'Italia'
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
                provinciaIntestazione: addr.provincia,
                nazioneIntestazione: addr.nazione || 'Italia'
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                indirizzoDestinazione: addr.indirizzo,
                cittaDestinazione: addr.citta,
                capDestinazione: addr.cap,
                provinciaDestinazione: addr.provincia,
                nazioneDestinazione: addr.nazione || 'Italia'
            }));
        }
        setShowAddressModal(false);
    };

    const validate = (forceSdi = false) => {
        if (!formData.numDocumento) { Swal.fire('Errore', 'Inserire il numero documento', 'error'); return false; }
        if (!formData.dataDocumento) { Swal.fire('Errore', 'Inserire la data documento', 'error'); return false; }
        if (!formData.idCliente) { Swal.fire('Errore', 'Selezionare un cliente', 'error'); return false; }
        if (!prodotti || prodotti.length === 0) { Swal.fire('Errore', 'Inserire almeno un articolo', 'error'); return false; }

        // Validazione SDI per fatture non Pro Forma (Solo se NON in stato Bozza, a meno che non sia forzato)
        if (formData.tipoFattura !== 'FATTURA_PROFORMA' && formData.tipoFattura !== 'FATTURA_SEMPLIFICATA' && 
            formData.flFatturaElettronica === 1 && (formData.statoFatturaElettronica !== 'BO' || forceSdi)) {
            
            if (!formData.indirizzoIntestazione?.trim()) { Swal.fire('Errore SDI', 'L\'indirizzo del cliente è obbligatorio per la fatturazione elettronica ordinaria.', 'error'); return false; }
            if (!formData.cittaIntestazione?.trim()) { Swal.fire('Errore SDI', 'Il comune del cliente è obbligatorio per la fatturazione elettronica ordinaria.', 'error'); return false; }
            if (!formData.capIntestazione?.trim()) { Swal.fire('Errore SDI', 'Il CAP del cliente è obbligatorio per la fatturazione elettronica ordinaria.', 'error'); return false; }
            if (!formData.provinciaIntestazione?.trim()) { Swal.fire('Errore SDI', 'La provincia del cliente è obbligatorio per la fatturazione elettronica ordinaria.', 'error'); return false; }
            if (!formData.partitaIva?.trim() && !formData.codiceFiscale?.trim()) { 
                Swal.fire('Errore SDI', 'È necessario inserire la Partita IVA o il Codice Fiscale del cliente per la fatturazione elettronica ordinaria.', 'error'); 
                return false; 
            }
        }

        // Validazione specifica per Fattura Semplificata
        if (formData.tipoFattura === 'FATTURA_SEMPLIFICATA') {
            const total = calculateTotalDocument(true);
            if (total > 400) {
                Swal.fire('Errore SDI', 'La fattura semplificata non può superare i 400€ (IVA inclusa)', 'error');
                return false;
            }
            if (!formData.partitaIva?.trim() && !formData.codiceFiscale?.trim()) { 
                Swal.fire('Errore SDI', 'È necessario inserire la Partita IVA o il Codice Fiscale del cliente per la fattura semplificata.', 'error'); 
                return false; 
            }
        }

        return true;
    };

    const saveFattura = async () => {
        if (!validate()) return null;

        const parts = formData.dataDocumento.split('-');
        const dtFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;

        const payload = {
            ...formData,
            dataDocumento: dtFormatted,
            prodotti: prodotti.map(p => ({
                ...p,
                prezzoImponibile: getRowValues(p, combos.aliquoteIva).imponibile
            })),
            listaScadenzePagamentiDocumento: formData.listaScadenzePagamentiDocumento || [],
            importoRitenutaAcconto: calculateRitenutaAcconto(),
            importoRivalsaInps: calculateRivalsaInps()
        };

        try {
            const res = await FattureService.save(payload);
            return res.data.payload?.id || res.data.payload || (isNew ? res.data : id);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data || 'Errore durante il salvataggio';
            Swal.fire('Errore', msg, 'error');
            return null;
        }
    };

    const handleSendSdi = async () => {
        if (!validate(true)) return;
        try {
            Swal.fire({
                title: 'Invio a SDI...',
                text: 'Attendere prego',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            await FattureService.sendSdi(id);

            Swal.fire({
                icon: 'success',
                title: 'Successo',
                text: 'Fattura accodata per l\'invio allo SDI. L\'esito sarà disponibile a breve.',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                fetchData(); // Refresh UI
            });
        } catch (err) {
            console.error('Errore durante l\'invio a SDI:', err);
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'Impossibile inviare la fattura allo SDI.'
            });
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
                <div className="header-left">
                    <h1>{getDocTitle()}</h1>
                    <div className="breadcrumb">
                        <span onClick={() => navigate('/fatture')}>Elenco Fatture</span> / <span>{isNew ? 'Nuova' : formData.numDocumento}</span>
                    </div>
                </div>
                {(formData.erroreValidazioneXml || formData.erroreConsegna) && (
                    <div className="sdi-error-banner" style={{ marginTop: '10px' }}>
                        <FaExclamationTriangle />
                        <div className="sdi-error-text">
                            <strong>Dettaglio Errore SDI / XML</strong>
                            <span>{formData.erroreValidazioneXml || formData.erroreConsegna}</span>
                        </div>
                    </div>
                )}
                <div className="header-totals">
                    <div className="total-box">
                        <span className="label">Imponibile</span>
                        <span className="value">{formatCurrency(calculateTotalImponibile())}</span>
                    </div>
                    {parseFloat(formData.sconto) > 0 && (
                        <div className="total-box warning">
                            <span className="label">Sconto Glob.</span>
                            <span className="value">-{formatCurrency(formData.sconto)}</span>
                        </div>
                    )}
                    <div className="total-box highlight">
                        <span className="label">Totale Doc.</span>
                        <span className="value">{formatCurrency(calculateTotalDocument())}</span>
                    </div>
                    {formData.flRivalsaInps === 1 && (
                        <div className="total-box">
                            <span className="label">Rivalsa INPS/Cassa</span>
                            <span className="value">{formatCurrency(calculateRivalsaInps())}</span>
                        </div>
                    )}
                    {formData.flRitenutaAcconto === 1 && (
                        <>
                            <div className="total-box danger">
                                <span className="label">Ritenuta</span>
                                <span className="value">-{formatCurrency(calculateRitenutaAcconto())}</span>
                            </div>
                            <div className="total-box net">
                                <span className="label">Netto a Pagare</span>
                                <span className="value">{formatCurrency(calculateNettoAPagare())}</span>
                            </div>
                        </>
                    )}
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
                    {!isNew && (
                        <li className={activeTab === 'comunicazioni' ? 'active' : ''}>
                            <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('comunicazioni'); }}>Comunicazioni inviate</a>
                        </li>
                    )}
                </ul>

                <div className="main-box-body">
                    <div className="tab-content">
                        <input type="text" style={{ display: 'none' }} autoComplete="off" />
                        {/* Tab Generale */}
                        <div className={`tab-pane ${activeTab === 'generale' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div style={{ fontSize: '11px', color: '#999', marginBottom: '12px' }}>
                                    <span style={{ color: '#dc3545' }}>*</span> campo obbligatorio
                                </div>
                                <div className="status-workflow-bar">
                                    <div className="status-workflow-field">
                                        <label>Stato Documento</label>
                                        <div className="status-dropdown-wrapper">
                                            <select
                                                className={`form-control status-select status-${(formData.statoFatturaElettronica || '').toLowerCase()}`}
                                                value={formData.statoFatturaElettronica || 'BO'}
                                                onChange={(e) => setFormData(prev => ({ ...prev, statoFatturaElettronica: e.target.value }))}
                                                disabled={isLocked || isReadOnly}
                                            >
                                                <option value="BO">Bozza</option>
                                                <option value="DI">{formData.tipoFattura === 'FATTURA_PROFORMA' ? 'Definitiva' : 'Versione Finale (Da inviare)'}</option>
                                                {['IN', 'AC', 'RC', 'NS', 'MC', 'RF'].includes(formData.statoFatturaElettronica) && (
                                                    <option value={formData.statoFatturaElettronica}>
                                                        {formData.descrizioneStatoFatturaElettronica || formData.statoFatturaElettronica}
                                                    </option>
                                                )}
                                            </select>
                                            {isLocked && !isReadOnly && (
                                                <button
                                                    type="button"
                                                    className="btn-unlock-document"
                                                    onClick={handleUnlock}
                                                    title="Sblocca per modifiche"
                                                >
                                                    <FaWrench /> Sblocca Modifiche
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="compact-row">
                                    <div className="compact-col compact-col-sm">
                                        <div className="form-group">
                                            <label>Tipo Documento</label>
                                            <select
                                                className="form-control premium-input"
                                                name="tipoFattura"
                                                value={formData.tipoFattura}
                                                onChange={handleHeaderChange}
                                                disabled={isLocked || formData.statoFatturaElettronica === 'RC'}
                                            >
                                                <option value="FATTURA">Fattura</option>
                                                <option value="FATTURA_ACCOMPAGNATORIA">Fattura Accompagnatoria</option>
                                                <option value="FATTURA_PROFORMA">Fattura Pro Forma</option>
                                                <option value="NOTA_DEBITO">Nota di Debito</option>
                                                <option value="FATTURA_SEMPLIFICATA">Fattura Semplificata (TD07)</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="compact-col compact-col-md">
                                        <div className="form-group">
                                            <label>Numero <span style={{ color: '#dc3545' }}>*</span></label>
                                            <div className="flex-input-group w-md">
                                                <input
                                                    type="text"
                                                    className="form-control premium-input"
                                                    name="numDocumento"
                                                    value={formData.numDocumento || ''}
                                                    onChange={handleHeaderChange}
                                                    disabled={isLocked || formData.statoFatturaElettronica === 'RC'}
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
                                                        isDisabled={isLocked || formData.statoFatturaElettronica === 'RC'}
                                                        noOptionsMessage={() => "Nuovo..."}
                                                        formatCreateLabel={(inputValue) => `Usa "${inputValue}"`}
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    className="premium-wrench-btn"
                                                    onClick={() => setShowParticelleModal(true)}
                                                    title="Configura suffissi"
                                                    disabled={isLocked || formData.statoFatturaElettronica === 'RC'}
                                                >
                                                    <FaWrench />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="compact-col compact-col-sm">
                                        <div className="form-group">
                                            <label>Data <span style={{ color: '#dc3545' }}>*</span></label>
                                            <div className="flex-input-group">
                                                <input
                                                    type="date"
                                                    className="form-control premium-input"
                                                    name="dataDocumento"
                                                    value={formData.dataDocumento}
                                                    onChange={handleHeaderChange}
                                                    required
                                                    disabled={isLocked || formData.statoFatturaElettronica === 'RC'}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="compact-col compact-col-xl">
                                        <EntitySelectGroup
                                            label={<>Cliente <span style={{ color: '#dc3545' }}>*</span></>}
                                            isAsync={true}
                                            loadOptions={loadClienti}
                                            value={formData.idCliente ? { value: formData.idCliente, label: formData.nomeCliente || formData.denominazioneCliente } : null}
                                            onChange={handleSelectCliente}
                                            ModalComponent={ClientiManagementModal}
                                            title="Gestione Clienti"
                                            placeholder="Cerca cliente..."
                                            widthClass="w-lg"
                                            disabled={isLocked}
                                        />
                                    </div>
                                    {isEnabledGlobal('AGENTI') && (
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
                                                disabled={isLocked}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <hr />

                            <div className="tab-padding-wrapper">
                                {formData.tipoFattura !== 'FATTURA_PROFORMA' && (
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
                                                    disabled={isLocked}
                                                    autoComplete="off"
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
                                                    autoComplete="off"
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
                                                    <label className="premium-label">Indi<span>riz</span>zo</label>
                                                    <input type="search" className="form-control premium-input" name="indirizzoIntestazione" value={formData.indirizzoIntestazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                </div>
                                            </div>
                                            <div className="row mb-4">
                                                <div className="col-md-7">
                                                    <label className="premium-label">Cit<span>tà</span></label>
                                                    <input type="search" className="form-control premium-input" name="cittaIntestazione" value={formData.cittaIntestazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="premium-label">Pr<span>ov</span>.</label>
                                                    <input type="search" className="form-control premium-input" name="provinciaIntestazione" value={formData.provinciaIntestazione || ''} onChange={handleHeaderChange} maxLength="2" autoComplete="new-password" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="premium-label">C<span>AP</span></label>
                                                    <input type="search" className="form-control premium-input" name="capIntestazione" value={formData.capIntestazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                </div>
                                            </div>
                                            <div className="row mb-4">
                                                <div className="col-md-12">
                                                    <label className="premium-label"><FaGlobe style={{marginRight: '5px'}}/> Na<span>zio</span>ne</label>
                                                    <NazioneSelect
                                                        value={formData.nazioneIntestazione}
                                                        onChange={(val) => setFormData(prev => ({ ...prev, nazioneIntestazione: val }))}
                                                        disabled={isLocked}
                                                    />
                                                </div>
                                            </div>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <label className="premium-label">Partita IVA</label>
                                                    <input type="search" className="form-control premium-input" name="partitaIva" value={formData.partitaIva || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="premium-label">Codice Fiscale</label>
                                                    <input type="search" className="form-control premium-input" name="codiceFiscale" value={formData.codiceFiscale || ''} onChange={handleHeaderChange} autoComplete="new-password" />
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
                                                    <label className="premium-label">Indi<span>riz</span>zo</label>
                                                    <input type="search" className="form-control premium-input" name="indirizzoDestinazione" value={formData.indirizzoDestinazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                </div>
                                            </div>
                                            <div className="row mb-4">
                                                <div className="col-md-7">
                                                    <label className="premium-label">Cit<span>tà</span></label>
                                                    <input type="search" className="form-control premium-input" name="cittaDestinazione" value={formData.cittaDestinazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="premium-label">Pr<span>ov</span>.</label>
                                                    <input type="search" className="form-control premium-input" name="provinciaDestinazione" value={formData.provinciaDestinazione || ''} onChange={handleHeaderChange} maxLength="2" autoComplete="new-password" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="premium-label">C<span>AP</span></label>
                                                    <input type="search" className="form-control premium-input" name="capDestinazione" value={formData.capDestinazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                </div>
                                            </div>
                                            <div className="row mb-4">
                                                <div className="col-md-12">
                                                    <label className="premium-label"><FaGlobe style={{marginRight: '5px'}}/> Na<span>zio</span>ne</label>
                                                    <NazioneSelect
                                                        value={formData.nazioneDestinazione}
                                                        onChange={(val) => setFormData(prev => ({ ...prev, nazioneDestinazione: val }))}
                                                        disabled={isLocked}
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

                            <div className="row mb-3 mt-3 px-3">
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

                            <div className="row mb-3 px-3">
                                <div className="col-md-12">
                                    <div className="form-group">
                                        <label className="premium-label">Causale Documento</label>
                                        <input
                                            type="text"
                                            className="form-control premium-input"
                                            name="causale"
                                            value={formData.causale || ''}
                                            onChange={handleHeaderChange}
                                            placeholder="Inserisci la causale generica del documento..."
                                            autoComplete="off"
                                        />
                                    </div>
                                </div>
                            </div>

                            {ritenutaEnabled && (
                                <div className="row mb-3 px-3">
                                    <div className="col-md-4">
                                        <div className="form-group mb-0" style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '10px 0' }}>
                                            <label className="premium-label" style={{ marginBottom: 0, marginRight: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    name="flRitenutaAcconto"
                                                    checked={formData.flRitenutaAcconto === 1}
                                                    onChange={handleHeaderChange}
                                                    style={{ marginRight: '10px', width: '18px', height: '18px' }}
                                                />
                                                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>Gestione Ritenuta d'Acconto</span>
                                            </label>
                                        </div>
                                    </div>
                                    {formData.flRitenutaAcconto === 1 && (
                                        <>
                                            <div className="col-md-4">
                                                <div className="form-group mb-0">
                                                    <label className="premium-label">Tipo Ritenuta</label>
                                                    <select
                                                        className="form-control premium-input"
                                                        name="tipoRitenuta"
                                                        value={formData.tipoRitenuta || ''}
                                                        onChange={handleHeaderChange}
                                                    >
                                                        <option value="">Seleziona tipo...</option>
                                                        <option value="RT01">RT01 - Ritenuta persone fisiche</option>
                                                        <option value="RT02">RT02 - Ritenuta persone giuridiche</option>
                                                        <option value="RT03">RT03 - Contributo INPS</option>
                                                        <option value="RT04">RT04 - Contributo ENASARCO</option>
                                                        <option value="RT05">RT05 - Contributo ENPAM</option>
                                                        <option value="RT06">RT06 - Altro contributo previdenziale</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-2">
                                                <div className="form-group mb-0">
                                                    <label className="premium-label">Perc. Ritenuta (%)</label>
                                                    <input
                                                        type="number"
                                                        className="form-control premium-input text-right"
                                                        name="percRitenutaAcconto"
                                                        value={formData.percRitenutaAcconto ?? ''}
                                                        onChange={handleHeaderChange}
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {rivalsaEnabled && (
                                <div className="row mb-3 px-3">
                                    <div className="col-md-4">
                                        <div className="form-group mb-0" style={{ display: 'flex', alignItems: 'center', height: '100%', padding: '10px 0' }}>
                                            <label className="premium-label" style={{ marginBottom: 0, marginRight: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                                <input
                                                    type="checkbox"
                                                    name="flRivalsaInps"
                                                    checked={formData.flRivalsaInps === 1}
                                                    onChange={handleHeaderChange}
                                                    style={{ marginRight: '10px', width: '18px', height: '18px' }}
                                                />
                                                <span style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2c3e50' }}>Gestione Rivalsa INPS / Cassa</span>
                                            </label>
                                        </div>
                                    </div>
                                    {formData.flRivalsaInps === 1 && (
                                        <>
                                            <div className="col-md-4">
                                                <div className="form-group mb-0">
                                                    <label className="premium-label">Tipo Cassa</label>
                                                    <select
                                                        className="form-control premium-input"
                                                        name="tipoCassaInps"
                                                        value={formData.tipoCassaInps || ''}
                                                        onChange={handleHeaderChange}
                                                    >
                                                        <option value="TC01">TC01 - Cassa Nazionale Previdenza Avvocati</option>
                                                        <option value="TC02">TC02 - Cassa Previdenza Dottori Commercialisti</option>
                                                        <option value="TC03">TC03 - Cassa Previdenza Geometri</option>
                                                        <option value="TC04">TC04 - Cassa Nazionale Previdenza Ingegneri e Architetti</option>
                                                        <option value="TC05">TC05 - Cassa Nazionale Notariato</option>
                                                        <option value="TC06">TC06 - Cassa Nazionale Previdenza Ragionieri e Periti Commerciali</option>
                                                        <option value="TC07">TC07 - ENPAIA (Agricoltura)</option>
                                                        <option value="TC08">TC08 - ENPACL (Consulenti del Lavoro)</option>
                                                        <option value="TC09">TC09 - ENPAM (Medici)</option>
                                                        <option value="TC10">TC10 - ENPAF (Farmacisti)</option>
                                                        <option value="TC11">TC11 - ENPAB (Biologi)</option>
                                                        <option value="TC12">TC12 - ENPAPI (Infermieri)</option>
                                                        <option value="TC13">TC13 - ENPVP (Veterinari)</option>
                                                        <option value="TC14">TC14 - ENPGI (Giornalisti)</option>
                                                        <option value="TC15">TC15 - ENPAPP (Psicologi)</option>
                                                        <option value="TC16">TC16 - INPGI (Giornalisti)</option>
                                                        <option value="TC17">TC17 - ENPAV (Veterinari)</option>
                                                        <option value="TC18">TC18 - ENPAPI (Infermieri professionali)</option>
                                                        <option value="TC19">TC19 - Cassa pluricategoriale</option>
                                                        <option value="TC20">TC20 - ENPADC (Dottori commercialisti)</option>
                                                        <option value="TC21">TC21 - ENPAG (Giornalisti)</option>
                                                        <option value="TC22">TC22 - INPS</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="col-md-2">
                                                <div className="form-group mb-0">
                                                    <label className="premium-label">Perc. Cassa (%)</label>
                                                    <input
                                                        type="number"
                                                        className="form-control premium-input text-right"
                                                        name="percRivalsaInps"
                                                        value={formData.percRivalsaInps ?? ''}
                                                        onChange={handleHeaderChange}
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-2">
                                                <div className="form-group mb-0">
                                                    <label className="premium-label">Perc. Imponibile (%)</label>
                                                    <input
                                                        type="number"
                                                        className="form-control premium-input text-right"
                                                        name="percImponibileRivalsa"
                                                        value={formData.percImponibileRivalsa ?? 100}
                                                        onChange={handleHeaderChange}
                                                        min="0"
                                                        max="100"
                                                        step="0.01"
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-md-3">
                                                <div className="form-group mb-0">
                                                    <label className="premium-label">Aliquota IVA Rivalsa</label>
                                                    <select
                                                        className="form-control premium-input"
                                                        name="idAliquotaIvaRivalsa"
                                                        value={formData.idAliquotaIvaRivalsa || 0}
                                                        onChange={handleHeaderChange}
                                                    >
                                                        <option value="0">Auto (1° riga)</option>
                                                        {combos.aliquoteIva.map(a => (
                                                            <option key={a.id} value={a.id}>{a.codice} - {a.descrizione}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>{/* end tab-pane generale */}

                        <div className={`tab-pane ${activeTab === 'articoli' ? 'active' : ''}`}>
                            <DocumentRows
                                rows={prodotti}
                                onRowChange={handleRowChange}
                                isDisabled={isLocked}
                                onRowUpdate={(idx, update) => {
                                    setProdotti(prev => {
                                        const newP = [...prev];
                                        newP[idx] = { ...newP[idx], ...update };
                                        return newP;
                                    });
                                }}
                                onDeleteRow={(idx) => {
                                    setProdotti(prev => {
                                        const newP = [...prev];
                                        newP.splice(idx, 1);
                                        return newP;
                                    });
                                }}
                                onAddRow={(newRow) => {
                                    setProdotti(prev => {
                                        const bolloIdx = prev.findIndex(p => p.fmCodice === 'BOLLO_SISTEMA');
                                        if (bolloIdx !== -1) {
                                            const newP = [...prev];
                                            newP.splice(bolloIdx, 0, newRow);
                                            return newP;
                                        }
                                        return [...prev, newRow];
                                    });
                                }}
                                addExtraProps={{ flRitenuta: 1, scarica: 1 }}
                                combos={combos}
                                isCeramica={isCeramica}
                                showRitenuta={formData.flRitenutaAcconto === 1}
                                readOnly={isReadOnly}
                                idListino={formData.idListino}
                            />

                            {prodotti.length > 0 && (
                                <div className="carica-magazzino-panel">
                                    <div className="card-header-vibrant">
                                        <span><FaBoxOpen /> Scarico da magazzino</span>
                                    </div>
                                    {prodotti.map((row, idx) => {
                                        if (row.tipo !== 'A' || (row.tipologia !== 'AM' && row.tipologia !== 'AMSC')) return null;
                                        const desc = row.descProdotto || row.codiceProdotto || `Riga ${idx + 1}`;
                                        return (
                                            <div className="carica-magazzino-row" key={idx}>
                                                <label>
                                                    <input
                                                        type="checkbox"
                                                        checked={row.scarica !== 0}
                                                        onChange={() => toggleScarica(idx)}
                                                    />
                                                    Scarica da magazzino
                                                </label>
                                                <span style={{ color: '#666' }}>— {desc}</span>
                                                {row.daDDT && (
                                                    <span className="badge-da-bolla" title="Articolo gia' scaricato a magazzino dal DDT collegato">
                                                        Da DDT
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Tab Pagamento */}
                        <div className={`tab-pane ${activeTab === 'pagamento' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div className="row mb-4">
                                    <div className="col-md-5 pagamento-col">
                                        <EntitySelectGroup
                                            label="Tipo Pagamento"
                                            isAsync={false}
                                            options={(combos.tipiPagamento || []).map(tp => ({ value: tp.id, label: tp.descrizione }))}
                                            value={formData.idTipoPagamento ? { value: formData.idTipoPagamento, label: (combos.tipiPagamento || []).find(tp => tp.id === formData.idTipoPagamento)?.descrizione } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idTipoPagamento: opt?.value }))}
                                            ModalComponent={TipiPagamentoManagementModal}
                                            title="Gestione Tipi Pagamento"
                                            placeholder="Seleziona..."
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                    <div className="col-md-4 pagamento-col">
                                        <EntitySelectGroup
                                            label="Nostra Banca"
                                            isAsync={false}
                                            options={(combos.risorse || []).map(r => ({ value: r.id, label: r.descrizione }))}
                                            value={formData.idNsBanca ? { value: formData.idNsBanca, label: (combos.risorse || []).find(r => r.id === formData.idNsBanca)?.descrizione } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idNsBanca: opt?.value }))}
                                            ModalComponent={RisorseManagementModal}
                                            modalProps={{ initialTipologia: 'BA' }}
                                            title="Gestione Banche"
                                            placeholder="Seleziona..."
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                    <div className="col-md-3 pagamento-col">
                                        <EntitySelectGroup
                                            label="Listino"
                                            isAsync={false}
                                            options={(combos.listini || []).map(l => ({ value: l.id, label: l.descrizione }))}
                                            value={formData.idListino ? { value: formData.idListino, label: (combos.listini || []).find(l => l.id === formData.idListino)?.descrizione } : null}
                                            onChange={handleListinoChange}
                                            ModalComponent={ListiniManagementModal}
                                            title="Gestione Listini"
                                            placeholder="Predefinito"
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                </div>
                                <div className="row mt-2" style={{ alignItems: 'flex-end' }}>
                                    <div className="col-md-2">
                                        <div className="premium-checkbox-group" style={{ marginBottom: '10px' }}>
                                            <input
                                                type="checkbox"
                                                id="splitPayment"
                                                name="splitPayment"
                                                checked={formData.splitPayment === 1}
                                                onChange={handleHeaderChange}
                                            />
                                            <label htmlFor="splitPayment">Split Payment</label>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="premium-checkbox-group" style={{ marginBottom: '10px' }}>
                                            <input
                                                type="checkbox"
                                                id="esigibilitaDifferita"
                                                name="esigibilitaDifferita"
                                                checked={formData.esigibilitaDifferita === 1}
                                                onChange={(e) => setFormData(prev => ({ ...prev, esigibilitaDifferita: e.target.checked ? 1 : 0 }))}
                                            />
                                            <label htmlFor="esigibilitaDifferita" title="Iva ad esigibilità differita">Esigibilità Differita</label>
                                        </div>
                                    </div>
                                    <div className="col-md-7">
                                        <EntitySelectGroup
                                            label="Causale Esigibilità"
                                            isAsync={false}
                                            options={(combos.causaliEsigibilitaDifferita || []).map(c => ({ value: c.id, label: c.descrizione }))}
                                            value={formData.idCausaleEsigibilitaDifferita ? { value: formData.idCausaleEsigibilitaDifferita, label: (combos.causaliEsigibilitaDifferita || []).find(c => c.id === formData.idCausaleEsigibilitaDifferita)?.descrizione } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idCausaleEsigibilitaDifferita: opt?.value }))}
                                            ModalComponent={CausaliEsigibilitaDifferitaManagementModal}
                                            title="Gestione Causali Esigibilità"
                                            placeholder="Seleziona causale..."
                                            onModalClose={fetchCombos}
                                            disabled={formData.esigibilitaDifferita !== 1}
                                        />
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label className="premium-label">Sconto Globale (€)</label>
                                            <input
                                                type="number"
                                                className="form-control premium-input text-right"
                                                name="sconto"
                                                value={formData.sconto ?? ''}
                                                onChange={handleHeaderChange}
                                                disabled={isLocked}
                                                onBlur={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    if (!isNaN(val)) {
                                                        setFormData(prev => ({ ...prev, sconto: val.toFixed(2) }));
                                                    }
                                                }}
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <ScadenzeTable
                                            idTipoPagamento={formData.idTipoPagamento}
                                            dataDocumento={formData.dataDocumento}
                                            totaleDocumento={calculateTotalDocument(false, true)}
                                            scadenzeIniziali={formData.listaScadenzePagamentiDocumento || []}
                                            isDisabled={isLocked}
                                            conti={combos.risorse || []}
                                            onRefreshConti={fetchCombos}
                                            onScadenzeChange={useCallback((newScadenze) => {
                                                const totalFees = newScadenze.reduce((acc, s) => acc + (s.importoSpeseIncasso || 0), 0);
                                                
                                                // Map scadenze fees to listaSpeseIncassoFattura for backend persistence
                                                // We create one entry per scadenza that has fees
                                                const newSpeseIncasso = newScadenze
                                                    .filter(s => s.importoSpeseIncasso > 0)
                                                    .map(s => ({
                                                        descrizione: `Spese incasso scadenza ${s.dtScadenza}`,
                                                        importo: s.importoSpeseIncasso,
                                                        tipo: 'I' // Assuming 'I' for Incasso
                                                    }));

                                                setFormData(prev => {
                                                    // Evita aggiornamenti se i dati non sono cambiati (per prevenire loop infiniti)
                                                    const isSameScadenze = JSON.stringify(prev.listaScadenzePagamentiDocumento) === JSON.stringify(newScadenze);
                                                    const isSameSpese = JSON.stringify(prev.listaSpeseIncassoFattura) === JSON.stringify(newSpeseIncasso);
                                                    
                                                    if (isSameScadenze && isSameSpese) return prev;

                                                    return { 
                                                        ...prev, 
                                                        listaScadenzePagamentiDocumento: newScadenze,
                                                        listaSpeseIncassoFattura: newSpeseIncasso,
                                                        totale: calculateTotalDocument(false) + totalFees
                                                    };
                                                });
                                            }, [prodotti, combos.aliquoteIva])}
                                        />
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
                                        disabled={isLocked}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {!isNew && (
                            <div className={`tab-pane ${activeTab === 'comunicazioni' ? 'active' : ''}`}>
                                <div className="tab-padding-wrapper">
                                    <ComunicazioniTimeline idDocumento={parseInt(id)} tipo="fattura" />
                                </div>
                            </div>
                        )}

                        <footer className="main-box-footer detail-footer">
                            <button type="button" className="btn btn-premium-cancel" onClick={() => navigate('/fatture')}>
                                <FaArrowLeft /> Indietro
                            </button>
                            <div className="footer-right">
                                <div className="split-btn-container" ref={saveMenuRef}>
                                    <button type="button" className="split-btn-main btn-premium-save" onClick={handleSave}>
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
                                            <FaPrint /> Stampa
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
                                        <button type="button" 
                                            className="split-btn-item" 
                                            onClick={handleSendSdi}
                                            disabled={!(formData.flElettronica === 1 && (formData.statoFatturaElettronica === 'NS' || formData.statoFatturaElettronica === 'BO' || formData.statoFatturaElettronica === 'RC'))}
                                            title={formData.flElettronica === 1 && (formData.statoFatturaElettronica === 'NS' || formData.statoFatturaElettronica === 'BO' || formData.statoFatturaElettronica === 'RC') ? 'Reinvia la fattura allo SDI (rigenera XML)' : 'Disponibile solo per fatture scartate, in bozza o consegnate'}
                                        >
                                            <FaPaperPlane /> Reinvia a SDI
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            </div >

            {showAddressModal && (
                <IndirizziSelectionModal
                    isOpen={showAddressModal}
                    onClose={() => setShowAddressModal(false)}
                    indirizzi={clientIndirizzi}
                    onSelect={handleSelectIndirizzo}
                    target={addressTarget}
                />
            )}

            {
                showParticelleModal && (
                    <ParticelleManagementModal
                        isOpen={showParticelleModal}
                        currentParticelle={combos.particelle}
                        onClose={() => {
                            setShowParticelleModal(false);
                            fetchCombos();
                        }}
                    />
                )
            }
            {
                showCausaleEsigibilitaModal && (
                    <CausaliEsigibilitaDifferitaManagementModal
                        onClose={() => { setShowCausaleEsigibilitaModal(false); fetchCombos(); }}
                    />
                )
            }
        </div >
    );
};

export default FattureDetail;
