/**
 * Gerador de relatório HTML a partir dos resultados de comparação.
 *
 * Lê results/results.json e gera um relatório visual autocontido.
 *
 * Uso:
 *   node tests/report.js                   → lê results/results.json
 *   node tests/report.js --deploy          → gera report + copia imagens para deploy/
 */
import fs   from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname   = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.resolve(__dirname, '..', 'results');
const BASELINES   = path.resolve(__dirname, '..', 'baselines');

/* ===== Templates HTML ===== */

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
.approve-banner{background:linear-gradient(135deg,#065f46,#047857);border:1px solid #10b981;border-radius:8px;padding:1.5rem;margin-bottom:2rem;text-align:center}
.approve-banner.pending{background:linear-gradient(135deg,#78350f,#92400e);border-color:#f59e0b}
.approve-banner h2{border:none;color:#fff;margin:0 0 .5rem;font-size:1.1rem}
.approve-banner p{color:rgba(255,255,255,.8);font-size:.9rem;margin:.25rem 0}
.approve-banner code{background:rgba(0,0,0,.3);padding:.15rem .4rem;border-radius:4px;font-size:.85rem;color:#fbbf24}
.meta-info{display:flex;flex-wrap:wrap;gap:1rem;margin-bottom:1.5rem}
.meta-chip{background:#1e293b;border:1px solid #334155;border-radius:6px;padding:.4rem .75rem;font-size:.8rem;color:#94a3b8}
.meta-chip strong{color:#e2e8f0}
.tabs{display:flex;gap:.5rem;margin-bottom:1rem}
.tab{padding:.4rem .8rem;border-radius:6px;border:1px solid #334155;background:#1e293b;color:#94a3b8;cursor:pointer;font-size:.8rem}
.tab.active{background:#2563eb;border-color:#2563eb;color:#fff}
footer{text-align:center;padding:2rem;color:#475569;font-size:.8rem;border-top:1px solid #1e293b;margin-top:2rem}
</style>
</head><body>`;}

const htmlFoot = `<footer>🤖 Gerado por <strong>PixelGuard</strong></footer></body></html>`;

/* ===== Relatório CI ===== */

function generateCIReport(data, meta = null) {
  const { summary, comparisons, timestamp } = data;
  const hasDiffs = summary.failed > 0;

  let html = htmlHead(`${hasDiffs ? '🔍 Review Visual' : '✅ Visual OK'} — PixelGuard`);

  /* Header */
  html += `<header>`;
  html += `<h1>${hasDiffs ? '🔍 Review Visual Necessário' : '✅ Regressão Visual OK'}</h1>`;
  html += `<p>Gerado em ${new Date(timestamp).toLocaleString('pt-BR')}</p>`;
  html += `</header>`;
  html += `<div class="container">`;

  /* Meta info */
  if (meta) {
    html += `<div class="meta-info">`;
    html += `<div class="meta-chip">Commit: <strong>${meta.commitShort || '—'}</strong></div>`;
    html += `<div class="meta-chip">Branch: <strong>${meta.branch || '—'}</strong></div>`;
    html += `<div class="meta-chip">Base: <strong>${meta.baseBranch || 'main'}</strong></div>`;
    if (meta.prNumber) html += `<div class="meta-chip">PR: <strong>#${meta.prNumber}</strong></div>`;
    html += `<div class="meta-chip">Autor: <strong>${meta.actor || '—'}</strong></div>`;
    html += `</div>`;
  }

  /* Approve banner */
  if (hasDiffs) {
    html += `<div class="approve-banner pending">`;
    html += `<h2>⏳ Merge bloqueado — diferenças visuais encontradas</h2>`;
    html += `<p>Revise as diferenças abaixo. Para aprovar, comente no PR:</p>`;
    html += `<p><code>/approve-visual</code></p>`;
    html += `</div>`;
  } else {
    html += `<div class="approve-banner">`;
    html += `<h2>✅ Nenhuma diferença visual — merge liberado</h2>`;
    html += `</div>`;
  }

  /* Cards de resumo */
  const techLabels = { pixel: 'Pixel a Pixel', ssim: 'SSIM (Perceptual)', region: 'Regiões' };
  const enabledTechs = Object.keys(summary.techniques);
  html += `<div class="summary-grid">`;
  for (const tech of enabledTechs) {
    const t = summary.techniques[tech];
    const label = techLabels[tech] || tech;
    html += `<div class="summary-card">
      <h3>${label}</h3>
      <span class="big-number ${t.failed ? 'fail' : 'pass'}">${t.failed === 0 ? 'OK' : t.failed + ' FAIL'}</span>
      <p>${t.passed} aprovadas / ${t.failed} reprovadas</p>
    </div>`;
  }
  html += `</div>`;

  /* Tabela de comparações */
  html += `<h2>Resumo por Imagem</h2>`;
  const colHeaders = { pixel: 'Pixel (%diff)', ssim: 'SSIM (score)', region: 'Região (falhas)' };
  html += `<table><thead><tr>
    <th>Imagem</th>
    ${enabledTechs.map(t => `<th>${colHeaders[t] || t}</th>`).join('')}
  </tr></thead><tbody>`;

  for (const c of comparisons) {
    html += `<tr><td>${c.imageName}</td>`;
    for (const tech of enabledTechs) {
      const r = c.results[tech];
      if (!r) { html += `<td>—</td>`; continue; }
      let detail;
      if (tech === 'pixel')       detail = `${r.diffPercent}%`;
      else if (tech === 'ssim')   detail = `${r.score}`;
      else if (tech === 'region') detail = `${r.failedRegions}/${r.totalRegions}`;
      else                        detail = '';
      html += `<td class="${r.passed ? 'pass' : 'fail'}">${r.passed ? 'OK' : 'FAIL'} ${detail}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;


  /* Comparações detalhadas com imagens */
  html += `<h2>Comparações Visuais</h2>`;
  for (const c of comparisons) {
    const anyFailed = Object.values(c.results).some(r => !r.passed);
    html += `<div class="comparison-block">`;
    html += `<h3>${c.imageName} <span class="badge ${anyFailed ? 'fail' : 'pass'}">${anyFailed ? 'DIFERENÇA' : 'OK'}</span></h3>`;
    html += `<div class="images">`;
    html += `<figure><img src="baselines/${c.imageName}.png" alt="Baseline"><figcaption>📌 Baseline (main)</figcaption></figure>`;
    html += `<figure><img src="current/${c.imageName}.png" alt="Atual"><figcaption>🆕 Captura Atual (PR)</figcaption></figure>`;
    for (const tech of enabledTechs) {
      const r = c.results[tech];
      if (r?.diffImagePath) {
        const rel = `diffs/${tech}/${c.imageName}.png`;
        const dlabel = { pixel: 'Diff Pixel', ssim: 'Diff SSIM', region: 'Diff Região' }[tech] || `Diff ${tech}`;
        html += `<figure><img src="${rel}" alt="${dlabel}"><figcaption>🔍 ${dlabel}</figcaption></figure>`;
      }
    }
    html += `</div></div>`;
  }

  html += `</div>`; // container
  html += htmlFoot;
  return html;
}

/* ===== Entrada ===== */

export function generateReport() {
  const jsonPath = path.join(RESULTS_DIR, 'results.json');
  if (!fs.existsSync(jsonPath)) {
    console.error('results.json nao encontrado. Execute:  npm run compare');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  // Carregar meta.json se existir
  const metaPath = path.join(RESULTS_DIR, 'meta.json');
  const meta = fs.existsSync(metaPath)
    ? JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    : null;

  const html = generateCIReport(data, meta);
  const out  = path.join(RESULTS_DIR, 'report.html');
  fs.writeFileSync(out, html);
  console.log('Relatorio CI gerado: ' + out);
  return out;
}

/**
 * Monta a pasta deploy/ pronta para upload ao GitHub Pages.
 * Builda o app React PixelGuard Review, injeta dados estáticos
 * e copia imagens.
 */
export function buildDeploy(prNumber) {
  const deployDir = path.resolve(__dirname, '..', 'deploy', `pr-${prNumber}`);
  fs.mkdirSync(deployDir, { recursive: true });

  // 1. Build do app React (PixelGuard Review)
  const rootDir = path.resolve(__dirname, '..');
  const reviewDir = path.resolve(rootDir, 'packages', 'pixelguard', 'review');
  console.log('Building PixelGuard Review app...');
  execSync('npm run review:build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: { ...process.env, STATIC_DEPLOY: 'true' },
  });

  // 2. Copiar build do Vite para deploy
  const distDir = path.join(reviewDir, 'dist');
  fs.cpSync(distDir, deployDir, { recursive: true });

  // 3. Ler results.json e meta.json
  const resultsJson = path.join(RESULTS_DIR, 'results.json');
  const metaJson = path.join(RESULTS_DIR, 'meta.json');
  const results = fs.existsSync(resultsJson)
    ? JSON.parse(fs.readFileSync(resultsJson, 'utf-8'))
    : {};
  const meta = fs.existsSync(metaJson)
    ? JSON.parse(fs.readFileSync(metaJson, 'utf-8'))
    : {};

  // 4. Injetar dados estáticos no index.html
  const indexPath = path.join(deployDir, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');
  const staticData = JSON.stringify({ results, meta, status: [] });
  html = html.replace(
    '</head>',
    `<script>window.__PIXELGUARD_STATIC__=${staticData};</script>\n</head>`
  );
  fs.writeFileSync(indexPath, html);

  // 5. Copiar baselines → img/baseline/
  const blDst = path.join(deployDir, 'img', 'baseline');
  fs.mkdirSync(blDst, { recursive: true });
  if (fs.existsSync(BASELINES)) {
    for (const f of fs.readdirSync(BASELINES).filter(f => f.endsWith('.png'))) {
      fs.copyFileSync(path.join(BASELINES, f), path.join(blDst, f));
    }
  }

  // 6. Copiar current → img/current/
  const curSrc = path.join(RESULTS_DIR, 'current');
  const curDst = path.join(deployDir, 'img', 'current');
  fs.mkdirSync(curDst, { recursive: true });
  if (fs.existsSync(curSrc)) {
    for (const f of fs.readdirSync(curSrc).filter(f => f.endsWith('.png'))) {
      fs.copyFileSync(path.join(curSrc, f), path.join(curDst, f));
    }
  }

  // 7. Copiar diffs → img/diff/{tech}/
  const deployTechs = data.comparators || Object.keys(data.summary?.techniques || {}) || ['pixel', 'ssim', 'region'];
  for (const tech of deployTechs) {
    const diffSrc = path.join(RESULTS_DIR, 'diffs', tech);
    const diffDst = path.join(deployDir, 'img', 'diff', tech);
    fs.mkdirSync(diffDst, { recursive: true });
    if (fs.existsSync(diffSrc)) {
      for (const f of fs.readdirSync(diffSrc).filter(f => f.endsWith('.png'))) {
        fs.copyFileSync(path.join(diffSrc, f), path.join(diffDst, f));
      }
    }
  }

  console.log(`Deploy montado em: ${deployDir}`);
  return deployDir;
}

/* ===== Execução direta ===== */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  if (process.argv.includes('--deploy')) {
    const prIdx = process.argv.indexOf('--pr');
    const prNumber = prIdx >= 0 ? process.argv[prIdx + 1] : '0';
    buildDeploy(prNumber);
  } else {
    generateReport();
  }
}
