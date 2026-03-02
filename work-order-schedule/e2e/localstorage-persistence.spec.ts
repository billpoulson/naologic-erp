import { test, expect } from '@playwright/test';

test.describe('LocalStorage Persistence', () => {
  test('work orders persist across page reload', async ({ page }) => {
    // Use ?empty=1 so we start with no orders; default JSON is ~5.6MB and exceeds localStorage quota
    await page.goto('/?empty=1');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Acme Inc.').fill('Persisted Order');
    await page.locator('.status-select .ng-select-container').click();
    await page.getByRole('option', { name: 'Open' }).click();
    // Use dates within default timeline range (today ± 24 months) so bar is visible after reload
    await page.getByLabel('Start date').fill('03.01.2025');
    await page.getByLabel('End date').fill('03.10.2025');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    await expect(page.getByText('Persisted Order')).toHaveCount(1, { timeout: 10000 });

    // Change URL to / and reload so we load from localStorage (reload with ?empty=1 would clear it)
    await page.evaluate(() => history.replaceState(null, '', '/'));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await expect(page.getByText('Persisted Order')).toHaveCount(1, { timeout: 10000 });
  });

  test('?reset=1 clears stored data and reloads from JSON', async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Acme Inc.').fill('Temporary Order');
    await page.getByLabel('Start date').fill('01.01.2030');
    await page.getByLabel('End date').fill('07.01.2030');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Temporary Order')).toHaveCount(1, { timeout: 10000 });

    await page.goto('/?reset=1');
    await expect(page.getByText('Temporary Order')).toHaveCount(0);
    await expect(page.getByText('Extrusion Line A')).toBeVisible();
  });
});
