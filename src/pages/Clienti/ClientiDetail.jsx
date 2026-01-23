import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import ClientiService from '../../services/ClientiService';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import AvvisiService from '../../services/AvvisiService'; // Import the new service
import AvvisiManagementModal from './AvvisiManagementModal';
import NoteDocumentiService from '../../services/NoteDocumentiService';
import NoteDocumentiManagementModal from './NoteDocumentiManagementModal';
import TipiPortoService from '../../services/TipiPortoService';
import TipiPortoManagementModal from './TipiPortoManagementModal';
import VettoriService from '../../services/VettoriService';
import VettoriManagementModal from './VettoriManagementModal';
import RisorseService from '../../services/RisorseService';
import RisorseManagementModal from './RisorseManagementModal';
import { parseIban } from '../../utils/ibanUtils';
import './ClientiDetail.css';
import { FaPlus, FaWrench, FaHome, FaAngleRight, FaFileSignature } from 'react-icons/fa';

const ClientiDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [showCommercialData, setShowCommercialData] = useState(true);
    const [showAvvisiModal, setShowAvvisiModal] = useState(false);
    const [showNoteDocumentiModal, setShowNoteDocumentiModal] = useState(false);
    const [showTipiPortoModal, setShowTipiPortoModal] = useState(false);
    const [showVettoriModal, setShowVettoriModal] = useState(false);
    const [showRisorseModal, setShowRisorseModal] = useState(false);

    // Address Management State
    const [activeAddressIndex, setActiveAddressIndex] = useState(0);

    // Contact Management State
    const [activeContactIndex, setActiveContactIndex] = useState(0);

    const [cliente, setCliente] = useState({
        codice: '',
        tipologia: 'PRIVATO',
        denominazione: '',
        codiceFiscale: '',
        partitaIva: '',
        note: '',
        referente: '',
        elencoIndirizzi: [], // Will be initialized with at least one
        elencoContatti: [], // Will be initialized with at least one
        idAvviso: '',
        idNota: '',
        // Commercial Data
        idRisorsa: '',
        idVettore: '',
        idTipoPorto: '',
        // Banking fields
        banca: '',
        iban: '',
        abi: '',
        cab: '',
        cin: '',
        conto: '',
        bic: '',
        codSia: ''
    });

    const [avvisiList, setAvvisiList] = useState([]);
    const [noteDocumentiList, setNoteDocumentiList] = useState([]);
    const [tipiPortoList, setTipiPortoList] = useState([]);
    const [vettoriList, setVettoriList] = useState([]);
    const [bancheList, setBancheList] = useState([]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Fetch Avvisi
                const avvisiRes = await AvvisiService.getAll();
                if (avvisiRes.data && Array.isArray(avvisiRes.data)) {
                    setAvvisiList(avvisiRes.data);
                } else {
                    console.warn("Avvisi response is not an array:", avvisiRes.data);
                    setAvvisiList([]); // Fallback to empty array
                }

                // Fetch Note Documenti
                const noteRes = await NoteDocumentiService.getAll();
                if (noteRes.data && Array.isArray(noteRes.data)) {
                    setNoteDocumentiList(noteRes.data);
                } else {
                    setNoteDocumentiList([]);
                }

                // Fetch Tipi Porto
                const tipiPortoRes = await TipiPortoService.getAllForCombo();
                if (tipiPortoRes.data && Array.isArray(tipiPortoRes.data)) {
                    setTipiPortoList(tipiPortoRes.data);
                } else {
                    setTipiPortoList([]);
                }

                // Fetch Vettori
                const vettoriRes = await VettoriService.getAllForCombo();
                if (vettoriRes.data && Array.isArray(vettoriRes.data)) {
                    setVettoriList(vettoriRes.data);
                } else {
                    setVettoriList([]);
                }

                // Fetch Banche
                const bancheRes = await RisorseService.getAllForCombo('BA');
                if (bancheRes.data && Array.isArray(bancheRes.data)) {
                    setBancheList(bancheRes.data);
                } else {
                    setBancheList([]);
                }

                // Fetch configuration
                const configResponse = await ConfigurazioneService.getByDomain('CLIENTI');
                if (configResponse.data) {
                    const val = configResponse.data['ABILITA_DATI_COMMERCIALI'] || configResponse.data['ABILITA_DATICOMMERCIALI'];
                    if (val === '0') {
                        setShowCommercialData(false);
                    }
                }

                if (!isNew) {
                    await fetchCliente(id);
                } else {
                    // Initialize empty lists for new client
                    setCliente(prev => ({
                        ...prev,
                        elencoIndirizzi: [{ tipologia: 'O', indirizzo: '', citta: '', cap: '', provincia: '', nazione: '', codiceUfficio: '' }],
                        elencoContatti: [{ referente: '', telefono: '', cellulare: '', fax: '', email: '', pec: '' }]
                    }));
                }
            } catch (error) {
                console.error("Error initializing page:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id, isNew]);

    const fetchCliente = async (clienteId) => {
        try {
            const response = await ClientiService.getById(clienteId);
            let data = response.data;

            // Map 'descrizione' to 'referente' for contacts if needed
            if (data.elencoContatti && Array.isArray(data.elencoContatti)) {
                data.elencoContatti = data.elencoContatti.map(c => ({
                    ...c,
                    referente: c.referente || c.descrizione || ''
                }));
            }

            // Ensure all banking fields are present, fallback to empty string if null
            data = {
                ...data,
                banca: data.banca || data.descrizioneBanca || '',
                iban: data.iban || '',
                abi: data.abi || '',
                cab: data.cab || '',
                cin: data.cin || '',
                conto: data.conto || '',
                bic: data.bic || '',
                codSia: data.codSia || '',
                // Ensure other fields are present
                idRisorsa: data.idRisorsa || '',
                idVettore: data.idVettore || '',
                idTipoPorto: data.idTipoPorto || '',
                idAvviso: data.idAvviso || '',
                idNota: data.idNota || ''
            };

            // Ensure at least one address exists
            if (!data.elencoIndirizzi || data.elencoIndirizzi.length === 0) {
                data.elencoIndirizzi = [{ tipologia: 'O', indirizzo: '', citta: '', cap: '', provincia: '', nazione: '', codiceUfficio: '' }];
            }

            // Ensure at least one contact exists
            if (!data.elencoContatti || data.elencoContatti.length === 0) {
                data.elencoContatti = [{ referente: '', telefono: '', cellulare: '', fax: '', email: '', pec: '' }];
            }

            setCliente(data);

        } catch (error) {
            console.error("Error fetching cliente:", error);
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'Impossibile caricare i dati del cliente.'
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCliente({ ...cliente, [name]: value });
    };

    // Address Management Methods
    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        const updatedIndirizzi = [...cliente.elencoIndirizzi];
        updatedIndirizzi[activeAddressIndex] = {
            ...updatedIndirizzi[activeAddressIndex],
            [name]: value
        };
        setCliente({ ...cliente, elencoIndirizzi: updatedIndirizzi });
    };

    const handleAddAddress = () => {
        const newAddress = { tipologia: 'O', indirizzo: '', citta: '', cap: '', provincia: '', nazione: '', codiceUfficio: '' };
        const updatedIndirizzi = [...cliente.elencoIndirizzi, newAddress];
        setCliente({ ...cliente, elencoIndirizzi: updatedIndirizzi });
        setActiveAddressIndex(updatedIndirizzi.length - 1);
    };

    const handleRemoveAddress = (e, index) => {
        e.stopPropagation(); // Prevent tab switch
        if (cliente.elencoIndirizzi.length <= 1) {
            Swal.fire({
                icon: 'warning',
                title: 'Attenzione',
                text: "Impossibile eliminare l'unico indirizzo."
            });
            return;
        }

        Swal.fire({
            title: 'Sei sicuro?',
            text: "Vuoi rimuovere questo indirizzo?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sì, rimuovi',
            cancelButtonText: 'Annulla'
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedIndirizzi = cliente.elencoIndirizzi.filter((_, i) => i !== index);
                setCliente({ ...cliente, elencoIndirizzi: updatedIndirizzi });
                if (activeAddressIndex >= updatedIndirizzi.length) {
                    setActiveAddressIndex(updatedIndirizzi.length - 1);
                }
            }
        });
    };

    const getAddressLabel = (addr, index) => {
        const typeMap = {
            'O': 'Sede Operativa',
            'L': 'Sede Legale',
            'M': 'Dest. Merce',
            'A': 'Sede Amm.',
            'T': 'Altro'
        };
        if (addr.descrizione) return addr.descrizione;
        if (addr.tipologia && typeMap[addr.tipologia]) return typeMap[addr.tipologia];
        return `Indirizzo ${index + 1}`;
    };

    // Contact Management Methods
    const handleContactChange = (e) => {
        const { name, value } = e.target;
        const updatedContatti = [...cliente.elencoContatti];
        updatedContatti[activeContactIndex] = {
            ...updatedContatti[activeContactIndex],
            [name]: value
        };
        setCliente({ ...cliente, elencoContatti: updatedContatti });

        // Sync main referente if changing generic one? 
        // Maybe better to keep them separate or sync the first one.
        // For now, let's just update the list. The legacy backend might expect main 'referente' field too.
        if (name === 'referente' && activeContactIndex === 0) {
            setCliente(prev => ({ ...prev, referente: value, elencoContatti: updatedContatti }));
        }
    };

    const handleAddContact = () => {
        const newContact = { referente: '', telefono: '', cellulare: '', fax: '', email: '', pec: '' };
        const updatedContatti = [...cliente.elencoContatti, newContact];
        setCliente({ ...cliente, elencoContatti: updatedContatti });
        setActiveContactIndex(updatedContatti.length - 1);
    };

    const handleRemoveContact = (e, index) => {
        e.stopPropagation();
        if (cliente.elencoContatti.length <= 1) {
            Swal.fire({
                icon: 'warning',
                title: 'Attenzione',
                text: "Impossibile eliminare l'unico contatto."
            });
            return;
        }

        Swal.fire({
            title: 'Sei sicuro?',
            text: "Vuoi rimuovere questo contatto?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sì, rimuovi',
            cancelButtonText: 'Annulla'
        }).then((result) => {
            if (result.isConfirmed) {
                const updatedContatti = cliente.elencoContatti.filter((_, i) => i !== index);
                setCliente({ ...cliente, elencoContatti: updatedContatti });
                if (activeContactIndex >= updatedContatti.length) {
                    setActiveContactIndex(updatedContatti.length - 1);
                }
            }
        });
    };

    const getContactLabel = (cont, index) => {
        if (cont.referente) return cont.referente;
        return `Contatto ${index + 1}`;
    };

    // --- AVVISI MANAGEMENT (Modal) ---
    const handleManageAvvisi = () => {
        setShowAvvisiModal(true);
    };

    const handleCloseAvvisiModal = async () => {
        setShowAvvisiModal(false);
        // Refresh dropdown
        setLoading(true);
        try {
            const res = await AvvisiService.getAll();
            if (res.data && Array.isArray(res.data)) {
                setAvvisiList(res.data);
            } else {
                setAvvisiList([]);
            }
        } catch (error) {
            console.warn("Refresh avvisi failed", error);
        } finally {
            setLoading(false);
        }
    };

    // --- NOTE DOCUMENTI MANAGEMENT (Modal) ---
    const handleManageNoteDocumenti = () => {
        setShowNoteDocumentiModal(true);
    };

    const handleCloseNoteDocumentiModal = async () => {
        setShowNoteDocumentiModal(false);
        setLoading(true);
        try {
            const res = await NoteDocumentiService.getAll();
            if (res.data && Array.isArray(res.data)) {
                setNoteDocumentiList(res.data);
            } else {
                setNoteDocumentiList([]);
            }
        } catch (error) {
            console.warn("Refresh note failed", error);
        } finally {
            setLoading(false);
        }
    };

    // --- TIPI PORTO MANAGEMENT (Modal) ---
    const handleManageTipiPorto = () => {
        setShowTipiPortoModal(true);
    };

    const handleCloseTipiPortoModal = async () => {
        setShowTipiPortoModal(false);
        setLoading(true);
        try {
            const res = await TipiPortoService.getAllForCombo();
            if (res.data && Array.isArray(res.data)) {
                setTipiPortoList(res.data);
            } else {
                setTipiPortoList([]);
            }
        } catch (error) {
            console.warn("Refresh tipi porto failed", error);
        } finally {
            setLoading(false);
        }
    };

    // --- VETTORI MANAGEMENT (Modal) ---
    const handleIbanChange = (e) => {
        const newIban = e.target.value.toUpperCase();
        const parsed = parseIban(newIban);

        setFormState(prev => ({
            ...prev,
            iban: newIban,
            // Only auto-fill if it's an Italian IBAN and we have parsed data
            // parsing logic in ibanUtils handles the decision (returns fields if IT, otherwise empty/null if parse fails or non-IT)
            // But we only want to overwrite if it WAS parsed. 
            // Actually, if it's non-IT, parseIban returns country but other fields empty.
            // If the user manually set fields, we might not want to clear them immediately unless we are sure.
            // For simplicity and user expectation: if it is IT, we force the fields.
            ...(parsed.country === 'IT' ? {
                abi: parsed.abi,
                cab: parsed.cab,
                cin: parsed.cin,
                conto: parsed.conto
            } : {})
        }));
    };

    const handleManageVettori = () => {
        setShowVettoriModal(true);
    };

    const handleCloseVettoriModal = async () => {
        setShowVettoriModal(false);
        setLoading(true);
        try {
            const res = await VettoriService.getAllForCombo();
            if (res.data && Array.isArray(res.data)) {
                setVettoriList(res.data);
            } else {
                setVettoriList([]);
            }
        } catch (error) {
            console.warn("Refresh vettori failed", error);
        } finally {
            setLoading(false);
        }
    };

    // --- RISORSE (BANCHE) MANAGEMENT (Modal) ---
    const handleManageRisorse = () => {
        setShowRisorseModal(true);
    };

    const handleCloseRisorseModal = async () => {
        setShowRisorseModal(false);
        setLoading(true);
        try {
            const res = await RisorseService.getAllForCombo('BA');
            if (res.data && Array.isArray(res.data)) {
                setBancheList(res.data);
            } else {
                setBancheList([]);
            }
        } catch (error) {
            console.warn("Refresh banche failed", error);
        } finally {
            setLoading(false);
        }
    };

    const generateCodice = async () => {
        try {
            const response = await ClientiService.generateCodice();
            if (response.data && response.data.payload) {
                setCliente(prev => ({ ...prev, codice: response.data.payload }));
            }
        } catch (error) {
            console.error("Error generating code", error);
            setCliente(prev => ({ ...prev, codice: '000001' })); // Fallback
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const updatedCliente = { ...cliente };

        // Sanitize integer fields: convert empty strings to null to avoid 400 Bad Request
        const intFields = [
            'idRisorsa', 'idVettore', 'idTipoPorto', 'idAvviso', 'idNota',
            'idAgente', 'idListino', 'idZonaCompetenza', 'idSottoconto', 'idLingua',
            'idAliquotaIva', 'idTipoPagamento'
        ];

        intFields.forEach(field => {
            if (updatedCliente[field] === '') {
                updatedCliente[field] = null;
            }
        });

        // Sync banca and descrizioneBanca
        updatedCliente.descrizioneBanca = updatedCliente.banca;

        try {
            if (isNew) {
                await ClientiService.insert(updatedCliente);
            } else {
                await ClientiService.update(id, updatedCliente);
            }
            navigate('/clienti');
        } catch (error) {
            console.error("Error saving cliente:", error);
            if (error.response) {
                console.error("Server response data:", error.response.data);
                console.error("Server response status:", error.response.status);
                console.error("Server response headers:", error.response.headers);
            }
            let errorMessage = 'Errore durante il salvataggio.';
            if (error.response && error.response.data && error.response.data.errorText) {
                errorMessage = error.response.data.errorText;
            }

            Swal.fire({
                icon: 'error',
                title: 'Si è verificato un errore',
                text: errorMessage,
                confirmButtonColor: '#03a9f4',
                confirmButtonText: 'Chiudi'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading && !cliente.codice && !isNew) return <div>Caricamento...</div>;

    // Helper to get active address safely
    // Helper to get active address safely
    const currentAddress = cliente.elencoIndirizzi[activeAddressIndex] || {};
    // Helper to get active contact safely 
    const currentContact = cliente.elencoContatti[activeContactIndex] || {};

    return (
        <div className="clienti-detail-container">
            {/* Breadcrumb */}
            <ul className="breadcrumb">
                <li><Link to="/">Home</Link></li>
                <li><FaAngleRight /></li>
                <li className="active">{isNew ? 'Nuovo cliente' : 'Modifica cliente'}</li>
            </ul>

            <h1>{isNew ? 'Nuovo cliente' : `Modifica cliente`}</h1>

            <form onSubmit={handleSubmit}>
                {/* Tabs */}
                <ul className="nav nav-tabs nav-tabs-custom">
                    <li className={activeTab === 'general' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('general'); }}>
                            Informazioni generali
                        </a>
                    </li>
                    <li className={activeTab === 'other' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('other'); }}>
                            Altre informazioni
                        </a>
                    </li>
                </ul>

                <div className="tab-content">
                    {/* General Information Tab */}
                    <div className={`tab-pane ${activeTab === 'general' ? 'active' : ''}`} style={{ display: activeTab === 'general' ? 'block' : 'none' }}>

                        {/* Basic Info Row - Unchanged */}
                        <div className="row">
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="required">Codice</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="codice"
                                            value={cliente.codice}
                                            onChange={handleChange}
                                            placeholder="Inserisci codice"
                                            required
                                        />
                                        <span className="input-group-btn">
                                            <button className="btn btn-primary-custom btn-addon" type="button" onClick={generateCodice}>
                                                Genera codice
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-5">
                                <div className="form-group">
                                    <label className="required">Tipologia</label>
                                    <select
                                        className="form-control"
                                        name="tipologia"
                                        value={cliente.tipologia}
                                        onChange={handleChange}
                                    >
                                        <option value="PRIVATO">Privato</option>
                                        <option value="AZIENDA">Azienda</option>
                                        <option value="PUBBLICA_AMMINISTRAZIONE">Pubblica amministrazione</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-8">
                                <div className="form-group">
                                    <label className="required">Denominazione</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="denominazione"
                                        value={cliente.denominazione}
                                        onChange={handleChange}
                                        placeholder="Inserisci denominazione"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label>Codice fiscale</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="codiceFiscale"
                                        value={cliente.codiceFiscale}
                                        onChange={handleChange}
                                        placeholder="Inserisci codice fiscale"
                                    />
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label>Partita Iva</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="partitaIva"
                                        value={cliente.partitaIva}
                                        onChange={handleChange}
                                        placeholder="Inserisci partita iva"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* SMART TABS for Addresses */}
                        <div className="smart-tabs-container">
                            <label style={{ display: 'block', marginBottom: '10px', color: '#555', fontWeight: 'bold' }}>Indirizzi</label>
                            <div className="smart-tabs">
                                {cliente.elencoIndirizzi.map((addr, index) => (
                                    <div
                                        key={index}
                                        className={`smart-tab ${activeAddressIndex === index ? 'active' : ''}`}
                                        onClick={() => setActiveAddressIndex(index)}
                                    >
                                        {getAddressLabel(addr, index)}
                                        {cliente.elencoIndirizzi.length > 1 && (
                                            <span className="remove-tab" onClick={(e) => handleRemoveAddress(e, index)} title="Rimuovi">×</span>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn-add-tab" onClick={handleAddAddress} title="Aggiungi Indirizzo">+</button>
                            </div>
                        </div>

                        {/* Indirizzo Fields (Bound to currentAddress) */}
                        <div className="smart-fields-panel">
                            <div className="row">
                                <div className="col-md-3">
                                    <div className="form-group">
                                        <label>Tipo Indirizzo</label>
                                        <select
                                            className="form-control"
                                            name="tipologia"
                                            value={currentAddress.tipologia || 'O'}
                                            onChange={handleAddressChange}
                                        >
                                            <option value="O">Sede Operativa</option>
                                            <option value="L">Sede Legale</option>
                                            <option value="A">Sede Amministrativa</option>
                                            <option value="M">Destinazione Merce</option>
                                            <option value="T">Altro</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="col-md-5">
                                    <div className="form-group">
                                        <label>Indirizzo</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="indirizzo"
                                            value={currentAddress.indirizzo || ''}
                                            onChange={handleAddressChange}
                                            placeholder="Via/Piazza..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Città</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="citta"
                                            value={currentAddress.citta || ''}
                                            onChange={handleAddressChange}
                                            placeholder="Inserisci città"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-1">
                                    <div className="form-group">
                                        <label>Cap</label>
                                        <input
                                            type="text"
                                            maxLength="6"
                                            className="form-control"
                                            name="cap"
                                            value={currentAddress.cap || ''}
                                            onChange={handleAddressChange}
                                            placeholder="Cap"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-1">
                                    <div className="form-group">
                                        <label title="Provincia">Prov.</label>
                                        <input
                                            type="text"
                                            maxLength="2"
                                            className="form-control"
                                            name="provincia"
                                            value={currentAddress.provincia || ''}
                                            onChange={handleAddressChange}
                                            placeholder="Pr"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-2">
                                    <div className="form-group">
                                        <label>Nazione</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="nazione"
                                            value={currentAddress.nazione || ''}
                                            onChange={handleAddressChange}
                                            placeholder="Nazione"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Codice ufficio</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="codiceUfficio"
                                            value={currentAddress.codiceUfficio || ''}
                                            onChange={handleAddressChange}
                                            placeholder="Codice ufficio"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contatti Section */}
                        {/* SMART TABS for Contatti */}
                        <div className="smart-tabs-container">
                            <label style={{ display: 'block', marginBottom: '10px', color: '#555', fontWeight: 'bold' }}>Contatti</label>
                            <div className="smart-tabs">
                                {cliente.elencoContatti.map((cont, index) => (
                                    <div
                                        key={index}
                                        className={`smart-tab ${activeContactIndex === index ? 'active' : ''}`}
                                        onClick={() => setActiveContactIndex(index)}
                                    >
                                        {getContactLabel(cont, index)}
                                        {cliente.elencoContatti.length > 1 && (
                                            <span className="remove-tab" onClick={(e) => handleRemoveContact(e, index)} title="Rimuovi">×</span>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn-add-tab" onClick={handleAddContact} title="Aggiungi Contatto">+</button>
                            </div>
                        </div>

                        {/* Contatto Fields (Bound to currentContact) */}
                        <div className="smart-fields-panel">
                            {/* NOTE: We need to define currentContact inside render before return */}

                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Referente</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="referente"
                                            value={currentContact.referente || ''}
                                            onChange={handleContactChange}
                                            placeholder="Inserisci referente"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Telefono</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="telefono"
                                            value={currentContact.telefono || ''}
                                            onChange={handleContactChange}
                                            placeholder="Inserisci num. telefono"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Cellulare</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="cellulare"
                                            value={currentContact.cellulare || ''}
                                            onChange={handleContactChange}
                                            placeholder="Inserisci num. cellulare"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Fax</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="fax"
                                            value={currentContact.fax || ''}
                                            onChange={handleContactChange}
                                            placeholder="Inserisci num. fax"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="email"
                                            value={currentContact.email || ''}
                                            onChange={handleContactChange}
                                            placeholder="Inserisci email"
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="form-group">
                                        <label>Pec</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="pec"
                                            value={currentContact.pec || ''}
                                            onChange={handleContactChange}
                                            placeholder="Inserisci pec"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Note Section */}
                        <h3 className="section-header">Note</h3>
                        <div className="row">
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label>Note</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        name="note"
                                        value={cliente.note}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Other Information Tab (Unchanged) */}
                    <div className={`tab-pane ${activeTab === 'other' ? 'active' : ''}`} style={{ display: activeTab === 'other' ? 'block' : 'none' }}>
                        {showCommercialData && (
                            <>
                                <h3 className="section-header">Coordinate bancarie cliente</h3>

                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Banca</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="banca"
                                                value={cliente.banca || ''}
                                                onChange={handleChange}
                                                placeholder="Nome della banca"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>IBAN</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="iban"
                                                value={cliente.iban || ''}
                                                onChange={handleIbanChange}
                                                placeholder="IT00X0000000000000000000000"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-2 col-xs-6">
                                        <div className="form-group">
                                            <label>ABI</label>
                                            <input type="text" className="form-control input-sm" name="abi" value={cliente.abi || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-2 col-xs-6">
                                        <div className="form-group">
                                            <label>CAB</label>
                                            <input type="text" className="form-control input-sm" name="cab" value={cliente.cab || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-2 col-xs-4">
                                        <div className="form-group">
                                            <label>CIN</label>
                                            <input type="text" className="form-control input-sm" name="cin" value={cliente.cin || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-4 col-xs-8">
                                        <div className="form-group">
                                            <label>Conto</label>
                                            <input type="text" className="form-control input-sm" name="conto" value={cliente.conto || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-3 col-xs-6">
                                        <div className="form-group">
                                            <label>BIC/SWIFT</label>
                                            <input type="text" className="form-control" name="bic" value={cliente.bic || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-3 col-xs-6">
                                        <div className="form-group">
                                            <label>Codice SIA</label>
                                            <input type="text" className="form-control" name="codSia" value={cliente.codSia || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>

                                <h3 className="section-header">Dati commerciali</h3>

                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Nostra banca</label>
                                            <div className="input-group">
                                                <select className="form-control" name="idRisorsa" value={cliente.idRisorsa || ''} onChange={handleChange}>
                                                    <option value="">Seleziona banca...</option>
                                                    {bancheList.map(b => (
                                                        <option key={b.id} value={b.id}>{b.descrizione}</option>
                                                    ))}
                                                </select>
                                                <span className="input-group-btn">
                                                    <button className="btn btn-wrench" type="button" onClick={handleManageRisorse}><FaWrench /></button>
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Vettore</label>
                                            <div className="input-group">
                                                <select className="form-control" name="idVettore" value={cliente.idVettore || ''} onChange={handleChange}>
                                                    <option value="">Seleziona vettore...</option>
                                                    {vettoriList.map(v => (
                                                        <option key={v.id} value={v.id}>{v.descrizione}</option>
                                                    ))}
                                                </select>
                                                <span className="input-group-btn">
                                                    <button className="btn btn-wrench" type="button" onClick={handleManageVettori}><FaWrench /></button>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Tipo porto</label>
                                            <div className="input-group">
                                                <select className="form-control" name="idTipoPorto" value={cliente.idTipoPorto || ''} onChange={handleChange}>
                                                    <option value="">Seleziona tipo porto...</option>
                                                    {tipiPortoList.map(tp => (
                                                        <option key={tp.id} value={tp.id}>{tp.descrizione}</option>
                                                    ))}
                                                </select>
                                                <span className="input-group-btn">
                                                    <button className="btn btn-wrench" type="button" onClick={handleManageTipiPorto}><FaWrench /></button>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <h3 className="section-header">Nei documenti</h3>
                        {/* Doc Fields... same as before */}
                        <div className="row">
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label>Mostra avviso</label>
                                    <div className="input-group">
                                        <select className="form-control" name="idAvviso" value={cliente.idAvviso || ''} onChange={handleChange}>
                                            <option value="">Seleziona un avviso...</option>
                                            {avvisiList.map(av => (
                                                <option key={av.id} value={av.id}>{av.descrizione}</option>
                                            ))}
                                        </select>
                                        <span className="input-group-btn">
                                            <button className="btn btn-wrench" type="button" onClick={handleManageAvvisi}><FaWrench /></button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label>Inserisci nota</label>
                                    <div className="input-group">
                                        <select className="form-control" name="idNota" value={cliente.idNota || ''} onChange={handleChange}>
                                            <option value="">Seleziona una nota...</option>
                                            {noteDocumentiList.map(n => (
                                                <option key={n.id} value={n.id}>{n.descrizione}</option>
                                            ))}
                                        </select>
                                        <span className="input-group-btn">
                                            <button className="btn btn-wrench" type="button" onClick={handleManageNoteDocumenti}><FaWrench /></button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer Actions */}
                <div className="form-actions">
                    <Link to="/clienti" className="btn btn-default-custom">Annulla</Link>
                    <button type="submit" className="btn btn-danger-custom">Salva</button>
                </div>
            </form>
            {showAvvisiModal && (
                <AvvisiManagementModal onClose={handleCloseAvvisiModal} />
            )}
            {showNoteDocumentiModal && (
                <NoteDocumentiManagementModal onClose={handleCloseNoteDocumentiModal} />
            )}
            {showTipiPortoModal && (
                <TipiPortoManagementModal onClose={handleCloseTipiPortoModal} />
            )}
            {showVettoriModal && (
                <VettoriManagementModal onClose={handleCloseVettoriModal} />
            )}
            {showRisorseModal && (
                <RisorseManagementModal onClose={handleCloseRisorseModal} initialTipologia="BA" />
            )}
        </div>
    );
};

export default ClientiDetail;

