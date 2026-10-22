import React, { useState, useEffect } from 'react';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import { FaSave, FaCogs, FaHome, FaUniversity } from 'react-icons/fa';
import Swal from 'sweetalert2';
import RisorseManagementModal from '../../components/modals/RisorseManagementModal';
import './ConfigurazionePage.css';
const DatiGeneraliPage = () => {
    const [configs, setConfigs] = useState({});
    const [loading, setLoading] = useState(true);
    const [showRisorseModal, setShowRisorseModal] = useState(false);

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

    const handleToggle = (domain, key, def = '0') => {
        const fullKey = `${domain}:${key}`;
        setConfigs(prev => {
            const currentVal = prev[fullKey] !== undefined ? prev[fullKey] : def;
            return {
                ...prev,
                [fullKey]: currentVal === '1' ? '0' : '1'
            };
        });
    };

    const handleChange = (domain, key, value) => {
        const fullKey = `${domain}:${key}`;
        setConfigs(prev => ({
            ...prev,
            [fullKey]: value
        }));
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
                { d: 'ARTICOLI', k: 'TIPOLOGIA_DEFAULT' },
                { d: 'CLIENTI', k: 'ABILITA_DATICOMMERCIALI' },
                { d: 'GLOBAL', k: 'CONSIDERA_PROFORMA_PRIMA_NOTA' },
                { d: 'GLOBAL', k: 'GOMMISTA' },
                { d: 'GLOBAL', k: 'UBICAZIONI' },
                { d: 'GLOBAL', k: 'MARCHE' },
                { d: 'GLOBAL', k: 'CATEGORIE' },
                { d: 'GLOBAL', k: 'SOTTOCATEGORIE' },
                { d: 'GLOBAL', k: 'STAMPANTE_PRELIEVO_PROTOCOLLO' },
                { d: 'GLOBAL', k: 'STAMPANTE_PRELIEVO_IP' },
                { d: 'GLOBAL', k: 'PRINTER_BRIDGE_URL' }
            ];

            for (const item of keysToSave) {
                let val = configs[`${item.d}:${item.k}`];
                if (val === undefined && item.d === 'ARTICOLI' && item.k === 'TIPOLOGIA_DEFAULT') {
                    val = (configs['GLOBAL:TIPO_STORE'] === 'PNEUMATICI') ? 'AM' : 'A';
                }
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
                <li className="active">Impostazioni Generali</li>
            </ul>

            <div className="config-header">
                <h2><FaCogs style={{ marginRight: '10px' }} />Impostazioni Generali</h2>
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
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'CONSIDERA_PROFORMA_PRIMA_NOTA')}>
                            <input 
                                type="checkbox" 
                                className="config-checkbox" 
                                checked={getValue('GLOBAL', 'CONSIDERA_PROFORMA_PRIMA_NOTA') === '1'} 
                                readOnly 
                            />
                            <span className="config-label">Considera pro forma in prima nota</span>
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
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setConfigs(prev => {
                                        const next = { ...prev, 'GLOBAL:TIPO_STORE': val };
                                        if (val === 'PNEUMATICI') {
                                            next['GLOBAL:GOMMISTA'] = '1';
                                            next['GLOBAL:UBICAZIONI'] = '1';
                                            next['GLOBAL:MARCHE'] = '1';
                                            if (!prev['ARTICOLI:TIPOLOGIA_DEFAULT']) {
                                                next['ARTICOLI:TIPOLOGIA_DEFAULT'] = 'AM';
                                            }
                                        } else {
                                            next['GLOBAL:GOMMISTA'] = '0';
                                        }
                                        return next;
                                    });
                                }}
                                style={{ height: '45px', borderRadius: '8px', border: '1px solid #ced4da' }}
                            >
                                <option value="GENERALE">Generale</option>
                                <option value="CERAMICA">Ceramica</option>
                                <option value="PNEUMATICI">Pneumatici</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="config-section mb-4">
                <h3 className="section-subtitle">Articoli e Clienti</h3>
                <div className="row mb-3">
                    <div className="col-md-6">
                        <div className="form-group">
                            <label className="config-label mb-2 d-block">Tipologia Articolo di Default</label>
                            <select 
                                className="form-control" 
                                value={getValue('ARTICOLI', 'TIPOLOGIA_DEFAULT', getValue('GLOBAL', 'TIPO_STORE') === 'PNEUMATICI' ? 'AM' : 'A')}
                                onChange={(e) => handleChange('ARTICOLI', 'TIPOLOGIA_DEFAULT', e.target.value)}
                                style={{ height: '42px', borderRadius: '8px', border: '1px solid #ced4da' }}
                            >
                                <option value="A">Articolo (A - Senza magazzino)</option>
                                <option value="AM">Articolo con magazzino (AM - Giacenze e carichi)</option>
                                <option value="AMSC">Articolo con scelte / colori (AMSC)</option>
                                <option value="S">Servizio (S)</option>
                            </select>
                            <small className="text-muted d-block mt-1">
                                Tipologia preselezionata automaticamente durante la creazione di un nuovo articolo.
                            </small>
                        </div>
                    </div>
                </div>

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
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'UBICAZIONI')}>
                            <input type="checkbox" className="config-checkbox" checked={getValue('GLOBAL', 'UBICAZIONI') === '1'} readOnly />
                            <span className="config-label">Gestione Ubicazioni Magazzino</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'MARCHE')}>
                            <input type="checkbox" className="config-checkbox" checked={getValue('GLOBAL', 'MARCHE') === '1'} readOnly />
                            <span className="config-label">Gestione Marche (Brand)</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'CATEGORIE', '1')}>
                            <input type="checkbox" className="config-checkbox" checked={getValue('GLOBAL', 'CATEGORIE', '1') === '1'} readOnly />
                            <span className="config-label">Gestione Categorie</span>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="document-config-card" onClick={() => handleToggle('GLOBAL', 'SOTTOCATEGORIE', '1')}>
                            <input type="checkbox" className="config-checkbox" checked={getValue('GLOBAL', 'SOTTOCATEGORIE', '1') === '1'} readOnly />
                            <span className="config-label">Gestione Sottocategorie</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="config-section mb-4">
                <h3 className="section-subtitle">Stampante Prelievo & PrinterBridge</h3>
                <p className="section-description">
                    Configurazione della stampante termica di magazzino per la stampa delle schede di prelievo e collegamento al PrinterBridge.
                </p>

                <div className="row">
                    <div className="col-md-4 mb-3">
                        <div className="form-group">
                            <label className="config-label mb-2 d-block">Protocollo Stampante</label>
                            <select
                                className="form-control"
                                value={getValue('GLOBAL', 'STAMPANTE_PRELIEVO_PROTOCOLLO', 'ESCPOS')}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    handleChange('GLOBAL', 'STAMPANTE_PRELIEVO_PROTOCOLLO', val);
                                    if (val === 'SIMULATOR') {
                                        handleChange('GLOBAL', 'STAMPANTE_PRELIEVO_IP', 'SIMULATOR');
                                    } else if (getValue('GLOBAL', 'STAMPANTE_PRELIEVO_IP', '192.168.1.200') === 'SIMULATOR') {
                                        handleChange('GLOBAL', 'STAMPANTE_PRELIEVO_IP', '192.168.1.200');
                                    }
                                }}
                                style={{ height: '42px', borderRadius: '8px', border: '1px solid #ced4da' }}
                            >
                                <option value="ESCPOS">ESC/POS Standard (Epson, Bixolon, Star...)</option>
                                <option value="CUSTOM">Custom Protocol (Kube, Q3X, BIG...)</option>
                                <option value="SIMULATOR">Simulatore (Stampa su log/console del bridge)</option>
                            </select>
                            <small className="text-muted d-block mt-1">Linguaggio o modalità di test della stampante</small>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="form-group">
                            <label className="config-label mb-2 d-block">Indirizzo IP Stampante (Porta 9100)</label>
                            <input 
                                type="text"
                                className="form-control"
                                placeholder={getValue('GLOBAL', 'STAMPANTE_PRELIEVO_PROTOCOLLO') === 'SIMULATOR' ? "SIMULATOR" : "es. 192.168.1.200"}
                                value={getValue('GLOBAL', 'STAMPANTE_PRELIEVO_IP', '192.168.1.200')}
                                disabled={getValue('GLOBAL', 'STAMPANTE_PRELIEVO_PROTOCOLLO') === 'SIMULATOR'}
                                onChange={(e) => handleChange('GLOBAL', 'STAMPANTE_PRELIEVO_IP', e.target.value)}
                                style={{ 
                                    height: '42px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #ced4da',
                                    backgroundColor: (getValue('GLOBAL', 'STAMPANTE_PRELIEVO_PROTOCOLLO') === 'SIMULATOR' || getValue('GLOBAL', 'STAMPANTE_PRELIEVO_IP') === 'SIMULATOR') ? '#f1f5f9' : '#ffffff',
                                    fontWeight: (getValue('GLOBAL', 'STAMPANTE_PRELIEVO_PROTOCOLLO') === 'SIMULATOR' || getValue('GLOBAL', 'STAMPANTE_PRELIEVO_IP') === 'SIMULATOR') ? '600' : 'normal'
                                }}
                            />
                            <small className="text-muted d-block mt-1">
                                {(getValue('GLOBAL', 'STAMPANTE_PRELIEVO_PROTOCOLLO') === 'SIMULATOR' || getValue('GLOBAL', 'STAMPANTE_PRELIEVO_IP') === 'SIMULATOR')
                                    ? 'Modalità simulata: l\'output viene stampato nel terminale del bridge'
                                    : 'Indirizzo IP della stampante termica nella rete locale'}
                            </small>
                        </div>
                    </div>
                    <div className="col-md-4 mb-3">
                        <div className="form-group">
                            <label className="config-label mb-2 d-block">URL Printer Bridge Locale</label>
                            <input 
                                type="text"
                                className="form-control"
                                placeholder="http://localhost:3001"
                                value={getValue('GLOBAL', 'PRINTER_BRIDGE_URL', 'http://localhost:3001')}
                                onChange={(e) => handleChange('GLOBAL', 'PRINTER_BRIDGE_URL', e.target.value)}
                                style={{ height: '42px', borderRadius: '8px', border: '1px solid #ced4da' }}
                            />
                            <small className="text-muted d-block mt-1">Servizio PrinterBridge in esecuzione locale</small>
                        </div>
                    </div>
                </div>
            </div>

            <div className="config-section mb-4">
                <h3 className="section-subtitle">Conti e Banche</h3>
                <p className="section-description">
                    Gestisci i conti (banca, cassa) usati nei documenti e nello scadenzario, e imposta il saldo iniziale
                    di ciascuno — è il dato di partenza usato dalla Previsione di Cassa.
                </p>
                <button type="button" className="btn btn-primary premium-btn" onClick={() => setShowRisorseModal(true)}>
                    <FaUniversity className="mr-2" /> Gestisci conti/banche
                </button>
            </div>

            {showRisorseModal && (
                <RisorseManagementModal onClose={() => setShowRisorseModal(false)} initialTipologia="BA" />
            )}
        </div>
    );
};

export default DatiGeneraliPage;
