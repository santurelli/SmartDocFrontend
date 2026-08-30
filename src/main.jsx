import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Swal from 'sweetalert2';
import { registerSW } from 'virtual:pwa-register';
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// PWA: con registerType 'prompt' l'aggiornamento non si applica da solo (non vogliamo che l'app
// si ricarichi a sorpresa mentre l'utente sta compilando una fattura). Chiediamo conferma.
const updateSW = registerSW({
  onNeedRefresh() {
    Swal.fire({
      title: 'Nuova versione disponibile',
      text: 'È disponibile un aggiornamento di SmartDoc. Aggiorna ora?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Aggiorna',
      cancelButtonText: 'Più tardi'
    }).then((result) => {
      if (result.isConfirmed) {
        updateSW(true); // attiva il nuovo service worker e ricarica
      }
    });
  }
});
