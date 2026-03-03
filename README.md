# Visual Regression Testing — TCC

Comparativo de três técnicas de regressão visual integradas a CI/CD, aplicadas a uma dashboard **React + Material UI**.

| Técnica | Descrição | Arquivo |
|---------|-----------|---------|
| **Pixel a pixel** | Diferença numérica por pixel com limiar de tolerância | `tests/comparators/pixel.js` |
| **SSIM** | Métrica perceptual (luminância, contraste, estrutura) — Wang et al. 2004 | `tests/comparators/ssim.js` |
| **Regiões** | Segmentação em grade com máscaras para conteúdo dinâmico | `tests/comparators/region.js` |

---

## Stack

- **Vite** — Dev server + build
- **React 19 + Material UI 6** — Dashboard SPA
- **Playwright** — Captura de screenshots e testes E2E
- **pixelmatch / pngjs** — Comparação pixel a pixel
- **SSIM customizado** — Implementação Wang et al. 2004
- **Node.js** — Scripts de comparação, avaliação e review

## Estrutura

```
src/                         App React + MUI (Vite)
  components/
    NavBar.jsx               Barra de navegação
    HeroBanner.jsx           Banner com gradiente
    StatsGrid.jsx            Cards de estatísticas (flexbox)
    TransactionsTable.jsx    Tabela de transações
    InfoSidebar.jsx          Sidebar com informações
    ActivityFeed.jsx         Feed de atividades
    Footer.jsx               Rodapé
  App.jsx                    Layout principal (flexbox)
  theme.js                   Tema MUI customizado
  main.jsx                   Entry point React

tests/
  config.js                  Viewports, limiares, máscaras, mutações
  capture.js                 Captura de screenshots (Vite + Playwright)
  compare.js                 Orquestrador de comparação (CI)
  evaluate.js                Avaliação completa com mutações (TCC)
  report.js                  Gerador de relatório HTML
  review.js                  Sistema de review CLI (aprovar/rejeitar)
  review-server.js           UI web para review interativo
  comparators/
    pixel.js                 Comparação pixel a pixel
    ssim.js                  Comparação SSIM
    region.js                Comparação por regiões

e2e/
  dashboard.spec.js          Testes E2E funcionais (14 testes)
  visual.spec.js             Testes de snapshot visual (4 testes)

scripts/
  update-baselines.js        Atualiza imagens de referência

baselines/                   Imagens de referência (versionadas no Git)
results/                     Saída gerada (gitignored)
.github/workflows/           Pipeline CI/CD
```

## Pré-requisitos

- Node.js 18+
- npm

## Instalação

```bash
npm install
npx playwright install chromium
```

## Fluxo Completo de Teste Local

### 1. Iniciar o dev server e verificar o app

```bash
npm run dev
# Acesse http://localhost:3050
```

### 2. Capturar screenshots (baselines iniciais)

```bash
npm run capture
npm run update-baselines
```

### 3. Fazer uma alteração visual (proposital)

Edite qualquer componente. Ex: mudar a cor primária no `src/theme.js`.

### 4. Recapturar e comparar

```bash
npm run capture
npm run compare
```

### 5. Ver o relatório

```bash
npm run report
# Abra results/report.html no navegador
```

### 6. Revisar diffs interativamente

```bash
npm run review          # Status no terminal
npm run review:ui       # UI web em http://localhost:3060
```

### 7. Aprovar ou rejeitar

```bash
# Aprovar tudo (atualiza baselines automaticamente)
npm run review:approve-all

# Rejeitar tudo (mantém baselines)
npm run review:reject-all

# Individual
node tests/review.js --approve dashboard-desktop-1366w --comment "OK"
node tests/review.js --reject dashboard-mobile-360w --comment "Bug no botão"
```

---

## Scripts npm

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Dev server Vite (porta 3050) |
| `npm run build` | Build de produção |
| `npm run capture` | Capturar screenshots (3 viewports) |
| `npm run compare` | Comparar capturas × baselines (3 técnicas) |
| `npm run report` | Gerar relatório HTML |
| `npm run update-baselines` | Copiar capturas atuais → baselines |
| `npm run ci` | Pipeline completo (capture → compare → report) |
| `npm run evaluate` | Avaliação com mutações (TP/FP/F1) |
| `npm run review` | Status de review no terminal |
| `npm run review:approve-all` | Aprovar todas as diffs |
| `npm run review:reject-all` | Rejeitar todas as diffs |
| `npm run review:history` | Histórico de reviews |
| `npm run review:reset` | Resetar status |
| `npm run review:ui` | UI web de review (porta 3060) |
| `npm run e2e` | Testes E2E Playwright |
| `npm run e2e:ui` | Testes E2E com interface visual |

## Testes E2E

```bash
npm run e2e              # Roda todos (14 funcionais + 4 visuais)
npm run e2e:ui           # Interface visual do Playwright
```

## Avaliação para TCC

```bash
npm run evaluate                    # Injeta mutações e calcula métricas
node tests/report.js --evaluate     # Gera relatório de avaliação
```

Métricas geradas: TP, FP, TN, FN, Precisão, Recall, F1-Score, Tempo médio por técnica.

## Determinismo

As capturas congelam `Date` e `Math.random` e desativam animações CSS para garantir resultados reproduzíveis entre execuções.

## Configuração

Edite `tests/config.js` para ajustar:

- **Viewports**: larguras de tela para captura
- **Limiares**: tolerância de cada técnica
- **Máscaras**: células a ignorar (conteúdo dinâmico)
- **Mutações**: alterações injetadas para avaliação
