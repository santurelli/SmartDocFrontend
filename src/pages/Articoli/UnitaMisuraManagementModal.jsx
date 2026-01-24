import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import UnitaMisuraService from '../../services/UnitaMisuraService';
import { FaTrash, FaPencilAlt, FaPlus, FaTimes, FaSearch, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const UnitaMisuraManagementModal = ({ onClose }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    // const [isEditing, setIsEditing] = useState(false); // No longer needed for modal approach
    // const [editId, setEditId] = useState(null);
    // const [editDescrizione, setEditDescrizione] = useState('');

    useEffect(() => {
        loadData();
    }, [page, search]);

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await UnitaMisuraService.getList({
                descrizione: search,
                start: page * pageSize,
                length: pageSize
            });
            if (response.data && response.data.payload) {
                setList(response.data.payload);
                if (response.data.payload.length > 0) {
                    setTotalItems(response.data.payload[0].total || response.data.payload.length);
                } else {
                    setTotalItems(0);
                }
            } else {
                setList([]);
                setTotalItems(0);
            }
        } catch (error) {
            console.error("Error loading units", error);
            setList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const handleEdit = (item) => {
        openDetailModal(item.id, item.descrizione);
    };

    const handleAdd = () => {
        openDetailModal(null, '');
    };

    const openDetailModal = (id, existingDesc) => {
        Swal.fire({
            title: id ? 'Modifica Unità di Misura' : 'Nuova Unità di Misura',
            html: `
                <div style="text-align: left; padding: 10px 5px;">
                    <div class="form-group">
                        <label class="premium-swal-label">Descrizione</label>
                        <input id="swal-descrizione" class="form-control premium-swal-input" placeholder="Es. KG, PZ..." value="${existingDesc}">
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
                        res = await UnitaMisuraService.update(id, { descrizione: value });
                    } else {
                        res = await UnitaMisuraService.create({ descrizione: value });
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
                Swal.fire({
                    icon: 'success',
                    title: id ? 'Aggiornata!' : 'Creata!',
                    text: id ? 'Unità di misura aggiornata.' : 'Unità di misura creata.',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'premium-swal-popup',
                        title: 'premium-swal-title'
                    }
                });
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Sei sicuro?',
            text: "Non potrai annullare questa operazione!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await UnitaMisuraService.delete(id);
                    Swal.fire(
                        'Eliminata!',
                        'L\'unità di misura è stata eliminata.',
                        'success'
                    );
                    loadData();
                } catch (error) {
                    Swal.fire('Errore', 'Impossibile eliminare: ' + (error.response?.data?.errorText || error.message), 'error');
                }
            }
        });
    };

    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content premium-modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Gestione Unità di Misura</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
                        <div className="row" style={{ marginBottom: '15px' }}>
                            <div className="col-md-6">
                            </div>
                            <div className="col-md-6 text-right form-inline">
                                <div className="form-group" style={{ display: 'inline-block', marginRight: '10px' }}>
                                    <input
                                        type="text"
                                        className="form-control input-sm"
                                        placeholder="Cerca..."
                                        value={search}
                                        onChange={handleSearch}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={handleAdd}>
                                    <FaPlus /> Aggiungi
                                </button>
                            </div>
                        </div>

                        <table className="table table-striped table-bordered table-hover">
                            <thead>
                                <tr>
                                    <th>DESCRIZIONE</th>
                                    <th style={{ width: '120px', textAlign: 'center' }}>AZIONI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="2" className="text-center">Caricamento...</td>
                                    </tr>
                                ) : list.length === 0 ? (
                                    <tr>
                                        <td colSpan="2" className="text-center">Nessuna unità di misura trovata.</td>
                                    </tr>
                                ) : (
                                    list.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                {item.descrizione}
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-info btn-sm" style={{ marginRight: '5px' }} onClick={() => handleEdit(item)} title="Modifica">
                                                    <FaPencilAlt />
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)} title="Elimina">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        <div className="pagination-container" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="pagination-info" style={{ color: '#888', fontSize: '0.9em' }}>
                                Visualizzati {list.length} di {totalItems} risultati
                            </span>
                            {totalPages > 1 && (
                                <nav>
                                    <ul className="pagination">
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
    );
};

export default UnitaMisuraManagementModal;
