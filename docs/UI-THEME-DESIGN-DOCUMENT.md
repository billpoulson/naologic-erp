# Work Order Schedule — UI Theme Design Document

**Source:** [Sketch Design](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667)  
**Document:** FE Take-Home Challenge  
**Captured:** March 2025

---

## 1. Overview

The Work Order Schedule UI uses a light, minimal theme focused on clarity and usability. It is suitable for business and scheduling tools, with clear hierarchy and consistent interaction patterns.

---

## 2. Color Palette

### 2.1 Backgrounds

| Token | Value | Usage |
|-------|-------|--------|
| `background-primary` | `#FFFFFF` | Main content areas, modals, form panels |
| `background-secondary` | `~#F9F9FB` | Alternate row backgrounds, subtle sections |
| `background-hover` | `~#E0E7F5` / `~#F0F3F7` | Hover and selection highlights |
| `background-canvas` | `~#282a2e` | Dark mode / loading canvas (optional) |

### 2.2 Text

| Token | Value | Usage |
|-------|-------|--------|
| `text-primary` | `#333333` – `#000000` | Headings, labels, main content |
| `text-secondary` | `~#888888` – `#AAAAAA` | Placeholders, hints, metadata |
| `text-interactive` | `~#2196F3` / `~#3F51B5` | Links, active states, CTAs |

### 2.3 Accent & Status

| Token | Value | Usage |
|-------|-------|--------|
| `accent-primary` | `~#2196F3` / `~#3F51B5` | Primary buttons, focus, selected states |
| `status-open` | Blue | Open / New status |
| `status-in-progress` | `~#FFC107` / `~#FF9800` | In progress |
| `status-blocked` | `~#F44336` | Blocked / critical |
| `status-complete` | `~#4CAF50` | Complete / done |
| `status-plan` | Purple | Plan status |
| `status-canceled` | Red | Canceled |

### 2.4 Borders & Dividers

| Token | Value | Usage |
|-------|-------|--------|
| `border-default` | `~#DEDEDE` – `#EEEEEE` | Input borders, grid lines |
| `border-focus` | Primary blue | Focused inputs |

---

## 3. Typography

### 3.1 Font Family

- Sans-serif (e.g. Inter, Roboto, Helvetica Neue, Arial)
- Single family for consistency

### 3.2 Weights

| Weight | Usage |
|--------|--------|
| Regular (400) | Body text, input values |
| Medium / Semi-bold (500–600) | Table headers, labels |
| Bold (700) | Section titles, CTAs |

### 3.3 Hierarchy

- **Headings:** Larger size, bold
- **Labels:** Regular, slightly smaller than headings
- **Body:** Regular, standard size
- **Placeholders:** Lighter gray, optional italic

---

## 4. Layout & Spacing

### 4.1 Canvas

| Property | Value |
|----------|--------|
| Artboard | Desktop HD |
| Width | 1,440px |
| Height | 1,024px |

### 4.2 Structure

- **Left panel:** Work Orders list, filters, navigation
- **Main area:** Schedule grid / calendar
- **Right panel:** Work Order Details modal/sidebar

### 4.3 Spacing

- Consistent padding and margins
- Clear spacing between form fields
- Grid-based alignment for tables and forms

---

## 5. Components

### 5.1 Buttons

| Type | Style |
|------|--------|
| Primary | Solid primary blue, white text, ~4px radius |
| Secondary | White bg, primary blue or dark gray text, light gray border |
| Icon | Minimal, icon-only (add, edit, delete, options) |

### 5.2 Inputs

| Property | Value |
|----------|--------|
| Background | White |
| Border | Light gray |
| Border (focus) | Primary blue |
| Placeholder | Medium gray |

### 5.3 Dropdowns

- Right-aligned caret
- Options with status pills (colored dots)
- Selected option highlighted (primary blue)

### 5.4 Status Pills / Badges

- Small rounded rectangles
- Colored backgrounds (green, orange, red, blue, purple)
- White or dark text for contrast

### 5.5 Modals / Side Panels

- White background
- Title, form fields, actions
- Primary “Save”, secondary “Cancel”
- Close (X) in top-right

---

## 6. Page URLs & Page-by-Page Summary

