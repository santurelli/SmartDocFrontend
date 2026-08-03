import React, { useState, useEffect } from 'react';
import DatiAziendaService from '../../services/DatiAziendaService';
import authService from '../../services/authService';
import CommercialistaSection from '../../components/CommercialistaSection';
import { FaSave, FaBuilding, FaTrash } from 'react-icons/fa';
import './DatiAziendaForm.css';

const DatiAziendaForm = () => {
    const [formData, setFormData] = useState({
        denominazione: '',
        idRegimeFiscale: '',
        codiceFiscale: '',
        partitaIva: '',
        indirizzo: '',
        citta: '',
        cap: '',
        provincia: '',
        telefono: '',
        fax: '',
        email: '',
        pec: '',
        sitoWeb: '',
        logoType: '',
        logo: '',
        deleteLogo: false
    });

    const [regimiFiscali, setRegimiFiscali] = useState([]);
    const [logoFile, setLogoFile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [fetchedTipoAccount, setFetchedTipoAccount] = useState(null);
    const [fetchedFlProva, setFetchedFlProva] = useState(1);
    const [fetchedTipoRinnovo, setFetchedTipoRinnovo] = useState('ANNUAL');
    const [giorniRimanenti, setGiorniRimanenti] = useState(90);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await DatiAziendaService.get();
            const payload = response.data;

            if (payload.tipoAccount !== undefined) {
                setFetchedTipoAccount(payload.tipoAccount);
                const cfg = authService.getConfig ? authService.getConfig() : {};
                if (authService.updateConfig) {
                    authService.updateConfig({ ...cfg, tipoAccount: payload.tipoAccount, tipo_account: payload.tipoAccount });
                    window.dispatchEvent(new Event('configupdated'));
                }
            }

            if (payload.flProva !== undefined) {
                setFetchedFlProva(payload.flProva);
            }

            if (payload.tipoRinnovo !== undefined) {
                setFetchedTipoRinnovo(payload.tipoRinnovo);
            }

            if (payload.giorniRimanentiProva !== undefined) {
                setGiorniRimanenti(payload.giorniRimanentiProva);
            }

            if (payload.REGIMIFISCALI) {
                setRegimiFiscali(payload.REGIMIFISCALI);
            }

            if (payload.DATIAZIENDA) {
                setFormData(prev => ({
                    ...prev,
                    ...payload.DATIAZIENDA,
                    // Ensure controlled inputs don't get null
                    denominazione: payload.DATIAZIENDA.denominazione || '',
                    codiceFiscale: payload.DATIAZIENDA.codiceFiscale || '',
                    partitaIva: payload.DATIAZIENDA.partitaIva || '',
                    indirizzo: payload.DATIAZIENDA.indirizzo || '',
                    citta: payload.DATIAZIENDA.citta || '',
                    cap: payload.DATIAZIENDA.cap || '',
                    provincia: payload.DATIAZIENDA.provincia || '',
                    telefono: payload.DATIAZIENDA.telefono || '',
                    fax: payload.DATIAZIENDA.fax || '',
                    email: payload.DATIAZIENDA.email || '',
                    pec: payload.DATIAZIENDA.pec || '',
                    sitoWeb: payload.DATIAZIENDA.sitoWeb || '',
                    deleteLogo: false
                }));
            }
        } catch (error) {
            console.error("Error fetching company data:", error);
            setMessage({ text: 'Errore nel caricamento dei dati.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setLogoFile(e.target.files[0]);
            // Preview logic if needed
        }
    };

    const handleDeleteLogo = () => {
        if (window.confirm("Sei sicuro di voler eliminare il logo?")) {
            setFormData(prev => ({ ...prev, logo: null, deleteLogo: true }));
            setLogoFile(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: '', type: '' });

        if (!formData.denominazione || !formData.idRegimeFiscale) {
            setMessage({ text: 'Denominazione e Regime Fiscale sono obbligatori.', type: 'error' });
            return;
        }

        const data = new FormData();
        // Append all text fields
        Object.keys(formData).forEach(key => {
            if (key !== 'logo' && key !== 'byteLogo' && key !== 'deleteLogo' && formData[key] !== null) {
                data.append(key, formData[key]);
            }
        });

        // Handle deletion flag
        data.append('deleteLogo', formData.deleteLogo);

        // Append file if selected
        if (logoFile) {
            data.append('file', logoFile);
        }

        try {
            await DatiAziendaService.save(data);
            setMessage({ text: 'Dati salvati con successo!', type: 'success' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
            // Refresh data to show new logo if uploaded
            fetchData();
        } catch (error) {
            console.error("Error saving data:", error);
            setMessage({ text: 'Errore nel salvataggio dei dati.', type: 'error' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (loading) return <div>Caricamento dati azienda...</div>;

    const appConfig = authService.getConfig ? authService.getConfig() : {};
    const currentUser = authService.getCurrentUser ? authService.getCurrentUser() : {};
    const tipoAccount = fetchedTipoAccount || appConfig.tipoAccount || appConfig.tipo_account || currentUser.tipoAccount || 1;

    const getPlanBadge = (tipo) => {
        if (tipo === 5) return { name: 'Studio Contabile Partner', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
        if (tipo === 4) return { name: 'Enterprise', color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' };
        if (tipo === 3) return { name: 'Professional', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' };
        return { name: 'Smart', color: '#f59e0b', bg: '#fffbe6', border: '#fde68a' };
    };

    const currentPlanInfo = getPlanBadge(tipoAccount);

    const stripeLinks = {
        smart: 'https://buy.stripe.com/test_5kQdR904pbRyall1tl2Nq02',
        pro: 'https://buy.stripe.com/test_3cI3cv7wRg7Obpp8VN2Nq01',
        enterprise: 'https://buy.stripe.com/test_bJecN5g3ndZGfFF4Fx2Nq00'
    };

    const getValidEmail = (...emails) => {
        for (const e of emails) {
            if (e && typeof e === 'string' && e.includes('@')) {
                return e.trim();
            }
        }
        return '';
    };

    const userEmail = getValidEmail(currentUser.email, formData.email, appConfig.sub, appConfig.email);

    const getStripeUrl = (baseUrl) => {
        if (!userEmail) return baseUrl;
        return `${baseUrl}?prefilled_email=${encodeURIComponent(userEmail)}`;
    };

    return (
        <div className="dati-azienda-container">
            {/* BOX ABBONAMENTO E PIANO ATTIVO */}
            <div style={{
                background: '#ffffff',
                border: `2px solid ${currentPlanInfo.border}`,
                borderRadius: '16px',
                padding: '24px',
                marginBottom: '30px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.04)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', color: '#64748b', tracking: '1px', marginBottom: '4px' }}>
                            IL TUO ACCREDITO SMARTDOC
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a' }}>
                                Piano Attivo: <span style={{ color: currentPlanInfo.color }}>{currentPlanInfo.name}</span>
                            </span>
                            {tipoAccount === 5 ? (
                                <span style={{
                                    background: '#d1fae5',
                                    color: '#047857',
                                    border: '1px solid #6ee7b7',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    textTransform: 'uppercase'
                                }}>
                                    💼 100% GRATUITO PER SEMPRE (STUDIO PARTNER)
                                </span>
                            ) : fetchedFlProva === 1 ? (
                                <span style={{
                                    background: '#fffbe6',
                                    color: '#d97706',
                                    border: '1px solid #fde68a',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    textTransform: 'uppercase'
                                }}>
                                    🎁 Prova Gratuita ({giorniRimanenti} giorni rimanenti)
                                </span>
                            ) : (
                                <span style={{
                                    background: '#ecfdf5',
                                    color: '#059669',
                                    border: '1px solid #a7f3d0',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    textTransform: 'uppercase'
                                }}>
                                    ✓ Abbonamento {fetchedTipoRinnovo === 'MONTHLY' ? 'Mensile' : 'Annuale'} Pagato (Stripe)
                                </span>
                            )}
                        </div>
                    </div>

                    {tipoAccount < 5 && (
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {tipoAccount < 3 && (
                                <a 
                                    href={getStripeUrl(stripeLinks.pro)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn btn-primary"
                                    style={{ fontWeight: '700', borderRadius: '10px', padding: '10px 18px', background: '#3b82f6', borderColor: '#3b82f6' }}
                                >
                                    ⚡ Passa a Professional (€58,80/anno)
                                </a>
                            )}
                            {tipoAccount < 4 && (
                                <a 
                                    href={getStripeUrl(stripeLinks.enterprise)} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="btn btn-success"
                                    style={{ fontWeight: '700', borderRadius: '10px', padding: '10px 18px', background: '#10b981', borderColor: '#10b981' }}
                                >
                                    🚀 Passa a Enterprise (€118,80/anno)
                                </a>
                            )}
                            {tipoAccount === 4 && (
                                <span style={{ fontSize: '13px', fontWeight: '700', color: '#10b981' }}>
                                    ✓ Disponi già del piano completo Enterprise
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type === 'error' ? 'danger' : 'success'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="section-title">
                    <FaBuilding /> Informazioni Generali
                </div>

                <div className="row">
                    <div className="col-md-6 form-group">
                        <label>Denominazione <span className="text-danger">*</span></label>
                        <input
                            type="text"
                            name="denominazione"
                            className="form-control"
                            value={formData.denominazione}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 form-group">
                        <label>Regime Fiscale <span className="text-danger">*</span></label>
                        <select
                            name="idRegimeFiscale"
                            className="form-control"
                            value={formData.idRegimeFiscale || ''}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Seleziona...</option>
                            {regimiFiscali.map(rf => (
                                <option key={rf.id} value={rf.id}>{rf.descrizione}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-3 form-group">
                        <label>Codice Fiscale</label>
                        <input type="text" name="codiceFiscale" className="form-control" value={formData.codiceFiscale} onChange={handleChange} />
                    </div>
                    <div className="col-md-3 form-group">
                        <label>Partita IVA</label>
                        <input type="text" name="partitaIva" className="form-control" value={formData.partitaIva} onChange={handleChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 form-group">
                        <label>Indirizzo</label>
                        <input type="text" name="indirizzo" className="form-control" value={formData.indirizzo} onChange={handleChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4 form-group">
                        <label>Città</label>
                        <input type="text" name="citta" className="form-control" value={formData.citta} onChange={handleChange} />
                    </div>
                    <div className="col-md-1 form-group">
                        <label>CAP</label>
                        <input type="text" name="cap" className="form-control" value={formData.cap} onChange={handleChange} maxLength="6" />
                    </div>
                    <div className="col-md-1 form-group">
                        <label>Prov.</label>
                        <input type="text" name="provincia" className="form-control" value={formData.provincia} onChange={handleChange} maxLength="2" />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-3 form-group">
                        <label>Telefono</label>
                        <input type="text" name="telefono" className="form-control" value={formData.telefono} onChange={handleChange} />
                    </div>
                    <div className="col-md-3 form-group">
                        <label>Fax</label>
                        <input type="text" name="fax" className="form-control" value={formData.fax} onChange={handleChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4 form-group">
                        <label>Email</label>
                        <input type="email" name="email" className="form-control" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="col-md-4 form-group">
                        <label>PEC</label>
                        <input type="email" name="pec" className="form-control" value={formData.pec} onChange={handleChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-4 form-group">
                        <label>Sito Web</label>
                        <input type="text" name="sitoWeb" className="form-control" value={formData.sitoWeb} onChange={handleChange} />
                    </div>
                </div>

                <div className="section-title" style={{ marginTop: '2rem' }}>
                    Logo Azienda
                </div>

                <div className="row">
                    <div className="col-md-12">
                        {formData.logo && !formData.deleteLogo ? (
                            <div className="logo-preview-container">
                                <img
                                    src={`data:image/${formData.logoType};base64,${formData.logo}`}
                                    alt="Logo Azienda"
                                    className="img-thumbnail"
                                    style={{ maxHeight: '150px' }}
                                />
                                <button type="button" className="btn btn-danger btn-sm ml-2" onClick={handleDeleteLogo}>
                                    <FaTrash /> Elimina Logo
                                </button>
                            </div>
                        ) : (
                            <div className="form-group">
                                <label>Carica Logo</label>
                                <input type="file" className="form-control-file" onChange={handleFileChange} accept="image/*" />
                            </div>
                        )}
                    </div>
                </div>

                <div className="form-actions mt-4">
                    <button type="submit" className="btn btn-success"><FaSave /> Salva Modifiche</button>
                    <button type="button" className="btn btn-secondary ml-2" onClick={() => window.location.reload()}>Annulla</button>
                </div>
            </form>

            <CommercialistaSection />
        </div>
    );
};

export default DatiAziendaForm;
