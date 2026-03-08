import { test, expect } from '@playwright/test';

test.describe('Creazione DDT', () => {

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

        // 1. Combos Map
        await page.route(`**/ddt/combos-map*`, async route => {
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
        await page.route(`${apiPattern}/ddt/nextNum?*`, async route => {
            const json = { esito: { code: 200 }, payload: 'DDT-2026-001' };
            await route.fulfill({ json });
        });

        // 3. Clienti suggestion
        await page.route(`${apiPattern}/clienti/suggestion*`, async route => {
            const json = [{
                id: 300,
                denominazione: 'Cliente DDT Srl',
                indirizzo: 'Via Milano 5',
                citta: 'Bologna',
                cap: '40100',
                provincia: 'BO',
                partitaIva: '01234567890',
                codiceFiscale: '01234567890',
                idTipoPagamento: 1
            }];
            await route.fulfill({ json });
        });

        // 4. Indirizzi Cliente
        await page.route(`${apiPattern}/indirizzi/clienti/300`, async route => {
            const json = { esito: { code: 200 }, payload: [] };
            await route.fulfill({ json });
        });

        // 5. Dettaglio Cliente
        await page.route(`${apiPattern}/clienti/300`, async route => {
            const json = {
                esito: { code: 200 },
                payload: {
                    id: 300,
                    denominazione: 'Cliente DDT Srl',
                    indirizzo: 'Via Milano 5',
                    citta: 'Bologna',
                    cap: '40100',
                    provincia: 'BO',
                    partitaIva: '01234567890'
                }
            };
            await route.fulfill({ json });
        });

        // 6. Global config
        await page.route(`${apiPattern}/configurazione/get-by-domain*`, async route => {
            await route.fulfill({ json: [] });
        });
    });

    test('salvataggio nuovo DDT con articolo e FM', async ({ page }) => {
        let savePayload = null;

        // Intercetta salvataggio
        await page.route('**/ddt*', async route => {
            if (route.request().method() === 'POST' && !route.request().url().includes('list')) {
                savePayload = route.request().postDataJSON();
                await route.fulfill({ status: 200, json: { esito: { code: 200 }, payload: { id: 999 } } });
            } else if (route.request().method() === 'OPTIONS') {
                await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*' } });
            } else {
                await route.continue();
            }
        });

        // Vai alla rotta
        await page.goto('/ddt/new');

        // Attendiamo che il DOM primario si carichi
        await page.waitForSelector('h1:has-text("Nuovo DDT")');

        // Bypass SweetAlert
        await page.evaluate(() => {
            const swal = document.querySelector('.swal2-container');
            if (swal) swal.remove();
        });

        // Attendiamo il campo Cliente
        const clientInputLocator = page.locator('.compact-col-xl input[type="text"]').first();
        await expect(clientInputLocator).toBeVisible({ timeout: 10000 });

        // Digitiamo e selezioniamo il cliente
        await clientInputLocator.click();
        await clientInputLocator.pressSequentially('Cliente DDT', { delay: 100 });
        await page.getByText('Cliente DDT Srl', { exact: false }).click();
        await page.waitForTimeout(500);

        // Numero Documento
        const numDocLocator = page.locator('input[name="numDocumento"]');
        await expect(numDocLocator).toBeVisible();
        await numDocLocator.fill('DDT-2026-001');

        // Spostamento sul TAB Articoli
        await page.locator('.nav-tabs a', { hasText: /Articoli/i }).click();

        // Clicchiamo "FUORI MAGAZZINO" (F.M.)
        await page.locator('.btn-add-inline', { hasText: /FUORI MAGAZZINO/i }).click();

        // Tabella
        await page.waitForSelector('table tbody tr');
        const rows = page.locator('table tbody tr');

        // Verifica riga aggiunta
        const firstRow = rows.nth(0);
        await expect(firstRow).toBeVisible();
        await firstRow.locator('input[type="text"]').first().fill('Materiale vario di cantiere');
        await firstRow.locator('input[type="number"]').nth(0).fill('5'); // QUANTITA
        await firstRow.locator('input[type="number"]').nth(1).fill('50'); // PREZZO
        await firstRow.locator('input[type="number"]').nth(1).blur();

        // Clicchiamo Salva
        await page.locator('button.btn-premium-save').click();
        await page.waitForTimeout(1500);

        // Controlliamo l'esito
        const swalText = await page.evaluate(() => {
            const swal = document.querySelector('.swal2-popup');
            return swal ? swal.innerText : null;
        });

        expect(swalText).toMatch(/Successo|Salvato!/i);

        // Verifiche Payload
        expect(savePayload).toBeTruthy();
        expect(savePayload.numDocumento).toBe('DDT-2026-001');
        expect(savePayload.idCliente).toBe(300);

        // Righe inserite
        expect(savePayload.prodotti.length).toBe(1);

        // Prima riga
        expect(savePayload.prodotti[0].tipo).toBe('F');
        expect(savePayload.prodotti[0].fmDescrizione).toBe('Materiale vario di cantiere');
        expect(Number(savePayload.prodotti[0].quantita)).toBe(5);
        expect(Number(savePayload.prodotti[0].prezzo)).toBe(50);
        expect(savePayload.prodotti[0].idAliquotaIva).toBe(1); // Mappato dalla predefinita
        expect(savePayload.prodotti[0].scarica).toBe(1); // Verifichiamo che scarica sia 1 per DDT
    });
});
