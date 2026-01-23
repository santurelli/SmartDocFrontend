import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import SottoCategorieService from '../../services/SottoCategorieService';
import CategorieArticoliService from '../../services/CategorieArticoliService';
import { FaPencilAlt, FaTrash, FaPlus, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const SottoCategorieManagementModal = ({ onClose }) => {
    const [list, setList] = useState([]);
    const [categories, setCategories] = useState([]);
    const [filterCategory, setFilterCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'descrizione', direction: 'asc' });

    useEffect(() => {
        loadData();
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const res = await CategorieArticoliService.getListForCombo();
            setCategories(res.data.payload || []);
        } catch (error) {
            console.error("Error loading categories:", error);
        }
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await SottoCategorieService.getList({
                parentId: filterCategory || null,
                descrizione: null
            });
            if (res.data && res.data.payload) {
                setList(res.data.payload);
            } else {
                setList([]);
            }
        } catch (error) {
            console.error("Error loading sottocategorie:", error);
            Swal.fire('Errore', 'Impossibile caricare le sottocategorie', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "La sottocategoria verrà eliminata.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                const res = await SottoCategorieService.delete(id);
                if (res.data && res.data.errorText) {
                    Swal.fire('Errore', res.data.errorText, 'error');
                } else {
                    loadData();
                    Swal.fire('Eliminato!', 'Sottocategoria eliminata.', 'success');
                }
            } catch (error) {
                console.error("Delete error", error);
                const msg = error.response?.data?.errorText || 'Errore durante l\'eliminazione';
                Swal.fire('Errore', msg, 'error');
            }
        }
    };

    const handleEdit = (item) => {
        openDetailModal(item.id, item.parentId, item.descrizione);
    };

    const handleAdd = () => {
        openDetailModal(null, filterCategory || '', '');
    };

    const openDetailModal = (id, existingParentId, existingDesc) => {
        Swal.fire({
            title: id ? 'Modifica Sottocategoria' : 'Nuova Sottocategoria',
            html: `
                <div style="text-align: left;">
                    <div class="form-group">
                        <label style="font-weight: bold;">Categoria Padre:</label>
                        <select id="swal-parent-id" class="form-control" ${id ? 'disabled' : ''}>
                            <option value="">Seleziona...</option>
                            ${categories.map(c => `
                                <option value="${c.id}" ${Number(c.id) === Number(existingParentId) ? 'selected' : ''}>
                                    ${c.descrizione}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group" style="margin-top: 15px;">
                        <label style="font-weight: bold;">Descrizione:</label>
                        <input id="swal-descrizione" class="form-control" placeholder="Descrizione" value="${existingDesc}">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salva',
            cancelButtonText: 'Annulla',
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                const parentId = document.getElementById('swal-parent-id').value;
                const descrizione = document.getElementById('swal-descrizione').value;
                if (!parentId || !descrizione) {
                    Swal.showValidationMessage('Tutti i campi sono obbligatori');
                    return false;
                }
                try {
                    let res;
                    if (id) {
                        res = await SottoCategorieService.update(id, { parentId, descrizione });
                    } else {
                        res = await SottoCategorieService.create({ parentId, descrizione });
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

    const filteredList = sortedList.filter(item =>
        item.descrizione?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterCategory === '' || Number(item.parentId) === Number(filterCategory))
    );

    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentItems = filteredList.slice(startIdx, startIdx + pageSize);

    return (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Elenco sottocategorie</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
                        {/* Toolbar */}
                        <div className="row" style={{ marginBottom: '15px' }}>
                            <div className="col-md-3">
                                <select
                                    className="form-control input-sm"
                                    value={filterCategory}
                                    onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="">Tutte le categorie</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.descrizione}</option>)}
                                </select>
                            </div>
                            <div className="col-md-3 form-inline">
                                <label style={{ fontWeight: 'normal' }}>Righe:
                                    <select
                                        className="form-control input-sm"
                                        style={{ margin: '0 5px', width: 'auto', display: 'inline-block' }}
                                        value={pageSize}
                                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    >
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </label>
                            </div>
                            <div className="col-md-6 text-right form-inline">
                                <div className="form-group" style={{ display: 'inline-block', marginRight: '10px' }}>
                                    <input
                                        type="text"
                                        className="form-control input-sm"
                                        placeholder="Cerca..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={handleAdd}>
                                    <FaPlus /> Aggiungi
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <table className="table table-striped table-bordered table-hover">
                            <thead>
                                <tr>
                                    <th
                                        style={{ verticalAlign: 'middle', cursor: 'pointer', userSelect: 'none' }}
                                        onClick={() => handleSort('parentDescription')}
                                    >
                                        CATEGORIA {getSortIcon('parentDescription')}
                                    </th>
                                    <th
                                        style={{ verticalAlign: 'middle', cursor: 'pointer', userSelect: 'none' }}
                                        onClick={() => handleSort('descrizione')}
                                    >
                                        SOTTOCATEGORIA {getSortIcon('descrizione')}
                                    </th>
                                    <th style={{ width: '120px', verticalAlign: 'middle', textAlign: 'center' }}>AZIONI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="3" className="text-center">Caricamento...</td></tr>
                                ) : currentItems.length === 0 ? (
                                    <tr><td colSpan="3" className="text-center">Nessun elemento trovato</td></tr>
                                ) : (
                                    currentItems.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ verticalAlign: 'middle' }}>{item.parentDescription}</td>
                                            <td style={{ verticalAlign: 'middle' }}>{item.descrizione}</td>
                                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
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

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="text-center">
                                <ul className="pagination pagination-sm" style={{ margin: 0 }}>
                                    <li className={currentPage === 1 ? 'disabled' : ''}>
                                        <a href="#!" onClick={() => setCurrentPage(1)}>&laquo;</a>
                                    </li>
                                    {[...Array(totalPages)].map((_, i) => (
                                        <li key={i + 1} className={currentPage === i + 1 ? 'active' : ''}>
                                            <a href="#!" onClick={() => setCurrentPage(i + 1)}>{i + 1}</a>
                                        </li>
                                    ))}
                                    <li className={currentPage === totalPages ? 'disabled' : ''}>
                                        <a href="#!" onClick={() => setCurrentPage(totalPages)}>&raquo;</a>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-default" onClick={onClose}>Chiudi</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SottoCategorieManagementModal;
