import { test, expect } from '@playwright/test';

test.describe('LocalStorage Persistence', () => {
  test('work orders persist across page reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('.timeline-row').last().click({ position: { x: 300, y: 22 } });
    await page.getByPlaceholder('Acme Inc.').fill('Persisted Order');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    await expect(page.getByText('Persisted Order')).toHaveCount(1);

    await page.reload();
    await expect(page.getByText('Persisted Order')).toHaveCount(1);
  });

  test('?reset=1 clears stored data and reloads from JSON', async ({ page }) => {
    await page.goto('/');
    await page.locator('.timeline-row').last().click({ position: { x: 300, y: 22 } });
    await page.getByPlaceholder('Acme Inc.').fill('Temporary Order');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Temporary Order')).toHaveCount(1);

    await page.goto('/?reset=1');
    await expect(page.getByText('Temporary Order')).toHaveCount(0);
    await expect(page.getByText('Extrusion Line A')).toBeVisible();
  });
});
