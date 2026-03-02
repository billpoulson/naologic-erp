import { test, expect } from '@playwright/test';

test.describe('Overlap Validation', () => {
  test('overlap shows error', async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    // Click first row (wc-1) far right to hit empty space; overlap dates with wo-1 (2016-03-01 to 2016-10-15)
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Acme Inc.').fill('Overlap Test');
    // Use DD.MM.YYYY; dates must overlap existing order (wc-1 has orders from 2016)
    await page.getByLabel('Start date').fill('01.05.2016');
    await page.getByLabel('End date').fill('15.06.2016');
    await page.screenshot({ path: 'test-results/screenshots/overlap-form-before-submit.png' });
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Work orders cannot overlap on the same work center.')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/overlap-error.png' });
  });
});
