/**
 * Servidor HTTP local para review interativo de diffs visuais.
 *
 * Fornece uma UI web com:
 *   - Visualização side-by-side (baseline × atual × diff)
 *   - Botões de aprovar / rejeitar individual e em lote
 *   - Histórico de reviews
 *   - API REST para integração
 *
 * Uso:
 *   node tests/review-server.js              → porta 3060
 *   node tests/review-server.js --port 4000  → porta customizada
 */
import fs            from 'node:fs';
import http          from 'node:http';
import path          from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadReviews,
  loadResults,
  getStatus,
  getHistory,
  approveAll,
  rejectAll,
  reviewFile,
  resetAll,
} from './review.js';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR     = path.resolve(__dirname, '..');
const DIST_DIR     = path.resolve(ROOT_DIR, 'dist');
const RESULTS_DIR  = path.resolve(ROOT_DIR, 'results');
const BASELINES    = path.resolve(ROOT_DIR, 'baselines');
const CURRENT_DIR  = path.resolve(RESULTS_DIR, 'current');

/* MIME types para servir arquivos estáticos */
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
};

function serveStatic(res, filePath) {
  try {
    if (!fs.existsSync(filePath)) return false;
    const stat = fs.statSync(filePath);
    if (!stat.isFile()) return false;
  } catch { return false; }
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
  return true;
}

function serveIndex(res) {
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (!fs.existsSync(indexPath)) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Build não encontrado. Execute: npm run build');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(indexPath).pipe(res);
}

/* ===== Configuração ===== */
const portIdx  = process.argv.indexOf('--port');
const PORT     = portIdx >= 0 ? parseInt(process.argv[portIdx + 1], 10) : 3060;

/* ===== Helpers ===== */

