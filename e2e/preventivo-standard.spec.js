import { test, expect } from '@playwright/test';

test.describe('Creazione Preventivo Standard', () => {

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

        // 1. Combos
        await page.route(`**/preventivi/combos-map*`, async route => {
            const json = {
                esito: { code: 200, message: 'OK' },
                payload: {
                    aliquoteIva: [{ id: 1, descrizione: '22%', percentuale: 22, predefinita: 1 }],
                    unitaMisura: [{ id: 1, codice: 'NR', descrizione: 'Numero' }],
                    tipiPagamento: [{ id: 1, descrizione: 'Bonifico Bancario' }],
                    risorse: [{ id: 1, descrizione: 'Banca Intesa Sanpaolo' }],
                    listini: [],
                    particelle: []
                }
            };
            await route.fulfill({ status: 200, json });
        });

        // 2. Next Num (PreventiviService.getNextNum)
        await page.route(`${apiPattern}/preventivi/nextNum?*`, async route => {
            const json = { esito: { code: 200 }, payload: 'PREV-2026-001' };
            await route.fulfill({ json });
        });

        // 3. Clienti suggestion
        await page.route(`${apiPattern}/clienti/suggestion*`, async route => {
            const json = [{
                id: 200,
                denominazione: 'Cliente Preventivo Srl',
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
                    denominazione: 'Cliente Preventivo Srl',
                    indirizzo: 'Via Napoli 10',
                    citta: 'Roma',
                    cap: '00100',
                    provincia: 'RM',
                    partitaIva: '09876543210'
                }
            };
            await route.fulfill({ json });
        });

        // 6. Global config (Ceramica check)
        await page.route(`${apiPattern}/configurazione/get-by-domain*`, async route => {
            await route.fulfill({ json: [] });
        });
    });

    test('salvataggio nuovo preventivo con articolo e riga libera', async ({ page }) => {
        let savePayload = null;

        // Intercetta salvataggio preventivo
        await page.route('**/preventivi*', async route => {
            if (route.request().method() === 'POST') {
                savePayload = route.request().postDataJSON();
                await route.fulfill({ status: 200, json: { esito: { code: 200 }, payload: { id: 777 } } });
            } else if (route.request().method() === 'OPTIONS') {
                await route.fulfill({ status: 204, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': '*' } });
            } else {
                await route.continue();
            }
        });

        await page.goto('/preventivi/new');
        await expect(page.locator('h1')).toContainText('Nuovo preventivo');

        // Seleziona Cliente (EntitySelectGroup come in Fatture)
        const clienteInput = page.locator('.compact-col-xl', { hasText: 'Cliente' }).locator('input[type="text"]').first();
        await clienteInput.click();
        await clienteInput.pressSequentially('Cliente Preventivo', { delay: 100 });

        // Bypass SweetAlert di eventuali errori iniziali o caricamento
        await page.evaluate(() => {
            const swal = document.querySelector('.swal2-container');
            if (swal) swal.remove();
        });

        // Click on the option rendered by react-select
        await page.getByText('Cliente Preventivo Srl', { exact: false }).click();
        await page.waitForTimeout(500);

        // Forziamo il riempimento manuale di testata se i mock precedenti hanno fallito as is
        const numDocLocator = page.locator('input[name="numDocumento"]');
        await numDocLocator.click();
        await numDocLocator.fill('PREV-2026-001');

        // Dettaglio Articoli
        await page.locator('.nav-tabs a', { hasText: /Articoli/i }).click();

        // Aggiungi una riga fuori magazzino e una nota
        await page.locator('button.btn-add-inline.fm').click();
        await page.locator('button.btn-add-inline.note').click();

        const rows = page.locator('table.table-items tbody tr');
        // 2 added rows + 1 actions row = 3
        await expect(rows).toHaveCount(3);

        const firstRow = rows.nth(0);
        await expect(firstRow).toBeVisible();

        // Compiliamo riga 1: Fuori magazzino
        await firstRow.locator('input[type="text"]').first().fill('Sviluppo Software');
        await firstRow.locator('input[type="number"]').nth(0).fill('40'); // ORE
        await firstRow.locator('input[type="number"]').nth(1).fill('50'); // PREZZO
        await firstRow.locator('input[type="number"]').nth(1).blur();

        // Compiliamo riga 2: Nota
        const secondRow = rows.nth(1);
        await expect(secondRow).toBeVisible();
        await secondRow.locator('input[type="text"]').first().fill('Sviluppo backend in Node.js');

        // Il riempimento manuale è stato spostato sopra.

        // LOG Form Values Prima di Salvare
        const formValues = await page.evaluate(() => {
            return {
                numDocumento: document.querySelector('input[name="numDocumento"]')?.value,
                dataDocumento: document.querySelector('input[name="dataDocumento"]')?.value,
                clienteText: document.querySelector('.compact-col-xl input[type="hidden"]')?.value || document.querySelector('.compact-col-xl input[type="text"]')?.value
            };
        });
        console.log('--- FORM VALUES BEFORE SAVE ---', formValues);

        // Clicchiamo Salva
        await page.locator('button.btn-premium-save').click();
        await page.waitForTimeout(1500);

        // Controlliamo l'esito del salvataggio tramite SweetAlert
        const swalText = await page.evaluate(() => {
            const swal = document.querySelector('.swal2-popup');
            return swal ? swal.innerText : null;
        });
        if (swalText && !swalText.includes('Successo')) {
            console.error('Validation Error on Save:', swalText);
        }
        expect(swalText).toContain('Successo');

        // Verifiche Payload
        expect(savePayload).toBeTruthy();
        expect(savePayload.numDocumento).toBe('PREV-2026-001');
        expect(savePayload.idCliente).toBe(200);

        // Righe inserite
        expect(savePayload.prodotti.length).toBe(2);

        // Prima riga
        expect(savePayload.prodotti[0].tipo).toBe('F');
        expect(savePayload.prodotti[0].fmDescrizione).toBe('Sviluppo Software');
        expect(Number(savePayload.prodotti[0].quantita)).toBe(40);
        expect(Number(savePayload.prodotti[0].prezzo)).toBe(50);
        expect(savePayload.prodotti[0].fuoriMagazzino).toBe(true);
        expect(savePayload.prodotti[0].idAliquotaIva).toBe(1); // Mappato dalla predefinita

        // Seconda riga
        expect(savePayload.prodotti[1].tipo).toBe('N');
        expect(savePayload.prodotti[1].nota).toBe('Sviluppo backend in Node.js');
    });
});
