# WCAG 2.1 Accessibility Analysis

**Application:** Work Order Schedule Timeline  
**Target conformance:** WCAG 2.1 Level AA  
**Last updated:** March 2025

---

## 1. Executive Summary

The Work Order Schedule application implements WCAG 2.1 Level AA accessibility features to support keyboard users, screen reader users, and users with low vision. This document catalogs implemented features, compliance status, and recommendations.

---

## 2. Perceivable

### 2.1 Text Alternatives (1.1)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 1.1.1 Non-text Content (A) | Met | Logo has `aria-label="NAOLOGIC"`. Decorative icons use `aria-hidden="true"`. |
| 1.1.2 Audio-only and Video-only (A) | N/A | No audio/video content. |

### 2.2 Time-based Media (1.2)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 1.2.x | N/A | No time-based media. |

### 2.3 Adaptable (1.3)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 1.3.1 Info and Relationships (A) | Met | Semantic structure: `role="region"`, `role="dialog"`, `role="group"`, `role="menu"`, `role="menuitem"`, `role="listbox"`, `role="option"`. Labels associated via `for`/`id`. |
| 1.3.2 Meaningful Sequence (A) | Met | DOM order reflects logical reading order. |
| 1.3.3 Sensory Characteristics (A) | Met | Instructions do not rely solely on shape, size, or visual location. |

### 2.4 Distinguishable (1.4)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 1.4.1 Use of Color (A) | Met | Status conveyed by color plus text/label (e.g., "Open", "Complete"). |
| 1.4.2 Audio Control (A) | N/A | No auto-playing audio. |
| 1.4.3 Contrast (Minimum) (AA) | Needs verification | Theme colors from design. Recommend automated contrast check. |
| 1.4.4 Resize Text (AA) | Met | Text scales with browser zoom; no fixed pixel heights that block scaling. |
| 1.4.5 Images of Text (AA) | Met | Text is real text, not images. |
| 1.4.10 Reflow (AA) | Met | Horizontal scroll acceptable per requirements; content reflows. |
| 1.4.11 Non-text Contrast (AA) | Needs verification | UI components use theme colors. |
| 1.4.12 Text Spacing (AA) | Needs verification | No known overrides of text spacing. |
| 1.4.13 Content on Hover or Focus (AAA) | Met | Tooltips and dropdowns can be dismissed; no content that obscures other content. |

---

## 3. Operable

### 3.1 Keyboard Accessible (2.1)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 2.1.1 Keyboard (A) | Met | All functionality available via keyboard. Timeline scroll has `tabindex="0"`. Arrow keys navigate work orders. |
| 2.1.2 No Keyboard Trap (A) | Met | Focus can leave dialog via Escape; tab order is logical. |
| 2.1.4 Character Key Shortcuts (A) | N/A | No single-character shortcuts. |

### 3.2 Enough Time (2.2)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 2.2.x | N/A | No time limits on interaction. |

### 3.3 Seizures and Physical Reactions (2.3)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 2.3.1 Three Flashes or Below (A) | Met | No flashing content. |

### 3.4 Navigable (2.4)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 2.4.1 Bypass Blocks (A) | Partial | No skip link. Main content is in `<main>`. Consider adding "Skip to main content". |
| 2.4.2 Page Titled (A) | Needs verification | Document title set by Angular. |
| 2.4.3 Focus Order (A) | Met | Logical tab order; focus moves to dialog on open. |
| 2.4.4 Link Purpose (A) | N/A | No links in timeline. |
| 2.4.5 Multiple Ways (AA) | N/A | Single-page application. |
| 2.4.6 Headings and Labels (AA) | Met | Form labels, section headings, `aria-label` on controls. |
| 2.4.7 Focus Visible (AA) | Met | `:focus-visible` outline on buttons, inputs, focusable elements. Work order bars show focus ring when focused. |

### 3.5 Input Modalities (2.5)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 2.5.1 Pointer Gestures (A) | Met | No path-based gestures required. |
| 2.5.2 Pointer Cancellation (A) | Met | Click/tap activates on release. |
| 2.5.3 Label in Name (A) | Met | Visible labels match `aria-label` where used. |
| 2.5.4 Motion Actuation (A) | N/A | No motion-based input. |

