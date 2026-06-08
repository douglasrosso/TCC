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

  // Link node_modules so the worktree's Vite can resolve dependencies without npm install.
  // Uses 'junction' on Windows (no elevation required) and 'dir' symlink elsewhere.
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
    // Remove only the junction/symlink — NOT the target node_modules.
    // On Windows: `rmdir` removes a junction link without touching its target.
    // On Unix: `fs.unlinkSync` removes a symlink without touching its target.
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
