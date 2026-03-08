import { test, expect } from '@playwright/test';

test('has title and login form', async ({ page }) => {
    await page.goto('/login');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/SmartDoc/i);

    // Check for login button
    const loginButton = page.locator('button', { hasText: /Login/i });
    await expect(loginButton).toBeVisible();
});

test('login failure shows error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#frm_username', 'wronguser');
    await page.fill('#frm_password', 'wrongpass');
    await page.click('#btn_login');

    // Expect an error message from the alert box
    const errorAlert = page.locator('.alert-danger');
    await expect(errorAlert).toBeVisible();
});
