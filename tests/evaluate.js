/**
 * Avaliação completa para o TCC.
 *
 * Fluxo:
 *   1. Captura baselines limpas (sem mutação).
 *   2. Para cada mutação definida em config.js, captura e compara
 *      com as baselines usando os três comparadores.
 *      → Detecção esperada = true (TP se detectou, FN se não).
 *   3. Captura novamente sem mutação e compara com as baselines.
 *      → Detecção esperada = false (FP se detectou, TN se não).
 *   4. Repete N vezes para medir estabilidade.
 *   5. Consolida métricas (TP, FP, TN, FN, precisão, recall, F1, tempo).
 *   6. Salva resultados em results/evaluation/metrics.json.
 *
 * Uso:  node tests/evaluate.js [--runs N]
 */
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { capture }                  from './capture.js';
import { compare as pixelCompare }  from './comparators/pixel.js';
import { compare as ssimCompare }   from './comparators/ssim.js';
import { compare as regionCompare } from './comparators/region.js';
import { mutations, thresholds, masks, viewports, pages } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EVAL_DIR  = path.resolve(__dirname, '..', 'results', 'evaluation');

/* ===== Helpers ===== */

/** Executa os três comparadores e devolve resultados. */
async function runComparators(baselinePath, currentPath, label) {
  const mkDiff = (tech) => path.join(EVAL_DIR, 'diffs', tech, label + '.png');

  const [pixel, ssim, region] = await Promise.all([
    pixelCompare(baselinePath, currentPath, { ...thresholds.pixel,  diffPath: mkDiff('pixel')  }),
    ssimCompare(baselinePath, currentPath,  { ...thresholds.ssim,   diffPath: mkDiff('ssim')   }),
    regionCompare(baselinePath, currentPath,{ ...thresholds.region, masks, diffPath: mkDiff('region') }),
  ]);

  return { pixel, ssim, region };
}

/** Monta nome de arquivo de captura. */
function imgName(pageName, vp) {
  return `${pageName}-${vp.name}-${vp.width}w`;
}

/* ===== Avaliação principal ===== */

async function evaluate(stabilityRuns = 3) {
  fs.mkdirSync(EVAL_DIR, { recursive: true });

  const metrics = {
    pixel:  { tp: 0, fp: 0, tn: 0, fn: 0, totalMs: 0, runs: 0 },
    ssim:   { tp: 0, fp: 0, tn: 0, fn: 0, totalMs: 0, runs: 0 },
    region: { tp: 0, fp: 0, tn: 0, fn: 0, totalMs: 0, runs: 0 },
  };

  const details = [];   // registros individuais

  /* ---------- 1. Capturar baselines limpas ---------- */
  console.log('1/4  Capturando baselines...');
  const baselineDir = path.join(EVAL_DIR, 'baselines');
  await capture({ outDir: baselineDir, freeze: true });

  /* ---------- 2. Mutações (detecção esperada) ---------- */
  console.log('2/4  Testando mutacoes...');
  const mutationKeys = Object.keys(mutations);

  for (const mutKey of mutationKeys) {
    const mut    = mutations[mutKey];
    const mutDir = path.join(EVAL_DIR, 'mutations', mutKey);
    console.log(`     Mutacao: ${mutKey}`);

    await capture({ outDir: mutDir, mutation: mut, freeze: true });

    for (const pg of pages) {
      for (const vp of viewports) {
        const name         = imgName(pg.name, vp);
        const baselinePath = path.join(baselineDir, name + '.png');
        const currentPath  = path.join(mutDir, name + '.png');
        const label        = `${mutKey}_${name}`;

        const results = await runComparators(baselinePath, currentPath, label);

        for (const tech of ['pixel', 'ssim', 'region']) {
          const r = results[tech];
          // Mutação presente → espera-se detecção (passed=false é bom)
          if (!r.passed) metrics[tech].tp++;
          else           metrics[tech].fn++;
          metrics[tech].totalMs += r.executionMs;
          metrics[tech].runs++;
        }

        details.push({ mutation: mutKey, image: name, expected: 'fail', results });
      }
    }
  }

  /* ---------- 3. Sem mutação — falso positivo ---------- */
  console.log('3/4  Testando falsos positivos (sem mutacao)...');
  for (let run = 0; run < stabilityRuns; run++) {
    const cleanDir = path.join(EVAL_DIR, 'clean', `run-${run}`);
    await capture({ outDir: cleanDir, freeze: true });

    for (const pg of pages) {
      for (const vp of viewports) {
        const name         = imgName(pg.name, vp);
        const baselinePath = path.join(baselineDir, name + '.png');
        const currentPath  = path.join(cleanDir, name + '.png');
        const label        = `clean-run${run}_${name}`;

        const results = await runComparators(baselinePath, currentPath, label);

        for (const tech of ['pixel', 'ssim', 'region']) {
          const r = results[tech];
          // Sem mutação → espera-se que passe (passed=true é bom)
          if (r.passed) metrics[tech].tn++;
          else          metrics[tech].fp++;
          metrics[tech].totalMs += r.executionMs;
          metrics[tech].runs++;
        }

        details.push({ mutation: null, run, image: name, expected: 'pass', results });
      }
    }
  }

  /* ---------- 4. Consolidar métricas ---------- */
  console.log('4/4  Consolidando metricas...');

  const summary = {};
  for (const tech of ['pixel', 'ssim', 'region']) {
    const m = metrics[tech];
    const precision = m.tp + m.fp > 0 ? m.tp / (m.tp + m.fp) : 0;
    const recall    = m.tp + m.fn > 0 ? m.tp / (m.tp + m.fn) : 0;
    const f1        = precision + recall > 0 ? 2 * precision * recall / (precision + recall) : 0;

    summary[tech] = {
      tp: m.tp,
      fp: m.fp,
      tn: m.tn,
      fn: m.fn,
      precision:  Math.round(precision * 10000) / 10000,
      recall:     Math.round(recall    * 10000) / 10000,
      f1:         Math.round(f1        * 10000) / 10000,
      avgTimeMs:  Math.round(m.totalMs / m.runs),
      totalRuns:  m.runs,
    };
  }

  const output = {
    mode: 'evaluate',
    timestamp: new Date().toISOString(),
    config: { stabilityRuns, mutations: mutationKeys, viewports: viewports.map((v) => v.name) },
    summary,
    details,
  };

  const outPath = path.join(EVAL_DIR, 'metrics.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));

  /* Imprimir resumo */
  console.log('\n========== RESULTADO DA AVALIACAO ==========\n');
  console.log('Tecnica   | TP   FP   TN   FN | Precision  Recall  F1     | Tempo medio');
  console.log('----------|----------------------|--------------------------|------------');
  for (const tech of ['pixel', 'ssim', 'region']) {
    const s = summary[tech];
    console.log(
      `${tech.padEnd(10)}| ` +
      `${String(s.tp).padStart(3)}  ${String(s.fp).padStart(3)}  ${String(s.tn).padStart(3)}  ${String(s.fn).padStart(3)} | ` +
      `${s.precision.toFixed(4).padStart(9)}  ${s.recall.toFixed(4).padStart(6)}  ${s.f1.toFixed(4).padStart(6)} | ` +
      `${s.avgTimeMs} ms`,
    );
  }
  console.log(`\nResultados salvos em: ${outPath}`);

  return output;
}

/* ===== Execução direta ===== */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const runsIdx = process.argv.indexOf('--runs');
  const runs    = runsIdx !== -1 ? parseInt(process.argv[runsIdx + 1], 10) : 3;

  evaluate(runs).catch((err) => { console.error(err); process.exit(1); });
}
