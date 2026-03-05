/**
 * Configuração central do projeto de regressão visual.
 * Define viewports, limiares de aceitação, máscaras e mutações.
 */

/* ===== Viewports representativos ===== */
export const viewports = [
  { name: 'mobile',  width: 360,  height: 640  },
  { name: 'tablet',  width: 768,  height: 1024 },
  { name: 'desktop', width: 1366, height: 768  },
];

/* ===== Páginas a capturar ===== */
export const pages = [
  { name: 'dashboard', path: '/' },
];

/* ===== Limiares de aceitação por técnica ===== */
export const thresholds = {
  pixel:  { tolerance: 0.1, maxDiffPercent: 0.05 },
  ssim:   { minScore: 0.999, blockSize: 8 },
  region: { gridCols: 4, gridRows: 6, maxDiffPercent: 1.0 },
};

/**
 * Máscaras de regiões dinâmicas (abordagem por regiões).
 * Cada entrada indica uma célula da grade que deve ser ignorada
 * por conter conteúdo naturalmente variável.
 *
 * row/col começam em 0, contados a partir do topo esquerdo.
 */
export const masks = [
  // Exemplo: a sidebar de "Informações" ocupa aprox. a coluna 3, linhas 2-5
  // Descomente e ajuste conforme o layout real capturado:
  // { row: 2, col: 3 },
  // { row: 3, col: 3 },
  // { row: 4, col: 3 },
];
