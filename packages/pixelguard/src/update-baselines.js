/**
 * PixelGuard — Update Baselines
 *
 * Copies all .png files from results/current/ to baselines/.
 */
import fs   from 'node:fs';
import path from 'node:path';
import { loadConfig } from './config.js';

/**
 * Copy current screenshots to baselines directory.
 *
 * @param {object} [options]
 * @param {object} [options.config]  Pre-loaded config.
 */
export async function updateBaselines(options = {}) {
  const config = options.config || await loadConfig();
  const CURRENT_DIR = path.join(config.resultsDir, 'current');
  const BASELINES   = config.baselinesDir;

  if (!fs.existsSync(CURRENT_DIR)) {
    console.error(`Pasta ${CURRENT_DIR} nao encontrada.`);
    console.error('Execute primeiro:  npx pixelguard capture');
    process.exit(1);
  }

  fs.mkdirSync(BASELINES, { recursive: true });

  const files = fs.readdirSync(CURRENT_DIR).filter((f) => f.endsWith('.png'));

  if (files.length === 0) {
    console.log('Nenhuma imagem PNG encontrada.');
    process.exit(0);
  }

  for (const file of files) {
    fs.copyFileSync(path.join(CURRENT_DIR, file), path.join(BASELINES, file));
  }

  console.log(`Baselines atualizadas (${files.length} imagens):`);
  files.forEach((f) => console.log('  ' + f));
}
