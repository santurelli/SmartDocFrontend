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
import ListiniList from './pages/Configurazione/ListiniList';
import DatiGeneraliPage from './pages/Configurazione/DatiGeneraliPage';
import PrimaNotaList from './pages/PrimaNota/PrimaNotaList';
import RegistriIvaPage from './pages/RegistriIva/RegistriIvaPage';
import UtentiList from './pages/Configurazione/UtentiList';
import UtentiDetail from './pages/Configurazione/UtentiDetail';

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const appConfig = authService.getConfig();
  const userRole = appConfig?.role || 'ROLE_USER';

  // Se l'utente ha il ruolo richiesto, mostra il contenuto, altrimenti reindirizza (es: alla dashboard)
  const hasRole = allowedRoles.includes(userRole);

  if (!hasRole) {
    return <Navigate to="/" replace />;
  }
  
  return children ? children : <Outlet />;
};

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
        <Route path="/configurazione/dati-azienda" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><DatiAziendaPage /></RoleProtectedRoute>} />
        <Route path="/configurazione/fatturazione" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><ImpostazioniFatturazionePage /></RoleProtectedRoute>} />
        <Route path="/configurazione/documenti" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><ImpostazioniDocumentiPage /></RoleProtectedRoute>} />
        <Route path="/configurazione/listini" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_ACCOUNTING', 'ROLE_SALES']}><ListiniList /></RoleProtectedRoute>} />
        <Route path="/configurazione/generali" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_ACCOUNTING']}><DatiGeneraliPage /></RoleProtectedRoute>} />
        
        <Route path="/configurazione/utenti" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><UtentiList /></RoleProtectedRoute>} />
        <Route path="/configurazione/utenti/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><UtentiDetail /></RoleProtectedRoute>} />
        <Route path="/configurazione/utenti/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><UtentiDetail /></RoleProtectedRoute>} />

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
        <Route path="/prima-nota" element={<PrimaNotaList />} />
        <Route path="/registri-iva" element={<RegistriIvaPage />} />
      </Route>
      <Route path="*" element={<h2>404 Not Found</h2>} />
    </Routes>
  );
}

export default App;
