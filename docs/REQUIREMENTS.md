# Work Order Schedule — Requirements Document

**Source:** Outline.md, transcript.txt, agent transcripts  
**Last updated:** March 2025

---

## 1. Summary of Outline

The **Outline** describes a frontend technical test: building a **Work Order Schedule Timeline** for a manufacturing ERP system. It is an interactive timeline that lets users view, create, and edit work orders across multiple work centers.

### At a Glance


| Aspect               | Details                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| **Core deliverable** | Interactive timeline with Day/Week/Month zoom, work order bars, create/edit panel |
| **Stack**            | Angular 17+, TypeScript (strict), SCSS, Reactive Forms, ng-select, ngb-datepicker |
| **Design source**    | Sketch file (pixel-perfect implementation expected)                               |
| **Font**             | Circular Std                                                                      |
| **Deliverables**     | Working app, pixel-perfect design, sample data, 5–10 min Loom demo, GitHub repo   |


### Must Implement

- Timeline grid with Day/Week/Month zoom levels
- Work order bars with status indicators (Open, In Progress, Complete, Blocked)
- Create/Edit slide-out panel with form validation
- Overlap detection (error when work orders overlap on the same work center)

### Data Model

- **Work centers:** At least 5 (e.g., Extrusion Line A, CNC Machine 1, Assembly Station, Quality Control, Packaging Line)
- **Work orders:** At least 8 across centers, all 4 statuses, at least one center with multiple non-overlapping orders

---

## 2. Summary of Transcripts

### 2.1 Video Transcript (transcript.txt)

Naologic’s video transcript emphasizes:

- **Pixel-perfect UI:** Inspect layouts, colors, and states; avoid guessing.
- **States to implement:**
  - Timeline default view
  - Hover state for “click to add dates”
  - Expanded dropdown for timescale
  - Hover over existing item → reveal options
  - Clicked options → Edit/Delete
- **Timescale:** Default should be **Month** (not Day).
- **Dropdowns:** Do not use system dropdowns; style to match the design.
- **Create/Edit panel:**
  - Correct drop shadow behind the side panel
  - Correct panel width
  - Correct overlay
  - Correct placement
- **Status dropdown behavior:**
  - Collapsed: pill-style display (e.g., “Open” as pill)
  - Expanded: plain text
- **Form fields:**
  - Default states with placeholder text
  - Active state for text fields and date picker
- **Date picker:** Clicking the field activates the date picker; no separate calendar icon.
- **Design source:** Use Sketch Cloud; inspect each screen for colors and styling.

### 2.2 Agent Transcripts

**ADR & process rules:**

- ADRs required for key decisions; each ADR must have a matching Cursor rule
- Pre-commit: build, run tests, check coverage, add tests for new functionality; no “made by cursor” in commits
- Theme colors in `docs/theme-colors.json` (confirmed from Sketch)
- Path alias imports preferred (e.g., `@app`, `@shared`)

**Design & implementation:**

- UI theme captured in `docs/UI-THEME-DESIGN-DOCUMENT.md`
- 8 design screens mapped to Sketch URLs
- Logo extracted from naologic.com; documented in `docs/LOGO-EXTRACTION.md`

---

## 3. Consolidated Requirements

### 3.1 Functional Requirements


| ID    | Requirement                                                                   | Priority |
| ----- | ----------------------------------------------------------------------------- | -------- |
| FR-1  | Timeline grid with Day, Week, Month zoom levels                               | Must     |
| FR-2  | Default timescale: **Month**                                                  | Must     |
| FR-3  | Work order bars with name, status badge, three-dot actions menu               | Must     |
| FR-4  | Status types: Open, In Progress, Complete, Blocked                            | Must     |
| FR-5  | Click empty timeline area → open Create panel; pre-fill start date from click | Must     |
| FR-6  | Three-dot menu → Edit / Delete                                                | Must     |
| FR-7  | Create panel: Work Order Name, Status, Start Date, End Date (Reactive Forms)  | Must     |
| FR-8  | Edit panel: same fields, pre-filled; Save instead of Create                   | Must     |
| FR-9  | Overlap detection: block create/edit if orders overlap on same work center    | Must     |
| FR-10 | Click outside panel or Cancel → close panel                                   | Must     |
| FR-11 | Current day indicator (vertical line)                                         | Must     |
| FR-12 | Row hover state (highlighted background)                                      | Must     |
| FR-13 | Left panel (work centers) fixed; timeline horizontally scrollable             | Must     |


