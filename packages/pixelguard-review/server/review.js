/**
 * Sistema de Review para Regressão Visual.
 *
 * Gerencia aprovação / rejeição de diffs visuais com histórico completo.
 *
 * Funcionalidades:
 *   - Aprovar / rejeitar todas as alterações
 *   - Aprovar / rejeitar um arquivo específico
 *   - Consultar status atual de cada imagem
 *   - Consultar histórico de reviews anteriores
 *
 * Uso CLI:
 *   node tests/review.js --status
 *   node tests/review.js --approve-all
 *   node tests/review.js --reject-all
 *   node tests/review.js --approve <nome-imagem>
 *   node tests/review.js --reject  <nome-imagem>
 *   node tests/review.js --history
 *   node tests/review.js --history --limit 10
 */
import fs   from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR  = path.resolve(__dirname, '..', 'results');
const BASELINES    = path.resolve(__dirname, '..', 'baselines');
const CURRENT_DIR  = path.resolve(__dirname, '..', 'results', 'current');
const REVIEWS_PATH = path.resolve(RESULTS_DIR, 'reviews.json');
const RESULTS_PATH = path.resolve(RESULTS_DIR, 'results.json');

/* ===== Estrutura do reviews.json ===== */

/**
 * @typedef {Object} ReviewEntry
 * @property {string}   id         - UUID único do review
 * @property {string}   timestamp  - ISO 8601
 * @property {string}   reviewer   - Nome do revisor (env USER ou 'cli')
 * @property {'approve'|'reject'|'approve-all'|'reject-all'} action
 * @property {string[]} files      - Arquivos afetados
 * @property {string}   [comment]  - Comentário opcional
 * @property {Object}   [diffSummary] - Resumo das diffs no momento do review
 */

/**
 * @typedef {Object} FileStatus
 * @property {'pending'|'approved'|'rejected'} status
 * @property {string}  reviewedAt
 * @property {string}  reviewedBy
 * @property {string}  reviewId
 * @property {Object}  [diffInfo]  - Dados da comparação no momento do review
 */

/**
 * @typedef {Object} ReviewsData
 * @property {Object.<string, FileStatus>} currentStatus - Status por arquivo
 * @property {ReviewEntry[]}               history       - Histórico completo
 */

/* ===== Helpers ===== */

function getReviewer() {
  return process.env.USER || process.env.USERNAME || process.env.REVIEWER || 'cli';
}

function generateId() {
  return crypto.randomUUID();
}

/** Lê ou inicializa o reviews.json */
export function loadReviews() {
  if (fs.existsSync(REVIEWS_PATH)) {
    return JSON.parse(fs.readFileSync(REVIEWS_PATH, 'utf-8'));
  }
  return { currentStatus: {}, history: [] };
}

/** Salva o reviews.json */
export function saveReviews(data) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  fs.writeFileSync(REVIEWS_PATH, JSON.stringify(data, null, 2));
}

