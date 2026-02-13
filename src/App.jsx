import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import authService from './services/authService';
import './App.css';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ClientiList from './pages/Clienti/ClientiList';
import ArticoliList from './pages/Articoli/ArticoliList';
import MovimentiList from './pages/Articoli/MovimentiList';
import InventarioMagazzinoList from './pages/Articoli/InventarioMagazzinoList';
import ArticoliDetail from './pages/Articoli/ArticoliDetail';
import ClientiDetail from './pages/Clienti/ClientiDetail';
import PreventiviList from './pages/Preventivi/PreventiviList';
import PreventiviDetail from './pages/Preventivi/PreventiviDetail';
import DatiAziendaPage from './pages/Configurazione/DatiAziendaPage';
import ParametriPage from './pages/Configurazione/ParametriPage';
import FornitoriList from './pages/Fornitori/FornitoriList';
import FornitoriDetail from './pages/Fornitori/FornitoriDetail';
import ConfOrdineList from './pages/ConfOrdine/ConfOrdineList';
import ConfOrdineDetail from './pages/ConfOrdine/ConfOrdineDetail';
import DDTList from './pages/DDT/DDTList';
import DDTDetail from './pages/DDT/DDTDetail';
import FattureList from './pages/Fatture/FattureList';
import FattureDetail from './pages/Fatture/FattureDetail';
import NoteCreditoList from './pages/NoteCredito/NoteCreditoList';
import NoteCreditoDetail from './pages/NoteCredito/NoteCreditoDetail';

const ProtectedRoute = ({ children }) => {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <div id="theme-wrapper">
      <Header
        user={user.user}
        onLogout={() => authService.logout()}
        toggleSidebar={() => {/* Implement sidebar toggle if needed later */ }}
      />
      <Sidebar user={user.user} />
      <div id="content-wrapper">
        {children}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const user = authService.getCurrentUser();
  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  if (!user || !user.user) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Errore nel caricamento dei dati utente</h1>
        <button onClick={handleLogout} className="login-button" style={{ maxWidth: '200px', margin: '0 auto' }}>Esci e Riprova</button>
      </div>
    );
  }

  return (
    <div className="row">
      <div className="col-lg-12">
        <div className="row">
          <div className="col-lg-12">
            <div id="content-header" className="clearfix">
              <div className="pull-left">
                <ol className="breadcrumb">
                  <li><a href="#">Home</a></li>
                  <li className="active"><span>Dashboard</span></li>
                </ol>
                <h1>Dashboard</h1>
              </div>
            </div>
          </div>
        </div>

        <div className="main-box clearfix">
          <header className="main-box-header clearfix">
            <h2>Benvenuto, {user.user.nome} {user.user.cognome}</h2>
          </header>
          <div className="main-box-body clearfix">
            <p>Hai effettuato l'accesso con successo in <strong>{user.user.nomeAzienda}</strong>.</p>
            <p style={{ marginTop: '10px' }}>Questa è la nuova dashboard di SmartDoc.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clienti" element={<ClientiList />} />
                <Route path="/clienti/:id" element={<ClientiDetail />} />
                <Route path="/preventivi" element={<PreventiviList />} />
                <Route path="/preventivi/new" element={<PreventiviDetail />} />
                <Route path="/preventivi/:id" element={<PreventiviDetail />} />
                <Route path="/conf-ordine" element={<ConfOrdineList />} />
                <Route path="/conf-ordine/new" element={<ConfOrdineDetail />} />
                <Route path="/conf-ordine/:id" element={<ConfOrdineDetail />} />
                <Route path="/configurazione/dati-azienda" element={<DatiAziendaPage />} />
                <Route path="/configurazione/dati-sistema" element={<ParametriPage />} />
                <Route path="/fornitori" element={<FornitoriList />} />
                <Route path="/fornitori/:id" element={<FornitoriDetail />} />
                <Route path="/ddt" element={<DDTList />} />
                <Route path="/ddt/new" element={<DDTDetail />} />
                <Route path="/ddt/:id" element={<DDTDetail />} />
                <Route path="/fatture" element={<FattureList />} />
                <Route path="/fatture/new" element={<FattureDetail />} />
                <Route path="/fatture/:id" element={<FattureDetail />} />
                <Route path="/note-credito" element={<NoteCreditoList />} />
                <Route path="/note-credito/new" element={<NoteCreditoDetail />} />
                <Route path="/note-credito/:id" element={<NoteCreditoDetail />} />
                <Route path="/articoli" element={<ArticoliList />} />
                <Route path="/articoli/movimenti" element={<MovimentiList />} />
                <Route path="/articoli/inventario" element={<InventarioMagazzinoList />} />
                <Route path="/articoli/:id" element={<ArticoliDetail />} />
                <Route path="*" element={<h2>404 Not Found</h2>} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
