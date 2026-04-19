import React, { useState, useEffect } from 'react';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import { FaSave, FaCogs, FaHome } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './ConfigurazionePage.css';
const DatiGeneraliPage = () => {
    const [configs, setConfigs] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            // Recuperiamo tutte le config per mappare i valori
            const res = await ConfigurazioneService.getAll();
            const data = res.data || res || [];
            
            // Creiamo un oggetto chiave -> valore per facile accesso
            const configMap = {};
            data.forEach(c => {
                configMap[`${c.dominio}:${c.chiave}`] = c.valore;
            });
            setConfigs(configMap);
        } catch (error) {
            console.error("Errore caricamento configurazioni", error);
            Swal.fire('Errore', 'Impossibile caricare le impostazioni', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (domain, key) => {
        const fullKey = `${domain}:${key}`;
        const currentValue = configs[fullKey];
        const newValue = currentValue === '1' ? '0' : '1';
        
        setConfigs({
            ...configs,
            [fullKey]: newValue
        });
    };

    const handleChange = (domain, key, value) => {
        const fullKey = `${domain}:${key}`;
        setConfigs({
            ...configs,
            [fullKey]: value
        });
    };

    const handleSave = async () => {
        try {
            // Salviamo solo le chiavi che ci interessano in questa pagina
            const keysToSave = [
                { d: 'GLOBAL', k: 'AGENTI' },
                { d: 'GLOBAL', k: 'DIVISIONI' },
                { d: 'GLOBAL', k: 'PROGETTI' },
                { d: 'GLOBAL', k: 'DIPENDENTI' },
                { d: 'GLOBAL', k: 'TIPO_STORE' },
                { d: 'GLOBAL', k: 'UNITAMISURA_ABILITA' },
                { d: 'GLOBAL', k: 'ANNOTAZIONI_ESTESE' },
                { d: 'ARTICOLI', k: 'TIPOPRODOTTO_ABILITA' },
                { d: 'ARTICOLI', k: 'CODICE_ABILITA' },
                { d: 'ARTICOLI', k: 'PREZZI_IVATI' },
                { d: 'CLIENTI', k: 'ABILITA_DATICOMMERCIALI' }
            ];

            for (const item of keysToSave) {
                const val = configs[`${item.d}:${item.k}`];
                if (val !== undefined) {
                    await ConfigurazioneService.save({
                        dominio: item.d,
                        chiave: item.k,
                        valore: val
                    });
                }
            }

            Swal.fire({
                title: 'Salvato',
                text: 'Impostazioni aggiornate con successo',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            // Emettiamo un evento per aggiornare la sidebar se necessario
            window.dispatchEvent(new CustomEvent('configupdated'));
            
        } catch (error) {
            console.error("Errore salvataggio", error);
            Swal.fire('Errore', 'Impossibile salvare alcune impostazioni', 'error');
        }
    };

    if (loading) return <div className="p-5 text-center">Caricamento...</div>;

    const getValue = (d, k, def = '0') => configs[`${d}:${k}`] || def;

    return (
        <div className="container-fluid page-content config-page-container">
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li>Configurazione</li>
                <li className="active">Dati Generali</li>
            </ul>

            <div className="config-header">
                <h2><FaCogs style={{ marginRight: '10px' }} />Dati Generali</h2>
                <button className="btn btn-primary premium-btn" onClick={handleSave}>
                    <FaSave className="mr-2" /> Salva Impostazioni
                </button>
            </div>

            <div className="config-section mb-4">
                <h3 className="section-subtitle">Generale</h3>
                <p className="section-description">Abilita o disabilita le funzionalità principali del sistema.</p>
                
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'AGENTI')}>
                            <input 
                                type="checkbox" 
                                className="config-checkbox" 
                                checked={getValue('GLOBAL', 'AGENTI') === '1'} 
                                readOnly 
                            />
                            <span className="config-label">Gestione Agenti</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'DIVISIONI')}>
                            <input 
                                type="checkbox" 
                                className="config-checkbox" 
                                checked={getValue('GLOBAL', 'DIVISIONI') === '1'} 
                                readOnly 
                            />
                            <span className="config-label">Gestione Divisioni</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'PROGETTI')}>
                            <input 
                                type="checkbox" 
                                className="config-checkbox" 
                                checked={getValue('GLOBAL', 'PROGETTI') === '1'} 
                                readOnly 
                            />
                            <span className="config-label">Gestione Progetti</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'DIPENDENTI')}>
                            <input 
                                type="checkbox" 
                                className="config-checkbox" 
                                checked={getValue('GLOBAL', 'DIPENDENTI') === '1'} 
                                readOnly 
                            />
                            <span className="config-label">Gestione Dipendenti</span>
                        </div>
                    </div>
                </div>

                <div className="row mt-3">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="config-label mb-2 d-block">Tipo Store</label>
                            <select 
                                className="form-control" 
                                value={getValue('GLOBAL', 'TIPO_STORE', 'GENERALE')}
                                onChange={(e) => handleChange('GLOBAL', 'TIPO_STORE', e.target.value)}
                                style={{ height: '45px', borderRadius: '8px', border: '1px solid #ced4da' }}
                            >
                                <option value="GENERALE">Generale</option>
                                <option value="CERAMICA">Ceramica</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="config-section mb-4">
                <h3 className="section-subtitle">Articoli e Clienti</h3>
                <div className="row">
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'UNITAMISURA_ABILITA')}>
                            <input type="checkbox" className="config-checkbox" checked={getValue('GLOBAL', 'UNITAMISURA_ABILITA') === '1'} readOnly />
                            <span className="config-label">Unità di Misura</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('ARTICOLI', 'TIPOPRODOTTO_ABILITA')}>
                            <input type="checkbox" className="config-checkbox" checked={getValue('ARTICOLI', 'TIPOPRODOTTO_ABILITA') === '1'} readOnly />
                            <span className="config-label">Tipo Prodotto</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('ARTICOLI', 'CODICE_ABILITA')}>
                            <input type="checkbox" className="config-checkbox" checked={getValue('ARTICOLI', 'CODICE_ABILITA') === '1'} readOnly />
                            <span className="config-label">Codici Articolo</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('ARTICOLI', 'PREZZI_IVATI')}>
                            <input type="checkbox" className="config-checkbox" checked={getValue('ARTICOLI', 'PREZZI_IVATI') === '1'} readOnly />
                            <span className="config-label">Prezzi Ivati</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('CLIENTI', 'ABILITA_DATICOMMERCIALI')}>
                            <input type="checkbox" className="config-checkbox" checked={getValue('CLIENTI', 'ABILITA_DATICOMMERCIALI') === '1'} readOnly />
                            <span className="config-label">Dati Commerciali Clienti</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'ANNOTAZIONI_ESTESE')}>
                            <input type="checkbox" className="config-checkbox" checked={getValue('GLOBAL', 'ANNOTAZIONI_ESTESE') === '1'} readOnly />
                            <span className="config-label">Annotazioni Estese</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DatiGeneraliPage;
