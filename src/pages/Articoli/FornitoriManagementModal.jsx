import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import FornitoriService from '../../services/FornitoriService';
import { FaPencilAlt, FaTrash, FaPlus } from 'react-icons/fa';

const FornitoriManagementModal = ({ onClose }) => {
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10); // Default to smaller page size for modal
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        loadData();
    }, [currentPage, pageSize, searchTerm]); // Reload on pagination/search change

    const loadData = async () => {
        setLoading(true);
        try {
            // Use getList which supports pagination and search
            const params = {
                search: searchTerm,
                start: (currentPage - 1) * pageSize,
                length: pageSize,
                orderColumn: 1, // Sort by Denominazione by default
                orderDir: 'asc'
            };
            const res = await FornitoriService.getList(params);
            if (res.data) {
                setList(res.data.list || []);
                setTotalItems(res.data.totalCount || 0);
            }
        } catch (error) {
            console.error("Error loading fornitori:", error);
            Swal.fire('Errore', 'Impossibile caricare i fornitori', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Il fornitore verrà eliminato.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await FornitoriService.delete(id);
                loadData();
                Swal.fire('Eliminato!', 'Fornitore eliminato.', 'success');
            } catch (error) {
                Swal.fire('Errore', "Errore durante l'eliminazione", 'error');
            }
        }
    };

    const handleEdit = (item) => {
        openDetailModal(item);
    };

    const handleAdd = async () => {
        // Fetch new code before opening modal
        try {
            const resCode = await FornitoriService.generateCodice();
            const newCode = resCode.data?.payload || '';
            openDetailModal({ id: null, codice: newCode, denominazione: '' });
        } catch (e) {
            console.error("Error generating code", e);
            openDetailModal({ id: null, codice: '', denominazione: '' });
        }
    };

    const openDetailModal = (item) => {
        const isNew = !item.id;
        Swal.fire({
            title: isNew ? 'Nuovo Fornitore' : 'Modifica Fornitore',
            html: `
                <div style="text-align: left;">
                     <div class="form-group">
                        <label>Codice</label>
                        <input id="swal-codice" class="form-control" value="${item.codice || ''}" ${isNew ? '' : 'disabled'}>
                    </div>
                    <div class="form-group">
                        <label>Denominazione</label>
                        <input id="swal-denominazione" class="form-control" value="${item.denominazione || ''}" placeholder="Inserisci denominazione">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salva',
            cancelButtonText: 'Annulla',
            preConfirm: async () => {
                const codice = document.getElementById('swal-codice').value;
                const denominazione = document.getElementById('swal-denominazione').value;

                if (!codice || !denominazione) {
                    Swal.showValidationMessage('Tutti i campi sono obbligatori');
                    return false;
                }

                const data = { ...item, codice, denominazione };

                try {
                    if (isNew) {
                        // Minimal insert, other fields null
                        await FornitoriService.insert(data);
                    } else {
                        await FornitoriService.update(item.id, data);
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
                Swal.fire('Salvato!', 'Operazione completata con successo.', 'success');
            }
        });
    };

    // Calculate pagination details
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;

    return (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose}>&times;</button>
                        <h4 className="modal-title">Gestione Fornitori</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
                        {/* Toolbar */}
                        <div className="row" style={{ marginBottom: '15px' }}>
                            <div className="col-md-6">
                                <button className="btn btn-primary" onClick={handleAdd}>
                                    <FaPlus /> Nuovo Fornitore
                                </button>
                            </div>
                            <div className="col-md-6">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Cerca..."
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                />
                            </div>
                        </div>

                        {/* Table */}
                        <div className="table-responsive">
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>Codice</th>
                                        <th>Denominazione</th>
                                        <th style={{ width: '100px', textAlign: 'center' }}>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {list.length > 0 ? (
                                        list.map(item => (
                                            <tr key={item.id}>
                                                <td>{item.codice}</td>
                                                <td>{item.denominazione}</td>
                                                <td className="text-center">
                                                    <button className="btn btn-info btn-xs" style={{ marginRight: '5px' }} onClick={() => handleEdit(item)}>
                                                        <FaPencilAlt />
                                                    </button>
                                                    <button className="btn btn-danger btn-xs" onClick={() => handleDelete(item.id)}>
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="text-center">Nessun fornitore trovato</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalItems > 0 && (
                            <div className="row">
                                <div className="col-md-6">
                                    <small>Visualizzati {startIdx + 1} - {Math.min(startIdx + pageSize, totalItems)} di {totalItems}</small>
                                </div>
                                <div className="col-md-6 text-right">
                                    <nav>
                                        <ul className="pagination pagination-sm" style={{ margin: 0 }}>
                                            <li className={currentPage === 1 ? 'disabled' : ''}>
                                                <a href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}>&laquo;</a>
                                            </li>
                                            {[...Array(totalPages)].map((_, i) => {
                                                // Simple pagination logic, showing mostly all or simplified
                                                if (totalPages > 10 && (i > 2 && i < totalPages - 3 && i !== currentPage - 1)) return null;
                                                // Just simple for now
                                                return <li key={i} className={currentPage === i + 1 ? 'active' : ''}>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>{i + 1}</a>
                                                </li>
                                            })}
                                            <li className={currentPage === totalPages ? 'disabled' : ''}>
                                                <a href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}>&raquo;</a>
                                            </li>
                                        </ul>
                                    </nav>
                                </div>
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

export default FornitoriManagementModal;
