import { test, expect } from '@playwright/test';

test.describe('Create and Edit', () => {
  test('click empty area opens create panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/create-panel-open.png' });
  });

  test('create work order adds bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Acme Inc.').fill('New Test Order');
    await page.getByLabel('Start date').fill('01.01.2030');
    await page.getByLabel('End date').fill('07.01.2030');
    await page.screenshot({ path: 'test-results/screenshots/create-form-filled.png' });
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    await expect(page.getByText('New Test Order')).toHaveCount(1, { timeout: 10000 });
    await page.screenshot({ path: 'test-results/screenshots/create-work-order-success.png' });
  });

  test('bar hover reveals menu, edit opens panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    const firstRowWithBar = page.locator('.timeline-row').filter({ has: page.locator('.work-order-bar') }).first();
    const bar = firstRowWithBar.locator('.work-order-bar').first();
    await bar.scrollIntoViewIfNeeded();
    await bar.hover();
    const menuBtn = bar.locator('.bar-menu-btn');
    await menuBtn.waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: 'test-results/screenshots/bar-hover-menu.png' });
    await menuBtn.click({ force: true });
    // Dropdown positions via setTimeout(0); wait for it to render
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible({ timeout: 5000 });
    await page.screenshot({ path: 'test-results/screenshots/bar-dropdown-open.png' });
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/edit-panel-open.png' });
  });

  test('cancel closes panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/cancel-panel-before.png' });
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/cancel-panel-closed.png' });
  });

  test('backdrop click closes panel', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.locator('.panel-backdrop').click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
  });

  test('edit and save updates work order', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    const firstRowWithBar = page.locator('.timeline-row').filter({ has: page.locator('.work-order-bar') }).first();
    const bar = firstRowWithBar.locator('.work-order-bar').first();
    await bar.scrollIntoViewIfNeeded();
    await bar.hover();
    await bar.locator('.bar-menu-btn').waitFor({ state: 'visible', timeout: 5000 });
    await bar.locator('.bar-menu-btn').click({ force: true });
    await page.getByRole('menuitem', { name: 'Edit' }).click({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();

    const nameInput = page.getByPlaceholder('Acme Inc.');
    await nameInput.clear();
    await nameInput.fill('Edited Work Order Name');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    await expect(page.getByText('Edited Work Order Name')).toHaveCount(1);
  });

  test('delete removes work order bar', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Acme Inc.').fill('To Be Deleted');
    await page.getByLabel('Start date').fill('01.01.2030');
    await page.getByLabel('End date').fill('07.01.2030');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('To Be Deleted')).toHaveCount(1, { timeout: 15000 });

    // Wait for bar to be in DOM (first row is visible by default)
    const bar = page.locator('.work-order-bar').filter({ hasText: 'To Be Deleted' });
    await bar.waitFor({ state: 'visible', timeout: 5000 });
    await bar.hover();
    await bar.locator('.bar-menu-btn').waitFor({ state: 'visible', timeout: 3000 });
    await bar.locator('.bar-menu-btn').click({ force: true });
    await page.getByRole('menuitem', { name: 'Delete' }).click({ timeout: 5000 });

    await expect(page.getByText('To Be Deleted')).toHaveCount(0);
  });
});
