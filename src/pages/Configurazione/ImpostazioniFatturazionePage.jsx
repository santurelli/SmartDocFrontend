import React, { useState, useEffect } from 'react';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import AliquoteIvaService from '../../services/AliquoteIvaService';
import { FaSave, FaFileInvoiceDollar, FaWrench } from 'react-icons/fa';
import './ConfigurazionePage.css';
import Swal from 'sweetalert2';
import AliquoteIvaManagementModal from '../../components/modals/AliquoteIvaManagementModal';

const ImpostazioniFatturazionePage = () => {
    const [configs, setConfigs] = useState({
        EMETTI_RITENUTA: { chiave: 'EMETTI_RITENUTA', valore: '0', dominio: 'FATTURAZIONE' },
        TIPO_RITENUTA: { chiave: 'TIPO_RITENUTA', valore: 'RT01', dominio: 'FATTURAZIONE' },
        PERC_RITENUTA: { chiave: 'PERC_RITENUTA', valore: '20.00', dominio: 'FATTURAZIONE' },
        EMETTI_RIVALSA_INPS: { chiave: 'EMETTI_RIVALSA_INPS', valore: '0', dominio: 'FATTURAZIONE' },
        PERC_RIVALSA_INPS: { chiave: 'PERC_RIVALSA_INPS', valore: '4.00', dominio: 'FATTURAZIONE' },
        TIPO_CASSA_INPS: { chiave: 'TIPO_CASSA_INPS', valore: 'TC22', dominio: 'FATTURAZIONE' },
        DEFAULT_TIPO_FATTURA: { chiave: 'DEFAULT_TIPO_FATTURA', valore: 'FATTURA', dominio: 'FATTURAZIONE' },
        DICITURA_RITENUTA: { chiave: 'DICITURA_RITENUTA', valore: 'Soggetto a ritenuta d\'acconto ai sensi del DPR 600/73', dominio: 'FATTURAZIONE' },
        DICITURA_RIVALSA: { chiave: 'DICITURA_RIVALSA', valore: 'Contributo previdenziale 4% ex art. 2 comma 26 Legge 335/95', dominio: 'FATTURAZIONE' },
        PERC_IMPONIBILE_RIVALSA: { chiave: 'PERC_IMPONIBILE_RIVALSA', valore: '100.00', dominio: 'FATTURAZIONE' },
        ID_ALIQUOTA_IVA_RIVALSA: { chiave: 'ID_ALIQUOTA_IVA_RIVALSA', valore: '0', dominio: 'FATTURAZIONE' }
    });
    const [aliquoteIva, setAliquoteIva] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showIvaModal, setShowIvaModal] = useState(false);

    useEffect(() => {
        fetchConfigs();
        fetchAliquoteIva();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const response = await ConfigurazioneService.getByDomain('FATTURAZIONE');
            if (response.data) {
                setConfigs(prev => ({
                    ...prev,
                    ...response.data,
                    // Ensure the properties exists as object if returned as simple values map by ByDomain endpoint
                    EMETTI_RITENUTA: { chiave: 'EMETTI_RITENUTA', valore: response.data.EMETTI_RITENUTA || '0', dominio: 'FATTURAZIONE' },
                    TIPO_RITENUTA: { chiave: 'TIPO_RITENUTA', valore: response.data.TIPO_RITENUTA || 'RT01', dominio: 'FATTURAZIONE' },
                    PERC_RITENUTA: { chiave: 'PERC_RITENUTA', valore: response.data.PERC_RITENUTA || '20.00', dominio: 'FATTURAZIONE' },
                    EMETTI_RIVALSA_INPS: { chiave: 'EMETTI_RIVALSA_INPS', valore: response.data.EMETTI_RIVALSA_INPS || '0', dominio: 'FATTURAZIONE' },
                    PERC_RIVALSA_INPS: { chiave: 'PERC_RIVALSA_INPS', valore: response.data.PERC_RIVALSA_INPS || '4.00', dominio: 'FATTURAZIONE' },
                    TIPO_CASSA_INPS: { chiave: 'TIPO_CASSA_INPS', valore: response.data.TIPO_CASSA_INPS || 'TC22', dominio: 'FATTURAZIONE' },
                    DEFAULT_TIPO_FATTURA: { chiave: 'DEFAULT_TIPO_FATTURA', valore: response.data.DEFAULT_TIPO_FATTURA || 'FATTURA', dominio: 'FATTURAZIONE' },
                    DICITURA_RITENUTA: { chiave: 'DICITURA_RITENUTA', valore: response.data.DICITURA_RITENUTA || 'Soggetto a ritenuta d\'acconto ai sensi del DPR 600/73', dominio: 'FATTURAZIONE' },
                    DICITURA_RIVALSA: { chiave: 'DICITURA_RIVALSA', valore: response.data.DICITURA_RIVALSA || 'Contributo previdenziale 4% ex art. 2 comma 26 Legge 335/95', dominio: 'FATTURAZIONE' },
                    PERC_IMPONIBILE_RIVALSA: { chiave: 'PERC_IMPONIBILE_RIVALSA', valore: response.data.PERC_IMPONIBILE_RIVALSA || '100.00', dominio: 'FATTURAZIONE' },
                    ID_ALIQUOTA_IVA_RIVALSA: { chiave: 'ID_ALIQUOTA_IVA_RIVALSA', valore: response.data.ID_ALIQUOTA_IVA_RIVALSA || '0', dominio: 'FATTURAZIONE' }
                }));
            }
        } catch (err) {
            console.error("Error fetching configurations:", err);
            Swal.fire('Errore', 'Si è verificato un errore nel caricamento delle configurazioni.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchAliquoteIva = async () => {
        try {
            const res = await AliquoteIvaService.getListForCombo();
            if (res.data && res.data.payload) {
                setAliquoteIva(res.data.payload);
            } else if (Array.isArray(res.data)) {
                setAliquoteIva(res.data);
            }
        } catch (error) {
            console.error("Error fetching VAT rates:", error);
        }
    };

    const handleChange = (chiave, valore) => {
        setConfigs(prev => ({
            ...prev,
            [chiave]: { ...prev[chiave], valore: valore }
        }));
    };

    const handleSave = async () => {
        try {
            // Save each configuration independently since there is no batch save
            await ConfigurazioneService.save(configs.EMETTI_RITENUTA);
            await ConfigurazioneService.save(configs.TIPO_RITENUTA);
            await ConfigurazioneService.save(configs.PERC_RITENUTA);
            await ConfigurazioneService.save(configs.EMETTI_RIVALSA_INPS);
            await ConfigurazioneService.save(configs.PERC_RIVALSA_INPS);
            await ConfigurazioneService.save(configs.TIPO_CASSA_INPS);
            await ConfigurazioneService.save(configs.DEFAULT_TIPO_FATTURA);
            await ConfigurazioneService.save(configs.DICITURA_RITENUTA);
            await ConfigurazioneService.save(configs.DICITURA_RIVALSA);
            await ConfigurazioneService.save(configs.PERC_IMPONIBILE_RIVALSA);
            await ConfigurazioneService.save(configs.ID_ALIQUOTA_IVA_RIVALSA);

            Swal.fire({
                title: 'Successo!',
                text: 'Impostazioni di fatturazione salvate correttamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Error saving configurations:", err);
            Swal.fire('Errore', 'Errore nel salvataggio delle impostazioni.', 'error');
        }
    };

    if (loading) return <div className="config-page-container">Caricamento impostazioni...</div>;

    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaFileInvoiceDollar style={{ marginRight: '10px' }} />Configurazione Fatturazione</h2>
            </div>

            <div className="tab-content-wrapper" style={{ border: 'none', padding: '0' }}>
                <div className="dati-azienda-container" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <div className="section-title">
                        <FaFileInvoiceDollar /> Ritenuta d'Acconto
                    </div>

                    <div className="row mt-4">
                        <div className="col-md-12 form-group">
                            <div className="checkbox-nice" style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    id="emetti_ritenuta"
                                    checked={configs.EMETTI_RITENUTA.valore === '1'}
                                    onChange={(e) => handleChange('EMETTI_RITENUTA', e.target.checked ? '1' : '0')}
                                    style={{ margin: 0 }}
                                />
                                <label htmlFor="emetti_ritenuta" style={{ fontWeight: 'normal', margin: 0, paddingLeft: '8px' }}>
                                    Emetti ritenuta d'acconto di default nei nuovi documenti
                                </label>
                            </div>
                        </div>
                    </div>

                    {configs.EMETTI_RITENUTA.valore === '1' && (
                        <div className="row mt-3">
                            <div className="col-md-6 form-group">
                                <label>Tipo Ritenuta Predefinito</label>
                                <select
                                    className="form-control"
                                    value={configs.TIPO_RITENUTA.valore}
                                    onChange={(e) => handleChange('TIPO_RITENUTA', e.target.value)}
                                >
                                    <option value="RT01">RT01 - Ritenuta persone fisiche</option>
                                    <option value="RT02">RT02 - Ritenuta persone giuridiche</option>
                                    <option value="RT03">RT03 - Contributo INPS</option>
                                    <option value="RT04">RT04 - Contributo ENASARCO</option>
                                    <option value="RT05">RT05 - Contributo ENPAM</option>
                                    <option value="RT06">RT06 - Altro contributo previdenziale</option>
                                </select>
                            </div>
                            <div className="col-md-2 form-group">
                                <label>Percentuale (%)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={configs.PERC_RITENUTA.valore}
                                    onChange={(e) => handleChange('PERC_RITENUTA', e.target.value)}
                                    min="0" max="100" step="0.01"
                                />
                            </div>
                            <div className="col-md-12 form-group mt-2">
                                <label>Dicitura Legge Ritenuta (automatica in nota)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={configs.DICITURA_RITENUTA.valore}
                                    onChange={(e) => handleChange('DICITURA_RITENUTA', e.target.value)}
                                    placeholder="Es. Soggetto a ritenuta..."
                                />
                            </div>
                        </div>
                    )}

                    <div className="section-title mt-5">
                        <FaFileInvoiceDollar /> Rivalsa INPS / Cassa Previdenziale
                    </div>

                    <div className="row mt-4">
                        <div className="col-md-12 form-group">
                            <div className="checkbox-nice" style={{ display: 'flex', alignItems: 'center' }}>
                                <input
                                    type="checkbox"
                                    id="emetti_rivalsa"
                                    checked={configs.EMETTI_RIVALSA_INPS.valore === '1'}
                                    onChange={(e) => handleChange('EMETTI_RIVALSA_INPS', e.target.checked ? '1' : '0')}
                                    style={{ margin: 0 }}
                                />
                                <label htmlFor="emetti_rivalsa" style={{ fontWeight: 'normal', margin: 0, paddingLeft: '8px' }}>
                                    Applica rivalsa INPS / Cassa previdenziale di default nei nuovi documenti
                                </label>
                            </div>
                        </div>
                    </div>

                    {configs.EMETTI_RIVALSA_INPS.valore === '1' && (
                        <div className="row mt-3">
                            <div className="col-md-6 form-group">
                                <label>Tipo Cassa Previdenziale</label>
                                <select
                                    className="form-control"
                                    value={configs.TIPO_CASSA_INPS.valore}
                                    onChange={(e) => handleChange('TIPO_CASSA_INPS', e.target.value)}
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
                            <div className="col-md-2 form-group">
                                <label>Percentuale (%)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={configs.PERC_RIVALSA_INPS.valore}
                                    onChange={(e) => handleChange('PERC_RIVALSA_INPS', e.target.value)}
                                    min="0" max="100" step="0.01"
                                />
                            </div>
                            <div className="col-md-2 form-group">
                                <label>Perc. Imponibile (%)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={configs.PERC_IMPONIBILE_RIVALSA.valore}
                                    onChange={(e) => handleChange('PERC_IMPONIBILE_RIVALSA', e.target.value)}
                                    min="0" max="100" step="0.01"
                                />
                            </div>
                            <div className="col-md-2 form-group">
                                <label>Aliquota IVA</label>
                                <div className="flex-input-group">
                                    <select
                                        className="form-control"
                                        value={configs.ID_ALIQUOTA_IVA_RIVALSA.valore}
                                        onChange={(e) => handleChange('ID_ALIQUOTA_IVA_RIVALSA', e.target.value)}
                                    >
                                        <option value="0">Auto (1° riga)</option>
                                        {aliquoteIva.map(a => (
                                            <option key={a.id} value={a.id}>{a.codice} - {a.descrizione}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        className="premium-wrench-btn"
                                        onClick={() => setShowIvaModal(true)}
                                        title="Gestione Aliquote IVA"
                                    >
                                        <FaWrench />
                                    </button>
                                </div>
                            </div>
                            <div className="col-md-12 form-group mt-2">
                                <label>Dicitura Legge Rivalsa (automatica in nota)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={configs.DICITURA_RIVALSA.valore}
                                    onChange={(e) => handleChange('DICITURA_RIVALSA', e.target.value)}
                                    placeholder="Es. Contributo previdenziale..."
                                />
                            </div>
                        </div>
                    )}

                    <div className="section-title mt-5">
                        <FaFileInvoiceDollar /> Tipi Documento
                    </div>

                    <div className="row mt-4">
                        <div className="col-md-6 form-group">
                            <label>Tipo fattura predefinito (da altri documenti)</label>
                            <select
                                className="form-control"
                                value={configs.DEFAULT_TIPO_FATTURA.valore}
                                onChange={(e) => handleChange('DEFAULT_TIPO_FATTURA', e.target.value)}
                            >
                                <option value="FATTURA">Fattura</option>
                                <option value="FATTURA_ACCOMPAGNATORIA">Fattura Accompagnatoria</option>
                                <option value="FATTURA_PROFORMA">Fattura Pro Forma</option>
                                <option value="NOTA_DEBITO">Nota di Debito</option>
                                <option value="FATTURA_SEMPLIFICATA">Fattura Semplificata (TD07)</option>
                            </select>
                            <p className="help-block" style={{ fontSize: '12px', color: '#777', marginTop: '5px' }}>
                                Definisce il tipo di fattura che viene proposto automaticamente quando generi una fattura da un Preventivo, DDT o Conferma d'Ordine.
                            </p>
                        </div>
                    </div>

                    <div className="form-actions mt-5">
                        <button type="button" className="btn btn-success" onClick={handleSave}>
                            <FaSave /> Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>

            <AliquoteIvaManagementModal 
                isOpen={showIvaModal}
                onClose={() => setShowIvaModal(false)}
                onSave={() => fetchAliquoteIva()}
            />
        </div>
    );

};

export default ImpostazioniFatturazionePage;