/** Carrega os resultados da última comparação */
export function loadResults() {
  if (!fs.existsSync(RESULTS_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf-8'));
}

/** Retorna a lista de imagens pendentes (do results.json) */
export function getPendingFiles() {
  const results = loadResults();
  if (!results || !results.comparisons) return [];
  return results.comparisons.map((c) => c.imageName);
}

/** Extrai informações de diff de uma comparação */
function extractDiffInfo(comparison) {
  if (!comparison) return null;
  const r = comparison.results;
  return {
    pixel: {
      passed: r.pixel.passed,
      diffPercent: r.pixel.diffPercent,
      score: r.pixel.score,
    },
    ssim: {
      passed: r.ssim.passed,
      score: r.ssim.score,
    },
    region: {
      passed: r.region.passed,
      failedRegions: r.region.failedRegions,
      totalRegions: r.region.totalRegions,
    },
  };
}

/* ===== Ações de review ===== */

/**
 * Atualiza o status de um arquivo e registra no histórico.
 * Se aprovado, copia a captura atual para baselines.
 */
export function reviewFile(imageName, action, comment = '') {
  const data     = loadReviews();
  const results  = loadResults();
  const reviewer = getReviewer();
  const id       = generateId();
  const now      = new Date().toISOString();

  // Encontrar a comparação correspondente
  const comparison = results?.comparisons?.find((c) => c.imageName === imageName);
  const diffInfo   = extractDiffInfo(comparison);

  // Atualizar status do arquivo
  data.currentStatus[imageName] = {
    status:     action === 'approve' ? 'approved' : 'rejected',
    reviewedAt: now,
    reviewedBy: reviewer,
    reviewId:   id,
    diffInfo,
  };

  // Registrar no histórico
  data.history.push({
    id,
    timestamp: now,
    reviewer,
    action,
    files: [imageName],
    comment: comment || undefined,
    diffSummary: diffInfo,
  });

  saveReviews(data);

  // Se aprovado → copiar current para baselines
  if (action === 'approve') {
    const currentFile  = path.join(CURRENT_DIR, `${imageName}.png`);
    const baselineFile = path.join(BASELINES, `${imageName}.png`);
    if (fs.existsSync(currentFile)) {
      fs.mkdirSync(BASELINES, { recursive: true });
      fs.copyFileSync(currentFile, baselineFile);
    }
  }

  return data.currentStatus[imageName];
}

/**
 * Aprova todos os arquivos pendentes.
 */
export function approveAll(comment = '') {
  const files    = getPendingFiles();
  const data     = loadReviews();
  const results  = loadResults();
  const reviewer = getReviewer();
  const id       = generateId();
  const now      = new Date().toISOString();

  const diffSummaries = {};

  for (const imageName of files) {
    const comparison = results?.comparisons?.find((c) => c.imageName === imageName);
    const diffInfo   = extractDiffInfo(comparison);
    diffSummaries[imageName] = diffInfo;

    data.currentStatus[imageName] = {
      status:     'approved',
      reviewedAt: now,
      reviewedBy: reviewer,
      reviewId:   id,
      diffInfo,
    };

    // Copiar current → baselines
    const currentFile  = path.join(CURRENT_DIR, `${imageName}.png`);
    const baselineFile = path.join(BASELINES, `${imageName}.png`);
    if (fs.existsSync(currentFile)) {
      fs.mkdirSync(BASELINES, { recursive: true });
      fs.copyFileSync(currentFile, baselineFile);
    }
  }

  data.history.push({
    id,
    timestamp: now,
    reviewer,
    action: 'approve-all',
    files,
    comment: comment || undefined,
    diffSummary: diffSummaries,
  });

  saveReviews(data);
  return { count: files.length, files };
}

/**
 * Rejeita todos os arquivos pendentes.
 */
export function rejectAll(comment = '') {
  const files    = getPendingFiles();
  const data     = loadReviews();
  const results  = loadResults();
  const reviewer = getReviewer();
  const id       = generateId();
  const now      = new Date().toISOString();

  const diffSummaries = {};

  for (const imageName of files) {
    const comparison = results?.comparisons?.find((c) => c.imageName === imageName);
    const diffInfo   = extractDiffInfo(comparison);
    diffSummaries[imageName] = diffInfo;

    data.currentStatus[imageName] = {
      status:     'rejected',
      reviewedAt: now,
      reviewedBy: reviewer,
      reviewId:   id,
      diffInfo,
    };
  }

  data.history.push({
    id,
    timestamp: now,
    reviewer,
    action: 'reject-all',
    files,
    comment: comment || undefined,
    diffSummary: diffSummaries,
  });

  saveReviews(data);
  return { count: files.length, files };
}

/**
 * Retorna o status atual de todos os arquivos.
 */
export function getStatus() {
  const data    = loadReviews();
  const files   = getPendingFiles();
  const results = loadResults();
  const status  = [];

  for (const imageName of files) {
    const review     = data.currentStatus[imageName];
    const comparison = results?.comparisons?.find((c) => c.imageName === imageName);
    const anyFailed  = comparison
      ? !comparison.results.pixel.passed || !comparison.results.ssim.passed || !comparison.results.region.passed
      : false;

    status.push({
      imageName,
      reviewStatus: review?.status || 'pending',
      reviewedAt:   review?.reviewedAt || null,
      reviewedBy:   review?.reviewedBy || null,
      hasDiff:      anyFailed,
      pixel: comparison ? {
        passed: comparison.results.pixel.passed,
        diffPercent: comparison.results.pixel.diffPercent,
      } : null,
      ssim: comparison ? {
        passed: comparison.results.ssim.passed,
        score: comparison.results.ssim.score,
      } : null,
      region: comparison ? {
        passed: comparison.results.region.passed,
        failedRegions: comparison.results.region.failedRegions,
        totalRegions: comparison.results.region.totalRegions,
      } : null,
    });
  }

  return status;
}

/**
 * Retorna o histórico de reviews.
 */
export function getHistory(limit = 50) {
  const data = loadReviews();
  return data.history.slice(-limit).reverse();
}

/**
 * Reseta o status de todos os arquivos para 'pending'.
 */
export function resetAll() {
  const data = loadReviews();
  data.currentStatus = {};
  saveReviews(data);
}

/* ===== CLI ===== */

function printStatus() {
  const statusList = getStatus();
  if (statusList.length === 0) {
    console.log('Nenhuma comparação encontrada. Execute: npm run compare');
    return;
  }

  const ICONS = { pending: '⏳', approved: '✅', rejected: '❌' };
  const COLORS = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    dim: '\x1b[2m',
    bold: '\x1b[1m',
    cyan: '\x1b[36m',
  };
  const C = COLORS;

  console.log(`\n${C.bold}╔══════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║      REVIEW DE REGRESSÃO VISUAL              ║${C.reset}`);
  console.log(`${C.bold}╚══════════════════════════════════════════════╝${C.reset}\n`);

  const pending  = statusList.filter((s) => s.reviewStatus === 'pending').length;
  const approved = statusList.filter((s) => s.reviewStatus === 'approved').length;
  const rejected = statusList.filter((s) => s.reviewStatus === 'rejected').length;

  console.log(`  ${C.yellow}⏳ Pendentes: ${pending}${C.reset}   ${C.green}✅ Aprovados: ${approved}${C.reset}   ${C.red}❌ Rejeitados: ${rejected}${C.reset}\n`);

  for (const s of statusList) {
    const icon   = ICONS[s.reviewStatus];
    const statusColor = s.reviewStatus === 'approved' ? C.green : s.reviewStatus === 'rejected' ? C.red : C.yellow;

    console.log(`  ${icon} ${C.bold}${s.imageName}${C.reset}`);
    console.log(`     ${statusColor}Status: ${s.reviewStatus.toUpperCase()}${C.reset}`);

    if (s.pixel) {
      const pTag = s.pixel.passed ? `${C.green}OK${C.reset}` : `${C.red}FAIL (${s.pixel.diffPercent}%)${C.reset}`;
      const sTag = s.ssim.passed ? `${C.green}OK${C.reset}` : `${C.red}FAIL (${s.ssim.score})${C.reset}`;
      const rTag = s.region.passed ? `${C.green}OK${C.reset}` : `${C.red}FAIL (${s.region.failedRegions}/${s.region.totalRegions})${C.reset}`;
      console.log(`     ${C.dim}Pixel: ${pTag}  ${C.dim}SSIM: ${sTag}  ${C.dim}Região: ${rTag}`);
    }

    if (s.reviewedAt) {
      console.log(`     ${C.dim}Revisado em: ${new Date(s.reviewedAt).toLocaleString('pt-BR')} por ${s.reviewedBy}${C.reset}`);
    }
    console.log();
  }
}

function printHistory(limit) {
  const history = getHistory(limit);
  if (history.length === 0) {
    console.log('Nenhum review registrado ainda.');
    return;
  }

  const C = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    cyan: '\x1b[36m',
  };

  console.log(`\n${C.bold}╔══════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}║      HISTÓRICO DE REVIEWS                    ║${C.reset}`);
  console.log(`${C.bold}╚══════════════════════════════════════════════╝${C.reset}\n`);

  for (const entry of history) {
    const actionLabel = {
      'approve': '✅ APROVADO',
      'reject': '❌ REJEITADO',
      'approve-all': '✅ APROVADOS TODOS',
      'reject-all': '❌ REJEITADOS TODOS',
    }[entry.action];

    const color = entry.action.startsWith('approve') ? C.green : C.red;

    console.log(`  ${C.cyan}${new Date(entry.timestamp).toLocaleString('pt-BR')}${C.reset}`);
    console.log(`  ${color}${actionLabel}${C.reset} ${C.dim}por ${entry.reviewer}${C.reset}`);
    console.log(`  ${C.dim}Arquivos: ${entry.files.join(', ')}${C.reset}`);
    if (entry.comment) {
      console.log(`  ${C.dim}Comentário: "${entry.comment}"${C.reset}`);
    }
    console.log(`  ${C.dim}ID: ${entry.id}${C.reset}`);
    console.log();
  }

  console.log(`${C.dim}Mostrando ${history.length} registros mais recentes.${C.reset}\n`);
}

