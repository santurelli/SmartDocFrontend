import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PreventiviService from '../../services/PreventiviService';
import ClientiService from '../../services/ClientiService';
import AgentiService from '../../services/AgentiService';
// import ProgettiService from '../../services/ProgettiService'; // Check if exists
import Swal from 'sweetalert2';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import './PreventiviDetail.css'; // Create css or reuse

const PreventiviDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;

    const [activeTab, setActiveTab] = useState('generale'); // generale, articoli, note
    const [loading, setLoading] = useState(false);

    // Header Data
    const [formData, setFormData] = useState({
        numDocumento: '',
        dataDocumento: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        particella: '',
        idCliente: '',
        idAgente: '',
        idProgetto: '',
        annotazioneEstesa: '',
        // Addresses
        indirizzoIntestazione: '',
        capIntestazione: '',
        cittaIntestazione: '',
        provinciaIntestazione: '',
        nazioneIntestazione: '',
        // ... other fields
    });

    // Lists
    const [clientiList, setClientiList] = useState([]);
    const [agentiList, setAgentiList] = useState([]);

    // Article Lines
    const [prodotti, setProdotti] = useState([]);

    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load dropdowns based on services (simplified for now, assume filtering/search done via select component later)
            // Ideally use AsyncSelect, but for now fetching lists
            // const clientiRes = await ClientiService.getSuggestion(''); // API might differ
            // setClientiList(clientiRes.data || []);

            if (!isNew) {
                const response = await PreventiviService.getById(id);
                const data = response.data.payload; // Access payload from GenericResponseDto
                setFormData({
                    ...data,
                    // Parse necessary fields
                    dataDocumento: data.dataDocumento ? data.dataDocumento.split('/').reverse().join('-') : '' // DD/MM/YYYY -> YYYY-MM-DD
                });
                setProdotti(data.prodotti || []);
            } else {
                // Get next number
                // const nextNumRes = await PreventiviService.getNextNum(formData.dataDocumento);
                // setFormData(prev => ({ ...prev, numDocumento: nextNumRes.data.payload }));
            }
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleHeaderChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddRow = () => {
        setProdotti([
            ...prodotti,
            {
                id: null, // New row
                codiceProdotto: '',
                descProdotto: '',
                quantita: 1,
                prezzo: 0,
                sconto: 0,
                percentualeIva: 22, // Default
                totale: 0
            }
        ]);
    };

    const handleRowChange = (index, field, value) => {
        const newProdotti = [...prodotti];
        newProdotti[index][field] = value;

        // Recalculate total for row
        // Simplified calculation: (Qty * Price) * (1 - Discount/100) * (1 + VAT/100) 
        // Note: VAT handling might be on net or gross. Assuming Price is Net.
        const qty = parseFloat(newProdotti[index].quantita) || 0;
        const price = parseFloat(newProdotti[index].prezzo) || 0;
        const discount = parseFloat(newProdotti[index].sconto) || 0;
        const vat = parseFloat(newProdotti[index].percentualeIva) || 0;

        let net = qty * price;
        if (discount > 0) net = net - (net * discount / 100);
        const total = net * (1 + vat / 100);

        newProdotti[index].totale = total; // Store calculated total or calculate on fly?

        setProdotti(newProdotti);
    };

    const handleDeleteRow = (index) => {
        const newProdotti = prodotti.filter((_, i) => i !== index);
        setProdotti(newProdotti);
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...formData,
                dataDocumento: formData.dataDocumento.split('-').reverse().join('/'), // YYYY-MM-DD -> DD/MM/YYYY
                prodotti: prodotti
            };

            if (isNew) {
                await PreventiviService.insert(payload);
                Swal.fire('Successo', 'Preventivo creato con successo', 'success').then(() => {
                    navigate('/preventivi');
                });
            } else {
                await PreventiviService.update(id, payload);
                Swal.fire('Successo', 'Preventivo aggiornato con successo', 'success').then(() => {
                    navigate('/preventivi');
                });
            }
        } catch (error) {
            console.error("Error saving:", error);
            Swal.fire('Errore', 'Errore durante il salvataggio', 'error');
        }
    };

    return (
        <div className="preventivi-detail-container">
            <div id="content-header">
                <ol className="breadcrumb">
                    <li><a href="/">HOME</a></li>
                    <li><a href="/preventivi">Elenco preventivi</a></li>
                    <li className="active">{isNew ? 'Nuovo preventivo' : 'Modifica preventivo'}</li>
                </ol>
                <h1>{isNew ? 'Nuovo preventivo' : 'Modifica preventivo'}</h1>
            </div>

            <div className="row" style={{ margin: '0 10px' }}>
                <div className="col-lg-12">
                    <div className="main-box">
                        <div className="main-box-header">
                            <ul className="nav nav-tabs">
                                <li className={activeTab === 'generale' ? 'active' : ''}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('generale'); }}>Informazioni generali</a>
                                </li>
                                <li className={activeTab === 'articoli' ? 'active' : ''}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('articoli'); }}>Articoli</a>
                                </li>
                                <li className={activeTab === 'note' ? 'active' : ''}>
                                    <a href="#" onClick={(e) => { e.preventDefault(); setActiveTab('note'); }}>Annotazione estesa</a>
                                </li>
                            </ul>
                        </div>

                        <div className="main-box-body">
                            {/* General Tab */}
                            <div className={`tab-pane ${activeTab === 'generale' ? 'active' : 'hide'}`}>
                                <form>
                                    <div className="row">
                                        <div className="col-md-3 form-group">
                                            <label>Numero</label>
                                            <input type="number" className="form-control" name="numDocumento" value={formData.numDocumento} onChange={handleHeaderChange} />
                                        </div>
                                        <div className="col-md-3 form-group">
                                            <label>Data</label>
                                            <input type="date" className="form-control" name="dataDocumento" value={formData.dataDocumento} onChange={handleHeaderChange} />
                                        </div>
                                        <div className="col-md-6 form-group">
                                            <label>Cliente</label>
                                            <input type="text" className="form-control" name="idCliente" placeholder="ID Cliente (Placeholder)" value={formData.idCliente} onChange={handleHeaderChange} />
                                            {/* Implement Select/Typeahead here */}
                                        </div>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6 form-group">
                                            <label>Indirizzo Intestazione</label>
                                            <input type="text" className="form-control" name="indirizzoIntestazione" value={formData.indirizzoIntestazione} onChange={handleHeaderChange} />
                                        </div>
                                        <div className="col-md-4 form-group">
                                            <label>Città</label>
                                            <input type="text" className="form-control" name="cittaIntestazione" value={formData.cittaIntestazione} onChange={handleHeaderChange} />
                                        </div>
                                        <div className="col-md-2 form-group">
                                            <label>CAP</label>
                                            <input type="text" className="form-control" name="capIntestazione" value={formData.capIntestazione} onChange={handleHeaderChange} />
                                        </div>
                                    </div>
                                    {/* Add other fields as needed */}
                                </form>
                            </div>

                            {/* Articles Tab */}
                            <div className={`tab-pane ${activeTab === 'articoli' ? 'active' : 'hide'}`}>
                                <div className="toolbar">
                                    <button className="btn btn-primary btn-sm" onClick={handleAddRow}><FaPlus /> Aggiungi Riga</button>
                                </div>
                                <table className="table table-striped">
                                    <thead>
                                        <tr>
                                            <th>Codice</th>
                                            <th>Descrizione</th>
                                            <th style={{ width: '80px' }}>Q.ta</th>
                                            <th style={{ width: '100px' }}>Prezzo</th>
                                            <th style={{ width: '80px' }}>Sconto</th>
                                            <th style={{ width: '60px' }}>IVA</th>
                                            <th>Totale</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {prodotti.map((row, idx) => (
                                            <tr key={idx}>
                                                <td><input type="text" className="form-control input-sm" value={row.codiceProdotto} onChange={(e) => handleRowChange(idx, 'codiceProdotto', e.target.value)} /></td>
                                                <td><input type="text" className="form-control input-sm" value={row.descProdotto} onChange={(e) => handleRowChange(idx, 'descProdotto', e.target.value)} /></td>
                                                <td><input type="number" className="form-control input-sm" value={row.quantita} onChange={(e) => handleRowChange(idx, 'quantita', e.target.value)} /></td>
                                                <td><input type="number" className="form-control input-sm" value={row.prezzo} onChange={(e) => handleRowChange(idx, 'prezzo', e.target.value)} /></td>
                                                <td><input type="number" className="form-control input-sm" value={row.sconto} onChange={(e) => handleRowChange(idx, 'sconto', e.target.value)} /></td>
                                                <td><input type="number" className="form-control input-sm" value={row.percentualeIva} onChange={(e) => handleRowChange(idx, 'percentualeIva', e.target.value)} /></td>
                                                <td>{new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(row.totale || 0)}</td>
                                                <td>
                                                    <button className="btn btn-danger btn-xs" onClick={() => handleDeleteRow(idx)}><FaTrash /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Notes Tab */}
                            <div className={`tab-pane ${activeTab === 'note' ? 'active' : 'hide'}`}>
                                <div className="form-group">
                                    <label>Annotazione Estesa</label>
                                    <textarea className="form-control" rows="10" name="annotazioneEstesa" value={formData.annotazioneEstesa} onChange={handleHeaderChange}></textarea>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="main-box-footer text-right">
                            <button className="btn btn-default" onClick={() => navigate('/preventivi')}>Annulla</button>
                            <button className="btn btn-primary" onClick={handleSave} style={{ marginLeft: '10px' }}><FaSave /> Salva</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreventiviDetail;
