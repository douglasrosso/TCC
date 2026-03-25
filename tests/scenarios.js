/**
 * Runner de cenarios de teste para comparacao entre tecnicas de regressao visual.
 *
 * Para cada cenario definido, captura uma imagem de referencia (baseline) e
 * uma imagem com mutacao (current), executa os tres comparadores e
 * consolida os resultados em results/scenarios/scenarios-results.json.
 *
 * Uso:  node tests/scenarios.js
 */
import { chromium }      from 'playwright';
import path              from 'node:path';
import fs                from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer }  from 'vite';

import { compare as pixelCompare }  from './comparators/pixel.js';
import { compare as ssimCompare }   from './comparators/ssim.js';
import { compare as regionCompare } from './comparators/region.js';
import { thresholds }               from './config.js';

const __dirname     = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR      = path.resolve(__dirname, '..');
const SCENARIOS_DIR = path.resolve(ROOT_DIR, 'results', 'scenarios');
const PORT          = 3051;

/* ===== Script de congelamento (mesmo do capture.js) ===== */
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

/* ===== Definicao dos cenarios ===== */
const SCENARIOS = [
  {
    id: 'color-subtle',
    name: 'Mudanca sutil de cor',
    page: '/scenario-color',
    freeze: true,
    mutation: {
      type: 'css',
      content: `
        [data-testid="color-card-1"] { background-color: #2563eb !important; border-color: #2563eb !important; }
        [data-testid="color-card-3"] { background-color: #b45309 !important; border-color: #b45309 !important; }
      `,
    },
  },
  {
    id: 'layout-shift',
    name: 'Deslocamento de layout',
    page: '/scenario-layout',
    freeze: true,
    mutation: {
      type: 'css',
      content: `[data-testid="layout-section-1"] { margin-top: 24px !important; }`,
    },
  },
  {
    id: 'typography',
    name: 'Variacao tipografica',
    page: '/scenario-typography',
    freeze: true,
    mutation: {
      type: 'css',
      content: `
        [data-testid="typo-body"]    { letter-spacing: 0.03em !important; }
        [data-testid="typo-detail"]  { letter-spacing: 0.02em !important; }
        [data-testid="typo-caption"] { letter-spacing: 0.015em !important; }
      `,
    },
  },
  {
    id: 'dynamic-content',
    name: 'Conteudo dinamico (sem mascaras)',
    page: '/scenario-dynamic',
    freezeBaseline: true,
    freezeCurrent: false,
    mutation: null,
    masks: [],
  },
  {
    id: 'dynamic-content-masked',
    name: 'Conteudo dinamico (com mascaras)',
    page: '/scenario-dynamic',
    freezeBaseline: true,
    freezeCurrent: false,
    mutation: null,
    masks: [
      { row: 1, col: 2 },
      { row: 2, col: 2 },
      { row: 3, col: 2 },
      { row: 4, col: 2 },
      { row: 5, col: 2 },
      { row: 1, col: 3 },
      { row: 2, col: 3 },
      { row: 3, col: 3 },
      { row: 4, col: 3 },
      { row: 5, col: 3 },
    ],
    reuseCaptures: 'dynamic-content',
  },
  {
    id: 'component-change',
    name: 'Alteracao localizada de componente',
    page: '/scenario-component',
    freeze: true,
    mutation: {
      type: 'script',
      content: `
        (() => {
          const card = document.querySelector('[data-testid="comp-card-3"]');
          if (!card) return;
          const val = card.querySelector('.card-value');
          const lbl = card.querySelector('.card-label');
          if (val) val.textContent = '7.890';
          if (lbl) lbl.textContent = 'Erros';
          card.style.borderColor = '#dc2626';
        })();
      `,
    },
  },
  {
    id: 'opacity',
    name: 'Opacidade e transparencia',
    page: '/scenario-opacity',
    freeze: true,
    mutation: {
      type: 'css',
      content: `
        [data-testid="opacity-card-1"] { opacity: 0.92 !important; }
        [data-testid="opacity-card-3"] { opacity: 0.92 !important; }
        [data-testid="opacity-card-5"] { opacity: 0.92 !important; }
      `,
    },
  },
  {
    id: 'shadow',
    name: 'Sombra e elevacao',
    page: '/scenario-shadow',
    freeze: true,
    mutation: {
      type: 'css',
      content: `
        [data-testid="shadow-card-1"] { box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important; }
        [data-testid="shadow-card-3"] { box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important; }
        [data-testid="shadow-card-5"] { box-shadow: 0 4px 16px rgba(0,0,0,0.15) !important; }
      `,
    },
  },
  {
    id: 'micro-shift',
    name: 'Micro-deslocamento (1px)',
    page: '/scenario-microshift',
    freeze: true,
    mutation: {
      type: 'css',
      content: `[data-testid="micro-section-1"] { margin-top: 1px !important; }`,
    },
  },
  {
    id: 'border-change',
    name: 'Alteracao de borda fina',
    page: '/scenario-border',
    freeze: true,
    mutation: {
      type: 'css',
      content: `
        [data-testid="border-card-2"] { border-color: #dc2626 !important; }
        [data-testid="border-card-5"] { border-color: #3b82f6 !important; }
      `,
    },
  },
  {
    id: 'element-removal',
    name: 'Remocao de elemento',
    page: '/scenario-removal',
    freeze: true,
    mutation: {
      type: 'css',
      content: `[data-testid="removal-card-4"] { display: none !important; }`,
    },
  },
  {
    id: 'font-swap',
    name: 'Troca de familia de fonte',
    page: '/scenario-fontswap',
    freeze: true,
    mutation: {
      type: 'css',
      content: `
        [data-testid="font-body"],
        [data-testid="font-detail"] {
          font-family: 'Georgia', 'Times New Roman', serif !important;
        }
      `,
    },
  },
  {
    id: 'identical',
    name: 'Imagem identica (controle)',
    page: '/scenario-identical',
    freeze: true,
    mutation: null,
  },
];

