import React, { useState, useEffect } from 'react';
import StudioService from '../../services/StudioService';
import Swal from 'sweetalert2';
import { FaUserPlus, FaSearch, FaDownload, FaSignOutAlt, FaBuilding, FaFolderOpen, FaFileDownload } from 'react-icons/fa';
import './StudioDashboardPage.css';

const StudioDashboardPage = () => {
    const [clienti, setClienti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterState, setFilterState] = useState('ALL');
    const [selectedClienti, setSelectedClienti] = useState([]);

    useEffect(() => {
        loadClienti();
    }, []);

    const loadClienti = async () => {
        setLoading(true);
        try {
            const res = await StudioService.getClienti();
            setClienti(res.data || []);
        } catch (err) {
            console.error('Errore caricamento clienti studio:', err);
            Swal.fire('Errore', 'Impossibile caricare l\'elenco clienti dello studio.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleInvita = async () => {
        const { value: searchInput } = await Swal.fire({
            title: 'Collega Nuova Azienda Cliente',
            input: 'text',
            inputLabel: 'Partita IVA o Email dell\'Azienda Cliente',
            inputPlaceholder: 'Es. 12345678901 oppure azienda@email.it',
            showCancelButton: true,
            confirmButtonText: 'Invia Richiesta Delega',
            cancelButtonText: 'Annulla',
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return 'Devi inserire una Partita IVA o Email valida!';
                }
            }
        });

        if (searchInput) {
            try {
                const res = await StudioService.invitaCliente(searchInput.trim());
                Swal.fire('Richiesta Inviata!', res.data?.message || 'L\'azienda riceverà la richiesta nelle sue impostazioni.', 'success');
                loadClienti();
            } catch (err) {
                Swal.fire('Errore', err.response?.data || 'Impossibile inviare la richiesta.', 'error');
            }
        }
    };

    const handleToggleSelect = (id) => {
        if (selectedClienti.includes(id)) {
            setSelectedClienti(selectedClienti.filter(i => i !== id));
        } else {
            setSelectedClienti([...selectedClienti, id]);
        }
    };

    const triggerBlobDownload = (blobData, filename) => {
        const url = window.URL.createObjectURL(new Blob([blobData]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleBatchDownload = async () => {
        if (selectedClienti.length === 0) {
            Swal.fire('Nessuna azienda selezionata', 'Seleziona almeno un\'azienda per il download massivo.', 'warning');
            return;
        }
        try {
            Swal.fire({
                title: 'Generazione Archivio ZIP...',
                text: 'Estrazione fatture e creazione file di sintesi Prima Nota in corso...',
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const res = await StudioService.downloadBatchZip(selectedClienti);
            triggerBlobDownload(res.data, `Export_Studio_Fatture_${Date.now()}.zip`);
            Swal.fire('Download Completato!', 'L\'archivio ZIP ed il file di sintesi Prima Nota sono stati scaricati.', 'success');
        } catch (err) {
            Swal.fire('Errore Export', 'Impossibile generare l\'archivio batch.', 'error');
        }
    };

    const handleSingleDownload = async (cliente) => {
        try {
            Swal.fire({
                title: 'Download XML...',
                text: `Estrazione fatture per ${cliente.ragioneSociale}...`,
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });

            const res = await StudioService.downloadSingleClientZip(cliente.idCliente);
            const safeName = (cliente.ragioneSociale || 'Cliente').replace(/[^a-zA-Z0-9_]/g, '_');
            triggerBlobDownload(res.data, `Fatture_${safeName}.zip`);
            Swal.close();
        } catch (err) {
            Swal.fire('Errore Export', 'Impossibile scaricare le fatture del cliente.', 'error');
        }
    };

    const handleImpersonate = async (cliente) => {
        try {
            const res = await StudioService.impersonate(cliente.idCliente);
            sessionStorage.setItem('impersonated_tenant', JSON.stringify(res.data));
            Swal.fire({
                title: 'Modalità Consulente Attivata',
                text: `Stai accedendo nel tenant di ${cliente.ragioneSociale}.`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
            setTimeout(() => {
                window.location.href = '/';
            }, 1000);
        } catch (err) {
            Swal.fire('Accesso Negato', err.response?.data || 'Impossibile accedere all\'azienda cliente.', 'error');
        }
    };

    const filteredClienti = clienti.filter(c => {
        const matchSearch = (c.ragioneSociale || '').toLowerCase().includes(search.toLowerCase()) ||
                            (c.partitaIva || '').toLowerCase().includes(search.toLowerCase());
        const matchState = filterState === 'ALL' || c.statoDelega === filterState;
        return matchSearch && matchState;
    });

    return (
        <div className="studio-dashboard-container">
            {/* HEADER STUDIO */}
            <div className="studio-header">
                <div className="studio-title-section">
                    <h1>DASHBOARD STUDIO CONTABILE</h1>
                    <p>Gestione centralizzata multi-tenant delle aziende clienti e sincronizzazione documenti contabili</p>
                </div>
                <button
                    type="button"
                    onClick={handleInvita}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', padding: '10px 18px', borderRadius: '12px' }}
                >
                    <FaUserPlus /> + Collega Azienda Cliente
                </button>
            </div>

            {/* BARRA FILTRI */}
            <div className="studio-filters-card">
                <div className="studio-search-input input-group">
                    <span className="input-group-addon" style={{ background: '#fff' }}><FaSearch /></span>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Cerca cliente per Ragione Sociale o Partita IVA..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>Stato Delega:</span>
                    <select
                        className="form-control"
                        style={{ width: '160px' }}
                        value={filterState}
                        onChange={(e) => setFilterState(e.target.value)}
                    >
                        <option value="ALL">Tutti gli stati</option>
                        <option value="ACTIVE">Attivi (Accettati)</option>
                        <option value="PENDING">In Attesa</option>
                    </select>
                </div>
            </div>

            {/* TABELLA CLIENTII */}
            <div className="studio-table-card">
                {loading ? (
                    <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                        Caricamento elenco clienti studio in corso...
                    </div>
                ) : filteredClienti.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                        <FaBuilding style={{ fontSize: '32px', color: '#cbd5e1', marginBottom: '12px' }} /><br />
                        Nessuna azienda cliente trovata.<br />
                        Clicca su <strong>"+ Collega Azienda Cliente"</strong> per inviare la tua prima richiesta di delega.
                    </div>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th style={{ width: '40px', textAlign: 'center' }}>
                                        <input
                                            type="checkbox"
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedClienti(filteredClienti.map(c => c.idCliente));
                                                } else {
                                                    setSelectedClienti([]);
                                                }
                                            }}
                                            checked={selectedClienti.length > 0 && selectedClienti.length === filteredClienti.length}
                                        />
                                    </th>
                                    <th>Ragione Sociale / P.IVA</th>
                                    <th>Regime Fiscale</th>
                                    <th style={{ textAlign: 'center' }}>Doc. Mese</th>
                                    <th style={{ textAlign: 'center' }}>Stato Delega</th>
                                    <th style={{ textAlign: 'center' }}>Azioni Fast</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredClienti.map(c => (
                                    <tr key={c.idDelega}>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selectedClienti.includes(c.idCliente)}
                                                onChange={() => handleToggleSelect(c.idCliente)}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: '800', color: '#0f172a' }}>{c.ragioneSociale}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b' }}>P.IVA: {c.partitaIva || 'N/D'}</div>
                                        </td>
                                        <td>
                                            <span className="label label-default" style={{ fontSize: '11px', fontWeight: '700' }}>
                                                {c.regimeFiscale}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center', fontWeight: '800', color: '#2563eb' }}>
                                            {c.countDocMese} fatture
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            {c.statoDelega === 'ACTIVE' ? (
                                                <span className="studio-badge-active">✓ ATTIVO</span>
                                            ) : (
                                                <span className="studio-badge-pending">⏳ IN ATTESA</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                <button
                                                    type="button"
                                                    className="btn btn-default btn-xs"
                                                    title="Scarica Fatture XML/PDF del mese"
                                                    onClick={() => handleSingleDownload(c)}
                                                    disabled={c.statoDelega !== 'ACTIVE'}
                                                    style={{ opacity: c.statoDelega !== 'ACTIVE' ? 0.5 : 1 }}
                                                >
                                                    <FaFileDownload /> XML
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-info btn-xs"
                                                    title="Accedi nel contesto aziendale del cliente"
                                                    onClick={() => handleImpersonate(c)}
                                                    disabled={c.statoDelega !== 'ACTIVE'}
                                                    style={{ opacity: c.statoDelega !== 'ACTIVE' ? 0.5 : 1 }}
                                                >
                                                    <FaFolderOpen /> Entra
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* BARRA AZIONI MASSIVE */}
                        <div style={{
                            padding: '16px 20px',
                            background: '#f8fafc',
                            borderTop: '1px solid #e2e8f0',
                            display: 'flex',
                            justify: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <span style={{ fontSize: '13px', fontWeight: '700', color: '#475569' }}>
                                Aziende selezionate: <strong>{selectedClienti.length}</strong>
                            </span>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    type="button"
                                    onClick={handleBatchDownload}
                                    className="btn btn-success btn-sm"
                                    style={{ fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <FaDownload /> Download Batch XML (.ZIP)
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default StudioDashboardPage;
