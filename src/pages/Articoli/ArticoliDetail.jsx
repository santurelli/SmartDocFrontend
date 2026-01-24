import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArticoliService from '../../services/ArticoliService';
import AuthService from '../../services/authService';
import CategorieArticoliService from '../../services/CategorieArticoliService';
import SottoCategorieService from '../../services/SottoCategorieService';
import DivisioniService from '../../services/DivisioniService';
import UnitaMisuraService from '../../services/UnitaMisuraService';
import FormatiArticoloService from '../../services/FormatiArticoloService';
import ScelteArticoloService from '../../services/ScelteArticoloService';
import ToniArticoloService from '../../services/ToniArticoloService';
import CalibriArticoloService from '../../services/CalibriArticoloService';
import AliquoteIvaService from '../../services/AliquoteIvaService';
import FornitoriService from '../../services/FornitoriService';
import CategorieManagementModal from './CategorieManagementModal';
import SottoCategorieManagementModal from './SottoCategorieManagementModal';
import UnitaMisuraManagementModal from './UnitaMisuraManagementModal';
import AliquoteIvaManagementModal from './AliquoteIvaManagementModal';
import { FaSave, FaArrowLeft, FaWrench, FaAngleRight, FaHome } from 'react-icons/fa';
import AsyncSelect from 'react-select/async';
import './ArticoliDetail.css';

const ArticoliDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;

    // Config state
    const [config, setConfig] = useState({
        prezziIvati: false,
        abilitaCodice: true,
        abilitaTipoProdotto: true,
        abilitaSottoCategorie: true,
        abilitaUnitaMisura: true,
        abilitaDivisioni: false,
        isCeramica: false,
    });
    const [showCategorieModal, setShowCategorieModal] = useState(false);
    const [showSottoCategorieModal, setShowSottoCategorieModal] = useState(false);
    const [showUnitaMisuraModal, setShowUnitaMisuraModal] = useState(false);
    const [showAliquoteIvaModal, setShowAliquoteIvaModal] = useState(false);

    const [formData, setFormData] = useState({
        codice: '',
        descrizione: '',
        tipologia: 'A', // Default Articolo
        idCategoria: '',
        idSottoCategoria: '',
        idDivisione: '',
        // Ceramica fields
        idFormato: '',
        idScelta: '',
        idTono: '',
        idCalibro: '',
        mqBox: 0,
        pezziBox: 0,
        // Other
        idUnitaMisura: '',
        scortaMinima: '',
        codicePerFornitore: '',
        prezzoFornitore: '',
        note: '',
        idAliquotaIva: '',
        idFornitore: null,
        descFornitore: ''
    });

    const [combos, setCombos] = useState({
        categorie: [],
        sottocategorie: [],
        divisioni: [],
        unitaMisura: [],
        formati: [],
        scelte: [],
        toni: [],
        calibri: [],
        aliquoteIva: [],
        fornitori: []
    });

    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            // 1. Load Config (Placeholder - should come from Service/Auth)
            const globalConfig = AuthService.getConfig();
            const newConfig = {
                prezziIvati: globalConfig['PREZZI_IVATI'] === '1' || globalConfig['ARTICOLI_PREZZI_IVATI'] === '1',
                abilitaCodice: globalConfig['CODICE_ABILITA'] !== '0' && globalConfig['ARTICOLI_CODICE_ABILITA'] !== '0',
                abilitaSottoCategorie: globalConfig['ABILITA_SOTTOCATEGORIEARTICOLI'] !== '0' && globalConfig['ARTICOLI_ABILITA_SOTTOCATEGORIEARTICOLI'] !== '0',
                abilitaUnitaMisura: globalConfig['ABILITA_UNITAMISURA'] !== '0' && globalConfig['ARTICOLI_ABILITA_UNITAMISURA'] !== '0',
                abilitaDivisioni: globalConfig['ABILITADIVISIONI'] === '1',
                isCeramica: globalConfig['TIPOSTORE'] === 'CERAMICA',
            };
            setConfig(newConfig);

            // 2. Load Combos
            const [
                catRes, divRes, umRes,
                formatiRes, scelteRes, toniRes, calibriRes,
                aliquoteRes, fornitoriRes
            ] = await Promise.all([
                CategorieArticoliService.getListForCombo(),
                newConfig.abilitaDivisioni ? DivisioniService.getListForCombo() : Promise.resolve({ data: { payload: [] } }),
                newConfig.abilitaUnitaMisura ? UnitaMisuraService.getListForCombo() : Promise.resolve({ data: { payload: [] } }),
                // Ceramica
                newConfig.isCeramica ? FormatiArticoloService.getListForCombo() : Promise.resolve({ data: { payload: [] } }),
                newConfig.isCeramica ? ScelteArticoloService.getListForCombo() : Promise.resolve({ data: { payload: [] } }),
                newConfig.isCeramica ? ToniArticoloService.getListForCombo() : Promise.resolve({ data: { payload: [] } }),
                newConfig.isCeramica ? CalibriArticoloService.getListForCombo() : Promise.resolve({ data: { payload: [] } }),
                // Other
                AliquoteIvaService.getListForCombo(),
                FornitoriService.getListForCombo()
            ]);

            setCombos({
                categorie: catRes.data.payload || [],
                divisioni: divRes.data.payload || [],
                unitaMisura: umRes.data.payload || [],
                formati: formatiRes.data.payload || [],
                scelte: scelteRes.data.payload || [],
                toni: toniRes.data.payload || [],
                calibri: calibriRes.data.payload || [],
                aliquoteIva: aliquoteRes.data.payload || [],
                fornitori: fornitoriRes.data.payload || [],
                sottocategorie: [] // Load when category selected
            });

            // 3. Load Data if Edit
            if (!isNew) {
                const res = await ArticoliService.getById(id);
                if (res.data && res.data.payload) {
                    const data = res.data.payload;
                    setFormData(data);
                    // Load sottocategorie if category present
                    if (data.idCategoria) {
                        const subRes = await SottoCategorieService.getListForCombo(data.idCategoria);
                        setCombos(prev => ({ ...prev, sottocategorie: subRes.data.payload || [] }));
                    }
                }
            }

        } catch (error) {
            console.error("Error loading article data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'idCategoria') {
            loadSottoCategorie(value);
        }
    };

    const handleManageCategorie = () => {
        setShowCategorieModal(true);
    };

    const handleCloseCategorieModal = async () => {
        setShowCategorieModal(false);
        try {
            const res = await CategorieArticoliService.getListForCombo();
            setCombos(prev => ({ ...prev, categorie: res.data.payload || [] }));
        } catch (e) {
            console.error("Refresh categories failed", e);
        }
    };

    const handleManageSottoCategorie = () => {
        setShowSottoCategorieModal(true);
    };

    const handleCloseSottoCategorieModal = async () => {
        setShowSottoCategorieModal(false);
        if (formData.idCategoria) {
            loadSottoCategorie(formData.idCategoria);
        }
    };

    const loadSottoCategorie = async (idCategoria) => {
        if (!idCategoria) {
            setCombos(prev => ({ ...prev, sottocategorie: [] }));
            return;
        }
        try {
            const res = await SottoCategorieService.getListForCombo(idCategoria);
            setCombos(prev => ({ ...prev, sottocategorie: res.data.payload || [] }));
        } catch (e) {
            console.error(e);
        }
    };

    const handleGenerateCode = async () => {
        try {
            const res = await ArticoliService.getNextCode();
            if (res.data && res.data.codice) {
                setFormData(prev => ({ ...prev, codice: res.data.codice }));
            }
        } catch (e) {
            console.error("Error generating code", e);
            alert("Errore durante la generazione del codice.");
        }
    };

    const handleManageUnitaMisura = () => {
        setShowUnitaMisuraModal(true);
    };

    const handleCloseUnitaMisuraModal = async () => {
        setShowUnitaMisuraModal(false);
        try {
            const res = await UnitaMisuraService.getListForCombo();
            setCombos(prev => ({ ...prev, unitaMisura: res.data.payload || [] }));
        } catch (e) {
            console.error("Refresh units failed", e);
        }
    };

    const handleManageAliquoteIva = () => {
        setShowAliquoteIvaModal(true);
    };

    const handleCloseAliquoteIvaModal = async () => {
        setShowAliquoteIvaModal(false);
        try {
            const res = await AliquoteIvaService.getListForCombo();
            setCombos(prev => ({ ...prev, aliquoteIva: res.data.payload || [] }));
        } catch (e) {
            console.error("Refresh VAT rates failed", e);
        }
    };

    const handleSave = async () => {
        // Validation
        if (config.abilitaCodice && !formData.codice) {
            // If disabled, code might be empty, backend handles it. 
            // If enabled, user sees it.
            // But Wait! User asked: "if disabled... what happens?". I said "auto-generate".
            // The backend auto-generates if empty.
            // So if config.abilitaCodice is TRUE, it IS mandatory for the user (or they click generate).
            // If FALSE, it is hidden, so empty is fine (backend generates).
            alert("Il campo 'Codice' è obbligatorio.");
            return;
        }
        if (!formData.descrizione) {
            alert("Il campo 'Descrizione' è obbligatorio.");
            return;
        }

        try {
            if (isNew) {
                await ArticoliService.create(formData);
            } else {
                await ArticoliService.update(formData);
            }
            navigate('/articoli');
        } catch (e) {
            console.error("Error saving", e);
            alert("Errore durante il salvataggio: " + (e.response?.data || e.message));
        }
    };

    if (loading) return <div>Caricamento...</div>;

    // Helper for config buttons
    const renderConfigButton = (path) => (
        <span className="input-group-btn">
            <button className="btn btn-wrench btn-addon" type="button" onClick={() => navigate(path)} title="Gestione tabella">
                <FaWrench />
            </button>
        </span>
    );

    return (
        <div className="articoli-detail-container">
            {/* Breadcrumb */}
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li><FaAngleRight /></li>
                <li><a href="/articoli">Elenco articoli</a></li>
                <li><FaAngleRight /></li>
                <li className="active">{isNew ? 'Nuovo articolo' : 'Modifica articolo'}</li>
            </ul>

            <h1>{isNew ? 'Nuovo articolo' : 'Modifica articolo'}</h1>

            <form role="form">
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
                    {/* TAB GENERALE */}
                    <div className={`tab-pane ${activeTab === 'general' ? 'active' : ''}`} style={{ display: activeTab === 'general' ? 'block' : 'none' }}>

                        {config.abilitaCodice && (
                            <div className="row" id="row-codice">
                                <div className="col-xs-12 col-md-3">
                                    <div className="form-group">
                                        <label className="required">Codice</label>
                                        <div className="input-group">
                                            <input type="text" className="form-control" name="codice" value={formData.codice} onChange={handleChange} placeholder="Inserisci codice" />
                                            <span className="input-group-btn">
                                                <button className="btn btn-primary-custom btn-addon" type="button" onClick={handleGenerateCode}>Genera codice</button>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="row">
                            <div className="col-xs-12 col-md-8">
                                <div className="form-group">
                                    <label className="required">Descrizione</label>
                                    <input type="text" className="form-control" name="descrizione" value={formData.descrizione} onChange={handleChange} placeholder="Inserisci descrizione" />
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-xs-12 col-md-4">
                                <div className="form-group">
                                    <label>Tipologia</label>
                                    <select className="form-control" name="tipologia" value={formData.tipologia} onChange={handleChange}>
                                        <option value="A">Articolo Magazzino</option>
                                        <option value="S">Servizio</option>
                                    </select>
                                </div>
                            </div>
                            {config.abilitaDivisioni && (
                                <div className="col-xs-12 col-md-4">
                                    <div className="form-group">
                                        <label>Divisione</label>
                                        <div className="input-group">
                                            <select className="form-control" name="idDivisione" value={formData.idDivisione} onChange={handleChange}>
                                                <option value="">Seleziona...</option>
                                                {combos.divisioni.map(d => <option key={d.id} value={d.id}>{d.descrizione}</option>)}
                                            </select>
                                            {renderConfigButton('/tabelle/divisioni')}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="row">
                            <div className="col-xs-12 col-md-4">
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <div className="input-group">
                                        <select className="form-control" name="idCategoria" value={formData.idCategoria} onChange={handleChange}>
                                            <option value="">Seleziona...</option>
                                            {combos.categorie.map(c => <option key={c.id} value={c.id}>{c.descrizione}</option>)}
                                        </select>
                                        <span className="input-group-btn">
                                            <button className="btn btn-wrench btn-addon" type="button" onClick={handleManageCategorie} title="Gestione tabella">
                                                <FaWrench />
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {config.abilitaSottoCategorie && (
                                <div className="col-xs-12 col-md-4">
                                    <div className="form-group">
                                        <label>Sottocategoria</label>
                                        <div className="input-group">
                                            <select className="form-control" name="idSottoCategoria" value={formData.idSottoCategoria} onChange={handleChange}>
                                                <option value="">Seleziona...</option>
                                                {combos.sottocategorie.map(s => <option key={s.id} value={s.id}>{s.descrizione}</option>)}
                                            </select>
                                            <span className="input-group-btn">
                                                <button className="btn btn-wrench btn-addon" type="button" onClick={handleManageSottoCategorie} title="Gestione tabella">
                                                    <FaWrench />
                                                </button>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* CERAMICA FIELDS */}
                        {config.isCeramica && (
                            <div className="row">
                                <div className="col-xs-12 col-md-3">
                                    <div className="form-group">
                                        <label>Formato</label>
                                        <select className="form-control" name="idFormato" value={formData.idFormato} onChange={handleChange}>
                                            {combos.formati.map(f => <option key={f.id} value={f.id}>{f.descrizione}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-xs-12 col-md-3">
                                    <div className="form-group">
                                        <label>Scelta</label>
                                        <select className="form-control" name="idScelta" value={formData.idScelta} onChange={handleChange}>
                                            {combos.scelte.map(s => <option key={s.id} value={s.id}>{s.descrizione}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-xs-12 col-md-3">
                                    <div className="form-group">
                                        <label>Tono</label>
                                        <select className="form-control" name="idTono" value={formData.idTono} onChange={handleChange}>
                                            {combos.toni.map(t => <option key={t.id} value={t.id}>{t.descrizione}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-xs-12 col-md-3">
                                    <div className="form-group">
                                        <label>Calibro</label>
                                        <select className="form-control" name="idCalibro" value={formData.idCalibro} onChange={handleChange}>
                                            {combos.calibri.map(c => <option key={c.id} value={c.id}>{c.descrizione}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="col-xs-12 col-md-2">
                                    <div className="form-group">
                                        <label>MQ/Box</label>
                                        <input type="number" className="form-control" name="mqBox" value={formData.mqBox} onChange={handleChange} />
                                    </div>
                                </div>
                                <div className="col-xs-12 col-md-2">
                                    <div className="form-group">
                                        <label>Pezzi/Box</label>
                                        <input type="number" className="form-control" name="pezziBox" value={formData.pezziBox} onChange={handleChange} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {config.abilitaUnitaMisura && (
                            <div className="row">
                                <div className="col-xs-12 col-md-4">
                                    <div className="form-group">
                                        <label>Unità di misura</label>
                                        <div className="input-group">
                                            <select className="form-control" name="idUnitaMisura" value={formData.idUnitaMisura} onChange={handleChange}>
                                                {combos.unitaMisura.map(u => <option key={u.id} value={u.id}>{u.descrizione}</option>)}
                                            </select>
                                            <span className="input-group-btn">
                                                <button className="btn btn-wrench btn-addon" type="button" onClick={handleManageUnitaMisura} title="Gestione tabella">
                                                    <FaWrench />
                                                </button>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="row">
                            <div className="col-xs-12">
                                <div className="form-group">
                                    <label>Note</label>
                                    <textarea className="form-control" name="note" value={formData.note || ''} onChange={handleChange} rows="3"></textarea>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* TAB ALTRE INFORMAZIONI */}
                    <div className={`tab-pane ${activeTab === 'other' ? 'active' : ''}`} style={{ display: activeTab === 'other' ? 'block' : 'none' }}>
                        <div className="row">
                            <div className="col-xs-12 col-md-3">
                                <div className="form-group">
                                    <label>Scorta minima</label>
                                    <input type="number" className="form-control" name="scortaMinima" value={formData.scortaMinima} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xs-12 col-md-4">
                                <div className="form-group">
                                    <label>Aliquota IVA</label>
                                    <div className="input-group">
                                        <select className="form-control" name="idAliquotaIva" value={formData.idAliquotaIva} onChange={handleChange}>
                                            <option value="">Seleziona...</option>
                                            {combos.aliquoteIva.map(a => <option key={a.id} value={a.id}>{a.codice} - {a.descrizione}</option>)}
                                        </select>
                                        <span className="input-group-btn">
                                            <button className="btn btn-wrench btn-addon" type="button" onClick={handleManageAliquoteIva} title="Gestione tabella">
                                                <FaWrench />
                                            </button>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xs-12 col-md-6">
                                <div className="form-group">
                                    <label>Fornitore</label>
                                    <div className="input-group" style={{ display: 'flex' }}>
                                        <div style={{ flexGrow: 1 }}>
                                            <AsyncSelect
                                                cacheOptions
                                                defaultOptions
                                                loadOptions={(inputValue) =>
                                                    FornitoriService.getSuggestion(inputValue).then(res =>
                                                        res.data?.payload?.map(f => ({ value: f.id, label: f.denominazione })) || []
                                                    )
                                                }
                                                value={formData.idFornitore ? { value: formData.idFornitore, label: formData.descFornitore || 'Fornitore...' } : null}
                                                onChange={(opt) => setFormData(prev => ({
                                                    ...prev,
                                                    idFornitore: opt ? opt.value : '',
                                                    descFornitore: opt ? opt.label : ''
                                                }))}
                                                placeholder="Cerca fornitore..."
                                                isClearable
                                                styles={{
                                                    control: (base) => ({
                                                        ...base,
                                                        height: '34px',
                                                        minHeight: '34px',
                                                        borderRadius: '3px 0 0 3px',
                                                        borderColor: '#ccc',
                                                        boxShadow: 'none',
                                                        ':hover': { borderColor: '#ccc' }
                                                    }),
                                                    menu: (base) => ({ ...base, zIndex: 9999 })
                                                }}
                                            />
                                        </div>
                                        {renderConfigButton('/tabelle/fornitori')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-xs-12 col-md-4">
                                <div className="form-group">
                                    <label>Codice articolo fornitore</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="codicePerFornitore"
                                        value={formData.codicePerFornitore || ''}
                                        onChange={handleChange}
                                        placeholder="Inserisci cod. art. forn."
                                    />
                                </div>
                            </div>
                            <div className="col-xs-12 col-md-4">
                                <div className="form-group">
                                    <label>Prezzo fornitore</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="form-control"
                                        name="prezzoFornitore"
                                        value={formData.prezzoFornitore || ''}
                                        onChange={handleChange}
                                        placeholder="Inserisci prezzo fornitore"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-default-custom" onClick={() => navigate('/articoli')}>Annulla</button>
                    <button type="button" className="btn btn-danger-custom" onClick={handleSave}>Salva</button>
                </div>
            </form>
            {showCategorieModal && (
                <CategorieManagementModal onClose={handleCloseCategorieModal} />
            )}
            {showSottoCategorieModal && (
                <SottoCategorieManagementModal onClose={handleCloseSottoCategorieModal} />
            )}
            {showUnitaMisuraModal && (
                <UnitaMisuraManagementModal onClose={handleCloseUnitaMisuraModal} />
            )}
            {showAliquoteIvaModal && (
                <AliquoteIvaManagementModal onClose={handleCloseAliquoteIvaModal} />
            )}
        </div>
    );
};

export default ArticoliDetail;
