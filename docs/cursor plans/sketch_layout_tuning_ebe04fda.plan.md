---
name: Sketch Layout Tuning
overview: Align the Work Order Schedule app layout, colors, and components with the Sketch designs by replacing hardcoded values with design tokens, customizing dropdowns, and applying correct focus/panel styling.
todos: []
isProject: false
---

# Sketch Design Layout Tuning Plan

## Design Sources

- [docs/UI-THEME-DESIGN-DOCUMENT.md](docs/UI-THEME-DESIGN-DOCUMENT.md) - UI theme spec
- [docs/theme-colors.json](docs/theme-colors.json) - Verified Sketch colors
- [docs/transcript.txt](docs/transcript.txt) - Neologic emphasis on pixel-perfect UI, custom dropdowns, panel styling, status pill vs plain text

## Current vs Design Gaps


| Area               | Current                               | Design                                                                                    |
| ------------------ | ------------------------------------- | ----------------------------------------------------------------------------------------- |
| Colors             | Hardcoded (#666, #e0e0e0, #eee, #888) | Use SCSS variables from [_variables.scss](work-order-schedule/src/styles/_variables.scss) |
| Timescale dropdown | Native `<select>`                     | Custom styled (transcript: "don't use system drop downs")                                 |
| Status dropdown    | ng-select (single style)              | Collapsed = pill; Expanded = plain text                                                   |
| Form fields        | No focus state                        | Blue border on focus                                                                      |
| Panel              | `-4px 0 24px rgba(0,0,0,0.12)`        | Verify drop shadow and overlay                                                            |
| Row hover          | `#e8e8ff`                             | Matches `$color-bg-hover`                                                                 |
| Header layout      | Logo + title only                     | Logo + title + Timescale (design doc 6.1)                                                 |


---

## 1. Replace Hardcoded Colors with Design Tokens

**Files:** [timeline.component.ts](work-order-schedule/src/app/components/timeline/timeline.component.ts), [timeline-header.component.ts](work-order-schedule/src/app/components/timeline/timeline-header.component.ts), [timeline-row.component.ts](work-order-schedule/src/app/components/timeline/timeline-row.component.ts), [work-order-bar.component.ts](work-order-schedule/src/app/components/timeline/work-order-bar.component.ts), [work-order-panel.component.ts](work-order-schedule/src/app/components/work-order-panel/work-order-panel.component.ts)

- Add `@use '../../styles/variables' as *;` (or equivalent path) to each component
- Replace `#e0e0e0` → `$color-border`, `#eee` → `$color-border` or `$color-bg-secondary-alt`, `#666` → `$color-text-secondary`, `#888` → `$color-text-secondary`
- Replace work-order-bar status colors with `$color-status-*-bg` and `$color-status-`* variables
- Replace bar dropdown border/shadow with design tokens
- Replace row hover `#e8e8ff` with `$color-bg-hover` (already matches)
- Replace today indicator `#1890ff` with `$color-status-open`

---

## 2. Header Layout: Add Timescale to App Header

**Design doc 6.1:** "NAOLOGIC logo (blue) top-left, 'Work Orders' title, Timescale dropdown (Month selected)"

- Move Timescale dropdown from [timeline.component.ts](work-order-schedule/src/app/components/timeline/timeline.component.ts) into [app.html](work-order-schedule/src/app/app.html) / app shell
- Use two-way binding: parent passes `zoomLevel` and `zoomLevelChange` to both header and timeline
- Layout: horizontal flex with logo, title, and timescale aligned in one row

---

## 3. Custom Timescale Dropdown

**Transcript:** "Make sure you don't use system drop downs that don't look like these. Like it should be styled exactly like this."

- Replace native `<select>` with a custom dropdown (or ng-select styled to match)
- Styling: white bg, light gray border, right-aligned caret, ~4px radius
- Match View Selection sketch: collapsed = single value; expanded = plain text options
- Use `$color-border`, `$color-border-focus`, `$radius-default`

---

## 4. Status Dropdown: Pill (Collapsed) vs Plain Text (Expanded)

**Transcript:** "When it's collapsed, you'll see the pill version. When it is expanded, you'll see that it's a plain text."

- ng-select supports custom templates: use `ng-template` for single-selection display (pill) and `ng-option-tmp` for dropdown options (plain text)
- Collapsed: render selected value as status pill (colored bg, small rounded)
- Expanded: render options as plain text list
- Ensure ng-select styling matches design (border, focus, no native look)

---

## 5. Form Field Focus State

**Transcript:** "You have an active state of the text field... blue border on active field"

- Add `.form-control:focus` with `border-color: $color-border-focus`, `outline: none`, optional `box-shadow`
- Apply to text inputs and ng-select (via ng-select's focus styling)
- Date picker: already click-to-activate; ensure no separate calendar icon (transcript)

---

## 6. Panel Overlay and Drop Shadow

**Transcript:** "Correct drop shadow behind the side panel... correct overlay"

- Verify panel shadow: design doc suggests `-4px 0 24px rgba(0,0,0,0.12)`; compare with Sketch
- Verify overlay: `rgba(0,0,0,0.3)` or design-specified opacity
- Panel width: 400px (matches `$layout-panel-width`)

---

## 7. Font and Typography

- [index.html](work-order-schedule/index.html) already loads Circular Std
- [styles.scss](work-order-schedule/src/styles.scss) sets `font-family: 'Circular-Std', sans-serif` globally
- Verify Outline spec: `font-family: "Circular-Std";` (quotes may matter for font name with hyphen)

---

## Implementation Order

1. Replace hardcoded colors with variables (low risk, foundational)
2. Add form field focus styles (quick win)
3. Move Timescale to header and restructure layout
4. Build custom Timescale dropdown
5. Style Status dropdown (pill collapsed, plain expanded)
6. Verify panel shadow/overlay against design

---

## Files to Modify


| File                                                                                          | Changes                                                                    |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `work-order-schedule/src/styles/_variables.scss`                                              | Add any missing tokens if needed                                           |
| `work-order-schedule/src/app/app.html`                                                        | Add Timescale dropdown to header                                           |
| `work-order-schedule/src/app/app.scss`                                                        | Header layout for logo + title + timescale                                 |
| `work-order-schedule/src/app/components/timeline/timeline.component.ts`                       | Remove controls, use variables, accept zoomLevel from parent               |
| `work-order-schedule/src/app/components/work-order-schedule/work-order-schedule.component.ts` | Lift zoomLevel to pass to app shell or keep in schedule and pass to header |
| `work-order-schedule/src/app/components/timeline/timeline-header.component.ts`                | Use variables                                                              |
| `work-order-schedule/src/app/components/timeline/timeline-row.component.ts`                   | Use variables                                                              |
| `work-order-schedule/src/app/components/timeline/work-order-bar.component.ts`                 | Use variables for bar and dropdown                                         |
| `work-order-schedule/src/app/components/work-order-panel/work-order-panel.component.ts`       | Focus styles, variables, ng-select templates                               |


---

## Architecture Note

The Timescale dropdown must control `zoomLevel` which is used by `TimelineComponent`. Options:

- **A:** Keep `zoomLevel` in `WorkOrderScheduleComponent`, pass to both a new header slot and `TimelineComponent`. App shell would need to receive zoomLevel/zoomLevelChange from the schedule (e.g. via `@Input`/`@Output` or a shared service).
- **B:** Add a header section inside `WorkOrderScheduleComponent` that contains logo, title, and timescale, with the main app shell only providing the outer chrome.

Design doc implies the header (logo + title + timescale) is at the top of the canvas. The current `app-header` has logo + title. Simplest approach: extend `app-header` to include the timescale, and have `WorkOrderScheduleComponent` expose `zoomLevel`/`zoomLevelChange` to a parent that renders the header. Since the schedule is inside `app-main`, we can either:

- Put the timescale in `app-header` and use a shared service for zoomLevel, or
- Create a `WorkOrderScheduleShell` that wraps header (logo, title, timescale) + main (timeline), with zoomLevel state in the shell.

Recommendation: Create a layout where `app-header` contains logo, title, and a timescale control. Use a lightweight `ZoomLevelService` or pass zoomLevel via `WorkOrderScheduleComponent` up to a parent that provides it to the header. Alternatively, render the full "Work Orders" header (including timescale) inside `WorkOrderScheduleComponent` so all schedule state stays in one place—then the app shell only has logo + generic chrome.