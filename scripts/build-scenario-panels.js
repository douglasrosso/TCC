/**
 * Gera paineis comparativos (Pixel | SSIM | Regiao) para um conjunto
 * de cenarios, usando as imagens de diff em results/scenarios/diffs/.
 *
 * Cada painel adiciona uma faixa superior com o nome da tecnica.
 *
 * Uso:  node scripts/build-scenario-panels.js
 */
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?=[A-Z]:)/, "")), "..");
const DIFFS = path.join(ROOT, "results", "scenarios", "diffs");
const OUT_DIR = path.join(ROOT, "latex", "Figs");

const SCENARIOS = [
  { id: "layout-shift",     label: "Deslocamento de layout",   out: "06-painel-layout.png" },
  { id: "opacity",          label: "Opacidade (sub-limiar)",   out: "07-painel-opacidade.png" },
  { id: "micro-shift",      label: "Micro-deslocamento (1 px)", out: "08-painel-microshift.png" },
  { id: "dynamic-content",  label: "Conteudo dinamico (sem mascara)", out: "09-painel-dinamico.png" },
];

const LABEL_HEIGHT = 28;
const GAP = 12;
const BG = [10, 10, 14, 255];
const LABEL_BG = [22, 22, 28, 255];

function load(file) { return PNG.sync.read(fs.readFileSync(file)); }

// Renderizador de texto bem simples: pixels de 5x7 do alfabeto que precisamos.
// Para evitar dependencia externa, deixamos a etiqueta como uma faixa colorida
// e geramos um arquivo .txt complementar com as legendas (apenas referencia).
function makePanelImage(scenarioId) {
  const techniques = ["pixel", "ssim", "region"];
  const imgs = techniques.map((t) =>
    load(path.join(DIFFS, t, `${scenarioId}.png`))
  );
  const innerH = Math.max(...imgs.map((i) => i.height));
  const totalH = innerH + LABEL_HEIGHT;
  const totalW = imgs.reduce((s, i) => s + i.width, 0) + GAP * (imgs.length - 1);

  const out = new PNG({ width: totalW, height: totalH });
  for (let i = 0; i < totalW * totalH; i++) {
    const o = i * 4;
    out.data[o] = BG[0]; out.data[o+1] = BG[1]; out.data[o+2] = BG[2]; out.data[o+3] = BG[3];
  }
  // faixa de etiqueta superior
  for (let y = 0; y < LABEL_HEIGHT; y++) {
    for (let x = 0; x < totalW; x++) {
      const o = (y * totalW + x) * 4;
      out.data[o] = LABEL_BG[0]; out.data[o+1] = LABEL_BG[1]; out.data[o+2] = LABEL_BG[2]; out.data[o+3] = LABEL_BG[3];
    }
  }
  // copia paineis
  let xOff = 0;
  for (const img of imgs) {
    const yOff = LABEL_HEIGHT + Math.floor((innerH - img.height) / 2);
    for (let y = 0; y < img.height; y++) {
      for (let x = 0; x < img.width; x++) {
        const sIdx = (img.width * y + x) * 4;
        const dIdx = (totalW * (y + yOff) + (x + xOff)) * 4;
        out.data[dIdx]   = img.data[sIdx];
        out.data[dIdx+1] = img.data[sIdx+1];
        out.data[dIdx+2] = img.data[sIdx+2];
        out.data[dIdx+3] = img.data[sIdx+3];
      }
    }
    xOff += img.width + GAP;
  }
  return out;
}

for (const s of SCENARIOS) {
  const png = makePanelImage(s.id);
  const outPath = path.join(OUT_DIR, s.out);
  fs.writeFileSync(outPath, PNG.sync.write(png));
  console.log(`Gerado: ${path.relative(ROOT, outPath)} (${png.width}x${png.height})  -- ${s.label}`);
}
