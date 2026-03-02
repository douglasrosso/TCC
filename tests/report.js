/**
 * Gerador de relatório HTML a partir dos resultados de comparação
 * ou avaliação.
 *
 * Lê results/results.json (modo CI) ou results/evaluation/metrics.json
 * (modo evaluate) e gera um relatório visual autocontido.
 *
 * Uso:
 *   node tests/report.js                   → lê results/results.json
 *   node tests/report.js --evaluate        → lê evaluation/metrics.json
 */
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.resolve(__dirname, '..', 'results');

/* ===== Templates HTML ===== */

function htmlHead(title) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#f5f5f5;color:#1e293b;padding:2rem}
h1{margin-bottom:.5rem}
h2{margin:2rem 0 1rem;border-bottom:2px solid #2563eb;padding-bottom:.25rem}
h3{margin:1rem 0 .5rem}
table{border-collapse:collapse;width:100%;margin-bottom:1.5rem;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}
th,td{padding:.6rem .75rem;text-align:left;border-bottom:1px solid #e2e8f0;font-size:.9rem}
th{background:#f8fafc;font-size:.8rem;text-transform:uppercase;color:#64748b}
.pass{color:#16a34a;font-weight:600}
.fail{color:#dc2626;font-weight:600}
.masked{color:#64748b;font-style:italic}
.summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-bottom:2rem}
.summary-card{background:#fff;border-radius:8px;padding:1.25rem;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.summary-card h3{font-size:1rem;margin-bottom:.5rem}
.big-number{font-size:2rem;font-weight:700;color:#2563eb}
.images{display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1.5rem}
.images figure{flex:1;min-width:200px;text-align:center;background:#fff;border-radius:8px;padding:.75rem;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.images img{max-width:100%;height:auto;border:1px solid #e2e8f0;border-radius:4px}
figcaption{font-size:.8rem;color:#64748b;margin-top:.25rem}
.timestamp{color:#64748b;font-size:.85rem;margin-bottom:1.5rem}
</style>
</head><body>`;
}

const htmlFoot = '</body></html>';

/* ===== Relatório CI ===== */

function generateCIReport(data) {
  const { summary, comparisons, timestamp } = data;
  let html = htmlHead('Relatorio de Regressao Visual — CI');

  html += `<h1>Relatorio de Regressao Visual</h1>`;
  html += `<p class="timestamp">Gerado em ${new Date(timestamp).toLocaleString('pt-BR')}</p>`;

  /* Cards de resumo */
  html += `<div class="summary-grid">`;
  for (const tech of ['pixel', 'ssim', 'region']) {
    const t = summary.techniques[tech];
    const label = { pixel: 'Pixel a Pixel', ssim: 'SSIM (Perceptual)', region: 'Regioes' }[tech];
    html += `<div class="summary-card">
      <h3>${label}</h3>
      <span class="big-number ${t.failed ? 'fail' : 'pass'}">${t.failed === 0 ? 'OK' : t.failed + ' FAIL'}</span>
      <p>${t.passed} aprovadas / ${t.failed} reprovadas</p>
    </div>`;
  }
  html += `</div>`;

  /* Tabela de comparações */
  html += `<h2>Detalhes por Imagem</h2>`;
  html += `<table><thead><tr>
    <th>Imagem</th>
    <th>Pixel (%diff)</th><th>SSIM (score)</th><th>Regiao (falhas)</th>
  </tr></thead><tbody>`;

  for (const c of comparisons) {
    const p = c.results.pixel;
    const s = c.results.ssim;
    const r = c.results.region;
    html += `<tr>
      <td>${c.imageName}</td>
      <td class="${p.passed ? 'pass' : 'fail'}">${p.passed ? 'OK' : 'FAIL'} ${p.diffPercent}%</td>
      <td class="${s.passed ? 'pass' : 'fail'}">${s.passed ? 'OK' : 'FAIL'} ${s.score}</td>
      <td class="${r.passed ? 'pass' : 'fail'}">${r.passed ? 'OK' : 'FAIL'} ${r.failedRegions}/${r.totalRegions}</td>
    </tr>`;
  }
  html += `</tbody></table>`;

  /* Imagens de diff */
  for (const c of comparisons) {
    html += `<h3>${c.imageName}</h3><div class="images">`;
    html += `<figure><img src="current/${c.imageName}.png"><figcaption>Captura Atual</figcaption></figure>`;
    for (const tech of ['pixel', 'ssim', 'region']) {
      const r = c.results[tech];
      if (r.diffImagePath) {
        const rel = path.relative(RESULTS_DIR, r.diffImagePath).replace(/\\/g, '/');
        html += `<figure><img src="${rel}"><figcaption>Diff ${tech}</figcaption></figure>`;
      }
    }
    html += `</div>`;
  }

  html += htmlFoot;
  return html;
}

/* ===== Relatório de avaliação ===== */

function generateEvalReport(data) {
  const { summary, config, timestamp, details } = data;
  let html = htmlHead('Avaliacao de Tecnicas — TCC');

  html += `<h1>Avaliacao Comparativa de Tecnicas de Regressao Visual</h1>`;
  html += `<p class="timestamp">Gerado em ${new Date(timestamp).toLocaleString('pt-BR')} &mdash; ${config.stabilityRuns} rodadas de estabilidade</p>`;

  /* Resumo geral */
  html += `<h2>Metricas Consolidadas</h2>`;
  html += `<table><thead><tr>
    <th>Tecnica</th><th>TP</th><th>FP</th><th>TN</th><th>FN</th>
    <th>Precision</th><th>Recall</th><th>F1</th><th>Tempo Medio</th>
  </tr></thead><tbody>`;

  for (const tech of ['pixel', 'ssim', 'region']) {
    const s = summary[tech];
    const label = { pixel: 'Pixel a Pixel', ssim: 'SSIM', region: 'Regioes' }[tech];
    html += `<tr>
      <td><strong>${label}</strong></td>
      <td>${s.tp}</td><td>${s.fp}</td><td>${s.tn}</td><td>${s.fn}</td>
      <td>${(s.precision * 100).toFixed(1)}%</td>
      <td>${(s.recall * 100).toFixed(1)}%</td>
      <td class="${s.f1 >= 0.9 ? 'pass' : s.f1 >= 0.7 ? '' : 'fail'}"><strong>${(s.f1 * 100).toFixed(1)}%</strong></td>
      <td>${s.avgTimeMs} ms</td>
    </tr>`;
  }
  html += `</tbody></table>`;

  /* Detecção por mutação */
  html += `<h2>Deteccao por Tipo de Mutacao</h2>`;
  const mutationDetails = {};
  for (const d of details) {
    if (!d.mutation) continue;
    if (!mutationDetails[d.mutation]) mutationDetails[d.mutation] = { pixel: 0, ssim: 0, region: 0, total: 0 };
    mutationDetails[d.mutation].total++;
    for (const tech of ['pixel', 'ssim', 'region']) {
      if (!d.results[tech].passed) mutationDetails[d.mutation][tech]++;
    }
  }

  html += `<table><thead><tr>
    <th>Mutacao</th><th>Total</th><th>Pixel</th><th>SSIM</th><th>Regiao</th>
  </tr></thead><tbody>`;
  for (const [mut, m] of Object.entries(mutationDetails)) {
    html += `<tr>
      <td>${mut}</td><td>${m.total}</td>
      <td class="${m.pixel === m.total ? 'pass' : 'fail'}">${m.pixel}/${m.total}</td>
      <td class="${m.ssim === m.total ? 'pass' : 'fail'}">${m.ssim}/${m.total}</td>
      <td class="${m.region === m.total ? 'pass' : 'fail'}">${m.region}/${m.total}</td>
    </tr>`;
  }
  html += `</tbody></table>`;

  /* Falsos positivos */
  html += `<h2>Falsos Positivos (sem mutacao)</h2>`;
  const fpDetails = details.filter((d) => !d.mutation);
  html += `<table><thead><tr>
    <th>Run</th><th>Imagem</th><th>Pixel</th><th>SSIM</th><th>Regiao</th>
  </tr></thead><tbody>`;
  for (const d of fpDetails) {
    html += `<tr>
      <td>${d.run ?? '-'}</td><td>${d.image}</td>
      <td class="${d.results.pixel.passed ? 'pass' : 'fail'}">${d.results.pixel.passed ? 'OK' : 'FP'}</td>
      <td class="${d.results.ssim.passed ? 'pass' : 'fail'}">${d.results.ssim.passed ? 'OK' : 'FP'}</td>
      <td class="${d.results.region.passed ? 'pass' : 'fail'}">${d.results.region.passed ? 'OK' : 'FP'}</td>
    </tr>`;
  }
  html += `</tbody></table>`;

  html += htmlFoot;
  return html;
}

/* ===== Entrada ===== */

export function generateReport(mode = 'ci') {
  if (mode === 'evaluate') {
    const jsonPath = path.join(RESULTS_DIR, 'evaluation', 'metrics.json');
    if (!fs.existsSync(jsonPath)) {
      console.error('metrics.json nao encontrado. Execute:  npm run evaluate');
      process.exit(1);
    }
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const html = generateEvalReport(data);
    const out  = path.join(RESULTS_DIR, 'evaluation', 'report.html');
    fs.writeFileSync(out, html);
    console.log('Relatorio de avaliacao gerado: ' + out);
    return out;
  }

  /* CI */
  const jsonPath = path.join(RESULTS_DIR, 'results.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('results.json nao encontrado. Execute:  npm run compare');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  const html = generateCIReport(data);
  const out  = path.join(RESULTS_DIR, 'report.html');
  fs.writeFileSync(out, html);
  console.log('Relatorio CI gerado: ' + out);
  return out;
}

/* ===== Execução direta ===== */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  const mode = process.argv.includes('--evaluate') ? 'evaluate' : 'ci';
  generateReport(mode);
}
