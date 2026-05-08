import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import ArticoliService from '../../services/ArticoliService';
import { FaPencilAlt, FaTrash, FaPlus, FaCheck } from 'react-icons/fa';

const ArticoliManagementModal = ({ isOpen, onClose, onSelect, idListino }) => {
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, currentPage, pageSize, searchTerm]);

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
            const res = await ArticoliService.getList(params);
            if (res.data) {
                setList(res.data.list || []);
                setTotalItems(res.data.totalCount || 0);
            }
        } catch (error) {
            console.error("Error loading articoli:", error);
            Swal.fire('Errore', 'Impossibile caricare gli articoli', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = async (item) => {
        try {
            // Fetch price if listino is provided
            let finalPrice = item.prezzo || 0;
            if (idListino) {
                const resPrice = await ArticoliService.getArticlePrice(item.id, idListino);
                if (resPrice.data && resPrice.data.prezzo !== undefined) {
                    finalPrice = resPrice.data.prezzo;
                }
            }

            onSelect({
                value: item.id,
                label: `${item.codice} - ${item.descrizione}`,
                data: {
                    ...item,
                    codiceProdotto: item.codice,
                    descProdotto: item.descrizione,
                    prezzo: finalPrice
                }
            });
            // Keep modal open if user wants to add more? 
            // The user said "a fianco di ogni articolo dovrebbe avere anche un bottone per inserire l'articolo nel documento"
            // If they want to add multiple, we shouldn't close. 
            // But usually "Seleziona" closes. 
            // I'll add a "Seleziona" button that closes and maybe a "+" button that adds without closing?
            // For now, let's just close as per standard selection modals in this app.
            onClose();
        } catch (error) {
            console.error("Error selecting articolo:", error);
        }
    };

    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;

    if (!isOpen) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1100 }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title">Ricerca Articoli</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                        {/* Toolbar */}
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
                                        placeholder="Cerca per codice o descrizione..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    />
                                    <i className="fa fa-search"></i>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="table-responsive" style={{ border: 'none' }}>
                            <table className="table" style={{ borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                                <thead>
                                    <tr style={{ background: '#f8f9fa' }}>
                                        <th style={{ border: 'none', borderRadius: '10px 0 0 10px', padding: '12px 15px' }}>CODICE</th>
                                        <th style={{ border: 'none', padding: '12px 15px' }}>DESCRIZIONE</th>
                                        <th style={{ border: 'none', padding: '12px 15px' }}>U.M.</th>
                                        <th style={{ border: 'none', padding: '12px 15px', textAlign: 'right' }}>PREZZO BASE</th>
                                        <th style={{ border: 'none', borderRadius: '0 10px 10px 0', padding: '12px 15px', width: '150px', textAlign: 'center' }}>AZIONI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="5" className="text-center" style={{ padding: '30px' }}>Caricamento...</td>
                                        </tr>
                                    ) : list.length > 0 ? (
                                        list.map(item => (
                                            <tr key={item.id} style={{ boxShadow: '0 2px 5px rgba(0,0,0,0.05)', borderRadius: '10px' }}>
                                                <td style={{ border: 'none', padding: '15px', background: '#fff', borderRadius: '10px 0 0 10px', fontWeight: '600', color: '#03a9f4' }}>{item.codice}</td>
                                                <td style={{ border: 'none', padding: '15px', background: '#fff' }}>
                                                    <div style={{ fontWeight: '500' }}>{item.descrizione}</div>
                                                    {item.descrFormato && <small style={{ color: '#777', marginRight: '10px' }}>F: {item.descrFormato}</small>}
                                                    {item.descrScelta && <small style={{ color: '#777', marginRight: '10px' }}>S: {item.descrScelta}</small>}
                                                </td>
                                                <td style={{ border: 'none', padding: '15px', background: '#fff' }}>{item.descrUnitaMisura || item.idUnitaMisura}</td>
                                                <td style={{ border: 'none', padding: '15px', background: '#fff', textAlign: 'right', fontWeight: '500' }}>
                                                    {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(item.prezzo || 0)}
                                                </td>
                                                <td style={{ border: 'none', padding: '15px', background: '#fff', borderRadius: '0 10px 10px 0' }} className="text-center">
                                                    <button
                                                        type="button"
                                                        className="btn btn-success btn-sm btn-premium"
                                                        onClick={() => handleSelect(item)}
                                                        title="Inserisci nel documento"
                                                        style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto' }}
                                                    >
                                                        <FaCheck /> Inserisci
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="text-center" style={{ padding: '30px', color: '#999' }}>Nessun articolo trovato</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {!loading && totalItems > 0 && (
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
                        <button type="button" className="btn btn-default" onClick={onClose}>Annulla</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticoliManagementModal;
