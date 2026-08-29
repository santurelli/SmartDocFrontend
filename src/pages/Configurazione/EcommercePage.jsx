import React, { useState, useEffect } from 'react';
import EcommerceService from '../../services/EcommerceService';
import Swal from 'sweetalert2';
import { FaStore, FaSyncAlt } from 'react-icons/fa';
import './ConfigurazionePage.css';

const defaultConfig = {
    piattaforma: 'WOOCOMMERCE',
    storeUrl: '',
    consumerKey: '',
    consumerSecret: '',
    statoOrdineWoo: 'processing',
    flAbilitato: 0,
    flCreaDdt: 1,
    flCreaFattura: 1,
    intervalloMinuti: 15
};

const EcommercePage = () => {
    const [config, setConfig] = useState(defaultConfig);
    const [log, setLog] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [configRes, logRes] = await Promise.all([
                EcommerceService.getConfig(),
                EcommerceService.getLog()
            ]);
            setConfig(configRes.data?.payload || defaultConfig);
            setLog(logRes.data?.payload || []);
        } catch (error) {
            console.error('Errore nel caricamento della configurazione e-commerce:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (field, value) => {
        setConfig(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await EcommerceService.saveConfig(config);
            Swal.fire({ title: 'Salvato', text: 'Configurazione e-commerce aggiornata.', icon: 'success', timer: 1500, showConfirmButton: false });
            fetchAll();
        } catch (error) {
            console.error('Errore nel salvataggio della configurazione e-commerce:', error);
            Swal.fire({ title: 'Errore', text: 'Errore nel salvataggio della configurazione.', icon: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleSyncNow = async () => {
        setSyncing(true);
        try {
            await EcommerceService.syncNow();
            Swal.fire({ title: 'Sincronizzazione completata', icon: 'success', timer: 1500, showConfirmButton: false });
            fetchAll();
        } catch (error) {
            console.error('Errore nella sincronizzazione manuale:', error);
            Swal.fire({ title: 'Errore', text: 'Errore durante la sincronizzazione. Controlla URL e credenziali.', icon: 'error' });
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Caricamento...</div>;
    }

    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaStore style={{ marginRight: '10px' }} />Integrazione E-commerce</h2>
            </div>

            <div className="tab-content-wrapper" style={{ border: 'none', padding: '0' }}>
                <div className="dati-azienda-container" style={{ padding: '30px', backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>

                    <p className="section-description">
                        Collega il tuo negozio WooCommerce: SmartDoc controlla periodicamente i nuovi ordini e genera automaticamente DDT e Fattura.
                        Se un prodotto dell'ordine non corrisponde (per SKU) a nessun Articolo esistente, viene creato automaticamente.
                        Le fatture generate restano in bozza: nessun invio automatico allo SDI.
                    </p>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={config.flAbilitato === 1} onChange={(e) => handleChange('flAbilitato', e.target.checked ? 1 : 0)} />
                            <strong style={{ color: config.flAbilitato === 1 ? '#15803d' : '#64748b' }}>{config.flAbilitato === 1 ? 'Integrazione attiva' : 'Integrazione disattivata'}</strong>
                        </label>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', maxWidth: '700px', marginBottom: '20px' }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label>URL Store WooCommerce</label>
                            <input type="text" className="form-control" placeholder="https://miostore.it"
                                value={config.storeUrl || ''} onChange={(e) => handleChange('storeUrl', e.target.value)} />
                        </div>
                        <div>
                            <label>Consumer Key</label>
                            <input type="text" className="form-control" placeholder="ck_..."
                                value={config.consumerKey || ''} onChange={(e) => handleChange('consumerKey', e.target.value)} />
                        </div>
                        <div>
                            <label>Consumer Secret</label>
                            <input type="password" className="form-control" placeholder="cs_..."
                                value={config.consumerSecret || ''} onChange={(e) => handleChange('consumerSecret', e.target.value)} />
                        </div>
                        <div>
                            <label>Stato ordine da importare</label>
                            <select className="form-control" value={config.statoOrdineWoo} onChange={(e) => handleChange('statoOrdineWoo', e.target.value)}>
                                <option value="processing">In lavorazione (processing)</option>
                                <option value="completed">Completato</option>
                                <option value="on-hold">In attesa</option>
                            </select>
                        </div>
                        <div>
                            <label>Intervallo di controllo (minuti)</label>
                            <input type="number" className="form-control" min={5}
                                value={config.intervalloMinuti} onChange={(e) => handleChange('intervalloMinuti', parseInt(e.target.value) || 15)} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={config.flCreaDdt === 1} onChange={(e) => handleChange('flCreaDdt', e.target.checked ? 1 : 0)} />
                            Genera DDT
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input type="checkbox" checked={config.flCreaFattura === 1} onChange={(e) => handleChange('flCreaFattura', e.target.checked ? 1 : 0)} />
                            Genera Fattura
                        </label>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                        <button className="btn btn-primary" style={{ fontSize: '14px', fontWeight: 500 }} onClick={handleSave} disabled={saving}>
                            {saving ? 'Salvataggio...' : 'Salva Configurazione'}
                        </button>
                        <button className="btn btn-secondary" style={{ fontSize: '14px', fontWeight: 500 }} onClick={handleSyncNow} disabled={syncing || config.flAbilitato !== 1}>
                            <FaSyncAlt style={{ marginRight: '6px' }} />{syncing ? 'Sincronizzazione...' : 'Sincronizza ora'}
                        </button>
                    </div>

                    {config.ultimoEsito && (
                        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '13px', color: '#475569' }}>
                            <strong>Ultima sincronizzazione:</strong> {config.dtUltimoSync || '-'}<br />
                            {config.ultimoEsito}
                        </div>
                    )}

                    <h3 style={{ marginBottom: '12px' }}>Ultimi ordini importati</h3>
                    {log.length === 0 ? (
                        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '30px', textAlign: 'center', color: '#64748b' }}>
                            Nessun ordine importato finora.
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Data importazione</th>
                                        <th>N. Ordine</th>
                                        <th>Esito</th>
                                        <th>Dettaglio</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {log.map((riga, idx) => (
                                        <tr key={idx}>
                                            <td>{riga.dtImportazione}</td>
                                            <td>{riga.numeroOrdineEsterno || riga.idOrdineEsterno}</td>
                                            <td>
                                                <span style={{ color: riga.esito === 'OK' ? '#15803d' : '#b91c1c', fontWeight: 600 }}>
                                                    {riga.esito}
                                                </span>
                                            </td>
                                            <td>{riga.dettaglioEsito || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EcommercePage;
