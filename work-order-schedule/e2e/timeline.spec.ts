import { test, expect } from '@playwright/test';

test.describe('Timeline', () => {
  test('should load with work centers and bars', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Orders' })).toBeVisible();
    await expect(page.getByText('Extrusion Line A')).toBeVisible();
    await expect(page.getByText('CNC Machine 1')).toBeVisible();
    await page.screenshot({ path: 'test-results/screenshots/timeline-loaded--month-default.png' });
  });

  test('should switch timescale dropdown', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('combobox').selectOption('week');
    await page.screenshot({ path: 'test-results/screenshots/timeline-week-view.png' });
    await page.getByRole('combobox').selectOption('day');
    await page.screenshot({ path: 'test-results/screenshots/timeline-day-view.png' });
    await page.getByRole('combobox').selectOption('month');
    await page.screenshot({ path: 'test-results/screenshots/timeline-month-view.png' });
  });
});
