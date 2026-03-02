---
name: Fix forward timeline extension
overview: "The timeline extends correctly when scrolling backward (into history) in day mode but fails when scrolling forward. The root cause is a timing mismatch: backward extension uses `setTimeout(0)` to defer scroll adjustment until after the DOM updates, while forward extension uses `requestAnimationFrame`, which can run before Angular and the browser have applied the new range and width."
todos: []
isProject: false
---

# Fix Forward Timeline Extension in Day Mode

## Root Cause

The backward and forward extension paths use different timing mechanisms:

| Direction | Timing | Effect |
|-----------|--------|--------|
| **Backward** | `setTimeout(() => {...}, 0)` | Runs after event loop; DOM has updated with new width; scroll position correct |
| **Forward** | `requestAnimationFrame(() => {...})` | Runs before next paint; `el.scrollWidth` and layout may still reflect old content; scroll position wrong |

When `extendForward` is called, the range service updates its signals synchronously. The timeline's `dateRange()` and `timelineWidth()` computeds will re-evaluate when read. However, the scroll container's `scrollWidth` (the actual DOM content width) only updates after:

1. Angular change detection runs
2. The template re-renders with the new `[style.width.px]="timelineWidth()"`
3. The browser performs layout/reflow

`requestAnimationFrame` runs before the next paint, often before layout is complete. The scroll position calculation uses `el.scrollWidth` (implicitly via `Math.min(targetScroll, scrollWidth - clientWidth)`), and the `targetScroll` formula depends on `newWidth` which may not yet match the rendered DOM.

## Solution

Change the forward extension callback from `requestAnimationFrame` to `setTimeout(0)` to match the backward extension, ensuring the DOM has updated before adjusting scroll position.

## File to Modify

- [work-order-schedule/src/app/components/timeline/timeline.component.ts](work-order-schedule/src/app/components/timeline/timeline.component.ts)

## Change

In `scheduleExtendForwardCallback` (around line 534), replace:

```typescript
requestAnimationFrame(() => {
  // ... scroll adjustment and recursive extend logic
});
```

with:

```typescript
setTimeout(() => {
  // ... same scroll adjustment and recursive extend logic
}, 0);
```

This aligns the forward path with the backward path (line 491) and gives Angular and the browser time to update the DOM before computing and setting the scroll position.
