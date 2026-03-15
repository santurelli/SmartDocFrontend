import { test, expect } from '@playwright/test';

test('caricamento dashboard', async ({ page }) => {
    // Login
    await page.goto('http://localhost:5173/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin');

    // Seleziona la prima azienda disponibile
    await page.locator('select').selectOption({ index: 1 });

    await page.click('button[type="submit"]');

    // Attendi redirect alla dashboard
    await expect(page).toHaveURL('http://localhost:5173/');

    // Verifica presenza KPI
    await expect(page.locator('.infographic-box').first()).toBeVisible();
    await expect(page.getByText('Fatture insolute')).toBeVisible();

    // Verifica presenza Grafico
    await expect(page.locator('.recharts-responsive-container')).toBeVisible();

    // Verifica presenza Tabella Ultime Fatture
    await expect(page.getByText('Ultime fatture emesse')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
});
