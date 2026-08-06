import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import CompletaRegistrazione from './pages/CompletaRegistrazione';
import RegistrazioneProva from './pages/RegistrazioneProva';
import authService from './services/authService';
import './App.css';

import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ImpersonationBanner from './components/ImpersonationBanner';
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
import FattureFornitoreList from './pages/FattureFornitore/FattureFornitoreList';
import FattureFornitoreDetail from './pages/FattureFornitore/FattureFornitoreDetail';
import OrdiniList from './pages/Ordini/OrdiniList';
import OrdiniDetail from './pages/Ordini/OrdiniDetail';
import BollaCaricoList from './pages/BollaCarico/BollaCaricoList';
import BollaCaricoDetail from './pages/BollaCarico/BollaCaricoDetail';
import NoteCreditoFornitoreList from './pages/NoteCreditoFornitore/NoteCreditoFornitoreList';
import NoteCreditoFornitoreDetail from './pages/NoteCreditoFornitore/NoteCreditoFornitoreDetail';
import Dashboard from './pages/Dashboard/Dashboard';
import ListiniList from './pages/Configurazione/ListiniList';
import DatiGeneraliPage from './pages/Configurazione/DatiGeneraliPage';
import PrimaNotaList from './pages/PrimaNota/PrimaNotaList';
import RegistriIvaPage from './pages/RegistriIva/RegistriIvaPage';
import UtentiList from './pages/Configurazione/UtentiList';
import UtentiDetail from './pages/Configurazione/UtentiDetail';
import Prospetto770Page from './pages/Ritenute/Prospetto770Page';
import PromemoriaPage from './pages/Scadenzario/PromemoriaPage';
import RiconciliazioneBancariaPage from './pages/Riconciliazione/RiconciliazioneBancariaPage';
import StudioDashboardPage from './pages/Studio/StudioDashboardPage';
import StatistichePage from './pages/Statistiche/StatistichePage';

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const appConfig = authService.getConfig();
  const u = currentUser.user || currentUser;
  
  let userRole = appConfig?.role || currentUser?.role || u?.role;
  
  if (!userRole) {
    const gruppoId = u?.gruppo || u?.k_d_e_gruppi || currentUser?.gruppo;
    if (gruppoId === 1 || gruppoId === '1' || !gruppoId) {
      userRole = 'ROLE_ADMIN';
    } else if (gruppoId === 2 || gruppoId === '2') {
      userRole = 'ROLE_ACCOUNTING';
    } else if (gruppoId === 3 || gruppoId === '3') {
      userRole = 'ROLE_SALES';
    } else if (gruppoId === 4 || gruppoId === '4') {
      userRole = 'ROLE_WAREHOUSE';
    } else {
      userRole = 'ROLE_ADMIN';
    }
  }

  const hasRole = allowedRoles.includes(userRole) || userRole === 'ROLE_ADMIN';

  if (!hasRole) {
    return <Navigate to="/" replace />;
  }
  
  return children ? children : <Outlet />;
};

const PlanProtectedRoute = ({ minPlanLevel, children }) => {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const appConfig = authService.getConfig ? authService.getConfig() : {};
  const u = user.user || user;
  const tipoAccount = appConfig.tipoAccount || appConfig.tipo_account || u.tipoAccount || 1;

  if (tipoAccount < minPlanLevel) {
    return <Navigate to="/configurazione/dati-azienda" replace />;
  }

  return children ? children : <Outlet />;
};

const ProtectedRoute = () => {
  const user = authService.getCurrentUser();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <ImpersonationBanner />
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
    </>
  );
};


