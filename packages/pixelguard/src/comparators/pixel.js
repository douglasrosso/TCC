/**
 * Comparador PIXEL A PIXEL
 *
 * Marca qualquer variação numérica acima de um limiar de tolerância.
 * Baseado no pacote pixelmatch (anti-aliased aware).
 */
import fs   from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

/**
 * Compara duas imagens pixel a pixel.
 *
 * @param {string} baselinePath  Caminho da imagem de referência.
 * @param {string} currentPath   Caminho da imagem atual.
 * @param {object} options
 * @param {string} [options.diffPath]       Caminho para salvar a imagem de diferenças.
 * @param {number} [options.tolerance=0.1]  Limiar do pixelmatch (0–1).
 * @param {number} [options.maxDiffPercent=0.5] Percentual máximo aceitável de pixels diferentes.
 * @returns {Promise<object>} Resultado padronizado.
 */
export async function compare(baselinePath, currentPath, options = {}) {
  const { tolerance = 0.1, maxDiffPercent = 0.5, diffPath } = options;
  const start = performance.now();

  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const current  = PNG.sync.read(fs.readFileSync(currentPath));

  if (baseline.width !== current.width || baseline.height !== current.height) {
    return {
      technique: 'pixel',
      passed: false,
      score: 0,
      diffPixels: -1,
      totalPixels: 0,
      diffPercent: 100,
      error: `Dimensoes diferentes: ${baseline.width}x${baseline.height} vs ${current.width}x${current.height}`,
      executionMs: Math.round(performance.now() - start),
    };
  }

  const { width, height } = baseline;
  const diff = new PNG({ width, height });

  const diffPixels  = pixelmatch(baseline.data, current.data, diff.data, width, height, {
    threshold: tolerance,
  });
  const totalPixels = width * height;
  const diffPercent = (diffPixels / totalPixels) * 100;
  const passed      = diffPercent <= maxDiffPercent;

  if (diffPath) {
    fs.mkdirSync(path.dirname(diffPath), { recursive: true });
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }

  return {
    technique: 'pixel',
    passed,
    score: Math.round((1 - diffPercent / 100) * 10000) / 10000,
    diffPixels,
    totalPixels,
    diffPercent: Math.round(diffPercent * 1000) / 1000,
    diffImagePath: diffPath || null,
    executionMs: Math.round(performance.now() - start),
  };
}
