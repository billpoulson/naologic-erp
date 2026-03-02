# Work Order Schedule Timeline

An interactive timeline application for visualizing and managing work orders across manufacturing work centers. Built with **Angular 20** (LTS), it provides planners with an intuitive Gantt-style view to schedule, create, edit, and filter work orders with overlap validation and keyboard navigation.

![Work Order Schedule](work-order-schedule/docs/screenshots/01-timeline-overview.png)

---

## Quick Start

```bash
cd work-order-schedule
npm install
ng serve
```

Open [http://localhost:4200](http://localhost:4200) in your browser.

---

## Feature Highlights

### Timeline & Zoom

- **Four zoom levels**: Hours, Day, Week, Month — switch via the Timescale dropdown
- **Scroll-wheel zoom**: Hold **Ctrl** and scroll to zoom in/out (month → week → day → hours)
- **Drag to pan**: Click and drag on the timeline to scroll horizontally (scrollbar hidden for a clean look)
- **Current day indicator**: Vertical line marks today’s date
- **Date tooltip**: Hover over the timeline to see the date/time under the cursor (hidden over the work center column)

### Work Order Management

- **Create**: Click an empty area on a work center row — the panel opens with the start date pre-filled from the click position
- **Edit**: Hover a work order bar, click the ⋮ menu, then **Edit**
- **Delete**: Same menu → **Delete**
- **Overlap validation**: The system blocks overlapping work orders on the same work center and shows an error message

### Filtering

- **Name filter**: Filter work centers by name (case-insensitive)
- **Date range filter**: Filter by start date, end date, or both — show only work centers with orders overlapping the selected range
- **Escape**: Press **Escape** to close the filter dropdown

### Keyboard & Accessibility

- **Arrow keys**: Focus a work order bar (by clicking it), then use ↑ ↓ ← → to move between bars
- **WCAG 2.1 AA**: Semantic structure, keyboard access, screen reader support, and focus management

### Persistence

- **localStorage**: Work orders are saved automatically and persist across page refreshes
- **Reset**: Add `?reset=1` to the URL to clear stored data and reload from the default JSON

---

## User Guide

**[→ Full User Guide with screenshots](work-order-schedule/docs/USER-GUIDE.md)**

### Changing the Timescale

Use the **Timescale** dropdown (top right) to switch between:

| Level  | Best for                    |
|--------|-----------------------------|
| Month  | Planning across quarters    |
| Week   | Near-term scheduling        |
| Day    | Detailed daily view         |
| Hours  | Hour-by-hour planning       |

### Creating a Work Order

1. **Click** an empty area on a work center row. A hint “Click to add dates” appears on hover.
2. The **Work Order Details** panel opens from the right with the start date pre-filled.
3. Fill in:
   - **Work Order Name** (required)
   - **Status** (Open, In Progress, Complete, Blocked)
   - **Start Date** and **End Date** (DD.MM.YYYY format)
4. Click **Create**. The panel closes and the new bar appears.

### Editing or Deleting

1. **Hover** over a work order bar — a three-dot menu (⋮) appears.
2. **Click** the menu → **Edit** or **Delete**.
3. For Edit: change fields and click **Save**, or **Cancel** to close without saving.

### Filtering Work Centers

1. Click the **⋯** filter button next to “Work Center”.
2. **Name**: Type to filter by work center name.
3. **Date range**: Enter start and/or end dates (DD.MM.YYYY). Only work centers with orders overlapping the range are shown.
4. Use the × buttons to clear filters. Press **Escape** to close the dropdown.

### Work Order Statuses

| Status       | Color  | Description        |
|-------------|--------|--------------------|
| Open        | Blue   | Not yet started    |
| In Progress | Purple | Currently in work  |
| Complete    | Green  | Finished           |
| Blocked     | Orange | Blocked or on hold |

---

## Project Structure

```
naologic/
├── work-order-schedule/     # Angular application
│   ├── src/app/
│   │   ├── components/      # Timeline, Work Order Panel, Timescale
│   │   ├── services/        # WorkOrderService, TimelineCalculatorService
│   │   ├── directives/      # Wheel zoom, debug tooltip
│   │   └── models/          # Work center & work order types
│   ├── public/data/         # Sample JSON (work-centers.json, work-orders.json)
│   ├── e2e/                 # Playwright E2E tests
│   └── docs/                # User guide, screenshots
├── docs/                    # ADRs, requirements, design
└── README.md                # This file
```

---

## Development

### Build

```bash
cd work-order-schedule
ng build
```

### Unit Tests

```bash
ng test --no-watch --browsers=ChromeHeadless
```

### E2E Tests (Playwright)

```bash
npx playwright test
```

Screenshots on failure: `test-results/`. HTML report: `npx playwright show-report playwright-report`.

### Generate User Documentation

Captures screenshots and regenerates the user guide:

```bash
npm run e2e:docs
```

### Accessibility (axe-core)

```bash
npm run e2e:a11y
```

---

## Sample Data

Work centers and work orders are loaded from `work-order-schedule/public/data/`:

- `work-centers.json` — work center definitions
- `work-orders.json` — work order definitions

Edit these files and refresh the browser for quick iteration without recompiling.

---

## Tech Stack

- **Angular 20** (LTS), standalone components
- **TypeScript** (strict mode)
- **SCSS**, Bootstrap 5, ng-bootstrap
- **ng-select** for dropdowns
- **Playwright** for E2E tests
- **Karma/Jasmine** for unit tests

---

## Documentation

- [User Guide](work-order-schedule/docs/USER-GUIDE.md) — step-by-step usage with screenshots
- [Architecture Decision Records](docs/adr/) — design decisions
- [WCAG Analysis](docs/WCAG-ANALYSIS.md) — accessibility compliance

---

## License

ISC
