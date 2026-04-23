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
import ScelteArticoloManagementModal from '../../components/modals/ScelteArticoloManagementModal';
import ToniArticoloManagementModal from '../../components/modals/ToniArticoloManagementModal';
import FormatiArticoloManagementModal from '../../components/modals/FormatiArticoloManagementModal';
import CalibriArticoloManagementModal from '../../components/modals/CalibriArticoloManagementModal';
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
    const [prezzi, setPrezzi] = useState([]);
    const [allListini, setAllListini] = useState([]);

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

    const [loadingPrezzi, setLoadingPrezzi] = useState(false);
    const [saving, setSaving] = useState(false);

    const [config, setConfig] = useState({
        isCeramica: false,
        abilitaSottoCategorie: true,
        abilitaDivisioni: false,
        abilitaCodice: true,
        abilitaUnitaMisura: true,
        abilitaScelteColori: false
    });


    useEffect(() => {
        const init = async () => {
            const currentConfig = await loadConfig();
            await loadCombos(currentConfig);
            if (!isNew && id && id !== 'undefined') {
                loadArticolo();
                loadPrezzi();
            } else if (isNew) {
                handleGenerateCode();
                loadListini(); // Need listini even for new article to show the tab structure
            }
        };
        init();
    }, [id]);

    const loadConfig = async () => {
        try {
            const res = await ConfigurazioneService.getByDomain('GLOBAL');
            const data = res.data?.payload || res.data || {};

            let isCeramica = false;
            let abilitaDivisioni = false;

            if (Array.isArray(data)) {
                isCeramica = data.some(c => (c.chiave === 'TIPO_STORE' || c.chiave === 'TIPOSTORE') && c.valore === 'CERAMICA');
                abilitaDivisioni = data.some(c => c.chiave === 'DIVISIONI' && c.valore === '1');
            } else {
                isCeramica = data['TIPO_STORE'] === 'CERAMICA' || data['TIPOSTORE'] === 'CERAMICA';
                abilitaDivisioni = data['DIVISIONI'] === '1';
            }

            const abilitaScelteColori = Array.isArray(data)
                ? data.some(c => (c.chiave === 'SCELTE_COLORI' || c.chiave === 'ABILITA_SCELTE_COLORI') && c.valore === '1')
                : (data['SCELTE_COLORI'] === '1' || data['ABILITA_SCELTE_COLORI'] === '1');

            const newConfig = {
                ...config,
                abilitaDivisioni: abilitaDivisioni,
                isCeramica: isCeramica,
                abilitaScelteColori: abilitaScelteColori
            };
            setConfig(newConfig);
            return newConfig;
        } catch (error) {
            console.error("Errore caricamento configurazione", error);
            return config;
        }
    };

    const loadCombos = async (currentConfig = config) => {
        try {
            // Standard combos
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
            }));

            // Divisioni if enabled
            if (currentConfig.abilitaDivisioni) {
                ArticoliService.getDivisioni().then(res =>
                    setCombos(prev => ({ ...prev, divisioni: res.data?.payload || [] }))
                );
            }

            // Ceramica specific combos
            if (currentConfig.isCeramica) {
                const [formati, scelte, toni, calibri] = await Promise.all([
                    ArticoliService.getFormati(),
                    ArticoliService.getScelte(),
                    ArticoliService.getToni(),
                    ArticoliService.getCalibri()
                ]);

                setCombos(prev => ({
                    ...prev,
                    formati: formati.data?.payload || [],
                    scelte: scelte.data?.payload || [],
                    toni: toni.data?.payload || [],
                    calibri: calibri.data?.payload || []
                }));
            }
        } catch (error) {
            console.error("Errore caricamento combo", error);
        }
    };

    const loadListini = async () => {
        try {
            const ListiniService = (await import('../../services/ListiniService')).default;
            const res = await ListiniService.getAll();
            setAllListini(res.payload || res || []);
        } catch (error) {
            console.error("Errore caricamento listini", error);
        }
    };

    const loadPrezzi = async () => {
        setLoadingPrezzi(true);
        try {
            await loadListini();
            const res = await ArticoliService.getPrezzi(id);
            setPrezzi(res.data?.payload || []);
        } catch (error) {
            console.error("Errore caricamento prezzi", error);
        } finally {
            setLoadingPrezzi(false);
        }
    };

    const loadArticolo = async () => {
        try {
            const res = await ArticoliService.getArticolo(id);
            if (res.data) {
                const rawData = res.data.payload || res.data;
                const sanitizedData = { ...rawData };
                
                // List of fields that are collections on the backend
                const collectionFields = ['tokens', 'prezzi', 'codiciBarre', 'scelteColori', 'tonitaglie'];
                
                // Ensure no null values for controlled inputs, but preserve nulls for collections
                Object.keys(sanitizedData).forEach(key => {
                    if (sanitizedData[key] === null && !collectionFields.includes(key)) {
                        sanitizedData[key] = '';
                    }
                });

                if (sanitizedData.prezzoFornitore !== '') {
                    sanitizedData.prezzoFornitore = parseFloat(sanitizedData.prezzoFornitore).toFixed(2);
                }
                
                setFormData(sanitizedData);
                if (sanitizedData.idCategoria) {
                    loadSottoCategorie(sanitizedData.idCategoria);
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
        setSaving(true);
        let res;
        try {
            // Final sanitization: ensure collection fields are NOT empty strings
            const dataToSave = { ...formData };
            const collectionFields = ['tokens', 'prezzi', 'codiciBarre', 'scelteColori', 'tonitaglie'];
            collectionFields.forEach(field => {
                if (dataToSave[field] === '') {
                    dataToSave[field] = null;
                }
            });

            if (isNew) {
                res = await ArticoliService.createArticolo(dataToSave);
                const newId = res.data?.payload || id; // If backend returns id in payload
                await ArticoliService.savePrezzi(newId, prezzi);
            } else {
                const results = await Promise.all([
                    ArticoliService.updateArticolo(id, dataToSave),
                    ArticoliService.savePrezzi(id, prezzi)
                ]);
                res = results[0]; // The response from updateArticolo
            }

            if (!res.data.errorText) {
                const Swal = (await import('sweetalert2')).default;
                await Swal.fire({
                    title: 'Successo!',
                    text: 'Articolo salvato con successo',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                navigate('/articoli');
            } else {
                const Swal = (await import('sweetalert2')).default;
                Swal.fire({
                    title: 'Errore',
                    text: res.data.errorText || 'Errore durante il salvataggio',
                    icon: 'error'
                });
            }
        } catch (error) {
            console.error("Errore salvataggio", error);
            const Swal = (await import('sweetalert2')).default;
            Swal.fire({
                title: 'Errore',
                text: isNew ? "Errore durante la creazione dell'articolo" : "Errore durante l'aggiornamento dell'articolo",
                icon: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleGenerateCode = async () => {
        try {
            const res = await ArticoliService.getNextCode();
            if (res.data && res.data.codice) {
                setFormData(prev => ({ ...prev, codice: res.data.codice }));
            }
        } catch (error) {
            console.error("Errore generazione codice", error);
        }
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

    const handleCloseFormatiModal = () => {
        ArticoliService.getFormati().then(res => setCombos(prev => ({ ...prev, formati: res.data?.payload || [] })));
    };

    const handleCloseScelteModal = () => {
        ArticoliService.getScelte().then(res => setCombos(prev => ({ ...prev, scelte: res.data?.payload || [] })));
    };

    const handleCloseToniModal = () => {
        ArticoliService.getToni().then(res => setCombos(prev => ({ ...prev, toni: res.data?.payload || [] })));
    };

    const handleCloseCalibriModal = () => {
        ArticoliService.getCalibri().then(res => setCombos(prev => ({ ...prev, calibri: res.data?.payload || [] })));
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
                    <li className={activeTab === 'prices' ? 'active' : ''}>
                        <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('prices'); }}>
                            Prezzi di vendita
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
                                        <option value="A">Articolo</option>
                                        <option value="AM">Articolo con magazzino</option>
                                        {config.abilitaScelteColori && <option value="AMSC">Articolo con scelte/colori</option>}
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
                            <>
                                <div className="row">
                                    <div className="col-xs-12 col-md-3">
                                        <EntitySelectGroup
                                            label="Formato"
                                            isAsync={false}
                                            options={combos.formati.map(f => ({ value: f.id, label: f.descrizione }))}
                                            value={formData.idFormato ? { value: formData.idFormato, label: combos.formati.find(f => f.id === formData.idFormato)?.descrizione || '' } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idFormato: opt ? opt.value : '' }))}
                                            ModalComponent={FormatiArticoloManagementModal}
                                            onModalClose={handleCloseFormatiModal}
                                            title="Gestione formati"
                                        />
                                    </div>
                                    <div className="col-xs-12 col-md-3">
                                        <EntitySelectGroup
                                            label="Scelta"
                                            isAsync={false}
                                            options={combos.scelte.map(s => ({ value: s.id, label: s.descrizione }))}
                                            value={formData.idScelta ? { value: formData.idScelta, label: combos.scelte.find(s => s.id === formData.idScelta)?.descrizione || '' } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idScelta: opt ? opt.value : '' }))}
                                            ModalComponent={ScelteArticoloManagementModal}
                                            onModalClose={handleCloseScelteModal}
                                            title="Gestione scelte"
                                        />
                                    </div>
                                    <div className="col-xs-12 col-md-3">
                                        <EntitySelectGroup
                                            label="Tono"
                                            isAsync={false}
                                            options={combos.toni.map(t => ({ value: t.id, label: t.descrizione }))}
                                            value={formData.idTono ? { value: formData.idTono, label: combos.toni.find(t => t.id === formData.idTono)?.descrizione || '' } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idTono: opt ? opt.value : '' }))}
                                            ModalComponent={ToniArticoloManagementModal}
                                            onModalClose={handleCloseToniModal}
                                            title="Gestione toni"
                                        />
                                    </div>
                                    <div className="col-xs-12 col-md-3">
                                        <EntitySelectGroup
                                            label="Calibro"
                                            isAsync={false}
                                            options={combos.calibri.map(c => ({ value: c.id, label: c.descrizione }))}
                                            value={formData.idCalibro ? { value: formData.idCalibro, label: combos.calibri.find(c => c.id === formData.idCalibro)?.descrizione || '' } : null}
                                            onChange={(opt) => setFormData(prev => ({ ...prev, idCalibro: opt ? opt.value : '' }))}
                                            ModalComponent={CalibriArticoloManagementModal}
                                            onModalClose={handleCloseCalibriModal}
                                            title="Gestione calibri"
                                        />
                                    </div>
                                </div>
                                <div className="row">
                                    <div className="col-xs-12 col-md-3">
                                        <div className="form-group">
                                            <label>MQ/Box</label>
                                            <input type="number" step="0.001" className="form-control" name="mqBox" value={formData.mqBox} onChange={handleChange} placeholder="0.000" />
                                        </div>
                                    </div>
                                    <div className="col-xs-12 col-md-3">
                                        <div className="form-group">
                                            <label>Pezzi/Box</label>
                                            <input type="number" className="form-control" name="pezziBox" value={formData.pezziBox} onChange={handleChange} placeholder="0" />
                                        </div>
                                    </div>
                                </div>
                            </>
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
                                        onBlur={(e) => {
                                            const val = parseFloat(e.target.value);
                                            if (!isNaN(val)) {
                                                setFormData(prev => ({ ...prev, prezzoFornitore: val.toFixed(2) }));
                                            }
                                        }}
                                        placeholder="Inserisci prezzo fornitore"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TAB PREZZI DI VENDITA */}
                    <div className={`tab-pane ${activeTab === 'prices' ? 'active' : ''}`} style={{ display: activeTab === 'prices' ? 'block' : 'none' }}>
                        <div className="row">
                            <div className="col-xs-12">
                                <p className="text-muted" style={{ marginBottom: '20px' }}>
                                    In questa sezione puoi gestire i prezzi manuali per i vari listini. 
                                    I listini con regole automatiche verranno calcolati dinamicamente nei documenti.
                                </p>
                                <div className="table-responsive">
                                    <table className="table table-hover table-premium">
                                        <thead>
                                            <tr>
                                                <th style={{ width: '40%' }}>Listino</th>
                                                <th style={{ width: '30%' }}>Regola</th>
                                                <th style={{ width: '30%' }}>Prezzo Manuale (€)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {allListini.map(listino => {
                                                const currentPrezzo = prezzi.find(p => p.idListino === listino.id);
                                                const isManual = listino.derivationType === 'NONE';
                                                
                                                return (
                                                    <tr key={listino.id} className={!isManual ? 'text-muted' : ''}>
                                                        <td style={{ verticalAlign: 'middle' }}>
                                                            <strong>{listino.descrizione}</strong>
                                                            {listino.flDefault === 1 && <span className="label label-primary" style={{ marginLeft: '10px' }}>Predefinito</span>}
                                                        </td>
                                                        <td style={{ verticalAlign: 'middle' }}>
                                                            {listino.derivationType === 'NONE' ? 'Manuale' : 
                                                             listino.derivationType === 'PERCENTAGE' ? `Ricarico ${listino.derivationValue}%` : 
                                                             `Ricarico fisso €${listino.derivationValue}`}
                                                        </td>
                                                        <td style={{ verticalAlign: 'middle' }}>
                                                            <div className="input-group" style={{ maxWidth: '200px' }}>
                                                                <span className="input-group-addon">€</span>
                                                                <input 
                                                                    type="number" 
                                                                    step="0.01"
                                                                    className="form-control"
                                                                    placeholder="0.00"
                                                                    value={(currentPrezzo?.prezzo !== null && currentPrezzo?.prezzo !== undefined) ? currentPrezzo.prezzo : ''}
                                                                    onChange={(e) => {
                                                                        const val = e.target.value;
                                                                        const newVal = val === '' ? null : parseFloat(val);
                                                                        setPrezzi(prev => {
                                                                            const index = prev.findIndex(p => p.idListino === listino.id);
                                                                            if (index > -1) {
                                                                                const newPrezzi = [...prev];
                                                                                newPrezzi[index] = { ...newPrezzi[index], prezzo: newVal };
                                                                                return newPrezzi;
                                                                            } else {
                                                                                return [...prev, { idListino: listino.id, prezzo: newVal, idProdotto: id }];
                                                                            }
                                                                        });
                                                                    }}
                                                                    disabled={!isManual}
                                                                />
                                                            </div>
                                                            {!isManual && <small className="help-block">Calcolato automaticamente</small>}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                            {allListini.length === 0 && (
                                                <tr>
                                                    <td colSpan="3" className="text-center">Nessun listino configurato</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button type="button" className="btn btn-premium-cancel" onClick={() => navigate('/articoli')} disabled={saving}>Annulla</button>
                    <button type="button" className="btn btn-premium-save" onClick={handleSave} disabled={saving}>
                        {saving ? (
                            <>
                                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ marginRight: '5px' }}></span>
                                Salvataggio...
                            </>
                        ) : (
                            'Salva'
                        )}
                    </button>
                </div>
            </form>

        </div>
    );
};

export default ArticoliDetail;