function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/completa-registrazione" element={<CompletaRegistrazione />} />
      <Route path="/registrazione-prova" element={<RegistrazioneProva />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/configurazione/dati-azienda" element={<DatiAziendaPage />} />
        <Route path="/configurazione/parametri" element={<ParametriPage />} />
        <Route path="/configurazione/fatturazione" element={<ImpostazioniFatturazionePage />} />
        <Route path="/configurazione/documenti" element={<ImpostazioniDocumentiPage />} />
        <Route path="/configurazione/listini" element={<ListiniList />} />
        <Route path="/configurazione/dati-generali" element={<DatiGeneraliPage />} />
        <Route path="/configurazione/utenti" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><UtentiList /></RoleProtectedRoute>} />
        <Route path="/configurazione/utenti/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><UtentiDetail /></RoleProtectedRoute>} />
        <Route path="/configurazione/utenti/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><UtentiDetail /></RoleProtectedRoute>} />
        <Route path="/clienti" element={<ClientiList />} />
        <Route path="/clienti/new" element={<ClientiDetail />} />
        <Route path="/clienti/:id" element={<ClientiDetail />} />
        <Route path="/fornitori" element={<FornitoriList />} />
        <Route path="/fornitori/new" element={<FornitoriDetail />} />
        <Route path="/fornitori/:id" element={<FornitoriDetail />} />
        <Route path="/preventivi" element={<PreventiviList />} />
        <Route path="/preventivi/new" element={<PreventiviDetail />} />
        <Route path="/preventivi/:id" element={<PreventiviDetail />} />
        <Route path="/conf-ordine" element={<ConfOrdineList />} />
        <Route path="/conf-ordine/new" element={<ConfOrdineDetail />} />
        <Route path="/conf-ordine/:id" element={<ConfOrdineDetail />} />
        <Route path="/ddt" element={<DDTList />} />
        <Route path="/ddt/new" element={<DDTDetail />} />
        <Route path="/ddt/:id" element={<DDTDetail />} />
        <Route path="/ordini" element={<PlanProtectedRoute minPlanLevel={4}><OrdiniList /></PlanProtectedRoute>} />
        <Route path="/ordini/new" element={<PlanProtectedRoute minPlanLevel={4}><OrdiniDetail /></PlanProtectedRoute>} />
        <Route path="/ordini/:id" element={<PlanProtectedRoute minPlanLevel={4}><OrdiniDetail /></PlanProtectedRoute>} />
        <Route path="/bollecarico" element={<PlanProtectedRoute minPlanLevel={4}><BollaCaricoList /></PlanProtectedRoute>} />
        <Route path="/bollecarico/new" element={<PlanProtectedRoute minPlanLevel={4}><BollaCaricoDetail /></PlanProtectedRoute>} />
        <Route path="/bollecarico/:id" element={<PlanProtectedRoute minPlanLevel={4}><BollaCaricoDetail /></PlanProtectedRoute>} />
        <Route path="/fatture" element={<FattureList />} />
        <Route path="/fatture/new" element={<FattureDetail />} />
        <Route path="/fatture/:id" element={<FattureDetail />} />
        <Route path="/note-credito" element={<NoteCreditoList />} />
        <Route path="/note-credito/new" element={<NoteCreditoDetail />} />
        <Route path="/note-credito/:id" element={<NoteCreditoDetail />} />
        <Route path="/fatture-fornitore" element={<PlanProtectedRoute minPlanLevel={4}><FattureFornitoreList /></PlanProtectedRoute>} />
        <Route path="/fatture-fornitore/:id" element={<PlanProtectedRoute minPlanLevel={4}><FattureFornitoreDetail /></PlanProtectedRoute>} />
        <Route path="/note-credito-fornitore" element={<PlanProtectedRoute minPlanLevel={4}><NoteCreditoFornitoreList /></PlanProtectedRoute>} />
        <Route path="/note-credito-fornitore/:id" element={<PlanProtectedRoute minPlanLevel={4}><NoteCreditoFornitoreDetail /></PlanProtectedRoute>} />
        <Route path="/articoli" element={<ArticoliList />} />
        <Route path="/articoli/movimenti" element={<MovimentiList />} />
        <Route path="/articoli/inventario" element={<InventarioMagazzinoList />} />
        <Route path="/articoli/:id" element={<ArticoliDetail />} />
        <Route path="/prima-nota" element={<PlanProtectedRoute minPlanLevel={4}><PrimaNotaList /></PlanProtectedRoute>} />
        <Route path="/registri-iva" element={<RegistriIvaPage />} />
        <Route path="/ritenute/770" element={<Prospetto770Page />} />
        <Route path="/scadenzario/promemoria" element={<PromemoriaPage />} />
        <Route path="/riconciliazione" element={<PlanProtectedRoute minPlanLevel={4}><RiconciliazioneBancariaPage /></PlanProtectedRoute>} />
        <Route path="/studio/dashboard" element={<StudioDashboardPage />} />
        <Route path="/statistiche/vendite" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_ACCOUNTING']}><StatistichePage /></RoleProtectedRoute>} />
        <Route path="/statistiche/acquisti" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_ACCOUNTING']}><StatistichePage /></RoleProtectedRoute>} />
        <Route path="/statistiche/pagamenti" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_ACCOUNTING']}><StatistichePage /></RoleProtectedRoute>} />
      </Route>
      <Route path="*" element={<h2>404 Not Found</h2>} />
    </Routes>
  );
}

export default App;
