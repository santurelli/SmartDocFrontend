import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import UbicazioniService from '../../services/UbicazioniService';
import UbicazioneEditModal from './UbicazioneEditModal';
import { FaTrash, FaEdit, FaPlus, FaSearch, FaChevronLeft, FaChevronRight, FaWarehouse } from 'react-icons/fa';

const UbicazioniManagementModal = ({ isOpen = true, onClose, onSave, onSelect }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedUbicazione, setSelectedUbicazione] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, page, search]);

    if (!isOpen) return null;

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await UbicazioniService.getList({
                start: page * pageSize,
                length: pageSize,
                search: search
            });
            const data = res.data || {};
            setList(data.list || []);
            setTotalItems(data.totalCount || 0);
        } catch (error) {
            console.error("Errore caricamento ubicazioni", error);
            setList([]);
            setTotalItems(0);
            Swal.fire({
                icon: 'error',
                title: 'Errore Caricamento',
                text: 'Impossibile caricare le ubicazioni: ' + (error.response?.data?.errorText || error.message),
                customClass: {
                    popup: 'premium-swal-popup',
                    title: 'premium-swal-title'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const handleEdit = (item) => {
        setSelectedUbicazione(item);
        setEditModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedUbicazione(null);
        setEditModalOpen(true);
    };

    const handleDelete = (id, codUbicazione) => {
        Swal.fire({
            title: 'Sei sicuro?',
            text: `Vuoi eliminare l'ubicazione "${codUbicazione}"?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla',
            buttonsStyling: false,
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm btn-danger',
                cancelButton: 'premium-swal-cancel'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await UbicazioniService.delete(id);
                    Swal.fire({
                        icon: 'success',
                        title: 'Eliminata!',
                        text: 'L\'ubicazione è stata eliminata.',
                        timer: 1500,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'premium-swal-popup',
                            title: 'premium-swal-title'
                        }
                    });
                    loadData();
                    if (onSave) onSave();
                } catch (error) {
                    Swal.fire('Errore', 'Impossibile eliminare: ' + (error.response?.data?.errorText || error.message), 'error');
                }
            }
        });
    };

    const totalPages = Math.ceil(totalItems / pageSize);

    return ReactDOM.createPortal(
        <>
            <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }} tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content premium-modal-content">
                        <div className="modal-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', minHeight: 'unset' }}>
                            <h4 className="modal-title" style={{ fontWeight: 'bold', margin: 0, fontSize: '18px', lineHeight: 1.2 }}>
                                Gestione Ubicazioni
                            </h4>
                            <button type="button" className="close" onClick={onClose} aria-label="Close" style={{ margin: 0, padding: 0, lineHeight: 1, fontSize: '22px' }}>
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '25px' }}>
                            {/* Toolbar */}
                            <div className="modal-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px' }}>
                                <div className="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ 
                                        backgroundColor: '#e7f1ff', 
                                        width: '42px', 
                                        height: '42px', 
                                        borderRadius: '10px', 
                                        color: '#03a9f4',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <FaSearch style={{ fontSize: '1.2em' }} />
                                    </div>
                                    <div className="toolbar-search-wrapper" style={{ minWidth: '320px' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Cerca per codice o descrizione..."
                                            value={search}
                                            onChange={handleSearch}
                                            style={{ 
                                                height: '42px',
                                                paddingLeft: '15px', 
                                                borderRadius: '10px', 
                                                border: '1px solid #dfe4e7', 
                                                boxShadow: 'none' 
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="toolbar-right">
                                    <button 
                                        className="btn btn-primary premium-btn" 
                                        onClick={handleAdd} 
                                        style={{ height: '42px', padding: '0 25px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}
                                    >
                                        <FaPlus /> Nuova Ubicazione
                                    </button>
                                </div>
                            </div>

                            {/* Tabella */}
                            <div className="table-responsive" style={{ border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden' }}>
                                <table className="table" style={{ marginBottom: 0 }}>
                                    <thead style={{ backgroundColor: '#f8f9fa' }}>
                                        <tr>
                                            <th style={{ width: '150px' }}>Codice</th>
                                            <th>Descrizione</th>
                                            <th style={{ width: '180px' }}>Corsia / Rip. / Liv.</th>
                                            <th>Note</th>
                                            <th style={{ width: '100px', textAlign: 'center' }}>Azioni</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="5" className="text-center" style={{ padding: '30px' }}>
                                                    Caricamento ubicazioni in corso...
                                                </td>
                                            </tr>
                                        ) : list.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center" style={{ padding: '30px', color: '#999' }}>
                                                    Nessuna ubicazione trovata
                                                </td>
                                            </tr>
                                        ) : (
                                            list.map((item) => (
                                                <tr key={item.id}>
                                                    <td style={{ verticalAlign: 'middle' }}>
                                                        <strong style={{ color: '#03a9f4', fontSize: '14px' }}>
                                                            {item.codUbicazione}
                                                        </strong>
                                                    </td>
                                                    <td style={{ verticalAlign: 'middle', fontWeight: 500 }}>
                                                        {item.descrizione || '-'}
                                                    </td>
                                                    <td style={{ verticalAlign: 'middle', fontSize: '13px', color: '#555' }}>
                                                        {[
                                                            item.corsia && `Corsia: ${item.corsia}`,
                                                            item.ripiano && `Rip.: ${item.ripiano}`,
                                                            item.livello && `Liv.: ${item.livello}`
                                                        ].filter(Boolean).join(' | ') || '-'}
                                                    </td>
                                                    <td style={{ verticalAlign: 'middle', fontSize: '13px', color: '#777' }}>
                                                        {item.note || '-'}
                                                    </td>
                                                    <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                            <button
                                                                className="btn btn-sm btn-default"
                                                                onClick={() => handleEdit(item)}
                                                                title="Modifica"
                                                                style={{ padding: '5px 10px', borderRadius: '6px' }}
                                                            >
                                                                <FaEdit style={{ color: '#03a9f4' }} />
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-default"
                                                                onClick={() => handleDelete(item.id, item.codUbicazione)}
                                                                title="Elimina"
                                                                style={{ padding: '5px 10px', borderRadius: '6px' }}
                                                            >
                                                                <FaTrash style={{ color: '#e74c3c' }} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Paginazione */}
                            {totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
                                    <div style={{ color: '#777', fontSize: '13px' }}>
                                        Totale ubicazioni: {totalItems}
                                    </div>
                                    <ul className="pagination" style={{ margin: 0 }}>
                                        <li className={page === 0 ? 'disabled' : ''}>
                                            <a href="#!" onClick={(e) => { e.preventDefault(); if (page > 0) setPage(page - 1); }}>
                                                <FaChevronLeft />
                                            </a>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <li key={i} className={page === i ? 'active' : ''}>
                                                <a href="#!" onClick={(e) => { e.preventDefault(); setPage(i); }}>
                                                    {i + 1}
                                                </a>
                                            </li>
                                        ))}
                                        <li className={page === totalPages - 1 ? 'disabled' : ''}>
                                            <a href="#!" onClick={(e) => { e.preventDefault(); if (page < totalPages - 1) setPage(page + 1); }}>
                                                <FaChevronRight />
                                            </a>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer" style={{ borderTop: '1px solid #eee', padding: '15px 25px' }}>
                            <button type="button" className="btn btn-default" onClick={onClose} style={{ borderRadius: '8px', padding: '8px 20px' }}>
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modale Modifica/Nuova Ubicazione */}
            <UbicazioneEditModal
                isOpen={editModalOpen}
                ubicazione={selectedUbicazione}
                onClose={() => setEditModalOpen(false)}
                onSave={() => {
                    loadData();
                    if (onSave) onSave();
                }}
            />
        </>,
        document.body
    );
};

export default UbicazioniManagementModal;
