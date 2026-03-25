/**
 * PixelGuard — Comparison Orchestrator
 *
 * For each .png in baselines/, finds the matching file in results/current/
 * and runs all 3 comparators (pixel, SSIM, region).
 * Saves consolidated results to results/results.json.
 */
import fs   from 'node:fs';
import path from 'node:path';

import { compare as pixelCompare }  from './comparators/pixel.js';
import { compare as ssimCompare }   from './comparators/ssim.js';
import { compare as regionCompare } from './comparators/region.js';
import { loadConfig } from './config.js';

/**
 * Run all comparisons.
 *
 * @param {object} [options]
 * @param {object} [options.config]  Pre-loaded config.
 * @returns {Promise<object>} Consolidated results.
 */
export async function runComparisons(options = {}) {
  const config = options.config || await loadConfig();
  const BASELINES   = config.baselinesDir;
  const CURRENT_DIR = path.join(config.resultsDir, 'current');
  const RESULTS_DIR = config.resultsDir;
  const { thresholds, masks } = config;

  const baselineFiles = fs.existsSync(BASELINES)
    ? fs.readdirSync(BASELINES).filter((f) => f.endsWith('.png'))
    : [];

  if (baselineFiles.length === 0) {
    console.log('Nenhuma baseline encontrada em ' + BASELINES);
    console.log('Execute:  npx pixelguard capture && npx pixelguard update-baselines');
    process.exit(0);
  }

  if (!fs.existsSync(CURRENT_DIR)) {
    console.error('Pasta ' + CURRENT_DIR + ' nao encontrada. Execute:  npx pixelguard capture');
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

    const diffPixel  = path.join(RESULTS_DIR, 'diffs', 'pixel',  file);
    const diffSSIM   = path.join(RESULTS_DIR, 'diffs', 'ssim',   file);
    const diffRegion = path.join(RESULTS_DIR, 'diffs', 'region', file);

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

    const tag = (r) => r.passed ? 'OK' : 'FAIL';
    console.log(
      `    pixel: ${tag(pixel)} (${pixel.diffPercent}%)  ` +
      `ssim: ${tag(ssim)} (${ssim.score})  ` +
      `region: ${tag(region)} (${region.failedRegions}/${region.totalRegions} falhas)`,
    );
  }

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
