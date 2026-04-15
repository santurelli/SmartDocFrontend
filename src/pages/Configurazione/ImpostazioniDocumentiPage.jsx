import React, { useState, useEffect } from 'react';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import { FaSave, FaFileAlt, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import './ConfigurazionePage.css';
import Swal from 'sweetalert2';

const ImpostazioniDocumentiPage = () => {
    const [configs, setConfigs] = useState({
        // Ciclo Attivo
        ABILITA_PREVENTIVI: { chiave: 'ABILITA_PREVENTIVI', valore: '1', dominio: 'DOCUMENTI' },
        ABILITA_CONF_ORDINE: { chiave: 'ABILITA_CONF_ORDINE', valore: '1', dominio: 'DOCUMENTI' },
        ABILITA_DDT: { chiave: 'ABILITA_DDT', valore: '1', dominio: 'DOCUMENTI' },
        ABILITA_FATTURE_PROFORMA: { chiave: 'ABILITA_FATTURE_PROFORMA', valore: '1', dominio: 'DOCUMENTI' },
        ABILITA_FATTURE_ACCOMPAGNATORIE: { chiave: 'ABILITA_FATTURE_ACCOMPAGNATORIE', valore: '1', dominio: 'DOCUMENTI' },
        ABILITA_FATTURE: { chiave: 'ABILITA_FATTURE', valore: '1', dominio: 'DOCUMENTI' },
        ABILITA_NOTE_DEBITO: { chiave: 'ABILITA_NOTE_DEBITO', valore: '1', dominio: 'DOCUMENTI' },
        ABILITA_NOTE_CREDITO: { chiave: 'ABILITA_NOTE_CREDITO', valore: '1', dominio: 'DOCUMENTI' },
        ABILITA_FATTURE_SEMPLIFICATE: { chiave: 'ABILITA_FATTURE_SEMPLIFICATE', valore: '0', dominio: 'DOCUMENTI' },
        // Ciclo Passivo
        ABILITA_FATTURE_FORNITORE: { chiave: 'ABILITA_FATTURE_FORNITORE', valore: '1', dominio: 'DOCUMENTI' },
        ABILITA_NOTE_CREDITO_FORNITORE: { chiave: 'ABILITA_NOTE_CREDITO_FORNITORE', valore: '1', dominio: 'DOCUMENTI' }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const response = await ConfigurazioneService.getByDomain('DOCUMENTI');
            if (response.data) {
                setConfigs(prev => {
                    const newConfigs = { ...prev };
                    Object.keys(response.data).forEach(key => {
                        if (newConfigs[key]) {
                            newConfigs[key] = { ...newConfigs[key], valore: response.data[key] };
                        }
                    });
                    return newConfigs;
                });
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
            const promises = Object.values(configs).map(config => ConfigurazioneService.save(config));
            await Promise.all(promises);

            // Dispatch global event to notify other components (like Sidebar)
            window.dispatchEvent(new Event('configupdated'));

            Swal.fire({
                title: 'Successo!',
                text: 'Impostazioni documenti salvate correttamente.',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error("Error saving configurations:", err);
            Swal.fire('Errore', 'Errore nel salvataggio delle impostazioni.', 'error');
        }
    };

    const renderToggle = (chiave, label) => {
        const isEnabled = configs[chiave].valore === '1';
        return (
            <div className="col-md-4 mb-3">
                <div
                    className={`document-config-card ${isEnabled ? 'info-active' : ''}`}
                    onClick={() => handleChange(chiave, isEnabled ? '0' : '1')}
                >
                    <input
                        type="checkbox"
                        className="config-checkbox"
                        checked={isEnabled}
                        readOnly
                    />
                    <span className="config-label">{label}</span>
                </div>
            </div>
        );
    };

    if (loading) return <div className="config-page-container">Caricamento impostazioni...</div>;

    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaFileAlt style={{ marginRight: '10px' }} />Configurazione Documenti</h2>
            </div>

            <div className="tab-content-wrapper" style={{ border: 'none', padding: '0' }}>
                <div className="dati-azienda-container" style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                    <div className="config-section mb-5">
                        <h4 className="section-subtitle">Ciclo Attivo</h4>
                        <p className="section-description">Abilita o disabilita la visualizzazione e la generazione dei documenti di vendita.</p>
                        <div className="row g-4 mt-2">
                            {renderToggle('ABILITA_PREVENTIVI', 'Preventivi')}
                            {renderToggle('ABILITA_CONF_ORDINE', "Conferme d'Ordine")}
                            {renderToggle('ABILITA_DDT', 'Documenti di Trasporto (DDT)')}
                            {renderToggle('ABILITA_FATTURE_PROFORMA', 'Fatture Proforma')}
                            {renderToggle('ABILITA_FATTURE_ACCOMPAGNATORIE', 'Fatture Accompagnatorie')}
                            {renderToggle('ABILITA_FATTURE', 'Fatture')}
                            {renderToggle('ABILITA_NOTE_DEBITO', 'Note di Debito')}
                            {renderToggle('ABILITA_NOTE_CREDITO', 'Note di Credito')}
                            {renderToggle('ABILITA_FATTURE_SEMPLIFICATE', 'Fatture Semplificate (TD07)')}
                        </div>
                    </div>

                    <div className="config-section">
                        <h4 className="section-subtitle">Ciclo Passivo</h4>
                        <p className="section-description">Abilita o disabilita i documenti relativi agli acquisti dai fornitori.</p>
                        <div className="row g-4 mt-2">
                            {renderToggle('ABILITA_FATTURE_FORNITORE', 'Fatture Fornitore')}
                            {renderToggle('ABILITA_NOTE_CREDITO_FORNITORE', 'Note di Credito Fornitore')}
                        </div>
                    </div>

                    <div className="form-actions mt-5 pt-3" style={{ borderTop: '1px solid #eee' }}>
                        <button type="button" className="btn btn-success" onClick={handleSave}>
                            <FaSave /> Salva Modifiche
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImpostazioniDocumentiPage;
