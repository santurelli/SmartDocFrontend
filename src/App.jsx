import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
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
import ImpostazioniFatturazionePage from './pages/Configurazione/ImpostazioniFatturazionePage';
import ImpostazioniDocumentiPage from './pages/Configurazione/ImpostazioniDocumentiPage';
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
import Dashboard from './pages/Dashboard/Dashboard';

const ProtectedRoute = () => {
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
        <Outlet />
      </div>
    </div>
  );
};


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
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
        <Route path="/configurazione/fatturazione" element={<ImpostazioniFatturazionePage />} />
        <Route path="/configurazione/documenti" element={<ImpostazioniDocumentiPage />} />
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
      </Route>
      <Route path="*" element={<h2>404 Not Found</h2>} />
    </Routes>
  );
}

export default App;
