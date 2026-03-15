import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import SpeseIncassoService from '../../services/SpeseIncassoService';
import AliquoteIvaService from '../../services/AliquoteIvaService';
import { FaTrash, FaPencilAlt, FaPlus, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const SpeseIncassoManagementModal = ({ isOpen, onClose, onSave }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [aliquoteIva, setAliquoteIva] = useState([]);

    useEffect(() => {
        if (isOpen) {
            loadData();
            loadAliquote();
        }
    }, [isOpen, search]);

    const loadAliquote = async () => {
        try {
            const res = await AliquoteIvaService.getListForCombo();
            setAliquoteIva(res.data?.payload || []);
        } catch (error) {
            console.error("Errore caricamento aliquote", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await SpeseIncassoService.getList({ descrizione: search });
            if (response.data && response.data.payload) {
                setList(response.data.payload);
                setTotalItems(response.data.payload.length);
            } else {
                setList([]);
                setTotalItems(0);
            }
        } catch (error) {
            console.error("Error loading collection fees", error);
            setList([]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const handleEdit = (item) => {
        openDetailModal(item);
    };

    const handleAdd = () => {
        openDetailModal({ descrizione: '', importo: 0, idAliquotaIva: null });
    };

    const openDetailModal = (item) => {
        const isEdit = !!item.id;
        
        let selectOptions = aliquoteIva.map(a => `<option value="${a.id}" ${item.idAliquotaIva === a.id ? 'selected' : ''}>${a.codice} - ${a.descrizione}</option>`).join('');

        Swal.fire({
            title: isEdit ? 'Modifica Spesa Incasso' : 'Nuova Spesa Incasso',
            html: `
                <div style="text-align: left; padding: 10px 5px;">
                    <div class="form-group">
                        <label class="premium-swal-label">Descrizione</label>
                        <input id="swal-descrizione" class="form-control premium-swal-input" value="${item.descrizione || ''}">
                    </div>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="premium-swal-label">Importo (€)</label>
                                <input id="swal-importo" type="number" step="0.01" class="form-control premium-swal-input" value="${item.importo || 0}">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="premium-swal-label">Aliquota IVA</label>
                                <select id="swal-idAliquotaIva" class="form-control premium-swal-input">
                                    <option value="">-- Seleziona --</option>
                                    ${selectOptions}
                                </select>
                            </div>
                        </div>
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
                const descrizione = document.getElementById('swal-descrizione').value;
                const importo = document.getElementById('swal-importo').value;
                const idAliquotaIva = document.getElementById('swal-idAliquotaIva').value;

                if (!descrizione) {
                    Swal.showValidationMessage('La descrizione è obbligatoria');
                    return false;
                }

                try {
                    const data = {
                        ...item,
                        descrizione,
                        importo: Number(importo),
                        idAliquotaIva: idAliquotaIva ? Number(idAliquotaIva) : null
                    };
                    const res = await SpeseIncassoService.save(data);
                    if (res.data && res.data.errorText) {
                        Swal.showValidationMessage(res.data.errorText);
                        return false;
                    }
                    return res.data;
                } catch (error) {
                    Swal.showValidationMessage(error.response?.data?.errorText || 'Errore nel salvataggio');
                    return false;
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                loadData();
                if (onSave) onSave();
                Swal.fire({
                    icon: 'success',
                    title: isEdit ? 'Aggiornata!' : 'Creata!',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: { popup: 'premium-swal-popup', title: 'premium-swal-title' }
                });
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Sei sicuro?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla',
            buttonsStyling: false,
            customClass: {
                popup: 'premium-swal-popup',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await SpeseIncassoService.delete(id);
                    Swal.fire('Eliminata!', '', 'success');
                    loadData();
                    if (onSave) onSave();
                } catch (error) {
                    Swal.fire('Errore', error.response?.data?.errorText || 'Impossibile eliminare', 'error');
                }
            }
        });
    };

    const paginatedList = list.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content premium-modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Gestione Spese Incasso</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
                        <div className="row" style={{ marginBottom: '15px' }}>
                            <div className="col-md-6">
                                <input
                                    type="text"
                                    className="form-control input-sm"
                                    placeholder="Cerca..."
                                    value={search}
                                    onChange={handleSearch}
                                />
                            </div>
                            <div className="col-md-6 text-right">
                                <button type="button" className="btn btn-primary" onClick={handleAdd}>
                                    <FaPlus /> Aggiungi
                                </button>
                            </div>
                        </div>

                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th>DESCRIZIONE</th>
                                    <th className="text-right">IMPORTO</th>
                                    <th style={{ width: '120px', textAlign: 'center' }}>AZIONI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="3" className="text-center">Caricamento...</td></tr>
                                ) : paginatedList.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center">Nessun elemento trovato.</td></tr>
                                ) : (
                                    paginatedList.map(item => (
                                        <tr key={item.id}>
                                            <td>{item.descrizione}</td>
                                            <td className="text-right">{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(item.importo)}</td>
                                            <td className="text-center">
                                                <button type="button" className="btn btn-info btn-sm" style={{ marginRight: '5px' }} onClick={() => handleEdit(item)} title="Modifica">
                                                    <FaPencilAlt />
                                                </button>
                                                <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)} title="Elimina">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {totalPages > 1 && (
                            <div className="pagination-container" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                                <ul className="pagination" style={{ margin: 0 }}>
                                    <li className={page === 0 ? 'disabled' : ''}>
                                        <a href="#" onClick={(e) => { e.preventDefault(); if (page > 0) setPage(page - 1); }}><FaChevronLeft /></a>
                                    </li>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <li key={i} className={page === i ? 'active' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); setPage(i); }}>{i + 1}</a>
                                        </li>
                                    ))}
                                    <li className={page >= totalPages - 1 ? 'disabled' : ''}>
                                        <a href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages - 1) setPage(page + 1); }}><FaChevronRight /></a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpeseIncassoManagementModal;
