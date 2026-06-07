import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaInfoCircle, FaCalendarAlt, FaFileAlt, FaAngleRight, FaListUl, FaSave, FaPlus, FaTrash, FaArrowLeft } from 'react-icons/fa';
import Swal from 'sweetalert2';
import Select from 'react-select';
import AsyncSelect from 'react-select/async';
import FattureFornitoreService from '../../services/FattureFornitoreService';
import FornitoriService from '../../services/FornitoriService';
import ArticoliService from '../../services/ArticoliService';
import authService from '../../services/authService';
import DocumentRows from '../../components/common/DocumentRows';
import ScadenzeTable from '../../components/common/ScadenzeTable';
import EntitySelectGroup from '../../components/EntitySelectGroup';
import TipiPagamentoManagementModal from '../../components/modals/TipiPagamentoManagementModal';
import RisorseManagementModal from '../../components/modals/RisorseManagementModal';
import { getRowValues } from '../../utils/documentUtils';
import '../Fatture/FattureDetail.css';
import '../../components/EntityForms.css';

const FattureFornitoreDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id || id === 'new';

    const [isCeramica, setIsCeramica] = useState(false);

    useEffect(() => {
        const conf = authService.getConfig();
        if (conf && conf.TIPO_NEGOZIO === 'ceramica') {
            setIsCeramica(true);
        }
    }, []);

        const [formData, setFormData] = useState({
        numeroDocumentoFornitore: '',
        dataDocumentoFornitore: new Date().toISOString().split('T')[0],
        numDocumento: '',
        dataDocumento: new Date().toISOString().split('T')[0],
        idFornitore: null,
        descFornitore: '',
        totale: 0,
        totaleDaPagare: 0,
        idTipoPagamento: null,
        idNsBanca: null,
        annotazioneEstesa: '',
        flFatturaElettronica: 0,
        xmlFattura: null,
        progFileFatturaElettronica: '',
        listaScadenzePagamentiDocumento: []
    });

    const [prodotti, setProdotti] = useState([]);
    const [combos, setCombos] = useState({
        aliquoteIva: [],
        unitaMisura: [],
        tipiPagamento: [],
        banche: [],
        divisioni: [],
        listini: []
    });

    const [fornitoreDetails, setFornitoreDetails] = useState({
        denominazione: '',
        indirizzo: '',
        cap: '',
        citta: '',
        provincia: '',
        nazione: 'Italia',
        partitaIva: '',
        codiceFiscale: ''
    });

    const [activeTab, setActiveTab] = useState('generale');
    const [loading, setLoading] = useState(true);

    const isReadOnly = !isNew && (
        formData.flFatturaElettronica === 1 || 
        formData.xmlFattura !== null || 
        (formData.progFileFatturaElettronica && formData.progFileFatturaElettronica.trim() !== '')
    );

    // Sync supplier details dynamically
    useEffect(() => {
        if (formData.fornitoreDto) {
            const f = formData.fornitoreDto;
            let addr = { indirizzo: '', cap: '', citta: '', provincia: '', nazione: 'Italia' };
            if (f.elencoIndirizzi && f.elencoIndirizzi.length > 0) {
                const sedeOp = f.elencoIndirizzi.find(i => i.tipologia === 'O') || f.elencoIndirizzi.find(i => i.tipologia === 'L') || f.elencoIndirizzi[0];
                addr = {
                    indirizzo: sedeOp.indirizzo || '',
                    cap: sedeOp.cap || '',
                    citta: sedeOp.citta || '',
                    provincia: sedeOp.provincia || '',
                    nazione: sedeOp.nazione || 'Italia'
                };
            }
            setFornitoreDetails({
                denominazione: f.denominazione || '',
                indirizzo: addr.indirizzo,
                cap: addr.cap,
                citta: addr.citta,
                provincia: addr.provincia,
                nazione: addr.nazione,
                partitaIva: f.partitaIva || '',
                codiceFiscale: f.codiceFiscale || ''
            });
        } else if (formData.idFornitore) {
            FornitoriService.getById(formData.idFornitore).then(res => {
                const f = res.data?.payload || res.data;
                if (f) {
                    let addr = { indirizzo: '', cap: '', citta: '', provincia: '', nazione: 'Italia' };
                    if (f.elencoIndirizzi && f.elencoIndirizzi.length > 0) {
                        const sedeOp = f.elencoIndirizzi.find(i => i.tipologia === 'O') || f.elencoIndirizzi.find(i => i.tipologia === 'L') || f.elencoIndirizzi[0];
                        addr = {
                            indirizzo: sedeOp.indirizzo || '',
                            cap: sedeOp.cap || '',
                            citta: sedeOp.citta || '',
                            provincia: sedeOp.provincia || '',
                            nazione: sedeOp.nazione || 'Italia'
                        };
                    }
                    setFornitoreDetails({
                        denominazione: f.denominazione || '',
                        indirizzo: addr.indirizzo,
                        cap: addr.cap,
                        citta: addr.citta,
                        provincia: addr.provincia,
                        nazione: addr.nazione,
                        partitaIva: f.partitaIva || '',
                        codiceFiscale: f.codiceFiscale || ''
                    });
                }
            }).catch(err => console.error("Errore nel caricamento del fornitore:", err));
        } else {
            setFornitoreDetails({
                denominazione: '',
                indirizzo: '',
                cap: '',
                citta: '',
                provincia: '',
                nazione: 'Italia',
                partitaIva: '',
                codiceFiscale: ''
            });
        }
    }, [formData.idFornitore, formData.fornitoreDto]);

    const fetchNextNum = async (dateStr) => {
        if (!dateStr) return;
        try {
            const formattedDate = dateStr.split('-').reverse().join('/');
            const res = await FattureFornitoreService.getNextNum(formattedDate);
            if (res.data && res.data.payload) {
                setFormData(prev => ({ ...prev, numDocumento: res.data.payload }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Fetch initial data (combos & invoice)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const comboRes = await FattureFornitoreService.getCombosMap();
                let loadedCombos = {
                    aliquoteIva: [],
                    unitaMisura: [],
                    tipiPagamento: [],
                    banche: [],
                    divisioni: [],
                    listini: []
                };
                if (comboRes.data?.payload) {
                    const payload = comboRes.data.payload;
                    loadedCombos = {
                        aliquoteIva: payload.ALIQUOTEIVA || payload.aliquoteIva || [],
                        unitaMisura: payload.UNITAMISURA || payload.unitaMisura || [],
                        tipiPagamento: payload.TIPIPAGAMENTO || payload.tipiPagamento || [],
                        banche: payload.BANCHE || payload.banche || [],
                        divisioni: payload.DIVISIONI || payload.divisioni || [],
                        listini: payload.LISTINI || payload.listini || []
                    };
                    setCombos(loadedCombos);
                }

                if (!isNew) {
                    const res = await FattureFornitoreService.getById(id);
                    const data = res.data?.payload || res.data;
                    if (data) {
                        if (data.dataDocumento && data.dataDocumento.includes('/')) {
                            const parts = data.dataDocumento.split('/');
                            data.dataDocumento = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                        if (data.dataDocumentoFornitore && data.dataDocumentoFornitore.includes('/')) {
                            const parts = data.dataDocumentoFornitore.split('/');
                            data.dataDocumentoFornitore = `${parts[2]}-${parts[1]}-${parts[0]}`;
                        }
                        setFormData(data);
                        
                        const mappedProdotti = (data.prodotti || []).map(p => ({
                            ...p,
                            tipo: p.tipo || (p.idProdotto ? 'A' : 'F')
                        }));
                        setProdotti(mappedProdotti);
                    }
                } else {
                    // Automatically fetch next internal number for new documents
                    fetchNextNum(formData.dataDocumento);
                }
            } catch (error) {
                console.error('Errore nel caricamento dei dati iniziali:', error);
                Swal.fire('Errore', 'Impossibile caricare i dati della fattura', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [id, isNew]);

    // Calculate totals dynamically from prodotti rows
    const calculateTotalImponibile = () => {
        return prodotti.reduce((sum, p) => {
            if (p.tipo === 'N') return sum;
            const vals = getRowValues(p, combos.aliquoteIva);
            return sum + (vals.imponibile || 0);
        }, 0);
    };

    const calculateTotalLordo = () => {
        return prodotti.reduce((sum, p) => {
            if (p.tipo === 'N') return sum;
            const vals = getRowValues(p, combos.aliquoteIva);
            return sum + (vals.total || 0);
        }, 0);
    };

    // Recalculate totals using getRowValues (maps row values for state consistency)
    const recalculateTotals = (updatedProdotti) => {
        return updatedProdotti.map(p => {
            if (p.tipo === 'N') {
                return {
                    ...p,
                    totale: 0,
                    totaleSenzaIva: 0
                };
            }

            const vals = getRowValues(p, combos.aliquoteIva);
            
            return {
                ...p,
                totale: vals.total,
                totaleSenzaIva: vals.imponibile
            };
        });
    };

    const handleHeaderChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? (checked ? 1 : 0) : value;
        setFormData(prev => {
            const nextData = { ...prev, [name]: val };
            if (name === 'dataDocumento' && isNew) {
                fetchNextNum(nextData.dataDocumento);
            }
            return nextData;
        });
    };

    const loadFornitori = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 2) return callback([]);
        FornitoriService.getSuggestion(inputValue).then(res => {
            const list = Array.isArray(res.data) ? res.data : (res.data && res.data.payload) || [];
            callback(list.map(f => ({
                value: f.id,
                label: f.denominazione || f.denominazioneData,
                data: f
            })));
        }).catch(err => {
            console.error("Errore nel caricamento dei fornitori:", err);
            callback([]);
        });
    };

    const handleSelectFornitore = (opt) => {
        if (opt) {
            const f = opt.data;
            setFormData(prev => ({
                ...prev,
                idFornitore: f.id,
                descFornitore: f.denominazione,
                fornitoreDto: f
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                idFornitore: null,
                descFornitore: '',
                fornitoreDto: null
            }));
        }
    };

    const handleRowChange = (index, field, value) => {
        setProdotti(prev => {
            const newP = [...prev];
            newP[index] = {
                ...newP[index],
                [field]: value
            };
            return recalculateTotals(newP);
        });
    };

    const handleScadenzeChange = useCallback((newScadenze) => {
        setFormData(prev => {
            const isSame = JSON.stringify(prev.listaScadenzePagamentiDocumento) === JSON.stringify(newScadenze);
            if (isSame) return prev;
            return {
                ...prev,
                listaScadenzePagamentiDocumento: newScadenze
            };
        });
    }, []);

    const validate = () => {
        if (!formData.idFornitore) {
            Swal.fire('Attenzione', 'Selezionare un fornitore', 'warning');
            return false;
        }
        if (!formData.numeroDocumentoFornitore) {
            Swal.fire('Attenzione', 'Inserire il numero documento fornitore', 'warning');
            return false;
        }
        if (!formData.dataDocumentoFornitore) {
            Swal.fire('Attenzione', 'Inserire la data documento fornitore', 'warning');
            return false;
        }
        if (!formData.dataDocumento) {
            Swal.fire('Attenzione', 'Inserire la data registrazione', 'warning');
            return false;
        }
        if (prodotti.length === 0) {
            Swal.fire('Attenzione', 'Inserire almeno un articolo', 'warning');
            return false;
        }
        
        for (let i = 0; i < prodotti.length; i++) {
            const p = prodotti[i];
            if (p.tipo === 'N') continue; // Skip validation for notes

            if (p.tipo === 'A' && !p.idProdotto) {
                Swal.fire('Attenzione', `Selezionare un articolo valido alla riga ${i + 1}`, 'warning');
                return false;
            }
            if (p.tipo === 'F' && !p.fmDescrizione && !p.descProdotto) {
                Swal.fire('Attenzione', `Inserire la descrizione per la riga libera alla riga ${i + 1}`, 'warning');
                return false;
            }
            if (parseFloat(p.quantita) <= 0) {
                Swal.fire('Attenzione', `La quantità deve essere maggiore di zero alla riga ${i + 1}`, 'warning');
                return false;
            }
        }
        return true;
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        if (!validate()) return;

        setLoading(true);

        const payload = {
            ...formData,
            totale: calculateTotalLordo(),
            totaleDaPagare: calculateTotalLordo(),
            dataDocumento: formData.dataDocumento && formData.dataDocumento.includes('-')
                ? formData.dataDocumento.split('-').reverse().join('/')
                : formData.dataDocumento,
            dataDocumentoFornitore: formData.dataDocumentoFornitore && formData.dataDocumentoFornitore.includes('-')
                ? formData.dataDocumentoFornitore.split('-').reverse().join('/')
                : formData.dataDocumentoFornitore,
            prodotti: prodotti.map(p => ({
                ...p,
                totale: parseFloat(p.totale) || 0,
                quantita: parseFloat(p.quantita) || 0,
                prezzo: parseFloat(p.prezzo) || 0,
                prezzoImponibile: getRowValues(p, combos.aliquoteIva).imponibile || 0,
                sconto: p.sconto || '0',
                descProdotto: p.tipo === 'A' ? p.descProdotto : p.fmDescrizione || p.nota,
                fmDescrizione: p.tipo === 'F' ? p.fmDescrizione : p.descProdotto || p.nota,
                fuoriMagazzino: p.tipo === 'F',
                tipo: p.tipo,
                prodotto: p.tipo === 'A'
            }))
        };

        try {
            await FattureFornitoreService.save(payload);
            Swal.fire({
                title: 'Salvato!',
                text: 'Fattura fornitore salvata con successo',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => {
                navigate('/fatture-fornitore');
            });
        } catch (error) {
            console.error('Errore durante il salvataggio:', error);
            const msg = error.response?.data?.message || error.response?.data || 'Impossibile salvare la fattura';
            Swal.fire('Errore', msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fatture-detail-container text-center" style={{ paddingTop: '100px' }}>
                <div className="loading-spinner"></div>
                <p style={{ marginTop: '15px', color: '#888' }}>Caricamento dettaglio in corso...</p>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="fatture-detail-container text-center" style={{ paddingTop: '100px' }}>
                <p style={{ color: '#e74c3c', fontSize: '16px', fontWeight: 'bold' }}>Fattura non trovata.</p>
                <button className="btn btn-default" style={{ marginTop: '15px' }} onClick={() => navigate('/fatture-fornitore')}>
                    Torna all'elenco
                </button>
            </div>
        );
    }

    return (
        <div className="fatture-detail-container entity-form-shared">
            {/* Header con totali premium */}
            <div id="fatture-content-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '20px' }}>
                <div className="header-left">
                    <h1 style={{ color: '#03a9f4', fontWeight: 300, fontSize: '28px', margin: 0 }}>
                        {isNew ? 'Nuova Fattura Fornitore' : `Fattura Fornitore N. ${formData.numeroDocumentoFornitore}`}
                    </h1>
                    <div className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#888', marginTop: '5px', textTransform: 'uppercase' }}>
                        <span style={{ cursor: 'pointer' }} onClick={() => navigate('/fatture-fornitore')}>Elenco</span>
                        <FaAngleRight />
                        <span className="active" style={{ color: '#333', fontWeight: 600 }}>
                            {isNew ? 'Nuova' : `Fattura ${formData.numeroDocumentoFornitore}`}
                        </span>
                    </div>
                </div>
                <div className="header-totals" style={{ display: 'flex', gap: '15px' }}>
                    <div className="total-box" style={{ background: '#fff', padding: '10px 20px', borderRadius: '8px', border: '1px solid #e7ebee', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '150px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <span className="label" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', fontWeight: 700, letterSpacing: '0.5px' }}>Totale Imponibile</span>
                        <span className="value" style={{ fontSize: '20px', fontWeight: 600, color: '#333' }}>
                            € {calculateTotalImponibile().toFixed(2)}
                        </span>
                    </div>
                    <div className="total-box" style={{ background: '#fff', padding: '10px 20px', borderRadius: '8px', border: '1px solid #e7ebee', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '150px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        <span className="label" style={{ fontSize: '10px', textTransform: 'uppercase', color: '#999', fontWeight: 700, letterSpacing: '0.5px' }}>Totale Lordo</span>
                        <span className="value" style={{ fontSize: '20px', fontWeight: 600, color: '#333' }}>
                            € {calculateTotalLordo().toFixed(2)}
                        </span>
                    </div>
                    <div className="total-box highlight" style={{ background: '#e74c3c', padding: '10px 20px', borderRadius: '8px', border: '1px solid #e74c3c', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '150px', boxShadow: '0 4px 6px rgba(231,76,60,0.15)' }}>
                        <span className="label" style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.8)', fontWeight: 700, letterSpacing: '0.5px' }}>Da Saldare</span>
                        <span className="value" style={{ fontSize: '20px', fontWeight: 600, color: '#fff' }}>
                            € {calculateTotalLordo().toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            <div className="detail-box main-box" style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e7ebee', marginTop: '20px' }}>
                <ul className="nav nav-tabs nav-tabs-custom" style={{ background: '#f8f9fa', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', display: 'flex', listStyle: 'none', padding: '0', margin: '0', borderBottom: '1px solid #e7ebee' }}>
                    <li className={activeTab === 'generale' ? 'active' : ''} style={{ margin: '0' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('generale'); }} style={{ display: 'block', padding: '12px 20px', textDecoration: 'none', color: activeTab === 'generale' ? '#03a9f4' : '#666', borderBottom: activeTab === 'generale' ? '2px solid #03a9f4' : 'none', fontWeight: activeTab === 'generale' ? '600' : 'normal' }}>Generale</a>
                    </li>
                    <li className={activeTab === 'articoli' ? 'active' : ''} style={{ margin: '0' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('articoli'); }} style={{ display: 'block', padding: '12px 20px', textDecoration: 'none', color: activeTab === 'articoli' ? '#03a9f4' : '#666', borderBottom: activeTab === 'articoli' ? '2px solid #03a9f4' : 'none', fontWeight: activeTab === 'articoli' ? '600' : 'normal' }}>Articoli ({prodotti.length})</a>
                    </li>
                    <li className={activeTab === 'pagamento' ? 'active' : ''} style={{ margin: '0' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('pagamento'); }} style={{ display: 'block', padding: '12px 20px', textDecoration: 'none', color: activeTab === 'pagamento' ? '#03a9f4' : '#666', borderBottom: activeTab === 'pagamento' ? '2px solid #03a9f4' : 'none', fontWeight: activeTab === 'pagamento' ? '600' : 'normal' }}>Pagamento</a>
                    </li>
                    <li className={activeTab === 'note' ? 'active' : ''} style={{ margin: '0' }}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('note'); }} style={{ display: 'block', padding: '12px 20px', textDecoration: 'none', color: activeTab === 'note' ? '#03a9f4' : '#666', borderBottom: activeTab === 'note' ? '2px solid #03a9f4' : 'none', fontWeight: activeTab === 'note' ? '600' : 'normal' }}>Annotazioni</a>
                    </li>
                </ul>

                <div className="main-box-body" style={{ padding: '20px' }}>
                    <form className="tab-content" onSubmit={handleSave} autoComplete="off">
                        {/* Tab Generale */}
                        <div className={`tab-pane ${activeTab === 'generale' ? 'active' : ''}`}>
                            <div className="row" style={{ alignItems: 'flex-start' }}>
                                
                                {/* Colonna Sinistra: Fornitore */}
                                <div className="col-md-6">
                                    <div className="premium-card address-card" style={{ border: '1px solid #e7ebee', borderRadius: '8px' }}>
                                        <div className="card-header-vibrant" style={{ background: '#f8f9fa', padding: '12px 18px', borderBottom: '1px solid #f1f2f7', fontWeight: 700, fontSize: '13px', color: '#555', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                                            <FaInfoCircle style={{ color: '#03a9f4', marginRight: '8px' }} /> Anagrafica Fornitore
                                        </div>
                                        <div className="card-body" style={{ padding: '20px' }}>
                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Ragione Sociale</label>
                                                {isReadOnly ? (
                                                    <input
                                                        type="text"
                                                        className="form-control premium-input"
                                                        value={formData.descFornitore || formData.fornitoreDto?.denominazione || 'N/D'}
                                                        disabled
                                                    />
                                                ) : (
                                                    <AsyncSelect
                                                        cacheOptions
                                                        defaultOptions
                                                        loadOptions={loadFornitori}
                                                        value={formData.idFornitore ? { value: formData.idFornitore, label: formData.descFornitore || formData.fornitoreDto?.denominazione } : null}
                                                        onChange={handleSelectFornitore}
                                                        placeholder="Cerca fornitore..."
                                                    />
                                                )}
                                            </div>

                                            <div className="form-group" style={{ marginBottom: '15px' }}>
                                                <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Indirizzo</label>
                                                <input
                                                    type="text"
                                                    className="form-control premium-input"
                                                    value={fornitoreDetails.indirizzo || ''}
                                                    disabled
                                                />
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                                                <div style={{ flex: '2' }}>
                                                    <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Città</label>
                                                    <input
                                                        type="text"
                                                        className="form-control premium-input"
                                                        value={fornitoreDetails.citta || ''}
                                                        disabled
                                                    />
                                                </div>
                                                <div style={{ flex: '1' }}>
                                                    <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Prov.</label>
                                                    <input
                                                        type="text"
                                                        className="form-control premium-input"
                                                        value={fornitoreDetails.provincia || ''}
                                                        disabled
                                                    />
                                                </div>
                                                <div style={{ flex: '1' }}>
                                                    <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>CAP</label>
                                                    <input
                                                        type="text"
                                                        className="form-control premium-input"
                                                        value={fornitoreDetails.cap || ''}
                                                        disabled
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <div style={{ flex: '1' }}>
                                                    <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Partita IVA</label>
                                                    <input
                                                        type="text"
                                                        className="form-control premium-input"
                                                        value={fornitoreDetails.partitaIva || ''}
                                                        disabled
                                                    />
                                                </div>
                                                <div style={{ flex: '1' }}>
                                                    <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Codice Fiscale</label>
                                                    <input
                                                        type="text"
                                                        className="form-control premium-input"
                                                        value={fornitoreDetails.codiceFiscale || ''}
                                                        disabled
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Colonna Destra: Registrazione e Documento */}
                                <div className="col-md-6" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div className="premium-card address-card" style={{ border: '1px solid #e7ebee', borderRadius: '8px' }}>
                                        <div className="card-header-vibrant" style={{ background: '#f8f9fa', padding: '12px 18px', borderBottom: '1px solid #f1f2f7', fontWeight: 700, fontSize: '13px', color: '#555', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                                            <FaCalendarAlt style={{ color: '#03a9f4', marginRight: '8px' }} /> Dati Registrazione (Interni)
                                        </div>
                                        <div className="card-body" style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', gap: '15px' }}>
                                                <div style={{ flex: '1' }}>
                                                    <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>N. Registrazione</label>
                                                    <input
                                                        type="number"
                                                        className="form-control premium-input"
                                                        name="numDocumento"
                                                        value={formData.numDocumento || ''}
                                                        onChange={handleHeaderChange}
                                                        disabled={isReadOnly}
                                                    />
                                                </div>
                                                <div style={{ flex: '1' }}>
                                                    <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Data Registrazione</label>
                                                    <input
                                                        type="date"
                                                        className="form-control premium-input"
                                                        name="dataDocumento"
                                                        value={formData.dataDocumento || ''}
                                                        onChange={handleHeaderChange}
                                                        disabled={isReadOnly}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="premium-card address-card" style={{ border: '1px solid #e7ebee', borderRadius: '8px' }}>
                                        <div className="card-header-vibrant" style={{ background: '#f8f9fa', padding: '12px 18px', borderBottom: '1px solid #f1f2f7', fontWeight: 700, fontSize: '13px', color: '#555', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                                            <FaFileAlt style={{ color: '#03a9f4', marginRight: '8px' }} /> Dati Fattura Fornitore
                                        </div>
                                        <div className="card-body" style={{ padding: '20px' }}>
                                            <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                                <div style={{ flex: '1' }}>
                                                    <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>N. Fattura Fornitore</label>
                                                    <input
                                                        type="text"
                                                        className="form-control premium-input"
                                                        name="numeroDocumentoFornitore"
                                                        value={formData.numeroDocumentoFornitore || ''}
                                                        onChange={handleHeaderChange}
                                                        disabled={isReadOnly}
                                                        required
                                                    />
                                                </div>
                                                <div style={{ flex: '1' }}>
                                                    <label className="premium-label" style={{ fontWeight: 600, color: '#666', fontSize: '12px', display: 'block', marginBottom: '5px' }}>Data Fattura Fornitore</label>
                                                    <input
                                                        type="date"
                                                        className="form-control premium-input"
                                                        name="dataDocumentoFornitore"
                                                        value={formData.dataDocumentoFornitore || ''}
                                                        onChange={handleHeaderChange}
                                                        disabled={isReadOnly}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Articoli */}
                        <div className={`tab-pane ${activeTab === 'articoli' ? 'active' : ''}`}>
                            <DocumentRows
                                rows={prodotti}
                                onRowChange={handleRowChange}
                                onRowUpdate={(idx, update) => {
                                    const newP = [...prodotti];
                                    newP[idx] = { ...newP[idx], ...update };
                                    setProdotti(recalculateTotals(newP));
                                }}
                                onDeleteRow={(idx) => {
                                    const newP = [...prodotti];
                                    newP.splice(idx, 1);
                                    setProdotti(recalculateTotals(newP));
                                }}
                                onAddRow={(newRow) => {
                                    setProdotti(prev => recalculateTotals([...prev, newRow]));
                                }}
                                combos={combos}
                                isCeramica={isCeramica}
                                showRitenuta={false}
                                readOnly={isReadOnly}
                                idListino={null}
                            />
                        </div>

                        {/* Tab Pagamento */}
                        <div className={`tab-pane ${activeTab === 'pagamento' ? 'active' : ''}`}>
                            <div style={{ padding: '20px' }}>
                                <div className="row mb-4">
                                    <div className="col-md-6">
                                        <EntitySelectGroup
                                            label="Metodo Pagamento"
                                            isAsync={false}
                                            options={(combos.tipiPagamento || []).map(tp => ({ value: tp.id, label: tp.descrizione || tp.denominazione }))}
                                            value={formData.idTipoPagamento ? { value: formData.idTipoPagamento, label: (combos.tipiPagamento || []).find(tp => tp.id === formData.idTipoPagamento)?.descrizione || (combos.tipiPagamento || []).find(tp => tp.id === formData.idTipoPagamento)?.denominazione } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idTipoPagamento: opt?.value }))}
                                            ModalComponent={TipiPagamentoManagementModal}
                                            title="Gestione Metodi Pagamento"
                                            placeholder="Seleziona..."
                                            onModalClose={async () => {
                                                const comboRes = await FattureFornitoreService.getCombosMap();
                                                if (comboRes.data?.payload) {
                                                    const payload = comboRes.data.payload;
                                                    setCombos(prev => ({
                                                        ...prev,
                                                        tipiPagamento: payload.TIPIPAGAMENTO || payload.tipiPagamento || []
                                                    }));
                                                }
                                            }}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <EntitySelectGroup
                                            label="Nostra Banca"
                                            isAsync={false}
                                            options={(combos.banche || []).map(b => ({ value: b.id, label: b.descrizione || b.nome }))}
                                            value={formData.idNsBanca ? { value: formData.idNsBanca, label: (combos.banche || []).find(b => b.id === formData.idNsBanca)?.descrizione || (combos.banche || []).find(b => b.id === formData.idNsBanca)?.nome } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idNsBanca: opt?.value }))}
                                            ModalComponent={RisorseManagementModal}
                                            modalProps={{ initialTipologia: 'BA' }}
                                            title="Gestione Banche"
                                            placeholder="Seleziona..."
                                            onModalClose={async () => {
                                                const comboRes = await FattureFornitoreService.getCombosMap();
                                                if (comboRes.data?.payload) {
                                                    const payload = comboRes.data.payload;
                                                    setCombos(prev => ({
                                                        ...prev,
                                                        banche: payload.BANCHE || payload.banche || []
                                                    }));
                                                }
                                            }}
                                            disabled={isReadOnly}
                                        />
                                    </div>
                                </div>
                                <ScadenzeTable
                                    idTipoPagamento={formData.idTipoPagamento}
                                    dataDocumento={formData.dataDocumentoFornitore}
                                    totaleDocumento={calculateTotalLordo()}
                                    scadenzeIniziali={formData.listaScadenzePagamentiDocumento || []}
                                    conti={combos.banche || []}
                                    onRefreshConti={async () => {
                                        const res = await FattureFornitoreService.getCombosMap();
                                        if (res.data?.payload) {
                                            setCombos(prev => ({
                                                ...prev,
                                                banche: res.data.payload.BANCHE || res.data.payload.banche || []
                                            }));
                                        }
                                    }}
                                    readOnly={isReadOnly}
                                    onScadenzeChange={handleScadenzeChange}
                                />
                            </div>
                        </div>

                        {/* Tab Annotazioni */}
                        <div className={`tab-pane ${activeTab === 'note' ? 'active' : ''}`}>
                            <div className="premium-card" style={{ border: '1px solid #e7ebee', borderRadius: '8px' }}>
                                <div className="card-header-vibrant" style={{ background: '#f8f9fa', padding: '12px 18px', borderBottom: '1px solid #f1f2f7', fontWeight: 700, fontSize: '13px', color: '#555', borderTopLeftRadius: '8px', borderTopRightRadius: '8px' }}>
                                    Annotazioni Estese
                                </div>
                                <div className="card-body" style={{ padding: '20px' }}>
                                    <textarea
                                        className="form-control premium-input"
                                        name="annotazioneEstesa"
                                        rows="6"
                                        value={formData.annotazioneEstesa || ''}
                                        onChange={handleHeaderChange}
                                        disabled={isReadOnly}
                                        placeholder="Note, dettagli aggiuntivi o informazioni utili per questa fattura..."
                                        style={{ resize: 'vertical' }}
                                    ></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Barra dei pulsanti inferiori */}
                        <div className="form-actions" style={{ marginTop: '30px' }}>
                            <button type="button" className="btn btn-premium-cancel" onClick={() => navigate('/fatture-fornitore')}>
                                <FaArrowLeft style={{ marginRight: '8px' }} /> Torna all'elenco
                            </button>
                            {!isReadOnly && (
                                <button type="submit" className="btn btn-premium-save">
                                    <FaSave style={{ marginRight: '8px' }} /> Salva Fattura
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default FattureFornitoreDetail;