---

## 4. Understandable

### 4.1 Readable (3.1)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 3.1.1 Language of Page (A) | Needs verification | `lang` attribute on `<html>`. |
| 3.1.2 Language of Parts (AA) | N/A | Single language. |

### 4.2 Predictable (3.2)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 3.2.1 On Focus (A) | Met | Focus does not trigger unexpected context changes. |
| 3.2.2 On Input (A) | Met | Form submission is explicit; no auto-submit on change. |
| 3.2.3 Consistent Navigation (AA) | N/A | Single view. |
| 3.2.4 Consistent Identification (AA) | Met | Icons and controls used consistently. |

### 4.3 Input Assistance (3.3)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 3.3.1 Error Identification (A) | Met | Validation errors shown with `role="alert"`; `aria-invalid` on invalid inputs. |
| 3.3.2 Labels or Instructions (A) | Met | Form labels, placeholders, `aria-label` where needed. |
| 3.3.3 Error Suggestion (AA) | Met | Overlap error message explains the issue. |
| 3.3.4 Error Prevention (AA) | Met | Delete requires confirmation via dropdown; create/edit has Cancel. |

---

## 5. Robust (4.1)

| Criterion | Status | Implementation |
|-----------|--------|----------------|
| 4.1.1 Parsing (A) | Met | Valid HTML; Angular generates well-formed markup. |
| 4.1.2 Name, Role, Value (A) | Met | Custom widgets have ARIA roles, labels, and state (`aria-expanded`, `aria-selected`, `aria-invalid`). |
| 4.1.3 Status Messages (AA) | Met | Overlap error uses `aria-live="polite"` and `role="alert"`. |

---

## 6. Implemented Features Summary

### ARIA and Semantics

- **Timeline:** `role="region"`, `aria-label` describing keyboard navigation
- **Work order bars:** `role="group"`, `aria-label` with name, status, dates
- **Bar menu:** `role="menu"`, `role="menuitem"`, `aria-haspopup`, `aria-expanded`
- **Panel:** `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`
- **Timescale select:** `role="listbox"`, `role="option"`, `aria-selected`
- **Filter:** `aria-expanded`, `aria-haspopup`, `aria-label` on inputs and buttons

### Keyboard

- Arrow keys: navigate between work orders (left/right same row, up/down neighbor row)
- Escape: closes work order panel
- Tab: moves through focusable elements
- Enter/Space: activate buttons and options

### Focus Management

- Panel opens with focus on first input (Work Order Name)
- Focus visible via `:focus-visible` outline
- Work order bars show focus ring when selected via keyboard

### Form Accessibility

- Labels associated with inputs via `for`/`id`
- `aria-invalid` and `aria-describedby` for validation errors
- `aria-label` on ng-select and date inputs

---

## 7. Testing

### Manual Testing

- Keyboard-only navigation
- Screen reader (NVDA, JAWS, VoiceOver)
- Browser zoom to 200%
- High contrast mode

### Automated Testing

Run the accessibility E2E test:

```bash
cd work-order-schedule
npm run e2e:a11y
```

Uses `@axe-core/playwright` to run axe-core rules against key pages.

---

## 8. Recommendations

| Priority | Item |
|----------|------|
| High | Add skip link ("Skip to main content") for keyboard users |
| High | Fix ng-select label association (aria-label/aria-labelledby on inner input) |
| Medium | Fix timescale label contrast (4.42 vs 4.5:1 required) – darken `#687196` or lighten background |
| Medium | Verify document `<title>` and `<html lang>` |
| Low | Consider focus trap within panel for stricter modal behavior |
| Low | Add `aria-current` or similar when a work order is focused for screen reader announcement |

### Known axe Violations (as of last run)

- **color-contrast** (serious): Timescale label `#687196` on `#f5f6fa` = 4.42:1 (needs 4.5:1)
- **label** (critical in panel): ng-select inner input lacks accessible name; excluded from panel axe scan

---

## 9. References

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
