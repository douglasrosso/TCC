/**
 * Orquestrador de comparação visual.
 *
 * Para cada imagem em baselines/, localiza a captura correspondente
 * em results/current/ e executa os três comparadores:
 *   1. Pixel a pixel
 *   2. SSIM (perceptual)
 *   3. Regiões com máscaras
 *
 * Salva os resultados consolidados em results/results.json.
 *
 * Uso:  node tests/compare.js
 */
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { compare as pixelCompare }  from './comparators/pixel.js';
import { compare as ssimCompare }   from './comparators/ssim.js';
import { compare as regionCompare } from './comparators/region.js';
import { thresholds, masks }        from './config.js';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const BASELINES    = path.resolve(__dirname, '..', 'baselines');
const CURRENT_DIR  = path.resolve(__dirname, '..', 'results', 'current');
const RESULTS_DIR  = path.resolve(__dirname, '..', 'results');

/**
 * Executa a comparação de todas as imagens.
 * @returns {Promise<object>} Resultado consolidado.
 */
export async function runComparisons() {
  /* Verificar se há baselines */
  const baselineFiles = fs.existsSync(BASELINES)
    ? fs.readdirSync(BASELINES).filter((f) => f.endsWith('.png'))
    : [];

  if (baselineFiles.length === 0) {
    console.log('Nenhuma baseline encontrada em baselines/.');
    console.log('Execute:  npm run capture && npm run update-baselines');
    process.exit(0);
  }

  /* Verificar se há capturas atuais */
  if (!fs.existsSync(CURRENT_DIR)) {
    console.error('Pasta results/current/ nao encontrada. Execute:  npm run capture');
    process.exit(1);
  }

  const comparisons = [];
  let totalFailed   = 0;

  for (const file of baselineFiles) {
    const baselinePath = path.join(BASELINES, file);
    const currentPath  = path.join(CURRENT_DIR, file);

    if (!fs.existsSync(currentPath)) {
      console.warn(`  SKIP  ${file} (captura atual ausente)`);
      continue;
    }

    const name = file.replace('.png', '');
    console.log(`  Comparando: ${name}`);

    /* Caminhos das imagens de diff */
    const diffPixel  = path.join(RESULTS_DIR, 'diffs', 'pixel',  file);
    const diffSSIM   = path.join(RESULTS_DIR, 'diffs', 'ssim',   file);
    const diffRegion = path.join(RESULTS_DIR, 'diffs', 'region', file);

    /* Executar os três comparadores */
    const [pixel, ssim, region] = await Promise.all([
      pixelCompare(baselinePath, currentPath, {
        ...thresholds.pixel,
        diffPath: diffPixel,
      }),
      ssimCompare(baselinePath, currentPath, {
        ...thresholds.ssim,
        diffPath: diffSSIM,
      }),
      regionCompare(baselinePath, currentPath, {
        ...thresholds.region,
        masks,
        diffPath: diffRegion,
      }),
    ]);

    const anyFailed = !pixel.passed || !ssim.passed || !region.passed;
    if (anyFailed) totalFailed++;

    comparisons.push({ imageName: name, results: { pixel, ssim, region } });

    /* Resumo no console */
    const tag = (r) => r.passed ? 'OK' : 'FAIL';
    console.log(
      `    pixel: ${tag(pixel)} (${pixel.diffPercent}%)  ` +
      `ssim: ${tag(ssim)} (${ssim.score})  ` +
      `region: ${tag(region)} (${region.failedRegions}/${region.totalRegions} falhas)`,
    );
  }

  /* Consolidar */
  const summary = {
    totalComparisons: comparisons.length,
    passed: comparisons.length - totalFailed,
    failed: totalFailed,
    techniques: {
      pixel:  { passed: 0, failed: 0 },
      ssim:   { passed: 0, failed: 0 },
      region: { passed: 0, failed: 0 },
    },
  };

  for (const c of comparisons) {
    for (const t of ['pixel', 'ssim', 'region']) {
      c.results[t].passed ? summary.techniques[t].passed++ : summary.techniques[t].failed++;
    }
  }

  const output = {
    mode: 'ci',
    timestamp: new Date().toISOString(),
    comparisons,
    summary,
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(RESULTS_DIR, 'results.json'), JSON.stringify(output, null, 2));

  console.log('\n=== Resumo ===');
  console.log(`  Total: ${summary.totalComparisons}   OK: ${summary.passed}   FAIL: ${summary.failed}`);
  console.log(`  Pixel : ${summary.techniques.pixel.passed} OK / ${summary.techniques.pixel.failed} FAIL`);
  console.log(`  SSIM  : ${summary.techniques.ssim.passed} OK / ${summary.techniques.ssim.failed} FAIL`);
  console.log(`  Region: ${summary.techniques.region.passed} OK / ${summary.techniques.region.failed} FAIL`);

  return output;
}

/* ===== Execução direta ===== */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  runComparisons()
    .catch((err) => { console.error(err); process.exit(1); });
}
