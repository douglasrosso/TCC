/**
 * Combina horizontalmente 3 PNGs (Pixel, SSIM, Regiao) em uma unica imagem
 * para uso na sessao de Resultados do TCC.
 *
 * Uso: node scripts/combine-diffs.js <out.png> <in1.png> <in2.png> <in3.png>
 */
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const GAP = 16; // espacamento entre paineis (px)
const BG = [10, 10, 14, 255]; // mesmo fundo das capturas

function load(file) {
  return PNG.sync.read(fs.readFileSync(file));
}

function combine(outFile, inputs) {
  const imgs = inputs.map(load);
  const height = Math.max(...imgs.map((i) => i.height));
  const width = imgs.reduce((s, i) => s + i.width, 0) + GAP * (imgs.length - 1);

  const out = new PNG({ width, height });
  // preenche fundo
  for (let i = 0; i < width * height; i++) {
    const o = i * 4;
    out.data[o] = BG[0];
    out.data[o + 1] = BG[1];
    out.data[o + 2] = BG[2];
    out.data[o + 3] = BG[3];
  }
  // copia cada painel
  let xOff = 0;
  for (const img of imgs) {
    const yOff = Math.floor((height - img.height) / 2);
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const sIdx = (img.width * y + x) * 4;
        const dIdx = (width * (y + yOff) + (x + xOff)) * 4;
        out.data[dIdx] = img.data[sIdx];
        out.data[dIdx + 1] = img.data[sIdx + 1];
        out.data[dIdx + 2] = img.data[sIdx + 2];
        out.data[dIdx + 3] = img.data[sIdx + 3];
      }
    }
    xOff += img.width + GAP;
  }
  fs.writeFileSync(outFile, PNG.sync.write(out));
  console.log(`Gerado: ${outFile} (${width}x${height})`);
}

const [, , out, ...inputs] = process.argv;
if (!out || inputs.length < 2) {
  console.error("Uso: node scripts/combine-diffs.js <out.png> <in1.png> ...");
  process.exit(1);
}
combine(out, inputs);
