import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import CausaliEsigibilitaDifferitaService from '../../services/CausaliEsigibilitaDifferitaService';
import { FaEdit, FaTrash, FaPlus, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const CausaliEsigibilitaDifferitaManagementModal = ({ onClose }) => {
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        loadData();
    }, [currentPage, pageSize, searchTerm]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {
                search: searchTerm,
                start: (currentPage - 1) * pageSize,
                length: pageSize,
                'order[0][column]': 1, // Sort by Descrizione
                'order[0][dir]': 'asc'
            };
            const res = await CausaliEsigibilitaDifferitaService.getList(params);
            if (res.data) {
                setList(res.data.list || []);
                setTotalItems(res.data.totalCount || 0);
            }
        } catch (error) {
            console.error("Error loading causali esigibilità differita:", error);
            Swal.fire('Errore', 'Impossibile caricare le causali', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "La causale verrà eliminata.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla',
            buttonsStyling: false,
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm btn-danger',
                cancelButton: 'premium-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            try {
                await CausaliEsigibilitaDifferitaService.delete(id);
                loadData();
                Swal.fire({
                    title: 'Eliminata!',
                    text: 'Causale eliminata.',
                    icon: 'success',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'premium-swal-popup',
                        title: 'premium-swal-title',
                        confirmButton: 'premium-swal-confirm'
                    }
                });
            } catch (error) {
                Swal.fire('Errore', "Errore durante l'eliminazione", 'error');
            }
        }
    };

    const handleEdit = (item) => {
        openDetailModal(item);
    };

    const handleAdd = () => {
        openDetailModal({ id: null, descrizione: '' });
    };

    const openDetailModal = (item) => {
        const isNew = !item.id;
        Swal.fire({
            title: isNew ? 'Nuova Causale' : 'Modifica Causale',
            html: `
                <div style="text-align: left; padding: 10px 5px;">
                    <div class="form-group">
                        <label class="premium-swal-label">Descrizione</label>
                        <input id="swal-descrizione" class="form-control premium-swal-input" value="${item.descrizione || ''}" placeholder="Es. Esigibilità differita art. 7...">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salva',
            cancelButtonText: 'Annulla',
            buttonsStyling: false,
            customClass: {
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel',
                popup: 'premium-swal-popup',
                title: 'premium-swal-title'
            },
            preConfirm: async () => {
                const descrizione = document.getElementById('swal-descrizione').value;

                if (!descrizione) {
                    Swal.showValidationMessage('La descrizione è obbligatoria');
                    return false;
                }

                try {
                    if (isNew) {
                        await CausaliEsigibilitaDifferitaService.create(descrizione);
                    } else {
                        await CausaliEsigibilitaDifferitaService.update(item.id, descrizione);
                    }
                    return true;
                } catch (error) {
                    let errorMsg = 'Errore durante il salvataggio';
                    if (error.response && error.response.data && error.response.data.errorText) {
                        errorMsg = error.response.data.errorText;
                    }
                    Swal.showValidationMessage(errorMsg);
                    return false;
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                loadData();
                Swal.fire({
                    title: 'Salvata!',
                    text: 'Operazione completata con successo.',
                    icon: 'success',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'premium-swal-popup',
                        title: 'premium-swal-title',
                        confirmButton: 'premium-swal-confirm'
                    }
                });
            }
        });
    };

    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }} role="dialog">
            <div className="modal-dialog modal-lg">
                <div className="modal-content premium-modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title">Causali Esigibilità Differita</h4>
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body" style={{ padding: '25px' }}>
                        {/* Toolbar - Balanced Layout */}
                        <div className="modal-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px' }}>
                            <div className="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
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
                                <div className="toolbar-search-wrapper" style={{ flex: 1 }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cerca..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
                            <div className="toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <select
                                    className="form-control"
                                    style={{ width: '75px', height: '42px', borderRadius: '10px', fontSize: '0.9em', border: '1px solid #dfe4e7' }}
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                                <button className="btn btn-primary premium-btn" onClick={handleAdd} style={{ height: '42px', padding: '0 25px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}>
                                    <FaPlus /> Nuova
                                </button>
                            </div>
                        </div>

                        <div className="table-wrapper" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', borderRadius: '12px', border: '1px solid #eee' }}>
                            <table className="table table-striped table-hover" style={{ marginBottom: 0 }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                    <tr>
                                        <th style={{ padding: '15px' }}>DESCRIZIONE</th>
                                        <th style={{ width: '120px', textAlign: 'center', padding: '15px' }}>AZIONI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="2" className="text-center" style={{ padding: '40px' }}>Caricamento...</td></tr>
                                    ) : list.length > 0 ? (
                                        list.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ verticalAlign: 'middle', padding: '15px', fontWeight: '500' }}>{item.descrizione}</td>
                                                <td style={{ verticalAlign: 'middle', padding: '15px' }} className="text-center">
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                        <button className="btn btn-info btn-sm" onClick={() => handleEdit(item)} title="Modifica">
                                                            <FaEdit />
                                                        </button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)} title="Elimina">
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="text-center" style={{ padding: '40px', color: '#999' }}>Nessun elemento trovato</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Status Footer */}
                        <div className="status-footer" style={{ marginTop: '20px', padding: '12px 20px', backgroundColor: '#f8f9fa', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eee' }}>
                            <span className="pagination-info" style={{ color: '#666', fontSize: '0.85em', fontWeight: '500' }}>
                                <FaSearch style={{ marginRight: '8px', opacity: 0.5 }} />
                                Vista da <strong style={{ color: '#03a9f4' }}>{totalItems > 0 ? startIdx + 1 : 0}</strong> a <strong style={{ color: '#03a9f4' }}>{Math.min(startIdx + pageSize, totalItems)}</strong> di <strong style={{ color: '#03a9f4' }}>{totalItems}</strong> elementi
                            </span>
                            {totalPages > 1 && (
                                <nav>
                                    <ul className="pagination" style={{ margin: 0 }}>
                                        <li className={currentPage === 1 ? 'disabled' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}>
                                                <FaChevronLeft />
                                            </a>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <li key={i} className={currentPage === i + 1 ? 'active' : ''}>
                                                <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>{i + 1}</a>
                                            </li>
                                        ))}
                                        <li className={currentPage === totalPages ? 'disabled' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}>
                                                <FaChevronRight />
                                            </a>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-default" onClick={onClose}>Chiudi</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CausaliEsigibilitaDifferitaManagementModal;
