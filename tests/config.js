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

/* ===== Mutações para avaliação ===== */
export const mutations = {
  'font-size': {
    type: 'css',
    content: 'body { font-size: 20px !important; } h1, h2, h3, h4, h5, h6 { font-size: 2.5rem !important; }',
    description: 'Alteração no tamanho da fonte',
  },
  'color': {
    type: 'css',
    content:
      '.MuiAppBar-root { background-color: #e74c3c !important; } ' +
      '.MuiTypography-colorPrimary, .MuiTypography-root.MuiTypography-h4[style] { color: #e74c3c !important; } ' +
      '[class*="MuiCardContent"] .MuiTypography-h4 { color: #e74c3c !important; }',
    description: 'Alteração na cor primária',
  },
  'spacing': {
    type: 'css',
    content:
      '.MuiCard-root { padding: 2rem !important; } ' +
      '.MuiGrid-container { gap: 2rem !important; } ' +
      '.MuiContainer-root { padding: 3rem !important; }',
    description: 'Alteração no espaçamento dos componentes',
  },
  'displacement': {
    type: 'css',
    content:
      '.MuiToolbar-root { padding-left: 60px !important; } ' +
      '.MuiContainer-root { margin-left: 40px !important; }',
    description: 'Deslocamento de elementos',
  },
  'layout-break': {
    type: 'css',
    content:
      '[style*="flex-wrap"] { flex-direction: column !important; } ' +
      '[style*="flex-wrap"] > * { flex: 1 1 100% !important; max-width: 100% !important; }',
    description: 'Quebra de layout (colunas → pilha)',
  },
  'dynamic-content': {
    type: 'script',
    content: `
      const dateEl = document.getElementById('current-date') || document.querySelector('[data-testid="current-date"]');
      const timeEl = document.getElementById('current-time') || document.querySelector('[data-testid="current-time"]');
      const visitEl = document.getElementById('visit-counter') || document.querySelector('[data-testid="visit-counter"]');
      if (dateEl)  dateEl.textContent = '31/12/2099';
      if (timeEl)  timeEl.textContent = '23:59:59';
      if (visitEl) visitEl.textContent = '999';
    `,
    description: 'Alteração em conteúdo dinâmico (data, hora, contador)',
  },
};
