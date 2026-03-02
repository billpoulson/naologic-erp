import { test, expect } from '@playwright/test';

test.describe('Create and Edit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
  });

  test('click empty area opens create panel', async ({ page }) => {
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/create-panel-open.png' });
  });

  test('create work order adds bar and focuses it in timeline', async ({ page }) => {
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Acme Inc.').fill('New Test Order');
    await page.getByLabel('Start date').fill('01.01.2030');
    await page.getByLabel('End date').fill('07.01.2030');
    await page.screenshot({ path: 'test-results/screenshots/create-form-filled.png' });
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    const newBar = page.locator('.work-order-bar').filter({ hasText: 'New Test Order' });
    await expect(newBar).toHaveCount(1, { timeout: 10000 });
    await expect(newBar).toHaveClass(/focused/);
    await page.screenshot({ path: 'test-results/screenshots/create-work-order-success.png' });
  });

  async function openBarMenu(page: import('@playwright/test').Page) {
    await page.locator('.timeline-scroll').evaluate((el) => {
      (el as HTMLElement).scrollLeft = 0;
      (el as HTMLElement).scrollTop = 0;
    });
    await page.waitForTimeout(500);
    const firstRowWithBar = page.locator('.timeline-row').filter({ has: page.locator('.work-order-bar') }).first();
    const bar = firstRowWithBar.locator('.work-order-bar').first();
    await bar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await bar.hover();
    await bar.locator('.bar-menu-btn').waitFor({ state: 'visible', timeout: 5000 });
    await bar.locator('.bar-menu-btn').evaluate((el) => (el as HTMLElement).click());
    await page.waitForTimeout(150);
  }

  test('bar hover reveals menu, edit opens panel', async ({ page }) => {
    await openBarMenu(page);
    await page.screenshot({ path: 'test-results/screenshots/bar-hover-menu.png' });
    // Dropdown positions via setTimeout(0); wait for it to render
    await page.locator('.bar-dropdown').waitFor({ state: 'visible', timeout: 5000 });
    await page.screenshot({ path: 'test-results/screenshots/bar-dropdown-open.png' });
    await page.getByRole('menuitem', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/edit-panel-open.png' });
  });

  test('cancel closes panel', async ({ page }) => {
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/cancel-panel-before.png' });
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/cancel-panel-closed.png' });
  });

  test('backdrop click closes panel', async ({ page }) => {
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();
    await page.locator('.panel-backdrop').click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
  });

  test('edit and save updates work order', async ({ page }) => {
    await openBarMenu(page);
    await page.getByRole('menuitem', { name: 'Edit' }).click({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();

    const nameInput = page.getByPlaceholder('Acme Inc.');
    await nameInput.clear();
    await nameInput.fill('Edited Work Order Name');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    const editedBar = page.locator('.work-order-bar').filter({ hasText: 'Edited Work Order Name' });
    await expect(editedBar).toHaveCount(1);
  });

  test('delete removes work order bar', async ({ page }) => {
    // Use ?empty=1 to avoid overlap with existing orders from sample data
    await page.goto('/?empty=1');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 500, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });
    await page.getByPlaceholder('Acme Inc.').fill('To Be Deleted');
    await page.locator('.status-select .ng-select-container').click();
    await page.getByRole('option', { name: 'Open' }).click();
    // Use dates within default timeline range (today ± 24 months) so bar is visible
    await page.getByLabel('Start date').fill('03.01.2025');
    await page.getByLabel('End date').fill('03.10.2025');
    await expect(page.getByRole('button', { name: 'Create' })).toBeEnabled({ timeout: 3000 });
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('To Be Deleted')).toHaveCount(1, { timeout: 15000 });

    await page.waitForTimeout(300);
    const bar = page.locator('.work-order-bar').filter({ hasText: 'To Be Deleted' });
    await bar.waitFor({ state: 'visible', timeout: 5000 });
    await bar.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    await bar.hover({ force: true });
    await bar.locator('.bar-menu-btn').waitFor({ state: 'visible', timeout: 3000 });
    await bar.locator('.bar-menu-btn').click({ force: true });
    await page.locator('.bar-dropdown').waitFor({ state: 'visible', timeout: 5000 });
    await page.getByRole('menuitem', { name: 'Delete' }).click();
    await page.locator('.bar-dropdown-confirm-delete').waitFor({ state: 'visible', timeout: 5000 });
    await page.locator('.bar-dropdown-confirm-delete').click();

    await expect(page.getByText('To Be Deleted')).toHaveCount(0);
  });

  test('form validation: required name prevents submit', async ({ page }) => {
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });
    await page.getByLabel('Start date').fill('01.01.2030');
    await page.getByLabel('End date').fill('07.01.2030');
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();
    await page.getByPlaceholder('Acme Inc.').focus();
    await page.getByPlaceholder('Acme Inc.').blur();
    await expect(page.getByText('Required')).toBeVisible();
  });

});
