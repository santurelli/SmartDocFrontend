import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import OrdiniService from '../../services/OrdiniService';
import FornitoriService from '../../services/FornitoriService';
import ArticoliService from '../../services/ArticoliService';
import authService from '../../services/authService';
import { FaSave, FaArrowLeft, FaCaretDown, FaArrowRight, FaHome, FaTruck, FaMapMarkerAlt, FaGlobe, FaTruckLoading, FaFileInvoiceDollar } from 'react-icons/fa';
import Swal from 'sweetalert2';
import AsyncSelect from 'react-select/async';
import EntitySelectGroup from '../../components/EntitySelectGroup';
import TipiPagamentoManagementModal from '../../components/modals/TipiPagamentoManagementModal';
import RisorseManagementModal from '../../components/modals/RisorseManagementModal';
import VettoriManagementModal from '../../components/modals/VettoriManagementModal';
import TipiPortoManagementModal from '../../components/modals/TipiPortoManagementModal';
import AspettoBeniManagementModal from '../../components/modals/AspettoBeniManagementModal';
import CausaliTrasportoManagementModal from '../../components/modals/CausaliTrasportoManagementModal';
import NazioneSelect from '../../components/common/NazioneSelect';
import DocumentRows from '../../components/common/DocumentRows';
import ScadenzeTable from '../../components/common/ScadenzeTable';
import { getRowValues } from '../../utils/documentUtils';
import './OrdiniDetail.css';
import '../../components/EntityForms.css';

const OrdiniDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const isNew = !id || id === 'new';
    const [activeTab, setActiveTab] = useState('generale'); // generale, articoli, trasporto, pagamento, note
    const [loading, setLoading] = useState(false);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const actionsMenuRef = useRef(null);

    const [formData, setFormData] = useState({
        numDocumento: '',
        particella: '',
        dataDocumento: new Date().toISOString().split('T')[0],
        idFornitore: null,
        descFornitore: '',
        fornitoreDto: null,
        idTipoPagamento: null,
        idNsBanca: null,
        banca: '',
        iban: '',
        cin: '',
        abi: '',
        cab: '',
        conto: '',
        bic: '',
        indirizzoIntestazione: '',
        cittaIntestazione: '',
        capIntestazione: '',
        provinciaIntestazione: '',
        nazioneIntestazione: 'Italia',
        codiceFiscale: '',
        partitaIva: '',
        indirizzoDestinazione: '',
        cittaDestinazione: '',
        capDestinazione: '',
        provinciaDestinazione: '',
        nazioneDestinazione: 'Italia',
        idCausaleTrasporto: null,
        dataTrasporto: '',
        oraTrasporto: '',
        idTipoPorto: null,
        idVettore: null,
        idAspettoBeni: null,
        colli: '',
        pallet: '',
        idMagazzino: 1,
        acconto: 0,
        annotazioneEstesa: '',
        listaScadenzePagamentiDocumento: []
    });

    const [prodotti, setProdotti] = useState([]);

    const [combos, setCombos] = useState({
        tipiPagamento: [],
        risorse: [],
        aliquoteIva: [],
        unitaMisura: [],
        ASPETTIBENI: [],
        CAUSALITRASPORTO: [],
        TIPIPORTO: [],
        VETTORI: [],
        BANCHE: []
    });

    useEffect(() => {
        fetchCombos();
        if (!isNew) {
            fetchData();
        } else {
            fetchNextNum(formData.dataDocumento);
        }

        const handleClickOutside = (event) => {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target)) {
                setShowActionsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [id]);

    const fetchCombos = async () => {
        try {
            const res = await OrdiniService.getCombosMap();
            const payload = res.data?.payload || res.data;
            if (payload) {
                setCombos(prev => ({
                    ...prev,
                    tipiPagamento: payload.TIPIPAGAMENTO || payload.tipiPagamento || prev.tipiPagamento,
                    risorse: payload.BANCHE || payload.risorse || prev.risorse,
                    aliquoteIva: payload.ALIQUOTEIVA || payload.aliquoteIva || prev.aliquoteIva,
                    unitaMisura: payload.UNITAMISURA || payload.unitaMisura || prev.unitaMisura,
                    ...payload
                }));
            }
        } catch (error) {
            console.error(error);
        }
    };

    const fetchData = async () => {
        try {
            const res = await OrdiniService.getById(id);
            const data = res.data?.payload || res.data;
            if (data) {
                if (data.dataDocumento && data.dataDocumento.includes('/')) {
                    const parts = data.dataDocumento.split('/');
                    data.dataDocumento = `${parts[2]}-${parts[1]}-${parts[0]}`;
                }
                if (data.dataOraTrasporto && data.dataOraTrasporto.includes(' ')) {
                    const [d, t] = data.dataOraTrasporto.split(' ');
                    if (d.includes('/')) {
                        const parts = d.split('/');
                        data.dataTrasporto = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    }
                    data.oraTrasporto = t;
                }
                setFormData(prev => ({ ...prev, ...data }));
                const mappedProdotti = (data.prodotti || []).map(p => ({
                    ...p,
                    tipo: p.tipo || (p.idProdotto ? 'A' : (p.fmDescrizione ? 'F' : 'N'))
                }));
                setProdotti(mappedProdotti);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Errore', "Impossibile caricare l'ordine", 'error');
            navigate('/ordini');
        }
    };

    const fetchNextNum = async (dateStr) => {
        if (!dateStr) return;
        try {
            const formattedDate = dateStr.split('-').reverse().join('/');
            const res = await OrdiniService.getNextNum(formattedDate);
            const num = res.data?.payload ?? res.data;
            if (num) setFormData(prev => ({ ...prev, numDocumento: num }));
        } catch (error) {
            console.error(error);
        }
    };

    // Auto-fill fornitore address details
    useEffect(() => {
        if (formData.fornitoreDto) {
            applyFornitoreAddress(formData.fornitoreDto);
        } else if (formData.idFornitore && isNew) {
            FornitoriService.getById(formData.idFornitore).then(res => {
                const f = res.data?.payload || res.data;
                if (f) applyFornitoreAddress(f);
            }).catch(err => console.error(err));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.idFornitore]);

    const applyFornitoreAddress = (f) => {
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
        setFormData(prev => ({
            ...prev,
            indirizzoIntestazione: addr.indirizzo,
            cittaIntestazione: addr.citta,
            capIntestazione: addr.cap,
            provinciaIntestazione: addr.provincia,
            nazioneIntestazione: addr.nazione,
            indirizzoDestinazione: addr.indirizzo,
            cittaDestinazione: addr.citta,
            capDestinazione: addr.cap,
            provinciaDestinazione: addr.provincia,
            nazioneDestinazione: addr.nazione,
            partitaIva: f.partitaIva || prev.partitaIva || '',
            codiceFiscale: f.codiceFiscale || prev.codiceFiscale || '',
            idTipoPagamento: f.idTipoPagamento || prev.idTipoPagamento
        }));
    };

    const loadFornitori = (inputValue, callback) => {
        if (!inputValue || inputValue.length < 2) return callback([]);
        FornitoriService.getSuggestion(inputValue).then(res => {
            const list = Array.isArray(res.data) ? res.data : (res.data && res.data.payload) || [];
            callback(list.map(f => ({ value: f.id, label: f.denominazione || f.denominazioneData, data: f })));
        }).catch(err => {
            console.error(err);
            callback([]);
        });
    };

    const handleSelectFornitore = (opt) => {
        if (opt) {
            const f = opt.data;
            setFormData(prev => ({ ...prev, idFornitore: f.id, descFornitore: f.denominazione, fornitoreDto: f }));
        } else {
            setFormData(prev => ({ ...prev, idFornitore: null, descFornitore: '', fornitoreDto: null }));
        }
    };

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const nextData = { ...prev, [name]: value };
            if (name === 'dataDocumento' && isNew) fetchNextNum(value);
            return nextData;
        });
    };

    const handleRowChange = (idx, field, value) => {
        setProdotti(prev => {
            const newP = [...prev];
            newP[idx] = { ...newP[idx], [field]: value };
            return newP;
        });
    };

    const handleRowUpdate = (idx, updates) => {
        setProdotti(prev => {
            const newP = [...prev];
            newP[idx] = { ...newP[idx], ...updates };
            return newP;
        });
    };

    const handleDeleteRow = (idx) => {
        setProdotti(prev => {
            const newP = [...prev];
            newP.splice(idx, 1);
            return newP;
        });
    };

    const calculateTotalImponibile = () => prodotti.reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).imponibile || 0), 0);
    const calculateTotalDocument = () => prodotti.reduce((acc, row) => acc + (getRowValues(row, combos.aliquoteIva).total || 0), 0);

    const formatCurrency = (val) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(val || 0);

    const validate = () => {
        if (!formData.numDocumento) { Swal.fire('Errore', 'Inserire il numero ordine', 'error'); return false; }
        if (!formData.dataDocumento) { Swal.fire('Errore', 'Inserire la data ordine', 'error'); return false; }
        if (!formData.idFornitore) { Swal.fire('Errore', 'Selezionare un fornitore', 'error'); return false; }
        if (!prodotti || prodotti.length === 0) { Swal.fire('Errore', 'Inserire almeno un articolo', 'error'); return false; }
        return true;
    };

    const saveOrdine = async () => {
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
            }))
        };

        try {
            const res = await OrdiniService.save(payload);
            return res.data?.payload?.id || res.data?.payload || (isNew ? res.data : id);
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.response?.data || 'Errore durante il salvataggio';
            Swal.fire('Errore', msg, 'error');
            return null;
        }
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        const savedId = await saveOrdine();
        if (savedId) {
            Swal.fire({
                title: 'Salvato!',
                text: "Ordine salvato con successo",
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            }).then(() => navigate('/ordini'));
        }
    };

    return (
        <div className="ordini-detail-container entity-form-shared">
            <div id="ddt-content-header">
                <div>
                    <h1>{isNew ? 'Nuovo' : 'Modifica'} Ordine a fornitore</h1>
                    <div className="breadcrumb">
                        <span onClick={() => navigate('/ordini')}>Elenco Ordini</span> / <span>{isNew ? 'Nuovo' : formData.numDocumento}</span>
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
                    <div className="tab-content" autoComplete="off">
                        <input type="text" style={{ display: 'none' }} autoComplete="off" />
                        {/* Tab Generale */}
                        <div className={`tab-pane ${activeTab === 'generale' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div className="compact-row">
                                    <div className="compact-col compact-col-md">
                                        <div className="form-group">
                                            <label>Numero</label>
                                            <input
                                                type="text"
                                                className="form-control premium-input"
                                                name="numDocumento"
                                                value={formData.numDocumento}
                                                onChange={handleHeaderChange}
                                                autoComplete="off"
                                            />
                                        </div>
                                    </div>
                                    <div className="compact-col compact-col-sm">
                                        <div className="form-group">
                                            <label>Data</label>
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
                                    <div className="compact-col compact-col-xl">
                                        <EntitySelectGroup
                                            label="Fornitore"
                                            isAsync={true}
                                            loadOptions={loadFornitori}
                                            value={formData.idFornitore ? { value: formData.idFornitore, label: formData.descFornitore || formData.fornitoreDto?.denominazione } : null}
                                            onChange={handleSelectFornitore}
                                            placeholder="Cerca fornitore..."
                                            widthClass="w-lg"
                                        />
                                    </div>
                                </div>

                                <hr />

                                <div className="row mt-4">
                                    <div className="col-md-6">
                                        <div className="premium-card address-card">
                                            <div className="card-header-vibrant">
                                                <span><FaHome /> Intestazione</span>
                                            </div>
                                            <div className="card-body">
                                                <div className="row mb-4">
                                                    <div className="col-md-12">
                                                        <label className="premium-label">Indirizzo</label>
                                                        <input type="search" className="form-control premium-input" name="indirizzoIntestazione" value={formData.indirizzoIntestazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                    </div>
                                                </div>
                                                <div className="row mb-4">
                                                    <div className="col-md-7">
                                                        <label className="premium-label">Città</label>
                                                        <input type="search" className="form-control premium-input" name="cittaIntestazione" value={formData.cittaIntestazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <label className="premium-label">Prov.</label>
                                                        <input type="search" className="form-control premium-input" name="provinciaIntestazione" value={formData.provinciaIntestazione || ''} onChange={handleHeaderChange} maxLength="2" autoComplete="new-password" />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="premium-label">CAP</label>
                                                        <input type="search" className="form-control premium-input" name="capIntestazione" value={formData.capIntestazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                    </div>
                                                </div>
                                                <div className="row mb-4">
                                                    <div className="col-md-12">
                                                        <label className="premium-label"><FaGlobe style={{ marginRight: '5px' }} /> Nazione</label>
                                                        <NazioneSelect value={formData.nazioneIntestazione} onChange={(val) => setFormData(prev => ({ ...prev, nazioneIntestazione: val }))} />
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
                                            <div className="card-header-vibrant">
                                                <span><FaTruck /> Destinazione Consegna</span>
                                            </div>
                                            <div className="card-body">
                                                <div className="row mb-4">
                                                    <div className="col-md-12">
                                                        <label className="premium-label">Indirizzo</label>
                                                        <input type="search" className="form-control premium-input" name="indirizzoDestinazione" value={formData.indirizzoDestinazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                    </div>
                                                </div>
                                                <div className="row mb-4">
                                                    <div className="col-md-7">
                                                        <label className="premium-label">Città</label>
                                                        <input type="search" className="form-control premium-input" name="cittaDestinazione" value={formData.cittaDestinazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <label className="premium-label">Prov.</label>
                                                        <input type="search" className="form-control premium-input" name="provinciaDestinazione" value={formData.provinciaDestinazione || ''} onChange={handleHeaderChange} maxLength="2" autoComplete="new-password" />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <label className="premium-label">CAP</label>
                                                        <input type="search" className="form-control premium-input" name="capDestinazione" value={formData.capDestinazione || ''} onChange={handleHeaderChange} autoComplete="new-password" />
                                                    </div>
                                                </div>
                                                <div className="row mb-4">
                                                    <div className="col-md-12">
                                                        <label className="premium-label"><FaGlobe style={{ marginRight: '5px' }} /> Nazione</label>
                                                        <NazioneSelect value={formData.nazioneDestinazione} onChange={(val) => setFormData(prev => ({ ...prev, nazioneDestinazione: val }))} />
                                                    </div>
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
                                onRowUpdate={handleRowUpdate}
                                onDeleteRow={handleDeleteRow}
                                onAddRow={(newRow) => { setProdotti([...prodotti, newRow]); setActiveTab('articoli'); }}
                                combos={combos}
                                idListino={null}
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
                                            <label className="premium-label">Pallet</label>
                                            <input type="number" className="form-control premium-input" name="pallet" value={formData.pallet || ''} onChange={handleHeaderChange} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Tab Pagamento */}
                        <div className={`tab-pane ${activeTab === 'pagamento' ? 'active' : ''}`}>
                            <div className="tab-padding-wrapper">
                                <div className="row mb-4">
                                    <div className="col-md-6">
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
                                    <div className="col-md-6">
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
                                </div>
                                <div className="row mt-4">
                                    <div className="col-12">
                                        <ScadenzeTable
                                            idTipoPagamento={formData.idTipoPagamento}
                                            dataDocumento={formData.dataDocumento}
                                            totaleDocumento={calculateTotalDocument()}
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
                            <button type="button" className="btn-premium-cancel" onClick={() => navigate('/ordini')}>
                                <FaArrowLeft /> Indietro
                            </button>
                            <div className="footer-right">
                                <div className="split-btn-container" ref={actionsMenuRef}>
                                    <button type="button" className="split-btn-main btn-premium-save" onClick={handleSave}>
                                        <FaSave /> Salva
                                    </button>
                                    <button type="button" className="split-btn-toggle" onClick={() => setShowActionsMenu(!showActionsMenu)}>
                                        <FaCaretDown />
                                    </button>
                                    <div className={`split-btn-menu ${showActionsMenu ? 'show' : ''}`}>
                                        <button type="button" className="split-btn-item" onClick={handleSave}>
                                            <FaSave /> Salva solo
                                        </button>
                                        {!isNew && (
                                            <>
                                                <div className="action-dropdown-divider" style={{ height: '1px', background: '#eee', margin: '5px 0' }}></div>
                                                <button type="button" className="split-btn-item" onClick={async () => {
                                                    const savedId = await saveOrdine();
                                                    if (savedId) navigate(`/bollecarico/new?fromOrdine=${savedId}`);
                                                }}>
                                                    <FaTruckLoading /> Genera Bolla di carico
                                                </button>
                                                <button type="button" className="split-btn-item" onClick={async () => {
                                                    const savedId = await saveOrdine();
                                                    if (savedId) navigate(`/fatture-fornitore/new?fromOrdine=${savedId}`);
                                                }}>
                                                    <FaFileInvoiceDollar /> Genera Fattura Fornitore
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </footer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrdiniDetail;
