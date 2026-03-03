#!/usr/bin/env node

/**
 * PixelGuard Review CLI
 *
 * Commands:
 *   pixelguard-review start [--port 3060]   → Start review server
 *   pixelguard-review build                 → Build review UI
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT  = path.resolve(__dirname, '..');

const args    = process.argv.slice(2);
const command = args[0] || 'start';

switch (command) {
  case 'start': {
    // Forward remaining args (e.g. --port 4000)
    const serverPath = path.join(PKG_ROOT, 'server', 'index.js');
    const extra = args.slice(1).join(' ');
    const cmd = `node "${serverPath}" ${extra}`.trim();
    try {
      execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
    } catch (e) {
      process.exit(e.status || 1);
    }
    break;
  }

  case 'build': {
    console.log('🔨 Building PixelGuard Review UI...');
    try {
      execSync('npx vite build', { stdio: 'inherit', cwd: PKG_ROOT });
      console.log('✅ Build complete → dist/');
    } catch (e) {
      console.error('❌ Build failed');
      process.exit(1);
    }
    break;
  }

  default:
    console.log(`Unknown command: ${command}`);
    console.log(`\nUsage:`);
    console.log(`  pixelguard-review start [--port 3060]  → Start server`);
    console.log(`  pixelguard-review build                → Build UI`);
    process.exit(1);
}
