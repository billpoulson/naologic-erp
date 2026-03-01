import { test, expect } from '@playwright/test';

test.describe('Create and Edit', () => {
  test('click empty area opens create panel', async ({ page }) => {
    await page.goto('/');
    await page.locator('.timeline-row').last().click({ position: { x: 300, y: 22 } });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/create-panel-open.png' });
  });

  test('create work order adds bar', async ({ page }) => {
    await page.goto('/');
    await page.locator('.timeline-row').last().click({ position: { x: 300, y: 22 } });
    await page.getByPlaceholder('Acme Inc.').fill('New Test Order');
    await page.screenshot({ path: 'test-results/screenshots/create-form-filled.png' });
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    await expect(page.getByText('New Test Order')).toHaveCount(1);
    await page.screenshot({ path: 'test-results/screenshots/create-work-order-success.png' });
  });

  test('bar hover reveals menu, edit opens panel', async ({ page }) => {
    await page.goto('/');
    const packagingBar = page.locator('.timeline-row').last().locator('.work-order-bar').first();
    await packagingBar.scrollIntoViewIfNeeded();
    await packagingBar.hover();
    await page.waitForSelector('.bar-menu-btn', { state: 'visible', timeout: 5000 });
    await page.screenshot({ path: 'test-results/screenshots/bar-hover-menu.png' });
    await packagingBar.locator('.bar-menu-btn').click();
    await expect(page.getByRole('button', { name: 'Edit' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/bar-dropdown-open.png' });
    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/edit-panel-open.png' });
  });

  test('cancel closes panel', async ({ page }) => {
    await page.goto('/');
    await page.locator('.timeline-row').last().click({ position: { x: 300, y: 22 } });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/cancel-panel-before.png' });
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/cancel-panel-closed.png' });
  });
});
