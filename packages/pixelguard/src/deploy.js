/**
 * PixelGuard Deploy — Builds the review UI and prepares a static deploy folder.
 *
 * Used by CI (GitHub Actions) to publish the review UI to GitHub Pages.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadConfig } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, '..');

/**
 * Builds a static deploy folder ready for GitHub Pages.
 *
 * @param {object}  options
 * @param {string}  options.prNumber   PR number (used in folder name)
 * @param {string}  [options.outDir]   Output base dir (default: cwd/deploy)
 * @param {object}  [options.config]   PixelGuard config (auto-loaded if omitted)
 * @returns {string} Path to the built deploy folder
 */
export async function buildDeploy({ prNumber, outDir, config } = {}) {
  if (!config) config = await loadConfig();

  const resultsDir = path.resolve(config.resultsDir || 'results');
  const baselinesDir = path.resolve(config.baselinesDir || 'baselines');
  const deployBase = outDir || path.resolve(process.cwd(), 'deploy');
  const deployDir = path.join(deployBase, `pr-${prNumber || '0'}`);
  fs.mkdirSync(deployDir, { recursive: true });

  // 1. Build the React review UI
  const reviewDir = path.resolve(PKG_ROOT, 'review');
  console.log('Building PixelGuard Review app...');
  execSync('npx vite build', {
    cwd: reviewDir,
    stdio: 'inherit',
    env: { ...process.env, STATIC_DEPLOY: 'true' },
  });

  // 2. Copy Vite build output to deploy folder
  const distDir = path.join(reviewDir, 'dist');
  fs.cpSync(distDir, deployDir, { recursive: true });

  // 3. Read results.json and meta.json
  const resultsJson = path.join(resultsDir, 'results.json');
  const metaJson = path.join(resultsDir, 'meta.json');
  const results = fs.existsSync(resultsJson)
    ? JSON.parse(fs.readFileSync(resultsJson, 'utf-8'))
    : {};
  const meta = fs.existsSync(metaJson)
    ? JSON.parse(fs.readFileSync(metaJson, 'utf-8'))
    : {};

  // 4. Inject static data into index.html
  const indexPath = path.join(deployDir, 'index.html');
  let html = fs.readFileSync(indexPath, 'utf-8');
  const staticData = JSON.stringify({ results, meta, status: [] });
  html = html.replace(
    '</head>',
    `<script>window.__PIXELGUARD_STATIC__=${staticData};</script>\n</head>`,
  );
  fs.writeFileSync(indexPath, html);

  // 5. Copy baselines → img/baseline/
  const blDst = path.join(deployDir, 'img', 'baseline');
  fs.mkdirSync(blDst, { recursive: true });
  if (fs.existsSync(baselinesDir)) {
    for (const f of fs.readdirSync(baselinesDir).filter((f) => f.endsWith('.png'))) {
      fs.copyFileSync(path.join(baselinesDir, f), path.join(blDst, f));
    }
  }

  // 6. Copy current → img/current/
  const curSrc = path.join(resultsDir, 'current');
  const curDst = path.join(deployDir, 'img', 'current');
  fs.mkdirSync(curDst, { recursive: true });
  if (fs.existsSync(curSrc)) {
    for (const f of fs.readdirSync(curSrc).filter((f) => f.endsWith('.png'))) {
      fs.copyFileSync(path.join(curSrc, f), path.join(curDst, f));
    }
  }

  // 7. Copy diffs → img/diff/{tech}/
  const techs = results.comparators
    || Object.keys(results.summary?.techniques || {})
    || ['pixel', 'ssim', 'region'];
  for (const tech of techs) {
    const diffSrc = path.join(resultsDir, 'diffs', tech);
    const diffDst = path.join(deployDir, 'img', 'diff', tech);
    fs.mkdirSync(diffDst, { recursive: true });
    if (fs.existsSync(diffSrc)) {
      for (const f of fs.readdirSync(diffSrc).filter((f) => f.endsWith('.png'))) {
        fs.copyFileSync(path.join(diffSrc, f), path.join(diffDst, f));
      }
    }
  }

  // 8. Also copy scenario images if they exist
  const scenarioBaseline = path.join(resultsDir, 'scenarios', 'baseline');
  const scenarioCurrent = path.join(resultsDir, 'scenarios', 'current');
  const scenarioDiffs = path.join(resultsDir, 'scenarios', 'diffs');

  if (fs.existsSync(scenarioBaseline)) {
    const dst = path.join(deployDir, 'img', 'scenarios', 'baseline');
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(scenarioBaseline).filter((f) => f.endsWith('.png'))) {
      fs.copyFileSync(path.join(scenarioBaseline, f), path.join(dst, f));
    }
  }

  if (fs.existsSync(scenarioCurrent)) {
    const dst = path.join(deployDir, 'img', 'scenarios', 'current');
    fs.mkdirSync(dst, { recursive: true });
    for (const f of fs.readdirSync(scenarioCurrent).filter((f) => f.endsWith('.png'))) {
      fs.copyFileSync(path.join(scenarioCurrent, f), path.join(dst, f));
    }
  }

  if (fs.existsSync(scenarioDiffs)) {
    for (const tech of ['pixel', 'ssim', 'region']) {
      const src = path.join(scenarioDiffs, tech);
      const dst = path.join(deployDir, 'img', 'scenarios', 'diff', tech);
      fs.mkdirSync(dst, { recursive: true });
      if (fs.existsSync(src)) {
        for (const f of fs.readdirSync(src).filter((f) => f.endsWith('.png'))) {
          fs.copyFileSync(path.join(src, f), path.join(dst, f));
        }
      }
    }
  }

  console.log(`Deploy montado em: ${deployDir}`);
  return deployDir;
}
