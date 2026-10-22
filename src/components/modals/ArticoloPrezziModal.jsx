import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    FaTags, 
    FaTimes, 
    FaCopy, 
    FaCheck, 
    FaBoxes, 
    FaExternalLinkAlt, 
    FaEye, 
    FaInfoCircle 
} from 'react-icons/fa';
import ArticoliService from '../../services/ArticoliService';
import ListiniService from '../../services/ListiniService';
import './ArticoloPrezziModal.css';

const ArticoloPrezziModal = ({ show, handleClose, article }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [listiniWithPrices, setListiniWithPrices] = useState([]);
    const [includeIva, setIncludeIva] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);

    // Standard VAT rate (22% default or article custom)
    const vatRate = article?.aliquotaIva ? parseFloat(article.aliquotaIva) : 22.0;

    useEffect(() => {
        if (show && article?.id) {
            loadPrices();
        }
    }, [show, article]);

    // Handle ESC key to close
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [show, handleClose]);

    const loadPrices = async () => {
        setLoading(true);
        try {
            // Fetch listini and current product prices in parallel
            const [listiniRes, prezziRes] = await Promise.all([
                ListiniService.getAll(),
                ArticoliService.getPrezzi(article.id)
            ]);

            const allListini = listiniRes.payload || listiniRes || [];
            const productPrices = prezziRes.data?.payload || prezziRes.data || [];

            const cost = parseFloat(article.prezzoFornitore || 0);

            // Combine each listino with its price
            const merged = allListini.map(listino => {
                const manualEntry = productPrices.find(p => p.idListino === listino.id);
                const hasManual = manualEntry && manualEntry.prezzo !== null && manualEntry.prezzo !== undefined && manualEntry.prezzo !== '';
                
                let effectivePrice = null;
                let isCalculated = false;

                if (hasManual) {
                    effectivePrice = parseFloat(manualEntry.prezzo);
                } else {
                    // Try to calculate price based on derivation
                    const type = listino.derivationType || 'NONE';
                    const val = parseFloat(listino.derivationValue || 0);

                    if (type === 'PERCENTAGE' && cost > 0) {
                        effectivePrice = cost * (1 + val / 100);
                        isCalculated = true;
                    } else if (type === 'FIXED_MARKUP' && cost > 0) {
                        effectivePrice = cost + val;
                        isCalculated = true;
                    } else if (cost > 0) {
                        // fallback to cost if no other rule
                        effectivePrice = cost;
                        isCalculated = true;
                    }
                }

                // If rounding rule exists
                if (effectivePrice !== null && listino.roundingRule && listino.roundingRule > 0) {
                    const rule = parseFloat(listino.roundingRule);
                    effectivePrice = Math.round(effectivePrice / rule) * rule;
                }

                return {
                    id: listino.id,
                    descrizione: listino.descrizione,
                    flDefault: listino.flDefault === 1,
                    derivationType: listino.derivationType,
                    derivationValue: listino.derivationValue,
                    hasManual,
                    isCalculated,
                    netPrice: effectivePrice !== null ? effectivePrice : null
                };
            });

            // Sort: default listini first, then alphabetical
            merged.sort((a, b) => {
                if (a.flDefault && !b.flDefault) return -1;
                if (!a.flDefault && b.flDefault) return 1;
                return (a.descrizione || '').localeCompare(b.descrizione || '');
            });

            setListiniWithPrices(merged);
        } catch (error) {
            console.error("Errore nel caricamento dei prezzi listino", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (amount, index) => {
        if (!amount && amount !== 0) return;
        const textToCopy = amount.toFixed(2);
        navigator.clipboard.writeText(textToCopy);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 1800);
    };

    const handleNavigateToEdit = () => {
        handleClose();
        navigate(`/articoli/${article.id}?tab=prices`);
    };

    const getArticleDisplayDescription = (art) => {
        if (!art) return '-';
        const isTire = Boolean(art.sezione || art.diametro || art.scultura || art.dot);
        if (isTire) {
            const parts = [];
            if (art.sezione && art.serie) {
                parts.push(`${art.sezione}/${art.serie}`);
            } else if (art.sezione) {
                parts.push(art.sezione);
            }
            if (art.diametro) {
                parts.push(`R${art.diametro}`);
            }
            if (art.indiceVelocita) {
                parts.push(art.indiceVelocita);
            }
            if (art.scultura) {
                parts.push(art.scultura);
            }
            const tireSpec = parts.join(' ').trim();
            let primaryText = tireSpec || art.descrizione;
            if (art.descMarca && !primaryText.toLowerCase().includes(art.descMarca.toLowerCase())) {
                primaryText = `${art.descMarca} ${primaryText}`;
            }
            return primaryText;
        }

        // If not tire, but has scultura or descrizione
        if (art.scultura && (!art.descrizione || art.descrizione === art.codice)) {
            return art.scultura;
        }
        return art.descrizione || art.scultura || '-';
    };

    if (!show || !article) return null;

    const supplierCost = parseFloat(article.prezzoFornitore || 0);
    const stockQty = parseFloat(article.quantitaEsistente || 0);
    const displayDesc = getArticleDisplayDescription(article);

    return (
        <div className="prezzi-modal-backdrop" onClick={handleClose}>
            <div 
                className="prezzi-modal-container" 
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                {/* Grab handle visible on mobile */}
                <div className="prezzi-modal-drag-handle" />

                {/* Header */}
                <div className="prezzi-modal-header">
                    <div className="prezzi-modal-title-group">
                        <div className="prezzi-modal-title-icon">
                            <FaTags />
                        </div>
                        <div className="prezzi-modal-title-text">
                            <h3>Prezzi di Vendita</h3>
                            <span>Listini applicabili per questo articolo</span>
                        </div>
                    </div>
                    <button 
                        type="button" 
                        className="prezzi-modal-close-btn" 
                        onClick={handleClose}
                        aria-label="Chiudi"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Body */}
                <div className="prezzi-modal-body">
                    {/* Article quick summary card */}
                    <div className="prezzi-article-summary">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div>
                                <span className="prezzi-field-label">Codice Articolo</span>
                                <div className="prezzi-field-value-code">
                                    <span className="prezzi-article-code">{article.codice || '-'}</span>
                                    {(article.descMarca || article.marca) && (
                                        <span className="prezzi-article-brand">
                                            {article.descMarca || article.marca}
                                        </span>
                                    )}
                                    {article.dot && (
                                        <span className="prezzi-badge-dot">DOT {article.dot}</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <span className="prezzi-field-label">Descrizione</span>
                                <div className="prezzi-article-desc">
                                    {displayDesc}
                                </div>
                            </div>
                        </div>
                        <div className="prezzi-article-meta-row">
                            <div className="prezzi-article-cost">
                                Costo fornitore: <strong>{supplierCost.toFixed(2)} €</strong>
                            </div>
                            <div className={`prezzi-article-stock ${stockQty <= 0 ? 'out-of-stock' : ''}`}>
                                <FaBoxes style={{ fontSize: '11px' }} />
                                <span>Giacenza: {stockQty.toFixed(0)} pz</span>
                            </div>
                        </div>
                    </div>

                    {/* Controls Row: VAT toggle */}
                    <div className="prezzi-controls-row">
                        <span className="prezzi-section-label">Listini ({listiniWithPrices.length})</span>
                        <label className="prezzi-iva-toggle">
                            <input 
                                type="checkbox" 
                                checked={includeIva} 
                                onChange={(e) => setIncludeIva(e.target.checked)} 
                            />
                            <span>Mostra prezzi con IVA ({vatRate}%)</span>
                        </label>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="prezzi-loading-spinner">
                            <div className="spinner-border spinner-border-sm text-primary" role="status" style={{ marginRight: '8px' }} />
                            Caricamento listini in corso...
                        </div>
                    ) : listiniWithPrices.length === 0 ? (
                        <div className="prezzi-empty-state">
                            <FaInfoCircle />
                            <p style={{ margin: '8px 0 4px 0', fontWeight: 600 }}>Nessun listino configurato</p>
                            <small>Crea dei listini in Configurazione &gt; Listini per definire prezzi e ricarichi.</small>
                        </div>
                    ) : (
                        <div className="prezzi-listini-grid">
                            {listiniWithPrices.map((item, idx) => {
                                const net = item.netPrice;
                                const withIva = net !== null ? net * (1 + vatRate / 100) : null;
                                const displayPrice = includeIva ? withIva : net;
                                const altPrice = includeIva ? net : withIva;

                                // Margin calculation vs supplier cost
                                const hasMargin = net !== null && supplierCost > 0;
                                const marginEur = hasMargin ? (net - supplierCost) : null;
                                const marginPct = hasMargin ? ((marginEur / supplierCost) * 100) : null;

                                return (
                                    <div 
                                        key={item.id} 
                                        className={`prezzi-listino-card ${item.flDefault ? 'is-default' : ''}`}
                                    >
                                        <div className="prezzi-listino-info">
                                            <div className="prezzi-listino-name-row">
                                                <span className="prezzi-listino-name">{item.descrizione}</span>
                                                {item.flDefault && (
                                                    <span className="prezzi-badge-default">Predefinito</span>
                                                )}
                                            </div>
                                            <div className="prezzi-listino-rule">
                                                <span className="prezzi-rule-pill">
                                                    {item.hasManual ? (
                                                        'Prezzo fisso'
                                                    ) : item.derivationType === 'PERCENTAGE' ? (
                                                        `Ricarico +${item.derivationValue}%`
                                                    ) : item.derivationType === 'FIXED_MARKUP' ? (
                                                        `Ricarico +€${item.derivationValue}`
                                                    ) : (
                                                        'Base costo'
                                                    )}
                                                </span>

                                                {hasMargin && (
                                                    <span className="prezzi-margin-badge" title="Margine rispetto al costo fornitore">
                                                        +{marginEur.toFixed(2)} € ({marginPct.toFixed(1)}%)
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="prezzi-listino-amount-box">
                                            <div className="prezzi-amount-wrapper">
                                                {displayPrice !== null ? (
                                                    <>
                                                        <span className="prezzi-main-price">
                                                            € {displayPrice.toFixed(2)}
                                                        </span>
                                                        <span className="prezzi-sub-price">
                                                            {includeIva 
                                                                ? `(imp. € ${altPrice.toFixed(2)})` 
                                                                : `(con IVA € ${altPrice.toFixed(2)})`}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '13px' }}>
                                                        Non impostato
                                                    </span>
                                                )}
                                            </div>

                                            {displayPrice !== null && (
                                                <button
                                                    type="button"
                                                    className={`prezzi-copy-btn ${copiedIndex === idx ? 'copied' : ''}`}
                                                    onClick={() => handleCopy(displayPrice, idx)}
                                                    title={copiedIndex === idx ? 'Copiato negli appunti!' : 'Copia prezzo'}
                                                >
                                                    {copiedIndex === idx ? <FaCheck /> : <FaCopy />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="prezzi-modal-footer">
                    <button 
                        type="button" 
                        className="prezzi-btn-edit" 
                        onClick={handleNavigateToEdit}
                    >
                        <FaExternalLinkAlt style={{ fontSize: '11px' }} />
                        <span>Modifica listini articolo</span>
                    </button>
                    <button 
                        type="button" 
                        className="prezzi-btn-close" 
                        onClick={handleClose}
                    >
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArticoloPrezziModal;
