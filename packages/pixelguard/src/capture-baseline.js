/**
 * PixelGuard — Baseline Capture via Git Worktree
 *
 * Fetches origin/<baseBranch>, creates an isolated git worktree,
 * captures screenshots from that branch, then cleans up.
 * Both baseline and current screenshots are captured in the same
 * environment (same machine, same browser), eliminating cross-environment noise.
 *
 * Fallback: when not inside a git repo or when no "origin" remote exists,
 * falls back to local baselines from config.baselinesDir (if present).
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { capture } from './capture.js';
import { loadConfig } from './config.js';

function tryExec(cmd) {
  try { execSync(cmd, { stdio: 'pipe' }); return true; } catch { return false; }
}

/**
 * Capture baseline screenshots.
 *
 * Uses a git worktree against origin/<baseBranch> when available.
 * Falls back to config.baselinesDir when git or remote is unavailable.
 *
 * @param {object} [options]
 * @param {object} [options.config]  Pre-loaded config.
 * @returns {Promise<{ baselineDir: string, method: 'worktree' | 'local' }>}
 */
export async function captureBaseline(options = {}) {
  const config = options.config || await loadConfig();
  const baseBranch = config.baseBranch || 'main';
  const worktreeBaselineDir = path.join(config.resultsDir, 'baseline');
  const worktreePath = path.join(os.tmpdir(), `pixelguard-baseline-${Date.now()}`);

  const inGitRepo  = tryExec('git rev-parse --git-dir');
  const hasRemote  = inGitRepo && tryExec('git remote get-url origin');

  if (inGitRepo && hasRemote) {
    console.log(`  Buscando origin/${baseBranch}...`);
    const fetched = tryExec(`git fetch origin ${baseBranch}`);

    if (fetched) {
      console.log(`  Criando worktree de origin/${baseBranch}...`);
      execSync(`git worktree add "${worktreePath}" origin/${baseBranch}`);

      // Vincula node_modules ao worktree para que o Vite resolva dependências sem npm install.
      // Usa 'junction' no Windows (sem privilégios de admin) e symlink 'dir' em outros SOs.
      const nodeModulesSrc = path.resolve(process.cwd(), 'node_modules');
      const nodeModulesDst = path.join(worktreePath, 'node_modules');
      const symlinkType = process.platform === 'win32' ? 'junction' : 'dir';
      fs.symlinkSync(nodeModulesSrc, nodeModulesDst, symlinkType);

      try {
        const files = await capture({
          config: { ...config, port: config.port + 1 },
          root: worktreePath,
          outDir: worktreeBaselineDir,
        });
        console.log(`    ${files.length} screenshots de baseline capturados.`);
        return { baselineDir: worktreeBaselineDir, method: 'worktree' };
      } finally {
        try {
          if (process.platform === 'win32') {
            execSync(`rmdir "${nodeModulesDst}"`, { stdio: 'pipe' });
          } else {
            fs.unlinkSync(nodeModulesDst);
          }
        } catch { /* ignore */ }
        try { execSync(`git worktree remove "${worktreePath}" --force`); } catch { /* ignore */ }
      }
    }
  }

  // ── Fallback para baselines locais ─────────────────────────────────────────
  if (!inGitRepo) {
    console.warn('\n  ⚠  Não está dentro de um repositório git.');
  } else if (!hasRemote) {
    console.warn('\n  ⚠  Remote "origin" não encontrado (projeto ainda não publicado).');
  } else {
    console.warn(`\n  ⚠  git fetch origin ${baseBranch} falhou (branch ou conexão indisponível).`);
  }

  const localDir = config.baselinesDir;
  const hasLocalBaselines =
    fs.existsSync(localDir) &&
    fs.readdirSync(localDir).some((f) => f.endsWith('.png'));

  if (hasLocalBaselines) {
    console.warn(`  Usando baselines locais de "${localDir}".`);
    console.warn('  Dica: conecte ao remote e execute novamente para usar worktree.\n');
    return { baselineDir: localDir, method: 'local' };
  }

  throw new Error(
    `Sem git remote e sem baselines locais em "${localDir}".\n` +
    `Para criar baselines locais execute:\n` +
    `  npx pixelguard capture\n` +
    `  npx pixelguard update-baselines`,
  );
}