/* ===== Captura individual de pagina ===== */
async function captureOne(browser, pagePath, outputPath, freeze, mutation) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  const ctx = await browser.newContext({
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });

  const page = await ctx.newPage();
  if (freeze) await page.addInitScript({ content: FREEZE_SCRIPT });

  await page.goto(`http://localhost:${PORT}${pagePath}`, { waitUntil: 'networkidle' });

  // Desativar animacoes
  await page.addStyleTag({
    content: '*, *::before, *::after { animation: none !important; transition: none !important; }',
  });

  // Aplicar mutacao
  if (mutation) {
    if (mutation.type === 'css') {
      await page.addStyleTag({ content: mutation.content });
    } else if (mutation.type === 'script') {
      await page.evaluate(mutation.content);
    }
    await page.waitForTimeout(300);
  }

  await page.waitForTimeout(500);
  await page.screenshot({ path: outputPath, fullPage: false });
  await ctx.close();
}

/* ===== Runner principal ===== */
async function runScenarios() {
  console.log('=== PixelGuard — Cenarios de Teste ===\n');

  // Iniciar servidor Vite
  const vite = await createServer({
    root: ROOT_DIR,
    server: { port: PORT, strictPort: true },
    logLevel: 'silent',
  });
  await vite.listen();

  const browser = await chromium.launch();
  const results = [];

  try {
    for (const scenario of SCENARIOS) {
      console.log(`--- ${scenario.id}: ${scenario.name} ---`);

      const baselinePath = path.join(SCENARIOS_DIR, 'baseline', `${scenario.id}.png`);
      const currentPath  = path.join(SCENARIOS_DIR, 'current',  `${scenario.id}.png`);

      if (scenario.reuseCaptures) {
        // Reutilizar capturas de outro cenario
        const srcBaseline = path.join(SCENARIOS_DIR, 'baseline', `${scenario.reuseCaptures}.png`);
        const srcCurrent  = path.join(SCENARIOS_DIR, 'current',  `${scenario.reuseCaptures}.png`);
        fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
        fs.mkdirSync(path.dirname(currentPath),  { recursive: true });
        fs.copyFileSync(srcBaseline, baselinePath);
        fs.copyFileSync(srcCurrent,  currentPath);
        console.log('  (reutilizando capturas de ' + scenario.reuseCaptures + ')');
      } else {
        // Determinar freeze por captura
        const fb = scenario.freezeBaseline !== undefined ? scenario.freezeBaseline : scenario.freeze;
        const fc = scenario.freezeCurrent  !== undefined ? scenario.freezeCurrent  : scenario.freeze;

        // Capturar baseline (sem mutacao)
        await captureOne(browser, scenario.page, baselinePath, fb, null);
        console.log('  Baseline capturado' + (fb ? ' (freeze)' : ' (sem freeze)'));

        // Capturar current (com mutacao ou variacao natural)
        await captureOne(browser, scenario.page, currentPath, fc, scenario.mutation);
        console.log('  Current capturado' + (scenario.mutation ? ' (com mutacao)' : ' (variacao natural)') + (fc ? ' (freeze)' : ' (sem freeze)'));
      }

      // Executar comparadores
      const diffDir = path.join(SCENARIOS_DIR, 'diffs');
      const masks = scenario.masks || [];

      const [pixel, ssim, region] = await Promise.all([
        pixelCompare(baselinePath, currentPath, {
          ...thresholds.pixel,
          diffPath: path.join(diffDir, 'pixel', `${scenario.id}.png`),
        }),
        ssimCompare(baselinePath, currentPath, {
          ...thresholds.ssim,
          diffPath: path.join(diffDir, 'ssim', `${scenario.id}.png`),
        }),
        regionCompare(baselinePath, currentPath, {
          ...thresholds.region,
          masks,
          diffPath: path.join(diffDir, 'region', `${scenario.id}.png`),
        }),
      ]);

      results.push({
        id: scenario.id,
        name: scenario.name,
        results: { pixel, ssim, region },
      });

      // Exibir resultados
      const tag = (r) => r.passed ? 'PASS' : 'FAIL';
      console.log(`  Pixel:  ${tag(pixel).padEnd(5)} diffPercent=${pixel.diffPercent ?? 'err'}%  score=${pixel.score ?? 'err'}`);
      console.log(`  SSIM:   ${tag(ssim).padEnd(5)} score=${ssim.score ?? 'err'}  diffPercent=${ssim.diffPercent ?? 'err'}%`);
      console.log(`  Region: ${tag(region).padEnd(5)} failed=${region.failedRegions ?? 'err'}/${region.totalRegions ?? 'err'}  masked=${region.maskedRegions ?? 0}`);
      console.log();
    }
  } finally {
    await browser.close();
    await vite.close();
  }

  // Salvar resultados
  const output = {
    timestamp: new Date().toISOString(),
    thresholds,
    scenarios: results,
  };

  fs.mkdirSync(SCENARIOS_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(SCENARIOS_DIR, 'scenarios-results.json'),
    JSON.stringify(output, null, 2),
  );

  // Tabela resumo
  console.log('=== MATRIZ DE COMPARACAO ===');
  console.log(
    'Cenario'.padEnd(42) +
    'Pixel'.padEnd(22) +
    'SSIM'.padEnd(22) +
    'Regioes'.padEnd(22),
  );
  console.log('-'.repeat(108));

  for (const r of results) {
    const p = r.results.pixel;
    const s = r.results.ssim;
    const rg = r.results.region;
    const pStr = `${p.passed ? 'PASS' : 'FAIL'} (${p.diffPercent ?? 'err'}%)`;
    const sStr = `${s.passed ? 'PASS' : 'FAIL'} (${s.score ?? 'err'})`;
    const rgStr = `${rg.passed ? 'PASS' : 'FAIL'} (${rg.failedRegions ?? 'err'}/${rg.totalRegions ?? 'err'})`;
    console.log(
      r.name.padEnd(42) +
      pStr.padEnd(22) +
      sStr.padEnd(22) +
      rgStr.padEnd(22),
    );
  }

  console.log('\nResultados salvos em: results/scenarios/scenarios-results.json');
  return output;
}

/* ===== Execucao direta ===== */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  runScenarios().catch((err) => { console.error(err); process.exit(1); });
}

export { runScenarios };
