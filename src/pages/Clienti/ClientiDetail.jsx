import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import ClientiService from '../../services/ClientiService';
import ClienteForm from '../../components/ClienteForm';
import './ClientiDetail.css';
import { FaAngleRight } from 'react-icons/fa';

const ClientiDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = id === 'new';
    const [loading, setLoading] = useState(false);
    const [cliente, setCliente] = useState({
        codice: '',
        tipologia: 'PRIVATO',
        denominazione: '',
        codiceFiscale: '',
        partitaIva: '',
        note: '',
        referente: '',
        elencoIndirizzi: [{ tipologia: 'O', indirizzo: '', citta: '', cap: '', provincia: '', nazione: '', codiceUfficio: '' }],
        elencoContatti: [{ referente: '', telefono: '', cellulare: '', fax: '', email: '', pec: '' }],
        idAvviso: '',
        idNota: '',
        idRisorsa: '',
        idVettore: '',
        idTipoPorto: '',
        banca: '',
        iban: '',
        abi: '',
        cab: '',
        cin: '',
        conto: '',
        bic: '',
        codSia: ''
    });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                if (!isNew) {
                    const res = await ClientiService.getById(id);
                    let data = res.data;
                    data = {
                        ...data,
                        idRisorsa: data.idRisorsa || '',
                        idVettore: data.idVettore || '',
                        idTipoPorto: data.idTipoPorto || '',
                        idAvviso: data.idAvviso || '',
                        idNota: data.idNota || ''
                    };
                    if (!data.elencoIndirizzi?.length) data.elencoIndirizzi = [{ tipologia: 'O', indirizzo: '', citta: '', cap: '', provincia: '', nazione: '', codiceUfficio: '' }];
                    if (!data.elencoContatti?.length) data.elencoContatti = [{ referente: '', telefono: '', cellulare: '', fax: '', email: '', pec: '' }];
                    setCliente(data);
                }
            } catch (error) {
                console.error("Error loading cliente:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [id, isNew]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...cliente };
            const intFields = ['idRisorsa', 'idVettore', 'idTipoPorto', 'idAvviso', 'idNota', 'idAgente', 'idListino', 'idZonaCompetenza', 'idSottoconto', 'idLingua', 'idContoContabile'];
            intFields.forEach(f => { if (payload[f] === '' || payload[f] === 0) payload[f] = null; });

            if (isNew) {
                await ClientiService.insert(payload);
            } else {
                await ClientiService.update(id, payload);
            }
            navigate('/clienti');
        } catch (error) {
            Swal.fire('Errore', error.response?.data?.errorText || 'Errore durante il salvataggio', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !cliente.codice && !isNew) return <div className="p-20">Caricamento...</div>;

    return (
        <div className="clienti-detail-container">
            <ul className="breadcrumb">
                <li><Link to="/">Home</Link></li>
                <li><FaAngleRight /></li>
                <li><Link to="/clienti">Elenco clienti</Link></li>
                <li><FaAngleRight /></li>
                <li className="active">{isNew ? 'Nuovo cliente' : 'Modifica cliente'}</li>
            </ul>

            <h1>{isNew ? 'Nuovo cliente' : 'Modifica cliente'}</h1>

            <div style={{ padding: '0 20px 20px 20px' }}>
                <ClienteForm data={cliente} onChange={setCliente} isNew={isNew} />
                <div className="form-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <button type="button" className="btn btn-default" onClick={() => navigate('/clienti')}>Annulla</button>
                    <button type="button" className="btn btn-primary-custom" disabled={loading} onClick={handleSubmit}>Salva</button>
                </div>
            </div>
        </div>
    );
};

export default ClientiDetail;
