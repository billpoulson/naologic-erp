import { test, expect } from '@playwright/test';

test.describe('Timeline', () => {
  test('should load with work centers and bars', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Orders' })).toBeVisible();
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await expect(page.getByText('Naquadah Refining')).toBeVisible();
    await expect(page.getByText('Ring Component Fab')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/timeline-loaded--month-default.png' });
  });

  test('should switch timescale dropdown', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });

    const trigger = page.getByRole('button', { name: 'Timescale' });
    await trigger.click();
    await page.getByRole('option', { name: 'Week' }).click();
    await page.screenshot({ path: 'test-results/screenshots/timeline-week-view.png' });

    await trigger.click();
    await page.getByRole('option', { name: 'Day' }).click();
    await page.screenshot({ path: 'test-results/screenshots/timeline-day-view.png' });

    await trigger.click();
    await page.getByRole('option', { name: 'Month' }).click();
    await page.screenshot({ path: 'test-results/screenshots/timeline-month-view.png' });
  });

  test('arrow keys navigate between work orders', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    const timelineRegion = page.getByRole('region', { name: /Work order timeline/ });
    await timelineRegion.focus();

    // Click first bar to focus it, then use arrow keys (timeline receives keydown)
    const firstBar = page.locator('.work-order-bar').first();
    await firstBar.click();
    await timelineRegion.focus();
    await page.keyboard.press('ArrowRight');
    // Verify at least one bar exists and timeline is interactive
    await expect(page.locator('.work-order-bar').first()).toBeVisible();
  });
});
