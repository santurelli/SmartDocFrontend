import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import Swal from 'sweetalert2';
import RisorseService from '../../services/RisorseService';
import { FaPencilAlt, FaTrash, FaPlus, FaCheck, FaSearch, FaEdit, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const RisorseManagementModal = ({ onClose, initialTipologia }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    // Filters
    const [searchTipologia, setSearchTipologia] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(50);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (initialTipologia) {
            setSearchTipologia(initialTipologia); // If opened from specific context, filter by that type
        }
        loadData();
    }, [initialTipologia]);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await RisorseService.getAll();
            if (res.data && res.data.list && Array.isArray(res.data.list)) {
                setList(res.data.list);
            } else if (res.data && Array.isArray(res.data)) {
                setList(res.data);
            } else {
                setList([]);
            }
        } catch (error) {
            console.error("Error loading conti:", error);
            Swal.fire({
                title: 'Errore',
                text: 'Impossibile caricare i conti',
                icon: 'error',
                buttonsStyling: false,
                customClass: {
                    popup: 'premium-swal-popup',
                    title: 'premium-swal-title',
                    confirmButton: 'premium-swal-confirm'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Sei sicuro?',
            text: "Il conto verrà eliminato.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla',
            buttonsStyling: false,
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm btn-danger',
                cancelButton: 'premium-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            try {
                await RisorseService.delete(id);
                loadData();
                Swal.fire({
                    title: 'Eliminato!',
                    text: 'Conto eliminato.',
                    icon: 'success',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'premium-swal-popup',
                        title: 'premium-swal-title',
                        confirmButton: 'premium-swal-confirm'
                    }
                });
            } catch (error) {
                Swal.fire({
                    title: 'Errore',
                    text: 'Errore durante l\'eliminazione',
                    icon: 'error',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'premium-swal-popup',
                        title: 'premium-swal-title',
                        confirmButton: 'premium-swal-confirm'
                    }
                });
            }
        }
    };

    const handleEdit = (item) => {
        openDetailModal(item);
    };

    const handleAdd = () => {
        // Default to current filter or empty
        const defaultType = searchTipologia || '';
        openDetailModal({ tipologia: defaultType, descrizione: '', saldoIniziale: 0, predefinita: 0 });
    };

    // Helper to get type label
    const getTypeLabel = (code) => {
        switch (code) {
            case 'BA': return 'Banca';
            case 'CA': return 'Cassa';
            case 'CC': return 'Carta di credito';
            case 'TI': return 'Titoli';
            default: return code;
        }
    };

    const getTipologiaOptionsHtml = (selected) => {
        const options = [
            { val: 'BA', label: 'Banca' },
            { val: 'CA', label: 'Cassa' },
            { val: 'CC', label: 'Carta di credito' },
            { val: 'TI', label: 'Titoli' }
        ];
        return options.map(opt =>
            `<option value="${opt.val}" ${opt.val === selected ? 'selected' : ''}>${opt.label}</option>`
        ).join('');
    };

    const openDetailModal = (item) => {
        const isNew = !item.id;

        let htmlContent = `
            <div style="text-align: left; padding: 10px 5px;">
                <div class="row">
                    <div class="col-md-6">
                        <div class="form-group">
                            <label class="premium-swal-label">Tipologia</label>
                            <select id="swal-tipologia" class="form-control premium-swal-input">
                                <option value="">Seleziona...</option>
                                ${getTipologiaOptionsHtml(item.tipologia)}
                            </select>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="form-group">
                            <label class="premium-swal-label">Saldo Iniziale</label>
                            <input id="swal-saldo" type="number" class="form-control premium-swal-input" value="${item.saldoIniziale || 0}">
                        </div>
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label class="premium-swal-label">Descrizione</label>
                    <input id="swal-descrizione" class="form-control premium-swal-input" placeholder="Es. Conto Corrente Intesa..." value="${item.descrizione || ''}">
                </div>

                <div class="form-group" style="margin-top: 15px;">
                    <div class="checkbox" style="padding-left: 5px;">
                        <label style="font-weight: 600; color: #555; cursor: pointer;">
                            <input type="checkbox" id="swal-predefinita" ${item.predefinita === 1 ? 'checked' : ''} style="transform: scale(1.2); margin-right: 10px;"> Conto Predefinito
                        </label>
                    </div>
                </div>

                <div id="bank-fields" style="display: ${item.tipologia === 'BA' ? 'block' : 'none'}; border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
                    <h5 style="font-weight: 700; color: #03a9f4; margin-bottom: 15px;">Dati Bancari</h5>
                    <div class="row">
                        <div class="col-md-12">
                            <div class="form-group">
                                 <label class="premium-swal-label">IBAN</label>
                                 <input id="swal-iban" class="form-control premium-swal-input" placeholder="IT00..." value="${item.iban || ''}">
                            </div>
                        </div>
                    </div>
                    <div class="row" style="margin-top: 15px;">
                         <div class="col-md-12">
                            <div class="form-group">
                                 <label class="premium-swal-label">Banca</label>
                                 <input id="swal-banca" class="form-control premium-swal-input" placeholder="Nome istituto..." value="${item.descBanca || ''}">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        Swal.fire({
            title: isNew ? 'Nuovo Conto' : 'Modifica Conto',
            html: htmlContent,
            showCancelButton: true,
            confirmButtonText: 'Salva',
            cancelButtonText: 'Annulla',
            width: 650,
            buttonsStyling: false,
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            },
            didOpen: () => {
                const typeSelect = document.getElementById('swal-tipologia');
                const bankFields = document.getElementById('bank-fields');
                typeSelect.addEventListener('change', (e) => {
                    if (e.target.value === 'BA') {
                        bankFields.style.display = 'block';
                    } else {
                        bankFields.style.display = 'none';
                    }
                });
            },
            preConfirm: () => {
                const tipologia = document.getElementById('swal-tipologia').value;
                const descrizione = document.getElementById('swal-descrizione').value;
                const saldoIniziale = document.getElementById('swal-saldo').value;
                const predefinita = document.getElementById('swal-predefinita').checked ? 1 : 0;
                const iban = document.getElementById('swal-iban').value;
                const descBanca = document.getElementById('swal-banca').value;

                if (!tipologia) return Swal.showValidationMessage('Seleziona una tipologia');
                if (!descrizione) return Swal.showValidationMessage('Inserisci una descrizione');

                return {
                    tipologia,
                    descrizione,
                    saldoIniziale: parseFloat(saldoIniziale),
                    predefinita,
                    iban,
                    descBanca: descBanca
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const data = result.value;
                    if (item.id) {
                        await RisorseService.update(item.id, data);
                    } else {
                        await RisorseService.insert(data);
                    }
                    loadData();
                } catch (error) {
                    Swal.fire({
                        title: 'Errore',
                        text: 'Errore durante il salvataggio',
                        icon: 'error',
                        buttonsStyling: false,
                        customClass: {
                            popup: 'premium-swal-popup',
                            title: 'premium-swal-title',
                            confirmButton: 'premium-swal-confirm'
                        }
                    });
                }
            }
        });
    };

    // Pagination & Filter Logic
    const filteredList = list.filter(item => {
        const matchType = searchTipologia ? item.tipologia === searchTipologia : true;
        const matchText = item.descrizione && item.descrizione.toLowerCase().includes(searchTerm.toLowerCase());
        return matchType && matchText;
    });

    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startIdx = (currentPage - 1) * pageSize;
    const currentItems = filteredList.slice(startIdx, startIdx + pageSize);

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content premium-modal-content">
                    <div className="modal-header">
                        <h4 className="modal-title">Elenco Conti</h4>
                        <button type="button" className="close" onClick={onClose} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body" style={{ padding: '25px' }}>
                        {/* Toolbar - Balanced Layout */}
                        <div className="modal-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '15px' }}>
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
                                <select
                                    className="form-control"
                                    style={{ width: '180px', height: '42px', borderRadius: '10px', border: '1px solid #dfe4e7', fontSize: '0.9em' }}
                                    value={searchTipologia}
                                    onChange={(e) => { setSearchTipologia(e.target.value); setCurrentPage(1); }}
                                >
                                    <option value="">Tutte le tipologie...</option>
                                    <option value="BA">Banca</option>
                                    <option value="CA">Cassa</option>
                                    <option value="CC">Carta di credito</option>
                                    <option value="TI">Titoli</option>
                                </select>
                                <div className="toolbar-search-wrapper" style={{ flex: 1, position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cerca per descrizione..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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

                            <div className="toolbar-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="toolbar-item">
                                    <select
                                        className="form-control"
                                        style={{ width: '75px', height: '42px', borderRadius: '10px', fontSize: '0.9em', border: '1px solid #dfe4e7' }}
                                        value={pageSize}
                                        onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                                    >
                                        <option value="10">10</option>
                                        <option value="25">25</option>
                                        <option value="50">50</option>
                                        <option value="100">100</option>
                                    </select>
                                </div>
                                <button type="button" className="btn btn-primary premium-btn" onClick={handleAdd} style={{ height: '42px', padding: '0 25px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '10px' }}>
                                    <FaPlus /> Aggiungi
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="table-wrapper" style={{ maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', borderRadius: '12px', border: '1px solid #eee' }}>
                            <table className="table table-striped table-hover" style={{ marginBottom: 0 }}>
                                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f8f9fa', zIndex: 1, boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                                    <tr>
                                        <th style={{ padding: '15px' }}>TIPOLOGIA</th>
                                        <th style={{ padding: '15px' }}>DESCRIZIONE</th>
                                        <th style={{ width: '120px', textAlign: 'center', padding: '15px' }}>AZIONI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="3" className="text-center" style={{ padding: '40px' }}>Caricamento...</td></tr>
                                    ) : currentItems.length > 0 ? (
                                        currentItems.map(item => (
                                            <tr key={item.id}>
                                                <td style={{ verticalAlign: 'middle', padding: '15px' }}>
                                                    <span className="badge" style={{ backgroundColor: '#eef3f7', color: '#2c3e50', padding: '6px 10px', borderRadius: '6px' }}>
                                                        {getTypeLabel(item.tipologia)}
                                                    </span>
                                                </td>
                                                <td style={{ verticalAlign: 'middle', padding: '15px', fontWeight: '500' }}>
                                                    {item.descrizione}
                                                    {item.predefinita === 1 && (
                                                        <span className="label label-success" style={{ marginLeft: '10px', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75em' }}>Predefinita</span>
                                                    )}
                                                </td>
                                                <td className="text-center" style={{ verticalAlign: 'middle', padding: '15px' }}>
                                                    <button type="button" className="btn btn-info btn-sm" style={{ marginRight: '8px' }} onClick={() => handleEdit(item)} title="Modifica">
                                                        <FaEdit />
                                                    </button>
                                                    <button type="button" className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)} title="Elimina">
                                                        <FaTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="3" className="text-center" style={{ padding: '40px' }}>Nessun elemento trovato</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Status Bar */}
                        <div className="status-footer" style={{ marginTop: '20px', padding: '12px 20px', backgroundColor: '#f8f9fa', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eee' }}>
                            <span className="pagination-info" style={{ color: '#666', fontSize: '0.85em', fontWeight: '500' }}>
                                <FaSearch style={{ marginRight: '8px', opacity: 0.5 }} />
                                Vista da <strong style={{ color: '#03a9f4' }}>{totalItems > 0 ? startIdx + 1 : 0}</strong> a <strong style={{ color: '#03a9f4' }}>{Math.min(startIdx + pageSize, totalItems)}</strong> di <strong style={{ color: '#03a9f4' }}>{totalItems}</strong> elementi
                            </span>
                            {totalPages > 1 && (
                                <nav>
                                    <ul className="pagination" style={{ margin: 0 }}>
                                        <li className={currentPage === 1 ? 'disabled' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(currentPage - 1); }}>
                                                <FaChevronLeft />
                                            </a>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => {
                                            if (totalPages > 10) {
                                                if (i > 0 && i < totalPages - 1 && (i < currentPage - 2 || i > currentPage + 1)) {
                                                    if (i === currentPage - 3 || i === currentPage + 2) return <li key={i} className="disabled"><span>...</span></li>;
                                                    return null;
                                                }
                                            }
                                            return (
                                                <li key={i} className={currentPage === i + 1 ? 'active' : ''}>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage(i + 1); }}>
                                                        {i + 1}
                                                    </a>
                                                </li>
                                            );
                                        })}
                                        <li className={currentPage === totalPages ? 'disabled' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(currentPage + 1); }}>
                                                <FaChevronRight />
                                            </a>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-default" onClick={onClose}>Chiudi</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RisorseManagementModal;
