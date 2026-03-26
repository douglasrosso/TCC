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
  const enabledComparators = config.comparators || ['pixel', 'ssim', 'region'];
  const usePixel  = enabledComparators.includes('pixel');
  const useSSIM   = enabledComparators.includes('ssim');
  const useRegion = enabledComparators.includes('region');

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

    const promises = [];
    const labels   = [];

    if (usePixel) {
      const diffPixel = path.join(RESULTS_DIR, 'diffs', 'pixel', file);
      promises.push(pixelCompare(baselinePath, currentPath, { ...thresholds.pixel, diffPath: diffPixel }));
      labels.push('pixel');
    }
    if (useSSIM) {
      const diffSSIM = path.join(RESULTS_DIR, 'diffs', 'ssim', file);
      promises.push(ssimCompare(baselinePath, currentPath, { ...thresholds.ssim, diffPath: diffSSIM }));
      labels.push('ssim');
    }
    if (useRegion) {
      const diffRegion = path.join(RESULTS_DIR, 'diffs', 'region', file);
      promises.push(regionCompare(baselinePath, currentPath, { ...thresholds.region, masks, diffPath: diffRegion }));
      labels.push('region');
    }

    const settled = await Promise.all(promises);
    const results = {};
    labels.forEach((l, i) => { results[l] = settled[i]; });

    const anyFailed = Object.values(results).some((r) => !r.passed);
    if (anyFailed) totalFailed++;

    comparisons.push({ imageName: name, results });

    const tag = (r) => r.passed ? 'OK' : 'FAIL';
    const parts = [];
    if (results.pixel)  parts.push(`pixel: ${tag(results.pixel)} (${results.pixel.diffPercent}%)`);
    if (results.ssim)   parts.push(`ssim: ${tag(results.ssim)} (${results.ssim.score})`);
    if (results.region) parts.push(`region: ${tag(results.region)} (${results.region.failedRegions}/${results.region.totalRegions} falhas)`);
    console.log(`    ${parts.join('  ')}`);
  }

  const summary = {
    totalComparisons: comparisons.length,
    passed: comparisons.length - totalFailed,
    failed: totalFailed,
    techniques: {},
  };

  for (const t of enabledComparators) {
    summary.techniques[t] = { passed: 0, failed: 0 };
  }

  for (const c of comparisons) {
    for (const t of enabledComparators) {
      if (c.results[t]) {
        c.results[t].passed ? summary.techniques[t].passed++ : summary.techniques[t].failed++;
      }
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
  for (const t of enabledComparators) {
    const s = summary.techniques[t];
    console.log(`  ${t.padEnd(6)}: ${s.passed} OK / ${s.failed} FAIL`);
  }

  return output;
}
