import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa';
import ListiniService from '../../services/ListiniService';
import ListinoEditModal from './ListinoEditModal';
import Swal from 'sweetalert2';

const ListiniManagementModal = ({ isOpen, onClose }) => {
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
            if (res.data) {
                setList(res.data.payload || res.data || []);
            }
        } catch (error) {
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
                <div className="modal-content">
                    <div className="modal-header bg-primary" style={{ color: 'white', borderTopLeftRadius: '6px', borderTopRightRadius: '6px' }}>
                        <button type="button" className="close" onClick={onClose} style={{ color: 'white', opacity: 0.8 }}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>Gestione Listini</h4>
                    </div>
                    <div className="modal-body">
                        <div className="row" style={{ marginBottom: '15px' }}>
                            <div className="col-md-6">
                                <div className="input-group">
                                    <span className="input-group-addon"><FaSearch /></span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cerca per descrizione..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6 text-right">
                                <button type="button" className="btn btn-success" onClick={handleAdd}>
                                    <FaPlus /> Nuovo Listino
                                </button>
                            </div>
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px' }}>
                            <table className="table table-striped table-hover table-bordered" style={{ marginBottom: 0 }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1, boxShadow: '0 2px 2px -1px rgba(0,0,0,0.1)' }}>
                                    <tr>
                                        <th>Descrizione</th>
                                        <th>Derivazione</th>
                                        <th style={{ textAlign: 'center' }}>Predef.</th>
                                        <th style={{ width: '120px', textAlign: 'center' }}>Azioni</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="4" className="text-center">Caricamento...</td></tr>
                                    ) : filteredList.length === 0 ? (
                                        <tr><td colSpan="4" className="text-center">Nessun risultato trovato</td></tr>
                                    ) : filteredList.map(item => (
                                        <tr key={item.id}>
                                            <td style={{ verticalAlign: 'middle' }}>{item.descrizione}</td>
                                            <td style={{ verticalAlign: 'middle' }}>
                                                {item.derivationType === 'NONE' ? (
                                                    <span className="label label-info">Base</span>
                                                ) : (
                                                    <span>
                                                        {item.derivationSource === 'LISTINO' ? 'Listino' : 'Acquisto'} 
                                                        ({item.derivationType === 'PERCENTAGE' ? `+${item.derivationValue}%` : `+€${item.derivationValue}`})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                                {item.flDefault === 1 ? <span className="label label-success">Sì</span> : ''}
                                            </td>
                                            <td className="text-center" style={{ verticalAlign: 'middle' }}>
                                                <button className="btn btn-primary btn-sm" style={{ marginRight: '5px' }} onClick={() => handleEdit(item)} title="Modifica">
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
