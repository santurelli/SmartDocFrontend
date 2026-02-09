import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import AgentiService from '../../services/AgentiService';
import { FaPencilAlt, FaTrash, FaPlus } from 'react-icons/fa';
import AgenteEditModal from './AgenteEditModal';

const AgentiManagementModal = ({ onClose }) => {
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);

    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);

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
                'order[0][column]': 0, // Sort by Denominazione
                'order[0][dir]': 'asc'
            };
            const res = await AgentiService.getList(params);
            if (res.data) {
                setList(res.data.list || []);
                setTotalItems(res.data.totalCount || 0);
            }
        } catch (error) {
            console.error("Error loading agenti:", error);
            Swal.fire('Errore', 'Impossibile caricare gli agenti', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "L'agente verrà eliminato.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await AgentiService.delete(id);
                loadData();
                Swal.fire('Eliminato!', 'Agente eliminato.', 'success');
            } catch (error) {
                Swal.fire('Errore', "Errore durante l'eliminazione", 'error');
            }
        }
    };

    const handleEdit = (item) => {
        setSelectedId(item.id);
        setShowEditModal(true);
    };

    const handleAdd = () => {
        setSelectedId(null);
        setShowEditModal(true);
    };

    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header bg-primary" style={{ color: 'white', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
                        <button type="button" className="close" onClick={onClose} style={{ color: 'white', opacity: 0.8 }}>&times;</button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Gestione Agenti</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 210px)', overflowY: 'auto', padding: '30px' }}>

                        {/* Toolbar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '15px' }}>
                            <div className="form-inline">
                                <span style={{ marginRight: '15px' }}>MOSTRA</span>
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
                                <span style={{ marginLeft: '15px' }}>RIGHE</span>
                            </div>

                            <div style={{ display: 'flex', gap: '10px' }}>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        style={{ paddingRight: '35px' }}
                                        placeholder="Cerca agente..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                    <i className="fa fa-search" style={{ position: 'absolute', right: '10px', top: '10px', color: '#ccc' }}></i>
                                </div>
                                <button className="btn btn-primary" onClick={handleAdd}>
                                    <FaPlus /> Nuovo Agente
                                </button>
                            </div>
                        </div>

                        {/* Standard Table */}
                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th style={{ verticalAlign: 'middle' }}>DENOMINAZIONE</th>
                                    <th style={{ verticalAlign: 'middle' }}>EMAIL</th>
                                    <th style={{ verticalAlign: 'middle' }}>% PROVV.</th>
                                    <th style={{ width: '150px', verticalAlign: 'middle', textAlign: 'center' }}>AZIONI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {list.length > 0 ? (
                                    list.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ verticalAlign: 'middle' }}>{item.denominazione}</td>
                                            <td style={{ verticalAlign: 'middle' }}>{item.email}</td>
                                            <td style={{ verticalAlign: 'middle' }}>{item.percProvvigione}%</td>
                                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleEdit(item)}
                                                        title="Modifica"
                                                    >
                                                        <FaPencilAlt />
                                                    </button>
                                                    <button
                                                        className="btn btn-danger btn-sm"
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
                                        <td colSpan="4" className="text-center" style={{ padding: '30px', color: '#999' }}>Nessun agente trovato</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
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
                    <div className="modal-footer">
                        <button type="button" className="btn btn-default" onClick={onClose}>Chiudi</button>
                    </div>
                </div>
            </div>
            <AgenteEditModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                agenteId={selectedId}
                onSave={loadData}
            />
        </div>
    );
};

export default AgentiManagementModal;
