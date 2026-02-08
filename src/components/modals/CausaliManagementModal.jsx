import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import CausaliMovimentoArticoliService from '../../services/CausaliMovimentoArticoliService';
import { FaPencilAlt, FaTrash, FaPlus } from 'react-icons/fa';

const CausaliManagementModal = ({ onClose }) => {
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
                orderColumn: 1, // Sort by Descrizione
                orderDir: 'asc'
            };
            const res = await CausaliMovimentoArticoliService.getList(params);
            if (res.data) {
                setList(res.data.list || []);
                setTotalItems(res.data.totalCount || 0);
            }
        } catch (error) {
            console.error("Error loading causali:", error);
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
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await CausaliMovimentoArticoliService.delete(id);
                loadData();
                Swal.fire('Eliminata!', 'Causale eliminata.', 'success');
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
                <div style="text-align: left;">
                    <div class="form-group">
                        <label>Descrizione</label>
                        <input id="swal-descrizione" class="form-control" value="${item.descrizione || ''}" placeholder="Inserisci descrizione">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salva',
            cancelButtonText: 'Annulla',
            preConfirm: async () => {
                const descrizione = document.getElementById('swal-descrizione').value;

                if (!descrizione) {
                    Swal.showValidationMessage('La descrizione è obbligatoria');
                    return false;
                }

                try {
                    if (isNew) {
                        await CausaliMovimentoArticoliService.create(descrizione);
                    } else {
                        await CausaliMovimentoArticoliService.update(item.id, descrizione);
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
                Swal.fire('Salvata!', 'Operazione completata con successo.', 'success');
            }
        });
    };

    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
            <div className="modal-dialog modal-md">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose}>&times;</button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Gestione Causali Movimento</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto', padding: '25px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                            <button className="btn-premium-save" style={{ margin: 0, padding: '10px 20px', fontSize: '14px' }} onClick={handleAdd}>
                                <FaPlus style={{ marginRight: '8px' }} /> Nuova Causale
                            </button>
                            <div style={{ position: 'relative', flex: '0 0 250px' }}>
                                <input
                                    type="text"
                                    className="form-control"
                                    style={{ borderRadius: '10px', paddingRight: '35px', height: '40px' }}
                                    placeholder="Cerca causale..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                                <i className="fa fa-search" style={{ position: 'absolute', right: '12px', top: '12px', color: '#ccc' }}></i>
                            </div>
                        </div>

                        <div className="table-responsive" style={{ border: 'none' }}>
                            <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa' }}>
                                        <th style={{ border: 'none', borderRadius: '10px 0 0 10px', padding: '12px 15px' }}>DESCRIZIONE</th>
                                        <th style={{ border: 'none', borderRadius: '0 10px 10px 0', padding: '12px 15px', width: '120px', textAlign: 'center' }}>AZIONI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length > 0 ? (
                                        list.map(item => (
                                            <tr key={item.id} style={{ boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                                                <td style={{ border: 'none', padding: '15px', background: '#fff', borderRadius: '10px 0 0 10px' }}>{item.descrizione}</td>
                                                <td style={{ border: 'none', padding: '15px', background: '#fff', borderRadius: '0 10px 10px 0' }} className="text-center">
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                        <button
                                                            className="btn-premium-save"
                                                            style={{ padding: '8px', minWidth: '35px', margin: 0, boxShadow: 'none', backgroundColor: '#5bc0de' }}
                                                            onClick={() => handleEdit(item)}
                                                            title="Modifica"
                                                        >
                                                            <FaPencilAlt />
                                                        </button>
                                                        <button
                                                            className="btn-premium-cancel"
                                                            style={{ padding: '8px', minWidth: '35px', margin: 0, backgroundColor: '#e74c3c' }}
                                                            onClick={() => handleDelete(item.id)}
                                                            title="Elimina"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="text-center" style={{ padding: '30px', color: '#999' }}>Nessuna causale trovata</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {totalItems > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 10px' }}>
                                <small style={{ color: '#777' }}>Visualizzati {startIdx + 1} - {Math.min(startIdx + pageSize, totalItems)} di {totalItems}</small>
                                <nav>
                                    <ul className="pagination pagination-sm" style={{ margin: 0 }}>
                                        <li className={currentPage === 1 ? 'disabled' : ''}>
                                            <a href="#" style={{ borderRadius: '5px', margin: '0 2px' }} onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}>&laquo;</a>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => {
                                            if (totalPages > 10 && (i > 1 && i < totalPages - 2 && i !== currentPage - 1)) {
                                                if (i === 2 || i === totalPages - 3) return <li key={i} className="disabled"><span>...</span></li>;
                                                return null;
                                            }
                                            return <li key={i} className={currentPage === i + 1 ? 'active' : ''}>
                                                <a href="#" style={{ borderRadius: '5px', margin: '0 2px' }} onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>{i + 1}</a>
                                            </li>
                                        })}
                                        <li className={currentPage === totalPages ? 'disabled' : ''}>
                                            <a href="#" style={{ borderRadius: '5px', margin: '0 2px' }} onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}>&raquo;</a>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        )}

                    </div>
                    <div className="modal-footer" style={{ borderTop: '1px solid #f0f0f0', padding: '15px 25px' }}>
                        <button type="button" className="btn-premium-cancel" style={{ padding: '10px 25px' }} onClick={onClose}>Chiudi</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CausaliManagementModal;