### 3.2 UI/UX Requirements


| ID   | Requirement                                                     | Priority |
| ---- | --------------------------------------------------------------- | -------- |
| UX-1 | Pixel-perfect match to Sketch designs                           | Must     |
| UX-2 | Font: Circular Std                                              | Must     |
| UX-3 | Custom-styled dropdowns (no system dropdowns)                   | Must     |
| UX-4 | Status dropdown: pill when collapsed, plain text when expanded  | Must     |
| UX-5 | Date picker: activate on field click; no separate calendar icon | Must     |
| UX-6 | Side panel: correct drop shadow, width, overlay, placement      | Must     |
| UX-7 | Hover state for “click to add dates” on empty timeline          | Must     |
| UX-8 | Hover on work order bar → reveal options (three-dot menu)       | Must     |
| UX-9 | Responsive; horizontal scroll acceptable on mobile              | Should   |


### 3.3 Technical Requirements


| ID   | Requirement                                         | Priority |
| ---- | --------------------------------------------------- | -------- |
| TR-1 | Angular 17+ (standalone components preferred)       | Must     |
| TR-2 | TypeScript strict mode                              | Must     |
| TR-3 | SCSS for styling                                    | Must     |
| TR-4 | Reactive Forms (FormGroup, FormControl, Validators) | Must     |
| TR-5 | ng-select for dropdowns                             | Must     |
| TR-6 | @ng-bootstrap/ng-bootstrap (ngb-datepicker)         | Must     |
| TR-7 | Document structure: `docId`, `docType`, `data`      | Must     |
| TR-8 | Path alias imports (e.g., `@app`)                   | Should   |


### 3.4 Data Requirements


| ID   | Requirement                                                   | Priority |
| ---- | ------------------------------------------------------------- | -------- |
| DR-1 | At least 5 work centers with realistic names                  | Must     |
| DR-2 | At least 8 work orders across centers                         | Must     |
| DR-3 | All 4 status types represented                                | Must     |
| DR-4 | At least one work center with multiple non-overlapping orders | Must     |
| DR-5 | Orders spanning different date ranges                         | Must     |


### 3.5 Validation Rules


| ID  | Rule                                                                                  |
| --- | ------------------------------------------------------------------------------------- |
| V-1 | Work Order Name: required                                                             |
| V-2 | Status: required                                                                      |
| V-3 | Start Date: required                                                                  |
| V-4 | End Date: required, must be after Start Date                                          |
| V-5 | No overlap with other orders on same work center (exclude current order when editing) |


### 3.6 Deliverables


| ID  | Deliverable                                  |
| --- | -------------------------------------------- |
| D-1 | Working Angular application (`ng serve`)     |
| D-2 | Pixel-perfect implementation per Sketch      |
| D-3 | Sample data (work centers + work orders)     |
| D-4 | README with setup and run instructions       |
| D-5 | 5–10 minute Loom demo                        |
| D-6 | Public GitHub/GitLab repo with clean history |


### 3.7 Bonus (Optional)

- localStorage persistence
- Automated test suite
- Smooth animations/transitions
- Keyboard navigation
- “Today” button
- Tooltip on bar hover
- Infinite horizontal scroll
- Accessibility (ARIA, focus management)

---

## 4. Design References


| Resource          | Location                                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Sketch design     | [https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667) |
| UI theme document | `docs/UI-THEME-DESIGN-DOCUMENT.md`                                                                                             |
| Theme colors      | `docs/theme-colors.json`                                                                                                       |
| Logo extraction   | `docs/LOGO-EXTRACTION.md`                                                                                                      |


---

## 5. Related Documents

- **Outline.md** — Full technical specification
- **transcript.txt** — Video transcript with implementation pointers
- **docs/adr/** — Architecture decision records
- **docs/TODO.md** — Future upgrades (e.g., Angular 21)
- **docs/WCAG-ANALYSIS.md** — WCAG 2.1 accessibility analysis and compliance status

