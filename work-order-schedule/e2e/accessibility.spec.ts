import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility (WCAG)', () => {
  test('timeline page should have no critical axe violations', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical, formatViolations(critical)).toHaveLength(0);
  });

  test('create panel should have no critical axe violations', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 400, y: 24 } });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });

    const results = await new AxeBuilder({ page })
      .include('.panel')
      .exclude('.status-select') // ng-select has known a11y issues; label association not forwarded to inner input
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical, formatViolations(critical)).toHaveLength(0);
  });

  test('timeline page axe report (informational)', async ({ page }) => {
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    // Log violations for CI/review; do not fail on serious (e.g. color-contrast)
    if (results.violations.length > 0) {
      console.log('Axe violations:', JSON.stringify(results.violations, null, 2));
    }
    const critical = results.violations.filter((v) => v.impact === 'critical');
    expect(critical, formatViolations(critical)).toHaveLength(0);
  });
});

function formatViolations(violations: Array<{ id: string; help: string; nodes: unknown[] }>): string {
  if (violations.length === 0) return '';
  return violations
    .map((v) => `${v.id}: ${v.help} (${v.nodes.length} node(s))`)
    .join('\n');
}
