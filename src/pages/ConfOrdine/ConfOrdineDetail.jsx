import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import ConfOrdineService from '../../services/ConfOrdineService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import ArticoliService from '../../services/ArticoliService';
import PreventiviService from '../../services/PreventiviService';
import { FaSave, FaArrowLeft, FaArrowRight, FaPlus, FaTrash, FaPrint, FaFilePdf, FaWrench, FaHome, FaTruck, FaMapMarkerAlt, FaCaretDown, FaGlobe } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import CreatableSelect from 'react-select/creatable';
import printJS from 'print-js';
import './ConfOrdineDetail.css';
import '../../components/EntityForms.css';
import ClientiManagementModal from '../../components/modals/ClientiManagementModal';
import AgentiManagementModal from '../../components/modals/AgentiManagementModal';
import EntitySelectGroup from '../../components/EntitySelectGroup';
import IndirizziSelectionModal from '../../components/modals/IndirizziSelectionModal';
import TipiPagamentoManagementModal from '../../components/modals/TipiPagamentoManagementModal';
import UnitaMisuraManagementModal from '../../components/modals/UnitaMisuraManagementModal';
import AliquoteIvaManagementModal from '../../components/modals/AliquoteIvaManagementModal';
import RisorseManagementModal from '../../components/modals/RisorseManagementModal';
import ParticelleManagementModal from '../../components/modals/ParticelleManagementModal';
import ListiniManagementModal from '../../components/modals/ListiniManagementModal';
import ProgettoQuickModal from '../../components/modals/ProgettoQuickModal';
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

const tableSelectStyles = {
    control: (base) => ({
        ...base,
        minHeight: '34px',
        height: '34px',
        fontSize: '13px',
        borderColor: '#dee2e6',
        boxShadow: 'none',
        '&:hover': { borderColor: '#ced4da' }
    }),
    valueContainer: (base) => ({
        ...base,
        height: '34px',
        padding: '0 8px'
    }),
    input: (base) => ({
        ...base,
        margin: '0px'
    }),
    indicatorsContainer: (base) => ({
        ...base,
        height: '34px'
    }),
    menu: (base) => ({
        ...base,
        fontSize: '13px',
        zIndex: 9999
    })
};

const ConfOrdineDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const fromPreventiviId = searchParams.get('fromPreventivi');
    const isNew = !id || id === 'new';
    const [activeTab, setActiveTab] = useState('generale'); // generale, articoli, note, pagamento
    const [isCeramica, setIsCeramica] = useState(false);
    const [ritenutaEnabled, setRitenutaEnabled] = useState(false);
    const [rivalsaEnabled, setRivalsaEnabled] = useState(false);
    const [dicituraRitenuta, setDicituraRitenuta] = useState('');
    const [dicituraRivalsa, setDicituraRivalsa] = useState('');
    const [globalConfigs, setGlobalConfigs] = useState(null);
    const isEnabledGlobal = (key) => !globalConfigs || globalConfigs[key] === '1';

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
        idListino: '', // '' means default
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
        listaScadenzePagamentiDocumento: [],
        statoConfOrdine: 'BO'
    });

    const [prodotti, setProdotti] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Combos
    const [combos, setCombos] = useState({
        particelle: [],
        listini: [],
        tipiPagamento: [],
        risorse: [], // Banche
        aliquoteIva: [],
        unitaMisura: [],
        vettori: [],
        causaliTrasporto: [],
        aspettiBeni: [],
        tipiPorto: [],
        agenti: [], // For sync usage if needed
        progetti: []
    });

    const [clientIndirizzi, setClientIndirizzi] = useState([]);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [addressTarget, setAddressTarget] = useState('intestazione'); // 'intestazione' or 'destinazione'
    const [showProgettoModal, setShowProgettoModal] = useState(false);

    // Management Modals
    const [showParticelleModal, setShowParticelleModal] = useState(false);
    const [showUMModal, setShowUMModal] = useState(false);
    const [showIVAModal, setShowIVAModal] = useState(false);

    const [showActionsMenu, setShowActionsMenu] = useState(false);

    useEffect(() => {
        checkCeramica();
        const loadInitialData = async () => {
            checkCeramica();
            fetchCombos();
            fetchGlobalConfigs();
            if (!isNew) {
                fetchData();
            } else if (fromPreventiviId) {
                fetchDataFromPreventivo(fromPreventiviId);
            } else {
                fetchFatturazionePreferences();
                fetchNextNum(formData.dataDocumento);
            }
        };

        loadInitialData();
    }, [id, searchParams]);

    const checkCeramica = async () => {
        const conf = authService.getConfig();
        if (conf && conf.TIPO_NEGOZIO === 'ceramica') {
            setIsCeramica(true);
        }
    };

    const fetchCombos = async () => {
        try {
            const res = await ConfOrdineService.getCombosMap();
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
                    vettori: payload.VETTORI || payload.vettori || prev.vettori,
                    causaliTrasporto: payload.CAUSALITRASPORTO || payload.causaliTrasporto || prev.causaliTrasporto,
                    aspettiBeni: payload.ASPETTIBENI || payload.aspettiBeni || prev.aspettiBeni,
                    tipiPorto: payload.TIPIPORTO || payload.tipiPorto || prev.tipiPorto,
                    agenti: payload.AGENTI || payload.agenti || prev.agenti,
                    progetti: payload.PROGETTI || payload.progetti || prev.progetti,
                    ...payload
                }));
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Impossibile caricare i dati di base', 'error');
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
            const res = await ConfOrdineService.getById(id);
            if (res.data && res.data.payload) {
                const data = res.data.payload;
                // Fix date format if needed
                if (data.dataDocumento && data.dataDocumento.includes('/')) {
                    const parts = data.dataDocumento.split('/');
                    data.dataDocumento = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                setFormData(prev => ({ ...prev, ...data }));

                // Map produits to local state with calculation fields and 'tipo'
                const mappedProdotti = (data.prodotti || []).map(p => ({
                    ...p,
                    tipo: p.idProdotto ? 'A' : (p.fmDescrizione ? 'F' : 'N')
                }));
                setProdotti(mappedProdotti);

                // If client selected, load addresses
                if (data.idCliente) {
                    loadClientAddresses(data.idCliente);
                }
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Impossibile caricare la conferma d\'ordine', 'error');
            navigate('/conf-ordine');
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
                        nota: refText,
                        fmDescrizione: refText,
                        descrizione: refText,
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
                            nota: p.nota || p.fmDescrizione // Ensure note is populated if present in source
                        }));
                        allProdotti = [...allProdotti, ...mappedProdotti];
                    }
                }
            }

            if (firstPrevData) {
                setFormData(prev => ({
                    ...prev,
                    idCliente: firstPrevData.idCliente,
                    nomeCliente: firstPrevData.denominazioneCliente,
                    idAgente: firstPrevData.idAgente,
                    idProgetto: firstPrevData.idProgetto,
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
                    nazioneDestinazione: firstPrevData.nazioneDestinazione || 'Italia',
                    annotazioneEstesa: firstPrevData.annotazioneEstesa
                }));

                setProdotti(allProdotti);
                fetchNextNum(formData.dataDocumento);

                // If client selected, load addresses
                if (firstPrevData.idCliente) {
                    loadClientAddresses(firstPrevData.idCliente, false);
                }
            }
        } catch (error) {
            console.error("Error loading preventivo data:", error);
            Swal.fire('Errore', 'Impossibile caricare i dati del preventivo', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchNextNum = async (dateStr) => {
        if (!dateStr) return;
        try {
            const formattedDate = dateStr.split('-').reverse().join('/');
            const res = await ConfOrdineService.getNextNum(formattedDate);
            if (res.data && res.data.payload) {
                setFormData(prev => ({ ...prev, numDocumento: res.data.payload }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const loadClientAddresses = async (clientId, autoFill = true) => {
        try {
            // Parallel fetch: addresses + full client details
            const [resIndirizzi, resClient] = await Promise.all([
                ClientiService.getIndirizzi(clientId),
                ClientiService.getById(clientId)
            ]);

            const indirizzi = resIndirizzi.data?.payload || resIndirizzi.data || [];
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
                    // Ensure core fields are populated
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

    // --- Product Table Handlers ---


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

    // getRowValues from utils
    const calculateRowTotal = (row) => {
        return getRowValues(row, combos.aliquoteIva).total;
    };

    const calculateTotalDocument = () => {
        const prodTotal = prodotti.reduce((acc, row) => acc + calculateRowTotal(row), 0);
        const rivalsa = calculateRivalsaInps();
        
        let aliquotaIvaRivalsa = 22;
        if (prodotti.length > 0) {
            const firstRowIva = (combos.aliquoteIva || []).find(ai => ai.id === prodotti[0].idAliquotaIva);
            if (firstRowIva) aliquotaIvaRivalsa = firstRowIva.imposta;
        }
        const ivaRivalsa = (rivalsa * aliquotaIvaRivalsa) / 100;
        
        return prodTotal + rivalsa + ivaRivalsa;
    };

    const calculateTotalImponibile = () => {
        return prodotti.reduce((acc, row) => acc + getRowValues(row, combos.aliquoteIva).imponibile, 0);
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

    // --- Async Select Loaders ---

    const loadClienti = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 3) return callback([]);
        ClientiService.getSuggestion(inputValue).then(res => {
            // Updated to match ClientiService.getSuggestion response structure (direct list in res.data)
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

    // loadArticoli and formatArticleOptionLabel removed as handled by DocumentRows

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
                nomeAgente: c.agnRagioneSociale, // Check property name from search
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

    const saveConfOrdine = async () => {
        if (!validate()) return null;

        // Prepare payload
        // Format date to DD/MM/YYYY for backend
        const parts = formData.dataDocumento.split('-');
        const dtFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;

        const payload = {
            ...formData,
            dataDocumento: dtFormatted,
            prodotti: prodotti.map(p => ({
                ...p,
                prezzoImponibile: getRowValues(p, combos.aliquoteIva).imponibile
            })),
            idDocAssociato: fromPreventiviId ? parseInt(fromPreventiviId.split(',')[0]) : null,
            tipoDocAssociato: fromPreventiviId ? 'PREVENTIVO' : null,
            importoRitenutaAcconto: calculateRitenutaAcconto(),
            importoRivalsaInps: calculateRivalsaInps()
        };

        try {
            setLoading(true);
            const response = await ConfOrdineService.save(payload);
            // If it's a new record, the ID is in response.data.payload
            const savedId = response.data.payload || id;
            return savedId;
        } catch (error) {
            console.error(error);
            const msg = error.response?.data || 'Errore durante il salvataggio';
            Swal.fire('Errore', msg, 'error');
            return null;
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        const savedId = await saveConfOrdine();
        if (savedId) {
            Swal.fire({
                title: 'Salvato!',
                text: 'Conferma d\'ordine salvata con successo',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                navigate('/conf-ordine');
            });
        }
    };

    const handlePrint = async () => {
        const savedId = await saveConfOrdine();
        if (!savedId) return;

        try {
            setLoading(true);
            const response = await ConfOrdineService.print(savedId);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            printJS({
                printable: url,
                type: 'pdf',
                documentTitle: `Conferma_Ordine_${savedId}`
            });

            // Cleanup URL after a delay
            setTimeout(() => window.URL.revokeObjectURL(url), 1000);

            if (isNew) {
                navigate(`/conf-ordine/detail/${savedId}`, { replace: true });
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', 'Errore durante la generazione della stampa', 'error');
        } finally {
            setLoading(false);
            setShowActionsMenu(false);
        }
    };

    const handleExportPdf = handlePrint;

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val);
    };

    return (
        <div className="conf-ordine-detail-container entity-form-shared">
            <div id="confordine-content-header">
                <div>
                    <h1>{isNew ? 'Nuova' : 'Modifica'} Conferma d'Ordine</h1>
                    <div className="breadcrumb">
                        <span onClick={() => navigate('/conf-ordine')}>Elenco Conferme</span> / <span>{isNew ? 'Nuova' : formData.numDocumento}</span>
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
                                                    <input type="text" className="form-control premium-input" name="indirizzoIntestazione" value={formData.indirizzoIntestazione || ''} onChange={handleHeaderChange} autoComplete="off" />
                                                </div>
                                            </div>
                                            <div className="row mb-4">
                                                <div className="col-md-7">
                                                    <label className="premium-label">Cit<span>tà</span></label>
                                                    <input type="text" className="form-control premium-input" name="cittaIntestazione" value={formData.cittaIntestazione || ''} onChange={handleHeaderChange} autoComplete="off" />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="premium-label">Pr<span>ov</span>.</label>
                                                    <input type="text" className="form-control premium-input" name="provinciaIntestazione" value={formData.provinciaIntestazione || ''} onChange={handleHeaderChange} maxLength="2" autoComplete="off" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="premium-label">C<span>AP</span></label>
                                                    <input type="text" className="form-control premium-input" name="capIntestazione" value={formData.capIntestazione || ''} onChange={handleHeaderChange} autoComplete="off" />
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
                                                    <input type="text" className="form-control premium-input" name="indirizzoDestinazione" value={formData.indirizzoDestinazione || ''} onChange={handleHeaderChange} autoComplete="off" />
                                                </div>
                                            </div>
                                            <div className="row mb-4">
                                                <div className="col-md-7">
                                                    <label className="premium-label">Cit<span>tà</span></label>
                                                    <input type="text" className="form-control premium-input" name="cittaDestinazione" value={formData.cittaDestinazione || ''} onChange={handleHeaderChange} autoComplete="off" />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="premium-label">Pr<span>ov</span>.</label>
                                                    <input type="text" className="form-control premium-input" name="provinciaDestinazione" value={formData.provinciaDestinazione || ''} onChange={handleHeaderChange} maxLength="2" autoComplete="off" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="premium-label">C<span>AP</span></label>
                                                    <input type="text" className="form-control premium-input" name="capDestinazione" value={formData.capDestinazione || ''} onChange={handleHeaderChange} autoComplete="off" />
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

                        {/* Tab Pagamento */}
                        <div className={`tab-pane ${activeTab === 'pagamento' ? 'active' : ''}`}>
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
                                        })}
                                    />
                                </div>
                            </div>

                            <hr />
                            <h5>Trasporto</h5>
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Colli</label>
                                        <input type="number" className="form-control" name="colli" value={formData.colli || ''} onChange={handleHeaderChange} />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Peso Netto (kg)</label>
                                        <input type="number" step="0.01" className="form-control" name="pesoNetto" value={formData.pesoNetto || ''} onChange={handleHeaderChange} />
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Peso Lordo (kg)</label>
                                        <input type="number" step="0.01" className="form-control" name="pesoLordo" value={formData.pesoLordo || ''} onChange={handleHeaderChange} />
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
                                    setProdotti([...prodotti, newRow]);
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
                            <div className="form-group">
                                <label>Annotazione Estesa (verrà stampata in calce o su pagina separata)</label>
                                <textarea className="form-control" rows="15" name="annotazioneEstesa" value={formData.annotazioneEstesa || ''} onChange={handleHeaderChange} placeholder="Inserisci qui eventuali termini, condizioni o descrizioni dettagliate..."></textarea>
                            </div>
                        </div>
                    </form>
                </div>

                <footer className="main-box-footer detail-footer">
                    <button className="btn btn-premium-cancel" onClick={() => navigate('/conf-ordine')}>
                        <FaArrowLeft /> Annulla
                    </button>
                    <div className="footer-right">
                        <div className="split-btn-container">
                            <button type="button" className="btn-premium-save split-btn-main" onClick={handleSave}>
                                <FaSave /> Salva
                            </button>
                            <button type="button" className="split-btn-toggle" onClick={() => setShowActionsMenu(!showActionsMenu)}>
                                <FaCaretDown />
                            </button>
                            {showActionsMenu && (
                                <div className="split-btn-menu show">
                                    <button type="button" className="split-btn-item" onClick={handleSave}>
                                        <FaSave /> Salva solo
                                    </button>
                                    <button type="button" className="split-btn-item" onClick={handlePrint}>
                                        <FaPrint /> Stampa Documento
                                    </button>
                                    <button type="button" className="split-btn-item" onClick={handleExportPdf}>
                                        <FaFilePdf /> Esporta PDF
                                    </button>
                                    <div className="action-dropdown-divider"></div>
                                    <button type="button" className="split-btn-item" onClick={async () => {
                                        const savedId = await saveConfOrdine();
                                        if (savedId) navigate(`/ddt/new?fromConferme=${savedId}`);
                                    }}>
                                        <FaArrowRight /> Genera DDT
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

export default ConfOrdineDetail;
