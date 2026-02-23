import React, { useState, useEffect } from 'react';
import ConfigurazioneService from '../../services/ConfigurazioneService';
import './ConfigurazionePage.css';
import { FaSave, FaTimes, FaEdit, FaSearch, FaCogs } from 'react-icons/fa';

const ParametriPage = () => {
    const [configs, setConfigs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedDomain, setSelectedDomain] = useState('GLOBAL');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingKey, setEditingKey] = useState(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const response = await ConfigurazioneService.getAll();
            setConfigs(response.data);
            setError(null);
        } catch (err) {
            console.error("Error fetching configurations:", err);
            setError("Si è verificato un errore nel caricamento delle configurazioni.");
        } finally {
            setLoading(false);
        }
    };

    // Extract unique domains and filter out 'DOCUMENTI'
    const domains = [...new Set(configs.map(c => c.dominio))]
        .filter(d => d !== 'DOCUMENTI')
        .sort();

    // Filter configs
    const filteredConfigs = configs.filter(c =>
        c.dominio === selectedDomain &&
        (c.chiave.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.valore && c.valore.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    const handleEdit = (config) => {
        setEditingKey(config.chiave);
        setEditValue(config.valore || '');
    };

    const handleCancel = () => {
        setEditingKey(null);
        setEditValue('');
    };

    const handleSave = async (config) => {
        try {
            const dto = { ...config, valore: editValue };
            await ConfigurazioneService.save(dto);

            // Update local state
            setConfigs(prev => prev.map(c =>
                (c.dominio === config.dominio && c.chiave === config.chiave)
                    ? dto
                    : c
            ));

            setEditingKey(null);
        } catch (err) {
            console.error("Error saving configuration:", err);
            alert("Errore nel salvataggio della configurazione.");
        }
    };

    if (loading) return <div className="config-page-container">Loading...</div>;
    if (error) return <div className="config-page-container">{error}</div>;

    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaCogs style={{ marginRight: '10px' }} />Dati Sistema</h2>
            </div>

            <div className="config-content" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.1)', background: '#fff', display: 'flex' }}>
                <div className="config-sidebar">
                    <div style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
                        <div style={{ position: 'relative' }}>
                            <FaSearch style={{ position: 'absolute', top: '10px', left: '10px', color: '#ccc' }} />
                            <input
                                type="text"
                                placeholder="Cerca parametro..."
                                style={{ padding: '8px 8px 8px 35px', borderRadius: '4px', border: '1px solid #ddd', width: '100%' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    {domains.map(domain => (
                        <div
                            key={domain}
                            className={`config-nav-item ${selectedDomain === domain ? 'active' : ''}`}
                            onClick={() => setSelectedDomain(domain)}
                        >
                            {domain}
                            <span className="badge-domain">{configs.filter(c => c.dominio === domain).length}</span>
                        </div>
                    ))}
                </div>

                <div className="config-main">
                    <h3>Dominio: {selectedDomain}</h3>
                    <div className="config-table-container">
                        <table className="config-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '40%' }}>Chiave</th>
                                    <th style={{ width: '40%' }}>Valore</th>
                                    <th style={{ width: '20%' }}>Azioni</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredConfigs.length > 0 ? (
                                    filteredConfigs.map(config => (
                                        <tr key={config.chiave}>
                                            <td className="config-key">{config.chiave}</td>
                                            <td>
                                                {editingKey === config.chiave ? (
                                                    <div className="config-value-edit">
                                                        <input
                                                            type="text"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') {
                                                                    handleSave(config);
                                                                }
                                                            }}
                                                            autoFocus
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="config-value-display">{config.valore}</span>
                                                )}
                                            </td>
                                            <td className="config-actions">
                                                {editingKey === config.chiave ? (
                                                    <>
                                                        <button className="btn-save" onClick={() => handleSave(config)}><FaSave /></button>
                                                        <button className="btn-cancel" onClick={handleCancel}><FaTimes /></button>
                                                    </>
                                                ) : (
                                                    <button className="btn-edit" onClick={() => handleEdit(config)}><FaEdit /></button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" style={{ textAlign: 'center', color: '#999' }}>
                                            Nessun parametro trovato.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParametriPage;
