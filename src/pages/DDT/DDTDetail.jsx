import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import DDTService from '../../services/DDTService';
import ConfOrdineService from '../../services/ConfOrdineService';
import PreventiviService from '../../services/PreventiviService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import ArticoliService from '../../services/ArticoliService';
import { FaSave, FaArrowLeft, FaPlus, FaTrash, FaPrint, FaFilePdf, FaWrench, FaHome, FaTruck, FaMapMarkerAlt, FaCaretDown, FaArrowRight, FaGlobe } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import CreatableSelect from 'react-select/creatable';
import printJS from 'print-js';
import './DDTDetail.css';
import '../../components/EntityForms.css';
import ClientiManagementModal from '../../components/modals/ClientiManagementModal';
import AgentiManagementModal from '../../components/modals/AgentiManagementModal';
import EntitySelectGroup from '../../components/EntitySelectGroup';
import IndirizziSelectionModal from '../../components/modals/IndirizziSelectionModal';
import TipiPagamentoManagementModal from '../../components/modals/TipiPagamentoManagementModal';
import ProgettoQuickModal from '../../components/modals/ProgettoQuickModal';
import RisorseManagementModal from '../../components/modals/RisorseManagementModal';
import VettoriManagementModal from '../../components/modals/VettoriManagementModal';
import TipiPortoManagementModal from '../../components/modals/TipiPortoManagementModal';
import ListiniManagementModal from '../../components/modals/ListiniManagementModal';
import AspettoBeniManagementModal from '../../components/modals/AspettoBeniManagementModal';
import CausaliTrasportoManagementModal from '../../components/modals/CausaliTrasportoManagementModal';
import ParticelleManagementModal from '../../components/modals/ParticelleManagementModal';
import NazioneSelect from '../../components/common/NazioneSelect';

import authService from '../../services/authService';
import DocumentRows from '../../components/common/DocumentRows';
import ScadenzeTable from '../../components/common/ScadenzeTable';
import { getRowValues } from '../../utils/documentUtils';

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

const particellaSelectStyles = {
    ...premiumSelectStyles,
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
        padding: '0 4px',
    }),
    dropdownIndicator: (base) => ({
        ...base,
        padding: '4px',
    }),
    clearIndicator: (base) => ({
        ...base,
        padding: '4px',
    })
};

const DDTDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const fromConfermeId = searchParams.get('fromConferme');
    const fromPreventiviId = searchParams.get('fromPreventivi');
    const isNew = !id || id === 'new';
    const [activeTab, setActiveTab] = useState('generale'); // generale, articoli, note, pagamento
    const [isCeramica, setIsCeramica] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);
    const [ritenutaEnabled, setRitenutaEnabled] = useState(false);
    const [rivalsaEnabled, setRivalsaEnabled] = useState(false);
    const [dicituraRitenuta, setDicituraRitenuta] = useState('');
    const [dicituraRivalsa, setDicituraRivalsa] = useState('');

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
        colli: '',
        pesoNetto: '',
        pesoLordo: '',
        dataTrasporto: '',
        oraTrasporto: '',
        pallet: '',
        idVettore: null,
        annotazioneEstesa: '',
        flRitenutaAcconto: 0,
        percRitenutaAcconto: 20,
        importoRitenutaAcconto: 0,
        tipoRitenuta: '',
        flRivalsaInps: 0,
        percRivalsaInps: 4,
        importoRivalsaInps: 0,
        tipoCassaInps: 'TC22',
        pec: '',
        codiceUfficioDestinazione: '',
        listaScadenzePagamentiDocumento: []
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
        vettori: [],
        agenti: [],
        progetti: [],
        idMagazzino: 0
    });

    const [globalConfigs, setGlobalConfigs] = useState(null);
    const isEnabledGlobal = (key) => !globalConfigs || globalConfigs[key] === '1';

    const [clientIndirizzi, setClientIndirizzi] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressTarget, setAddressTarget] = useState('intestazione');
    const [showProgettoModal, setShowProgettoModal] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [showParticelleModal, setShowParticelleModal] = useState(false);
    const actionsMenuRef = useRef(null);

    useEffect(() => {
        checkCeramica();
        fetchCombos();
        fetchGlobalConfigs();
        if (!isNew) {
            fetchData();
        } else if (fromConfermeId) {
            fetchDataFromConfOrdine(fromConfermeId);
        } else if (fromPreventiviId) {
            fetchDataFromPreventivo(fromPreventiviId);
        } else {
            fetchFatturazionePreferences();
            fetchNextNum(formData.dataDocumento);
        }

        const handleClickOutside = (event) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
                setShowActionsMenu(false);
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
            const res = await DDTService.getCombosMap();
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
                    vettori: payload.VETTORI || payload.vettori || prev.vettori,
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
                
                const dRitenuta = prefs.DICITURA_RITENUTA || 'Soggetto a ritenuta d\'acconto ai sensi del DPR 600/73';
                const dRivalsa = prefs.DICITURA_RIVALSA || 'Contributo previdenziale 4% ex art. 2 comma 26 Legge 335/95';
                setDicituraRitenuta(dRitenuta);
                setDicituraRivalsa(dRivalsa);

                setFormData(prev => {
                    const isRitenuta = isRitenutaEnabled || prev.flRitenutaAcconto === 1;
                    const isRivalsa = (prefs.EMETTI_RIVALSA_INPS === '1') || prev.flRivalsaInps === 1;
                    
                    let nextData = {
                        ...prev,
                        flRitenutaAcconto: isRitenuta ? 1 : prev.flRitenutaAcconto,
                        percRitenutaAcconto: prefs.PERC_RITENUTA ? parseFloat(prefs.PERC_RITENUTA) : prev.percRitenutaAcconto,
                        tipoRitenuta: prefs.TIPO_RITENUTA ? prefs.TIPO_RITENUTA : prev.tipoRitenuta,
                        flRivalsaInps: isRivalsa ? 1 : prev.flRivalsaInps,
                        percRivalsaInps: prefs.PERC_RIVALSA_INPS ? parseFloat(prefs.PERC_RIVALSA_INPS) : prev.percRivalsaInps,
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
            }
        } catch (error) {
            console.error("Errore nel recupero delle preferenze fatturazione", error);
        }
    };

    const fetchData = async () => {
        try {
            const res = await DDTService.getById(id);
            if (res.data && res.data.payload) {
                const data = res.data.payload;
                if (data.dataDocumento && data.dataDocumento.includes('/')) {
                    const parts = data.dataDocumento.split('/');
                    data.dataDocumento = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                
                // Gestione Data e Ora Trasporto
                if (data.dataOraTrasporto && data.dataOraTrasporto.includes(' ')) {
                    const [d, t] = data.dataOraTrasporto.split(' ');
                    if (d.includes('/')) {
                        const parts = d.split('/');
                        data.dataTrasporto = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    data.oraTrasporto = t;
                } else if (data.dataTrasporto && data.dataTrasporto.includes('/')) {
                    const parts = data.dataTrasporto.split('/');
                    data.dataTrasporto = `${parts[2]}-${parts[1]}-${parts[0]}`;
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
            Swal.fire('Errore', 'Impossibile caricare il DDT', 'error');
            navigate('/ddt');
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
                    const refText = `Rif. conferma d'ordine num. ${confData.numDocumento} del ${confData.dataDocumento}`;
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
                            scarica: 1
                        }));
                        allProdotti = [...allProdotti, ...mappedProdotti];
                    }
                }
            }

            setProdotti(allProdotti);

            if (firstConfData) {
                setFormData(prev => ({
                    ...prev,
                    idCliente: firstConfData.idCliente,
                    soggetto: firstConfData.soggetto, // Se presente
                    nomeCliente: firstConfData.nomeCliente,
                    idAgente: firstConfData.idAgente,
                    idProgetto: firstConfData.idProgetto,
                    nomeProgetto: firstConfData.nomeProgetto,
                    idListino: firstConfData.idListino || '',
                    idTipoPagamento: firstConfData.idTipoPagamento,
                    idNsBanca: firstConfData.idNsBanca,
                    descrizioneBanca: firstConfData.descrizioneBanca,
                    iban: firstConfData.iban,
                    cittaIntestazione: firstConfData.cittaIntestazione,
                    indirizzoIntestazione: firstConfData.indirizzoIntestazione,
                    capIntestazione: firstConfData.capIntestazione,
                    provinciaIntestazione: firstConfData.provinciaIntestazione,
                    nazioneIntestazione: firstConfData.nazioneIntestazione || 'Italia',
                    codiceFiscale: firstConfData.codiceFiscale,
                    partitaIva: firstConfData.partitaIva,
                    cittaDestinazione: firstConfData.cittaDestinazione,
                    indirizzoDestinazione: firstConfData.indirizzoDestinazione,
                    capDestinazione: firstConfData.capDestinazione,
                    provinciaDestinazione: firstConfData.provinciaDestinazione,
                    nazioneDestinazione: firstConfData.nazioneDestinazione || 'Italia'
                }));
                loadClientAddresses(firstConfData.idCliente);
                fetchNextNum(formData.dataDocumento);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Errore nel caricamento dati dalla conferma d\'ordine', 'error');
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
                setFormData(prev => ({
                    ...prev,
                    idCliente: firstPrevData.idCliente,
                    nomeCliente: firstPrevData.nomeCliente,
                    idAgente: firstPrevData.idAgente,
                    idProgetto: firstPrevData.idProgetto,
                    nomeProgetto: firstPrevData.nomeProgetto,
                    idListino: firstPrevData.idListino || '',
                    idTipoPagamento: firstPrevData.idTipoPagamento,
                    idNsBanca: firstPrevData.idNsBanca,
                    descrizioneBanca: firstPrevData.descrizioneBanca,
                    iban: firstPrevData.iban,
                    cittaIntestazione: firstPrevData.cittaIntestazione,
                    indirizzoIntestazione: firstPrevData.indirizzoIntestazione,
                    capIntestazione: firstPrevData.capIntestazione,
                    provinciaIntestazione: firstPrevData.provinciaIntestazione,
                    nazioneIntestazione: firstPrevData.nazioneIntestazione || 'Italia',
                    codiceFiscale: firstPrevData.codiceFiscale,
                    partitaIva: firstPrevData.partitaIva,
                    cittaDestinazione: firstPrevData.cittaDestinazione,
                    indirizzoDestinazione: firstPrevData.indirizzoDestinazione,
                    capDestinazione: firstPrevData.capDestinazione,
                    provinciaDestinazione: firstPrevData.provinciaDestinazione,
                    nazioneDestinazione: firstPrevData.nazioneDestinazione || 'Italia'
                }));
                loadClientAddresses(firstPrevData.idCliente);
                fetchNextNum(formData.dataDocumento);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Errore nel caricamento dati dal preventivo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchNextNum = async (dateStr) => {
        if (!dateStr) return;
        try {
            const formattedDate = dateStr.split('-').reverse().join('/');
            const res = await DDTService.getNextNum(formattedDate);
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
    };

    const handleHeaderChange = (e) => {
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

            return nextData;
        });

        if (name === 'dataDocumento' && isNew) {
            fetchNextNum(newValue);
        }
    };


    const handleDeleteRow = (idx) => {
        const newP = [...prodotti];
        newP.splice(idx, 1);
        setProdotti(newP);
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

    const handleRowChange = (idx, field, value) => {
        const newP = [...prodotti];
        newP[idx][field] = value;
        setProdotti(newP);
    };

    const handleRowUpdate = (idx, updates) => {
        const newP = [...prodotti];
        newP[idx] = { ...newP[idx], ...updates };
        setProdotti(newP);
    };

    const calculateTotalDocument = () => {
        const prodTotal = prodotti.reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).total || 0), 0);
        const rivalsa = calculateRivalsaInps();
        
        // Find VAT rate for rivalsa (fallback to 22 if not found)
        let aliquotaIvaRivalsa = 22;
        if (prodotti.length > 0) {
            const firstRowIva = (combos.aliquoteIva || []).find(ai => ai.id === prodotti[0].idAliquotaIva);
            if (firstRowIva) aliquotaIvaRivalsa = firstRowIva.imposta;
        }
        const ivaRivalsa = (rivalsa * aliquotaIvaRivalsa) / 100;
        
        return prodTotal + rivalsa + ivaRivalsa;
    };

    const calculateTotalImponibile = () => {
        return prodotti.reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).imponibile || 0), 0);
    };

    const calculateRivalsaInps = () => {
        if (formData.flRivalsaInps !== 1) return 0;
        const base = prodotti
            .filter(row => row.tipo !== 'N' && (row.flRitenuta === 1 || row.flRitenuta === undefined))
            .reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).imponibile || 0), 0);
        return (base * (formData.percRivalsaInps || 0)) / 100;
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

    const validate = () => {
        if (!formData.numDocumento) { Swal.fire('Errore', 'Inserire il numero documento', 'error'); return false; }
        if (!formData.dataDocumento) { Swal.fire('Errore', 'Inserire la data documento', 'error'); return false; }
        if (!formData.idCliente) { Swal.fire('Errore', 'Selezionare un cliente', 'error'); return false; }
        if (!prodotti || prodotti.length === 0) { Swal.fire('Errore', 'Inserire almeno un articolo', 'error'); return false; }
        return true;
    };

    const saveDDT = async () => {
        if (!validate()) return null;

        const parts = formData.dataDocumento.split('-');
        const dtFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;

        let dtOraTrasporto = null;
        if (formData.dataTrasporto) {
            const tParts = formData.dataTrasporto.split('-');
            const dStr = `${tParts[2]}/${tParts[1]}/${tParts[0]}`;
            const hStr = formData.oraTrasporto || '00:00';
            dtOraTrasporto = `${dStr} ${hStr}`;
        }

        const payload = {
            ...formData,
            dataDocumento: dtFormatted,
            dataOraTrasporto: dtOraTrasporto,
            prodotti: prodotti.map(p => ({
                ...p,
                prezzoImponibile: getRowValues(p, combos.aliquoteIva).imponibile
            })),
            importoRitenutaAcconto: calculateRitenutaAcconto(),
            importoRivalsaInps: calculateRivalsaInps()
        };

        try {
            const res = await DDTService.save(payload);
            // Il backend restituisce il payload con l'id o l'id direttamente
            return res.data.payload?.id || res.data.payload || (isNew ? res.data : id);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data || 'Errore durante il salvataggio';
            Swal.fire('Errore', msg, 'error');
            return null;
        }
    };

    const handleSave = async (e, options = {}) => {
        if (e) e.preventDefault();
        const savedId = await saveDDT();
        if (savedId) {
            if (options.print) {
                try {
                    const printRes = await DDTService.print(savedId);
                    if (printRes.data.type === 'application/json') {
                        // Likely an error message returned as blob
                        const text = await printRes.data.text();
                        const err = JSON.parse(text);
                        throw new Error(err.message || 'Errore generazione PDF');
                    }
                    if (printRes.data.size < 100) {
                        throw new Error("Il file generato è vuoto o non valido");
                    }
                    const blob = new Blob([printRes.data], { type: 'application/pdf' });
                    const url = window.URL.createObjectURL(blob);
                    printJS({
                        printable: url,
                        type: 'pdf',
                        onPrintDialogClose: () => {
                            window.URL.revokeObjectURL(url);
                        },
                        onError: (err) => {
                            console.error("printJS error:", err);
                            window.open(url); // Fallback: try opening in new tab
                        }
                    });
                } catch (err) {
                    console.error("Print error:", err);
                    Swal.fire('Errore Stampa', err.message || 'Impossibile stampare il DDT', 'error');
                }
            }
            if (options.pdf) {
                try {
                    const printRes = await DDTService.print(savedId);
                    if (printRes.data.type === 'application/json') {
                        const text = await printRes.data.text();
                        const err = JSON.parse(text);
                        throw new Error(err.message || 'Errore generazione PDF');
                    }
                    const url = window.URL.createObjectURL(new Blob([printRes.data], { type: 'application/pdf' }));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `DDT_${formData.numDocumento}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
                } catch (err) {
                    console.error("PDF error:", err);
                    Swal.fire('Errore PDF', err.message || 'Impossibile esportare il PDF', 'error');
                }
            }
            if (!options.print && !options.pdf) {
                Swal.fire({
                    title: 'Salvato!',
                    text: 'DDT salvato con successo',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                }).then(() => {
                    navigate('/ddt');
                });
            }
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
    };

    return (
        <div className="ddt-detail-container entity-form-shared">
            <div id="ddt-content-header">
                <div>
                    <h1>{isNew ? 'Nuovo' : 'Modifica'} DDT</h1>
                    <div className="breadcrumb">
                        <span onClick={() => navigate('/ddt')}>Elenco DDT</span> / <span>{isNew ? 'Nuovo' : formData.numDocumento}</span>
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
                    {formData.flRivalsaInps === 1 && (
                        <div className="total-box">
                            <span className="label">Rivalsa INPS/Cassa</span>
                            <span className="value">{formatCurrency(calculateRivalsaInps())}</span>
                        </div>
                    )}
                    {formData.flRitenutaAcconto === 1 && (
                        <div className="total-box danger">
                            <span className="label">Ritenuta</span>
                            <span className="value">-{formatCurrency(calculateRitenutaAcconto())}</span>
                        </div>
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
                    <li className={activeTab === 'trasporto' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('trasporto'); }}>Trasporto</a>
                    </li>
                    <li className={activeTab === 'pagamento' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('pagamento'); }}>Pagamento</a>
                    </li>
                    <li className={activeTab === 'note' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('note'); }}>Annotazioni</a>
                    </li>
                </ul>

                <div className="main-box-body">
                    <form className="tab-content" onSubmit={handleSave} autoComplete="off">
                        <input type="text" style={{ display: 'none' }} autoComplete="off" />
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
                                                <span className="input-group-addon" style={{ display: 'flex', alignItems: 'center', padding: '0 10px', background: '#eee', borderTop: '1px solid #dfe4e7', borderBottom: '1px solid #dfe4e7' }}>/</span>
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
                                                    onChange={handleHeaderChange}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="compact-col compact-col-xl">
                                        <EntitySelectGroup
                                            label="Cliente"
                                            isAsync={true}
                                            loadOptions={loadClienti}
                                            value={formData.idCliente ? { value: formData.idCliente, label: formData.nomeCliente || formData.denominazioneCliente } : null}
                                            onChange={handleSelectCliente}
                                            ModalComponent={ClientiManagementModal}
                                            title="Gestione Clienti"
                                            placeholder="Cerca cliente..."
                                            widthClass="w-lg"
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
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="row mb-3 mt-3">
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

                        {/* Tab Articoli */}
                        <div className={`tab-pane ${activeTab === 'articoli' ? 'active' : ''}`}>
                            <DocumentRows
                                rows={prodotti}
                                onRowChange={handleRowChange}
                                onRowUpdate={handleRowUpdate}
                                onDeleteRow={handleDeleteRow}
                                onAddRow={(newRow) => {
                                    setProdotti([...prodotti, newRow]);
                                    setActiveTab('articoli');
                                }}
                                addExtraProps={{ scarica: 1 }}
                                combos={combos}
                                isCeramica={isCeramica}
                                idListino={formData.idListino}
                            />
                        </div>

                        {/* Tab Trasporto */}
                        <div className={`tab-pane ${activeTab === 'trasporto' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Vettore"
                                            isAsync={false}
                                            options={(combos.VETTORI || []).map(v => ({ value: v.id, label: v.descrizione }))}
                                            value={formData.idVettore ? { value: formData.idVettore, label: combos.VETTORI?.find(v => v.id === formData.idVettore)?.descrizione || formData.idVettore } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idVettore: opt?.value }))}
                                            placeholder="Seleziona..."
                                            ModalComponent={VettoriManagementModal}
                                            title="Gestione Vettori"
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Causale Trasporto"
                                            isAsync={false}
                                            options={(combos.CAUSALITRASPORTO || []).map(c => ({ value: c.id, label: c.descrizione }))}
                                            value={formData.idCausaleTrasporto ? { value: formData.idCausaleTrasporto, label: combos.CAUSALITRASPORTO?.find(c => c.id === formData.idCausaleTrasporto)?.descrizione || formData.idCausaleTrasporto } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idCausaleTrasporto: opt?.value }))}
                                            placeholder="Seleziona..."
                                            ModalComponent={CausaliTrasportoManagementModal}
                                            title="Gestione Causali Trasporto"
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Aspetto Beni"
                                            isAsync={false}
                                            options={(combos.ASPETTIBENI || []).map(a => ({ value: a.id, label: a.descrizione }))}
                                            value={formData.idAspettoBeni ? { value: formData.idAspettoBeni, label: combos.ASPETTIBENI?.find(a => a.id === formData.idAspettoBeni)?.descrizione || formData.idAspettoBeni } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idAspettoBeni: opt?.value }))}
                                            placeholder="Seleziona..."
                                            ModalComponent={AspettoBeniManagementModal}
                                            title="Gestione Aspetto Beni"
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                </div>
                                <div className="row mb-4">
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Tipo Porto"
                                            isAsync={false}
                                            options={(combos.TIPIPORTO || []).map(t => ({ value: t.id, label: t.descrizione }))}
                                            value={formData.idTipoPorto ? { value: formData.idTipoPorto, label: combos.TIPIPORTO?.find(t => t.id === formData.idTipoPorto)?.descrizione || formData.idTipoPorto } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idTipoPorto: opt?.value }))}
                                            placeholder="Seleziona..."
                                            ModalComponent={TipiPortoManagementModal}
                                            title="Gestione Tipi Porto"
                                            onModalClose={fetchCombos}
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label className="premium-label">Data Trasporto</label>
                                            <input type="date" className="form-control premium-input" name="dataTrasporto" value={formData.dataTrasporto || ''} onChange={handleHeaderChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-4">
                                        <div className="form-group">
                                            <label className="premium-label">Ora Trasporto</label>
                                            <input type="time" className="form-control premium-input" name="oraTrasporto" value={formData.oraTrasporto || ''} onChange={handleHeaderChange} />
                                        </div>
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label className="premium-label">Colli</label>
                                            <input type="number" className="form-control premium-input" name="colli" value={formData.colli || ''} onChange={handleHeaderChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label className="premium-label">Peso Lordo (Kg)</label>
                                            <input type="number" step="0.01" className="form-control premium-input" name="pesoLordo" value={formData.pesoLordo || ''} onChange={handleHeaderChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label className="premium-label">Peso Netto (Kg)</label>
                                            <input type="number" step="0.01" className="form-control premium-input" name="pesoNetto" value={formData.pesoNetto || ''} onChange={handleHeaderChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label className="premium-label">Targa</label>
                                            <input type="text" className="form-control premium-input" name="targa" value={formData.targa || ''} onChange={handleHeaderChange} maxLength="10" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Pagamento */}
                        <div className={`tab-pane ${activeTab === 'pagamento' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div className="row mb-4">
                                    <div className="col-md-5">
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
                                    <div className="col-md-4">
                                        <EntitySelectGroup
                                            label="Nostra Banca"
                                            isAsync={false}
                                            options={(combos.risorse || []).map(r => ({ value: r.id, label: r.descrizione }))}
                                            value={formData.idNsBanca ? { value: formData.idNsBanca, label: (combos.risorse || []).find(r => r.id === formData.idNsBanca)?.descrizione } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idNsBanca: opt?.value }))}
                                            ModalComponent={RisorseManagementModal}
                                            modalProps={{ initialTipologia: 'BA' }}
                                            title="Gestione Banche"
                                            placeholder="Seleziona banca..."
                                        />
                                    </div>
                                    <div className="col-md-3">
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
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <ScadenzeTable
                                            idTipoPagamento={formData.idTipoPagamento}
                                            dataDocumento={formData.dataDocumento}
                                            totaleDocumento={calculateTotalDocument()}
                                            isDisabled={isLocked}
                                            conti={combos.risorse || []}
                                            onRefreshConti={fetchCombos}
                                            onScadenzeChange={useCallback((newScadenze) => {
                                                setFormData(prev => ({ ...prev, listaScadenzePagamentiDocumento: newScadenze }));
                                            }, [])}
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
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        <footer className="main-box-footer detail-footer">
                            <button type="button" className="btn-premium-cancel" onClick={() => navigate('/ddt')}>
                                <FaArrowLeft /> Indietro
                            </button>
                            <div className="footer-right">
                                <div className="split-btn-container" ref={actionsMenuRef}>
                                    <button type="submit" className="split-btn-main btn-premium-save">
                                        <FaSave /> Salva
                                    </button>
                                    <button type="button" className="split-btn-toggle" onClick={() => setShowActionsMenu(!showActionsMenu)}>
                                        <FaCaretDown />
                                    </button>
                                    <div className={`split-btn-menu ${showActionsMenu ? 'show' : ''}`}>
                                        <button type="button" className="split-btn-item" onClick={handleSave}>
                                            <FaSave /> Salva solo
                                        </button>
                                        <button type="button" className="split-btn-item" onClick={(e) => handleSave(e, { print: true })}>
                                            <FaPrint /> Stampa
                                        </button>
                                        <button type="button" className="split-btn-item" onClick={(e) => handleSave(e, { pdf: true })}>
                                            <FaFilePdf /> Esporta PDF
                                        </button>
                                        <div className="action-dropdown-divider" style={{ height: '1px', background: '#eee', margin: '5px 0' }}></div>
                                        <button type="button" className="split-btn-item" onClick={async (e) => {
                                            const savedId = await saveDDT();
                                            if (savedId) navigate(`/fatture/new?fromDDT=${savedId}`);
                                        }}>
                                            <FaArrowRight /> Genera Fattura
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </form>
                </div>
            </div>

            {
                showAddressModal && (
                    <IndirizziSelectionModal
                        isOpen={showAddressModal}
                        onClose={() => setShowAddressModal(false)}
                        indirizzi={clientIndirizzi}
                        onSelect={handleSelectIndirizzo}
                        target={addressTarget}
                    />
                )
            }

            {showParticelleModal && (
                <ParticelleManagementModal
                    isOpen={showParticelleModal}
                    currentParticelle={combos.particelle}
                    onClose={() => {
                        setShowParticelleModal(false);
                        fetchCombos();
                    }}
                />
            )}
        </div>
    );
};

export default DDTDetail;
