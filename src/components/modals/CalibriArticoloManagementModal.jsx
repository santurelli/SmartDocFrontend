import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ArticoliService from '../../services/ArticoliService';
import { FaPencilAlt, FaTrash, FaPlus, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const CalibriArticoloManagementModal = ({ onClose }) => {
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'descrizione', direction: 'asc' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await ArticoliService.getListCalibri({ descrizione: searchTerm });
            if (res.data && res.data.payload) {
                setList(res.data.payload);
            } else {
                setList([]);
            }
        } catch (error) {
            console.error("Error loading calibri:", error);
            Swal.fire({
                title: 'Errore',
                text: 'Impossibile caricare i calibri',
                icon: 'error',
                buttonsStyling: false,
                customClass: {
                    popup: 'premium-swal-popup',
                    title: 'premium-swal-title',
                    confirmButton: 'premium-swal-confirm'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Il calibro verrà eliminato.",
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
                const res = await ArticoliService.deleteCalibro(id);
                if (res.data && res.data.errorText) {
                    Swal.fire({
                        title: 'Errore',
                        text: res.data.errorText,
                        icon: 'error',
                        buttonsStyling: false,
                        customClass: {
                            popup: 'premium-swal-popup',
                            title: 'premium-swal-title',
                            confirmButton: 'premium-swal-confirm'
                        }
                    });
                } else {
                    loadData();
                    Swal.fire({
                        title: 'Eliminato!',
                        text: 'Calibro eliminato.',
                        icon: 'success',
                        buttonsStyling: false,
                        customClass: {
                            popup: 'premium-swal-popup',
                            title: 'premium-swal-title',
                            confirmButton: 'premium-swal-confirm'
                        }
                    });
                }
            } catch (error) {
                console.error("Delete error", error);
                const msg = error.response?.data?.errorText || 'Errore durante l\'eliminazione';
                Swal.fire({
                    title: 'Errore',
                    text: msg,
                    icon: 'error',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'premium-swal-popup',
                        title: 'premium-swal-title',
                        confirmButton: 'premium-swal-confirm'
                    }
                });
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
        Swal.fire({
            title: id ? 'Modifica Calibro' : 'Nuovo Calibro',
            html: `
                <div style="text-align: left; padding: 10px 5px;">
                    <div class="form-group">
                        <label class="premium-swal-label">Descrizione Calibro</label>
                        <input id="swal-descrizione" class="form-control premium-swal-input" placeholder="Es. 1, 2, 3, 4..." value="${existingDesc}">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salva',
            cancelButtonText: 'Annulla',
            showLoaderOnConfirm: true,
            buttonsStyling: false,
            width: 600,
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            },
            preConfirm: async () => {
                const value = document.getElementById('swal-descrizione').value;
                if (!value) {
                    Swal.showValidationMessage('La descrizione è obbligatoria');
                    return false;
                }
                try {
                    let res;
                    if (id) {
                        res = await ArticoliService.updateCalibro(id, { descrizione: value });
                    } else {
                        res = await ArticoliService.createCalibro({ descrizione: value });
                    }

                    if (res.data && res.data.errorText) {
                        Swal.showValidationMessage(res.data.errorText);
                        return false;
                    }
                    return res.data;
                } catch (error) {
                    const msg = error.response?.data?.errorText || 'Errore durante il salvataggio';
                    Swal.showValidationMessage(msg);
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                loadData();
            }
        });
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort style={{ marginLeft: '5px', opacity: 0.5 }} />;
        return sortConfig.direction === 'asc'
            ? <FaSortUp style={{ marginLeft: '5px' }} />
            : <FaSortDown style={{ marginLeft: '5px' }} />;
    };

    // Pagination & Search Logic
    const sortedList = [...list].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const valA = (a[sortConfig.key] || '').toLowerCase();
        const valB = (b[sortConfig.key] || '').toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredList = sortedList;

    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentItems = filteredList.slice(startIdx, startIdx + pageSize);

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1051 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header bg-primary" style={{ color: 'white', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
                        <button type="button" className="close" onClick={onClose} style={{ color: 'white', opacity: 0.8 }}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Elenco Calibri Articolo</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                            <div className="form-inline items-per-page" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span>Visualizza</span>
                                <select
                                    className="form-control input-sm"
                                    style={{ width: 'auto', display: 'inline-block' }}
                                    value={pageSize}
                                    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <span>elementi per pagina</span>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cerca..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        onKeyDown={(e) => { if (e.key === 'Enter') loadData(); }}
                                        style={{ paddingRight: '30px' }}
                                    />
                                    <i className="fa fa-search" style={{ position: 'absolute', right: '10px', top: '10px', color: '#ccc', cursor: 'pointer' }} onClick={loadData}></i>
                                </div>
                                <button className="btn btn-primary" onClick={handleAdd}>
                                    <FaPlus /> Aggiungi
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th
                                        style={{ verticalAlign: 'middle', cursor: 'pointer', userSelect: 'none' }}
                                        onClick={() => handleSort('descrizione')}
                                    >
                                        DESCRIZIONE {getSortIcon('descrizione')}
                                    </th>
                                    <th style={{ width: '120px', verticalAlign: 'middle', textAlign: 'center' }}>AZIONI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length > 0 ? (
                                    currentItems.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ verticalAlign: 'middle' }}>{item.descrizione}</td>
                                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                    <button className="btn btn-primary btn-sm" onClick={() => handleEdit(item)} title="Modifica">
                                                        <FaPencilAlt />
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
                                        <td colSpan="2" className="text-center">Nessun elemento trovato</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination Footer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', padding: '0 10px' }}>
                            <small style={{ color: '#777' }}>
                                Vista da {totalItems > 0 ? startIdx + 1 : 0} a {Math.min(startIdx + pageSize, totalItems)} di {totalItems} elementi
                            </small>
                            <nav>
                                <ul className="pagination pagination-sm" style={{ margin: '0' }}>
                                    <li className={currentPage === 1 ? 'disabled' : ''}>
                                        <a href="#" style={{ borderRadius: '5px', margin: '0 2px' }} onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}>
                                            <span>&laquo;</span>
                                        </a>
                                    </li>
                                    {totalPages > 0 && [...Array(totalPages)].map((_, i) => (
                                        <li key={i} className={currentPage === i + 1 ? 'active' : ''}>
                                            <a href="#" style={{ borderRadius: '5px', margin: '0 2px' }} onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>
                                                {i + 1}
                                            </a>
                                        </li>
                                    ))}
                                    <li className={currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}>
                                        <a href="#" style={{ borderRadius: '5px', margin: '0 2px' }} onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}>
                                            <span>&raquo;</span>
                                        </a>
                                    </li>
                                </ul>
                            </nav>
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

export default CalibriArticoloManagementModal;
