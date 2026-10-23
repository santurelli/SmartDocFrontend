import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import CompletaRegistrazione from './pages/CompletaRegistrazione';
import ResetPassword from './pages/ResetPassword';
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
import PianoDeiContiPage from './pages/Configurazione/PianoDeiContiPage';
import EcommercePage from './pages/Configurazione/EcommercePage';
import LibroGiornaleList from './pages/Contabilita/LibroGiornaleList';
import MastriniList from './pages/Contabilita/MastriniList';
import ChiusuraEsercizioPage from './pages/Contabilita/ChiusuraEsercizioPage';
import BilancioPage from './pages/Contabilita/BilancioPage';
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
import PrevisioneCassaPage from './pages/PrevisioneCassa/PrevisioneCassaPage';
import StudioDashboardPage from './pages/Studio/StudioDashboardPage';
import StatistichePage from './pages/Statistiche/StatistichePage';
import DashboardStatistichePage from './pages/Statistiche/DashboardStatistichePage';
import UbicazioniList from './pages/Ubicazioni/UbicazioniList';
import MarcheList from './pages/Configurazione/MarcheList';

import { getUserRole, hasRole, ROLES } from './utils/rolePermissions';

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const currentUser = authService.getCurrentUser();
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userRole = getUserRole(currentUser);
  const authorized = hasRole(allowedRoles, currentUser);

  if (!authorized) {
    if (userRole === ROLES.WAREHOUSE || userRole === ROLES.WAREHOUSE_OPERATOR) {
      return <Navigate to="/articoli/movimenti" replace />;
    }
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
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/registrazione-prova" element={<RegistrazioneProva />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/configurazione/dati-azienda" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><DatiAziendaPage /></RoleProtectedRoute>} />
        <Route path="/configurazione/parametri" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><ParametriPage /></RoleProtectedRoute>} />
        <Route path="/configurazione/fatturazione" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><ImpostazioniFatturazionePage /></RoleProtectedRoute>} />
        <Route path="/configurazione/documenti" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><ImpostazioniDocumentiPage /></RoleProtectedRoute>} />
        <Route path="/libro-giornale" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><LibroGiornaleList /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/mastrini" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><MastriniList /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/chiusura-esercizio" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><ChiusuraEsercizioPage /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/bilancio" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><BilancioPage /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/piano-conti" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><PianoDeiContiPage /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/configurazione/ecommerce" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><PlanProtectedRoute minPlanLevel={3}><EcommercePage /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/configurazione/listini" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_ACCOUNTING', 'ROLE_SALES']}><ListiniList /></RoleProtectedRoute>} />
        <Route path="/configurazione/dati-generali" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><DatiGeneraliPage /></RoleProtectedRoute>} />
        <Route path="/configurazione/utenti" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><UtentiList /></RoleProtectedRoute>} />
        <Route path="/configurazione/utenti/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><UtentiDetail /></RoleProtectedRoute>} />
        <Route path="/configurazione/utenti/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ADMIN']}><UtentiDetail /></RoleProtectedRoute>} />
        <Route path="/clienti" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES']}><ClientiList /></RoleProtectedRoute>} />
        <Route path="/clienti/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES']}><ClientiDetail /></RoleProtectedRoute>} />
        <Route path="/clienti/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES']}><ClientiDetail /></RoleProtectedRoute>} />
        <Route path="/fornitori" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE']}><FornitoriList /></RoleProtectedRoute>} />
        <Route path="/fornitori/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE']}><FornitoriDetail /></RoleProtectedRoute>} />
        <Route path="/fornitori/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE']}><FornitoriDetail /></RoleProtectedRoute>} />
        <Route path="/preventivi" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES']}><PreventiviList /></RoleProtectedRoute>} />
        <Route path="/preventivi/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES']}><PreventiviDetail /></RoleProtectedRoute>} />
        <Route path="/preventivi/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES']}><PreventiviDetail /></RoleProtectedRoute>} />
        <Route path="/conf-ordine" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES']}><ConfOrdineList /></RoleProtectedRoute>} />
        <Route path="/conf-ordine/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES']}><ConfOrdineDetail /></RoleProtectedRoute>} />
        <Route path="/conf-ordine/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES']}><ConfOrdineDetail /></RoleProtectedRoute>} />
        <Route path="/ddt" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES', 'ROLE_WAREHOUSE']}><DDTList /></RoleProtectedRoute>} />
        <Route path="/ddt/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES', 'ROLE_WAREHOUSE']}><DDTDetail /></RoleProtectedRoute>} />
        <Route path="/ddt/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES', 'ROLE_WAREHOUSE']}><DDTDetail /></RoleProtectedRoute>} />
        <Route path="/ordini" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE']}><PlanProtectedRoute minPlanLevel={4}><OrdiniList /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/ordini/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE']}><PlanProtectedRoute minPlanLevel={4}><OrdiniDetail /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/ordini/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE']}><PlanProtectedRoute minPlanLevel={4}><OrdiniDetail /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/bollecarico" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE']}><PlanProtectedRoute minPlanLevel={4}><BollaCaricoList /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/bollecarico/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE']}><PlanProtectedRoute minPlanLevel={4}><BollaCaricoDetail /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/bollecarico/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE']}><PlanProtectedRoute minPlanLevel={4}><BollaCaricoDetail /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/fatture" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><FattureList /></RoleProtectedRoute>} />
        <Route path="/fatture/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><FattureDetail /></RoleProtectedRoute>} />
        <Route path="/fatture/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><FattureDetail /></RoleProtectedRoute>} />
        <Route path="/note-credito" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><NoteCreditoList /></RoleProtectedRoute>} />
        <Route path="/note-credito/new" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><NoteCreditoDetail /></RoleProtectedRoute>} />
        <Route path="/note-credito/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><NoteCreditoDetail /></RoleProtectedRoute>} />
        <Route path="/fatture-fornitore" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><FattureFornitoreList /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/fatture-fornitore/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><FattureFornitoreDetail /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/note-credito-fornitore" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><NoteCreditoFornitoreList /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/note-credito-fornitore/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><NoteCreditoFornitoreDetail /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/articoli" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES', 'ROLE_WAREHOUSE', 'ROLE_WAREHOUSE_OPERATOR']}><ArticoliList /></RoleProtectedRoute>} />
        <Route path="/articoli/movimenti" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE', 'ROLE_WAREHOUSE_OPERATOR']}><MovimentiList /></RoleProtectedRoute>} />
        <Route path="/articoli/inventario" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE', 'ROLE_WAREHOUSE_OPERATOR']}><InventarioMagazzinoList /></RoleProtectedRoute>} />
        <Route path="/ubicazioni" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE', 'ROLE_WAREHOUSE_OPERATOR']}><UbicazioniList /></RoleProtectedRoute>} />
        <Route path="/marche" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_WAREHOUSE', 'ROLE_WAREHOUSE_OPERATOR']}><MarcheList /></RoleProtectedRoute>} />
        <Route path="/articoli/:id" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING', 'ROLE_SALES', 'ROLE_WAREHOUSE', 'ROLE_WAREHOUSE_OPERATOR']}><ArticoliDetail /></RoleProtectedRoute>} />
        <Route path="/prima-nota" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><PrimaNotaList /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/registri-iva" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><RegistriIvaPage /></RoleProtectedRoute>} />
        <Route path="/ritenute/770" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><Prospetto770Page /></RoleProtectedRoute>} />
        <Route path="/scadenzario/promemoria" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PromemoriaPage /></RoleProtectedRoute>} />
        <Route path="/riconciliazione" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><RiconciliazioneBancariaPage /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/previsione-cassa" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><PlanProtectedRoute minPlanLevel={4}><PrevisioneCassaPage /></PlanProtectedRoute></RoleProtectedRoute>} />
        <Route path="/studio/dashboard" element={<StudioDashboardPage />} />
        <Route path="/statistiche/dashboard" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><DashboardStatistichePage /></RoleProtectedRoute>} />
        <Route path="/statistiche/vendite" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><StatistichePage /></RoleProtectedRoute>} />
        <Route path="/statistiche/acquisti" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><StatistichePage /></RoleProtectedRoute>} />
        <Route path="/statistiche/pagamenti" element={<RoleProtectedRoute allowedRoles={['ROLE_ACCOUNTING']}><StatistichePage /></RoleProtectedRoute>} />
      </Route>
      <Route path="*" element={<h2>404 Not Found</h2>} />
    </Routes>
  );
}

export default App;
