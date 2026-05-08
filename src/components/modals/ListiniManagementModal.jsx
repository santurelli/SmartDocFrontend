import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import ListiniService from '../../services/ListiniService';
import ListinoEditModal from './ListinoEditModal';
import Swal from 'sweetalert2';

const ListiniManagementModal = ({ isOpen, onClose, onSelect }) => {
    const [list, setList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedListino, setSelectedListino] = useState(null);

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await ListiniService.getAll();
            // The service returns response.data directly. Handle array or wrapped formats.
            const data = Array.isArray(res) ? res : (res.payload || res.data || res.list || []);
            setList(data);
        } catch (error) {
            console.error("Error loading listini:", error);
            Swal.fire('Errore', 'Impossibile caricare i listini', 'error');
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
                await ListiniService.delete(id);
                Swal.fire('Eliminato!', 'Il listino è stato eliminato.', 'success');
                loadData();
            } catch (error) {
                Swal.fire('Errore', 'Impossibile eliminare il listino', 'error');
            }
        }
    };

    const handleEdit = (item) => {
        setSelectedListino(item);
        setShowEditModal(true);
    };

    const handleAdd = () => {
        setSelectedListino(null);
        setShowEditModal(true);
    };

    if (!isOpen) return null;

    const filteredList = list.filter(item => 
        item.descrizione.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content premium-modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title">Gestione Listini</h4>
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
                                        placeholder="Cerca per descrizione..."
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
                                <button type="button" className="btn btn-primary premium-btn" onClick={handleAdd} style={{ height: '42px', padding: '0 25px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}>
                                    <FaPlus /> Nuovo Listino
                                </button>
                            </div>
                        </div>

                        <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto', borderRadius: '12px', border: '1px solid #eee' }}>
                            <table className="table table-striped table-hover" style={{ marginBottom: 0 }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                    <tr>
                                        <th style={{ padding: '15px' }}>DESCRIZIONE</th>
                                        <th style={{ padding: '15px' }}>DERIVAZIONE</th>
                                        <th style={{ textAlign: 'center', padding: '15px' }}>PREDEF.</th>
                                        <th style={{ width: onSelect ? '180px' : '120px', textAlign: 'center', padding: '15px' }}>AZIONI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center" style={{ padding: '40px' }}>Caricamento...</td></tr>
                                    ) : filteredList.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center" style={{ padding: '40px' }}>Nessun risultato trovato</td></tr>
                                    ) : filteredList.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ verticalAlign: 'middle', padding: '15px', fontWeight: '500' }}>{item.descrizione}</td>
                                            <td style={{ verticalAlign: 'middle', padding: '15px' }}>
                                                {item.derivationType === 'NONE' ? (
                                                    <span className="badge" style={{ backgroundColor: '#eef3f7', color: '#2c3e50', padding: '6px 10px', borderRadius: '6px' }}>Base</span>
                                                ) : (
                                                    <span style={{ fontSize: '0.9em', color: '#666' }}>
                                                        <strong style={{ color: '#2c3e50' }}>{item.derivationSource === 'LISTINO' ? 'Listino' : 'Acquisto'}</strong> 
                                                        <span style={{ marginLeft: '5px', color: '#03a9f4', fontWeight: '600' }}>
                                                            ({item.derivationType === 'PERCENTAGE' ? `+${item.derivationValue}%` : `+€${item.derivationValue}`})
                                                        </span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center" style={{ verticalAlign: 'middle', padding: '15px' }}>
                                                {item.flDefault === 1 && <span className="label label-success" style={{ borderRadius: '4px', padding: '3px 8px', fontSize: '0.75em' }}>SÌ</span>}
                                            </td>
                                            <td className="text-center" style={{ verticalAlign: 'middle', padding: '15px' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                    {onSelect && (
                                                        <button
                                                            className="btn btn-success btn-sm"
                                                            onClick={() => {
                                                                onSelect({ value: item.id, label: item.descrizione });
                                                                onClose();
                                                            }}
                                                        >
                                                            Seleziona
                                                        </button>
                                                    )}
                                                    <button className="btn btn-info btn-sm" onClick={() => handleEdit(item)} title="Modifica">
                                                        <FaEdit />
                                                    </button>
                                                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)} title="Elimina">
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Status Footer */}
                        <div className="status-footer" style={{ marginTop: '20px', padding: '12px 20px', backgroundColor: '#f8f9fa', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eee' }}>
                            <span className="pagination-info" style={{ color: '#666', fontSize: '0.85em', fontWeight: '500' }}>
                                <FaSearch style={{ marginRight: '8px', opacity: 0.5 }} />
                                Visualizzati <strong style={{ color: '#03a9f4' }}>{filteredList.length}</strong> di <strong style={{ color: '#03a9f4' }}>{list.length}</strong> listini
                            </span>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-default" onClick={onClose}>Chiudi</button>
                    </div>
                </div>
            </div>

            {showEditModal && (
                <ListinoEditModal
                    show={showEditModal}
                    handleClose={() => setShowEditModal(false)}
                    listino={selectedListino}
                    refreshList={loadData}
                    allListini={list}
                />
            )}
        </div>
    );
};

export default ListiniManagementModal;
