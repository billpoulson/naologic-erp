---
name: Work Order Schedule Timeline
overview: Build an Angular 17+ Work Order Schedule Timeline from scratch, implementing the core features (timeline grid, work order bars, create/edit panel, overlap detection) first, then refine for pixel-perfect design and polish.
todos: []
isProject: false
---

# Work Order Schedule Timeline - Implementation Plan

## Current State

- **Workspace:** Empty. Only [docs/Outline.md](docs/Outline.md) and [docs/UI-THEME-DESIGN-DOCUMENT.md](docs/UI-THEME-DESIGN-DOCUMENT.md) exist.
- **Approach:** Build core functionality first, then refine design and polish.

---

## Phase 1: Project Setup

### 1.1 Scaffold Angular Application

```bash
ng new work-order-schedule --style=scss --routing=false --standalone --ssr=false
cd work-order-schedule
```

- Angular 17+ with standalone components
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

### 1.4 Create Sample Data

- `src/app/data/sample-data.ts`:
  - 5+ work centers (e.g., Extrusion Line A, CNC Machine 1, Assembly Station, Quality Control, Packaging Line)
  - 8+ work orders across centers with varied statuses and date ranges
  - At least one work center with multiple non-overlapping orders
  - Follow `WorkCenterDocument` and `WorkOrderDocument` interfaces from Outline

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
  - In-memory store for work centers and work orders
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
│ Timescale: [Day ▼]                                              │
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
- **Behavior:** Slides in from right, fixed width (~400px from design)
- **Backdrop:** Click outside to close

### 4.2 Form

- Reactive Forms with FormGroup:
  - Work Order Name (required, text)
  - Status (ng-select, default "Open")
  - Start Date (ngb-datepicker)
  - End Date (ngb-datepicker)
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

## File Structure (Target)

```
src/
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
│   │   └── timeline-calculator.service.ts
│   ├── models/
│   │   ├── work-center.ts
│   │   └── work-order.ts
│   ├── data/
│   │   └── sample-data.ts
│   ├── app.component.ts
│   └── main.ts
├── styles/
│   ├── _variables.scss
│   └── styles.scss
└── index.html
```

---

## Implementation Order

1. **Setup** (Phase 1): Project, deps, styles, sample data
2. **Models + Service** (Phase 2): Data layer and overlap logic
3. **Timeline** (Phase 3): Grid, header, rows, bars, date math
4. **Panel** (Phase 4): Form, validation, create/edit
5. **Integration** (Phase 5): Wire everything in parent component
6. **Refinement** (Phase 6): Design polish, animations, responsiveness

---

## Key Decisions

- **Single panel** for both create and edit (mode flag)
- **Overlap detection** in service before save; show error in form
- **Date range** centered on today: ±2 weeks (Day), ±2 months (Week), ±6 months (Month)
- **Bar positioning** via percentage of visible range width
