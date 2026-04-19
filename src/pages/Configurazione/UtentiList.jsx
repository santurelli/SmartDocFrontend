import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPlusCircle, FaSearch, FaHome, FaTrash, FaEdit, FaBookReader } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../services/api';
import RuoliHelpModal from './RuoliHelpModal';

const UtentiList = () => {
    const [utenti, setUtenti] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showHelp, setShowHelp] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUtenti = async () => {
            try {
                const response = await api.get('/utenti');
                setUtenti(response.data);
            } catch (error) {
                console.error("Errore nel recupero degli utenti", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUtenti();
    }, []);

    const handleDelete = async (utente) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: `Vuoi eliminare l'utente ${utente.username}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sì, elimina!',
            cancelButtonText: 'Annulla'
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`/utenti/${utente.id}`);
                setUtenti(utenti.filter(u => u.id !== utente.id));
                Swal.fire('Eliminato!', 'L\'utente è stato rimosso.', 'success');
            } catch (error) {
                console.error("Errore cancellazione utente", error);
                Swal.fire('Errore!', 'Impossibile eliminare l\'utente.', 'error');
            }
        }
    };

    const [search, setSearch] = useState('');
    const handleSearchChange = (e) => {
        setSearch(e.target.value);
    };

    const filteredUtenti = utenti.filter(u => 
        (u.nome || '').toLowerCase().includes(search.toLowerCase()) || 
        (u.cognome || '').toLowerCase().includes(search.toLowerCase()) || 
        (u.username || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="container-fluid page-content">
            <RuoliHelpModal show={showHelp} onHide={() => setShowHelp(false)} />
            <ul className="breadcrumb">
                <li><a href="/"><FaHome /> Home</a></li>
                <li><a href="#">Configurazione</a></li>
                <li className="active">Gestione Utenti</li>
            </ul>
            <h1>Gestione Utenti</h1>

            <div className="main-box">
                <div className="main-box-header">
                    <div className="filter-block-left">
                        <button className="btn btn-info" onClick={() => setShowHelp(true)} style={{ color: 'white' }}>
                            <FaBookReader className="btn-icon" /> Guida Ruoli
                        </button>
                    </div>
                    <div className="filter-block-right">
                        <div className="search-group">
                            <input
                                type="text"
                                className="form-control search-input"
                                placeholder="Cerca utente..."
                                value={search}
                                onChange={handleSearchChange}
                            />
                            <FaSearch className="search-icon" />
                        </div>
                        <button className="btn btn-primary add-btn" onClick={() => navigate('/configurazione/utenti/new')}>
                            <FaPlusCircle className="btn-icon" /> Nuovo Utente
                        </button>
                    </div>
                </div>

                <div className="main-box-body">
                    {loading ? <p className="text-center">Caricamento in corso...</p> : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>UTENTE</th>
                                        <th>RUOLO</th>
                                        <th>EMAIL</th>
                                        <th>USERNAME</th>
                                        <th style={{ width: '1%' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUtenti.map(utente => (
                                        <tr key={utente.id}>
                                            <td>{utente.nome} {utente.cognome}</td>
                                            <td><span className="label label-primary">{utente.nomeGruppo || 'UTENTE BASE'}</span></td>
                                            <td>{utente.email}</td>
                                            <td>{utente.username}</td>
                                            <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                                                <div className="actions-wrapper">
                                                    <button
                                                        className="btn-action btn-action-edit"
                                                        title="Modifica"
                                                        onClick={() => navigate(`/configurazione/utenti/${utente.id}`)}
                                                        style={{ backgroundColor: '#3498db', border: 'none', borderRadius: '3px', color: 'white', padding: '3px 6px', marginRight: '5px' }}
                                                    >
                                                        <FaEdit size={14} color="#ffffff" />
                                                    </button>
                                                    <button
                                                        className="btn-action btn-action-delete"
                                                        title="Elimina"
                                                        onClick={(e) => { e.preventDefault(); handleDelete(utente); }}
                                                    >
                                                        <FaTrash size={14} color="#ffffff" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredUtenti.length === 0 && (
                                        <tr><td colSpan="5" className="text-center">Nessun utente trovato.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UtentiList;
