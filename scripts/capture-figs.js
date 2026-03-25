/**
 * Capture screenshots for the TCC paper figures.
 * Requires: review server running on port 3060
 *           report.html generated in results/
 *           vite dev server on port 5173 (optional, for dashboard)
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const FIGS = path.join(ROOT, 'latex', 'Figs');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 2,
    locale: 'pt-BR',
  });

  // ── 1. Report HTML ──
  console.log('Capturing: 09-report-html.png');
  const reportPage = await context.newPage();
  await reportPage.goto(`file:///${ROOT.replace(/\\/g, '/')}/results/report.html`);
  await reportPage.waitForLoadState('networkidle');
  await reportPage.waitForTimeout(1000);
  await reportPage.screenshot({
    path: path.join(FIGS, '09-report-html.png'),
    fullPage: true,
  });
  await reportPage.close();

  // ── 2. Review UI - overview ──
  console.log('Capturing: 01-review-overview.png');
  const page = await context.newPage();
  await page.goto('http://localhost:3060');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  await page.screenshot({
    path: path.join(FIGS, '01-review-overview.png'),
  });

  // ── 3. Review UI - click first diff item (button element in the diff list) ──
  console.log('Capturing: 02-review-diff-selected.png');
  // DiffListItem is rendered as a <button> with text containing the image name
  const diffButton = page.locator('button').filter({ hasText: /dashboard/i }).first();
  if (await diffButton.count() > 0) {
    await diffButton.click();
    await page.waitForTimeout(2000);
  }
  await page.screenshot({
    path: path.join(FIGS, '02-review-diff-selected.png'),
  });

  // ── 4. Dashboard app ──
  console.log('Capturing: 10-dashboard.png');
  const appPage = await context.newPage();
  try {
    await appPage.goto('http://localhost:5173', { timeout: 5000 });
    await appPage.waitForLoadState('networkidle');
    // Freeze clock/random for deterministic capture
    await appPage.addInitScript(() => {
      const fixed = new Date('2026-03-16T14:00:00-03:00');
      window.Date = class extends Date {
        constructor(...args) { super(...(args.length ? args : [fixed])); }
        static now() { return fixed.getTime(); }
      };
    });
    await appPage.reload();
    await appPage.waitForLoadState('networkidle');
    await appPage.waitForTimeout(2000);
    await appPage.screenshot({
      path: path.join(FIGS, '10-dashboard.png'),
    });
  } catch {
    console.log('  (vite dev server not available, skipping dashboard)');
  }
  await appPage.close();

  await page.close();
  await browser.close();
  console.log(`Done. Screenshots saved to: ${FIGS}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
