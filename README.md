# Visual Regression Testing — TCC

Comparativo de três técnicas de regressão visual integradas a CI/CD:

| Técnica | Descrição | Arquivo |
|---------|-----------|---------|
| **Pixel a pixel** | Diferença numérica por pixel com limiar de tolerância | `tests/comparators/pixel.js` |
| **SSIM** | Métrica perceptual (luminância, contraste, estrutura) — Wang et al. 2004 | `tests/comparators/ssim.js` |
| **Regiões** | Segmentação em grade com máscaras para conteúdo dinâmico | `tests/comparators/region.js` |

---

## Estrutura

```
app/                     Interface provisória (HTML/CSS)
tests/
  config.js              Viewports, limiares, máscaras, mutações
  server.js              Servidor HTTP estático
  capture.js             Captura de screenshots (Playwright)
  compare.js             Orquestrador de comparação (CI)
  evaluate.js            Avaliação completa com mutações (TCC)
  report.js              Gerador de relatório HTML
  comparators/
    pixel.js             Comparação pixel a pixel
    ssim.js              Comparação SSIM
    region.js            Comparação por regiões
scripts/
  update-baselines.js    Atualiza imagens de referência
baselines/               Imagens de referência (versionadas)
results/                 Saída gerada (gitignored)
.github/workflows/       Pipeline CI/CD
```

## Pré-requisitos

- Node.js 18+
- npm

## Instalação

```bash
npm install
npx playwright install chromium
```

## Uso

### 1. Capturar screenshots

```bash
npm run capture
```

Gera capturas em `results/current/` para cada viewport (360, 768, 1366 px).

### 2. Definir baselines iniciais

```bash
npm run update-baselines
```

Copia as capturas atuais para `baselines/`. **Faça commit destas imagens.**

### 3. Comparar com baselines (modo CI)

```bash
npm run compare
```

Executa os três comparadores, salva diffs em `results/diffs/` e resultados em `results/results.json`.

### 4. Gerar relatório HTML

```bash
npm run report
```

Gera `results/report.html` com resumo visual das comparações.

### 5. Pipeline completo (CI)

```bash
npm run ci
```

Executa captura → comparação → relatório. Sai com código 1 se houver regressão.

### 6. Avaliação completa (TCC)

```bash
npm run evaluate
```

Injeta cada mutação definida em `tests/config.js`, compara com três técnicas, mede falsos positivos em capturas limpas, e gera métricas consolidadas (TP, FP, TN, FN, precisão, recall, F1, tempo médio).

```bash
node tests/report.js --evaluate
```

Gera relatório HTML da avaliação em `results/evaluation/report.html`.

---

## Fluxo no GitHub (PR)

1. Baselines commitadas em `baselines/`.
2. Ao abrir PR, o workflow captura screenshots e compara com baselines.
3. Se houver diferenças, o check falha e os diffs ficam nos artefatos.
4. O desenvolvedor revisa e, se as mudanças forem intencionais, atualiza as baselines:
   ```bash
   npm run capture
   npm run update-baselines
   git add baselines/
   git commit -m "chore: atualizar baselines visuais"
   ```

## Configuração

Edite `tests/config.js` para ajustar:

- **Viewports**: larguras de tela para captura.
- **Limiares**: tolerância de cada técnica.
- **Máscaras**: células da grade a ignorar (conteúdo dinâmico).
- **Mutações**: alterações injetadas para avaliação (fontes, cores, layout, etc.).

## Determinismo

As capturas congelam `Date` e `Math.random` e desativam animações CSS para garantir resultados reproduzíveis entre execuções.
