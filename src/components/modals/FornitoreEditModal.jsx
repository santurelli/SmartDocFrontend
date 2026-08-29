import React, { useState, useEffect } from 'react';
import FornitoriService from '../../services/FornitoriService';
import FornitoreForm from '../../components/FornitoreForm';
import Swal from 'sweetalert2';

const FornitoreEditModal = ({ isOpen, onClose, fornitoreId, onSave }) => {
    const isNew = !fornitoreId;
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
        if (!isOpen) return;
        const init = async () => {
            setLoading(true);
            try {
                if (!isNew) {
                    const res = await FornitoriService.getById(fornitoreId);
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
                } else {
                    const resCode = await FornitoriService.generateCodice();
                    setFornitore(prev => ({ ...prev, codice: resCode.data?.payload || '' }));
                }
            } catch (error) {
                console.error("Error loading fornitore:", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [isOpen, fornitoreId, isNew]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...fornitore };
            const intFields = ['idRisorsa', 'idVettore', 'idTipoPorto', 'idAvviso', 'idNota', 'idCategoriaSpesa'];
            intFields.forEach(f => { if (payload[f] === '') payload[f] = null; });
            payload.descrizioneBanca = payload.banca;

            if (isNew) {
                await FornitoriService.insert(payload);
            } else {
                await FornitoriService.update(fornitoreId, payload);
            }
            Swal.fire('Successo', 'Fornitore salvato con successo', 'success');
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
                        <h4 className="modal-title" style={{ fontWeight: 'bold' }}>{isNew ? 'Nuovo Fornitore' : 'Modifica Fornitore'}</h4>
                    </div>
                    <div>
                        <div className="modal-body" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '10px 25px' }}>
                            <FornitoreForm data={fornitore} onChange={setFornitore} isNew={isNew} />
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn-premium-cancel" onClick={onClose}>Annulla</button>
                            <button type="button" className="btn-premium-save" disabled={loading} onClick={handleSubmit}>Salva</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FornitoreEditModal;
