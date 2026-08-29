import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import FornitoriService from '../../services/FornitoriService';
import FornitoreForm from '../../components/FornitoreForm';
import './FornitoriDetail.css';
import { FaAngleRight } from 'react-icons/fa';

const FornitoriDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id || id === 'new';
    const [loading, setLoading] = useState(false);
    const [fornitore, setFornitore] = useState({
        codice: '',
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
        idCategoriaSpesa: '',
        banca: '',
        iban: '',
        abi: '',
        cab: '',
        cin: '',
        conto: '',
        bic: '',
        codSia: '',
        descrizioneBanca: '',
        flRitenutaAcconto: 0,
        tipoRitenuta: 'PERSONE_FISICHE',
        percRitenutaAcconto: 20
    });

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                if (!isNew) {
                    const res = await FornitoriService.getById(id);
                    let data = res.data;
                    data = {
                        ...data,
                        banca: data.banca || data.descrizioneBanca || '',
                        idRisorsa: data.idRisorsa || '',
                        idVettore: data.idVettore || '',
                        idTipoPorto: data.idTipoPorto || '',
                        idAvviso: data.idAvviso || '',
                        idNota: data.idNota || '',
                        idCategoriaSpesa: data.idCategoriaSpesa || ''
                    };
                    if (!data.elencoIndirizzi?.length) data.elencoIndirizzi = [{ tipologia: 'O', indirizzo: '', citta: '', cap: '', provincia: '', nazione: '', codiceUfficio: '' }];
                    if (!data.elencoContatti?.length) data.elencoContatti = [{ referente: '', telefono: '', cellulare: '', fax: '', email: '', pec: '' }];
                    setFornitore(data);
                }
            } catch (error) {
                console.error("Error loading fornitore:", error);
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
            const payload = { ...fornitore };
            const intFields = ['idRisorsa', 'idVettore', 'idTipoPorto', 'idAvviso', 'idNota', 'idCategoriaSpesa', 'idContoContabile'];
            intFields.forEach(f => { if (payload[f] === '') payload[f] = null; });
            payload.descrizioneBanca = payload.banca;

            if (isNew) {
                await FornitoriService.insert(payload);
            } else {
                await FornitoriService.update(id, payload);
            }
            navigate('/fornitori');
        } catch (error) {
            Swal.fire('Errore', error.response?.data?.errorText || 'Errore durante il salvataggio', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !fornitore.codice && !isNew) return <div className="p-20">Caricamento...</div>;

    return (
        <div className="fornitori-detail-container">
            <ul className="breadcrumb">
                <li><Link to="/">Home</Link></li>
                <li><FaAngleRight /></li>
                <li><Link to="/fornitori">Elenco fornitori</Link></li>
                <li><FaAngleRight /></li>
                <li className="active">{isNew ? 'Nuovo fornitore' : 'Modifica fornitore'}</li>
            </ul>

            <h1>{isNew ? 'Nuovo fornitore' : 'Modifica fornitore'}</h1>

            <div style={{ padding: '0 20px 20px 20px' }}>
                <FornitoreForm data={fornitore} onChange={setFornitore} isNew={isNew} />
                <div className="form-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                    <button type="button" className="btn btn-default" onClick={() => navigate('/fornitori')}>Annulla</button>
                    <button type="button" className="btn btn-primary-custom" disabled={loading} onClick={handleSubmit}>Salva</button>
                </div>
            </div>
        </div>
    );
};

export default FornitoriDetail;