function jsonResponse(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch(e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function serveImage(res, filePath) {
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}


/* ===== Roteador ===== */

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  /* CORS */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  /* ===== Serve images ===== */
  if (pathname.startsWith('/img/baseline/')) {
    const file = decodeURIComponent(pathname.replace('/img/baseline/', ''));
    serveImage(res, path.join(BASELINES, file));
    return;
  }
  if (pathname.startsWith('/img/current/')) {
    const file = decodeURIComponent(pathname.replace('/img/current/', ''));
    serveImage(res, path.join(CURRENT_DIR, file));
    return;
  }
  if (pathname.startsWith('/img/diff/')) {
    const rest = decodeURIComponent(pathname.replace('/img/diff/', ''));
    serveImage(res, path.join(RESULTS_DIR, 'diffs', rest));
    return;
  }

  /* ===== API: Status ===== */
  if (pathname === '/api/status' && req.method === 'GET') {
    jsonResponse(res, getStatus());
    return;
  }

  /* ===== API: History ===== */
  if (pathname === '/api/history' && req.method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    jsonResponse(res, getHistory(limit));
    return;
  }

  /* ===== API: Review individual ===== */
  if (pathname === '/api/review' && req.method === 'POST') {
    const body = await parseBody(req);
    const { action, file, comment } = body;
    if (!file || !['approve', 'reject'].includes(action)) {
      jsonResponse(res, { error: 'Parâmetros inválidos' }, 400);
      return;
    }
    const result = reviewFile(file, action, comment || '');
    jsonResponse(res, { ok: true, result });
    return;
  }

  /* ===== API: Review all ===== */
  if (pathname === '/api/review/all' && req.method === 'POST') {
    const body = await parseBody(req);
    const { action, comment } = body;
    let result;
    if (action === 'approve-all') {
      result = approveAll(comment || '');
    } else if (action === 'reject-all') {
      result = rejectAll(comment || '');
    } else {
      jsonResponse(res, { error: 'Ação desconhecida' }, 400);
      return;
    }
    jsonResponse(res, { ok: true, result });
    return;
  }

  /* ===== API: Reset ===== */
  if (pathname === '/api/review/reset' && req.method === 'POST') {
    resetAll();
    jsonResponse(res, { ok: true });
    return;
  }

  /* ===== API: Results ===== */
  if (pathname === '/api/results' && req.method === 'GET') {
    const results = loadResults();
    jsonResponse(res, results || { error: 'Nenhum resultado encontrado' });
    return;
  }

  /* ===== API: Meta (CI info — commit, branch, PR) ===== */
  if (pathname === '/api/meta' && req.method === 'GET') {
    const metaPath = path.join(RESULTS_DIR, 'meta.json');
    if (fs.existsSync(metaPath)) {
      jsonResponse(res, JSON.parse(fs.readFileSync(metaPath, 'utf-8')));
    } else {
      jsonResponse(res, {
        commitSha: 'local',
        commitShort: 'local',
        branch: 'local',
        baseBranch: 'main',
        prNumber: 0,
        prTitle: '',
        actor: 'local',
        runId: '',
        repository: '',
        timestamp: new Date().toISOString(),
        hasDiffs: false,
        failedCount: 0,
      });
    }
    return;
  }

  /* ===== API: Atualizar GitHub status check ===== */
  if (pathname === '/api/github/status' && req.method === 'POST') {
    const body = await parseBody(req);
    const { state, description } = body;

    // Carregar meta.json com info do CI
    const metaPath = path.join(RESULTS_DIR, 'meta.json');
    if (!fs.existsSync(metaPath)) {
      jsonResponse(res, { error: 'meta.json não encontrado — este review não veio do CI' }, 400);
      return;
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));
    if (!meta.repository || !meta.commitSha || meta.commitSha === 'local') {
      jsonResponse(res, { error: 'Review local — sem integração com GitHub' }, 400);
      return;
    }

    // Usar GITHUB_TOKEN do ambiente (deve ser configurado)
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      jsonResponse(res, { error: 'GITHUB_TOKEN não configurado. Execute: $env:GITHUB_TOKEN="ghp_..."' }, 401);
      return;
    }

    const [owner, repo] = meta.repository.split('/');
    try {
      const apiRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/statuses/${meta.commitSha}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github+json',
        },
        body: JSON.stringify({
          state: state || 'success',
          description: description || 'Review visual concluído',
          context: 'visual-regression/review',
          target_url: meta.runId
            ? `https://github.com/${meta.repository}/actions/runs/${meta.runId}`
            : undefined,
        }),
      });

      if (!apiRes.ok) {
        const err = await apiRes.json();
        jsonResponse(res, { error: 'Erro na API do GitHub', details: err }, apiRes.status);
        return;
      }

      jsonResponse(res, { ok: true, state, commitSha: meta.commitSha });
    } catch (err) {
      jsonResponse(res, { error: err.message }, 500);
    }
    return;
  }

  /* ===== Servir arquivos estáticos do build (dist/) ===== */
  // Tentar servir arquivo estático de dist/
  const staticPath = path.join(DIST_DIR, pathname);
  if (serveStatic(res, staticPath)) return;

  // SPA fallback — qualquer rota não-API serve index.html
  serveIndex(res);
}

/* ===== Start Server ===== */
const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  const hasBuild = fs.existsSync(path.join(DIST_DIR, 'index.html'));
  console.log(`\n🔍 Review Server rodando em http://localhost:${PORT}`);
  console.log(`   Review UI: http://localhost:${PORT}/review`);
  if (!hasBuild) {
    console.log(`\n   ⚠️  Build não encontrado em dist/ — execute: npm run build`);
  }
  console.log(`\nAPI endpoints:`);
  console.log(`  GET  /api/status       → Status de cada arquivo`);
  console.log(`  GET  /api/history      → Histórico de reviews`);
  console.log(`  GET  /api/results      → Resultados da comparação`);
  console.log(`  GET  /api/meta         → Info do CI (commit, branch, PR)`);
  console.log(`  POST /api/review       → Aprovar/rejeitar arquivo {action, file, comment}`);
  console.log(`  POST /api/review/all   → Aprovar/rejeitar todos  {action, comment}`);
  console.log(`  POST /api/review/reset → Resetar status`);
  console.log(`  POST /api/github/status → Atualizar status check no GitHub\n`);
});
