import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { FaShieldAlt, FaChartPie, FaShoppingCart, FaBoxOpen, FaAngleDown, FaAngleUp } from 'react-icons/fa';

const AccordionItem = ({ title, icon, color, description, features, restrictions, isOpen, onClick }) => {
    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '5px', marginBottom: '10px', overflow: 'hidden' }}>
            <div 
                style={{ 
                    padding: '12px 15px', 
                    backgroundColor: '#fff', 
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: isOpen ? '1px solid #ddd' : 'none'
                }}
                onClick={onClick}
            >
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: color, display: 'flex', alignItems: 'center' }}>
                    <span style={{ marginRight: '8px' }}>{icon}</span> {title}
                </div>
                <div>
                    {isOpen ? <FaAngleUp color="#999" /> : <FaAngleDown color="#999" />}
                </div>
            </div>
            {isOpen && (
                <div style={{ padding: '15px', backgroundColor: '#fdfdfd' }}>
                    <p><strong>{description}</strong></p>
                    <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {features.map((ft, idx) => (
                            <li key={idx} style={{ marginBottom: '6px' }}>{ft}</li>
                        ))}
                        {restrictions && (
                            <li style={{ marginTop: '10px' }}><strong className="text-danger">Restrizioni:</strong> {restrictions}</li>
                        )}
                    </ul>
                </div>
            )}
        </div>
    );
};

const RuoliHelpModal = ({ show, onHide }) => {
    const [openKey, setOpenKey] = useState(0);

    const toggleOpen = (key) => {
        setOpenKey(openKey === key ? null : key);
    };

    if (!show) return null;

    return ReactDOM.createPortal(
        <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }} tabIndex="-1" role="dialog">
            <div className="modal-dialog modal-lg" role="document">
                <div className="modal-content">
                    <div className="modal-header" style={{ borderBottom: '1px solid #eee' }}>
                        <h4 className="modal-title" style={{ display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
                            <FaShieldAlt style={{ color: '#3498db', marginRight: '10px', fontSize: '1.2em' }} /> 
                            Guida ai Ruoli e Permessi
                        </h4>
                        <button type="button" className="close" onClick={onHide} aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div className="modal-body" style={{ padding: '20px' }}>
                        <p className="text-muted" style={{ marginBottom: '20px', fontSize: '15px' }}>
                            Questa guida illustra nel dettaglio tutte le autorizzazioni assegnate a ciascun profilo aziendale in SmartDoc. Di seguito l'elenco completo:
                        </p>

                        <AccordionItem 
                            title="ADMIN (Amministratore)" 
                            icon="👑" 
                            color="#e74c3c"
                            description="L'utente con privilegi assoluti. L'unico autorizzato a creare altri profili aziendali."
                            features={[
                                <React.Fragment><strong>Accesso Globale:</strong> Nessuna restrizione applicata.</React.Fragment>,
                                <React.Fragment><strong>Gestione Utenti:</strong> Può creare profili, oscurarli o inviare reset della password.</React.Fragment>,
                                <React.Fragment><strong>Configurazione Globale:</strong> Dati Azienda, Parametri Fatturazione Elettronica e Profili Documentali.</React.Fragment>,
                                <React.Fragment><strong>Reportistica:</strong> Accesso illimitato alle analisi economiche e gestionali complete.</React.Fragment>
                            ]}
                            isOpen={openKey === 0}
                            onClick={() => toggleOpen(0)}
                        />

                        <AccordionItem 
                            title="ACCOUNTING (Amministrazione e Contabilità)" 
                            icon={<FaChartPie />} 
                            color="#27ae60"
                            description="Pensato per i responsabili della fiscalità, dei pagamenti e del ciclo attivo/passivo."
                            features={[
                                <React.Fragment><strong>Gestione Finanziaria:</strong> Accesso in scrittura/lettura a Prima Nota e Registri IVA.</React.Fragment>,
                                <React.Fragment><strong>Gestione Documentale:</strong> Piena creazione di Fatture (di Vendita e Fornitore), Note di Credito, DDT, Preventivi e Conferme d'Ordine.</React.Fragment>,
                                <React.Fragment><strong>Anagrafiche Base:</strong> Libero inserimento/modifica di Clienti, Fornitori e Listini Prezzi.</React.Fragment>,
                                <React.Fragment><strong>Analisi:</strong> Visibilità totale su Statistiche di Vendita, Acquisti e Pagamenti.</React.Fragment>
                            ]}
                            restrictions="Non può visualizzare la Gestione Utenti, né alterare le impostazioni di Fatturazione e i Dati Aziendali."
                            isOpen={openKey === 1}
                            onClick={() => toggleOpen(1)}
                        />

                        <AccordionItem 
                            title="SALES (Commerciale / Vendite)" 
                            icon={<FaShoppingCart />} 
                            color="#f39c12"
                            description="Rivolto agli agenti o al personale predisposto unicamente alla creazione dell'offerta di vendita."
                            features={[
                                <React.Fragment><strong>Acquisizione e Ordini:</strong> Pieno accesso alla creazione/stampa di Preventivi e Conferme d'Ordine.</React.Fragment>,
                                <React.Fragment><strong>Prodotti:</strong> Accesso al catalogo "Articoli" e consultazione Listini Prezzo.</React.Fragment>,
                                <React.Fragment><strong>Gestione Contatti:</strong> Completo inserimento/modifica dei soli Clienti.</React.Fragment>,
                                <React.Fragment><strong>Logistica Leggera:</strong> Emissione e visualizzazione occasionale dei DDT di vendita.</React.Fragment>
                            ]}
                            restrictions="Non visiona la Prima Nota, Registri IVA, le Fatture e i costi d'acquisto. Non dispone delle impostazioni di sistema."
                            isOpen={openKey === 2}
                            onClick={() => toggleOpen(2)}
                        />

                        <AccordionItem 
                            title="WAREHOUSE (Magazzino e Logistica)" 
                            icon={<FaBoxOpen />} 
                            color="#8e44ad"
                            description="Specifico per chi movimenta fisicamente la merce, escludendo dati finanziari."
                            features={[
                                <React.Fragment><strong>Inventariato:</strong> Permessi liberi per Movimenti Magazzino, Scarichi/Carichi e Rettifiche di Inventario.</React.Fragment>,
                                <React.Fragment><strong>Gestione Merci Base:</strong> Ricerca, manipolazione e inserimento "Articoli" per le giacenze.</React.Fragment>,
                                <React.Fragment><strong>Logistica:</strong> Compilazione, stampa e consultazione di soli DDT sia in entrata (Fornitori) che in uscita.</React.Fragment>,
                                <React.Fragment><strong>Approvvigionamento:</strong> Accesso all'anagrafica Fornitori.</React.Fragment>
                            ]}
                            restrictions="Blocco verso valori finanziari, Fatture, Prima Nota e Statistiche economiche. Nessun accesso alla rubrica Clienti slegata dai DDT."
                            isOpen={openKey === 3}
                            onClick={() => toggleOpen(3)}
                        />

                    </div>
                    <div className="modal-footer" style={{ borderTop: '1px solid #eee' }}>
                        <button type="button" className="btn btn-default" onClick={onHide}>
                            Chiudi
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default RuoliHelpModal;
