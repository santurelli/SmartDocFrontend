import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import TipiPortoService from '../../services/TipiPortoService';
import { FaPencilAlt, FaTrash, FaPlus } from 'react-icons/fa';

const TipiPortoManagementModal = ({ onClose }) => {
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await TipiPortoService.getAll();
            if (res.data && res.data.list && Array.isArray(res.data.list)) {
                setList(res.data.list);
            } else if (res.data && Array.isArray(res.data)) {
                setList(res.data);
            } else {
                setList([]);
            }
        } catch (error) {
            console.error("Error loading tipi porto:", error);
            Swal.fire('Errore', 'Impossibile caricare i tipi porto', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Il tipo porto verrà eliminato.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await TipiPortoService.delete(id);
                loadData();
                Swal.fire('Eliminato!', 'Tipo porto eliminato.', 'success');
            } catch (error) {
                Swal.fire('Errore', 'Errore durante l\'eliminazione', 'error');
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
            title: id ? 'Modifica Tipo Porto' : 'Nuovo Tipo Porto',
            input: 'text',
            inputValue: existingDesc,
            showCancelButton: true,
            confirmButtonText: 'Salva',
            cancelButtonText: 'Annulla',
            inputValidator: (value) => {
                if (!value) {
                    return 'Inserisci una descrizione!';
                }
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    if (id) {
                        await TipiPortoService.update(id, { description: result.value, descrizione: result.value });
                    } else {
                        await TipiPortoService.insert({ description: result.value, descrizione: result.value });
                    }
                    loadData();
                } catch (error) {
                    Swal.fire('Errore', 'Errore durante il salvataggio', 'error');
                }
            }
        });
    };

    // Pagination & Search Logic
    const filteredList = list.filter(item =>
        item.descrizione && item.descrizione.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentItems = filteredList.slice(startIdx, startIdx + pageSize);

    return (
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Gestione Tipi Porto</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto' }}>
                        {/* Toolbar */}
                        <div className="row" style={{ marginBottom: '15px' }}>
                            <div className="col-md-6 form-inline">
                                <label style={{ fontWeight: 'normal' }}>Mostra
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
                                    righe per pagina</label>
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
                                    <th style={{ verticalAlign: 'middle' }}>DESCRIZIONE</th>
                                    <th style={{ width: '120px', verticalAlign: 'middle', textAlign: 'center' }}>AZIONI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.length > 0 ? (
                                    currentItems.map(item => (
                                        <tr key={item.id}>
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
                                ) : (
                                    <tr>
                                        <td colSpan="2" className="text-center">Nessun elemento trovato</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination Footer */}
                        <div className="row" style={{ marginTop: '15px' }}>
                            <div className="col-md-6">
                                <div style={{ paddingTop: '8px' }}>
                                    Vista da {totalItems > 0 ? startIdx + 1 : 0} a {Math.min(startIdx + pageSize, totalItems)} di {totalItems} elementi
                                </div>
                            </div>
                            <div className="col-md-6 text-right">
                                <nav>
                                    <ul className="pagination" style={{ margin: '0' }}>
                                        <li className={currentPage === 1 ? 'disabled' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}>
                                                <span>&laquo;</span>
                                            </a>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => (
                                            <li key={i} className={currentPage === i + 1 ? 'active' : ''}>
                                                <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>
                                                    {i + 1}
                                                </a>
                                            </li>
                                        ))}
                                        <li className={currentPage === totalPages ? 'disabled' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}>
                                                <span>&raquo;</span>
                                            </a>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
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

export default TipiPortoManagementModal;
