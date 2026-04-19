import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import TipiPagamentoService from '../../services/TipiPagamentoService';
import TipoPagamentoEditModal from './TipoPagamentoEditModal';
import Swal from 'sweetalert2';

const TipiPagamentoManagementModal = ({ isOpen, onClose }) => {
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, searchTerm]);

    const loadData = async () => {
        setLoading(true);
        try {
            const params = {
                search: searchTerm,
                start: 0,
                length: 100, // Mostriamo tutto per ora
                'order[0][column]': 0,
                'order[0][dir]': 'asc'
            };
            const res = await TipiPagamentoService.getList(params);
            if (res.data) {
                // Il backend moderno usa DatatablesResponseDto con 'list' e 'totalCount'
                const data = res.data.list || res.data.payload || [];
                setList(data);
                setTotalItems(res.data.totalCount || data.length);
            }
        } catch (error) {
            console.error("Error loading payment types", error);
            setList([]);
            Swal.fire({
                icon: 'error',
                title: 'Errore Caricamento',
                text: 'Impossibile caricare i tipi pagamento: ' + (error.response?.data?.errorText || error.message),
                customClass: {
                    popup: 'premium-swal-popup',
                    title: 'premium-swal-title'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Questa operazione non può essere annullata!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina!',
            cancelButtonText: 'Annulla',
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-default'
            },
            buttonsStyling: false
        });

        if (result.isConfirmed) {
            try {
                await TipiPagamentoService.delete(id);
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminato!',
                    text: 'Il tipo pagamento è stato eliminato.',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'premium-swal-popup',
                        title: 'premium-swal-title'
                    }
                });
                loadData();
            } catch (error) {
                Swal.fire('Errore', 'Impossibile eliminare il tipo pagamento: ' + (error.response?.data?.errorText || error.message), 'error');
            }
        }
    };

    const handleEdit = (id) => {
        setSelectedId(id);
        setShowEditModal(true);
    };

    const handleAdd = () => {
        setSelectedId(null);
        setShowEditModal(true);
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content premium-modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title">Gestione Tipi Pagamento</h4>
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body" style={{ padding: '25px' }}>
                        {/* Toolbar - Balanced Layout */}
                        <div className="modal-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px' }}>
                            <div className="toolbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
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
                                <div className="toolbar-search-wrapper" style={{ flex: 1 }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cerca..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
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
                                    <FaPlus /> Nuovo Tipo
                                </button>
                            </div>
                        </div>

                        <div className="table-wrapper" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', borderRadius: '12px', border: '1px solid #eee' }}>
                            <table className="table table-striped table-hover" style={{ marginBottom: 0 }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                    <tr>
                                        <th style={{ padding: '15px' }}>DESCRIZIONE</th>
                                        <th style={{ padding: '15px' }}>MODALITÀ</th>
                                        <th style={{ textAlign: 'center', padding: '15px' }}>PREDEF.</th>
                                        <th style={{ width: '120px', textAlign: 'center', padding: '15px' }}>AZIONI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center" style={{ padding: '40px' }}>Caricamento...</td></tr>
                                    ) : list.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center" style={{ padding: '40px' }}>Nessun risultato trovato</td></tr>
                                    ) : list.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ verticalAlign: 'middle', padding: '15px', fontWeight: '500' }}>{item.descrizione}</td>
                                            <td style={{ verticalAlign: 'middle', padding: '15px' }}>
                                                <code style={{ backgroundColor: '#fdf2f2', color: '#e74c3c', padding: '4px 8px', borderRadius: '4px', fontSize: '0.85em' }}>{item.modalita}</code>
                                            </td>
                                            <td className="text-center" style={{ verticalAlign: 'middle', padding: '15px' }}>
                                                {item.predefinito === 1 ? <span className="label label-success" style={{ borderRadius: '4px', padding: '4px 8px' }}>Sì</span> : ''}
                                            </td>
                                            <td className="text-center" style={{ verticalAlign: 'middle', padding: '15px' }}>
                                                <button className="btn btn-info btn-sm" style={{ marginRight: '8px' }} onClick={() => handleEdit(item.id)} title="Modifica">
                                                    <FaEdit />
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)} title="Elimina">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Status Bar */}
                        <div className="status-footer" style={{ marginTop: '20px', padding: '12px 20px', backgroundColor: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', border: '1px solid #eee' }}>
                             <span className="pagination-info" style={{ color: '#666', fontSize: '0.85em', fontWeight: '500' }}>
                                <FaSearch style={{ marginRight: '8px', opacity: 0.5 }} />
                                Visualizzati <strong style={{ color: '#03a9f4' }}>{list.length}</strong> di <strong style={{ color: '#03a9f4' }}>{totalItems}</strong> risultati
                            </span>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-default" onClick={onClose}>Chiudi</button>
                    </div>
                </div>
            </div>

            {showEditModal && (
                <TipoPagamentoEditModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    tipoPagamentoId={selectedId}
                    onSave={loadData}
                />
            )}
        </div>,
        document.body
    );
};

export default TipiPagamentoManagementModal;