| # | Page | URL |
|---|------|-----|
| 1 | Work Order Schedule — Default | [f/387C1050](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667/f/387C1050-210D-4B00-9B6F-4E17B6A2D6FD) |
| 2 | Work Order Schedule — View Selection | [f/93E644CB](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667/f/93E644CB-0D4B-4045-BA6D-4E92E9DD5FCD) |
| 3 | Work Order Schedule — Options CTA (on hover) | [f/817683A1](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667/f/817683A1-3684-4282-B70B-0A95B913695F) |
| 4 | Work Order Schedule — Edit and Delete Expanded | [f/F0742D25](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667/f/F0742D25-10F4-4E62-8542-BF34A0682FE8) |
| 5 | Create New Event — With Selection | [f/653A18EF](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667/f/653A18EF-07CE-43C4-92FE-6D66E5DE94F1) |
| 6 | Create New Event — Placeholder and Defaults | [f/2D5BC7EB](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667/f/2D5BC7EB-3797-48AE-A19A-C928240ECDC5) |
| 7 | Create New Event — Active Text Field | [f/31A78850](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667/f/31A78850-5719-48EC-A22E-F938D3EC35C0) |
| 8 | Create New Event — Status Dropdown | [f/78F5C572](https://www.sketch.com/s/d56a77de-9753-45a8-af7a-d93a42276667/f/78F5C572-8FD5-43FE-A23F-3746B1F02F04) |

### 6.1 Work Order Schedule — Default

- **Layout:** NAOLOGIC logo (blue) top-left, "Work Orders" title, Timescale dropdown (Month selected). **Left panel:** Work Center list (Genesis Hardware, Rodriques Electrics, Konsulting Inc, McMarrow Distribution, Spartan Manufacturing). **Main:** Gantt-style timeline (Aug 2024–Mar 2025), colored bars by status. **Status colors:** Current month (light blue/green), Complete (green), In progress (light purple), Blocked (yellow/orange). **Interaction:** "Click to add dates" tooltip on hover

### 6.2 Work Order Schedule — View Selection

- Same as default
- Selected event: lighter background and border

### 6.3 Work Order Schedule — Options CTA (on hover)

- Ellipsis (⋮) on event block on hover
- Access to more actions

### 6.4 Work Order Schedule — Edit and Delete Expanded

- Ellipsis opens menu
- “Edit” (pencil) and “Delete” (trash)
- Delete can use red accent

### 6.5 Create New Event — With Selection

- Work Order Details modal open
- Pre-filled fields for editing
- Fields: Work Order Type, Date, Time, Status, Description, Address, Contact Person, Phone, Email

### 6.6 Create New Event — Placeholder and Defaults

- Empty form for new event
- Placeholders: “Select Work Order Type…”, “Select Date”, “Select Time”, “Select Status…”, “Enter description”

### 6.7 Create New Event — Active Text Field

- Description field focused
- Blue border on active field
- User input visible (e.g. “Repair leaking faucet…”)

### 6.8 Create New Event — Status Dropdown

- Status dropdown open
- Options: New (blue), Plan (purple), In Progress (orange), Done (green), Canceled (red)
- Selected option highlighted

---

## 7. Interaction Patterns

- **Contextual actions:** Edit/Delete on hover or selection
- **Side panel:** Details and forms in right panel
- **State feedback:** Color, border, and icon changes for active/selected/focus

---

## 8. Design System Components (from Sketch)

- `Buttons/Alt/Dropdown`
- `Controls/Text Field/Dropdown`
- `Controls/Label/5`
- `Dropdown/Simple Copy`
- `2d/Line/Calendar`

---

## 9. Iconography

- Outline-style icons
- Monochrome (dark gray or primary blue)
- Used for: search, edit, delete, calendar, dropdown caret, add

---

## 10. CSS Variables (Suggested)

```css
:root {
  /* Backgrounds */
  --color-bg-primary: #FFFFFF;
  --color-bg-secondary: #F9F9FB;
  --color-bg-hover: #E0E7F5;

  /* Text */
  --color-text-primary: #333333;
  --color-text-secondary: #888888;
  --color-text-interactive: #2196F3;

  /* Accent */
  --color-accent-primary: #2196F3;

  /* Status */
  --color-status-open: #2196F3;
  --color-status-in-progress: #FF9800;
  --color-status-blocked: #F44336;
  --color-status-complete: #4CAF50;

  /* Borders */
  --color-border: #E0E0E0;
  --color-border-focus: #2196F3;

  /* Layout */
  --layout-width-max: 1440px;
  --layout-height-canvas: 1024px;
  --radius-default: 4px;
}
```

---

**Related:** [Logo Extraction](LOGO-EXTRACTION.md) — How the NAOLOGIC logo was obtained from the official website.

*Document generated from Sketch design inspection. Exact hex values should be confirmed from the source file or design tokens export.*
