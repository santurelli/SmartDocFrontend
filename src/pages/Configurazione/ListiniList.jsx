import React, { useState, useEffect } from 'react';
import ListiniService from '../../services/ListiniService';
import { FaPlusCircle, FaEdit, FaTrash, FaHome, FaSitemap, FaPercentage, FaEuroSign, FaHistory, FaCalculator } from 'react-icons/fa';
import Swal from 'sweetalert2';
import ListinoEditModal from '../../components/modals/ListinoEditModal';
import './ListiniList.css';

const ListiniList = () => {
    const [listini, setListini] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedListino, setSelectedListino] = useState(null);

    useEffect(() => {
        fetchListini();
    }, []);

    const fetchListini = async () => {
        setLoading(true);
        try {
            const data = await ListiniService.getAll();
            setListini(data.payload || data || []);
        } catch (error) {
            console.error("Errore caricamento listini", error);
            Swal.fire('Errore', 'Impossibile caricare i listini', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (listino) => {
        setSelectedListino(listino);
        setShowModal(true);
    };

    const handleAdd = () => {
        setSelectedListino(null);
        setShowModal(true);
    };

    const handleDelete = async (listino) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: `Eliminare il listino "${listino.descrizione}"? Questa azione non può essere annullata.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await ListiniService.delete(listino.id);
                Swal.fire('Eliminato', 'Listino rimosso con successo', 'success');
                fetchListini();
            } catch (error) {
                Swal.fire('Errore', 'Impossibile eliminare il listino', 'error');
            }
        }
    };

    const getDerivationIcon = (source) => {
        switch (source) {
            case 'ULTIMO_ACQUISTO': return <FaHistory title="Ultimo Acquisto" />;
            case 'MEDIO_ACQUISTO': return <FaCalculator title="Medio Acquisto" />;
            case 'LISTINO': return <FaSitemap title="Da Listino Padre" />;
            default: return <FaEuroSign title="Prezzo Manuale" />;
        }
    };

    const getRuleText = (listino) => {
        if (!listino.derivationType || listino.derivationType === 'NONE') return 'Prezzi Manuali';
        const sign = listino.derivationValue >= 0 ? '+' : '';
        const unit = listino.derivationType === 'PERCENTAGE' ? '%' : '€';
        return `${sign}${listino.derivationValue}${unit}`;
    };

    return (
        <div className="container-fluid page-content listini-container">
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li>Configurazione</li>
                <li className="active">Gestione Listini</li>
            </ul>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1>Gestione Listini</h1>
                <button className="btn btn-primary premium-btn" onClick={handleAdd}>
                    <FaPlusCircle className="mr-2" /> Nuovo Listino
                </button>
            </div>

            {loading ? (
                <div className="text-center p-5">Caricamento in corso...</div>
            ) : listini.length === 0 ? (
                <div className="empty-state">
                    <FaSitemap size={48} className="mb-3" />
                    <h3>Nessun listino configurato</h3>
                    <p>Inizia creando il tuo primo listino prezzi.</p>
                </div>
            ) : (
                <div className="listini-grid">
                    {listini.map(l => (
                        <div key={l.id} className={`listino-card ${l.flDefault ? 'is-default' : ''}`}>
                            <div className="listino-card-header">
                                <h3 className="listino-title">{l.descrizione}</h3>
                                {l.flDefault === 1 && <span className="listino-badge badge-default">Default</span>}
                            </div>
                            
                            <div className="listino-body">
                                {(!l.derivationSource || l.derivationSource === 'NONE') ? (
                                    <div className="derivation-info">
                                        <FaEuroSign size={14} />
                                        <span className="derivation-source">Prezzi Manuali</span>
                                    </div>
                                ) : (
                                    <>
                                        <div className="derivation-info">
                                            {getDerivationIcon(l.derivationSource)}
                                            <span className="derivation-source">
                                                {l.derivationSource === 'LISTINO' ? (l.descrizioneParent || 'Radice') :
                                                 l.derivationSource === 'ULTIMO_ACQUISTO' ? 'Ultimo Acquisto' : 'Medio Acquisto'}
                                            </span>
                                        </div>
                                        <div className="derivation-info">
                                            {l.derivationType === 'PERCENTAGE' ? <FaPercentage size={12} /> : <FaEuroSign size={12} />}
                                            <span className="derivation-rule">{getRuleText(l)}</span>
                                            {l.roundingRule > 0 && (
                                                <span className="text-muted ml-2">(arr. {l.roundingRule})</span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="listino-card-footer">
                                <button className="btn-icon-only btn-edit" onClick={() => handleEdit(l)} title="Modifica">
                                    <FaEdit size={18} />
                                </button>
                                {l.id !== 1 && (
                                    <button className="btn-icon-only btn-delete" onClick={() => handleDelete(l)} title="Elimina">
                                        <FaTrash size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ListinoEditModal 
                show={showModal}
                handleClose={() => setShowModal(false)}
                listino={selectedListino}
                refreshList={fetchListini}
                allListini={listini}
            />
        </div>
    );
};

export default ListiniList;
