import React, { useState, useEffect, useMemo } from 'react';
import UbicazioniService from '../../services/UbicazioniService';
import { FaPlusCircle, FaSearch, FaEdit, FaTrash, FaHome, FaWarehouse, FaMapMarkerAlt, FaTimes, FaSave, FaEye, FaBoxes, FaBoxOpen, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './UbicazioniList.css';

const UbicazioniList = () => {
    const [ubicazioni, setUbicazioni] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(50);
    const [totalItems, setTotalItems] = useState(0);

    // Modal Create / Edit
    const [showModal, setShowModal] = useState(false);
    const [modalData, setModalData] = useState({
        id: 0,
        codUbicazione: '',
        descrizione: '',
        corsia: '',
        ripiano: '',
        livello: '',
        note: ''
    });

    // Modal Dettaglio Articoli
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedUbiForDetail, setSelectedUbiForDetail] = useState(null);
    const [detailItems, setDetailItems] = useState([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailSortField, setDetailSortField] = useState('codProdotto');
    const [detailSortAsc, setDetailSortAsc] = useState(true);

    const handleSort = (field) => {
        if (detailSortField === field) {
            setDetailSortAsc(!detailSortAsc);
        } else {
            setDetailSortField(field);
            setDetailSortAsc(true);
        }
    };

    const renderSortIcon = (field) => {
        if (detailSortField !== field) {
            return <FaSort style={{ opacity: 0.35, marginLeft: '6px', fontSize: '11px', verticalAlign: 'middle' }} />;
        }
        return detailSortAsc ? (
            <FaSortUp style={{ color: '#03a9f4', marginLeft: '6px', fontSize: '12px', verticalAlign: 'middle' }} />
        ) : (
            <FaSortDown style={{ color: '#03a9f4', marginLeft: '6px', fontSize: '12px', verticalAlign: 'middle' }} />
        );
    };

    const sortedDetailItems = useMemo(() => {
        if (!detailItems || detailItems.length === 0) return [];
        return [...detailItems].sort((a, b) => {
            let res = 0;
            switch (detailSortField) {
                case 'codProdotto': {
                    const aVal = a.codProdotto || '';
                    const bVal = b.codProdotto || '';
                    res = aVal.localeCompare(bVal, undefined, { numeric: true, sensitivity: 'base' });
                    break;
                }
                case 'descrizione': {
                    const aVal = (a.scultura || a.descProdotto || '').toLowerCase();
                    const bVal = (b.scultura || b.descProdotto || '').toLowerCase();
                    res = aVal.localeCompare(bVal);
                    break;
                }
                case 'marca': {
                    const aVal = (a.marca || '').toLowerCase();
                    const bVal = (b.marca || '').toLowerCase();
                    res = aVal.localeCompare(bVal);
                    break;
                }
                case 'misura': {
                    const aVal = [
                        a.sezione ? (a.serie ? `${a.sezione}/${a.serie}` : a.sezione) : '',
                        a.diametro ? `R${a.diametro}` : '',
                        a.indiceVelocita || ''
                    ].filter(Boolean).join(' ');
                    const bVal = [
                        b.sezione ? (b.serie ? `${b.sezione}/${b.serie}` : b.sezione) : '',
                        b.diametro ? `R${b.diametro}` : '',
                        b.indiceVelocita || ''
                    ].filter(Boolean).join(' ');
                    res = aVal.localeCompare(bVal, undefined, { numeric: true });
                    break;
                }
                case 'dot': {
                    const aVal = a.dot || '';
                    const bVal = b.dot || '';
                    res = aVal.localeCompare(bVal);
                    break;
                }
                case 'quantita': {
                    const aVal = parseFloat(a.quantita) || 0;
                    const bVal = parseFloat(b.quantita) || 0;
                    res = aVal - bVal;
                    break;
                }
                default:
                    res = 0;
            }
            return detailSortAsc ? res : -res;
        });
    }, [detailItems, detailSortField, detailSortAsc]);


    useEffect(() => {
        const delayFn = setTimeout(() => {
            fetchUbicazioni();
        }, 300);
        return () => clearTimeout(delayFn);
    }, [search, page, pageSize]);

    const fetchUbicazioni = async () => {
        setLoading(true);
        try {
            const res = await UbicazioniService.getList({
                start: page * pageSize,
                length: pageSize,
                search: search
            });
            const data = res.data || {};
            setUbicazioni(data.list || []);
            setTotalItems(data.totalCount || 0);
        } catch (error) {
            console.error("Errore recupero ubicazioni", error);
            setUbicazioni([]);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenNew = () => {
        setModalData({
            id: 0,
            codUbicazione: '',
            descrizione: '',
            corsia: '',
            ripiano: '',
            livello: '',
            note: ''
        });
        setShowModal(true);
    };

    const handleOpenDetail = async (ubi) => {
        setSelectedUbiForDetail(ubi);
        setShowDetailModal(true);
        setDetailLoading(true);
        try {
            const res = await UbicazioniService.getProdottiByUbicazione(ubi.id);
            setDetailItems(res.data || []);
        } catch (error) {
            console.error("Errore recupero dettaglio articoli ubicazione", error);
            setDetailItems([]);
        } finally {
            setDetailLoading(false);
        }
    };

    const handleOpenEdit = (ubi) => {
        setModalData({
            id: ubi.id,
            codUbicazione: ubi.codUbicazione || '',
            descrizione: ubi.descrizione || '',
            corsia: ubi.corsia || '',
            ripiano: ubi.ripiano || '',
            livello: ubi.livello || '',
            note: ubi.note || ''
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!modalData.codUbicazione?.trim()) {
            Swal.fire('Attenzione', 'Il codice ubicazione è obbligatorio', 'warning');
            return;
        }

        try {
            await UbicazioniService.save(modalData);
            Swal.fire({
                icon: 'success',
                title: 'Salvato!',
                text: 'Ubicazione salvata con successo',
                timer: 1500,
                showConfirmButton: false
            });
            setShowModal(false);
            fetchUbicazioni();
        } catch (error) {
            console.error("Errore salvataggio ubicazione", error);
            Swal.fire('Errore', 'Impossibile salvare l\'ubicazione', 'error');
        }
    };

    const handleDelete = async (ubi) => {
        const confirm = await Swal.fire({
            title: 'Sei sicuro?',
            text: `Vuoi eliminare l'ubicazione "${ubi.codUbicazione}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });

        if (confirm.isConfirmed) {
            try {
                await UbicazioniService.delete(ubi.id);
                fetchUbicazioni();
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminata',
                    text: 'Ubicazione rimossa con successo',
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch (err) {
                Swal.fire('Errore', 'Impossibile eliminare l\'ubicazione', 'error');
            }
        }
    };

    return (
        <div className="ubicazioni-page-container">
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li>Magazzino</li>
                <li className="active">Ubicazioni magazzino</li>
            </ul>

            <h1><FaWarehouse /> Ubicazioni Magazzino</h1>

            <div className="ubicazioni-main-box">
                <div className="ubicazioni-toolbar">
                    <div className="ubicazioni-search-box">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Cerca per codice, corsia, descrizione..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <button 
                        type="button"
                        className="btn-new-ubicazione"
                        onClick={handleOpenNew}
                    >
                        <FaPlusCircle /> Nuova ubicazione
                    </button>
                </div>

                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th>Codice</th>
                                <th>Descrizione</th>
                                <th>Corsia</th>
                                <th>Ripiano</th>
                                <th>Livello</th>
                                <th style={{ textAlign: 'right' }}>Pneumatici Presenti</th>
                                <th>Note</th>
                                <th style={{ width: '100px', textAlign: 'right' }}>Azioni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="8" className="text-center p-4">Caricamento ubicazioni...</td></tr>
                            ) : ubicazioni.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center p-4 text-muted">
                                        <FaMapMarkerAlt className="mr-2" /> Nessuna ubicazione trovata. Clicca su "Nuova Ubicazione" per crearne una.
                                    </td>
                                </tr>
                            ) : (
                                ubicazioni.map(ubi => (
                                    <tr key={ubi.id}>
                                        <td>
                                            <strong style={{ color: '#2980b9', fontSize: '14px' }}>{ubi.codUbicazione}</strong>
                                        </td>
                                        <td>{ubi.descrizione || '-'}</td>
                                        <td>{ubi.corsia || '-'}</td>
                                        <td>{ubi.ripiano || '-'}</td>
                                        <td>{ubi.livello || '-'}</td>
                                        <td className="text-right">
                                            <button
                                                type="button"
                                                className="btn-badge-detail"
                                                onClick={() => handleOpenDetail(ubi)}
                                                title="Clicca per visualizzare gli articoli contenuti"
                                            >
                                                <span className="badge-count" style={{ backgroundColor: ubi.totalePneumatici > 0 ? '#27ae60' : '#94a3b8' }}>
                                                    <FaEye className="icon-view" /> {ubi.totalePneumatici} pz
                                                </span>
                                            </button>
                                        </td>
                                        <td><small className="text-muted">{ubi.note || '-'}</small></td>
                                        <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                                            <div className="actions-wrapper">
                                                <button
                                                    type="button"
                                                    className="btn-action btn-action-edit"
                                                    onClick={() => handleOpenEdit(ubi)}
                                                    title="Modifica"
                                                >
                                                    <FaEdit size={16} color="#ffffff" />
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn-action btn-action-delete"
                                                    onClick={() => handleDelete(ubi)}
                                                    title="Elimina"
                                                >
                                                    <FaTrash size={14} color="#ffffff" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                    <small className="text-muted">Totale ubicazioni: {totalItems}</small>
                </div>
            </div>

            {/* Modal Creazione / Modifica */}
            {showModal && (
                <div className="modal show premium-modal ubicazioni-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
                    <div className="modal-dialog" style={{ width: '100%', maxWidth: '600px', margin: 'auto' }}>
                        <div className="modal-content premium-modal-content" style={{ borderRadius: '14px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                <h4 className="modal-title" style={{ fontWeight: 'bold', fontSize: '18px', margin: 0, color: '#1e293b', lineHeight: 1.2 }}>
                                    {modalData.id ? 'Modifica Ubicazione' : 'Nuova Ubicazione'}
                                </h4>
                                <button type="button" className="close" onClick={() => setShowModal(false)} aria-label="Close" style={{ margin: 0, padding: 0, lineHeight: 1, fontSize: '24px', opacity: 0.6 }}>
                                    <span aria-hidden="true">&times;</span>
                                </button>
                            </div>
                            <form onSubmit={handleSave} style={{ margin: 0 }}>
                                <div className="modal-body" style={{ padding: '22px 24px' }}>
                                    <div className="form-group mb-3">
                                        <label className="required font-weight-bold">Codice Ubicazione *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="es. UB-A1-01"
                                            value={modalData.codUbicazione}
                                            onChange={(e) => setModalData({ ...modalData, codUbicazione: e.target.value })}
                                            required
                                            style={{ height: '40px', borderRadius: '6px' }}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>Descrizione</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="es. Scaffale Gomme Estive"
                                            value={modalData.descrizione}
                                            onChange={(e) => setModalData({ ...modalData, descrizione: e.target.value })}
                                            style={{ height: '40px', borderRadius: '6px' }}
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-md-4">
                                            <div className="form-group mb-3">
                                                <label>Corsia</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="es. A"
                                                    value={modalData.corsia}
                                                    onChange={(e) => setModalData({ ...modalData, corsia: e.target.value })}
                                                    style={{ height: '40px', borderRadius: '6px' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="form-group mb-3">
                                                <label>Ripiano</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="es. 2"
                                                    value={modalData.ripiano}
                                                    onChange={(e) => setModalData({ ...modalData, ripiano: e.target.value })}
                                                    style={{ height: '40px', borderRadius: '6px' }}
                                                />
                                            </div>
                                        </div>
                                        <div className="col-md-4">
                                            <div className="form-group mb-3">
                                                <label>Livello</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="es. 1"
                                                    value={modalData.livello}
                                                    onChange={(e) => setModalData({ ...modalData, livello: e.target.value })}
                                                    style={{ height: '40px', borderRadius: '6px' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Note</label>
                                        <textarea
                                            className="form-control"
                                            rows="2"
                                            placeholder="Note interne..."
                                            value={modalData.note}
                                            onChange={(e) => setModalData({ ...modalData, note: e.target.value })}
                                            style={{ borderRadius: '6px' }}
                                        ></textarea>
                                    </div>
                                </div>
                                <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px', padding: '14px 24px', backgroundColor: '#ffffff' }}>
                                    <button 
                                        type="button" 
                                        className="btn btn-default" 
                                        onClick={() => setShowModal(false)} 
                                        style={{ height: '40px', padding: '0 20px', borderRadius: '8px', fontSize: '14px', fontWeight: '500' }}
                                    >
                                        Annulla
                                    </button>
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary" 
                                        style={{ height: '40px', padding: '0 22px', borderRadius: '8px', fontSize: '14px', fontWeight: '600', backgroundColor: '#03a9f4', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 6px rgba(3, 169, 244, 0.3)' }}
                                    >
                                        <FaSave /> Salva
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Dettaglio Articoli Contenuti */}
            {showDetailModal && selectedUbiForDetail && (
                <div className="modal show premium-modal ubicazioni-modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" style={{ width: '100%', maxWidth: '850px', margin: 'auto' }}>
                        <div className="modal-content premium-modal-content" style={{ borderRadius: '14px', border: 'none', boxShadow: '0 15px 35px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
                            <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid #e2e8f0', backgroundColor: '#ffffff' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ backgroundColor: '#e0f2fe', width: '38px', height: '38px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                                        <FaBoxes style={{ fontSize: '18px' }} />
                                    </div>
                                    <div>
                                        <h4 className="modal-title" style={{ fontWeight: 'bold', margin: 0, fontSize: '18px', color: '#1e293b', lineHeight: 1.2 }}>
                                            Articoli in Ubicazione: <span style={{ color: '#0284c7' }}>{selectedUbiForDetail.codUbicazione}</span>
                                        </h4>
                                        <div style={{ color: '#64748b', fontSize: '13px', marginTop: '3px' }}>
                                            {selectedUbiForDetail.descrizione || 'Nessuna descrizione'} 
                                            {selectedUbiForDetail.corsia ? ` • Corsia ${selectedUbiForDetail.corsia}` : ''}
                                            {selectedUbiForDetail.ripiano ? ` • Ripiano ${selectedUbiForDetail.ripiano}` : ''}
                                            {selectedUbiForDetail.livello ? ` • Livello ${selectedUbiForDetail.livello}` : ''}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <span className="badge" style={{ backgroundColor: '#10b981', color: '#ffffff', padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
                                        Totale: {selectedUbiForDetail.totalePneumatici} pz
                                    </span>
                                    <button 
                                        type="button" 
                                        className="close" 
                                        onClick={() => setShowDetailModal(false)} 
                                        aria-label="Close" 
                                        style={{ margin: 0, padding: 0, lineHeight: 1, fontSize: '24px', opacity: 0.6 }}
                                    >
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                            </div>
                            <div className="modal-body" style={{ padding: '20px 24px', maxHeight: '550px', overflowY: 'auto' }}>
                                {detailLoading ? (
                                    <div className="text-center p-5 text-muted">
                                        <div className="fa fa-spinner fa-spin" style={{ fontSize: '28px', color: '#03a9f4', marginBottom: '12px' }}></div>
                                        <div>Caricamento articoli dell'ubicazione...</div>
                                    </div>
                                ) : detailItems.length === 0 ? (
                                    <div className="text-center p-5 text-muted">
                                        <FaBoxOpen style={{ fontSize: '40px', color: '#cbd5e1', marginBottom: '10px' }} />
                                        <p style={{ margin: 0, fontSize: '14px' }}>Nessun articolo attualmente registrato in questa ubicazione.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover table-detail-items">
                                            <thead>
                                                <tr>
                                                    <th className="sortable-th" onClick={() => handleSort('codProdotto')}>
                                                        Codice {renderSortIcon('codProdotto')}
                                                    </th>
                                                    <th className="sortable-th" onClick={() => handleSort('descrizione')}>
                                                        Descrizione / Modello {renderSortIcon('descrizione')}
                                                    </th>
                                                    <th className="sortable-th" onClick={() => handleSort('marca')}>
                                                        Marca {renderSortIcon('marca')}
                                                    </th>
                                                    <th className="sortable-th" onClick={() => handleSort('misura')}>
                                                        Misura {renderSortIcon('misura')}
                                                    </th>
                                                    <th className="sortable-th" onClick={() => handleSort('dot')}>
                                                        DOT {renderSortIcon('dot')}
                                                    </th>
                                                    <th className="sortable-th text-right" onClick={() => handleSort('quantita')} style={{ textAlign: 'right' }}>
                                                        Quantità {renderSortIcon('quantita')}
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sortedDetailItems.map((item, idx) => {
                                                    const misura = [
                                                        item.sezione ? (item.serie ? `${item.sezione}/${item.serie}` : item.sezione) : null,
                                                        item.diametro ? `R${item.diametro}` : null,
                                                        item.indiceVelocita || null
                                                    ].filter(Boolean).join(' ');

                                                    return (
                                                        <tr key={item.id || idx}>
                                                            <td>
                                                                <strong style={{ color: '#03a9f4', fontSize: '13px' }}>{item.codProdotto}</strong>
                                                            </td>
                                                            <td>
                                                                <div style={{ fontWeight: '500' }}>{item.scultura || item.descProdotto || '-'}</div>
                                                                {item.scultura && item.descProdotto && item.scultura !== item.descProdotto && (
                                                                    <small className="text-muted">{item.descProdotto}</small>
                                                                )}
                                                            </td>
                                                            <td>
                                                                {item.marca ? (
                                                                    <span className="badge" style={{ backgroundColor: '#e2e8f0', color: '#334155', fontSize: '11px', padding: '3px 8px', fontWeight: '600' }}>
                                                                        {item.marca}
                                                                    </span>
                                                                ) : '-'}
                                                            </td>
                                                            <td>
                                                                <span style={{ fontWeight: '500', color: '#475569' }}>{misura || '-'}</span>
                                                            </td>
                                                            <td>
                                                                {item.dot ? (
                                                                    <span style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#1e293b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                                                                        {item.dot}
                                                                    </span>
                                                                ) : '-'}
                                                            </td>
                                                            <td className="text-right">
                                                                <span style={{ fontWeight: '700', color: '#27ae60', fontSize: '14px' }}>
                                                                    {item.quantita} pz
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer" style={{ borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', backgroundColor: '#ffffff' }}>
                                <small className="text-muted" style={{ fontSize: '13px' }}>
                                    Articoli distinti: <strong>{detailItems.length}</strong>
                                </small>
                                <button 
                                    type="button" 
                                    className="btn btn-default btn-modal-close" 
                                    onClick={() => setShowDetailModal(false)}
                                >
                                    Chiudi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UbicazioniList;
