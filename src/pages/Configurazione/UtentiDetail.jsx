import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaInfoCircle, FaAngleRight } from 'react-icons/fa';
import Swal from 'sweetalert2';
import api from '../../services/api';
import RuoliHelpModal from './RuoliHelpModal';
import './UtentiDetail.css';

const UtentiDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;

    const [utente, setUtente] = useState({
        nome: '',
        cognome: '',
        username: '',
        email: '',
        gruppo: '',
    });
    const [gruppi, setGruppi] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const gruppiRes = await api.get('/utenti/gruppi');
                setGruppi(gruppiRes.data);

                if (!isNew) {
                    const utenteRes = await api.get('/utenti'); // For a real implementation, we should use getById but we can find from list or we added getById to API. Wait, I didn't add GET /api/utenti/{id}. Let's assume we fetch all and find, or we should add it. Wait, I should add getById in GestioneUtentiController or fetch from list.
                    const user = utenteRes.data.find(u => u.id === parseInt(id));
                    if (user) {
                        setUtente({
                            nome: user.nome || '',
                            cognome: user.cognome || '',
                            username: user.username || '',
                            email: user.email || '',
                            gruppo: user.gruppo || ''
                        });
                    }
                }
            } catch (error) {
                console.error("Errore recupero dati utente", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isNew]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUtente(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (isNew) {
                await api.post('/utenti', utente);
                await Swal.fire('Successo!', 'Utente creato con successo. La password è stata inviata via mail se presente l\'indirizzo.', 'success');
            } else {
                await api.put(`/utenti/${id}`, utente);
                await Swal.fire('Successo!', 'Utente aggiornato con successo.', 'success');
            }
            navigate('/configurazione/utenti');
        } catch (error) {
            console.error("Errore salvataggio utente", error);
            const errorMsg = error.response?.data || 'Errore durante il salvataggio dell\'utente.';
            Swal.fire('Errore!', errorMsg, 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Caricamento...</div>;

    return (
        <div className="utenti-detail-container">
            <RuoliHelpModal show={showHelp} onHide={() => setShowHelp(false)} />
            <ul className="breadcrumb">
                <li><Link to="/">Home</Link></li>
                <li><FaAngleRight /></li>
                <li><Link to="/configurazione/utenti">Gestione Utenti</Link></li>
                <li><FaAngleRight /></li>
                <li className="active">{isNew ? 'Nuovo Utente' : 'Modifica Utente'}</li>
            </ul>

            <h1>{isNew ? 'Nuovo Utente' : 'Modifica Utente'}</h1>

            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div className="form-group col-md-6">
                        <label>Nome</label>
                        <input type="text" className="form-control" name="nome" value={utente.nome} onChange={handleChange} required />
                    </div>
                    <div className="form-group col-md-6">
                        <label>Cognome</label>
                        <input type="text" className="form-control" name="cognome" value={utente.cognome} onChange={handleChange} required />
                    </div>
                </div>
                <div className="row">
                    <div className="form-group col-md-6">
                        <label>Username (Accesso)</label>
                        <input type="text" className="form-control" name="username" value={utente.username} onChange={handleChange} required />
                    </div>
                    <div className="form-group col-md-6">
                        <label>Email (Invio Password)</label>
                        <input type="email" className="form-control" name="email" value={utente.email} onChange={handleChange} />
                    </div>
                </div>
                <div className="row">
                    <div className="form-group col-md-6">
                        <label style={{ display: 'flex', alignItems: 'center' }}>
                            Ruolo / Gruppo
                            <FaInfoCircle
                                style={{ marginLeft: '8px', color: '#17a2b8', cursor: 'pointer' }}
                                onClick={() => setShowHelp(true)}
                                title="Vedi Guida ai Ruoli"
                            />
                        </label>
                        <select className="form-control" name="gruppo" value={utente.gruppo} onChange={handleChange} required>
                            <option value="">Seleziona ruolo...</option>
                            {gruppi.map(g => (
                                <option key={g.id} value={g.id}>{g.value}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-footer">
                    <button type="button" className="btn btn-default" onClick={() => navigate('/configurazione/utenti')}>
                        Annulla
                    </button>
                    <button type="submit" className="btn btn-primary-custom" disabled={saving}>
                        {saving ? "Salvataggio..." : "Salva Utente"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UtentiDetail;
