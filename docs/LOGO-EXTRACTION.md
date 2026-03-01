# Naologic Logo Extraction

This document describes how the Naologic logo was obtained for use in this project.

## Source

The logo is extracted from the official Naologic website (https://www.naologic.com). It appears in the header as a link to the homepage.

## DOM Location

- **Selector:** `a[data-framer-name="Nao-typgraphic-logo-small"]`
- **Position:** Top-left of the header (approx. top: 23px, left: 80px)
- **Dimensions:** 114×15 px

The logo is rendered as an inline SVG embedded in a `background-image` CSS property (data URI format).

## Extraction Method

1. **Tool:** Playwright (headless Chromium) to load the live page and access the DOM

2. **Process:**
   - Navigate to https://www.naologic.com
   - Wait for the page to load (`networkidle`)
   - Find the logo element by its `data-framer-name` attribute
   - Read the `style` attribute to get the `background-image` URL
   - The URL is a data URI: `data:image/svg+xml,<encoded SVG>`
   - Decode the URI and save the SVG markup
   - Capture computed styles (color, background-color) for reference

3. **Script:** `scripts/extract-logo.js`

## Usage

To re-extract the logo (e.g., if the website updates):

```bash
npm install
npx playwright install chromium
node scripts/extract-logo.js
```

This outputs:
- `public/naologic-logo.svg` — the SVG markup
- `public/naologic-logo-styles.json` — element styles and dimensions

## Output Files

| File | Description |
|------|-------------|
| `public/naologic-logo.svg` | SVG logo with fill `rgb(62, 64, 219)` (#3E40DB) |
| `public/naologic-logo-styles.json` | Element styles, SVG fill color, and dimensions |

## Brand Usage

Naologic’s brand assets (including logos) are subject to their Usage Agreement. The logo should not be altered. For official brand assets and media kit, see https://naologic.com/media/media-kit (may require authentication).
