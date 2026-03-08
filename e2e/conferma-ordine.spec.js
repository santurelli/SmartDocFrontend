import { test, expect } from '@playwright/test';

test.describe('Creazione Conferma Ordine', () => {

    test.beforeEach(async ({ page }) => {
        // Mock Login
        await page.addInitScript(() => {
            localStorage.setItem('token', 'fake-jwt-token');
            localStorage.setItem('user', JSON.stringify({
                username: 'admin',
                idStruttura: 1,
                config: { TIPO_NEGOZIO: 'standard' }
            }));
            localStorage.setItem('appConfig', JSON.stringify({
                PROGETTI: '0'
            }));
        });

        const apiPattern = '**/api/**';

        // Mocks setup

        // 1. Combos Map
        await page.route(`**/conf-ordine/combos-map*`, async route => {
            const json = {
                esito: { code: 200, message: 'OK' },
                payload: {
                    aliquoteIva: [{ id: 1, descrizione: '22%', percentuale: 22, predefinita: 1 }],
                    unitaMisura: [{ id: 1, codice: 'NR', descrizione: 'Numero' }],
                    tipiPagamento: [{ id: 1, descrizione: 'Bonifico Bancario' }],
                    risorse: [{ id: 1, descrizione: 'Banca Intesa Sanpaolo' }],
                    vettori: [],
                    causaliTrasporto: [],
                    aspettiBeni: [],
                    tipiPorto: [],
                    listini: [],
                    particelle: []
                }
            };
            await route.fulfill({ status: 200, json });
        });

        // 2. Next Num
        await page.route(`${apiPattern}/conf-ordine/nextNum?*`, async route => {
            const json = { esito: { code: 200 }, payload: 'ORD-2026-001' };
            await route.fulfill({ json });
        });

        // 3. Clienti suggestion
        await page.route(`${apiPattern}/clienti/suggestion*`, async route => {
            const json = [{
                id: 200,
                denominazione: 'Cliente Ordine Srl',
                indirizzo: 'Via Napoli 10',
                citta: 'Roma',
                cap: '00100',
                provincia: 'RM',
                partitaIva: '09876543210',
                codiceFiscale: '09876543210',
                idTipoPagamento: 1
            }];
            await route.fulfill({ json });
        });

        // 4. Indirizzi Cliente
        await page.route(`${apiPattern}/indirizzi/clienti/200`, async route => {
            const json = { esito: { code: 200 }, payload: [] };
            await route.fulfill({ json });
        });

        // 5. Dettaglio Cliente
        await page.route(`${apiPattern}/clienti/200`, async route => {
            const json = {
                esito: { code: 200 },
                payload: {
                    id: 200,
                    denominazione: 'Cliente Ordine Srl',
                    indirizzo: 'Via Napoli 10',
                    citta: 'Roma',
                    cap: '00100',
                    provincia: 'RM',
                    partitaIva: '09876543210'
                }
            };
            await route.fulfill({ json });
        });

        // 6. Global config
        await page.route(`${apiPattern}/configurazione/get-by-domain*`, async route => {
            await route.fulfill({ json: [] });
        });
    });

    test('salvataggio nuova conferma d\'ordine con articolo e nota', async ({ page }) => {
        let savePayload = null;

        // Intercetta salvataggio
        await page.route('**/conf-ordine*', async route => {
            // Seleziona specificatamente le POST ma non combos-map o nextNum
            if (route.request().method() === 'POST' && !route.request().url().includes('list')) {
                savePayload = route.request().postDataJSON();
                await route.fulfill({ status: 200, json: { esito: { code: 200 }, payload: { id: 888 } } });
            } else if (route.request().method() === 'OPTIONS') {
                await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*' } });
            } else {
                await route.continue();
            }
        });

        // Vai alla rotta
        await page.goto('/conf-ordine/new');

        // Attendiamo che il DOM primario si carichi
        await page.waitForSelector('h1:has-text("Nuova Conferma")');

        // Bypass SweetAlert di eventuali errori iniziali o caricamento
        await page.evaluate(() => {
            const swal = document.querySelector('.swal2-container');
            if (swal) swal.remove();
        });

        // Attendiamo il campo Cliente (react-select-async)
        // La label Cliente è dentro EntitySelectGroup
        const clientInputLocator = page.locator('.compact-col-xl input[type="text"]');
        await expect(clientInputLocator).toBeVisible({ timeout: 10000 });

        // Digitiamo e selezioniamo il cliente come fatto prima
        await clientInputLocator.click();
        await clientInputLocator.pressSequentially('Cliente Ordine', { delay: 100 });

        await page.getByText('Cliente Ordine Srl', { exact: false }).click();
        await page.waitForTimeout(500);

        // Forziamo il riempimento manuale del Numero Documento (tab "Generale" aperto di default)
        const numDocLocator = page.locator('input[name="numDocumento"]');
        await expect(numDocLocator).toBeVisible();
        await numDocLocator.click();
        await numDocLocator.fill('ORD-2026-001');

        // Spostamento sul TAB Articoli
        await page.locator('.nav-tabs a', { hasText: /Articoli/i }).click();

        // Clicchiamo "FUORI MAGAZZINO" (F.M.)
        await page.locator('.btn-add-inline', { hasText: /FUORI MAGAZZINO/i }).click();

        // Clicchiamo "NOTA"
        await page.locator('.btn-add-inline', { hasText: /NOTA/i }).click();

        // Tabella
        await page.waitForSelector('table tbody tr');
        const rows = page.locator('table tbody tr');
        await expect(rows).toHaveCount(3); // 2 righe aggiunte + l'ultima coi pulsanti di azione

        // Compiliamo riga 1: F.M.
        const firstRow = rows.nth(0);
        await expect(firstRow).toBeVisible();
        await firstRow.locator('input[type="text"]').first().fill('Servizio di consulenza');
        await firstRow.locator('input[type="number"]').nth(0).fill('10'); // QUANTITA
        await firstRow.locator('input[type="number"]').nth(1).fill('80'); // PREZZO
        await firstRow.locator('input[type="number"]').nth(1).blur();

        // Compiliamo riga 2: Nota
        const secondRow = rows.nth(1);
        await expect(secondRow).toBeVisible();
        await secondRow.locator('input[type="text"]').first().fill('Richiesta consegna entro venerdì');

        // Clicchiamo Salva (pulsante verde Salva)
        await page.locator('button.btn-premium-save').click();
        await page.waitForTimeout(1500);

        // Controlliamo l'esito del salvataggio tramite SweetAlert per non andare in timeout
        const swalText = await page.evaluate(() => {
            const swal = document.querySelector('.swal2-popup');
            return swal ? swal.innerText : null;
        });

        if (swalText && !swalText.includes('Successo') && !swalText.includes('Salvato!')) {
            console.error('Validation Error on Save:', swalText);
        }

        // Cerca test in swal
        expect(swalText).toMatch(/Successo|Salvato!/i);

        // Verifiche Payload inviato al server POST
        expect(savePayload).toBeTruthy();
        expect(savePayload.numDocumento).toBe('ORD-2026-001');
        expect(savePayload.idCliente).toBe(200);

        // Righe inserite
        expect(savePayload.prodotti.length).toBe(2);

        // Prima riga
        expect(savePayload.prodotti[0].tipo).toBe('F');
        expect(savePayload.prodotti[0].fmDescrizione).toBe('Servizio di consulenza');
        expect(Number(savePayload.prodotti[0].quantita)).toBe(10);
        expect(Number(savePayload.prodotti[0].prezzo)).toBe(80);
        expect(savePayload.prodotti[0].idAliquotaIva).toBe(1); // Mappato dalla predefinita

        // Seconda riga
        expect(savePayload.prodotti[1].tipo).toBe('N');
        expect(savePayload.prodotti[1].nota).toBe('Richiesta consegna entro venerdì');
    });
});
