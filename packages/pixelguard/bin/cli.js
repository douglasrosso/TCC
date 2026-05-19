#!/usr/bin/env node
/**
 * PixelGuard CLI
 *
 * Usage:
 *   npx pixelguard init                    → create pixelguard.config.js
 *   npx pixelguard capture                 → capture screenshots
 *   npx pixelguard compare                 → run visual comparisons
 *   npx pixelguard report                  → generate HTML report
 *   npx pixelguard update-baselines        → copy current → baselines
 *   npx pixelguard test                    → capture + compare + report (full pipeline)
 *   npx pixelguard review                  → start review UI server
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(__dirname, "..");

const command = process.argv[2];

function printHelp() {
  console.log(`
  PixelGuard — Visual regression testing

  Usage:  npx pixelguard <command>

  Commands:
    init               Create pixelguard.config.js in your project
    capture            Capture screenshots of your app
    compare            Compare current screenshots against baselines
    report             Generate an HTML report from comparison results
    update-baselines   Copy current screenshots to baselines/
    test               Run the full pipeline (capture → compare → report)
    review             Start the review UI server
    deploy             Build review UI and prepare static deploy folder

  Options:
    --help, -h         Show this help message
    --port <n>         Port for the review server (default: 8080)
    --build            Force rebuild of the review UI before starting
    --pr <n>           PR number for deploy folder naming
    --out <dir>        Output directory for capture / deploy
`);
}

async function main() {
  if (!command || command === "--help" || command === "-h") {
    printHelp();
    process.exit(0);
  }

  switch (command) {
    case "init": {
      const { configTemplate } = await import("../src/config.js");
      const dest = path.join(process.cwd(), "pixelguard.config.js");
      if (fs.existsSync(dest)) {
        console.log("pixelguard.config.js already exists.");
        process.exit(0);
      }
      fs.writeFileSync(dest, configTemplate());
      console.log("Created pixelguard.config.js");
      console.log(
        "Edit it to configure your viewports, pages, and thresholds.",
      );
      break;
    }

    case "capture": {
      const { capture } = await import("../src/capture.js");
      const outIdx = process.argv.indexOf("--out");
      const outDir = outIdx !== -1 ? process.argv[outIdx + 1] : undefined;
      const files = await capture({ outDir });
      console.log(`\nCapturas concluidas (${files.length} imagens):`);
      files.forEach((f) => console.log("  " + path.basename(f)));
      break;
    }

    case "compare": {
      const { runComparisons } = await import("../src/compare.js");
      await runComparisons();
      break;
    }

    case "report": {
      const { generateReport } = await import("../src/report.js");
      await generateReport();
      break;
    }

    case "update-baselines": {
      const { updateBaselines } = await import("../src/update-baselines.js");
      await updateBaselines();
      break;
    }

    case "test": {
      console.log("=== PixelGuard: Full pipeline ===\n");

      console.log("1/3 Capturing screenshots...");
      const { capture } = await import("../src/capture.js");
      const { loadConfig } = await import("../src/config.js");
      const config = await loadConfig();

      const files = await capture({ config });
      console.log(`    ${files.length} screenshots captured.\n`);

      console.log("2/3 Running comparisons...");
      const { runComparisons } = await import("../src/compare.js");
      const results = await runComparisons({ config });

      console.log("\n3/3 Generating report...");
      const { generateReport } = await import("../src/report.js");
      await generateReport({ config });

      console.log("\nDone! Open results/report.html to see your report.");

      if (results.summary.failed > 0) {
        console.log(`\n${results.summary.failed} comparison(s) failed.`);
        process.exit(1);
      }
      break;
    }

    case "deploy": {
      const { buildDeploy } = await import("../src/deploy.js");
      const prIdx = process.argv.indexOf("--pr");
      const prNumber = prIdx !== -1 ? process.argv[prIdx + 1] : "0";
      const outIdx = process.argv.indexOf("--out");
      const outDir = outIdx !== -1 ? process.argv[outIdx + 1] : undefined;
      await buildDeploy({ prNumber, outDir });
      break;
    }

    case "review": {
      const { loadConfig } = await import("../src/config.js");
      const config = await loadConfig();
      const portIdx = process.argv.indexOf("--port");
      const port =
        portIdx !== -1
          ? parseInt(process.argv[portIdx + 1], 10)
          : config.reviewPort;

      const reviewDir = path.resolve(PKG_ROOT, "review");
      const reviewDist = path.resolve(reviewDir, "dist");
      const reviewServer = path.resolve(reviewDir, "server", "index.js");

      if (!fs.existsSync(reviewServer)) {
        console.error("Review server not found at:", reviewServer);
        process.exit(1);
      }

      // Auto-build review UI if dist/ is missing, or --build flag is passed
      const distIndex = path.resolve(reviewDist, "index.html");
      const forceBuild = process.argv.includes("--build");
      if (forceBuild || !fs.existsSync(distIndex)) {
        console.log("Building review UI...");
        const { execSync } = await import("node:child_process");
        execSync("npx vite build", { cwd: reviewDir, stdio: "inherit" });
      }

      console.log(`Starting review server on port ${port}...`);
      const { spawn } = await import("node:child_process");
      const child = spawn("node", [reviewServer, "--port", String(port)], {
        cwd: process.cwd(),
        stdio: "inherit",
        env: {
          ...process.env,
          PIXELGUARD_RESULTS_DIR: config.resultsDir,
          PIXELGUARD_BASELINES_DIR: config.baselinesDir,
        },
      });
      child.on("exit", (code) => process.exit(code || 0));
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
