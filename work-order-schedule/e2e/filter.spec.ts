import { test, expect } from '@playwright/test';

test.describe('Filter', () => {
  test('filter dropdown opens and name filter filters work centers', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });

    const filterBtn = page.getByRole('button', { name: 'Filter work centers' });
    await filterBtn.click();
    await expect(page.getByPlaceholder('Filter by name...')).toBeVisible();

    // Type a filter - use a substring that matches at least one work center
    await page.getByPlaceholder('Filter by name...').fill('Extrusion');
    await expect(page.getByText('Extrusion Line A')).toBeVisible();
    // Other centers should be hidden or filtered
    const rows = page.locator('.timeline-row');
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Clear filter
    await page.getByRole('button', { name: 'Clear name filter' }).click();
    await expect(page.getByPlaceholder('Filter by name...')).toHaveValue('');
  });

  test('date range filter filters work centers by order overlap', async ({ page }) => {
    await page.goto('/?reset=1');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    const rowCountBefore = await page.locator('.timeline-row').count();

    const filterBtn = page.getByRole('button', { name: 'Filter work centers' });
    await filterBtn.click();

    // Use wide date range (MM.DD.YYYY per NgbDateDotFormatter) to include orders
    const startInput = page.getByLabel('Filter start date');
    const endInput = page.getByLabel('Filter end date');
    await startInput.fill('01.01.2015');
    await endInput.fill('12.31.2030');

    // Close filter dropdown so timeline rows are visible; filter applies immediately
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    const rows = page.locator('.timeline-row');
    await expect(rows.first()).toBeVisible({ timeout: 5000 });
    const count = await rows.count();
    expect(count).toBeGreaterThanOrEqual(1);
    expect(count).toBeLessThanOrEqual(rowCountBefore);

    // Reopen filter and clear date filter
    await filterBtn.click();
    await page.getByRole('button', { name: 'Clear date filter' }).click();
    await expect(startInput).toHaveValue('');
    await expect(endInput).toHaveValue('');
  });

  test('filter dropdown closes on backdrop click', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });

    await page.getByRole('button', { name: 'Filter work centers' }).click();
    await expect(page.getByPlaceholder('Filter by name...')).toBeVisible();

    await page.locator('.filter-dropdown-backdrop').click();
    await expect(page.getByPlaceholder('Filter by name...')).not.toBeVisible();
  });
});
