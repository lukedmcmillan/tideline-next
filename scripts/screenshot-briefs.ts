// scripts/screenshot-briefs.ts
// Run: npx tsx scripts/screenshot-briefs.ts
import { chromium } from 'playwright';
import * as path from 'path';
import * as os from 'os';

const BASE = 'http://localhost:7788';
const OUT  = path.join(os.tmpdir());

const jobs = [
  { file: 'brief-test-a.html', label: 'A' },
  { file: 'brief-test-b.html', label: 'B' },
  { file: 'brief-test-c.html', label: 'C' },
];
const widths = [380, 768];

(async () => {
  const browser = await chromium.launch();
  for (const j of jobs) {
    for (const w of widths) {
      const page = await browser.newPage();
      await page.setViewportSize({ width: w, height: 900 });
      await page.goto(`${BASE}/${j.file}`, { waitUntil: 'networkidle' });
      const out = path.join(OUT, `brief-${j.label.toLowerCase()}-${w}.png`);
      await page.screenshot({ path: out, fullPage: true });
      console.log(`Saved: ${out}`);
      await page.close();
    }
  }
  await browser.close();
})();
