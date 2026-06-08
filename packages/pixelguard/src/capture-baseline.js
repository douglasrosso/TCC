/**
 * PixelGuard — Baseline Capture via Git Worktree
 *
 * Fetches origin/<baseBranch>, creates an isolated git worktree,
 * captures screenshots from that branch, then cleans up.
 * Both baseline and current screenshots are captured in the same
 * environment (same machine, same browser), eliminating cross-environment noise.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { capture } from './capture.js';
import { loadConfig } from './config.js';

/**
 * Capture baseline screenshots from origin/<baseBranch> using a git worktree.
 *
 * @param {object} [options]
 * @param {object} [options.config]  Pre-loaded config.
 * @returns {Promise<string[]>} Paths of captured baseline screenshots.
 */
export async function captureBaseline(options = {}) {
  const config = options.config || await loadConfig();
  const baseBranch = config.baseBranch || 'main';
  const baselineDir = path.join(config.resultsDir, 'baseline');
  const worktreePath = path.join(os.tmpdir(), `pixelguard-baseline-${Date.now()}`);

  console.log(`  Buscando origin/${baseBranch}...`);
  try {
    execSync(`git fetch origin ${baseBranch}`, { stdio: 'pipe' });
  } catch (e) {
    throw new Error(`git fetch origin ${baseBranch} falhou. Verifique sua conexão e o nome da branch.\n${e.message}`);
  }

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
      outDir: baselineDir,
    });
    console.log(`    ${files.length} screenshots de baseline capturados.`);
    return files;
  } finally {
    // Remove apenas o junction/symlink — NÃO o node_modules de origem.
    // No Windows: `rmdir` remove o link sem tocar no alvo.
    // No Unix: `fs.unlinkSync` remove o symlink sem tocar no alvo.
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
