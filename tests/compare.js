/**
 * Orquestrador de comparação visual.
 *
 * Para cada imagem em baselines/, localiza a captura correspondente
 * em results/current/ e executa os comparadores configurados.
 *
 * Respeita a opcao `comparators` do pixelguard.config.js.
 *
 * Salva os resultados consolidados em results/results.json.
 *
 * Uso:  node tests/compare.js
 */
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadConfig,
  pixelCompare,
  ssimCompare,
  regionCompare,
} from 'pixelguard';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const BASELINES    = path.resolve(__dirname, '..', 'baselines');
const CURRENT_DIR  = path.resolve(__dirname, '..', 'results', 'current');
const RESULTS_DIR  = path.resolve(__dirname, '..', 'results');

/**
 * Executa a comparação de todas as imagens.
 * @returns {Promise<object>} Resultado consolidado.
 */
export async function runComparisons() {
  const config = await loadConfig();
  const { thresholds, masks } = config;
  const enabledComparators = config.comparators || ['pixel', 'ssim', 'region'];

  const comparatorMap = {
    pixel:  (base, cur, diffPath) => pixelCompare(base, cur, { ...thresholds.pixel, diffPath }),
    ssim:   (base, cur, diffPath) => ssimCompare(base, cur, { ...thresholds.ssim, diffPath }),
    region: (base, cur, diffPath) => regionCompare(base, cur, { ...thresholds.region, masks, diffPath }),
  };

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

    /* Executar os comparadores habilitados */
    const techResults = {};
    const promises = enabledComparators.map(async (tech) => {
      const diffPath = path.join(RESULTS_DIR, 'diffs', tech, file);
      techResults[tech] = await comparatorMap[tech](baselinePath, currentPath, diffPath);
    });
    await Promise.all(promises);

    const anyFailed = Object.values(techResults).some(r => !r.passed);
    if (anyFailed) totalFailed++;

    comparisons.push({ imageName: name, results: techResults });

    /* Resumo no console */
    const tag = (r) => r.passed ? 'OK' : 'FAIL';
    const parts = enabledComparators.map(tech => {
      const r = techResults[tech];
      if (tech === 'pixel')  return `pixel: ${tag(r)} (${r.diffPercent}%)`;
      if (tech === 'ssim')   return `ssim: ${tag(r)} (${r.score})`;
      if (tech === 'region') return `region: ${tag(r)} (${r.failedRegions}/${r.totalRegions} falhas)`;
      return `${tech}: ${tag(r)}`;
    });
    console.log(`    ${parts.join('  ')}`);
  }

  /* Consolidar */
  const summary = {
    totalComparisons: comparisons.length,
    passed: comparisons.length - totalFailed,
    failed: totalFailed,
    techniques: {},
  };

  for (const tech of enabledComparators) {
    summary.techniques[tech] = { passed: 0, failed: 0 };
  }

  for (const c of comparisons) {
    for (const tech of enabledComparators) {
      if (c.results[tech]) {
        c.results[tech].passed ? summary.techniques[tech].passed++ : summary.techniques[tech].failed++;
      }
    }
  }

  const output = {
    mode: 'ci',
    timestamp: new Date().toISOString(),
    comparators: enabledComparators,
    comparisons,
    summary,
  };

  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(path.join(RESULTS_DIR, 'results.json'), JSON.stringify(output, null, 2));

  const techLabels = { pixel: 'Pixel', ssim: 'SSIM', region: 'Region' };
  console.log('\n=== Resumo ===');
  console.log(`  Total: ${summary.totalComparisons}   OK: ${summary.passed}   FAIL: ${summary.failed}`);
  for (const tech of enabledComparators) {
    const t = summary.techniques[tech];
    console.log(`  ${(techLabels[tech] || tech).padEnd(7)}: ${t.passed} OK / ${t.failed} FAIL`);
  }

  return output;
}

/* ===== Execução direta ===== */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  runComparisons()
    .catch((err) => { console.error(err); process.exit(1); });
}
