const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://www.naologic.com', { waitUntil: 'networkidle' });
  const el = await page.$('a[data-framer-name="Nao-typgraphic-logo-small"]');
  if (el) {
    const style = await el.getAttribute('style');
    const bgMatch = style && style.match(/background-image:\s*url\(["']?(data:image\/svg\+xml,[^"']+)["']?\)/);
    const computed = await el.evaluate((node) => {
      const s = getComputedStyle(node);
      return { color: s.color, backgroundColor: s.backgroundColor };
    });
    if (bgMatch) {
      let dataUri = bgMatch[1].replace(/\\"/g, '"');
      const svgMatch = dataUri.match(/data:image\/svg\+xml,(.+)/);
      if (svgMatch) {
        const decoded = decodeURIComponent(svgMatch[1]);
        const outDir = path.join(__dirname, '..', 'public');
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(path.join(outDir, 'naologic-logo.svg'), decoded);
        fs.writeFileSync(path.join(outDir, 'naologic-logo-styles.json'), JSON.stringify({
          element: { color: computed.color, backgroundColor: computed.backgroundColor },
          dimensions: { width: 114, height: 15 },
        }, null, 2));
        console.log('Saved naologic-logo.svg and naologic-logo-styles.json');
      }
    }
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
