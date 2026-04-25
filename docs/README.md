# Documentação visual do PixelGuard

Esta pasta contém capturas de tela que documentam cada parte da aplicação
(o pacote `pixelguard`, a aplicação `dashboard` usada como sujeito de teste
e os 13 cenários de regressão).

> Todas as imagens podem ser regeneradas a partir do estado atual do projeto
> com os scripts em [`scripts/`](../scripts).

## Estrutura

```
docs/images/
├── app-dashboard-*.png      ← aplicação React usada como single-page sujeito
├── review-*.png             ← Review UI (interface de revisão dos diffs)
├── report-html.png          ← relatório HTML autocontido
└── scenarios/               ← composites por cenário de regressão (13 imagens)
```

---

## 1. Aplicação Dashboard (sujeito de teste)

A aplicação é uma single-page React (Material UI) que simula um painel
administrativo com tabela de transações, métricas e gráficos. É o alvo
principal das comparações da Tabela 1 do artigo.

| Imagem | Viewport | Descrição |
|---|---|---|
| [app-dashboard-desktop.png](images/app-dashboard-desktop.png) | 1366 × 768 | layout completo desktop |
| [app-dashboard-tablet.png](images/app-dashboard-tablet.png) | 768 × 1024 | versão tablet |
| [app-dashboard-mobile.png](images/app-dashboard-mobile.png) | 360 × 640 | versão mobile |

Capturadas com determinismo (relógio congelado, `Math.random` fixo, animações
desativadas) — exatamente o mesmo procedimento usado pelo CLI `pixelguard test`.

---

## 2. Review UI

Interface React (porta 8080) servida pelo comando `pixelguard review --build`.
Permite triagem manual: alternar entre técnicas, aprovar/rejeitar diffs, e
publicar o status no GitHub.

### 2.1 Estados gerais

| Imagem | O que mostra |
|---|---|
| [review-empty.png](images/review-empty.png) | tela inicial, antes de selecionar uma captura |
| [review-test-runs.png](images/review-test-runs.png) | painel "Test Runs" aberto (lista de execuções: `local` e `Cenários de Teste`) |
| [review-header.png](images/review-header.png) | cabeçalho com contadores (pendentes / aprovados / rejeitados) e atalhos |
| [review-diff-list.png](images/review-diff-list.png) | sidebar com a lista de telas/cenários, filtros (Desktop / Mobile / Tablet) e busca |
| [review-approved.png](images/review-approved.png) | tela após aprovar um diff (estado verde) |

### 2.2 Modos de visualização do diff

A Review UI oferece três formas de comparar **a mesma técnica**:

| Imagem | Modo |
|---|---|
| [review-side-by-side.png](images/review-side-by-side.png) | "Lado a Lado" — baseline, atual e diff em colunas |
| [review-overlay.png](images/review-overlay.png) | "Sobreposição" — atual sobreposta à baseline (transparência ajustável) |
| [review-slider.png](images/review-slider.png) | "Slider" — controle deslizante entre baseline e atual |

### 2.3 Seleção de técnica

Para o **mesmo cenário e mesma captura**, é possível alternar entre as três
técnicas de comparação:

| Imagem | Técnica | Característica |
|---|---|---|
| [review-technique-pixel.png](images/review-technique-pixel.png) | Pixel | destaca pixels divergentes (`pixelmatch`, tolerância 0,1) |
| [review-technique-ssim.png](images/review-technique-ssim.png) | SSIM | mapa perceptual em blocos 8×8 (limiar mínimo 0,98) |
| [review-technique-region.png](images/review-technique-region.png) | Região | grade 4×6 com estado por célula (limite 1,0% por célula) |

---

## 3. Relatório HTML

| Imagem | Descrição |
|---|---|
| [report-html.png](images/report-html.png) | relatório estático autocontido gerado em `results/report.html`. Contém resumo por técnica, tabela por imagem e galeria de comparações visuais. Pode ser publicado como artefato de CI. |

---

## 4. Cenários de regressão

Cada cenário em [`docs/images/scenarios/`](images/scenarios) é um composite
horizontal com cinco painéis: **Baseline · Atual · Diff Pixel · Diff SSIM ·
Diff Região**, com o veredicto (PASS / FAIL) e a métrica principal de cada
técnica abaixo do título da coluna.

Os 13 composites são gerados automaticamente a partir de
[`results/scenarios/scenarios-results.json`](../results/scenarios/scenarios-results.json),
de modo que ficam sempre sincronizados com a última execução de
`npm run scenarios`.

| Cenário | Arquivo | Mutação injetada | Resultado esperado |
|---|---|---|---|
| Mudança sutil de cor | [scenarios/color-subtle.png](images/scenarios/color-subtle.png) | troca de tom em 2 de 6 cards (Δ 22–37 RGB por canal) | Pixel detecta, SSIM tolera |
| Deslocamento de layout | [scenarios/layout-shift.png](images/scenarios/layout-shift.png) | margem-topo 24 px na primeira seção | todas detectam |
| Variação tipográfica | [scenarios/typography.png](images/scenarios/typography.png) | aumento de `letter-spacing` em blocos de texto | todas detectam |
| Conteúdo dinâmico (sem máscara) | [scenarios/dynamic-content.png](images/scenarios/dynamic-content.png) | `Date` e `Math.random` descongelados na captura atual | apenas Região alerta |
| Conteúdo dinâmico (com máscara) | [scenarios/dynamic-content-masked.png](images/scenarios/dynamic-content-masked.png) | mesmo cenário acima, com máscara nas células variáveis | tudo PASS — máscara funcionou |
| Alteração de componente | [scenarios/component-change.png](images/scenarios/component-change.png) | texto e cor da borda de 1 card | Pixel + Região detectam |
| Opacidade e transparência | [scenarios/opacity.png](images/scenarios/opacity.png) | `opacity: 0.92` em 3 cards | nenhuma técnica detecta (limiar restritivo) |
| Sombra e elevação | [scenarios/shadow.png](images/scenarios/shadow.png) | `box-shadow` adicionada em 3 cards | nenhuma técnica detecta |
| Micro-deslocamento (1 px) | [scenarios/micro-shift.png](images/scenarios/micro-shift.png) | margem-topo de 1 px na primeira seção | todas detectam |
| Alteração de borda fina | [scenarios/border-change.png](images/scenarios/border-change.png) | troca de cor de `border: 2px` em 2 cards | Pixel + Região detectam |
| Remoção de elemento | [scenarios/element-removal.png](images/scenarios/element-removal.png) | `display: none` em 1 card | Pixel + Região detectam |
| Troca de família de fonte | [scenarios/font-swap.png](images/scenarios/font-swap.png) | `font-family` serifada em 2 blocos | todas detectam |
| Imagem idêntica (controle) | [scenarios/identical.png](images/scenarios/identical.png) | sem mutação | tudo PASS — sem falsos positivos |

---

## Reproduzindo as imagens

Pré-requisitos: dependências instaladas (`npm install`) e Playwright/Chromium
baixado (`npx playwright install chromium`).

```powershell
# Composites por cenário (esta pasta docs/images/scenarios/)
npm run scenarios                     # gera results/scenarios/*
node scripts\capture-scenarios.js
```

As capturas de Dashboard, Review UI e relatório HTML foram produzidas
manualmente via Playwright com a Review UI ativa em `http://localhost:8080`
e o dashboard em `http://localhost:5173`.
