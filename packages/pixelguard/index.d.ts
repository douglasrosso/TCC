// PixelGuard — Type definitions

export interface Viewport {
  /** Nome do viewport (ex: 'mobile', 'tablet', 'desktop') */
  name: string;
  /** Largura em pixels */
  width: number;
  /** Altura em pixels */
  height: number;
}

export interface Page {
  /** Nome identificador da página (ex: 'dashboard', 'login') */
  name: string;
  /** Caminho relativo à baseUrl (ex: '/', '/login') */
  path: string;
}

export interface PixelThresholds {
  /** Sensibilidade do pixelmatch (0–1). Menor = mais sensível. @default 0.1 */
  tolerance?: number;
  /** Porcentagem máxima de pixels diferentes aceitável. @default 0.1 */
  maxDiffPercent?: number;
}

export interface SSIMThresholds {
  /** Score SSIM mínimo (0–1). Menor = mais tolerante. @default 0.98 */
  minScore?: number;
  /** Tamanho do bloco para cálculo SSIM. @default 8 */
  blockSize?: number;
}

export interface RegionThresholds {
  /** Número de colunas da grade. @default 4 */
  gridCols?: number;
  /** Número de linhas da grade. @default 6 */
  gridRows?: number;
  /** Porcentagem máxima de diferença por célula. @default 1.0 */
  maxDiffPercent?: number;
}

export interface Thresholds {
  /** Limiares do comparador pixel a pixel. */
  pixel?: PixelThresholds;
  /** Limiares do comparador SSIM (perceptual). */
  ssim?: SSIMThresholds;
  /** Limiares do comparador de regiões (grade). */
  region?: RegionThresholds;
}

export interface Mask {
  /** Linha da célula na grade (começa em 0). */
  row: number;
  /** Coluna da célula na grade (começa em 0). */
  col: number;
}

export type Comparator = 'pixel' | 'ssim' | 'region';

export interface PixelGuardConfig {
  /**
   * URL base da aplicação a testar.
   * Se `null`, o PixelGuard inicia um servidor Vite automaticamente.
   * @default null
   */
  baseUrl?: string | null;

  /**
   * Porta do servidor Vite (usado apenas quando `baseUrl` é `null`).
   * @default 3050
   */
  port?: number;

  /**
   * Viewports para captura de screenshots.
   * @default [{ name: 'desktop', width: 1366, height: 768 }]
   */
  viewports?: Viewport[];

  /**
   * Páginas a capturar — caminho relativo à `baseUrl`.
   * @default [{ name: 'home', path: '/' }]
   */
  pages?: Page[];

  /**
   * Limiares de aceitação por técnica de comparação.
   */
  thresholds?: Thresholds;

  /**
   * Células da grade a ignorar no comparador de regiões.
   * Útil para áreas com conteúdo dinâmico.
   * @default []
   */
  masks?: Mask[];

  /**
   * Quais comparadores executar.
   * Qualquer combinação de `'pixel'`, `'ssim'` e `'region'`.
   * @default ['pixel', 'ssim', 'region']
   */
  comparators?: Comparator[];

  /**
   * Diretório para imagens de baseline (relativo ao cwd).
   * @default 'baselines'
   */
  baselinesDir?: string;

  /**
   * Diretório para resultados (relativo ao cwd).
   * @default 'results'
   */
  resultsDir?: string;

  /**
   * Congela `Date` e `Math.random` no navegador durante a captura
   * para garantir determinismo entre execuções.
   * @default true
   */
  freeze?: boolean;

  /**
   * Porta do servidor da Review UI.
   * @default 3060
   */
  reviewPort?: number;
}

// --- Public API ---

export function loadConfig(): Promise<PixelGuardConfig>;
export function configTemplate(): string;
export function capture(options?: { config?: PixelGuardConfig; outDir?: string }): Promise<string[]>;
export function runComparisons(options?: { config?: PixelGuardConfig }): Promise<object>;
export function generateReport(options?: { config?: PixelGuardConfig }): Promise<string>;
export function updateBaselines(options?: { config?: PixelGuardConfig }): Promise<void>;

export function pixelCompare(baseline: string, current: string, options?: PixelThresholds & { diffPath?: string }): Promise<object>;
export function ssimCompare(baseline: string, current: string, options?: SSIMThresholds & { diffPath?: string }): Promise<object>;
export function regionCompare(baseline: string, current: string, options?: RegionThresholds & { masks?: Mask[]; diffPath?: string }): Promise<object>;
