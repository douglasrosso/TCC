/**
 * PixelGuard — HTML Report Generator
 *
 * Reads results/results.json and generates a self-contained HTML report.
 */
import fs   from 'node:fs';
import path from 'node:path';
import { loadConfig } from './config.js';

function htmlHead(title) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:0}
header{background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);padding:2rem 2rem 1.5rem;margin-bottom:2rem}
header h1{color:#fff;font-size:1.6rem;margin-bottom:.25rem}
header p{color:rgba(255,255,255,.7);font-size:.85rem}
.container{max-width:1200px;margin:0 auto;padding:0 2rem 2rem}
h2{margin:2rem 0 1rem;border-bottom:2px solid #2563eb;padding-bottom:.25rem;font-size:1.2rem}
h3{margin:1.5rem 0 .75rem;font-size:1rem}
table{border-collapse:collapse;width:100%;margin-bottom:1.5rem;background:#1e293b;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.3)}
th,td{padding:.6rem .75rem;text-align:left;border-bottom:1px solid #334155;font-size:.9rem}
th{background:#0f172a;font-size:.8rem;text-transform:uppercase;color:#94a3b8}
.pass{color:#4ade80;font-weight:600}
.fail{color:#f87171;font-weight:600}
.summary-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1rem;margin-bottom:2rem}
.summary-card{background:#1e293b;border-radius:8px;padding:1.25rem;box-shadow:0 1px 3px rgba(0,0,0,.3);border:1px solid #334155}
.summary-card h3{font-size:1rem;margin-bottom:.5rem;color:#94a3b8}
.big-number{font-size:2rem;font-weight:700}
.big-number.pass{color:#4ade80}.big-number.fail{color:#f87171}
.comparison-block{background:#1e293b;border-radius:8px;padding:1.25rem;margin-bottom:1.5rem;border:1px solid #334155}
.comparison-block h3{margin:0 0 1rem;display:flex;align-items:center;gap:.5rem}
.badge{display:inline-block;padding:.15rem .5rem;border-radius:4px;font-size:.75rem;font-weight:600}
.badge.pass{background:rgba(74,222,128,.15);color:#4ade80}
.badge.fail{background:rgba(248,113,113,.15);color:#f87171}
.images{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1rem;margin-bottom:1rem}
.images figure{text-align:center;background:#0f172a;border-radius:8px;padding:.75rem;border:1px solid #334155}
.images img{max-width:100%;height:auto;border:1px solid #334155;border-radius:4px;cursor:pointer;transition:transform .2s}
.images img:hover{transform:scale(1.02)}
figcaption{font-size:.8rem;color:#94a3b8;margin-top:.5rem}
footer{text-align:center;padding:2rem;color:#475569;font-size:.8rem;border-top:1px solid #1e293b;margin-top:2rem}
</style>
</head><body>`;
}

const htmlFoot = `<footer>Gerado por <strong>PixelGuard</strong></footer></body></html>`;

function generateCIReport(data, meta = null) {
  const { summary, comparisons, timestamp } = data;
  const hasDiffs = summary.failed > 0;

  let html = htmlHead(`${hasDiffs ? 'Review Visual' : 'Visual OK'} — PixelGuard`);

  html += `<header>`;
  html += `<h1>${hasDiffs ? 'Review Visual Necessário' : 'Regressão Visual OK'}</h1>`;
  html += `<p>Gerado em ${new Date(timestamp).toLocaleString('pt-BR')}</p>`;
  html += `</header>`;
  html += `<div class="container">`;

  if (meta) {
    html += `<div style="display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem">`;
    if (meta.commitShort) html += `<div class="summary-card" style="padding:.5rem .75rem"><strong>Commit:</strong> ${meta.commitShort}</div>`;
    if (meta.branch) html += `<div class="summary-card" style="padding:.5rem .75rem"><strong>Branch:</strong> ${meta.branch}</div>`;
    if (meta.prNumber) html += `<div class="summary-card" style="padding:.5rem .75rem"><strong>PR:</strong> #${meta.prNumber}</div>`;
    html += `</div>`;
  }

  html += `<div class="summary-grid">`;
  const techLabels = { pixel: 'Pixel a Pixel', ssim: 'SSIM (Perceptual)', region: 'Regiões' };
  for (const tech of Object.keys(summary.techniques)) {
    const t = summary.techniques[tech];
    const label = techLabels[tech] || tech;
    html += `<div class="summary-card">
      <h3>${label}</h3>
      <span class="big-number ${t.failed ? 'fail' : 'pass'}">${t.failed === 0 ? 'OK' : t.failed + ' FAIL'}</span>
      <p>${t.passed} aprovadas / ${t.failed} reprovadas</p>
    </div>`;
  }
  html += `</div>`;

  html += `<h2>Resumo por Imagem</h2>`;
  const enabledTechs = Object.keys(summary.techniques);
  const thLabels = { pixel: 'Pixel (%diff)', ssim: 'SSIM (score)', region: 'Região (falhas)' };
  html += `<table><thead><tr>
    <th>Imagem</th>
    ${enabledTechs.map(t => `<th>${thLabels[t] || t}</th>`).join('')}
  </tr></thead><tbody>`;

  for (const c of comparisons) {
    html += `<tr><td>${c.imageName}</td>`;
    for (const t of enabledTechs) {
      const r = c.results[t];
      if (!r) { html += `<td>—</td>`; continue; }
      if (t === 'pixel') html += `<td class="${r.passed ? 'pass' : 'fail'}">${r.passed ? 'OK' : 'FAIL'} ${r.diffPercent}%</td>`;
      else if (t === 'ssim') html += `<td class="${r.passed ? 'pass' : 'fail'}">${r.passed ? 'OK' : 'FAIL'} ${r.score}</td>`;
      else if (t === 'region') html += `<td class="${r.passed ? 'pass' : 'fail'}">${r.passed ? 'OK' : 'FAIL'} ${r.failedRegions}/${r.totalRegions}</td>`;
      else html += `<td class="${r.passed ? 'pass' : 'fail'}">${r.passed ? 'OK' : 'FAIL'}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  html += `<h2>Comparações Visuais</h2>`;
  for (const c of comparisons) {
    const anyFailed = Object.values(c.results).some((r) => !r.passed);
    html += `<div class="comparison-block">`;
    html += `<h3>${c.imageName} <span class="badge ${anyFailed ? 'fail' : 'pass'}">${anyFailed ? 'DIFERENÇA' : 'OK'}</span></h3>`;
    html += `<div class="images">`;
    html += `<figure><img src="baselines/${c.imageName}.png" alt="Baseline"><figcaption>Baseline</figcaption></figure>`;
    html += `<figure><img src="current/${c.imageName}.png" alt="Atual"><figcaption>Atual</figcaption></figure>`;
    for (const tech of enabledTechs) {
      const r = c.results[tech];
      if (r && r.diffImagePath) {
        const rel = `diffs/${tech}/${c.imageName}.png`;
        const label = { pixel: 'Diff Pixel', ssim: 'Diff SSIM', region: 'Diff Região' }[tech] || `Diff ${tech}`;
        html += `<figure><img src="${rel}" alt="${label}"><figcaption>${label}</figcaption></figure>`;
      }
    }
    html += `</div></div>`;
  }

  html += `</div>`;
  html += htmlFoot;
  return html;
}

/**
 * Generate the HTML report.
 *
 * @param {object} [options]
 * @param {object} [options.config]  Pre-loaded config.
 * @returns {string} Path of generated report.
 */
export async function generateReport(options = {}) {
  const config = options.config || await loadConfig();
  const RESULTS_DIR = config.resultsDir;

  const jsonPath = path.join(RESULTS_DIR, 'results.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('results.json nao encontrado. Execute:  npx pixelguard compare');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  const metaPath = path.join(RESULTS_DIR, 'meta.json');
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    : null;

  const html = generateCIReport(data, meta);
  const out  = path.join(RESULTS_DIR, 'report.html');
  fs.writeFileSync(out, html);
  console.log('Relatorio gerado: ' + out);
  return out;
}
