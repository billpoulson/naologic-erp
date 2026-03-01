import { test, expect } from '@playwright/test';

test.describe('Overlap Validation', () => {
  test('overlap shows error', async ({ page }) => {
    await page.goto('/');
    await page.locator('.timeline-row').first().click({ position: { x: 300, y: 22 } });
    await page.getByPlaceholder('Acme Inc.').fill('Overlap Test');
    await page.locator('input[formcontrolname="startDate"]').fill('2025-02-05');
    await page.locator('input[formcontrolname="endDate"]').fill('2025-02-15');
    await page.screenshot({ path: 'test-results/screenshots/overlap-form-before-submit.png' });
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Work orders cannot overlap on the same work center.')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/overlap-error.png' });
  });
});
