---
name: Timescale Dropdown Design Match
overview: "Update the timescale dropdown to match the Sketch design: add a \"Timescale\" label inline with the dropdown button, use the exported Triangle SVG for the caret, and align styling (colors, borders, spacing) with the design reference."
todos: []
isProject: false
---

# Timescale Dropdown Design Alignment

## Current State

- [timescale-dropdown.component.ts](work-order-schedule/src/app/components/timescale-dropdown/timescale-dropdown.component.ts): Renders only a button showing "Month ▼" (or Day/Week) with a Unicode caret
- No "Timescale" label; design shows label + dropdown inline
- Styling: 4px 8px padding, 6px gap, 14px font, Unicode ▼ caret

## Design Reference (from [Work Order Schedule - Default.png](docs/design-assets/screens/Work Order Schedule - Default.png))

- **Layout**: "Timescale" label (dark grey) + dropdown button inline, minimal horizontal space between
- **Button**: Light grey background, thin grey border, rounded corners, "Month" text + downward triangle caret
- **Caret**: Right-aligned (per [UI-THEME-DESIGN-DOCUMENT.md](docs/UI-THEME-DESIGN-DOCUMENT.md) section 5.3)
- **Triangle SVG**: [docs/design-assets/icons/Triangle.svg](docs/design-assets/icons/Triangle.svg) — 8x5px, fill #687196

## Implementation Plan

### 1. Add "Timescale" label inline with dropdown

Wrap the dropdown in a horizontal flex container with the label:

```html
<div class="timescale-row">
  <span class="timescale-label">Timescale</span>
  <div class="timescale-dropdown" [class.open]="open()">
    ...
  </div>
</div>
```

- Label: `$color-text-primary`, font-size ~14px, font-weight 500 (or regular)
- Gap between label and button: ~8px (`$spacing-sm`)

### 2. Copy Triangle SVG to app assets

Copy [docs/design-assets/icons/Triangle.svg](docs/design-assets/icons/Triangle.svg) to `work-order-schedule/public/assets/icons/triangle-down.svg` so it can be referenced in the build. The SVG uses fill `#687196` (grey) — ensure it renders correctly or override via CSS.

### 3. Use SVG caret instead of Unicode

Replace the `<span class="caret">▼</span>` with an `<img>` or inline SVG referencing the Triangle asset. Angular can use `src="assets/icons/triangle-down.svg"` if the file is in `public/`.

### 4. Adjust button styling to match design

- Background: `$color-bg-secondary` or `#F9F9FB` (light grey) instead of pure white
- Border: `$color-border` (already used)
- Padding: Align with design — likely 6px 10px or 8px 12px
- Caret: Right-aligned; ensure `display: flex` with `justify-content: space-between` or `margin-left: auto` on caret so it sits on the right
- Font: 14px, `$color-text-primary`

### 5. Optional: Align with Work Center column

If the design requires the timescale to align with the left edge of the Work Center column (200px), the header would need a grid-like structure. The current header uses `align-items: flex-start` and full-width padding. To align:

- Add a wrapper for logo + title + timescale with `max-width: 200px` to match Work Center column, **or**
- Add `margin-left` / padding so the timescale row starts at the same visual position as the Work Center list

Given the design description ("aligned with the left edge of the Work Center column"), the simplest approach is to keep the header left-aligned with `$spacing-xl` (24px) padding — the Work Center column and header both start after the same left inset. If the timeline has no left margin, we may need to add a 200px "spacer" or restructure. **Recommendation**: Implement label + styling first; verify alignment visually and adjust if needed.

## Files to Modify


| File                                                                                                                                                                                   | Changes                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| [work-order-schedule/public/assets/icons/triangle-down.svg](work-order-schedule/public/assets/icons/triangle-down.svg)                                                                 | New file — copy from design-assets  |
| [work-order-schedule/src/app/components/timescale-dropdown/timescale-dropdown.component.ts](work-order-schedule/src/app/components/timescale-dropdown/timescale-dropdown.component.ts) | Add label, SVG caret, update styles |


## Summary

1. Add `timescale-row` wrapper with "Timescale" label + dropdown inline
2. Copy Triangle.svg to `public/assets/icons/triangle-down.svg`
3. Replace Unicode caret with SVG image; ensure caret is right-aligned in button
4. Update button: light grey background, refined padding, border-radius per design

