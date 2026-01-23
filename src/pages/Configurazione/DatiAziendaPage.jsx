import React from 'react';
import DatiAziendaForm from './DatiAziendaForm';
import { FaBuilding } from 'react-icons/fa';
import './ConfigurazionePage.css'; // Reusing existing styling for header/container

const DatiAziendaPage = () => {
    return (
        <div className="config-page-container">
            <div className="config-header">
                <h2><FaBuilding style={{ marginRight: '10px' }} />Dati Azienda</h2>
            </div>
            <div className="tab-content-wrapper" style={{ border: 'none', padding: '0' }}>
                <DatiAziendaForm />
            </div>
        </div>
    );
};

export default DatiAziendaPage;
