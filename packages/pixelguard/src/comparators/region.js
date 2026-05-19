/**
 * Comparador POR REGIÕES com segmentação em grade e máscaras.
 *
 * Divide a imagem em uma grade configurável (gridCols × gridRows),
 * compara cada célula de forma independente e permite mascarar
 * regiões com conteúdo dinâmico.
 */
import fs   from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

function cellDiffRatio(d1, d2, width, sx, sy, cw, ch, height, channelTol = 25) {
  let diff = 0;
  let total = 0;

  for (let dy = 0; dy < ch; dy++) {
    const py = sy + dy;
    if (py >= height) break;
    for (let dx = 0; dx < cw; dx++) {
      const px = sx + dx;
      if (px >= width) break;

      const off = (py * width + px) * 4;
      const dr = Math.abs(d1[off]     - d2[off]);
      const dg = Math.abs(d1[off + 1] - d2[off + 1]);
      const db = Math.abs(d1[off + 2] - d2[off + 2]);

      total++;
      if (dr > channelTol || dg > channelTol || db > channelTol) diff++;
    }
  }
  return total > 0 ? diff / total : 0;
}

function paintCell(img, width, height, sx, sy, cw, ch, rgba) {
  const [r, g, b, a] = rgba;
  const alpha = a / 255;

  for (let dy = 0; dy < ch; dy++) {
    const py = sy + dy;
    if (py >= height) break;
    for (let dx = 0; dx < cw; dx++) {
      const px = sx + dx;
      if (px >= width) break;
      const off = (py * width + px) * 4;
      img.data[off]     = Math.round(img.data[off]     * (1 - alpha) + r * alpha);
      img.data[off + 1] = Math.round(img.data[off + 1] * (1 - alpha) + g * alpha);
      img.data[off + 2] = Math.round(img.data[off + 2] * (1 - alpha) + b * alpha);
    }
  }
}

function drawBorder(img, width, height, sx, sy, cw, ch, rgba) {
  const [r, g, b] = rgba;
  const set = (px, py) => {
    if (px >= width || py >= height) return;
    const off = (py * width + px) * 4;
    img.data[off] = r; img.data[off + 1] = g; img.data[off + 2] = b; img.data[off + 3] = 255;
  };
  for (let dx = 0; dx < cw; dx++) { set(sx + dx, sy); set(sx + dx, sy + ch - 1); }
  for (let dy = 0; dy < ch; dy++) { set(sx, sy + dy); set(sx + cw - 1, sy + dy); }
}

/**
 * Compara duas imagens por regiões.
 *
 * @param {string} baselinePath
 * @param {string} currentPath
 * @param {object} options
 * @param {string}   [options.diffPath]
 * @param {number}   [options.gridCols=4]
 * @param {number}   [options.gridRows=6]
 * @param {number}   [options.maxDiffPercent=5]
 * @param {Array}    [options.masks=[]]   Células a mascarar [{row, col}].
 * @returns {Promise<object>}
 */
export async function compare(baselinePath, currentPath, options = {}) {
  const {
    gridCols = 4,
    gridRows = 6,
    maxDiffPercent = 5.0,
    masks = [],
    diffPath,
  } = options;

  const start = performance.now();

  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const current  = PNG.sync.read(fs.readFileSync(currentPath));

  if (baseline.width !== current.width || baseline.height !== current.height) {
    return {
      technique: 'region',
      passed: false,
      score: 0,
      error: `Dimensoes diferentes: ${baseline.width}x${baseline.height} vs ${current.width}x${current.height}`,
      executionMs: Math.round(performance.now() - start),
    };
  }

  const { width, height } = baseline;
  const cellW = Math.floor(width  / gridCols);
  const cellH = Math.floor(height / gridRows);

  const regions       = [];
  let failedRegions   = 0;
  let maskedRegions   = 0;
  let totalActive     = 0;

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const isMasked = masks.some((m) => m.row === row && m.col === col);

      if (isMasked) {
        regions.push({ row, col, status: 'masked', diffPercent: 0 });
        maskedRegions++;
        continue;
      }

      totalActive++;
      const ratio   = cellDiffRatio(baseline.data, current.data, width, col * cellW, row * cellH, cellW, cellH, height);
      const pct     = ratio * 100;
      const ok      = pct <= maxDiffPercent;
      if (!ok) failedRegions++;

      regions.push({
        row,
        col,
        status:      ok ? 'passed' : 'failed',
        diffPercent: Math.round(pct * 100) / 100,
      });
    }
  }

  if (diffPath) {
    const diff = new PNG({ width, height });
    baseline.data.copy(diff.data);

    for (const reg of regions) {
      const sx = reg.col * cellW;
      const sy = reg.row * cellH;

      const overlay =
        reg.status === 'masked' ? [128, 128, 128, 100] :
        reg.status === 'failed' ? [255,   0,   0, 100] :
                                  [  0, 200,   0,  40];

      paintCell(diff, width, height, sx, sy, cellW, cellH, overlay);
      drawBorder(diff, width, height, sx, sy, cellW, cellH, [80, 80, 80]);
    }

    fs.mkdirSync(path.dirname(diffPath), { recursive: true });
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
  }

  const passed = failedRegions === 0;
  const score  = totalActive > 0 ? (totalActive - failedRegions) / totalActive : 1;

  return {
    technique: 'region',
    passed,
    score:         Math.round(score * 10000) / 10000,
    totalRegions:  gridCols * gridRows,
    activeRegions: totalActive,
    maskedRegions,
    failedRegions,
    regions,
    diffImagePath: diffPath || null,
    executionMs:   Math.round(performance.now() - start),
  };
}
