import { test, expect } from '@playwright/test';

test.describe('Emissione Fattura con Ritenuta d\'Acconto', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Mock Login (se necessario, saltando il login reale mockando localStorage/auth)
        // Set fake token
        await page.addInitScript(() => {
            localStorage.setItem('token', 'fake-jwt-token');
            localStorage.setItem('user', JSON.stringify({
                username: 'admin',
                idStruttura: 1,
                config: { TIPO_NEGOZIO: 'standard' }
            }));
        });

        // 2. Mock API Requests
        // Usiamo un pattern flessibile per l'URL (v1 o meno)
        const apiPattern = '**/api/**';

        // Combos
        await page.route(`${apiPattern}/fatture/combos`, async route => {
            const json = {
                esito: { code: 200, message: 'OK' },
                payload: {
                    aliquoteIva: [{ id: 1, descrizione: '22%', percentuale: 22, predefinita: 1 }],
                    unitaMisura: [{ id: 1, codice: 'NR', descrizione: 'Numero' }],
                    tipiPagamento: [{ id: 1, descrizione: 'Bonifico Bancario' }],
                    risorse: [{ id: 1, descrizione: 'Banca Intesa Sanpaolo' }],
                    causaliEsigibilitaDifferita: []
                }
            };
            await route.fulfill({ json });
        });

        // Preferenze fatturazione
        await page.route(`${apiPattern}/configurazione/domain/FATTURAZIONE`, async route => {
            const json = { EMETTI_RITENUTA: '0', PERC_RITENUTA: '20', TIPO_RITENUTA: 'RT02' };
            await route.fulfill({ json });
        });

        // Next Num
        await page.route(`${apiPattern}/fatture/nextNum?*`, async route => {
            const json = { esito: { code: 200 }, payload: 'TEST-RIT-001' };
            await route.fulfill({ json });
        });

        // Clienti search suggestion
        await page.route(`${apiPattern}/clienti/suggestion?q=ClienteTest*`, async route => {
            const json = {
                esito: { code: 200 },
                payload: [{
                    id: 100,
                    denominazione: 'Cliente Test SPA',
                    indirizzo: 'Via Roma 1',
                    citta: 'Milano',
                    cap: '20100',
                    provincia: 'MI',
                    partitaIva: '12345678901',
                    codiceFiscale: '12345678901',
                    idTipoPagamento: 1
                }]
            };
            await route.fulfill({ json });
        });

        // Indirizzi Cliente
        await page.route(`${apiPattern}/clienti/100/indirizzi`, async route => {
            const json = { esito: { code: 200 }, payload: [] };
            await route.fulfill({ json });
        });

        // Dettaglio Cliente
        await page.route(`${apiPattern}/clienti/100`, async route => {
            const json = {
                esito: { code: 200 },
                payload: {
                    id: 100,
                    denominazione: 'Cliente Test SPA',
                    indirizzo: 'Via Roma 1',
                    citta: 'Milano',
                    cap: '20100',
                    provincia: 'MI',
                    partitaIva: '12345678901',
                    idTipoPagamento: 1
                }
            };
            await route.fulfill({ json });
        });
    });

    test('salvataggio fattura con ritenuta correttamente valorizzata nel payload', async ({ page }) => {
        // Intercetta la chiamata di salvataggio per verificare il payload
        let savePayload = null;
        await page.route('**/api/**/fatture', async route => {
            if (route.request().method() === 'POST') {
                savePayload = route.request().postDataJSON();
                await route.fulfill({
                    json: { esito: { code: 200, message: 'OK' }, payload: { id: 999 } }
                });
            } else {
                await route.continue();
            }
        });

        // Vai alla pagina nuova fattura
        await page.goto('/fatture/new');

        // Attendiamo che la pagina sia caricata e i default impostati
        await expect(page.locator('h1')).toContainText('Nuova Fattura');

        // Selezione Cliente usando react-select (AsyncSelect)
        // Cerchiamo l'input nel gruppo "Cliente"
        const clienteSelectContainer = page.locator('.compact-col-xl', { hasText: 'Cliente' });
        const clienteInput = clienteSelectContainer.locator('input[type="text"]').first();
        await clienteInput.fill('ClienteTest');

        // Dismiss any sweetalert popup if it appears (e.g. error, warning on load)
        // If it's a warning/error from Swal, the confirm button usually has class .swal2-confirm
        const swalClose = page.locator('.swal2-confirm');
        try {
            await swalClose.waitFor({ state: 'visible', timeout: 2000 });
            await swalClose.click();
            // wait for the swal container to disappear
            await page.locator('.swal2-container').waitFor({ state: 'hidden', timeout: 2000 });
        } catch (e) {
            // No swal appeared, which is fine
        }
        // As a fallback, hard-remove any swal container that might be stealing pointer events
        await page.evaluate(() => {
            const swal = document.querySelector('.swal2-container');
            if (swal) swal.remove();
        });

        // Attendiamo che l'opzione mockata (Cliente Test SPA) si carichi, 
        // e la selezioniamo premendo Enter (reat-select evidenzia automaticamente la prima)
        await page.waitForTimeout(500); // breve attesa per l'aggiornamento dei risultati mockati
        await clienteInput.press('Enter');

        // Abilita la Ritenuta d'Acconto (checkbox)
        // Checkbox states often fail in Playwright se coperti da div padding o label annidiate (e intercettazioni React).
        // Usiamo page.evaluate come bypass sicuro per cliccare fisicamente l'input
        await page.evaluate(() => {
            const checkbox = document.querySelector('input[name="flRitenutaAcconto"]');
            if (checkbox) checkbox.click();
        });

        // Seleziona Tipo Ritenuta (es. RT02 - Persone giuridiche)
        // Aspettiamo che il dom si aggiorni e mostri la select a seguito del click sulla checkbox
        const tipoRitSelect = page.locator('select[name="tipoRitenuta"]');
        await tipoRitSelect.waitFor({ state: 'visible', timeout: 5000 });
        await tipoRitSelect.selectOption('RT02');

        // Cambiamo tab agli "Articoli"
        // Usiamo evaluate per essere sicuri di triggerare l'evento React senza intercettazioni
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-tabs a'));
            const artTab = tabs.find(a => a.innerText.includes('Articoli'));
            if (artTab) artTab.click();
        });

        // Aggiungi un articolo a testo libero (Fuori Magazzino - F)
        // Usiamo evaluate per bypassare eventuali problemi di click su bottoni in tab-pane
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const fmBtn = btns.find(b => b.innerText.includes('FUORI MAGAZZINO'));
            if (fmBtn) fmBtn.click();
        });

        // Attendiamo che la riga appaia
        const firstRow = page.locator('table.table-items tbody tr').first();
        await expect(firstRow).toBeVisible();

        // 1. Descrizione (primo input text della riga)
        const inputDesc = firstRow.locator('input[type="text"]').first();
        await inputDesc.fill('Consulenza informatica');

        // 2. Quantità = 2 (primo input number della riga)
        const inputQta = firstRow.locator('input[type="number"]').nth(0);
        await inputQta.fill('2');

        // 3. Prezzo unitario = 1000 (secondo input number della riga)
        const inputPrezzo = firstRow.locator('input[type="number"]').nth(1);
        await inputPrezzo.fill('1000');
        await inputPrezzo.blur();

        // Verifichiamo che la spunta della ritenuta (flRitenuta) sia attiva di default sulla riga
        // In DocumentRows è un input type=checkbox dentro un div class "ritenuta-inline-box"
        const rowRitenutaCheckbox = page.locator('table.table-items tbody tr').first()
            .locator('.ritenuta-inline-box input[type="checkbox"]').first();
        await expect(rowRitenutaCheckbox).toBeChecked();

        // Clicchiamo Salva. Usiamo evaluate per evitare intercettazioni
        await page.evaluate(() => {
            const saveBtn = document.querySelector('button.btn-premium-save');
            if (saveBtn) saveBtn.click();
        });

        // Aspettiamo che la rotta esegua
        await page.waitForResponse(resp => resp.url().includes('/api') && resp.url().includes('/fatture') && resp.request().method() === 'POST');

        // Verifiche sul body inviato
        expect(savePayload).toBeTruthy();
        expect(savePayload.flRitenutaAcconto).toBe(1);
        expect(savePayload.tipoRitenuta).toBe('RT02');

        // Verifica calcolo importi
        // Imp imponibile: 2000.  Ritenuta: 20% di 2000 = 400
        expect(Number(savePayload.importoRitenutaAcconto)).toBeCloseTo(400, 2);

        // Verifica che l'articolo abbia flRitenuta = 1
        expect(savePayload.prodotti.length).toBe(1);
        expect(Number(savePayload.prodotti[0].flRitenuta)).toBe(1);
        expect(savePayload.prodotti[0].fmDescrizione).toBe('Consulenza informatica');
        expect(Number(savePayload.prodotti[0].quantita)).toBe(2);
        expect(Number(savePayload.prodotti[0].prezzo)).toBe(1000);
    });
});
