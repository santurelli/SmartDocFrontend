import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import AliquoteIvaService from '../../services/AliquoteIvaService';
import { FaTrash, FaPencilAlt, FaPlus, FaTimes, FaSearch, FaChevronLeft, FaChevronRight, FaSortUp, FaSortDown, FaSort, FaCheck } from 'react-icons/fa';

const AliquoteIvaManagementModal = ({ isOpen, onClose, onSave }) => {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(0);
    const [pageSize] = useState(10);
    const [totalItems, setTotalItems] = useState(0);

    const [editId, setEditId] = useState(null);
    const [editDescrizione, setEditDescrizione] = useState('');
    const [editCodice, setEditCodice] = useState('');
    const [editImposta, setEditImposta] = useState('');
    const [editIndetraibilita, setEditIndetraibilita] = useState('');
    const [editClasse, setEditClasse] = useState('');
    const [editPredefinita, setEditPredefinita] = useState(false);

    // Sorting state: default sort by 'codice' (column 0) ASC
    const [sortConfig, setSortConfig] = useState({ key: 'codice', direction: 'asc' });

    const classiIva = [
        { value: 'IM', label: 'Imponibile' },
        { value: 'NI', label: 'Non imponibile' },
        { value: 'NS', label: 'Non soggette' },
        { value: 'EE', label: 'Esente' },
        { value: 'EC', label: 'Escluso' },
        { value: 'FC', label: 'Fuori campo' },
        { value: 'RC', label: 'Acquisto rev. charge' },
        { value: 'IU', label: 'Acquisto intra UE' },
        { value: 'EU', label: 'Acquisto extra UE' },
        { value: 'NE', label: 'Non esposta' },
        { value: 'AA', label: 'Altro' }
    ];

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen, page, search, sortConfig]);

    if (!isOpen) return null;

    const loadData = async () => {
        setLoading(true);
        try {
            const response = await AliquoteIvaService.getList({
                descrizione: search,
                start: page * pageSize,
                length: pageSize,
                orderColumn: sortConfig.key === 'codice' ? 0 : sortConfig.key === 'descrizione' ? 1 : 0,
                orderDir: sortConfig.direction
            });
            if (response.data && response.data.payload) {
                setList(response.data.payload);
                if (response.data.payload.length > 0) {
                    setTotalItems(response.data.payload[0].total || response.data.payload.length);
                } else {
                    setTotalItems(0);
                }
            } else {
                setList([]);
                setTotalItems(0);
            }
        } catch (error) {
            console.error("Error loading vat rates", error);
            setList([]);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(0);
    };

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <FaSort style={{ color: '#ccc' }} />;
        return sortConfig.direction === 'asc' ? <FaSortUp /> : <FaSortDown />;
    };

    const handleEdit = (item) => {
        openDetailModal(item.id, item.descrizione, item.codice, item.imposta, item.indetraibilita, item.classe, item.predefinita === 1);
    };

    const handleAdd = () => {
        openDetailModal(null, '', '', '', '', 'IM', false);
    };

    const openDetailModal = (id, existingDesc, existingCodice, existingImposta, existingIndet, existingClasse, existingPredef) => {
        // Generate Options for Select
        const classeOptions = classiIva.map(c => `<option value="${c.value}" ${existingClasse === c.value ? 'selected' : ''}>${c.label}</option>`).join('');

        Swal.fire({
            title: id ? 'Modifica Aliquota IVA' : 'Nuova Aliquota IVA',
            html: `
                <div style="text-align: left; padding: 10px 5px;">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="premium-swal-label">Codice</label>
                                <input id="swal-codice" class="form-control premium-swal-input" placeholder="Es. 22" value="${existingCodice || ''}">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="premium-swal-label">Imposta %</label>
                                <input id="swal-imposta" type="number" step="0.01" class="form-control premium-swal-input" placeholder="Es. 22.00" value="${existingImposta || ''}">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                         <div class="col-md-6">
                            <div class="form-group">
                                <label class="premium-swal-label">Indetraibilità %</label>
                                <input id="swal-indetraibilita" type="number" step="0.01" class="form-control premium-swal-input" placeholder="Es. 0.00" value="${existingIndet || ''}">
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-group">
                                <label class="premium-swal-label">Classe</label>
                                <select id="swal-classe" class="form-control premium-swal-input">
                                    ${classeOptions}
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="premium-swal-label">Descrizione</label>
                        <input id="swal-descrizione" class="form-control premium-swal-input" placeholder="Es. Iva Ordinaria..." value="${existingDesc || ''}">
                    </div>
                    <div class="form-group" style="padding-top: 10px; display: flex; align-items: center;">
                        <label class="premium-toggle-switch">
                            <input type="checkbox" id="swal-predefinita" ${existingPredef ? 'checked' : ''}>
                            <span class="premium-slider"></span>
                        </label>
                        <span class="premium-toggle-label" onclick="document.getElementById('swal-predefinita').click()">Predefinita</span>
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Salva',
            cancelButtonText: 'Annulla',
            showLoaderOnConfirm: true,
            buttonsStyling: false,
            width: 600,
            customClass: {
                popup: 'premium-swal-popup',
                title: 'premium-swal-title',
                confirmButton: 'premium-swal-confirm',
                cancelButton: 'premium-swal-cancel'
            },
            preConfirm: async () => {
                const descrizione = document.getElementById('swal-descrizione').value;
                const codice = document.getElementById('swal-codice').value;
                const imposta = document.getElementById('swal-imposta').value;
                const indetraibilita = document.getElementById('swal-indetraibilita').value;
                const classe = document.getElementById('swal-classe').value;
                const predefinita = document.getElementById('swal-predefinita').checked;

                if (!codice) {
                    Swal.showValidationMessage('Il codice è obbligatorio');
                    return false;
                }
                if (!imposta) {
                    Swal.showValidationMessage('L\'imposta è obbligatoria');
                    return false;
                }
                if (!descrizione) {
                    Swal.showValidationMessage('La descrizione è obbligatoria');
                    return false;
                }

                try {
                    let res;
                    const data = {
                        descrizione,
                        codice,
                        imposta: parseFloat(imposta),
                        indetraibilita: indetraibilita ? parseFloat(indetraibilita) : 0,
                        classe: classe,
                        predefinita: predefinita ? 1 : 0
                    };

                    if (id) {
                        res = await AliquoteIvaService.update(id, data);
                    } else {
                        res = await AliquoteIvaService.create(data);
                    }

                    if (res.data && res.data.errorText) {
                        Swal.showValidationMessage(res.data.errorText);
                        return false;
                    }
                    return res.data;
                } catch (error) {
                    const msg = error.response?.data?.errorText || 'Errore durante il salvataggio';
                    Swal.showValidationMessage(msg);
                    return false;
                }
            },
            allowOutsideClick: () => !Swal.isLoading()
        }).then((result) => {
            if (result.isConfirmed) {
                loadData();
                if (onSave) onSave();
                Swal.fire({
                    icon: 'success',
                    title: id ? 'Aggiornata!' : 'Creata!',
                    text: id ? 'Aliquota IVA aggiornata.' : 'Aliquota IVA creata.',
                    timer: 1500,
                    showConfirmButton: false,
                    customClass: {
                        popup: 'premium-swal-popup',
                        title: 'premium-swal-title'
                    }
                });
            }
        });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Sei sicuro?',
            text: "Non potrai annullare questa operazione!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e74c3c',
            cancelButtonColor: '#95a5a6',
            confirmButtonText: 'Sì, elimina',
            cancelButtonText: 'Annulla'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await AliquoteIvaService.delete(id);
                    Swal.fire(
                        'Eliminata!',
                        'L\'aliquota IVA è stata eliminata.',
                        'success'
                    );
                    loadData();
                    if (onSave) onSave();
                } catch (error) {
                    Swal.fire('Errore', 'Impossibile eliminare: ' + (error.response?.data?.errorText || error.message), 'error');
                }
            }
        });
    };

    const totalPages = Math.ceil(totalItems / pageSize);

    return (
        <div className="modal show premium-modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content premium-modal-content">
                    <div className="modal-header">
                        <button type="button" className="close" onClick={onClose} aria-label="Close" style={{ opacity: 1, color: '#333' }}>
                            <span aria-hidden="true">&times;</span>
                        </button>
                        <h4 className="modal-title">Gestione Aliquote IVA</h4>
                    </div>
                    <div className="modal-body" style={{ maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                        {/* Toolbar */}
                        <div className="modal-toolbar">
                            <div className="toolbar-left">
                                <div className="toolbar-item">
                                    <span>Mostra 10 righe</span>
                                </div>
                            </div>

                            <div className="toolbar-right">
                                <div className="toolbar-search-wrapper">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Cerca..."
                                        value={search}
                                        onChange={handleSearch}
                                    />
                                    <i className="fa fa-search"></i>
                                </div>
                                <button className="btn btn-primary" onClick={handleAdd}>
                                    <FaPlus /> Aggiungi
                                </button>
                            </div>
                        </div>

                        <table className="table table-striped table-hover">
                            <thead>
                                <tr>
                                    <th style={{ width: '20%', cursor: 'pointer' }} onClick={() => handleSort('codice')}>
                                        CODICE {getSortIcon('codice')}
                                    </th>
                                    <th style={{ cursor: 'pointer' }} onClick={() => handleSort('descrizione')}>
                                        DESCRIZIONE {getSortIcon('descrizione')}
                                    </th>
                                    <th style={{ width: '15%' }}>IMPOSTA %</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>PRED.</th>
                                    <th style={{ width: '120px', textAlign: 'center' }}>AZIONI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="text-center">Caricamento...</td>
                                    </tr>
                                ) : list.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center">Nessuna aliquota trovata.</td>
                                    </tr>
                                ) : (
                                    list.map(item => (
                                        <tr key={item.id}>
                                            <td> {item.codice} </td>
                                            <td> {item.descrizione} </td>
                                            <td> {item.imposta}% </td>
                                            <td className="text-center">
                                                {(item.predefinita === 1 || item.predefinita === true) && <FaCheck style={{ color: '#2ecc71' }} />}
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-info btn-sm" style={{ marginRight: '5px' }} onClick={() => handleEdit(item)} title="Modifica">
                                                    <FaPencilAlt />
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)} title="Elimina">
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        <div className="pagination-container" style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="pagination-info" style={{ color: '#888', fontSize: '0.9em' }}>
                                Visualizzati {list.length} di {totalItems} risultati
                            </span>
                            {totalPages > 1 && (
                                <nav>
                                    <ul className="pagination">
                                        <li className={page === 0 ? 'disabled' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); if (page > 0) setPage(page - 1); }}>
                                                <FaChevronLeft />
                                            </a>
                                        </li>
                                        {[...Array(totalPages)].map((_, i) => {
                                            if (totalPages > 10) {
                                                if (i > 0 && i < totalPages - 1 && (i < page - 2 || i > page + 2)) {
                                                    if (i === page - 3 || i === page + 3) return <li key={i} className="disabled"><span>...</span></li>;
                                                    return null;
                                                }
                                            }
                                            return (
                                                <li key={i} className={page === i ? 'active' : ''}>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); setPage(i); }}>
                                                        {i + 1}
                                                    </a>
                                                </li>
                                            );
                                        })}
                                        <li className={page >= totalPages - 1 ? 'disabled' : ''}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); if (page < totalPages - 1) setPage(page + 1); }}>
                                                <FaChevronRight />
                                            </a>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AliquoteIvaManagementModal;
