import React, { useState, useEffect } from 'react';
import StudioService from '../services/StudioService';
import authService from '../services/authService';
import Swal from 'sweetalert2';
import { FaPaperPlane } from 'react-icons/fa';

const InvitoStudioBanner = ({ compact = false }) => {
    const appConfig = authService.getConfig ? authService.getConfig() : {};
    const currentUser = authService.getCurrentUser ? authService.getCurrentUser() : null;
    const u = currentUser?.user || currentUser || {};
    const tipoAccount = appConfig.tipoAccount || appConfig.tipo_account || u.tipoAccount || u.tipo_account || 1;
    const isEligible = tipoAccount >= 1 && tipoAccount <= 4;

    const [hasDelega, setHasDelega] = useState(true); // default: nascosto finché non sappiamo
    const [loading, setLoading] = useState(isEligible);

    useEffect(() => {
        if (!isEligible) return;
        StudioService.getDelegheRicevute()
            .then(res => setHasDelega((res.data || []).length > 0))
            .catch(() => setHasDelega(true)) // in dubbio, non mostrare il banner
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!isEligible || loading || hasDelega) return null;

    const showInfo = () => {
        Swal.fire({
            title: 'Invita il tuo Commercialista',
            html: 'Comunica al tuo studio contabile la tua <b>Partita IVA</b>: se usa già SmartDoc potrà inviarti una richiesta di collegamento direttamente da qui.<br/><br/>Se non lo conosce ancora, invitalo a scoprire SmartDoc per Studi Commercialisti su <a href="https://www.smart-doc.it" target="_blank" rel="noreferrer">www.smart-doc.it</a>!',
            icon: 'info',
            confirmButtonText: 'Ho capito'
        });
    };

    return (
        <div style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 55%, #db2777 100%)',
            borderRadius: '14px',
            padding: compact ? '16px 22px' : '24px 28px',
            marginBottom: '20px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
            flexWrap: 'wrap'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, minWidth: '260px' }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    minWidth: '44px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                }}>
                    🚀
                </div>
                <div>
                    <div style={{ fontWeight: '800', fontSize: '15px', marginBottom: '3px' }}>
                        Invita il tuo commercialista su SmartDoc
                    </div>
                    <div style={{ fontSize: '13px', opacity: 0.92, lineHeight: 1.4 }}>
                        Potrà controllare le tue fatture in un click, senza email né PDF da inviare avanti e indietro.
                    </div>
                </div>
            </div>
            <button
                type="button"
                className="btn btn-xs"
                onClick={showInfo}
                style={{
                    background: '#ffffff',
                    color: '#4f46e5',
                    fontWeight: '800',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                }}
            >
                <FaPaperPlane /> Scopri come
            </button>
        </div>
    );
};

export default InvitoStudioBanner;
