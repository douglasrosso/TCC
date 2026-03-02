/**
 * Copia as capturas atuais (results/current/) para baselines/.
 * Usado para definir ou atualizar as imagens de referência.
 *
 * Uso:  node scripts/update-baselines.js
 *       npm run update-baselines
 */
import fs   from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname    = path.dirname(fileURLToPath(import.meta.url));
const CURRENT_DIR  = path.resolve(__dirname, '..', 'results', 'current');
const BASELINES    = path.resolve(__dirname, '..', 'baselines');

if (!fs.existsSync(CURRENT_DIR)) {
  console.error('Pasta results/current/ nao encontrada.');
  console.error('Execute primeiro:  npm run capture');
  process.exit(1);
}

fs.mkdirSync(BASELINES, { recursive: true });

const files = fs.readdirSync(CURRENT_DIR).filter((f) => f.endsWith('.png'));

if (files.length === 0) {
  console.log('Nenhuma imagem PNG em results/current/.');
  process.exit(0);
}

for (const file of files) {
  fs.copyFileSync(path.join(CURRENT_DIR, file), path.join(BASELINES, file));
}

console.log(`Baselines atualizadas (${files.length} imagens):`);
files.forEach((f) => console.log('  ' + f));
console.log('\nLembre-se de fazer commit das baselines no Git.');
