import { test, expect } from '@playwright/test';

test.describe('Emissione Fattura Standard e Visibilità', () => {

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
                EMETTI_RITENUTA: '1', // Default per il primo test
                PROGETTI: '0'
            }));
        });

        const apiPattern = '**/api/**';

        // Combos
        await page.route(`${apiPattern}/fatture/combos`, async route => {
            const json = {
                esito: { code: 200, message: 'OK' },
                payload: {
                    aliquoteIva: [{ id: 1, descrizione: '22%', percentuale: 22, predefinita: 1 }],
                    unitaMisura: [{ id: 1, codice: 'NR', descrizione: 'Numero' }],
                    tipiPagamento: [
                        { id: 1, descrizione: 'Bonifico Bancario' },
                        {
                            id: 2,
                            descrizione: 'Bonifico 30/60/90',
                            scadenze: [
                                { giorni: 30, percTotale: 33.33, fineMese: 0 },
                                { giorni: 60, percTotale: 33.33, fineMese: 0 },
                                { giorni: 90, percTotale: 33.34, fineMese: 0 }
                            ]
                        }
                    ],
                    risorse: [{ id: 1, descrizione: 'Banca Intesa Sanpaolo' }],
                    causaliEsigibilitaDifferita: []
                }
            };
            await route.fulfill({ json });
        });

        // Next Num
        await page.route(`${apiPattern}/fatture/nextNum?*`, async route => {
            const json = { esito: { code: 200 }, payload: 'TEST-STD-001' };
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

        // Articoli search suggestion (getList)
        await page.route(`${apiPattern}/articoli/list`, async route => {
            if (route.request().method() === 'POST') {
                const json = {
                    esito: { code: 200 },
                    payload: [
                        { id: 500, codice: 'ART001', descrizione: 'Articolo Magazzino 1', unitaMisura: 'NR', idAliquotaIva: 1, prezzo: 100 },
                        { id: 501, codice: 'ART002', descrizione: 'Articolo Magazzino 2', unitaMisura: 'NR', idAliquotaIva: 1, prezzo: 200 }
                    ]
                };
                await route.fulfill({ json });
            } else {
                await route.continue();
            }
        });

        // Articoli price engine
        await page.route(`${apiPattern}/articoli/price`, async route => {
            if (route.request().method() === 'POST') {
                const { idProdotto, idListino } = route.request().postDataJSON();
                let prezzo = 0;
                if (idProdotto === 500) {
                    prezzo = idListino === 2 ? 85.50 : 100.00;
                }
                const json = {
                    esito: { code: 200 },
                    payload: { prezzo: prezzo }
                };
                await route.fulfill({ json });
            } else {
                await route.continue();
            }
        });
    });

    test('salvataggio fattura standard (senza ritenuta attiva)', async ({ page }) => {
        const apiPattern = '**/api/**';

        // Mock configurazione: ritenuta abilitata ma NON cliccheremo la spunta
        await page.route(`${apiPattern}/configurazione/get-by-domain*`, async route => {
            const json = { EMETTI_RITENUTA: '1', PERC_RITENUTA: '20', TIPO_RITENUTA: 'RT02' };
            await route.fulfill({ json });
        });

        // Intercetta salvataggio
        let savePayload = null;
        await page.route(`${apiPattern}/fatture`, async route => {
            if (route.request().method() === 'POST') {
                savePayload = route.request().postDataJSON();
                await route.fulfill({ json: { esito: { code: 200 }, payload: { id: 888 } } });
            } else {
                await route.continue();
            }
        });

        await page.goto('/fatture/new');
        await expect(page.locator('h1')).toContainText('Nuova Fattura');

        // Selezione Cliente
        const clienteInput = page.locator('.compact-col-xl', { hasText: 'Cliente' }).locator('input[type="text"]').first();
        await clienteInput.fill('ClienteTest');

        // Bypass SweetAlert
        await page.evaluate(() => {
            const swal = document.querySelector('.swal2-container');
            if (swal) swal.remove();
        });

        await page.waitForTimeout(500);
        await clienteInput.press('Enter');

        // NON clicchiamo "Gestione Ritenuta d'Acconto"
        // Verifichiamo sia disattivata di default (se configurazione dice EMETTI_RITENUTA: 1 ma il checkbox in testata è 0 per default? No, fetchRitenutaPreferences lo mette a 1 se EMETTI_RITENUTA è 1)
        // ATTENZIONE: Se EMETTI_RITENUTA è 1, il frontend lo pre-seleziona. Quindi dobbiamo DISATTIVARLO se vogliamo una fattura standard.
        const checkboxRit = page.locator('input[name="flRitenutaAcconto"]');
        if (await checkboxRit.isChecked()) {
            await page.evaluate(() => {
                const cb = document.querySelector('input[name="flRitenutaAcconto"]');
                if (cb) cb.click();
            });
        }
        await expect(checkboxRit).not.toBeChecked();

        // Aggiungi Articolo
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-tabs a'));
            const artTab = tabs.find(a => a.innerText.includes('Articoli'));
            if (artTab) artTab.click();
        });

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const fmBtn = btns.find(b => b.innerText.includes('FUORI MAGAZZINO'));
            if (fmBtn) fmBtn.click();
        });

        const firstRow = page.locator('table.table-items tbody tr').first();
        await expect(firstRow).toBeVisible();

        await firstRow.locator('input[type="text"]').first().fill('Servizio Standard');
        await firstRow.locator('input[type="number"]').nth(0).fill('1');
        await firstRow.locator('input[type="number"]').nth(1).fill('500');
        await firstRow.locator('input[type="number"]').nth(1).blur();

        // Verifica che la riga NON abbia la ritenuta visibile (perchè la testata non ha ritenuta attiva)
        const rowRitLocator = firstRow.locator('.ritenuta-inline-box');
        await expect(rowRitLocator).not.toBeVisible();

        await page.evaluate(() => {
            const saveBtn = document.querySelector('button.btn-premium-save');
            if (saveBtn) saveBtn.click();
        });

        await page.waitForResponse(resp => resp.url().includes('/api') && resp.url().includes('/fatture') && resp.request().method() === 'POST');

        expect(savePayload).toBeTruthy();
        expect(Number(savePayload.flRitenutaAcconto)).toBe(0);
        expect(Number(savePayload.importoRitenutaAcconto)).toBe(0);
        expect(Number(savePayload.prodotti[0].quantita)).toBe(1);
        expect(Number(savePayload.prodotti[0].prezzo)).toBe(500);
    });

    test('salvataggio fattura con articolo da magazzino (test pricing dinamico)', async ({ page }) => {
        const apiPattern = '**/api/**';
        let savePayload = null;
        await page.route(`${apiPattern}/fatture`, async route => {
            if (route.request().method() === 'POST') {
                savePayload = route.request().postDataJSON();
                await route.fulfill({ json: { esito: { code: 200 }, payload: { id: 123 } } });
            } else {
                await route.continue();
            }
        });

        await page.goto('/fatture/new');
        
        // Seleziona Cliente con listino 2 (immaginiamo che il cliente 100 abbia listino 2, o lo forziamo nel mock)
        // Aggiorniamo il mock del cliente nel volo del test per includere idListino: 2
        await page.route(`${apiPattern}/clienti/100`, async route => {
            await route.fulfill({
                json: {
                    esito: { code: 200 },
                    payload: { id: 100, denominazione: 'Cliente Listino 2', idListino: 2, idTipoPagamento: 1 }
                }
            });
        });

        const clienteInput = page.locator('.compact-col-xl', { hasText: 'Cliente' }).locator('input[type="text"]').first();
        await clienteInput.fill('ClienteTest');
        await page.waitForTimeout(500);
        await clienteInput.press('Enter');

        // Tab Articoli
        await page.locator('.nav-tabs a', { hasText: /Articoli/i }).click();

        // Aggiungi Articolo (da magazzino)
        await page.locator('button', { hasText: /^ARTICOLO$/ }).click();

        // Seleziona Articolo 500
        const artInput = page.locator('table.table-items tbody tr').first().locator('.col-desc-articolo input');
        await artInput.fill('ART001');
        await page.waitForTimeout(500);
        await page.getByText('Articolo Magazzino 1').click();

        // Verifica che il prezzo sia stato caricato asincronamente per il listino 2 (85.50)
        const prezzoInput = page.locator('table.table-items tbody tr').first().locator('input[type="number"]').nth(1);
        await expect(prezzoInput).toHaveValue('85.5');

        // Salva
        await page.locator('button.btn-premium-save').click();
        await page.waitForResponse(resp => resp.url().includes('/fatture') && resp.request().method() === 'POST');

        expect(savePayload).toBeTruthy();
        expect(savePayload.prodotti[0].idProdotto).toBe(500);
        expect(Number(savePayload.prodotti[0].prezzo)).toBe(85.5);
    });

    test('checkbox ritenuta non visibile se disabilitato in configurazione', async ({ page }) => {
        const apiPattern = '**/api/**';

        // Mock configurazione: ritenuta DISABILITATA
        await page.route(`${apiPattern}/configurazione/get-by-domain*`, async route => {
            const json = { EMETTI_RITENUTA: '0', PERC_RITENUTA: '0' };
            await route.fulfill({ json });
        });

        await page.goto('/fatture/new');

        // Bypass SweetAlert
        await page.evaluate(() => {
            const swal = document.querySelector('.swal2-container');
            if (swal) swal.remove();
        });

        // Verifica che la scritta "Gestione Ritenuta d'Acconto" NON sia visibile
        const labelRitenuta = page.locator('text=Gestione Ritenuta d\'Acconto');

        // Se il frontend NON implementa ancora la scomparsa, questo test fallirà.
        await expect(labelRitenuta).not.toBeVisible();

        // Verifica anche nella riga articoli
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-tabs a'));
            const artTab = tabs.find(a => a.innerText.includes('Articoli'));
            if (artTab) artTab.click();
        });

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('.table-row-add-toolbar button'));
            const fmBtn = btns.find(b => b.innerText.includes('FUORI MAGAZZINO'));
            if (fmBtn) fmBtn.click();
            const artBtn = btns.find(b => b.innerText.includes('ARTICOLO') && !b.innerText.includes('FUORI'));
            if (artBtn) artBtn.click();
        });

        const rows = page.locator('table.table-items tbody tr');
        await expect(rows).toHaveCount(3);

        for (let i = 0; i < 2; i++) {
            const rowRitLocator = rows.nth(i).locator('.ritenuta-inline-box');
            await expect(rowRitLocator).not.toBeVisible();
        }
    });

    test('checkbox ritenuta visibile se abilitato in configurazione', async ({ page }) => {
        const apiPattern = '**/api/**';

        // Mock configurazione: ritenuta ABILITATA
        await page.route(`${apiPattern}/configurazione/get-by-domain*`, async route => {
            const json = { EMETTI_RITENUTA: '1', PERC_RITENUTA: '20' };
            await route.fulfill({ json });
        });

        await page.goto('/fatture/new');

        // Bypass SweetAlert
        await page.evaluate(() => {
            const swal = document.querySelector('.swal2-container');
            if (swal) swal.remove();
        });

        const labelRitenuta = page.locator('text=Gestione Ritenuta d\'Acconto');
        await expect(labelRitenuta).toBeVisible();

        // Verifica anche nella riga articoli
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-tabs a'));
            const artTab = tabs.find(a => a.innerText.includes('Articoli'));
            if (artTab) artTab.click();
        });

        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('.table-row-add-toolbar button'));
            const fmBtn = btns.find(b => b.innerText.includes('FUORI MAGAZZINO'));
            if (fmBtn) fmBtn.click();
            const artBtn = btns.find(b => b.innerText.includes('ARTICOLO') && !b.innerText.includes('FUORI'));
            if (artBtn) artBtn.click();
        });

        const rows = page.locator('table.table-items tbody tr');
        await expect(rows).toHaveCount(3);

        // Poiché EMETTI_RITENUTA è 1, la casella in testata è spuntata di default,
        // quindi in entrambe le righe (ARTICOLO e FUORI MAGAZZINO) la checkbox ritenuta deve essere visibile.
        for (let i = 0; i < 2; i++) {
            const rowRitLocator = rows.nth(i).locator('.ritenuta-inline-box');
            await expect(rowRitLocator).toBeVisible();
        }
    test('salvataggio fattura con più scadenze (30/60/90)', async ({ page }) => {
        const apiPattern = '**/api/**';

        // Mock configurazione: ritenuta disabilitata per semplicità
        await page.route(`${apiPattern}/configurazione/get-by-domain*`, async route => {
            const json = { EMETTI_RITENUTA: '0' };
            await route.fulfill({ json });
        });

        // Intercetta salvataggio
        let savePayload = null;
        await page.route(`${apiPattern}/fatture`, async route => {
            if (route.request().method() === 'POST') {
                savePayload = route.request().postDataJSON();
                await route.fulfill({ json: { esito: { code: 200 }, payload: { id: 999 } } });
            } else {
                await route.continue();
            }
        });

        await page.goto('/fatture/new');

        // Selezione Cliente
        const clienteInput = page.locator('.compact-col-xl', { hasText: 'Cliente' }).locator('input[type="text"]').first();
        await clienteInput.fill('ClienteTest');
        await page.waitForTimeout(500);
        await clienteInput.press('Enter');

        // Vai al tab Pagamento
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-tabs a'));
            const pagTab = tabs.find(a => a.innerText.includes('Pagamento'));
            if (pagTab) pagTab.click();
        });

        // Seleziona Tipo Pagamento "Bonifico 30/60/90"
        // Nota: Poiché usiamo react-select, cerchiamo il contenitore o l'input
        const pagSelect = page.locator('.form-group', { hasText: 'Tipo Pagamento' }).locator('.css-b62m3t-container');
        await pagSelect.click();
        await page.keyboard.type('Bonifico 30/60/90');
        await page.keyboard.press('Enter');

        // Aggiungi un articolo per avere un totale
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.nav-tabs a'));
            const artTab = tabs.find(a => a.innerText.includes('Articoli'));
            if (artTab) artTab.click();
        });
        await page.evaluate(() => {
            const fmBtn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('FUORI MAGAZZINO'));
            if (fmBtn) fmBtn.click();
        });
        const firstRow = page.locator('table.table-items tbody tr').first();
        await firstRow.locator('input[type="number"]').nth(1).fill('1000');
        await firstRow.locator('input[type="number"]').nth(1).blur();

        // Salva
        await page.evaluate(() => {
            const saveBtn = document.querySelector('button.btn-premium-save');
            if (saveBtn) saveBtn.click();
        });

        await page.waitForResponse(resp => resp.url().includes('/api') && resp.url().includes('/fatture') && resp.request().method() === 'POST');

        expect(savePayload).toBeTruthy();
        expect(savePayload.idTipoPagamento).toBe(2);
        // Verifica che le scadenze siano state inviate (anche se il calcolo avviene lato server, il client potrebbe inviarle se caricate dal tipo pagamento)
        // Se il frontend le carica dal tipo pagamento e le mette nel DTO prima del save:
        expect(savePayload.scadenze).toBeTruthy();
        expect(savePayload.scadenze.length).toBeGreaterThanOrEqual(1);
    });
});
