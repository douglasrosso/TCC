/**
 * PixelGuard Review Server
 *
 * Standalone HTTP server that serves the review UI and REST API.
 *
 * Usage:
 *   node server/index.js                        → port 3060
 *   node server/index.js --port 4000            → custom port
 *   node server/index.js --results-dir ./results → custom results dir
 */
import fs            from 'node:fs';
import http          from 'node:http';
import path          from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv        from 'dotenv';

import {
  configure,
  loadResults,
  getStatus,
  getHistory,
  approveAll,
  rejectAll,
  reviewFile,
  resetAll,
} from './review.js';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT     = path.resolve(__dirname, '..');

// Try to load .env from the consuming project's root (cwd)
dotenv.config({ path: path.join(process.cwd(), '.env') });

// Resolve directories
const DIST_DIR     = path.resolve(PKG_ROOT, 'dist');
const RESULTS_DIR  = process.env.PIXELGUARD_RESULTS_DIR || path.resolve(process.cwd(), 'results');
const BASELINES    = process.env.PIXELGUARD_BASELINES_DIR || path.resolve(process.cwd(), 'baselines');
const CURRENT_DIR  = path.resolve(RESULTS_DIR, 'current');

// Sync paths with review.js so API reads from the correct location
configure({ resultsDir: RESULTS_DIR, baselinesDir: BASELINES });

/* MIME types */
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
    res.end('Build não encontrado. Execute: npx pixelguard-review build');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  fs.createReadStream(indexPath).pipe(res);
}

/* ===== Config ===== */
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

/* ===== Router ===== */
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  /* CORS */
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  /* ===== Images ===== */
  if (pathname.startsWith('/img/baseline/')) {
    serveImage(res, path.join(BASELINES, decodeURIComponent(pathname.replace('/img/baseline/', ''))));
    return;
  }
  if (pathname.startsWith('/img/current/')) {
    serveImage(res, path.join(CURRENT_DIR, decodeURIComponent(pathname.replace('/img/current/', ''))));
    return;
  }
  if (pathname.startsWith('/img/diff/')) {
    serveImage(res, path.join(RESULTS_DIR, 'diffs', decodeURIComponent(pathname.replace('/img/diff/', ''))));
    return;
  }

  /* ===== API ===== */
  if (pathname === '/api/status' && req.method === 'GET') {
    jsonResponse(res, getStatus());
    return;
  }

  if (pathname === '/api/history' && req.method === 'GET') {
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    jsonResponse(res, getHistory(limit));
    return;
  }

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

  if (pathname === '/api/review/all' && req.method === 'POST') {
    const body = await parseBody(req);
    const { action, comment } = body;
    let result;
    if (action === 'approve-all') result = approveAll(comment || '');
    else if (action === 'reject-all') result = rejectAll(comment || '');
    else { jsonResponse(res, { error: 'Ação desconhecida' }, 400); return; }
    jsonResponse(res, { ok: true, result });
    return;
  }

  if (pathname === '/api/review/reset' && req.method === 'POST') {
    resetAll();
    jsonResponse(res, { ok: true });
    return;
  }

  if (pathname === '/api/results' && req.method === 'GET') {
    const results = loadResults();
    jsonResponse(res, results || { error: 'Nenhum resultado encontrado' });
    return;
  }

  if (pathname === '/api/meta' && req.method === 'GET') {
    const metaPath = path.join(RESULTS_DIR, 'meta.json');
    if (fs.existsSync(metaPath)) {
      jsonResponse(res, JSON.parse(fs.readFileSync(metaPath, 'utf-8')));
    } else {
      jsonResponse(res, {
        commitSha: 'local', commitShort: 'local', branch: 'local', baseBranch: 'main',
        prNumber: 0, prTitle: '', actor: 'local', runId: '', repository: '',
        timestamp: new Date().toISOString(), hasDiffs: false, failedCount: 0,
      });
    }
    return;
  }

  /* ===== GitHub Status ===== */
  if (pathname === '/api/github/status' && req.method === 'POST') {
    const body = await parseBody(req);
    const { state, description, context } = body;

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

    const token = process.env.VRT_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || process.env.GITHUB_TOKEN;
    if (!token) {
      jsonResponse(res, { error: 'Nenhum token do GitHub configurado. Defina VRT_TOKEN, GH_TOKEN ou GITHUB_PAT no ambiente ou em .env' }, 401);
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
          context: context || 'visual-regression/review',
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

  /* ===== Static files from dist/ ===== */
  const staticPath = path.join(DIST_DIR, pathname);
  if (serveStatic(res, staticPath)) return;

  /* SPA fallback */
  serveIndex(res);
}

/* ===== Start ===== */
const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  const hasBuild = fs.existsSync(path.join(DIST_DIR, 'index.html'));
  console.log(`\n🔍 PixelGuard Review Server — http://localhost:${PORT}`);
  if (!hasBuild) console.log(`\n   ⚠️  Build not found in dist/ — run: npx pixelguard-review build`);
  console.log(`\n   Results dir: ${RESULTS_DIR}`);
  console.log(`   Baselines:   ${BASELINES}\n`);
  console.log(`API endpoints:`);
  console.log(`  GET  /api/status         → Status de cada arquivo`);
  console.log(`  GET  /api/history        → Histórico de reviews`);
  console.log(`  GET  /api/results        → Resultados da comparação`);
  console.log(`  GET  /api/meta           → Info do CI (commit, branch, PR)`);
  console.log(`  POST /api/review         → Aprovar/rejeitar arquivo`);
  console.log(`  POST /api/review/all     → Aprovar/rejeitar todos`);
  console.log(`  POST /api/review/reset   → Resetar status`);
  console.log(`  POST /api/github/status  → Atualizar GitHub status check\n`);
});
