/** @type {import('pixelguard').PixelGuardConfig} */
export default {
  // Use Vite auto-start (baseUrl null)
  baseUrl: null,
  port: 3050,

  viewports: [
    { name: 'mobile',  width: 360,  height: 640  },
    { name: 'tablet',  width: 768,  height: 1024 },
    { name: 'desktop', width: 1366, height: 768  },
  ],

  pages: [
    { name: 'dashboard', path: '/' },
  ],

  thresholds: {
    pixel:  { tolerance: 0.1, maxDiffPercent: 0.1 },
    ssim:   { minScore: 0.98, blockSize: 8 },
    region: { gridCols: 4, gridRows: 6, maxDiffPercent: 1.0 },
  },

  masks: [],

  // Comparators to run (any combination of 'pixel', 'ssim', 'region')
  comparators: ['pixel', 'ssim', 'region'],

  baselinesDir: 'baselines',
  resultsDir: 'results',

  freeze: true,
  reviewPort: 3060,
};
