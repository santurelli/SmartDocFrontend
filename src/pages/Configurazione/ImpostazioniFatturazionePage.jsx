import React, { useState, useEffect } from 'react';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import { FaSave, FaFileInvoiceDollar } from 'react-icons/fa';
import './ConfigurazionePage.css';
import Swal from 'sweetalert2';

const ImpostazioniFatturazionePage = () => {
    const [configs, setConfigs] = useState({
        EMETTI_RITENUTA: { chiave: 'EMETTI_RITENUTA', valore: '0', dominio: 'FATTURAZIONE' },
        TIPO_RITENUTA: { chiave: 'TIPO_RITENUTA', valore: 'RT01', dominio: 'FATTURAZIONE' },
        PERC_RITENUTA: { chiave: 'PERC_RITENUTA', valore: '20.00', dominio: 'FATTURAZIONE' }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfigs();
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
                    PERC_RITENUTA: { chiave: 'PERC_RITENUTA', valore: response.data.PERC_RITENUTA || '20.00', dominio: 'FATTURAZIONE' }
                }));
            }
        } catch (err) {
            console.error("Error fetching configurations:", err);
            Swal.fire('Errore', 'Si è verificato un errore nel caricamento delle configurazioni.', 'error');
        } finally {
            setLoading(false);
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
                        </div>
                    )}

                    <div className="form-actions mt-4">
                        <button type="button" className="btn btn-success" onClick={handleSave}>
                            <FaSave /> Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default ImpostazioniFatturazionePage;
