import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import MarcheService from '../../services/MarcheService';
import MarcaEditModal from './MarcaEditModal';
import { FaTrash, FaEdit, FaPlus, FaSearch, FaChevronLeft, FaChevronRight, FaSortUp, FaSortDown, FaSort } from 'react-icons/fa';

const MarcheManagementModal = ({ isOpen = true, onClose, onSave, onSelect }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [sortConfig, setSortConfig] = useState({ key: 'descrizione', direction: 'asc' });

    // State for the dedicated React Edit Modal
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [selectedMarca, setSelectedMarca] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, page, search, sortConfig]);

    if (!isOpen) return null;

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await MarcheService.getAll({
                search: search,
                start: page * pageSize,
                length: pageSize,
                orderColumn: sortConfig.key === 'codice' ? 0 : 1,
                orderDir: sortConfig.direction
            });
            if (response && response.list) {
                setList(response.list);
                setTotalItems(response.totalCount || response.list.length);
            } else {
                setList([]);
                setTotalItems(0);
            }
        } catch (error) {
            console.error("Errore caricamento marche", error);
            setList([]);
            Swal.fire({
                icon: 'error',
                title: 'Errore Caricamento',
                text: 'Impossibile caricare le marche: ' + (error.response?.data?.errorText || error.message),
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

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort style={{ color: '#ccc' }} />;
        return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    const handleEdit = (item) => {
        setSelectedMarca(item);
        setEditModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedMarca(null);
        setEditModalOpen(true);
    };

    const handleDelete = (id, descrizione) => {
        Swal.fire({
            title: 'Sei sicuro?',
            text: `Vuoi eliminare la marca "${descrizione}"?`,
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
                    await MarcheService.delete(id);
                    Swal.fire({
                        icon: 'success',
                        title: 'Eliminata!',
                        text: 'La marca è stata eliminata.',
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
            <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-lg" role="document">
                    <div className="modal-content premium-modal-content">
                        <div className="modal-header">
                            <h4 className="modal-title">Gestione Marche</h4>
                            <button type="button" className="close" onClick={onClose} aria-label="Close">
                                <span aria-hidden="true">&times;</span>
                            </button>
                        </div>
                        <div className="modal-body" style={{ padding: '25px' }}>
                            {/* Toolbar - Balanced Layout identico ad Aliquote IVA */}
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
                                    <div className="toolbar-search-wrapper" style={{ minWidth: '350px' }}>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Cerca..."
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
                                    <button className="btn btn-primary premium-btn" onClick={handleAdd} style={{ height: '42px', padding: '0 25px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}>
                                        <FaPlus /> Nuova Marca
                                    </button>
                                </div>
                            </div>

                            {/* Table */}
                            <div className="table-wrapper" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', borderRadius: '12px', border: '1px solid #eee' }}>
                                <table className="table table-striped table-hover" style={{ marginBottom: 0 }}>
                                    <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                        <tr>
                                            <th style={{ cursor: 'pointer', padding: '15px' }} onClick={() => handleSort('descrizione')}>
                                                MARCA {getSortIcon('descrizione')}
                                            </th>
                                            <th style={{ width: '45%', padding: '15px' }}>NOTE</th>
                                            <th style={{ width: '120px', textAlign: 'center', padding: '15px' }}>AZIONI</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="3" className="text-center" style={{ padding: '40px' }}>Caricamento...</td></tr>
                                        ) : list.length === 0 ? (
                                            <tr><td colSpan="3" className="text-center" style={{ padding: '40px' }}>Nessuna marca trovata.</td></tr>
                                        ) : (
                                            list.map(item => (
                                                <tr key={item.id}>
                                                    <td style={{ verticalAlign: 'middle', padding: '15px', fontWeight: '600' }}>
                                                        {item.descrizione}
                                                    </td>
                                                    <td style={{ verticalAlign: 'middle', padding: '15px', color: '#666' }}>
                                                        {item.note || '-'}
                                                    </td>
                                                    <td className="text-center" style={{ verticalAlign: 'middle', padding: '15px' }}>
                                                        <button className="btn btn-info btn-sm" style={{ marginRight: '8px' }} onClick={() => handleEdit(item)} title="Modifica">
                                                            <FaEdit />
                                                        </button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id, item.descrizione)} title="Elimina">
                                                            <FaTrash />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Status Bar with Pagination */}
                            <div className="status-footer" style={{ marginTop: '20px', padding: '12px 20px', backgroundColor: '#f8f9fa', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eee' }}>
                                <span className="pagination-info" style={{ color: '#666', fontSize: '0.85em', fontWeight: '500' }}>
                                    <FaSearch style={{ marginRight: '8px', opacity: 0.5 }} />
                                    Visualizzati <strong style={{ color: '#03a9f4' }}>{list.length}</strong> di <strong style={{ color: '#03a9f4' }}>{totalItems}</strong> risultati
                                </span>
                                {totalPages > 1 && (
                                    <nav>
                                        <ul className="pagination" style={{ margin: 0 }}>
                                            <li className={page === 0 ? 'disabled' : ''}>
                                                <a href="#" onClick={(e) => { e.preventDefault(); if (page > 0) setPage(page - 1); }}>
                                                    <FaChevronLeft />
                                                </a>
                                            </li>
                                            {[...Array(totalPages)].map((_, i) => {
                                                if (totalPages > 10) {
                                                    if (i > 0 && i < totalPages - 1 && (i < page - 2 || i > page + 2)) {
                                                        if (i === page - 3 || i === page + 3) return <li key={i} className="disabled"><span>...</span></li>;
                                                        return null;
                                                    }
                                                }
                                                return (
                                                    <li key={i} className={page === i ? 'active' : ''}>
                                                        <a href="#" onClick={(e) => { e.preventDefault(); setPage(i); }}>
                                                            {i + 1}
                                                        </a>
                                                    </li>
                                                );
                                            })}
                                            <li className={page >= totalPages - 1 ? 'disabled' : ''}>
                                                <a href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages - 1) setPage(page + 1); }}>
                                                    <FaChevronRight />
                                                </a>
                                            </li>
                                        </ul>
                                    </nav>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dedicated React Edit Modal: No SweetAlert HTML */}
            <MarcaEditModal
                isOpen={editModalOpen}
                marca={selectedMarca}
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

export default MarcheManagementModal;
