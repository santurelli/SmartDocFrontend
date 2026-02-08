import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AsyncSelect from 'react-select/async';
import Select from 'react-select';
import PreventiviService from '../../services/PreventiviService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
import ProgettiService from '../../services/ProgettiService';
import ArticoliService from '../../services/ArticoliService';
import authService from '../../services/authService';
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
import Swal from 'sweetalert2';
import { FaSave, FaArrowLeft, FaPlus, FaTrash, FaCalculator, FaHome, FaAngleRight, FaWrench, FaCogs, FaMapMarkerAlt, FaTruck } from 'react-icons/fa';
import CreatableSelect from 'react-select/creatable';
import ParticelleManagementModal from '../../components/modals/ParticelleManagementModal';
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
        padding: '0 8px'
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
    const isNew = !id || id === 'new';

    const [activeTab, setActiveTab] = useState('generale');
    const [loading, setLoading] = useState(false);
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
        progetti: []
    });

    const [formData, setFormData] = useState({
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
        nazioneIntestazione: '',
        partitaIva: '',
        codiceFiscale: '',
        indirizzoDestinazione: '',
        capDestinazione: '',
        cittaDestinazione: '',
        provinciaDestinazione: '',
        nazioneDestinazione: '',
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
        if (!isNew) {
            loadPreventivo();
        } else {
            fetchNextNum(formData.dataDocumento);
        }
    }, [id]);

    const fetchCombos = async () => {
        try {
            const res = await PreventiviService.getCombosMap();
            if (res.data && res.data.payload) {
                setCombos(prev => ({
                    ...prev,
                    ...res.data.payload
                }));
            }
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
            const res = await ClientiService.getIndirizzi(idCliente);
            const indirizzi = res.data || [];
            setClientIndirizzi(indirizzi);

            if (autoFill) {
                // Logic to auto-fill header and shipping
                const sedeLegale = indirizzi.find(i => i.tipologia === 'L');
                const sedeOperativa = indirizzi.find(i => i.tipologia === 'O');
                const destinazioneMerce = indirizzi.find(i => i.tipologia === 'M');

                const header = sedeLegale || sedeOperativa;
                const shipping = destinazioneMerce || sedeOperativa || sedeLegale;

                setFormData(prev => ({
                    ...prev,
                    ...(header ? {
                        indirizzoIntestazione: header.indirizzo || '',
                        cittaIntestazione: header.citta || '',
                        capIntestazione: header.cap || '',
                        provinciaIntestazione: header.provincia || '',
                        nazioneIntestazione: header.nazione || '',
                    } : {}),
                    ...(shipping ? {
                        indirizzoDestinazione: shipping.indirizzo || '',
                        cittaDestinazione: shipping.citta || '',
                        capDestinazione: shipping.cap || '',
                        provinciaDestinazione: shipping.provincia || '',
                        nazioneDestinazione: shipping.nazione || '',
                    } : {})
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
                nazioneIntestazione: ind.nazione || '',
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                indirizzoDestinazione: ind.indirizzo || '',
                cittaDestinazione: ind.citta || '',
                capDestinazione: ind.cap || '',
                provinciaDestinazione: ind.provincia || '',
                nazioneDestinazione: ind.nazione || '',
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
    const getRowValues = useCallback((row) => {
        if (row.tipo === 'N') return { netPrice: 0, imponibile: 0, total: 0, iva: 0 };

        const qty = parseFloat(row.quantita) || 0;
        const price = parseFloat(row.prezzo) || 0;
        const discountStr = row.sconto || '';

        let netPrice = price;
        if (discountStr) {
            const trimmed = discountStr.trim();
            if (!trimmed.includes('+')) {
                if (trimmed.endsWith('%')) {
                    const perc = parseFloat(trimmed.replace('%', '')) || 0;
                    netPrice = price * (1 - perc / 100);
                } else {
                    const val = parseFloat(trimmed) || 0;
                    netPrice = price - val;
                }
            } else {
                const tokens = trimmed.split('+');
                tokens.forEach(t => {
                    const perc = parseFloat(t.trim().replace('%', '')) || 0;
                    netPrice = netPrice * (1 - perc / 100);
                });
            }
        }

        const rowImponibile = qty * netPrice;
        const aliquota = combos.aliquoteIva.find(a => a.id === parseInt(row.idAliquotaIva));
        const impostaPerc = aliquota ? aliquota.imposta : 0;
        const rowTotal = rowImponibile * (1 + impostaPerc / 100);

        return {
            netPrice,
            imponibile: rowImponibile,
            total: rowTotal,
            iva: rowTotal - rowImponibile
        };
    }, [combos.aliquoteIva]);

    const calculateRowTotal = useCallback((row) => {
        return getRowValues(row).total;
    }, [getRowValues]);

    useEffect(() => {
        let imp = 0;
        let tot = 0;
        prodotti.forEach(p => {
            const vals = getRowValues(p);
            imp += vals.imponibile;
            tot += vals.total;
        });
        setTotals({
            imponibile: imp,
            iva: tot - imp,
            totale: tot
        });
    }, [prodotti, getRowValues]);

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const addRow = (type) => {
        const defaultAliquota = combos.aliquoteIva.find(a => a.predefinita === 1) || (combos.aliquoteIva.length > 0 ? combos.aliquoteIva[0] : null);
        const defaultUM = combos.unitaMisura.length > 0 ? combos.unitaMisura[0] : null;

        let newRow = { tipo: type };
        if (type === 'N') {
            newRow.nota = '';
        } else {
            newRow = {
                ...newRow,
                idProdotto: null,
                codiceProdotto: '',
                descProdotto: '',
                quantita: 1,
                idUnitaMisura: defaultUM?.id || null,
                prezzo: 0,
                sconto: '',
                idAliquotaIva: defaultAliquota?.id || null,
                nota: ''
            };
            if (type === 'F') {
                newRow.fmDescrizione = '';
            }
        }
        setProdotti(prev => [...prev, newRow]);
    };

    const handleAddArticolo = () => addRow('A');
    const handleAddFM = () => addRow('F');
    const handleAddNota = () => addRow('N');

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

    const loadArticoli = async (inputValue) => {
        if (!inputValue) return [];
        const res = await ArticoliService.getSuggestion(inputValue);
        return (res.data.list || []).map(a => ({
            value: a.id,
            label: `${a.codice} - ${a.descrizione}`,
            data: {
                ...a,
                codiceProdotto: a.codice,
                descProdotto: a.descrizione
            }
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!formData.numDocumento || !formData.dataDocumento || !formData.idCliente) {
            Swal.fire('Attenzione', 'Numero, Data e Cliente sono obbligatori', 'warning');
            return;
        }

        try {
            const payload = {
                ...formData,
                dataDocumento: formData.dataDocumento.split('-').reverse().join('/'),
                prodotti: prodotti.map(p => {
                    const cleaned = { ...p };
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
                await PreventiviService.insert(payload);
                Swal.fire('Successo', 'Preventivo salvato', 'success').then(() => navigate('/preventivi'));
            } else {
                await PreventiviService.update(id, payload);
                Swal.fire('Successo', 'Preventivo aggiornato', 'success').then(() => navigate('/preventivi'));
            }
        } catch (error) {
            console.error("Error saving:", error);
            Swal.fire('Errore', 'Errore durante il salvataggio', 'error');
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val || 0);
    };

    if (loading) return <div className="loading-container">Caricamento in corso...</div>;

    return (
        <div className="preventivi-detail-container entity-form-shared">
            <div id="content-header" className="clearfix">
                <div className="pull-left">
                    <ol className="breadcrumb">
                        <li><Link to="/"><FaHome /> HOME</Link></li>
                        <li><Link to="/preventivi">Elenco preventivi</Link></li>
                        <li className="active"><span>{isNew ? 'Nuovo preventivo' : 'Modifica'}</span></li>
                    </ol>
                    <h1>{isNew ? 'Nuovo preventivo' : `Preventivo ${formData.numDocumento}/${formData.particella}`}</h1>
                </div>

                <div className="pull-right header-totals">
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
                </header>

                <div className="main-box-body">
                    <div className="tab-content">
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
                                            />
                                            <span className="input-group-addon">/</span>
                                            <div style={{ flex: '0 0 100px' }}>
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
                                        value={formData.idCliente ? { value: formData.idCliente, label: formData.denominazione } : null}
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
                                                nazioneIntestazione: c.nazione || '',
                                                partitaIva: c.partitaIva || '',
                                                codiceFiscale: c.codiceFiscale || '',
                                                idAgente: c.idAgente || prev.idAgente
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
                                        value={formData.idAgente ? { value: formData.idAgente, label: formData.nomeAgente } : null}
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
                                                    <label className="premium-label">Indirizzo</label>
                                                    <input type="text" className="form-control premium-input" name="indirizzoIntestazione" value={formData.indirizzoIntestazione} onChange={handleHeaderChange} />
                                                </div>
                                            </div>
                                            <div className="row mb-4">
                                                <div className="col-md-7">
                                                    <label className="premium-label">Città</label>
                                                    <input type="text" className="form-control premium-input" name="cittaIntestazione" value={formData.cittaIntestazione} onChange={handleHeaderChange} />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="premium-label">Prov.</label>
                                                    <input type="text" className="form-control premium-input" name="provinciaIntestazione" value={formData.provinciaIntestazione} onChange={handleHeaderChange} maxLength="2" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="premium-label">CAP</label>
                                                    <input type="text" className="form-control premium-input" name="capIntestazione" value={formData.capIntestazione} onChange={handleHeaderChange} />
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
                                                    <label className="premium-label">Indirizzo</label>
                                                    <input type="text" className="form-control premium-input" name="indirizzoDestinazione" value={formData.indirizzoDestinazione} onChange={handleHeaderChange} />
                                                </div>
                                            </div>
                                            <div className="row mb-4">
                                                <div className="col-md-7">
                                                    <label className="premium-label">Città</label>
                                                    <input type="text" className="form-control premium-input" name="cittaDestinazione" value={formData.cittaDestinazione} onChange={handleHeaderChange} />
                                                </div>
                                                <div className="col-md-2">
                                                    <label className="premium-label">Prov.</label>
                                                    <input type="text" className="form-control premium-input" name="provinciaDestinazione" value={formData.provinciaDestinazione} onChange={handleHeaderChange} maxLength="2" />
                                                </div>
                                                <div className="col-md-3">
                                                    <label className="premium-label">CAP</label>
                                                    <input type="text" className="form-control premium-input" name="capDestinazione" value={formData.capDestinazione} onChange={handleHeaderChange} />
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

                            <div className="row mb-3">
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

                        {/* Tab Pagamento */}
                        <div className={`tab-pane ${activeTab === 'pagamento' ? 'active' : ''}`}>
                            <div className="row">
                                <div className="col-md-4">
                                    <EntitySelectGroup
                                        label="Tipo Pagamento"
                                        isAsync={false}
                                        options={(combos.tipiPagamento || []).map(tp => ({ value: tp.id, label: tp.descrizione }))}
                                        value={formData.idTipoPagamento ? { value: formData.idTipoPagamento, label: combos.tipiPagamento.find(tp => tp.id === formData.idTipoPagamento)?.descrizione } : null}
                                        onChange={(opt) => setFormData(prev => ({ ...prev, idTipoPagamento: opt?.value }))}
                                        ModalComponent={TipiPagamentoManagementModal}
                                        modalProps={{ isOpen: false }} // TipiPagamentoModal uses Swal internally but we pass isOpen for consistency
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
                                                {combos.listini.map(l => <option key={l.id} value={l.id}>{l.descrizione}</option>)}
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
                                        value={formData.idNsBanca ? { value: formData.idNsBanca, label: combos.risorse.find(r => r.id === formData.idNsBanca)?.descrizione } : null}
                                        onChange={(opt) => setFormData(prev => ({ ...prev, idNsBanca: opt?.value }))}
                                        ModalComponent={RisorseManagementModal}
                                        modalProps={{ initialTipologia: 'BA', isOpen: false }}
                                        title="Gestione Banche"
                                        placeholder="Seleziona banca..."
                                    />
                                </div>
                            </div>

                        </div>

                        {/* Tab Articoli */}
                        <div className={`tab-pane ${activeTab === 'articoli' ? 'active' : ''}`}>
                            <div className="table-responsive">
                                <table className="table table-hover table-items">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '60px', textAlign: 'center' }}>Tipo</th>
                                            <th>Descrizione / Articolo</th>
                                            <th style={{ width: '80px' }}>Q.tà</th>
                                            <th style={{ width: '80px' }}>U.M.</th>
                                            <th style={{ width: '120px' }}>Prezzo</th>
                                            <th style={{ width: '100px' }}>Sconto</th>
                                            <th style={{ width: '100px' }}>IVA</th>
                                            <th style={{ width: '120px' }}>Totale</th>
                                            <th style={{ width: '40px' }}></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prodotti.map((row, idx) => (
                                            <tr key={idx} className={`row-${row.tipo.toLowerCase()}`}>
                                                <td className="cell-tipo" style={{ textAlign: 'center' }}>
                                                    {row.tipo === 'A' && <span className="label label-primary">ART</span>}
                                                    {row.tipo === 'F' && <span className="label label-info">F.M.</span>}
                                                    {row.tipo === 'N' && <span className="label label-default">NOTA</span>}
                                                </td>
                                                <td>
                                                    {row.tipo === 'A' ? (
                                                        <AsyncSelect
                                                            isClearable
                                                            cacheOptions
                                                            loadOptions={loadArticoli}
                                                            styles={tableSelectStyles}
                                                            placeholder="Cerca art..."
                                                            noOptionsMessage={() => "Nessun risultato"}
                                                            loadingMessage={() => "Caricamento..."}
                                                            menuPortalTarget={document.body}
                                                            value={row.idProdotto ? { value: row.idProdotto, label: `${row.codiceProdotto} - ${row.descProdotto}` } : null}
                                                            onChange={(opt) => {
                                                                const a = opt?.data || {};
                                                                handleRowUpdate(idx, {
                                                                    idProdotto: opt?.value,
                                                                    codiceProdotto: a.codiceProdotto || '',
                                                                    descProdotto: a.descProdotto || '',
                                                                    prezzo: a.prezzo || 0,
                                                                    idUnitaMisura: a.idUnitaMisura,
                                                                    idAliquotaIva: a.idAliquotaIva
                                                                });
                                                            }}
                                                        />
                                                    ) : row.tipo === 'F' ? (
                                                        <input type="text" className="form-control" value={row.fmDescrizione || ''} onChange={(e) => handleRowChange(idx, 'fmDescrizione', e.target.value)} placeholder="Descrizione libera..." />
                                                    ) : (
                                                        <input type="text" className="form-control" value={row.nota || ''} onChange={(e) => handleRowChange(idx, 'nota', e.target.value)} placeholder="Testo della nota..." />
                                                    )}
                                                </td>

                                                {row.tipo !== 'N' ? (
                                                    <>
                                                        <td><input type="number" step="0.01" className="form-control text-right" value={row.quantita} onChange={(e) => handleRowChange(idx, 'quantita', e.target.value)} /></td>
                                                        <td>
                                                            <div className="cell-select-group">
                                                                <Select
                                                                    options={(combos.unitaMisura || []).map(um => ({ value: um.id, label: um.descrizione }))}
                                                                    isClearable
                                                                    value={combos.unitaMisura?.find(um => um.id == row.idUnitaMisura) ? { value: row.idUnitaMisura, label: combos.unitaMisura.find(um => um.id == row.idUnitaMisura).descrizione } : null}
                                                                    onChange={(opt) => handleRowChange(idx, 'idUnitaMisura', opt?.value)}
                                                                    styles={tableSelectStyles}
                                                                    menuPortalTarget={document.body}
                                                                    placeholder="UM"
                                                                    noOptionsMessage={() => "Nessun risultato trovato"}
                                                                />
                                                                <button type="button" className="btn-cell-wrench" onClick={() => setShowUMModal(true)} title="Gestione U.M.">
                                                                    <FaWrench />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td><input type="number" step="0.01" className="form-control text-right" value={row.prezzo} onChange={(e) => handleRowChange(idx, 'prezzo', e.target.value)} /></td>
                                                        <td><input type="text" className="form-control text-center" value={row.sconto || ''} onChange={(e) => handleRowChange(idx, 'sconto', e.target.value)} title="Es: 10+5 o 10%" placeholder="0" /></td>
                                                        <td>
                                                            <div className="cell-select-group">
                                                                <Select
                                                                    options={(combos.aliquoteIva || []).map(iva => ({ value: iva.id, label: iva.codice }))}
                                                                    isClearable
                                                                    value={combos.aliquoteIva?.find(iva => iva.id == row.idAliquotaIva) ? { value: row.idAliquotaIva, label: combos.aliquoteIva.find(iva => iva.id == row.idAliquotaIva).codice } : null}
                                                                    onChange={(opt) => handleRowChange(idx, 'idAliquotaIva', opt?.value)}
                                                                    styles={tableSelectStyles}
                                                                    menuPortalTarget={document.body}
                                                                    placeholder="IVA"
                                                                    noOptionsMessage={() => "Nessun risultato trovato"}
                                                                />
                                                                <button type="button" className="btn-cell-wrench" onClick={() => setShowIVAModal(true)} title="Gestione IVA">
                                                                    <FaWrench />
                                                                </button>
                                                            </div>
                                                        </td>
                                                        <td className="text-right text-bold">
                                                            {formatCurrency(calculateRowTotal(row))}
                                                        </td>
                                                    </>
                                                ) : (
                                                    <td colSpan="6"></td>
                                                )}

                                                <td className="text-center">
                                                    <button className="btn-delete-row" onClick={() => handleDeleteRow(idx)}><FaTrash /></button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="row-add-actions">
                                            <td colSpan="9" style={{ padding: '0px' }}>
                                                <div className="table-row-add-toolbar">
                                                    <button type="button" className="btn-add-inline" onClick={handleAddArticolo}>
                                                        <FaPlus /> ARTICOLO
                                                    </button>
                                                    <button type="button" className="btn-add-inline fm" onClick={handleAddFM}>
                                                        <FaPlus /> FUORI MAGAZZINO
                                                    </button>
                                                    <button type="button" className="btn-add-inline note" onClick={handleAddNota}>
                                                        <FaPlus /> NOTA
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tab Note */}
                        <div className={`tab-pane ${activeTab === 'note' ? 'active' : ''}`}>
                            <div className="form-group">
                                <label>Annotazione Estesa (verrà stampata in calce o su pagina separata)</label>
                                <textarea className="form-control" rows="15" name="annotazioneEstesa" value={formData.annotazioneEstesa || ''} onChange={handleHeaderChange} placeholder="Inserisci qui eventuali termini, condizioni o descrizioni dettagliate..."></textarea>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className="main-box-footer detail-footer">
                    <button className="btn btn-premium-cancel" onClick={() => navigate('/preventivi')}>
                        <FaArrowLeft /> Annulla
                    </button>
                    <div className="footer-right">
                        <button className="btn btn-premium-save" onClick={handleSave}>
                            <FaSave /> Salva Preventivo
                        </button>
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
