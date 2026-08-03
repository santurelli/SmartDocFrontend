import React, { useState, useEffect } from 'react';
import { FaUserShield, FaSignOutAlt } from 'react-icons/fa';

const ImpersonationBanner = () => {
    const [impersonatedTenant, setImpersonatedTenant] = useState(null);

    useEffect(() => {
        checkImpersonation();
        window.addEventListener('storage', checkImpersonation);
        return () => window.removeEventListener('storage', checkImpersonation);
    }, []);

    const checkImpersonation = () => {
        try {
            const raw = sessionStorage.getItem('impersonated_tenant');
            if (raw) {
                setImpersonatedTenant(JSON.parse(raw));
            } else {
                setImpersonatedTenant(null);
            }
        } catch (e) {
            setImpersonatedTenant(null);
        }
    };

    const handleExit = () => {
        sessionStorage.removeItem('impersonated_tenant');
        window.location.href = '/studio/dashboard';
    };

    if (!impersonatedTenant) {
        return null;
    }

    return (
        <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 9999,
            background: 'linear-gradient(90deg, #b45309 0%, #d97706 100%)',
            color: '#ffffff',
            padding: '10px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
            fontSize: '14px',
            fontWeight: '700'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FaUserShield style={{ fontSize: '18px', color: '#fef3c7' }} />
                <span>
                    ⚠️ MODALITÀ CONSULENTE CONTABILE: Stai operando per conto dell'azienda{' '}
                    <u style={{ color: '#fffbe6', textUnderlineOffset: '3px' }}>
                        {impersonatedTenant.label || impersonatedTenant.partita_iva}
                    </u>
                </span>
            </div>

            <button
                type="button"
                onClick={handleExit}
                style={{
                    background: '#ffffff',
                    color: '#92400e',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontWeight: '800',
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                }}
            >
                <FaSignOutAlt /> Esci e Torna allo Studio
            </button>
        </div>
    );
};

export default ImpersonationBanner;
