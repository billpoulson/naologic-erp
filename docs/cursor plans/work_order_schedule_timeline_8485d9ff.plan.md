---
name: Work Order Schedule Timeline
overview: Build an Angular 20 (LTS) Work Order Schedule Timeline from scratch, implementing the core features (timeline grid, work order bars, create/edit panel, overlap detection) first, then refine for pixel-perfect design and polish.
todos:
  - id: angular-21-upgrade
    content: Angular 21 upgrade in May 2026 when Angular 21 enters LTS
    status: pending
isProject: false
---

# Work Order Schedule Timeline - Implementation Plan

## ADR: Angular Version

**Decision:** Use Angular v20.

**Context:** The Outline specifies Angular 17+. Multiple versions are available.

**Options considered:**

- Angular 17/18: Meets minimum requirement but older
- Angular 19: Active development
- Angular 20: LTS (Long Term Support) as of May 2025

**Decision:** Angular v20 for LTS. Security fixes through November 2026; stable foundation for production use.

**Consequences:** Use `npx @angular/cli@20 new` to scaffold. LTS provides security fixes through Nov 2026.

**Reference:** [Angular versioning and releases](https://angular.dev/reference/releases)

*Persist as `docs/adr/001-angular-v20-lts.md` in the project.*

---

## Design Requirements (from [docs/transcript.txt](docs/transcript.txt))

Neologic emphasizes **pixel-perfect UI** and **attention to detail**. Inspect each screen in Sketch; use exact colors and styling.


| Area                       | Requirement                                                                 |
| -------------------------- | --------------------------------------------------------------------------- |
| **Default timescale**      | **Month** (not Day)                                                         |
| **Timeline hover**         | "Click to add dates" on empty area hover                                    |
| **Bar hover**              | Hover over existing item reveals options; click opens Edit/Delete dropdown  |
| **Dropdowns**              | Do NOT use system dropdowns. Style exactly like the design.                 |
| **Side panel**             | Correct drop shadow, width, overlay. Inspect for exact values.              |
| **Status dropdown (form)** | Collapsed = pill; expanded = plain text (e.g. "Open" → pill when collapsed) |
| **Form fields**            | Default (placeholder), active (focused) states. Same for date picker.       |
| **Date picker**            | Clicking the field activates it. No separate calendar icon entry point.     |
| **All states**             | Inspect default, hover, expanded, active in Sketch for each component.      |


---

## Current State

- **Workspace:** Empty. Only [docs/Outline.md](docs/Outline.md) and [docs/UI-THEME-DESIGN-DOCUMENT.md](docs/UI-THEME-DESIGN-DOCUMENT.md) exist.
- **Approach:** Build core functionality first, then refine design and polish.

---

## Phase 1: Project Setup

### 1.1 ADR and Scaffold

- Create `docs/adr/001-angular-v20-lts.md` with the ADR content (see ADR section above)
- Scaffold Angular 20 application:

```bash
npx @angular/cli@20 new work-order-schedule --style=scss --routing=false --standalone --ssr=false
cd work-order-schedule
```

- Angular 20 (LTS) with standalone components
- SCSS for styling
- No SSR (simpler for take-home)

### 1.2 Add Dependencies

```bash
ng add @ng-bootstrap/ng-bootstrap
npm install ng-select
```

### 1.3 Configure Design System

- Add Circular Std font from Outline spec:

```html
  <link rel="stylesheet" href="https://naologic-com-assets.naologic.com/fonts/circular-std/circular-std.css">
  

```

- Create `src/styles/_variables.scss` with tokens from [docs/UI-THEME-DESIGN-DOCUMENT.md](docs/UI-THEME-DESIGN-DOCUMENT.md):
  - Status colors: Open (blue), In Progress (purple), Complete (green), Blocked (yellow/orange)
  - Backgrounds, text, borders
- Set `font-family: "Circular-Std"` in global styles

### 1.4 Create Sample Data (JSON for Fast Dev Feedback)

Use **JSON files** in `src/assets/data/` so edits take effect on refresh without recompile:

**File structure:**

```
src/assets/data/
├── work-centers.json   # Base work centers (5+)
└── work-orders.json    # Default scenario (8+ orders, all statuses)
```

**work-centers.json** (5+ centers):

```json
[
  { "docId": "wc-1", "docType": "workCenter", "data": { "name": "Extrusion Line A" } },
  ...
]
```

**work-orders.json** (8+ orders, all statuses, one center with multiple non-overlapping):

- Use ISO dates relative to "today" for easy adjustment
- Include `workCenterId`, `status`, `startDate`, `endDate`

**Service loading:** `WorkOrderService` loads via `HttpClient.get()` at init.

**Fallback:** Keep a minimal `sample-data.ts` that exports default data if JSON load fails (e.g. for unit tests).

---

## Phase 2: Core Architecture

### 2.1 Data Models

```typescript
// src/app/models/work-center.ts
interface WorkCenterDocument

// src/app/models/work-order.ts
interface WorkOrderDocument
type WorkOrderStatus = 'open' | 'in-progress' | 'complete' | 'blocked'
```

### 2.2 Data Service

- `src/app/services/work-order.service.ts`:
  - Load work centers from `assets/data/work-centers.json`
  - Load work orders from `assets/data/work-orders.json`
  - In-memory store: `BehaviorSubject` for work orders (reactive updates)
  - `getWorkCenters()`, `getWorkOrders()`, `getWorkOrdersByCenter(workCenterId)`
  - `createWorkOrder()`, `updateWorkOrder()`, `deleteWorkOrder()`
  - `checkOverlap(workCenterId, startDate, endDate, excludeDocId?)` for overlap detection

### 2.3 App Shell

- `src/app/app.component.ts`: Single layout with header, main content area
- `src/app/app.component.html`: Host for timeline + sidebar panel

---

## Phase 3: Timeline Component (MVP)

### 3.1 Layout Structure

```
┌─────────────────────────────────────────────────────────────────┐
│ Work Orders                                                     │
│ Timescale: [Month ▼]  (default)                                 │
├──────────────────┬──────────────────────────────────────────────┤
│ Work Center      │  Timeline Grid                               │
├──────────────────┼──────────────────────────────────────────────┤
│ Work Center A    │  [bars...]                                    │
│ Work Center B    │  [bars...]                                    │
└──────────────────┴──────────────────────────────────────────────┘
```

### 3.2 Timeline Component

- `src/app/components/timeline/timeline.component.ts`
- **Inputs:** `workCenters`, `workOrders`, `zoomLevel` (day | week | month)
- **Outputs:** `createRequest(date, workCenterId)`, `editRequest(workOrder)`
- **Layout:** CSS Grid or flexbox:
  - Left column: Work center names (fixed width ~200px)
  - Right column: Scrollable timeline area

### 3.3 Timeline Header

- `src/app/components/timeline/timeline-header.component.ts`
- Renders date columns based on zoom level
- Day: individual days; Week: week labels; Month: month labels
- **Current day indicator:** Vertical line at today's date

### 3.4 Timeline Row

- `src/app/components/timeline/timeline-row.component.ts`
- One row per work center
- Renders work order bars for that center
- **Click empty area:** Emit click with date and work center ID
- **Row hover:** Highlight background (see design doc)

### 3.5 Date-to-Pixel Logic

- `src/app/services/timeline-calculator.service.ts`:
  - `getVisibleDateRange(zoomLevel)` → e.g. today ± 2 weeks for Day
  - `dateToPosition(date, rangeStart, rangeEnd, pixelWidth)` → percentage or px
  - `positionToDate(x, rangeStart, rangeEnd, pixelWidth)` → for click-to-create
  - Column width: e.g. 60px per day for Day view, 80px per week, 100px per month

### 3.6 Work Order Bar Component

- `src/app/components/timeline/work-order-bar.component.ts`
- **Props:** `workOrder`, `startPosition`, `endPosition` (percent or px)
- **Content:** Name, status badge (pill), three-dot menu button
- **Status badge:** Colored by status (Open=blue, In Progress=purple, Complete=green, Blocked=orange)
- **Three-dot menu:** ngbDropdown with Edit and Delete options

---

## Phase 4: Create/Edit Panel

### 4.1 Panel Component

- `src/app/components/work-order-panel/work-order-panel.component.ts`
- **Mode:** `'create' | 'edit'`
- **Inputs:** `visible`, `mode`, `workOrder` (for edit), `initialDate`, `workCenterId` (for create)
- **Outputs:** `close`, `save`, `delete`
- **Behavior:** Slides in from right. Inspect Sketch for exact width, drop shadow, overlay.
- **Backdrop:** Click outside to close

### 4.2 Form

- Reactive Forms with FormGroup:
  - Work Order Name (required, text)
  - Status (custom-styled dropdown: collapsed = pill, expanded = plain text; not system default)
  - Start Date (ngb-datepicker; click field to activate, no separate calendar icon)
  - End Date (ngb-datepicker; same)
- **Validators:** Required, end date > start date
- **Custom validator:** Overlap check (call service)

### 4.3 Panel Actions

- **Create mode:** "Create" button (primary)
- **Edit mode:** "Save" button (primary), "Delete" in dropdown or separate
- **Cancel:** Secondary button, closes panel

---

## Phase 5: Integration and State

### 5.1 Parent Component

- `src/app/components/work-order-schedule/work-order-schedule.component.ts`
- **State:** `workCenters`, `workOrders`, `zoomLevel`, `panelVisible`, `panelMode`, `selectedWorkOrder`, `clickContext`
- **Handlers:**
  - `onTimescaleChange(zoom)` → update zoomLevel
  - `onCreateRequest(date, workCenterId)` → open panel in create mode
  - `onEditRequest(workOrder)` → open panel in edit mode
  - `onDelete(workOrder)` → delete from service, close panel
  - `onSave(formValue)` → create or update, validate overlap, close panel

### 5.2 Routing

- Single route: `/` → `WorkOrderScheduleComponent`
- App component loads `WorkOrderScheduleComponent`

---

## Phase 6: Refinement (After MVP Works)

### 6.1 Pixel-Perfect Styling

- Match Sketch designs from [docs/UI-THEME-DESIGN-DOCUMENT.md](docs/UI-THEME-DESIGN-DOCUMENT.md)
- Exact colors, spacing, typography
- Status badge pill styling
- Panel layout and form field styling
- Hover states on rows and bars

### 6.2 Polish

- Panel slide-in/out animation
- Bar hover effects
- Current day indicator styling
- Responsive behavior (horizontal scroll on small screens)

### 6.3 Bonus (Optional)

- localStorage persistence
- "Today" button
- Tooltip on bar hover
- Keyboard navigation (Escape to close)

---

## Phase 7: Testing

### 7.1 Test Stack

- **Unit:** Jasmine + Karma (Angular default) or Jest
- **E2E:** Cypress or Playwright (Angular 18+ supports both)

### 7.2 Unit Tests (General Coverage)

- **Components:** Timeline, TimelineRow, WorkOrderBar, WorkOrderPanel, WorkOrderSchedule
  - Rendering with sample data
  - Event emissions (createRequest, editRequest, save, close)
  - Form validation (required fields, end > start)
- **WorkOrderService:** Load data, CRUD, overlap detection
- **WorkOrderPanel:** Create vs edit mode, form prefill, validation errors

### 7.3 Timeline Calculator (Heavy Testing)

`TimelineCalculatorService` is critical—date math drives bar positioning and click-to-create. **Heavy test coverage:**

- **getVisibleDateRange(zoomLevel):**
  - Day: returns today ± 2 weeks
  - Week: returns today ± 2 months
  - Month: returns today ± 6 months
  - Boundary dates correct (start of day, end of range)
- **dateToPosition(date, rangeStart, rangeEnd, pixelWidth):**
  - Date at range start → 0
  - Date at range end → pixelWidth
  - Date in middle → proportional position
  - Date outside range → clamped or correct out-of-bounds handling
- **positionToDate(x, rangeStart, rangeEnd, pixelWidth):**
  - Inverse of dateToPosition (round-trip)
  - Click at 0 → rangeStart
  - Click at pixelWidth → rangeEnd
- **Edge cases:** Leap years, DST transitions, different zoom levels, empty ranges

### 7.4 E2E Tests (Application Behavior)

- Timeline loads with work centers and bars
- Timescale dropdown switches Day/Week/Month
- Click empty area → panel opens, start date pre-filled
- Create work order → bar appears
- Edit via three-dot menu → panel opens with data
- Delete work order → bar removed
- Overlap validation → error shown, no create
- Cancel closes panel

### 7.5 Screenshot Capture for Test Runs

- **E2E:** Configure framework to capture screenshots:
  - **On failure:** Automatic (Cypress/Playwright default)
  - **On success for key flows:** Create, edit, overlap error, zoom switch
  - **Output dir:** `cypress/screenshots/` or `test-results/` (Playwright)
- **CI/reports:** Ensure screenshots are retained in artifacts (e.g. `cypress/screenshots` in GitHub Actions)
- **Naming:** Include spec name and step (e.g. `create-work-order--panel-open.png`)

---

## File Structure (Target)

```
docs/
├── adr/
│   └── 001-angular-v20-lts.md   # ADR: Angular v20 for LTS
└── TODO.md                      # Future upgrades (e.g. Angular 21 in May 2026)

src/
├── assets/
│   └── data/
│       ├── work-centers.json
│       └── work-orders.json
├── app/
│   ├── components/
│   │   ├── timeline/
│   │   │   ├── timeline.component.ts
│   │   │   ├── timeline-header.component.ts
│   │   │   ├── timeline-row.component.ts
│   │   │   └── work-order-bar.component.ts
│   │   ├── work-order-panel/
│   │   │   └── work-order-panel.component.ts
│   │   └── work-order-schedule/
│   │       └── work-order-schedule.component.ts
│   ├── services/
│   │   ├── work-order.service.ts
│   │   ├── work-order.service.spec.ts
│   │   ├── timeline-calculator.service.ts
│   │   └── timeline-calculator.service.spec.ts   # Heavy coverage
│   ├── models/
│   │   ├── work-center.ts
│   │   └── work-order.ts
│   ├── data/
│   │   └── sample-data.ts   # Fallback for tests if JSON load fails
│   ├── app.component.ts
│   └── main.ts
├── styles/
│   ├── _variables.scss
│   └── styles.scss
└── index.html
```

**E2E (Cypress or Playwright):**

```
cypress/   # or e2e/ for Playwright
├── e2e/
│   ├── timeline.cy.ts
│   ├── create-edit.cy.ts
│   └── overlap-validation.cy.ts
├── screenshots/   # Captured on run
└── cypress.config.ts
```

---

## Implementation Order

**Sequential:** Each phase must be completed fully before advancing to the next. No deferring phases.

1. **Phase 1** – Setup: Project, deps, styles, sample data
2. **Phase 2** – Models + Service: Data layer and overlap logic
3. **Phase 3** – Timeline: Grid, header, rows, bars, date math
4. **Phase 4** – Panel: Form, validation, create/edit
5. **Phase 5** – Integration: Wire everything in parent component
6. **Phase 6** – Refinement: Design polish, animations, responsiveness
7. **Phase 7** – Testing: Unit tests (incl. heavy timeline-calculator coverage), E2E with screenshot capture

---

## Key Decisions

- **Phased execution:** Each phase must be completed fully before advancing. No deferring phases.
- **Angular v20 (LTS):** Chosen for long-term support; security fixes through Nov 2026 (see ADR)
- **Testing:** Unit + E2E for general behavior; **heavy unit tests** on `TimelineCalculatorService` (date math); screenshots captured for E2E runs (failure + key flows)
- **Sample data as JSON** in `assets/data/` for fast dev feedback: edit JSON, refresh browser, no recompile
- **Single panel** for both create and edit (mode flag)
- **Overlap detection** in service before save; show error in form
- **Default timescale:** Month (per transcript). Date range centered on today: ±2 weeks (Day), ±2 months (Week), ±6 months (Month)
- **Bar positioning** via percentage of visible range width

---

## Future / Upgrade Todos


| Todo               | When     | Notes                      |
| ------------------ | -------- | -------------------------- |
| Angular 21 upgrade | May 2026 | When Angular 21 enters LTS |


*Persist in app as `docs/TODO.md` or `@upgrade` comment in README.*