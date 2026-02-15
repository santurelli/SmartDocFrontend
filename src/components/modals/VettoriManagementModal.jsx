import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import VettoriService from '../../services/VettoriService';
import { FaPencilAlt, FaTrash, FaPlus } from 'react-icons/fa';

const VettoriManagementModal = ({ onClose }) => {
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await VettoriService.getAll();
            if (res.data && res.data.list && Array.isArray(res.data.list)) {
                setList(res.data.list);
            } else if (res.data && Array.isArray(res.data)) {
                setList(res.data);
            } else {
                setList([]);
            }
        } catch (error) {
            console.error("Error loading vettori:", error);
            Swal.fire('Errore', 'Impossibile caricare i vettori', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Il vettore verrà eliminato.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await VettoriService.delete(id);
                loadData();
                Swal.fire('Eliminato!', 'Vettore eliminato.', 'success');
            } catch (error) {
                Swal.fire('Errore', "Errore durante l'eliminazione", 'error');
            }
        }
    };

    const handleEdit = (item) => {
        openDetailModal(item.id, item.descrizione);
    };

    const handleAdd = () => {
        openDetailModal(null, '');
    };

    const openDetailModal = (id, existingDesc) => {
        const isNew = !id;
        Swal.fire({
            title: isNew ? 'Nuovo Vettore' : 'Modifica Vettore',
            html: `
                <div style="text-align: left;">
                    <div class="form-group">
                        <label>Nome Vettore / Ragione Sociale</label>
                        <input id="swal-descrizione" class="form-control" value="${existingDesc || ''}" placeholder="Es. Bartolini, GLS...">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salva',
            cancelButtonText: 'Annulla',
            preConfirm: async () => {
                const value = document.getElementById('swal-descrizione').value;
                if (!value) {
                    Swal.showValidationMessage('La descrizione è obbligatoria');
                    return false;
                }
                try {
                    if (id) {
                        await VettoriService.update(id, { description: value, descrizione: value });
                    } else {
                        await VettoriService.insert({ description: value, descrizione: value });
                    }
                    return true;
                } catch (error) {
                    Swal.showValidationMessage('Errore durante il salvataggio');
                    return false;
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                loadData();
                Swal.fire('Salvato!', 'Operazione completata con successo.', 'success');
            }
        });
    };

    const filteredList = list.filter(item =>
        item.descrizione && item.descrizione.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentItems = filteredList.slice(startIdx, startIdx + pageSize);

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
            <div className="modal-dialog modal-md">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title">Gestione Vettori</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                        <div className="modal-toolbar">
                            <div className="toolbar-left">
                                <div className="toolbar-item">
                                    <span>Mostra</span>
                                    <select
                                        className="form-control input-sm"
                                        value={pageSize}
                                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    >
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                    <span>righe</span>
                                </div>
                            </div>

                            <div className="toolbar-right">
                                <div className="toolbar-search-wrapper">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cerca..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                    <i className="fa fa-search"></i>
                                </div>
                                <button className="btn btn-primary" onClick={handleAdd}>
                                    <FaPlus /> Nuovo
                                </button>
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
                                    {currentItems.length > 0 ? (
                                        currentItems.map(item => (
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
                                            <td colSpan="2" className="text-center" style={{ padding: '30px', color: '#999' }}>Nessun elemento trovato</td>
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

export default VettoriManagementModal;
