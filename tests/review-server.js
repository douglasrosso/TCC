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
const RESULTS_DIR  = path.resolve(__dirname, '..', 'results');
const BASELINES    = path.resolve(__dirname, '..', 'baselines');
const CURRENT_DIR  = path.resolve(__dirname, '..', 'results', 'current');

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

/* ===== Redirect to React UI (old embedded HTML removed) ===== */

function getReviewHTML() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta http-equiv="refresh" content="0;url=http://localhost:3050/review">
<title>Redirecionando...</title>
</head>
<body style="background:#09090b;color:#fafafa;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<p>Redirecionando para <a href="http://localhost:3050/review" style="color:#3b82f6">http://localhost:3050/review</a>...</p>
</body>
</html>`;
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

  /* ===== HTML page ===== */
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(getReviewHTML());
    return;
  }

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

  /* 404 */
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
}

/* ===== Start Server ===== */
const server = http.createServer(handleRequest);
server.listen(PORT, () => {
  console.log(`\n🔍 Review Server rodando em http://localhost:${PORT}`);
  console.log(`   Abra no navegador para revisar as diffs visuais.\n`);
  console.log(`API endpoints:`);
  console.log(`  GET  /api/status       → Status de cada arquivo`);
  console.log(`  GET  /api/history      → Histórico de reviews`);
  console.log(`  GET  /api/results      → Resultados da comparação`);
  console.log(`  POST /api/review       → Aprovar/rejeitar arquivo {action, file, comment}`);
  console.log(`  POST /api/review/all   → Aprovar/rejeitar todos  {action, comment}`);
  console.log(`  POST /api/review/reset → Resetar status\n`);
});
