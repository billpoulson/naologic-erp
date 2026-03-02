import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const DOCS_DIR = path.join(process.cwd(), 'docs');
const SCREENSHOTS_DIR = path.join(DOCS_DIR, 'screenshots');

test.describe.configure({ mode: 'serial' });

test.describe('User Documentation', () => {
  test.beforeAll(async () => {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  });

  test('capture timeline overview and timescale views', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Work Orders' })).toBeVisible();
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01-timeline-overview.png') });

    const trigger = page.getByRole('button', { name: 'Timescale' });
    await trigger.click();
    await page.getByRole('option', { name: 'Week' }).click();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02-timeline-week-view.png') });

    await trigger.click();
    await page.getByRole('option', { name: 'Day' }).click();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03-timeline-day-view.png') });

    await trigger.click();
    await page.getByRole('option', { name: 'Month' }).click();
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04-timeline-month-view.png') });
  });

  test('capture create work order workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 5000, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible({ timeout: 5000 });

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05-create-panel-open.png') });

    await page.getByPlaceholder('Acme Inc.').fill('Sample Work Order');
    await page.getByLabel('Start date').fill('01.01.2030');
    await page.getByLabel('End date').fill('07.01.2030');
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06-create-form-filled.png') });

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();
    await expect(page.getByText('Sample Work Order')).toHaveCount(1);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07-create-success.png') });
  });

  test('capture edit work order workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    const firstRowWithBar = page.locator('.timeline-row').filter({ has: page.locator('.work-order-bar') }).first();
    const bar = firstRowWithBar.locator('.work-order-bar').first();
    await bar.scrollIntoViewIfNeeded();
    await bar.hover();
    await page.waitForSelector('.bar-menu-btn', { state: 'visible', timeout: 5000 });

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08-bar-hover-menu.png') });

    await bar.locator('.bar-menu-btn').click({ force: true });
    await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09-bar-dropdown-edit-delete.png') });

    await page.getByRole('button', { name: 'Edit' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10-edit-panel-open.png') });

    await page.getByRole('button', { name: 'Cancel' }).click();
  });

  test('capture overlap validation workflow', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('.timeline-row', { state: 'visible', timeout: 10000 });
    await page.locator('.timeline-row').first().click({ position: { x: 300, y: 22 } });
    await page.getByPlaceholder('Acme Inc.').fill('Overlapping Order');
    await page.getByLabel('Start date').fill('01.05.2016');
    await page.getByLabel('End date').fill('01.06.2016');

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11-overlap-form-filled.png') });

    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.getByText('Work orders cannot overlap on the same work center.')).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '12-overlap-error.png') });
  });

  test('capture cancel workflow', async ({ page }) => {
    await page.goto('/');
    await page.locator('.timeline-row').last().click({ position: { x: 300, y: 22 }, force: true });
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '13-cancel-panel-open.png') });

    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Work Order Details' })).not.toBeVisible();

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '14-cancel-panel-closed.png') });
  });

  test('generate USER-GUIDE.md', async () => {
    const userGuide = `# Work Order Schedule – User Guide

This guide describes how to use the Work Order Schedule Timeline application. Screenshots are captured automatically when you run the documentation test suite.

## Overview

The Work Order Schedule displays work orders as bars on a timeline, organized by work center. You can view the schedule at different zoom levels (Day, Week, Month), create new work orders, edit or delete existing ones, and the system prevents overlapping orders on the same work center.

---

## Timeline View

The main screen shows work centers in the left column and a scrollable timeline on the right. Each work order appears as a colored bar with its name and status.

![Timeline overview](screenshots/01-timeline-overview.png)

### Changing the timescale

Use the **Timescale** dropdown to switch between:

- **Month** (default) – Best for planning across quarters
- **Week** – Useful for near-term scheduling
- **Day** – For detailed daily view

![Week view](screenshots/02-timeline-week-view.png)

![Day view](screenshots/03-timeline-day-view.png)

![Month view](screenshots/04-timeline-month-view.png)

---

## Creating a Work Order

1. **Click** on an empty area of a work center row. A hint "Click to add dates" appears when you hover over empty space.

2. The **Work Order Details** panel opens from the right with the start date pre-filled based on where you clicked.

![Create panel open](screenshots/05-create-panel-open.png)

3. **Fill in** the form:
   - **Work Order Name** (required)
   - **Status** (Open, In Progress, Complete, Blocked)
   - **Start Date** – Click the field to open the date picker
   - **End Date** – Click the field to open the date picker

![Create form filled](screenshots/06-create-form-filled.png)

4. Click **Create**. The panel closes and the new work order bar appears on the timeline.

![Create success](screenshots/07-create-success.png)

---

## Editing a Work Order

1. **Hover** over a work order bar. A three-dot menu (⋮) appears.

![Bar hover menu](screenshots/08-bar-hover-menu.png)

2. **Click** the menu button to open the dropdown with **Edit** and **Delete** options.

![Bar dropdown](screenshots/09-bar-dropdown-edit-delete.png)

3. **Click Edit**. The Work Order Details panel opens with the existing data.

![Edit panel open](screenshots/10-edit-panel-open.png)

4. Make your changes and click **Save**, or click **Cancel** to close without saving.

---

## Deleting a Work Order

1. Hover over the work order bar and click the three-dot menu.
2. Click **Delete**. The work order is removed from the timeline immediately.

---

## Overlap Validation

The system does not allow two work orders on the same work center to overlap in time. If you try to create or save an order with overlapping dates, an error message is shown.

![Overlap form filled](screenshots/11-overlap-form-filled.png)

![Overlap error](screenshots/12-overlap-error.png)

Adjust the start or end date to avoid the conflict, then try again.

---

## Canceling

To close the panel without saving:

1. Click **Cancel** in the panel, or
2. Click the dark overlay (backdrop) outside the panel.

![Cancel panel open](screenshots/13-cancel-panel-open.png)

![Cancel panel closed](screenshots/14-cancel-panel-closed.png)

---

## Persistence and Reset

Work orders are saved automatically and persist across page refreshes. To reset all data and reload from the default sample, add \`?reset=1\` to the URL (e.g. \`http://localhost:4200/?reset=1\`).

---

## Work Order Statuses

| Status       | Color  | Description                    |
| ------------ | ------ | ------------------------------ |
| Open         | Blue   | Not yet started                |
| In Progress  | Purple | Currently being worked on       |
| Complete     | Green  | Finished                       |
| Blocked      | Orange | Blocked or on hold             |

---

*This document is generated by the \`user-documentation\` E2E test suite. Run \`npx playwright test --grep "User Documentation"\` to refresh screenshots and regenerate.*
`;

    fs.writeFileSync(path.join(DOCS_DIR, 'USER-GUIDE.md'), userGuide, 'utf-8');
  });
});
