/**
 * Captura screenshots da aplicação em todos os viewports configurados.
 *
 * Uso:
 *   node tests/capture.js                   → salva em results/current/
 *   node tests/capture.js --out <dir>       → salva em <dir>
 *
 * O relógio e Math.random são congelados para garantir determinismo.
 */
import { chromium }    from 'playwright';
import path            from 'node:path';
import fs              from 'node:fs';
import { fileURLToPath } from 'node:url';
import { startServer } from './server.js';
import { viewports, pages } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR   = path.resolve(__dirname, '..', 'app');
const PORT      = 3050;

/**
 * Script injetado antes de cada página para congelar Date e Math.random.
 * Garante que capturas sucessivas produzam conteúdo idêntico.
 */
const FREEZE_SCRIPT = `
  (() => {
    const FIXED = new Date('2025-06-15T10:00:00');
    const _Date = Date;
    class FrozenDate extends _Date {
      constructor(...a) { super(...(a.length ? a : [FIXED])); }
      static now() { return FIXED.getTime(); }
    }
    window.Date = FrozenDate;

    // PRNG determinístico (seed 42)
    let seed = 42;
    Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  })();
`;

/**
 * Captura screenshots.
 * @param {object}  [options]
 * @param {string}  [options.outDir]    Pasta de saída (padrão: results/current).
 * @param {object}  [options.mutation]  Mutação a injetar ({ type, content }).
 * @param {boolean} [options.freeze]    Congelar Date/random (padrão: true).
 * @returns {Promise<string[]>} Lista de caminhos dos screenshots gerados.
 */
export async function capture({ outDir, mutation, freeze = true } = {}) {
  const outputDir = outDir || path.resolve(__dirname, '..', 'results', 'current');
  fs.mkdirSync(outputDir, { recursive: true });

  const server  = await startServer(APP_DIR, PORT);
  const browser = await chromium.launch();
  const paths   = [];

  try {
    for (const pg of pages) {
      for (const vp of viewports) {
        const ctx = await browser.newContext({
          viewport:          { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
          locale:            'pt-BR',
          timezoneId:        'America/Sao_Paulo',
        });

        const page = await ctx.newPage();

        // Congelar Date/random ANTES de navegar
        if (freeze) await page.addInitScript({ content: FREEZE_SCRIPT });

        // Desativar animações/transições
        await page.addStyleTag({
          content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
        });

        await page.goto(`http://localhost:${PORT}${pg.path}`, { waitUntil: 'networkidle' });

        // Injetar mutação, se houver
        if (mutation) {
          if (mutation.type === 'css') {
            await page.addStyleTag({ content: mutation.content });
          } else if (mutation.type === 'script') {
            await page.evaluate(mutation.content);
          }
          await page.waitForTimeout(200);
        }

        const filename = `${pg.name}-${vp.name}-${vp.width}w.png`;
        const filePath = path.join(outputDir, filename);
        await page.screenshot({ path: filePath, fullPage: true });
        paths.push(filePath);

        await ctx.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }

  return paths;
}

/* ===== Execução direta ===== */
const running = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (running) {
  const outIdx = process.argv.indexOf('--out');
  const outDir = outIdx !== -1 ? process.argv[outIdx + 1] : undefined;

  capture({ outDir })
    .then((files) => {
      console.log(`Capturas concluidas (${files.length} imagens):`);
      files.forEach((f) => console.log('  ' + path.basename(f)));
    })
    .catch((err) => { console.error(err); process.exit(1); });
}
