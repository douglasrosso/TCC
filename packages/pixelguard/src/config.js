/**
 * PixelGuard — Configuration loader.
 *
 * Looks for pixelguard.config.js at process.cwd().
 * Falls back to sensible defaults so zero-config works.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const DEFAULTS = {
  /** Base URL of the application to test. If not set, PixelGuard will try to start a vite dev server. */
  baseUrl: null,

  /** Vite dev server port (used only when baseUrl is null). */
  port: 8000,

  /** Viewports to capture. */
  viewports: [{ name: "desktop", width: 1366, height: 768 }],

  /** Pages to capture — path relative to baseUrl. */
  pages: [{ name: "home", path: "/" }],

  /** Threshold settings per technique. */
  thresholds: {
    pixel: { tolerance: 0.1, maxDiffPercent: 0.1 },
    ssim: { minScore: 0.98, blockSize: 8 },
    region: { gridCols: 4, gridRows: 6, maxDiffPercent: 1.0 },
  },

  /** Region masks — cells to ignore. [{row, col}] */
  masks: [],

  /** Which comparators to run. Subset of ['pixel', 'ssim', 'region']. */
  comparators: ["pixel", "ssim", "region"],

  /** Directory for baseline images (relative to cwd). */
  baselinesDir: "baselines",

  /** Directory for results output (relative to cwd). */
  resultsDir: "results",

  /** Freeze Date and Math.random for deterministic captures. */
  freeze: true,

  /** Review server port. */
  reviewPort: 8080,
};

/**
 * Load the user's config, merged with defaults.
 * @returns {Promise<object>}
 */
export async function loadConfig() {
  const cwd = process.cwd();
  const configPath = path.join(cwd, "pixelguard.config.js");

  let userConfig = {};
  if (fs.existsSync(configPath)) {
    const mod = await import(pathToFileURL(configPath).href);
    userConfig = mod.default || mod;
  }

  const config = { ...DEFAULTS, ...userConfig };

  // Merge nested thresholds
  if (userConfig.thresholds) {
    config.thresholds = {
      pixel: { ...DEFAULTS.thresholds.pixel, ...userConfig.thresholds.pixel },
      ssim: { ...DEFAULTS.thresholds.ssim, ...userConfig.thresholds.ssim },
      region: {
        ...DEFAULTS.thresholds.region,
        ...userConfig.thresholds.region,
      },
    };
  }

  // Resolve dirs to absolute
  config.baselinesDir = path.resolve(cwd, config.baselinesDir);
  config.resultsDir = path.resolve(cwd, config.resultsDir);

  return config;
}

/**
 * Returns a minimal config file template string.
 */
export function configTemplate() {
  return `/** @type {import('pixelguard').PixelGuardConfig} */
export default {
  // Base URL of your running app.
  // If null, PixelGuard starts a Vite dev server automatically.
  baseUrl: null,

  // Vite dev server port (only used when baseUrl is null).
  port: 8000,

  // Viewports to capture screenshots for.
  viewports: [
    { name: 'desktop', width: 1366, height: 768 },
    // { name: 'tablet',  width: 768,  height: 1024 },
    // { name: 'mobile',  width: 360,  height: 640  },
  ],

  // Pages to capture — path relative to baseUrl.
  pages: [
    { name: 'home', path: '/' },
  ],

  // Thresholds per comparison technique.
  thresholds: {
    pixel:  { tolerance: 0.1, maxDiffPercent: 0.1 },
    ssim:   { minScore: 0.98, blockSize: 8 },
    region: { gridCols: 4, gridRows: 6, maxDiffPercent: 1.0 },
  },

  // Region masks — cells to skip during region comparison.
  masks: [],

  // Which comparators to run (any combination of 'pixel', 'ssim', 'region').
  comparators: ['pixel', 'ssim', 'region'],

  // Directory paths (relative to project root).
  baselinesDir: 'baselines',
  resultsDir:   'results',

  // Freeze Date/Math.random for deterministic captures.
  freeze: true,

  // Review UI server port.
  reviewPort: 8080,
};
`;
}
