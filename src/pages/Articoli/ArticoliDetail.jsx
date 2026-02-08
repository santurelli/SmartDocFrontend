import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaHome, FaAngleRight, FaWrench, FaPlus } from 'react-icons/fa';
import ArticoliService from '../../services/ArticoliService';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import FornitoriService from '../../services/FornitoriService';
import EntitySelectGroup from '../../components/EntitySelectGroup';
import CategorieManagementModal from '../../components/modals/CategorieManagementModal';
import SottoCategorieManagementModal from '../../components/modals/SottoCategorieManagementModal';
import UnitaMisuraManagementModal from '../../components/modals/UnitaMisuraManagementModal';
import AliquoteIvaManagementModal from '../../components/modals/AliquoteIvaManagementModal';
import FornitoriManagementModal from '../../components/modals/FornitoriManagementModal';
import WrenchModalButton from '../../components/WrenchModalButton';
import './ArticoliDetail.css';
import '../../components/EntityForms.css';

const ArticoliDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';

    const [activeTab, setActiveTab] = useState('general');
    const [formData, setFormData] = useState({
        codice: '',
        descrizione: '',
        tipologia: 'A',
        mqBox: '',
        pezziBox: '',
        note: '',
        scortaMinima: 0,
        idCategoria: '',
        idSottoCategoria: '',
        idDivisione: '',
        idFormato: '',
        idScelta: '',
        idTono: '',
        idCalibro: '',
        idUnitaMisura: '',
        idAliquotaIva: '',
        idFornitore: '',
        prezzoFornitore: '',
        codicePerFornitore: ''
    });

    const [combos, setCombos] = useState({
        categorie: [],
        sottocategorie: [],
        divisioni: [],
        formati: [],
        scelte: [],
        toni: [],
        calibri: [],
        unitaMisura: [],
        aliquoteIva: []
    });

    const [config, setConfig] = useState({
        isCeramica: false,
        abilitaSottoCategorie: true,
        abilitaDivisioni: false,
        abilitaCodice: true,
        abilitaUnitaMisura: true
    });


    useEffect(() => {
        loadConfig();
        loadCombos();
        if (!isNew && id && id !== 'undefined') {
            loadArticolo();
        }
    }, [id]);

    const loadConfig = async () => {
        try {
            const res = await ConfigurazioneService.getByDomain('GLOBAL');
            const configs = res.data?.payload || [];
            const divisioniConfig = configs.find(c => c.chiave === 'DIVISIONI');
            const abilitaDivisioni = divisioniConfig && divisioniConfig.valore === '1';

            setConfig(prev => ({
                ...prev,
                abilitaDivisioni: abilitaDivisioni
            }));
        } catch (error) {
            console.error("Errore caricamento configurazione", error);
        }
    };

    const loadCombos = async () => {
        try {
            // Unita Misura, Aliquote IVA, Categorie (cached)
            const [cat, um, iva] = await Promise.all([
                ArticoliService.getCategorie(),
                ArticoliService.getUnitaMisura(),
                ArticoliService.getAliquoteIva()
            ]);

            setCombos(prev => ({
                ...prev,
                categorie: cat.data?.payload || [],
                unitaMisura: um.data?.payload || [],
                aliquoteIva: iva.data?.payload || [],
                // Divisioni loaded separately if needed, but keeping logic clean
                divisioni: [] // Will be loaded if enabled or separately
            }));

            // If enabled, load divisioni too
            if (config.abilitaDivisioni) {
                ArticoliService.getDivisioni().then(res =>
                    setCombos(prev => ({ ...prev, divisioni: res.data?.payload || [] }))
                );
            }

            // Ceramica specific combos (placeholders)
            setCombos(prev => ({
                ...prev,
                formati: [],
                scelte: [],
                toni: [],
                calibri: []
            }));
        } catch (error) {
            console.error("Errore caricamento combo", error);
        }
    };

    const loadArticolo = async () => {
        try {
            const res = await ArticoliService.getArticolo(id);
            if (res.data) {
                setFormData(res.data);
                if (res.data.idCategoria) {
                    // Populate sottocategorie based on loaded category
                    loadSottoCategorie(res.data.idCategoria);
                }
            }
        } catch (error) {
            console.error("Errore caricamento articolo", error);
        }
    };

    const loadSottoCategorie = async (idCat) => {
        try {
            const res = await ArticoliService.getSottoCategorie(idCat);
            setCombos(prev => ({ ...prev, sottocategorie: res.data?.payload || [] }));
        } catch (error) {
            console.error("Errore sottocategorie", error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'idCategoria') {
            loadSottoCategorie(value);
        }
    };

    const handleSave = async () => {
        try {
            if (isNew) {
                await ArticoliService.createArticolo(formData);
            } else {
                await ArticoliService.updateArticolo(id, formData);
            }
            navigate('/articoli');
        } catch (error) {
            console.error("Errore salvataggio", error);
            alert("Errore durante il salvataggio");
        }
    };

    const handleGenerateCode = () => {
        // Mock generation
        const newCode = "ART-" + Math.floor(Math.random() * 100000);
        setFormData(prev => ({ ...prev, codice: newCode }));
    };

    const handleCloseCategorieModal = () => {
        ArticoliService.getCategorie().then(res => setCombos(prev => ({ ...prev, categorie: res.data?.payload || [] })));
    };

    const handleCloseSottoCategorieModal = () => {
        if (formData.idCategoria) {
            loadSottoCategorie(formData.idCategoria);
        }
    };

    const handleCloseUnitaMisuraModal = () => {
        ArticoliService.getUnitaMisura().then(res => setCombos(prev => ({ ...prev, unitaMisura: res.data?.payload || [] })));
    };

    const handleCloseAliquoteIvaModal = () => {
        ArticoliService.getAliquoteIva().then(res => setCombos(prev => ({ ...prev, aliquoteIva: res.data?.payload || [] })));
    };

    const handleCloseFornitoriModal = () => {
    };

    return (
        <div className="articoli-detail-container entity-form-shared">
            {/* Breadcrumb */}
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li><FaAngleRight /></li>
                <li><a href="/articoli">Elenco articoli</a></li>
                <li><FaAngleRight /></li>
                <li className="active">{isNew ? 'Nuovo articolo' : 'Modifica articolo'}</li>
            </ul>

            <h1>{isNew ? 'Nuovo articolo' : 'Modifica articolo'}</h1>

            <form role="form" onSubmit={(e) => e.preventDefault()}>
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
                            <div className="row">
                                <div className="col-xs-12 col-md-3">
                                    <div className="form-group">
                                        <label className="required">Codice</label>
                                        <div className="flex-input-group">
                                            <input type="text" className="form-control" name="codice" value={formData.codice} onChange={handleChange} placeholder="Inserisci codice" />
                                            <span className="input-group-btn">
                                                <button className="btn btn-default btn-addon" type="button" onClick={handleGenerateCode}>Genera</button>
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
                                        <div className="flex-input-group">
                                            <select className="form-control" name="idDivisione" value={formData.idDivisione} onChange={handleChange}>
                                                <option value="">Seleziona...</option>
                                                {combos.divisioni.map(d => <option key={d.id} value={d.id}>{d.descrizione}</option>)}
                                            </select>
                                            <span className="input-group-btn">
                                                <button className="btn btn-default btn-addon" type="button" onClick={() => navigate('/tabelle/divisioni')} title="Gestione tabella">
                                                    <FaWrench />
                                                </button>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="row">
                            <div className="col-xs-12 col-md-4">
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <div className="flex-input-group">
                                        <select className="form-control" name="idCategoria" value={formData.idCategoria} onChange={handleChange}>
                                            <option value="">Seleziona...</option>
                                            {combos.categorie.map(c => <option key={c.id} value={c.id}>{c.descrizione}</option>)}
                                        </select>
                                        <WrenchModalButton
                                            ModalComponent={CategorieManagementModal}
                                            onClose={handleCloseCategorieModal}
                                            title="Gestione categorie"
                                        />
                                    </div>
                                </div>
                            </div>
                            {config.abilitaSottoCategorie && (
                                <div className="col-xs-12 col-md-4">
                                    <div className="form-group">
                                        <label>Sottocategoria</label>
                                        <div className="flex-input-group">
                                            <select className="form-control" name="idSottoCategoria" value={formData.idSottoCategoria} onChange={handleChange}>
                                                <option value="">Seleziona...</option>
                                                {combos.sottocategorie.map(s => <option key={s.id} value={s.id}>{s.descrizione}</option>)}
                                            </select>
                                            <WrenchModalButton
                                                ModalComponent={SottoCategorieManagementModal}
                                                onClose={handleCloseSottoCategorieModal}
                                                title="Gestione sottocategorie"
                                            />
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
                            </div>
                        )}

                        {config.abilitaUnitaMisura && (
                            <div className="row">
                                <div className="col-xs-12 col-md-4">
                                    <div className="form-group">
                                        <label>Unità di misura</label>
                                        <div className="flex-input-group">
                                            <select className="form-control" name="idUnitaMisura" value={formData.idUnitaMisura} onChange={handleChange}>
                                                {combos.unitaMisura.map(u => <option key={u.id} value={u.id}>{u.descrizione}</option>)}
                                            </select>
                                            <WrenchModalButton
                                                ModalComponent={UnitaMisuraManagementModal}
                                                onClose={handleCloseUnitaMisuraModal}
                                                title="Gestione unità di misura"
                                            />
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
                                    <div className="flex-input-group">
                                        <select className="form-control" name="idAliquotaIva" value={formData.idAliquotaIva} onChange={handleChange}>
                                            <option value="">Seleziona...</option>
                                            {combos.aliquoteIva.map(a => <option key={a.id} value={a.id}>{a.codice} - {a.descrizione}</option>)}
                                        </select>
                                        <WrenchModalButton
                                            ModalComponent={AliquoteIvaManagementModal}
                                            onClose={handleCloseAliquoteIvaModal}
                                            title="Gestione aliquote IVA"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="row">
                            <div className="col-xs-12 col-md-6">
                                <EntitySelectGroup
                                    label="Fornitore"
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
                                    ModalComponent={FornitoriManagementModal}
                                    onModalClose={handleCloseFornitoriModal}
                                    title="Gestione fornitori"
                                    placeholder="Cerca fornitore..."
                                />
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
                    <button type="button" className="btn btn-premium-cancel" onClick={() => navigate('/articoli')}>Annulla</button>
                    <button type="button" className="btn btn-premium-save" onClick={handleSave}>Salva</button>
                </div>
            </form>

        </div>
    );
};

export default ArticoliDetail;
