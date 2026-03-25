/**
 * PixelGuard — Public API
 *
 * Usage:
 *   import { capture, runComparisons, generateReport } from 'pixelguard';
 */
export { capture }            from './capture.js';
export { runComparisons }     from './compare.js';
export { generateReport }     from './report.js';
export { updateBaselines }    from './update-baselines.js';
export { loadConfig, configTemplate } from './config.js';
export { compare as pixelCompare }    from './comparators/pixel.js';
export { compare as ssimCompare }     from './comparators/ssim.js';
export { compare as regionCompare }   from './comparators/region.js';