function cli() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Uso: node tests/review.js [opções]

Opções:
  --status                 Exibir status atual de todos os arquivos
  --approve-all            Aprovar todas as alterações (atualiza baselines)
  --reject-all             Rejeitar todas as alterações (mantém baselines)
  --approve <nome>         Aprovar alteração de um arquivo específico
  --reject  <nome>         Rejeitar alteração de um arquivo específico
  --history                Exibir histórico de reviews
  --history --limit <n>    Limitar histórico a N registros
  --reset                  Resetar todos os status para pendente
  --comment "texto"        Adicionar comentário ao review

Exemplos:
  node tests/review.js --status
  node tests/review.js --approve-all --comment "Design aprovado pela equipe"
  node tests/review.js --approve dashboard-desktop-1366w
  node tests/review.js --reject dashboard-mobile-360w --comment "Botão desalinhado"
  node tests/review.js --history --limit 5
`);
    return;
  }

  const comment = args.includes('--comment')
    ? args[args.indexOf('--comment') + 1] || ''
    : '';

  if (args.includes('--status')) {
    printStatus();
    return;
  }

  if (args.includes('--history')) {
    const limitIdx = args.indexOf('--limit');
    const limit    = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) || 50 : 50;
    printHistory(limit);
    return;
  }

  if (args.includes('--reset')) {
    resetAll();
    console.log('✅ Todos os status foram resetados para pendente.');
    return;
  }

  if (args.includes('--approve-all')) {
    const result = approveAll(comment);
    console.log(`\n✅ ${result.count} arquivo(s) aprovados e baselines atualizadas.`);
    result.files.forEach((f) => console.log(`   ✅ ${f}`));
    console.log();
    return;
  }

  if (args.includes('--reject-all')) {
    const result = rejectAll(comment);
    console.log(`\n❌ ${result.count} arquivo(s) rejeitados (baselines mantidas).`);
    result.files.forEach((f) => console.log(`   ❌ ${f}`));
    console.log();
    return;
  }

  if (args.includes('--approve')) {
    const name = args[args.indexOf('--approve') + 1];
    if (!name || name.startsWith('--')) {
      console.error('Informe o nome da imagem. Ex: --approve dashboard-desktop-1366w');
      process.exit(1);
    }
    const available = getPendingFiles();
    if (!available.includes(name)) {
      console.error(`Imagem "${name}" não encontrada nas comparações.`);
      console.log('Disponíveis:', available.join(', '));
      process.exit(1);
    }
    const result = reviewFile(name, 'approve', comment);
    console.log(`\n✅ "${name}" aprovado e baseline atualizada.`);
    console.log(`   Revisado por: ${result.reviewedBy} em ${new Date(result.reviewedAt).toLocaleString('pt-BR')}\n`);
    return;
  }

  if (args.includes('--reject')) {
    const name = args[args.indexOf('--reject') + 1];
    if (!name || name.startsWith('--')) {
      console.error('Informe o nome da imagem. Ex: --reject dashboard-mobile-360w');
      process.exit(1);
    }
    const available = getPendingFiles();
    if (!available.includes(name)) {
      console.error(`Imagem "${name}" não encontrada nas comparações.`);
      console.log('Disponíveis:', available.join(', '));
      process.exit(1);
    }
    const result = reviewFile(name, 'reject', comment);
    console.log(`\n❌ "${name}" rejeitado (baseline mantida).`);
    console.log(`   Revisado por: ${result.reviewedBy} em ${new Date(result.reviewedAt).toLocaleString('pt-BR')}\n`);
    return;
  }

  console.error('Opção desconhecida. Use --help para ver as opções disponíveis.');
  process.exit(1);
}

/* ===== Execução direta ===== */
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  cli();
}
