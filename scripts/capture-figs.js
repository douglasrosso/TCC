/**
 * Capture screenshots for the TCC paper figures.
 *
 * Generates only the figures referenced in latex/TCCFinal.tex:
 *   - Figs/03-diff-pixel.png  (~20 KB,  689x447)
 *   - Figs/04-diff-ssim.png   (~5 KB,   689x447)
 *   - Figs/05-diff-region.png (~37 KB,  689x447)
 *
 * Each capture contains only the "Diff [Technique]" card (label + image),
 * cropped tightly to avoid wasting space in the article.
 *
 * Requires: review server running on http://localhost:8080.
 */
import { chromium } from "playwright";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FIGS = path.join(ROOT, "latex", "Figs");

const SCENARIO_REGEX = /Mudanca sutil de cor|Mudança sutil de cor/i;

const TECHNIQUE_CAPTURES = [
  { tech: "pixel",  file: "03-diff-pixel.png",  label: "Diff Pixel"  },
  { tech: "ssim",   file: "04-diff-ssim.png",   label: "Diff SSIM"   },
  { tech: "region", file: "05-diff-region.png", label: "Diff Região" },
];

async function captureDiffCard(page, label, target) {
  const handle = await page.evaluateHandle((wantedAlt) => {
    const img = Array.from(document.querySelectorAll("img"))
      .find((i) => (i.alt || "").toLowerCase() === wantedAlt.toLowerCase());
    if (!img) return null;
    let card = img.parentElement;
    while (
      card &&
      !card.textContent.trim().toLowerCase().startsWith(wantedAlt.toLowerCase())
    ) {
      card = card.parentElement;
    }
    if (!card) card = img.parentElement;
    card.scrollIntoView({ block: "center", behavior: "instant" });
    return card;
  }, label);

  await page.waitForTimeout(400);
  const elem = handle.asElement();
  if (!elem) throw new Error(`Could not locate diff card for '${label}'.`);
  await elem.screenshot({ path: target });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    locale: "pt-BR",
  });

  const page = await context.newPage();
  await page.goto("http://localhost:8080");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1500);

  // Open the Test Runs drawer and select the "Cenários de Teste" run.
  const testRunsBtn = page
    .getByRole("button", { name: /Test Runs/i })
    .first();
  if ((await testRunsBtn.count()) > 0) {
    await testRunsBtn.click();
    await page.waitForTimeout(600);
  }
  const scenariosRun = page
    .locator("button")
    .filter({ hasText: /Cenários de Teste/i })
    .first();
  if ((await scenariosRun.count()) === 0) {
    throw new Error("Test run 'Cenários de Teste' not found.");
  }
  await scenariosRun.click();
  await page.waitForTimeout(800);

  // Pick the scenario where all three techniques produce a visible diff.
  const scenarioItem = page
    .locator("button")
    .filter({ hasText: SCENARIO_REGEX })
    .first();
  if ((await scenarioItem.count()) === 0) {
    throw new Error("Scenario 'Mudança sutil de cor' not found.");
  }
  await scenarioItem.click({ force: true });
  await page.waitForTimeout(1500);

  // Close the drawer so it does not overlap the diff content.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  for (const { tech, file, label } of TECHNIQUE_CAPTURES) {
    const btn = page.locator(`button[data-technique='${tech}']`).first();
    if ((await btn.count()) === 0) {
      throw new Error(`Technique button not found for '${tech}'.`);
    }
    await btn.click();
    await page.waitForTimeout(900);
    await captureDiffCard(page, label, path.join(FIGS, file));
    console.log(`saved ${file}`);
  }

  await page.close();
  await browser.close();
  console.log(`Done. Screenshots saved to: ${FIGS}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
