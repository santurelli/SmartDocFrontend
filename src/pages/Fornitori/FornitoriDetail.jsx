import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import FornitoriService from '../../services/FornitoriService';
import CittaService from '../../services/CittaService';
import AsyncCreatableSelect from 'react-select/async-creatable';
import { components } from 'react-select';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import AvvisiService from '../../services/AvvisiService'; // Shared
import NoteDocumentiService from '../../services/NoteDocumentiService'; // Shared
import TipiPortoService from '../../services/TipiPortoService'; // Shared
import VettoriService from '../../services/VettoriService'; // Shared
import RisorseService from '../../services/RisorseService'; // Shared
import CategorieSpesaService from '../../services/CategorieSpesaService';
import { parseIban } from '../../utils/ibanUtils';
import './FornitoriDetail.css';
import { FaPlus, FaWrench, FaHome, FaAngleRight, FaFileSignature } from 'react-icons/fa';

// Reuse Modals from Clienti for now (assuming they are generic enough)
import AvvisiManagementModal from '../Clienti/AvvisiManagementModal';
import NoteDocumentiManagementModal from '../Clienti/NoteDocumentiManagementModal';
import TipiPortoManagementModal from '../Clienti/TipiPortoManagementModal';
import VettoriManagementModal from '../Clienti/VettoriManagementModal';
import RisorseManagementModal from '../Clienti/RisorseManagementModal';

const FornitoriDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [showCommercialData, setShowCommercialData] = useState(true);

    // Modals state
    const [showAvvisiModal, setShowAvvisiModal] = useState(false);
    const [showNoteDocumentiModal, setShowNoteDocumentiModal] = useState(false);
    const [showTipiPortoModal, setShowTipiPortoModal] = useState(false);
    const [showVettoriModal, setShowVettoriModal] = useState(false);
    const [showRisorseModal, setShowRisorseModal] = useState(false);

    // Address Management State
    const [activeAddressIndex, setActiveAddressIndex] = useState(0);

    // Contact Management State
    const [activeContactIndex, setActiveContactIndex] = useState(0);

    const [fornitore, setFornitore] = useState({
        codice: '',
        denominazione: '',
        codiceFiscale: '',
        partitaIva: '',
        note: '',
        referente: '',
        elencoIndirizzi: [],
        elencoContatti: [],
        idAvviso: '',
        idNota: '',
        // Commercial Data
        idRisorsa: '', // Nostra Banca
        idVettore: '',
        idTipoPorto: '',
        idCategoriaSpesa: '',
        // Banking fields (Fornitore specifics?)
        // Legacy 'nuovo.jsp' has 'coordinate bancarie' disabled input + 'Imposta' button.
        // But also 'banca', 'iban', etc. mappings in DAO (FORNITORI_I01).
        // I'll include them.
        banca: '',
        iban: '',
        abi: '',
        cab: '',
        cin: '',
        conto: '',
        bic: '',
        codSia: '',
        descrizioneBanca: ''
    });

    const [avvisiList, setAvvisiList] = useState([]);
    const [noteDocumentiList, setNoteDocumentiList] = useState([]);
    const [tipiPortoList, setTipiPortoList] = useState([]);
    const [vettoriList, setVettoriList] = useState([]);
    const [bancheList, setBancheList] = useState([]);
    const [categorieSpesaList, setCategorieSpesaList] = useState([]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // Fetch Avvisi
                const avvisiRes = await AvvisiService.getAll();
                if (avvisiRes.data && Array.isArray(avvisiRes.data)) setAvvisiList(avvisiRes.data);

                // Fetch Note Documenti
                const noteRes = await NoteDocumentiService.getAll();
                if (noteRes.data && Array.isArray(noteRes.data)) setNoteDocumentiList(noteRes.data);

                // Fetch Tipi Porto
                const tipiPortoRes = await TipiPortoService.getAllForCombo();
                if (tipiPortoRes.data && Array.isArray(tipiPortoRes.data)) setTipiPortoList(tipiPortoRes.data);

                // Fetch Vettori
                const vettoriRes = await VettoriService.getAllForCombo();
                if (vettoriRes.data && Array.isArray(vettoriRes.data)) setVettoriList(vettoriRes.data);

                // Fetch Banche
                const bancheRes = await RisorseService.getAllForCombo('BA');
                if (bancheRes.data && Array.isArray(bancheRes.data)) setBancheList(bancheRes.data);

                // Fetch Categorie Spesa
                const catRes = await CategorieSpesaService.getAllForCombo();
                if (catRes.data && Array.isArray(catRes.data)) setCategorieSpesaList(catRes.data);

                // Fetch configuration (Domain: FORNITORI)
                const configResponse = await ConfigurazioneService.getByDomain('FORNITORI');
                if (configResponse.data) {
                    const val = configResponse.data['ABILITA_DATI_COMMERCIALI'] || configResponse.data['ABILITA_DATICOMMERCIALI'];
                    if (val === '0') {
                        setShowCommercialData(false);
                    }
                }

                if (!isNew) {
                    await fetchFornitore(id);
                } else {
                    setFornitore(prev => ({
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

    const fetchFornitore = async (idFornitore) => {
        try {
            const response = await FornitoriService.getById(idFornitore);
            let data = response.data;

            if (data.elencoContatti && Array.isArray(data.elencoContatti)) {
                data.elencoContatti = data.elencoContatti.map(c => ({
                    ...c,
                    referente: c.referente || c.descrizione || ''
                }));
            }

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
                idRisorsa: data.idRisorsa || '',
                idVettore: data.idVettore || '',
                idTipoPorto: data.idTipoPorto || '',
                idAvviso: data.idAvviso || '',
                idNota: data.idNota || '',
                idCategoriaSpesa: data.idCategoriaSpesa || ''
            };

            if (!data.elencoIndirizzi || data.elencoIndirizzi.length === 0) {
                data.elencoIndirizzi = [{ tipologia: 'O', indirizzo: '', citta: '', cap: '', provincia: '', nazione: '', codiceUfficio: '' }];
            }

            if (!data.elencoContatti || data.elencoContatti.length === 0) {
                data.elencoContatti = [{ referente: '', telefono: '', cellulare: '', fax: '', email: '', pec: '' }];
            }

            setFornitore(data);

        } catch (error) {
            console.error("Error fetching fornitore:", error);
            Swal.fire({
                icon: 'error',
                title: 'Errore',
                text: 'Impossibile caricare i dati del fornitore.'
            });
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFornitore({ ...fornitore, [name]: value });
    };

    // Address Management Methods
    const loadCityOptions = (inputValue) => {
        if (!inputValue || inputValue.length < 3) return Promise.resolve([]);
        return CittaService.getSuggestion(inputValue).then(response => {
            return response.data;
        });
    };

    const handleCityChange = (selectedOption) => {
        const updatedIndirizzi = [...fornitore.elencoIndirizzi];

        let newValues = {};
        if (selectedOption) {
            // Check if it's a created option (string or object with __isNew__)
            if (selectedOption.__isNew__ || !selectedOption.nome) {
                newValues = {
                    citta: selectedOption.label || selectedOption.value || selectedOption,
                    // keep other fields empty or as is? Better empty to strictly allow typing
                    cap: '',
                    provincia: '',
                    nazione: ''
                };
            } else {
                newValues = {
                    citta: selectedOption.nome,
                    cap: selectedOption.cap,
                    provincia: selectedOption.provincia,
                    nazione: 'Italia'
                };
            }
        } else {
            newValues = { citta: '', cap: '', provincia: '', nazione: '' };
        }

        updatedIndirizzi[activeAddressIndex] = {
            ...updatedIndirizzi[activeAddressIndex],
            ...newValues
        };
        setFornitore({ ...fornitore, elencoIndirizzi: updatedIndirizzi });
    };

    const CustomMenuList = (props) => {
        // Hide menu list if there are no options or only the "Create" option (new)
        const hasOptions = props.options && props.options.length > 0;
        const onlyNewOption = hasOptions && props.options.length === 1 && props.options[0].__isNew__;

        if (!hasOptions || onlyNewOption) {
            return null;
        }
        return <components.MenuList {...props} />;
    };

    const formatCityOption = (data, { context }) => {
        if (context === 'menu') {
            if (data.__isNew__ || !data.cap) {
                return (
                    <div style={{ fontWeight: 'bold' }}>
                        {data.label || data.nome || data.value}
                        <span style={{ fontSize: '0.8em', fontStyle: 'italic', fontWeight: 'normal', marginLeft: '8px', color: '#888' }}>(Nuovo)</span>
                    </div>
                );
            }
            return (
                <div>
                    <div style={{ fontWeight: 'bold' }}>{data.nome}</div>
                    <div style={{ fontSize: '0.85em', color: '#666' }}>
                        {data.cap} ({data.provincia})
                    </div>
                </div>
            );
        }
        return data.nome || data.label;
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        const updatedIndirizzi = [...fornitore.elencoIndirizzi];
        updatedIndirizzi[activeAddressIndex] = {
            ...updatedIndirizzi[activeAddressIndex],
            [name]: value
        };
        setFornitore({ ...fornitore, elencoIndirizzi: updatedIndirizzi });
    };

    const handleAddAddress = () => {
        const newAddress = { tipologia: 'O', indirizzo: '', citta: '', cap: '', provincia: '', nazione: '', codiceUfficio: '' };
        const updatedIndirizzi = [...fornitore.elencoIndirizzi, newAddress];
        setFornitore({ ...fornitore, elencoIndirizzi: updatedIndirizzi });
        setActiveAddressIndex(updatedIndirizzi.length - 1);
    };

    const handleRemoveAddress = (e, index) => {
        e.stopPropagation();
        if (fornitore.elencoIndirizzi.length <= 1) {
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
                const updatedIndirizzi = fornitore.elencoIndirizzi.filter((_, i) => i !== index);
                setFornitore({ ...fornitore, elencoIndirizzi: updatedIndirizzi });
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
        const updatedContatti = [...fornitore.elencoContatti];
        updatedContatti[activeContactIndex] = {
            ...updatedContatti[activeContactIndex],
            [name]: value
        };
        setFornitore({ ...fornitore, elencoContatti: updatedContatti });

        if (name === 'referente' && activeContactIndex === 0) {
            setFornitore(prev => ({ ...prev, referente: value, elencoContatti: updatedContatti }));
        }
    };

    const handleAddContact = () => {
        const newContact = { referente: '', telefono: '', cellulare: '', fax: '', email: '', pec: '' };
        const updatedContatti = [...fornitore.elencoContatti, newContact];
        setFornitore({ ...fornitore, elencoContatti: updatedContatti });
        setActiveContactIndex(updatedContatti.length - 1);
    };

    const handleRemoveContact = (e, index) => {
        e.stopPropagation();
        if (fornitore.elencoContatti.length <= 1) {
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
                const updatedContatti = fornitore.elencoContatti.filter((_, i) => i !== index);
                setFornitore({ ...fornitore, elencoContatti: updatedContatti });
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

    // Modal Handlers (Simplified - mostly reuse logic from ClientiDetail or just simple toggles)
    const handleManageAvvisi = () => setShowAvvisiModal(true);
    const handleCloseAvvisiModal = async () => {
        setShowAvvisiModal(false);
        const res = await AvvisiService.getAll();
        if (res.data && Array.isArray(res.data)) setAvvisiList(res.data);
    };

    const handleManageNoteDocumenti = () => setShowNoteDocumentiModal(true);
    const handleCloseNoteDocumentiModal = async () => {
        setShowNoteDocumentiModal(false);
        const res = await NoteDocumentiService.getAll();
        if (res.data && Array.isArray(res.data)) setNoteDocumentiList(res.data);
    };

    const handleManageTipiPorto = () => setShowTipiPortoModal(true);
    const handleCloseTipiPortoModal = async () => {
        setShowTipiPortoModal(false);
        const res = await TipiPortoService.getAllForCombo();
        if (res.data && Array.isArray(res.data)) setTipiPortoList(res.data);
    };

    const handleManageVettori = () => setShowVettoriModal(true);
    const handleCloseVettoriModal = async () => {
        setShowVettoriModal(false);
        const res = await VettoriService.getAllForCombo();
        if (res.data && Array.isArray(res.data)) setVettoriList(res.data);
    };

    const handleManageRisorse = () => setShowRisorseModal(true);
    const handleCloseRisorseModal = async () => {
        setShowRisorseModal(false);
        const res = await RisorseService.getAllForCombo('BA');
        if (res.data && Array.isArray(res.data)) setBancheList(res.data);
    };

    // --- IBAN Management ---
    const handleIbanChange = (e) => {
        const newIban = e.target.value.toUpperCase();
        const parsed = parseIban(newIban);

        setFornitore(prev => ({
            ...prev,
            iban: newIban,
            // Only auto-fill if it's an Italian IBAN and we have parsed data
            ...(parsed.country === 'IT' ? {
                abi: parsed.abi,
                cab: parsed.cab,
                cin: parsed.cin,
                conto: parsed.conto
            } : {})
        }));
    };

    const generateCodice = async () => {
        try {
            const response = await FornitoriService.generateCodice();
            if (response.data && response.data.payload) {
                setFornitore(prev => ({ ...prev, codice: response.data.payload }));
            }
        } catch (error) {
            console.error("Error generating code", error);
            setFornitore(prev => ({ ...prev, codice: '000001' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const updatedFornitore = { ...fornitore };

        // Integer field sanitization
        const intFields = [
            'idRisorsa', 'idVettore', 'idTipoPorto', 'idAvviso', 'idNota', 'idCategoriaSpesa', 'idAliquotaIva', 'idTipoPagamento'
        ];
        intFields.forEach(field => {
            if (updatedFornitore[field] === '') updatedFornitore[field] = null;
        });

        updatedFornitore.descrizioneBanca = updatedFornitore.banca;

        try {
            if (isNew) {
                await FornitoriService.insert(updatedFornitore);
            } else {
                await FornitoriService.update(id, updatedFornitore);
            }
            navigate('/fornitori');
        } catch (error) {
            console.error("Error saving fornitore:", error);
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

    if (loading && !fornitore.codice && !isNew) return <div>Caricamento...</div>;

    const currentAddress = fornitore.elencoIndirizzi[activeAddressIndex] || {};
    const currentContact = fornitore.elencoContatti[activeContactIndex] || {};

    return (
        <div className="fornitori-detail-container">
            {/* Breadcrumb */}
            <ul className="breadcrumb">
                <li><Link to="/">Home</Link></li>
                <li><FaAngleRight /></li>
                <li><Link to="/fornitori">Elenco fornitori</Link></li>
                <li><FaAngleRight /></li>
                <li className="active">{isNew ? 'Nuovo fornitore' : 'Modifica fornitore'}</li>
            </ul>

            <h1>{isNew ? 'Nuovo fornitore' : `Modifica fornitore`}</h1>

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

                        <div className="row">
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label className="required">Codice</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="codice"
                                            value={fornitore.codice}
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
                        </div>

                        <div className="row">
                            <div className="col-md-8">
                                <div className="form-group">
                                    <label className="required">Denominazione</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="denominazione"
                                        value={fornitore.denominazione}
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
                                        value={fornitore.codiceFiscale}
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
                                        value={fornitore.partitaIva}
                                        onChange={handleChange}
                                        placeholder="Inserisci partita iva"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Indirizzi Section */}
                        <div className="smart-tabs-container">
                            <label style={{ display: 'block', marginBottom: '10px', color: '#555', fontWeight: 'bold' }}>Indirizzi</label>
                            <div className="smart-tabs">
                                {fornitore.elencoIndirizzi.map((addr, index) => (
                                    <div
                                        key={index}
                                        className={`smart-tab ${activeAddressIndex === index ? 'active' : ''}`}
                                        onClick={() => setActiveAddressIndex(index)}
                                    >
                                        {getAddressLabel(addr, index)}
                                        {fornitore.elencoIndirizzi.length > 1 && (
                                            <span className="remove-tab" onClick={(e) => handleRemoveAddress(e, index)} title="Rimuovi">×</span>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn-add-tab" onClick={handleAddAddress} title="Aggiungi Indirizzo">+</button>
                            </div>
                        </div>

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
                                            <option value="M">Dest. Merce</option>
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
                                        <AsyncCreatableSelect
                                            cacheOptions
                                            loadOptions={loadCityOptions}
                                            onChange={handleCityChange}
                                            formatOptionLabel={formatCityOption}
                                            value={currentAddress.citta ? { nome: currentAddress.citta, cap: currentAddress.cap, provincia: currentAddress.provincia, label: currentAddress.citta, value: currentAddress.citta } : null}
                                            getOptionLabel={(option) => option.nome || option.label}
                                            getOptionValue={(option) => option.nome || option.value}
                                            placeholder="Cerca o inserisci città..."
                                            components={{
                                                DropdownIndicator: null,
                                                IndicatorSeparator: null,
                                                MenuList: CustomMenuList,
                                                NoOptionsMessage: () => null,
                                                LoadingMessage: () => null
                                            }}
                                            formatCreateLabel={(inputValue) => inputValue}
                                            isValidNewOption={() => true}
                                            styles={{
                                                control: (base) => ({ ...base, minHeight: '34px', borderColor: '#ccc', boxShadow: 'none' }),
                                                menu: (base) => ({ ...base, zIndex: 9999 }),
                                                option: (base, state) => {
                                                    if (state.data.__isNew__) {
                                                        return { ...base, display: 'none' };
                                                    }
                                                    return base;
                                                }
                                            }}
                                            allowCreateWhileLoading={true}
                                            createOptionPosition="last"
                                            createOptionOnBlur={true}
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
                        </div>

                        {/* Contatti Section */}
                        <div className="smart-tabs-container">
                            <label style={{ display: 'block', marginBottom: '10px', color: '#555', fontWeight: 'bold' }}>Contatti</label>
                            <div className="smart-tabs">
                                {fornitore.elencoContatti.map((cont, index) => (
                                    <div
                                        key={index}
                                        className={`smart-tab ${activeContactIndex === index ? 'active' : ''}`}
                                        onClick={() => setActiveContactIndex(index)}
                                    >
                                        {getContactLabel(cont, index)}
                                        {fornitore.elencoContatti.length > 1 && (
                                            <span className="remove-tab" onClick={(e) => handleRemoveContact(e, index)} title="Rimuovi">×</span>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn-add-tab" onClick={handleAddContact} title="Aggiungi Contatto">+</button>
                            </div>
                        </div>

                        <div className="smart-fields-panel">
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

                        <div className="row" style={{ marginTop: '20px' }}>
                            <div className="col-md-6">
                                <div className="form-group">
                                    <label>Note</label>
                                    <textarea
                                        className="form-control"
                                        rows="3"
                                        name="note"
                                        value={fornitore.note || ''}
                                        onChange={handleChange}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Other Information Tab */}
                    <div className={`tab-pane ${activeTab === 'other' ? 'active' : ''}`} style={{ display: activeTab === 'other' ? 'block' : 'none' }}>

                        <div className="section-header">Dati commerciali</div>

                        {!showCommercialData && <div className="alert alert-info">I dati commerciali sono disabilitati da configurazione</div>}

                        {showCommercialData && (
                            <>
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="form-group">
                                            <label>Banca</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="banca"
                                                value={fornitore.banca || ''}
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
                                                value={fornitore.iban || ''}
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
                                            <input type="text" className="form-control input-sm" name="abi" value={fornitore.abi || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-2 col-xs-6">
                                        <div className="form-group">
                                            <label>CAB</label>
                                            <input type="text" className="form-control input-sm" name="cab" value={fornitore.cab || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-2 col-xs-4">
                                        <div className="form-group">
                                            <label>CIN</label>
                                            <input type="text" className="form-control input-sm" name="cin" value={fornitore.cin || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-4 col-xs-8">
                                        <div className="form-group">
                                            <label>Conto</label>
                                            <input type="text" className="form-control input-sm" name="conto" value={fornitore.conto || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-3 col-xs-6">
                                        <div className="form-group">
                                            <label>BIC/SWIFT</label>
                                            <input type="text" className="form-control" name="bic" value={fornitore.bic || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="col-md-3 col-xs-6">
                                        <div className="form-group">
                                            <label>Codice SIA</label>
                                            <input type="text" className="form-control" name="codSia" value={fornitore.codSia || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Categoria di spesa</label>
                                            <div className="input-group">
                                                <select
                                                    className="form-control"
                                                    name="idCategoriaSpesa"
                                                    value={fornitore.idCategoriaSpesa || ''}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Seleziona una categoria...</option>
                                                    {categorieSpesaList.map(c => (
                                                        <option key={c.id} value={c.id}>{c.descrizione}</option>
                                                    ))}
                                                </select>
                                                <span className="input-group-btn">
                                                    <button className="btn btn-wrench" type="button" onClick={() => Swal.fire('Gestione Categorie Spesa', 'Implementazione futura', 'info')}><FaWrench /></button>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="form-group">
                                            <label>Vettore</label>
                                            <div className="input-group">
                                                <select
                                                    className="form-control"
                                                    name="idVettore"
                                                    value={fornitore.idVettore || ''}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Seleziona un vettore...</option>
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
                                                <select
                                                    className="form-control"
                                                    name="idTipoPorto"
                                                    value={fornitore.idTipoPorto || ''}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Seleziona un tipo porto...</option>
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

                        <div className="section-header">Nei documenti</div>

                        <div className="row">
                            <div className="col-md-3">
                                <div className="form-group">
                                    <label>Mostra avviso</label>
                                    <div className="input-group">
                                        <select
                                            className="form-control"
                                            name="idAvviso"
                                            value={fornitore.idAvviso || ''}
                                            onChange={handleChange}
                                        >
                                            <option value="">Seleziona un avviso...</option>
                                            {avvisiList.map(a => (
                                                <option key={a.id} value={a.id}>{a.descrizione}</option>
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
                                        <select
                                            className="form-control"
                                            name="idNota"
                                            value={fornitore.idNota || ''}
                                            onChange={handleChange}
                                        >
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

                <div className="form-footer">
                    <button type="button" className="btn btn-premium-cancel" onClick={() => navigate('/fornitori')}>Annulla</button>
                    <button type="submit" className="btn btn-premium-save">Salva</button>
                </div>
            </form>

            {/* Modals */}
            {/* Modals */}
            {showAvvisiModal && <AvvisiManagementModal onClose={handleCloseAvvisiModal} />}
            {showNoteDocumentiModal && <NoteDocumentiManagementModal onClose={handleCloseNoteDocumentiModal} />}
            {showTipiPortoModal && <TipiPortoManagementModal onClose={handleCloseTipiPortoModal} />}
            {showVettoriModal && <VettoriManagementModal onClose={handleCloseVettoriModal} />}
            {showRisorseModal && <RisorseManagementModal onClose={handleCloseRisorseModal} type='BA' title="Gestione Banche" />}

        </div>
    );
};

export default FornitoriDetail;
