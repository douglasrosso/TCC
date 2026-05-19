/**
 * Generate composite images for the 13 scenarios.
 *
 * For each scenario, produces docs/images/scenarios/<id>.png with:
 *   [Baseline] [Atual] [Diff Pixel] [Diff SSIM] [Diff Região]
 * arranged in a single row, with labels and metrics underneath.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCEN_DIR = path.join(ROOT, "results", "scenarios");
const OUT_DIR = path.join(ROOT, "docs", "images", "scenarios");

const data = JSON.parse(
  fs.readFileSync(path.join(SCEN_DIR, "scenarios-results.json"), "utf8"),
);

fs.mkdirSync(OUT_DIR, { recursive: true });

function fileUri(p) {
  // Inline as base64 data URI so the page works regardless of file:// rules.
  if (!fs.existsSync(p)) return "";
  const b64 = fs.readFileSync(p).toString("base64");
  return `data:image/png;base64,${b64}`;
}

function badge(passed, label) {
  const color = passed ? "#16a34a" : "#dc2626";
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:6px;font-size:12px;font-weight:600;">${label}</span>`;
}

function buildHtml(scenario) {
  const baseline = path.join(SCEN_DIR, "baseline", `${scenario.id}.png`);
  const current = path.join(SCEN_DIR, "current", `${scenario.id}.png`);
  const diffs = {
    pixel: path.join(SCEN_DIR, "diffs", "pixel", `${scenario.id}.png`),
    ssim: path.join(SCEN_DIR, "diffs", "ssim", `${scenario.id}.png`),
    region: path.join(SCEN_DIR, "diffs", "region", `${scenario.id}.png`),
  };
  const r = scenario.results;

  const cols = [
    {
      title: "Baseline",
      sub: "imagem de referência",
      src: baseline,
      verdict: "",
    },
    {
      title: "Atual",
      sub: "captura após mutação",
      src: current,
      verdict: "",
    },
    {
      title: "Diff Pixel",
      sub: r.pixel
        ? `${r.pixel.diffPercent.toFixed(3)}% diferentes`
        : "—",
      src: diffs.pixel,
      verdict: r.pixel ? badge(r.pixel.passed, r.pixel.passed ? "PASS" : "FAIL") : "",
    },
    {
      title: "Diff SSIM",
      sub: r.ssim ? `score ${r.ssim.score.toFixed(4)}` : "—",
      src: diffs.ssim,
      verdict: r.ssim ? badge(r.ssim.passed, r.ssim.passed ? "PASS" : "FAIL") : "",
    },
    {
      title: "Diff Região",
      sub: r.region
        ? `${r.region.failedRegions}/${r.region.totalRegions} células`
        : "—",
      src: diffs.region,
      verdict: r.region ? badge(r.region.passed, r.region.passed ? "PASS" : "FAIL") : "",
    },
  ];

  const cells = cols
    .map(
      (c) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:260px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-weight:600;font-size:13px;color:#e5e7eb;">${c.title}</span>
        ${c.verdict}
      </div>
      <div style="font-size:11px;color:#9ca3af;">${c.sub}</div>
      <div style="background:#1f2937;border:1px solid #374151;padding:4px;border-radius:6px;">
        <img src="${fileUri(c.src)}"
             style="width:248px;height:140px;object-fit:contain;background:#0b0f19;display:block;" />
      </div>
    </div>`,
    )
    .join("");

  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { margin:0; padding:24px; background:#0b0f19; font-family:Inter,system-ui,sans-serif; color:#e5e7eb; }
  h1 { margin:0 0 4px; font-size:18px; }
  .meta { color:#9ca3af; font-size:12px; margin-bottom:18px; }
  .row { display:flex; gap:12px; }
</style></head><body>
  <h1>${scenario.name}</h1>
  <div class="meta">id: ${scenario.id} · viewport 1366×768</div>
  <div class="row">${cells}</div>
</body></html>`;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1400, height: 320 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  for (const sc of data.scenarios) {
    const html = buildHtml(sc);
    await page.setContent(html, { waitUntil: "load" });
    // Wait for images to actually load.
    await page.evaluate(() =>
      Promise.all(
        Array.from(document.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = res;
                img.onerror = res;
              }),
        ),
      ),
    );
    await page.waitForTimeout(150);
    const out = path.join(OUT_DIR, `${sc.id}.png`);
    const body = await page.locator("body").boundingBox();
    await page.screenshot({
      path: out,
      clip: { x: 0, y: 0, width: Math.ceil(body.width), height: Math.ceil(body.height) },
    });
    console.log(`saved ${path.relative(ROOT, out)}`);
  }

  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
