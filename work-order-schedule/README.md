# Work Order Schedule Timeline

Angular 20 (LTS) Work Order Schedule Timeline with timeline grid, work order bars, create/edit panel, and overlap detection.

> **Full documentation**: See the [main README](../README.md) for the user guide, feature highlights, and project overview.

## Setup

```bash
npm install
```

## Development server

```bash
ng serve
```

Open `http://localhost:4200/` in your browser.

## Building

```bash
ng build
```

## Running unit tests

```bash
ng test
```

For headless mode (e.g. CI):

```bash
ng test --no-watch --browsers=ChromeHeadless
```

## Running E2E tests

E2E tests use Playwright. The first run installs browsers if needed.

```bash
npx playwright test
```

Screenshots are captured on failure and stored in `test-results/`. HTML report: `npx playwright show-report playwright-report`.

### Generating user documentation

Run the documentation suite to capture screenshots and generate the user guide:

```bash
npm run e2e:docs
```

This produces `docs/USER-GUIDE.md` and `docs/screenshots/` with workflow screenshots.

### Accessibility (WCAG)

Run axe-core accessibility checks:

```bash
npm run e2e:a11y
```

See `docs/WCAG-ANALYSIS.md` for the full WCAG 2.1 compliance analysis.

## Sample data

Work centers and work orders are loaded from `public/data/`:

- `work-centers.json` – work center definitions
- `work-orders.json` – work order definitions

Edit these JSON files and refresh the browser for fast feedback without recompiling.

## Persistence

Work orders are persisted to `localStorage` so changes survive page refreshes. To reset stored data and reload from the default JSON, add `?reset=1` to the URL (e.g. `http://localhost:4200/?reset=1`).

## Project structure

- `src/app/components/` – Timeline, Work Order Panel, Work Order Schedule
- `src/app/services/` – WorkOrderService, TimelineCalculatorService
- `src/app/models/` – Work center and work order types
- `e2e/` – Playwright E2E specs
