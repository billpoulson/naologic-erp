import { test, expect } from '@playwright/test';

test.describe('LocalStorage Persistence', () => {
  test('work orders persist across page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Acme Inc.').fill('Persisted Order');
    await page.getByLabel('Start date').fill('01.01.2030');
    await page.getByLabel('End date').fill('07.01.2030');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    await expect(page.getByText('Persisted Order')).toHaveCount(1, { timeout: 10000 });

    await page.reload();
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await expect(page.getByText('Persisted Order')).toHaveCount(1, { timeout: 10000 });
  });

  test('?reset=1 clears stored data and reloads from JSON', async ({ page }) => {
    await page.goto('/');
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
    await expect(page.getByText('Naquadah Refining')).toBeVisible();
  });
});
