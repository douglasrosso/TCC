/**
 * Trim a borda escura/cinza uniforme em volta de capturas PNG.
 *
 * Uso:
 *   node scripts/trim-images.js <arquivo-ou-pasta> [...mais]
 *
 * Detecta automaticamente a cor de fundo (média dos 4 cantos) e remove
 * todas as linhas/colunas externas que ficam dentro de uma tolerância
 * pequena dessa cor. Sobrescreve o arquivo no mesmo caminho.
 */
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const TOLERANCE = 8; // diferença máxima por canal para considerar "fundo"

function isBgPixel(data, idx, bg) {
  return (
    Math.abs(data[idx] - bg[0]) <= TOLERANCE &&
    Math.abs(data[idx + 1] - bg[1]) <= TOLERANCE &&
    Math.abs(data[idx + 2] - bg[2]) <= TOLERANCE
  );
}

function trimPng(file) {
  const buf = fs.readFileSync(file);
  const png = PNG.sync.read(buf);
  const { width, height, data } = png;

  // cor de fundo = média dos 4 cantos
  const corners = [
    [0, 0],
    [width - 1, 0],
    [0, height - 1],
    [width - 1, height - 1],
  ];
  const bg = [0, 0, 0];
  for (const [x, y] of corners) {
    const i = (y * width + x) * 4;
    bg[0] += data[i];
    bg[1] += data[i + 1];
    bg[2] += data[i + 2];
  }
  bg[0] = Math.round(bg[0] / 4);
  bg[1] = Math.round(bg[1] / 4);
  bg[2] = Math.round(bg[2] / 4);

  let top = 0,
    bottom = height - 1,
    left = 0,
    right = width - 1;

  // top
  for (; top < height; top++) {
    let allBg = true;
    for (let x = 0; x < width; x++) {
      if (!isBgPixel(data, (top * width + x) * 4, bg)) {
        allBg = false;
        break;
      }
    }
    if (!allBg) break;
  }
  // bottom
  for (; bottom > top; bottom--) {
    let allBg = true;
    for (let x = 0; x < width; x++) {
      if (!isBgPixel(data, (bottom * width + x) * 4, bg)) {
        allBg = false;
        break;
      }
    }
    if (!allBg) break;
  }
  // left
  for (; left < width; left++) {
    let allBg = true;
    for (let y = top; y <= bottom; y++) {
      if (!isBgPixel(data, (y * width + left) * 4, bg)) {
        allBg = false;
        break;
      }
    }
    if (!allBg) break;
  }
  // right
  for (; right > left; right--) {
    let allBg = true;
    for (let y = top; y <= bottom; y++) {
      if (!isBgPixel(data, (y * width + right) * 4, bg)) {
        allBg = false;
        break;
      }
    }
    if (!allBg) break;
  }

  const newW = right - left + 1;
  const newH = bottom - top + 1;
  if (newW === width && newH === height) {
    console.log(`  ${path.basename(file)}: nada para cortar`);
    return;
  }

  const out = new PNG({ width: newW, height: newH });
  for (let y = 0; y < newH; y++) {
    for (let x = 0; x < newW; x++) {
      const srcIdx = ((y + top) * width + (x + left)) * 4;
      const dstIdx = (y * newW + x) * 4;
      out.data[dstIdx] = data[srcIdx];
      out.data[dstIdx + 1] = data[srcIdx + 1];
      out.data[dstIdx + 2] = data[srcIdx + 2];
      out.data[dstIdx + 3] = data[srcIdx + 3];
    }
  }

  fs.writeFileSync(file, PNG.sync.write(out));
  console.log(
    `  ${path.basename(file)}: ${width}×${height} → ${newW}×${newH}`,
  );
}

function collect(targets) {
  const files = [];
  for (const t of targets) {
    const stat = fs.statSync(t);
    if (stat.isDirectory()) {
      for (const name of fs.readdirSync(t)) {
        if (name.toLowerCase().endsWith(".png")) {
          files.push(path.join(t, name));
        }
      }
    } else if (t.toLowerCase().endsWith(".png")) {
      files.push(t);
    }
  }
  return files;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("uso: node scripts/trim-images.js <arquivo-ou-pasta> [...]");
  process.exit(1);
}

const files = collect(args);
console.log(`Trim de ${files.length} arquivo(s):`);
for (const f of files) trimPng(f);
