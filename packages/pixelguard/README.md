# PixelGuard

Visual regression testing with three comparison techniques: **Pixel-by-pixel**, **SSIM**, and **Region-based**.

## Quick Start

```bash
# Install
npm install pixelguard playwright

# Create config file
npx pixelguard init

# Edit pixelguard.config.js with your pages and viewports

# First run — capture baselines
npx pixelguard capture
npx pixelguard update-baselines

# After changes — run the full test pipeline
npx pixelguard test
```

## CLI Commands

| Command                           | Description                                   |
| --------------------------------- | --------------------------------------------- |
| `npx pixelguard init`             | Create `pixelguard.config.js` in your project |
| `npx pixelguard capture`          | Capture screenshots of your app               |
| `npx pixelguard compare`          | Compare current screenshots against baselines |
| `npx pixelguard report`           | Generate an HTML report                       |
| `npx pixelguard update-baselines` | Copy current screenshots to baselines/        |
| `npx pixelguard test`             | Full pipeline: capture → compare → report     |
| `npx pixelguard review`           | Start the review UI server                    |

## Configuration

Create a `pixelguard.config.js` at the root of your project:

```js
export default {
  // URL of your running app. If null, PixelGuard starts Vite automatically.
  baseUrl: null,

  // Vite dev server port (only when baseUrl is null).
  port: 8000,

  // Viewports to capture.
  viewports: [
    { name: "desktop", width: 1366, height: 768 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "mobile", width: 360, height: 640 },
  ],

  // Pages to capture.
  pages: [
    { name: "home", path: "/" },
    { name: "about", path: "/about" },
  ],

  // Thresholds per comparison technique.
  thresholds: {
    pixel: { tolerance: 0.1, maxDiffPercent: 0.1 },
    ssim: { minScore: 0.98, blockSize: 8 },
    region: { gridCols: 4, gridRows: 6, maxDiffPercent: 1.0 },
  },

  // Region masks — grid cells to skip.
  masks: [],

  // Which comparators to run (any combination of 'pixel', 'ssim', 'region').
  comparators: ["pixel", "ssim", "region"],

  // Output directories (relative to project root).
  baselinesDir: "baselines",
  resultsDir: "results",

  // Freeze Date and Math.random for deterministic captures.
  freeze: true,

  // Review UI server port.
  reviewPort: 8080,
};
```

## Programmatic API

```js
import {
  capture,
  runComparisons,
  generateReport,
  loadConfig,
} from "pixelguard";

const config = await loadConfig();
await capture({ config });
const results = await runComparisons({ config });
await generateReport({ config });
```

### Comparators

```js
import { pixelCompare, ssimCompare, regionCompare } from "pixelguard";

const result = await pixelCompare("baseline.png", "current.png", {
  tolerance: 0.1,
  maxDiffPercent: 0.5,
  diffPath: "diff.png",
});
```

## npm Scripts

Add to your `package.json`:

```json
{
  "scripts": {
    "vrt": "pixelguard test",
    "vrt:capture": "pixelguard capture",
    "vrt:compare": "pixelguard compare",
    "vrt:report": "pixelguard report",
    "vrt:update": "pixelguard update-baselines",
    "vrt:review": "pixelguard review"
  }
}
```

## How It Works

1. **Capture** — Playwright opens your app in a headless browser and takes full-page screenshots for each page/viewport combination
2. **Compare** — Three techniques run in parallel on each screenshot pair:
   - **Pixel**: Exact pixel comparison via pixelmatch
   - **SSIM**: Structural similarity index (perceptual)
   - **Region**: Grid-based comparison with masking support
3. **Report** — A self-contained HTML report is generated with all results and diff images
