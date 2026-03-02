/**
 * Comparador SSIM — Structural Similarity Index
 *
 * Métrica perceptual que considera luminância, contraste e estrutura,
 * aproximando a comparação da percepção humana (Wang et al., 2004).
 *
 * Implementação própria com blocos não sobrepostos para clareza e
 * eficiência. Produz um mapa de calor (heatmap) indicando a qualidade
 * estrutural por bloco.
 *
 * Constantes padrão:
 *   K1 = 0.01,  K2 = 0.03,  L = 255
 *   C1 = (K1·L)² = 6.5025,  C2 = (K2·L)² = 58.5225
 */
import fs   from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';

/* ===== Constantes SSIM ===== */
const K1 = 0.01;
const K2 = 0.03;
const L  = 255;
const C1 = (K1 * L) ** 2;   // 6.5025
const C2 = (K2 * L) ** 2;   // 58.5225

/* ===== Funções auxiliares ===== */

/** Converte RGBA → luminância (ITU-R BT.709). */
function toGrayscale(data, width, height) {
  const gray = new Float64Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const off = i * 4;
    gray[i] = 0.2126 * data[off] + 0.7152 * data[off + 1] + 0.0722 * data[off + 2];
  }
  return gray;
}

/** SSIM de um bloco individual. */
function blockSSIM(g1, g2, width, sx, sy, bs) {
  const n = bs * bs;
  let m1 = 0, m2 = 0;

  for (let dy = 0; dy < bs; dy++) {
    for (let dx = 0; dx < bs; dx++) {
      const idx = (sy + dy) * width + (sx + dx);
      m1 += g1[idx];
      m2 += g2[idx];
    }
  }
  m1 /= n;
  m2 /= n;

  let v1 = 0, v2 = 0, cov = 0;
  for (let dy = 0; dy < bs; dy++) {
    for (let dx = 0; dx < bs; dx++) {
      const idx = (sy + dy) * width + (sx + dx);
      const d1  = g1[idx] - m1;
      const d2  = g2[idx] - m2;
      v1  += d1 * d1;
      v2  += d2 * d2;
      cov += d1 * d2;
    }
  }
  v1  /= n - 1;
  v2  /= n - 1;
  cov /= n - 1;

  return ((2 * m1 * m2 + C1) * (2 * cov + C2)) /
         ((m1 ** 2 + m2 ** 2 + C1) * (v1 + v2 + C2));
}

/** Calcula MSSIM e mapa de blocos. */
function computeSSIM(data1, data2, width, height, blockSize) {
  const g1 = toGrayscale(data1, width, height);
  const g2 = toGrayscale(data2, width, height);

  const bx = Math.floor(width  / blockSize);
  const by = Math.floor(height / blockSize);
  const map = new Float64Array(bx * by);
  let sum = 0;

  for (let row = 0; row < by; row++) {
    for (let col = 0; col < bx; col++) {
      const s = blockSSIM(g1, g2, width, col * blockSize, row * blockSize, blockSize);
      map[row * bx + col] = s;
      sum += s;
    }
  }

  return { mssim: sum / (bx * by), map, blocksX: bx, blocksY: by };
}

/** Mapeia SSIM (0–1) para cor RGBA. */
function ssimColor(s) {
  if (s >= 0.99) return [0, 200, 0,   50];   // quase idêntico
  if (s >= 0.95) return [255, 255, 0, 150];   // leve
  if (s >= 0.90) return [255, 165, 0, 200];   // moderado
  return                [255, 0,   0, 220];   // significativo
}

/** Gera imagem heatmap a partir do mapa SSIM. */
function buildHeatmap(ssimResult, width, height, blockSize) {
  const { map, blocksX, blocksY } = ssimResult;
  const img = new PNG({ width, height });

  // fundo transparente
  img.data.fill(0);

  for (let row = 0; row < blocksY; row++) {
    for (let col = 0; col < blocksX; col++) {
      const [r, g, b, a] = ssimColor(map[row * blocksX + col]);
      for (let dy = 0; dy < blockSize; dy++) {
        for (let dx = 0; dx < blockSize; dx++) {
          const px = col * blockSize + dx;
          const py = row * blockSize + dy;
          if (px >= width || py >= height) continue;
          const off = (py * width + px) * 4;
          img.data[off]     = r;
          img.data[off + 1] = g;
          img.data[off + 2] = b;
          img.data[off + 3] = a;
        }
      }
    }
  }
  return img;
}

/* ===== Função pública ===== */

/**
 * Compara duas imagens usando SSIM.
 *
 * @param {string} baselinePath
 * @param {string} currentPath
 * @param {object} options
 * @param {string} [options.diffPath]         Caminho para salvar heatmap.
 * @param {number} [options.minScore=0.95]    MSSIM mínimo aceitável.
 * @param {number} [options.blockSize=8]      Tamanho do bloco em pixels.
 * @returns {Promise<object>}
 */
export async function compare(baselinePath, currentPath, options = {}) {
  const { minScore = 0.95, blockSize = 8, diffPath } = options;
  const start = performance.now();

  const baseline = PNG.sync.read(fs.readFileSync(baselinePath));
  const current  = PNG.sync.read(fs.readFileSync(currentPath));

  if (baseline.width !== current.width || baseline.height !== current.height) {
    return {
      technique: 'ssim',
      passed: false,
      score: 0,
      error: `Dimensoes diferentes: ${baseline.width}x${baseline.height} vs ${current.width}x${current.height}`,
      executionMs: Math.round(performance.now() - start),
    };
  }

  const { width, height } = baseline;
  const result  = computeSSIM(baseline.data, current.data, width, height, blockSize);
  const heatmap = buildHeatmap(result, width, height, blockSize);

  if (diffPath) {
    fs.mkdirSync(path.dirname(diffPath), { recursive: true });
    fs.writeFileSync(diffPath, PNG.sync.write(heatmap));
  }

  /* Contagem de blocos abaixo do limiar */
  let lowBlocks = 0;
  for (let i = 0; i < result.map.length; i++) {
    if (result.map[i] < minScore) lowBlocks++;
  }

  const totalBlocks = result.blocksX * result.blocksY;
  const passed = result.mssim >= minScore;

  return {
    technique: 'ssim',
    passed,
    score:       Math.round(result.mssim * 10000) / 10000,
    mssim:       result.mssim,
    totalBlocks,
    lowBlocks,
    diffPercent: Math.round((lowBlocks / totalBlocks) * 100 * 100) / 100,
    diffImagePath: diffPath || null,
    executionMs:   Math.round(performance.now() - start),
  };
}
