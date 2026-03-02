import { test, expect } from '@playwright/test';

test.describe('Overlap Validation', () => {
  test('overlap shows error', async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    // Click first row (wc-1) far right to hit empty space; overlap dates with wo-1 (2016-03-01 to 2016-10-15)
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Acme Inc.').fill('Overlap Test');
    // Status is required; click ng-select to ensure form is valid (format is MM.DD.YYYY)
    await page.locator('.status-select .ng-select-container').click();
    await page.getByRole('option', { name: 'Open' }).click();
    await page.waitForTimeout(150);
    await page.getByLabel('Start date').fill('05.01.2016');
    await page.getByLabel('End date').fill('06.15.2016');
    await page.screenshot({ path: 'test-results/screenshots/overlap-form-before-submit.png' });
    await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled({ timeout: 3000 });
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Work orders cannot overlap on the same work center.')).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'test-results/screenshots/overlap-error.png' });
  });
});
