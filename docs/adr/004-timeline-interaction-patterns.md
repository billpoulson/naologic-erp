# ADR-004: Timeline Interaction Patterns

## Status
Accepted

## Context
The Work Order Schedule timeline needs intuitive navigation and zoom controls. Native scrollbars can be visually distracting, and users expect modern timeline UIs to support drag-to-pan and scroll-wheel zoom.

## Decision

1. **No visible scrollbar** – Hide the timeline scrollbar via CSS. Scrolling still works programmatically and via drag; the scrollbar is hidden for a cleaner look.

2. **Click-and-drag to pan** – Users can click and drag on the timeline to pan horizontally. The timeline moves with the cursor. A small movement threshold (e.g. 5px) distinguishes a drag from a click (which creates a work order).

3. **Scroll wheel to zoom** – Ctrl + mouse wheel changes the zoom level on the timeline. Scroll up = zoom in (month → week → day), scroll down = zoom out (day → week → month). Plain wheel scrolls the timeline vertically.

## Consequences

- **Positive**: Cleaner UI, familiar interaction patterns (similar to Gantt charts, maps, design tools)
- **Positive**: Keyboard-free navigation and zoom
- **Consideration**: Drag requires a movement threshold to avoid canceling row clicks
- **Consideration**: Zoom level is discrete (day/week/month); no continuous zoom
