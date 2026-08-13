import React, { useState, useRef, useEffect } from 'react';
import { FaTag } from 'react-icons/fa';

/**
 * Icona + popover per forzare manualmente il conto contabile di una riga documento, in override
 * rispetto alla cascata automatica (articolo -> sottocategoria -> categoria -> ruolo generico).
 * Visibile solo sui documenti che generano scritture contabili (Fatture, Fatture Fornitore,
 * Note di Credito, Note di Credito Fornitore) e solo per i piani che lo abilitano (vedi chiamante).
 */
const ContoOverridePopover = ({ value, conti, onChange, disabled = false }) => {
    const [open, setOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        const handleEsc = (e) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [open]);

    const hasOverride = value !== null && value !== undefined && value !== '';

    return (
        <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
            <button
                type="button"
                title={hasOverride ? 'Conto contabile forzato manualmente' : 'Forza conto contabile'}
                onClick={() => !disabled && setOpen(o => !o)}
                disabled={disabled}
                style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: disabled ? 'default' : 'pointer',
                    padding: '4px',
                    color: hasOverride ? '#2563eb' : '#cbd5e1',
                    opacity: disabled ? 0.4 : 1,
                    display: 'flex',
                    alignItems: 'center'
                }}
            >
                <FaTag size={13} />
            </button>

            {open && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        zIndex: 20,
                        background: '#fff',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                        padding: '12px',
                        width: '260px'
                    }}
                >
                    <label style={{ display: 'block', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                        Conto contabile (override)
                    </label>
                    <select
                        className="form-control"
                        style={{ width: '100%', marginBottom: '8px' }}
                        value={value || ''}
                        onChange={(e) => {
                            const v = e.target.value ? parseInt(e.target.value, 10) : null;
                            onChange(v);
                        }}
                        autoFocus
                    >
                        <option value="">Nessun override (usa il conto automatico)</option>
                        {(conti || []).map(c => (
                            <option key={c.id} value={c.id}>{c.codice} - {c.descrizione}</option>
                        ))}
                    </select>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        Senza override, il conto viene risolto automaticamente dall'articolo (o, in mancanza, da un conto generico).
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContoOverridePopover;
