---
name: Add Delete Confirmation
overview: "Add a delete confirmation step when the user clicks Delete on a work order bar. The confirmation will appear inline in the bar dropdown, reusing the dropdown container with timescale-like spacing (padding: 12px 0 on container, 5px 0 5px 12px on options)."
todos: []
isProject: false
---

# Add Delete Confirmation for Work Orders

## Approach

Add an inline confirmation view within the bar dropdown. When the user clicks **Delete**, the dropdown content switches to a confirmation state ("Delete [name]?") with **Delete** (confirm) and **Cancel** buttons. Uses the same dropdown container with timescale-like spacing.

## Key Files

- [work-order-schedule/src/app/components/timeline/work-order-bar.component.ts](work-order-schedule/src/app/components/timeline/work-order-bar.component.ts) - Add confirmation state and template
- [work-order-schedule/src/app/components/timeline/work-order-bar.component.scss](work-order-schedule/src/app/components/timeline/work-order-bar.component.scss) - Add timescale-like spacing for confirmation view
- [work-order-schedule/src/app/components/timescale-select/timescale-select.component.scss](work-order-schedule/src/app/components/timescale-select/timescale-select.component.scss) - Reference for spacing (lines 92-105, 107-119)

## Implementation

### 1. Work-order-bar component (template + logic)

- Add signal `showDeleteConfirm = signal(false)`.
- When **Delete** is clicked: set `showDeleteConfirm.set(true)` instead of emitting immediately.
- When `showDeleteConfirm()` is true, render confirmation view:
  - Message: "Delete [work order name]?"
  - Button "Delete" (primary/destructive): emits `delete.emit()`, closes dropdown, resets `showDeleteConfirm`.
  - Button "Cancel": sets `showDeleteConfirm.set(false)` (returns to Edit/Delete menu).
- When `showDeleteConfirm()` is false, render the existing Edit/Delete menu.
- Backdrop click: close dropdown and reset `showDeleteConfirm`.
- Update `updateDropdownPosition()`: increase `dropdownHeight` when confirmation is shown (e.g. ~100px) so the confirmation fits.

### 2. Work-order-bar component (styles)

Apply timescale-like spacing to the confirmation view:

- **Container** (confirmation wrapper): `padding: 12px 0` (matches `.timescale-menu`).
- **Message**: `padding: 0 12px 8px 12px`, font size 14px.
- **Buttons**: `padding: 5px 0 5px 12px` (matches `.timescale-option`), `min-width: 200px` for the dropdown when in confirmation mode.

Reuse existing `.bar-dropdown` for the outer container; add a `.bar-dropdown-confirm` wrapper and `.bar-dropdown-confirm-option` for the buttons to apply the timescale spacing.

### 3. Tests

- [work-order-bar.component.spec.ts](work-order-schedule/src/app/components/timeline/work-order-bar.component.spec.ts): Update "should emit delete when Delete is clicked" to first click Delete (show confirmation), then click the confirm Delete button.
- [work-order-schedule.component.spec.ts](work-order-schedule/src/app/components/work-order-schedule/work-order-schedule.component.spec.ts): No change needed if delete still emits and is handled the same way.
- [user-documentation.spec.ts](work-order-schedule/e2e/user-documentation.spec.ts): Update delete workflow if we add a delete screenshot - the flow would be: hover, click menu, click Delete (shows confirmation), click Delete again (confirms). The existing 09 screenshot shows Edit/Delete; we may want a new screenshot for the confirmation state, or the user guide can describe the two-step flow.

### 4. USER-GUIDE (optional)

Update the Deleting section to describe the two-step flow: "Click Delete to show a confirmation, then click Delete again to confirm."

## Spacing Reference (from timescale-select.component.scss)

```scss
.timescale-menu {
  padding: 12px 0;
  min-width: 200px;
}

.timescale-option {
  padding: 5px 0 5px 12px;
}
```

