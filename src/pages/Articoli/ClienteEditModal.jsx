import React, { useState, useEffect } from 'react';
import ClientiService from '../../services/ClientiService';
import ClienteForm from '../../components/ClienteForm';
import Swal from 'sweetalert2';

const ClienteEditModal = ({ isOpen, onClose, clienteId, onSave }) => {
    const isNew = !clienteId;
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
        if (!isOpen) return;
        const init = async () => {
            setLoading(true);
            try {
                if (!isNew) {
                    const res = await ClientiService.getById(clienteId);
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
                } else {
                    const resCode = await ClientiService.generateCodice();
                    setCliente(prev => ({ ...prev, codice: resCode.data?.payload || '' }));
                }
            } catch (error) {
                console.error("Error loading cliente:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [isOpen, clienteId, isNew]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...cliente };
            const intFields = ['idRisorsa', 'idVettore', 'idTipoPorto', 'idAvviso', 'idNota'];
            intFields.forEach(f => { if (payload[f] === '') payload[f] = null; });

            if (isNew) {
                await ClientiService.insert(payload);
            } else {
                await ClientiService.update(clienteId, payload);
            }
            Swal.fire('Successo', 'Cliente salvato con successo', 'success');
            onSave();
            onClose();
        } catch (error) {
            Swal.fire('Errore', error.response?.data?.errorText || 'Errore durante il salvataggio', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1200 }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose}>&times;</button>
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>{isNew ? 'Nuovo Cliente' : 'Modifica Cliente'}</h4>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '10px 25px' }}>
                            <ClienteForm data={cliente} onChange={setCliente} isNew={isNew} />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-premium-cancel" onClick={onClose}>Annulla</button>
                            <button type="submit" className="btn-premium-save" disabled={loading}>Salva</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClienteEditModal;
