/**
 * PixelGuard — Screenshot Capture
 *
 * Launches a browser via Playwright and captures screenshots for all
 * page × viewport combinations defined in the config.
 *
 * Supports two modes:
 *   1. Auto-start a Vite dev server (baseUrl is null)
 *   2. Use an already-running server (baseUrl is set)
 */
import path from 'node:path';
import fs   from 'node:fs';
import { loadConfig } from './config.js';

const FREEZE_SCRIPT = `
  (() => {
    const FIXED = new Date('2025-06-15T10:00:00');
    const _Date = Date;
    class FrozenDate extends _Date {
      constructor(...a) { super(...(a.length ? a : [FIXED])); }
      static now() { return FIXED.getTime(); }
    }
    window.Date = FrozenDate;

    let seed = 42;
    Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  })();
`;

/**
 * Capture screenshots.
 *
 * @param {object}  [options]
 * @param {string}  [options.outDir]    Override output directory.
 * @param {object}  [options.mutation]  Mutation to inject ({ type, content }).
 * @param {boolean} [options.freeze]    Override freeze setting.
 * @param {object}  [options.config]    Pre-loaded config (skips loading).
 * @returns {Promise<string[]>} Paths of captured screenshots.
 */
export async function capture(options = {}) {
  const config = options.config || await loadConfig();
  const outputDir = options.outDir || path.join(config.resultsDir, 'current');
  const freeze = options.freeze ?? config.freeze;
  const mutation = options.mutation || null;

  fs.mkdirSync(outputDir, { recursive: true });

  let vite = null;
  let serverUrl = config.baseUrl;

  // Auto-start Vite if no baseUrl
  if (!serverUrl) {
    const { createServer } = await import('vite');
    vite = await createServer({
      root: process.cwd(),
      server: { port: config.port, strictPort: true },
      logLevel: 'silent',
    });
    await vite.listen();
    serverUrl = `http://localhost:${config.port}`;
  }

  const { chromium } = await import('playwright');
  const browser = await chromium.launch();
  const paths   = [];

  try {
    for (const pg of config.pages) {
      for (const vp of config.viewports) {
        const ctx = await browser.newContext({
          viewport:          { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
          locale:            'pt-BR',
          timezoneId:        'America/Sao_Paulo',
        });

        const page = await ctx.newPage();

        if (freeze) await page.addInitScript({ content: FREEZE_SCRIPT });

        await page.goto(`${serverUrl}${pg.path}`, { waitUntil: 'networkidle' });

        // Disable animations
        await page.addStyleTag({
          content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
        });

        // Inject mutation if provided
        if (mutation) {
          if (mutation.type === 'css') {
            await page.addStyleTag({ content: mutation.content });
          } else if (mutation.type === 'script') {
            await page.evaluate(mutation.content);
          }
          await page.waitForTimeout(300);
        }

        await page.waitForTimeout(500);

        const filename = `${pg.name}-${vp.name}-${vp.width}w.png`;
        const filePath = path.join(outputDir, filename);
        await page.screenshot({ path: filePath, fullPage: true });
        paths.push(filePath);

        await ctx.close();
      }
    }
  } finally {
    await browser.close();
    if (vite) await vite.close();
  }

  return paths;
}

/* ===== Direct execution ===== */
const isMain = process.argv[1] && path.resolve(process.argv[1]) === import.meta.filename;
if (isMain) {
  const outIdx = process.argv.indexOf('--out');
  const outDir = outIdx !== -1 ? process.argv[outIdx + 1] : undefined;

  capture({ outDir })
    .then((files) => {
      console.log(`Capturas concluidas (${files.length} imagens):`);
      files.forEach((f) => console.log('  ' + path.basename(f)));
    })
    .catch((err) => { console.error(err); process.exit(1); });
}
