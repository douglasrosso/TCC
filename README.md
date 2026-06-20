<p align="center">
  <img src="https://img.shields.io/badge/PixelGuard-Visual%20Regression-4f46e5?style=for-the-badge&logoColor=white" alt="PixelGuard" />
</p>

<h1 align="center">PixelGuard — Regressão Visual para React</h1>

<p align="center">
  Pipeline completo de testes visuais que captura screenshots, compara com baselines usando <strong>3 técnicas</strong> (pixel a pixel, SSIM e regiões) e bloqueia o merge no GitHub quando há diferenças — com UI de review interativa.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/MUI-6-007FFF?logo=mui&logoColor=white" />
  <img src="https://img.shields.io/badge/Playwright-1.49-2EAD33?logo=playwright&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white" />
</p>

---

## Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Pré-requisitos](#pré-requisitos)
4. [Uso Local — Dashboard MVP](#uso-local--dashboard-mvp)
5. [Arquivo pixelguard.config.js](#arquivo-pixelguardconfigjs)
6. [PixelGuard CLI](#pixelguard-cli)
7. [Review UI — Guia Completo](#review-ui--guia-completo)
8. [Relatório HTML](#relatório-html)
9. [Aplicação Dashboard (sujeito de teste)](#aplicação-dashboard-sujeito-de-teste)
10. [Cenários de regressão](#cenários-de-regressão)
11. [Configuração do Repositório GitHub do Zero](#configuração-do-repositório-github-do-zero)
12. [CI/CD — GitHub Actions](#cicd--github-actions)
13. [Usando PixelGuard em Outro Projeto](#usando-pixelguard-em-outro-projeto)
14. [Comandos de Referência](#comandos-de-referência)
15. [Referência de Configuração](#referência-de-configuração)
16. [Estrutura do Projeto](#estrutura-do-projeto)
17. [Determinismo](#determinismo)

---

## Visão Geral

O PixelGuard automatiza a detecção de regressões visuais em aplicações web. O fluxo funciona assim:

```
Captura screenshots → Compara com baselines → Gera relatório → Abre review UI
       ↓                      ↓                     ↓                ↓
   Playwright            3 técnicas           report.html      localhost:8080
                     (pixel, SSIM, região)
```

### Técnicas de Comparação

| Técnica | Descrição | Sensibilidade |
|:--------|:----------|:-------------|
| **Pixel a pixel** | Compara cada pixel individualmente usando [pixelmatch](https://github.com/mapbox/pixelmatch). Detecta até alterações de 1px. | Alta |
| **SSIM** | Structural Similarity Index — métrica perceptual que avalia luminância, contraste e estrutura (Wang et al., 2004). Aproxima a visão humana. | Média |
| **Regiões** | Divide a imagem em grade (4×6), compara cada célula de forma independente e permite mascarar áreas dinâmicas (datas, contadores). | Configurável |

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                      Aplicação React                        │
│              (src/ — React 19 + MUI 6 + Vite 6)            │
│                     porta 8000                              │
└──────────────────────────┬──────────────────────────────────┘
                           │ Playwright captura
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              PixelGuard (pacote unificado)                   │
│           packages/pixelguard/ — CLI + Engine                │
│                                                             │
│  src/capture.js → src/compare.js → src/report.js            │
│                                                             │
│  Comparadores:                                              │
│    src/comparators/pixel.js   (pixelmatch)                  │
│    src/comparators/ssim.js    (SSIM — implementação)        │
│    src/comparators/region.js  (grade + máscaras)            │
│                                                             │
│  Review UI (embutida):                                      │
│    review/server/   → HTTP server + REST API (porta 8080)   │
│    review/dist/     → SPA React pré-buildada                │
└──────────────────────────┬──────────────────────────────────┘
                           │ GitHub Statuses API
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions                           │
│  visual-regression.yml  → Check em PRs                     │
│  approve-visual.yml     → Comandos via comentário          │
│  vrt-log.yml            → Log de regressões aprovadas      │
└─────────────────────────────────────────────────────────────┘
```

---

## Pré-requisitos

| Ferramenta | Versão | Motivo |
|:-----------|:-------|:-------|
| **Node.js** | ≥ 20 | Runtime |
| **npm** | ≥ 9 | Gerenciador de pacotes |
| **Git** | Qualquer | Controle de versão |
| **Conta GitHub** | — | CI/CD e GitHub Pages |

---

## Arquivo pixelguard.config.js

Toda a configuração do pipeline está centralizada em `pixelguard.config.js` na raiz do projeto.

### Configuração atual do projeto

```javascript
/** @type {import('pixelguard').PixelGuardConfig} */
export default {
  // Viewports capturados — um arquivo por viewport por página
  viewports: [
    { name: 'mobile',  width: 360,  height: 640  },
    { name: 'tablet',  width: 768,  height: 1024 },
    { name: 'desktop', width: 1366, height: 768  },
  ],

  // Páginas monitoradas (path relativo à URL base)
  pages: [{ name: 'dashboard', path: '/' }],

  // Branch remota usada como baseline — capturada via git worktree a cada run
  baseBranch: 'main',

  // Técnicas de comparação executadas em paralelo
  comparators: ['pixel', 'ssim', 'region'],

  // Limiares de aceitação por técnica — valores adotados no estudo
  thresholds: {
    pixel: {
      tolerance:      0.1,  // sensibilidade por canal RGB (0–1); 0.1 = padrão pixelmatch
      maxDiffPercent: 0.1,  // até 0,1 % dos pixels podem divergir antes de FAIL
    },
    ssim: {
      minScore:  0.99,  // ≥ 0,99 para PASS — elevado de 0,98 pois a 0,98
                        // mudanças sutis de cor e remoção passavam sem detecção
      blockSize: 8,     // janela de cálculo em pixels (blocos não sobrepostos)
    },
    region: {
      gridCols:       4,    // grade 4 × 6 = 24 células por imagem
      gridRows:       6,
      maxDiffPercent: 1.0,  // até 1 % de pixels diferentes dentro da célula = PASS
    },
  },
};
```

### Configuração completa com todos os campos disponíveis

Para criar um arquivo de configuração do zero:

```bash
npx pixelguard init
```

Exemplo com todos os campos documentados:

```javascript
/** @type {import('pixelguard').PixelGuardConfig} */
export default {
  // URL base da aplicação (null = auto-start Vite na porta abaixo)
  baseUrl: null,
  port: 8000,

  // Viewports para captura
  viewports: [
    { name: 'mobile',  width: 360,  height: 640  },
    { name: 'tablet',  width: 768,  height: 1024 },
    { name: 'desktop', width: 1366, height: 768  },
  ],

  // Páginas a capturar (cada página × todos os viewports)
  pages: [
    { name: 'dashboard', path: '/' },
    { name: 'login',     path: '/login' },   // adicione mais conforme necessário
  ],

  // Técnicas de comparação executadas em paralelo
  comparators: ['pixel', 'ssim', 'region'],

  // Limiares de aceitação
  thresholds: {
    pixel:  { tolerance: 0.1, maxDiffPercent: 0.1  },
    ssim:   { minScore: 0.99, blockSize: 8          },
    region: { gridCols: 4, gridRows: 6, maxDiffPercent: 1.0 },
  },

  // Máscaras — células da grade a ignorar (conteúdo dinâmico: datas, contadores)
  masks: [
    // { row: 0, col: 3 },  // linha 0, coluna 3 (canto superior direito)
    // { row: 5, col: 0 },  // linha 5, coluna 0 (canto inferior esquerdo)
  ],

  // Diretórios (relativos ao cwd)
  baselinesDir: 'baselines',
  resultsDir:   'results',

  // Branch remota usada como baseline — capturada via git worktree a cada run
  baseBranch: 'main',

  // Congelar Date/Math.random para capturas determinísticas
  freeze: true,

  // Porta da Review UI
  reviewPort: 8080,
};
```

### Referência das opções

#### `baseUrl` — auto-start ou URL externa

| Valor | Comportamento |
|:------|:--------------|
| `null` | PixelGuard inicia o Vite automaticamente na `port` configurada, captura e encerra |
| `'http://localhost:3000'` | Usa uma URL já rodando — útil para Next.js, CRA, ou qualquer outro servidor |

#### Viewports e páginas

Cada combinação `página × viewport` gera um arquivo de screenshot. Com 1 página e 3 viewports, o resultado são 3 arquivos: `dashboard-mobile-360w.png`, `dashboard-tablet-768w.png`, `dashboard-desktop-1366w.png`.

#### Limiares (`thresholds`)

| Parâmetro | Técnica | Significado |
|:----------|:--------|:------------|
| `pixel.tolerance` | Pixel | Sensibilidade do pixelmatch (0–1). Menor = mais sensível |
| `pixel.maxDiffPercent` | Pixel | % máxima de pixels diferentes aceitável |
| `ssim.minScore` | SSIM | Score mínimo (0–1). Menor = mais tolerante |
| `ssim.blockSize` | SSIM | Tamanho do bloco para cálculo SSIM |
| `region.gridCols` / `gridRows` | Região | Divisão da grade |
| `region.maxDiffPercent` | Região | % máxima de diferença por célula |

#### Máscaras — regiões dinâmicas

Úteis para ignorar partes da tela que mudam a cada captura (datas, timestamps, avatares carregados remotamente):

```javascript
masks: [
  { row: 0, col: 3 },  // célula [linha 0, coluna 3]
  { row: 5, col: 0 },  // célula [linha 5, coluna 0]
],
```

`row` e `col` começam em 0, contados do canto superior esquerdo da grade.

---

## Uso Local — Dashboard MVP

> Siga os passos abaixo na ordem. É necessário ter [Node.js ≥ 20](https://nodejs.org) e [Git](https://git-scm.com) instalados — consulte a seção [Pré-requisitos](#pré-requisitos) se necessário.

### Passo 1 — Clonar o projeto

Abra o terminal e execute:

```bash
git clone https://github.com/douglasrosso/TCC.git
cd TCC
```

### Passo 2 — Instalar as dependências

```bash
npm install
```

Isso instala tudo que o projeto precisa, incluindo o browser usado para capturar screenshots.

### Passo 3 — Ver os testes passando (sem nenhuma alteração)

Execute o pipeline de testes visuais:

```bash
npm run review:local
```

Aguarde o processo terminar (cerca de 60–90 segundos — inclui captura da baseline de `origin/main` via git worktree). Quando aparecer a mensagem `PixelGuard Review Server — http://localhost:8080` no terminal, abra **http://localhost:8080** no navegador.

Como nada foi alterado, todas as comparações passam: a interface mostra tudo aprovado, sem diferenças detectadas.

> Pressione `Ctrl+C` no terminal para encerrar a Review UI quando quiser continuar.

### Passo 4 — Fazer uma alteração visual

Para simular uma regressão visual, faça uma mudança visível. Abra o arquivo [src/components/HeroBanner.jsx](src/components/HeroBanner.jsx) e localize a linha do gradiente:

```jsx
background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #3b82f6 100%)',
```

Substitua por:

```jsx
background: 'linear-gradient(135deg, #b71c1c 0%, #e65100 100%)',
```

Salve o arquivo.

### Passo 5 — Rodar novamente e ver o diff

Execute os testes de novo:

```bash
npm run review:local
```

Quando aparecer `PixelGuard Review Server — http://localhost:8080` no terminal, abra **http://localhost:8080** no navegador. A Review UI mostrará as diferenças: a cor do HeroBanner mudou de azul/roxo para vermelho/laranja. Você pode usar os modos **Side by Side**, **Overlay** ou **Slider** para comparar a imagem de referência com a captura atual.

### Passo 6 — Aceitar a mudança como nova referência

Se a alteração foi intencional, basta fazer merge para a `main`. Na próxima execução do pipeline, o PixelGuard capturará a baseline diretamente de `origin/main` — a mudança já será o novo estado de referência automaticamente. Nenhum comando adicional é necessário.

---

## PixelGuard CLI

```bash
npx pixelguard <command>
```

| Comando | Descrição |
|:--------|:----------|
| `init` | Cria `pixelguard.config.js` no projeto com todos os campos comentados |
| `capture` | Captura screenshots de todas as páginas/viewports via Playwright |
| `compare` | Compara capturas com baselines usando as 3 técnicas em paralelo |
| `report` | Gera relatório HTML autocontido em `results/report.html` |
| `update-baselines` | Copia `results/current/` → `baselines/` |
| `test` | **Pipeline completo:** captura baseline de `origin/main` → capture → compare → report |
| `review` | Inicia a Review UI interativa (porta 8080) |
| `deploy` | Build da Review UI + monta pasta de deploy estático para GitHub Pages |

#### Opções globais

| Opção | Descrição |
|:------|:----------|
| `--help`, `-h` | Mostra ajuda |
| `--no-fail` | Não encerra com código de erro mesmo quando há diffs (usado no `review:local`) |
| `--port <n>` | Porta para o servidor de review (padrão: 8080) |
| `--build` | Força rebuild da Review UI antes de iniciar |
| `--pr <n>` | Número do PR para nomear a pasta de deploy |
| `--out <dir>` | Diretório de saída para capture / deploy |

---

## Review UI — Guia Completo

A Review UI é uma aplicação React com tema escuro que permite analisar diferenças visuais de forma interativa.

### Abrindo a Review UI

```bash
npm run review
# → http://localhost:8080

# Porta customizada
npx pixelguard review --port 4000
```

### Visão geral da interface

A interface é dividida em **3 painéis redimensionáveis**:

| # | Painel | Localização | Função |
|:-:|:-------|:-----------|:-------|
| 1 | **Test Runs** | Esquerda | Lista os test runs disponíveis (local ou CI). Mostra branch, commit, autor e progresso de review |
| 2 | **Diff List** | Centro-esquerda | Lista todas as telas comparadas com filtros por status, viewport e busca por nome |
| 3 | **Diff Viewer** | Área principal (direita) | Exibe a comparação visual entre baseline e captura atual |

### Modos de visualização

A toolbar do Diff Viewer oferece **3 modos**:

| Modo | Descrição |
|:-----|:----------|
| **Side by Side** (padrão) | Baseline, atual e diff lado a lado. Ideal para comparação rápida |
| **Overlay** | Sobrepõe a imagem atual sobre a baseline com opacidade ajustável. Útil para deslocamentos sutis |
| **Slider** | Arraste o cursor horizontal para revelar a imagem atual sobre a baseline. Excelente para regiões específicas |

### Filtros da Diff List

| Filtro | Opções |
|:-------|:-------|
| **Busca** | Filtra por nome da tela |
| **Status** | Todos · Pendentes · Aprovados · Rejeitados |
| **Viewport** | Todos · Mobile · Tablet · Desktop |

### Atalhos de teclado

| Tecla | Ação |
|:------|:-----|
| `A` | Aprovar tela selecionada |
| `R` | Rejeitar tela selecionada |
| `←` / `→` | Navegar entre telas |

### Aprovação automática

Quando **todas as técnicas** passam nos limiares configurados, a tela é aprovada automaticamente — sem revisão manual necessária. Os botões Aprovar/Rejeitar ficam ocultos e o ícone mostra ✅.

### Integração com GitHub (modo CI)

Quando executada via GitHub Pages, a Review UI se comunica com a **API de Statuses do GitHub**:

| Ação | Status do commit | Efeito no merge |
|:-----|:----------------|:----------------|
| **Aprovar** | `success` | Merge liberado ✅ |
| **Rejeitar** | `failure` | Merge bloqueado ❌ |
| **Resetar** | `pending` | Aguardando review ⏳ |

> O token do GitHub é criptografado via XOR no CI e descriptografado no browser — isso evita que o GitHub Push Protection bloqueie o deploy.

---

## Relatório HTML

Além da Review UI, o pipeline gera um **relatório HTML estático autocontido**:

```bash
npx pixelguard report
# → results/report.html (abra no navegador)
```

| Seção | Conteúdo |
|:------|:---------|
| **Banner de status** | Indica se o merge está bloqueado ou liberado |
| **Cards de resumo** | Resultado por técnica (Pixel, SSIM, Região) |
| **Metadados** | Commit, branch, PR, autor (quando gerado no CI) |
| **Tabela por imagem** | % de diferença (pixel), score SSIM, regiões com falha |
| **Comparações visuais** | Baseline, captura atual e mapas de diff por técnica |

---

## Aplicação Dashboard (sujeito de teste)

A aplicação React (Material UI) em [`src/`](src) é uma single-page que simula um painel administrativo. É o alvo das comparações da pipeline, capturada com determinismo total (relógio congelado, `Math.random` fixo, animações desativadas).

### Componentes do dashboard

| Componente | Descrição |
|:-----------|:----------|
| `NavBar.jsx` | Barra de navegação superior |
| `HeroBanner.jsx` | Seção hero com métricas em destaque |
| `StatsGrid.jsx` | 4 cards de métricas em grade |
| `TransactionsTable.jsx` | Tabela de transações com paginação |
| `InfoSidebar.jsx` | Cards informativos na coluna direita |
| `ActivityFeed.jsx` | Feed de atividades recentes |
| `Footer.jsx` | Rodapé |

### Viewports capturados

| Viewport | Resolução |
|:---------|:----------|
| Mobile | 360 × 640 |
| Tablet | 768 × 1024 |
| Desktop | 1366 × 768 |

---

## Cenários de regressão

O comando `npm run scenarios` executa **13 cenários** que isolam tipos específicos de mudança visual para avaliar cada técnica.

| Cenário | Mutação injetada | Resultado esperado |
|:--------|:-----------------|:-------------------|
| Mudança sutil de cor | Troca de tom em 2 de 6 cards (Δ 22–37 RGB) | Pixel detecta, SSIM tolera |
| Deslocamento de layout | `margin-top: 24px` na primeira seção | Todas detectam |
| Variação tipográfica | Aumento de `letter-spacing` em blocos de texto | Todas detectam |
| Conteúdo dinâmico (sem máscara) | `Date` e `Math.random` descongelados | Apenas Região alerta |
| Conteúdo dinâmico (com máscara) | Mesmo acima, com máscara nas células variáveis | Tudo PASS — máscara funcionou |
| Alteração de componente | Texto e cor da borda de 1 card | Pixel + Região detectam |
| Opacidade e transparência | `opacity: 0.92` em 3 cards | Nenhuma detecta (limiar restritivo) |
| Sombra e elevação | `box-shadow` adicionada em 3 cards | Nenhuma detecta |
| Micro-deslocamento (1 px) | `margin-top: 1px` na primeira seção | Todas detectam |
| Alteração de borda fina | Troca de cor de `border: 2px` em 2 cards | Pixel + Região detectam |
| Remoção de elemento | `display: none` em 1 card | Pixel + Região detectam |
| Troca de família de fonte | `font-family` serifada em 2 blocos | Todas detectam |
| Imagem idêntica (controle) | Sem mutação | Tudo PASS — sem falsos positivos |

### Rodar os cenários e ver no Review

```bash
npm run scenarios    # captura baseline + mutação, compara → results/scenarios/
npm run review       # sobe o servidor → http://localhost:8080
```

Na aba **"Cenários de Teste"** da Review UI você vê cada cenário com baseline, atual e diffs das três técnicas.

### Regerar os composites de documentação

```bash
npm run scenarios                     # gera results/scenarios/*
node scripts\capture-scenarios.js     # gera docs/images/scenarios/*
```

---

## Configuração do Repositório GitHub do Zero

Esta seção descreve **passo a passo** como criar e configurar um repositório GitHub idêntico ao deste projeto, com CI/CD de regressão visual funcionando.

### Passo 1 — Criar o repositório

1. Acesse [github.com/new](https://github.com/new)
2. Configure:
   - **Repository name:** `TCC` (ou o nome que preferir)
   - **Visibility:** Public *(GitHub Pages gratuito exige público)*
   - Não inicialize com README nem .gitignore — o projeto já tem esses arquivos
3. Clique em **Create repository**

### Passo 2 — Subir o código

```bash
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git
git branch -M main
git push -u origin main
```

### Passo 3 — Criar um Personal Access Token (PAT)

O CI precisa de um token com permissões para publicar no GitHub Pages, escrever status de PR e registrar logs na branch `vrt-logs`.

1. Acesse **GitHub → Settings → Developer Settings → Personal Access Tokens → Fine-grained tokens**
2. Clique em **Generate new token**
3. Configure:
   - **Token name:** `VRT_TOKEN`
   - **Expiration:** 90 dias (ou "No expiration" para uso em pesquisa)
   - **Repository access:** Selecione apenas o repositório do projeto
   - **Permissions — Repository permissions:**
     - `Contents` → **Read and write**
     - `Pull requests` → **Read and write**
     - `Commit statuses` → **Read and write**
     - `Pages` → **Read and write**
4. Clique em **Generate token**
5. **Copie o valor** — ele só aparece uma vez

### Passo 4 — Adicionar o token como secret do repositório

1. No repositório, vá em **Settings → Secrets and variables → Actions**
2. Clique em **New repository secret**
3. Preencha:
   - **Name:** `VRT_TOKEN`
   - **Value:** cole o token copiado no passo anterior
4. Clique em **Add secret**

> Sem este secret, os workflows falharão ao tentar publicar no GitHub Pages, criar status de commit ou gravar logs na branch `vrt-logs`.

### Passo 5 — Habilitar GitHub Pages

A branch `gh-pages` é criada automaticamente pelo workflow na primeira execução. Por isso, siga esta ordem:

1. Crie um PR de teste (pode ser qualquer alteração mínima) para disparar o workflow
2. Aguarde o workflow `Visual Regression Check` concluir — ele criará a branch `gh-pages`
3. No repositório, vá em **Settings → Pages**
4. Em **Source**, selecione **Deploy from a branch**
5. Em **Branch**, selecione `gh-pages` / `/ (root)`
6. Clique em **Save**

A URL da Review UI de cada PR ficará disponível em:
```
https://SEU_USUARIO.github.io/SEU_REPO/pr-{NUMERO}/
```

### Passo 6 — Configurar Branch Protection (recomendado)

Para que o merge seja **efetivamente bloqueado** quando houver diferenças visuais não aprovadas:

1. Vá em **Settings → Branches → Add branch protection rule**
2. **Branch name pattern:** `main`
3. Marque ✅ **Require status checks to pass before merging**
4. Marque ✅ **Require branches to be up to date before merging**
5. Na busca de status checks, adicione: `visual-regression/review`

   > Este check só aparece na busca após a **primeira execução** do workflow `visual-regression.yml`. Se não aparecer, crie um PR de teste primeiro, depois volte e adicione o check.

6. (Recomendado) Marque ✅ **Do not allow bypassing the above settings**
7. Clique em **Create**

### Resumo das configurações do repositório

| Configuração | Local | Valor |
|:-------------|:------|:------|
| Secret `VRT_TOKEN` | Settings → Secrets → Actions | Fine-grained PAT com `contents`, `statuses`, `pull-requests` e `pages` write |
| GitHub Pages | Settings → Pages | Branch: `gh-pages`, pasta: `/ (root)` |
| Branch protection | Settings → Branches | Status check: `visual-regression/review` obrigatório para `main` |

> Nenhuma baseline precisa ser criada manualmente. O workflow captura a baseline de `origin/main` via git worktree a cada execução — sempre atualizada, nunca desatualizada.

---

## CI/CD — GitHub Actions

O projeto inclui **3 workflows** que automatizam o fluxo completo.

### Workflow 1: Visual Regression Check

**Arquivo:** `.github/workflows/visual-regression.yml`  
**Trigger:** Pull Request aberto ou atualizado para `main`

**Fluxo:**

```
PR aberto/atualizado
    │
    ├── Checkout do código
    ├── npm ci + instalar Chromium
    ├── npx pixelguard test --no-fail
    │       ├── git fetch origin/main + worktree → captura baseline
    │       ├── captura screenshots da branch atual
    │       └── compara com 3 técnicas em paralelo
    ├── Gerar meta.json (dados do CI + token XOR-encriptado)
    ├── Build Review UI + montar pasta deploy/
    ├── Deploy para GitHub Pages (branch gh-pages)
    ├── Definir status do commit (success ou pending)
    ├── Comentar no PR com tabela de resultados
    └── Upload artefatos (results/ — 30 dias)
```

> A baseline é capturada dinamicamente de `origin/main` via git worktree a cada execução. Nenhuma imagem é armazenada no repositório.

**Resultado no PR:**
- **Sem diferenças** → Status `success`, merge liberado
- **Com diferenças** → Status `pending`, merge bloqueado. Comentário com link para a Review UI no GitHub Pages

**URL da Review UI no PR:**
```
https://SEU_USUARIO.github.io/SEU_REPO/pr-{NUMBER}/
```

### Workflow 2: Ações via Comentário

**Arquivo:** `.github/workflows/approve-visual.yml`  
**Trigger:** Comentário em Pull Request

Permite controlar o status do PR sem abrir a Review UI:

| Comentário | Ação | Status resultante |
|:-----------|:-----|:-----------------|
| `/approve-visual` | Aprova as diferenças | `success` — merge liberado |
| `/reject-visual` | Rejeita as diferenças | `failure` — merge bloqueado |
| `/reset-visual` | Reseta para pendente | `pending` — review necessário |

Cada comando gera uma reação emoji no comentário e um comentário de confirmação automático.

### Workflow 3: Log de Regressões Aprovadas

**Arquivo:** `.github/workflows/vrt-log.yml`  
**Trigger:** Pull Request fechada com merge para `main`

Registra na branch `vrt-logs` apenas as PRs que foram mergeadas **com diffs visuais detectados** — para auditoria futura de regressões aprovadas.

```
PR mergeada
    │
    ├── Busca o artefato da run de visual-regression.yml deste PR
    ├── Se failed == 0 → não registra nada
    └── Se failed > 0 → commit em vrt-logs/pr-{N}/
            ├── results.json  (resultados completos)
            └── summary.md   (branch, commit, autor, técnicas, qtd diffs)
```

> Consulte o histórico acessando a branch `vrt-logs` no GitHub.

---

## Usando PixelGuard em Outro Projeto

O PixelGuard foi desenhado como pacote reutilizável. Veja como integrar em qualquer aplicação web:

### Instalação

```bash
npm install pixelguard --save-dev
```

> O pacote ainda não está publicado no npm. Para usar a partir deste repositório, instale localmente:
> ```bash
> npm install /caminho/para/TCC/packages/pixelguard --save-dev
> ```

### Configuração inicial

```bash
npx pixelguard init
```

Isso cria um `pixelguard.config.js` na raiz com todos os campos documentados. Edite conforme sua aplicação:

```javascript
/** @type {import('pixelguard').PixelGuardConfig} */
export default {
  baseUrl: null,       // null = auto-start; ou 'http://localhost:3000'
  port: 3000,          // porta do seu servidor de dev

  viewports: [
    { name: 'mobile',  width: 375,  height: 812 },
    { name: 'desktop', width: 1440, height: 900 },
  ],

  pages: [
    { name: 'home',     path: '/' },
    { name: 'login',    path: '/login' },
    { name: 'dashboard', path: '/dashboard' },
  ],

  comparators: ['pixel', 'ssim', 'region'],

  thresholds: {
    pixel:  { tolerance: 0.1, maxDiffPercent: 0.1 },
    ssim:   { minScore: 0.99, blockSize: 8         },
    region: { gridCols: 4, gridRows: 6, maxDiffPercent: 1.0 },
  },

  // Branch remota usada como baseline — capturada via git worktree a cada run
  baseBranch: 'main',
};
```

### Adicionar scripts ao package.json

```json
{
  "scripts": {
    "vrt":          "npx pixelguard test",
    "review:local": "npx pixelguard test --no-fail && npx pixelguard review"
  }
}
```

### Rodar o pipeline de testes

```bash
# Pipeline completo — baseline capturada de origin/main automaticamente
npm run vrt

# Pipeline + abre Review UI
npm run review:local
```

Nenhuma baseline precisa ser criada ou commitada — o PixelGuard captura a baseline de `origin/main` via git worktree a cada execução.

#### Modo sem remote (fallback local)

O PixelGuard tem dois cenários distintos em que opera sem worktree, ambos usando a pasta `baselines/` como referência:

**Situação 1 — Projeto ainda não publicado (sem `origin`)**

O repositório existe só localmente, sem remote configurado. Crie as baselines antes do primeiro push:

```bash
npx pixelguard capture          # captura o estado atual como referência
npx pixelguard update-baselines # copia para baselines/
```

A partir daí `npm run vrt` funciona normalmente usando `baselines/` como referência. Após publicar e configurar o remote, o worktree passa a ser usado automaticamente — as baselines locais viram fallback apenas.

**Situação 2 — Remote existe, mas você quer comparar localmente**

Remote configurado, mas você está sem internet ou quer testar sem depender do fetch. O fluxo é o mesmo: capture o estado que deve ser a referência e salve como baseline:

```bash
git checkout main
npx pixelguard capture          # captura main como referência
npx pixelguard update-baselines # salva em baselines/
git checkout minha-branch
npm run vrt                     # compara contra baselines/ locais
```

> Neste caso o PixelGuard ainda tentará o worktree primeiro. Se o fetch falhar, cai automaticamente para `baselines/` e avisa no console. Quando a conexão voltar, o worktree volta a ser usado sem nenhuma configuração extra.

### Adicionar os workflows de CI

Copie os arquivos de `.github/workflows/` deste repositório para o seu projeto. Os essenciais são `visual-regression.yml` e `approve-visual.yml`; `vrt-log.yml` é opcional (registra auditoria de regressões aprovadas). Ajuste apenas:

1. **`visual-regression.yml`** — se seu servidor de dev não for Vite na porta 8000, ajuste o `baseUrl` no `pixelguard.config.js`
2. **Branch `main`** — substitua pelo nome da sua branch principal se for diferente

Siga os passos da seção [Configuração do Repositório GitHub do Zero](#configuração-do-repositório-github-do-zero) para configurar o PAT, o secret, o GitHub Pages e a branch protection.

---

## Comandos de Referência

### Scripts npm

| Comando | Descrição |
|:--------|:----------|
| `npm run dev` | Inicia o servidor de desenvolvimento (porta 8000) |
| `npm run build` | Build de produção |
| `npm run vrt` | **Pipeline completo:** captura → comparação → relatório |
| `npm run review:local` | Pipeline completo + abre Review UI (porta 8080) |
| `npm run update-baselines` | Copia `results/current/` → `baselines/` (uso local; CI usa worktree automaticamente) |
| `npm run deploy` | Build da Review UI + monta deploy estático |
| `npm run scenarios` | Roda os 13 cenários de mutação |
| `npm run review` | Inicia a Review UI (porta 8080) |

### CLI PixelGuard

| Comando | Descrição |
|:--------|:----------|
| `npx pixelguard init` | Cria `pixelguard.config.js` |
| `npx pixelguard capture` | Captura screenshots → `results/current/` |
| `npx pixelguard compare` | Compara com baselines → `results/results.json` |
| `npx pixelguard report` | Gera relatório HTML → `results/report.html` |
| `npx pixelguard test` | Pipeline completo (capture → compare → report) |
| `npx pixelguard update-baselines` | Copia current/ → baselines/ (uso local; CI usa worktree automaticamente) |
| `npx pixelguard review` | Inicia Review UI → localhost:8080 |
| `npx pixelguard review --port 4000` | Review UI em porta customizada |
| `npx pixelguard review --build` | Rebuild da UI antes de iniciar |
| `npx pixelguard deploy --pr 42` | Monta deploy estático para GitHub Pages |

---

## Referência de Configuração

### `pixelguard.config.js`

| Propriedade | Tipo | Padrão | Descrição |
|:------------|:-----|:-------|:----------|
| `baseUrl` | `string \| null` | `null` | URL da aplicação. `null` = auto-start Vite |
| `port` | `number` | `8000` | Porta para auto-start do Vite |
| `viewports` | `Array<{ name, width, height }>` | mobile/tablet/desktop | Viewports para captura |
| `pages` | `Array<{ name, path }>` | `[{ name: 'home', path: '/' }]` | Páginas a capturar |
| `comparators` | `string[]` | `['pixel','ssim','region']` | Técnicas a executar |
| `thresholds.pixel` | `{ tolerance, maxDiffPercent }` | `{ 0.1, 0.1 }` | Limiares do comparador pixel |
| `thresholds.ssim` | `{ minScore, blockSize }` | `{ 0.99, 8 }` | Limiares do comparador SSIM |
| `thresholds.region` | `{ gridCols, gridRows, maxDiffPercent }` | `{ 4, 6, 1.0 }` | Limiares do comparador de regiões |
| `masks` | `Array<{ row, col }>` | `[]` | Células da grade a ignorar |
| `baseBranch` | `string` | `'main'` | Branch remota usada como baseline (capturada via worktree) |
| `baselinesDir` | `string` | `'baselines'` | Pasta de baselines locais — usada como fallback quando não há git remote |
| `resultsDir` | `string` | `'results'` | Pasta de resultados (relativa ao cwd) |
| `freeze` | `boolean` | `true` | Congela `Date`/`Math.random` para determinismo |
| `reviewPort` | `number` | `8080` | Porta da Review UI |

### Variáveis de ambiente

| Variável | Padrão | Descrição |
|:---------|:-------|:----------|
| `PIXELGUARD_RESULTS_DIR` | `./results` | Sobrescreve `resultsDir` do config |
| `PIXELGUARD_BASELINES_DIR` | `./baselines` | Sobrescreve `baselinesDir` do config |
| `STATIC_DEPLOY` | — | Quando `true`, a Review UI usa dados estáticos (GitHub Pages) |

### GitHub Secrets

| Secret | Obrigatório | Permissões necessárias |
|:-------|:-----------|:-----------------------|
| `VRT_TOKEN` | Sim | `contents:write`, `statuses:write`, `pull-requests:write`, `pages:write` |

---

## Estrutura do Projeto

```
├── pixelguard.config.js              # Configuração do pipeline VRT
├── package.json                      # Dependências e scripts
├── vite.config.js                    # Configuração do Vite
├── index.html                        # Entry point HTML
│
├── results/                          # Saída do pipeline (não commitado)
│   ├── current/                      #   Screenshots atuais
│   ├── diffs/                        #   Mapas de diferença
│   │   ├── pixel/                    #     Diff pixel a pixel
│   │   ├── ssim/                     #     Diff SSIM (heatmap)
│   │   └── region/                   #     Diff por regiões
│   ├── results.json                  #   Resultados consolidados
│   └── report.html                   #   Relatório HTML
│
├── src/                              # Aplicação React (dashboard MVP)
│   ├── App.jsx                       #   Componente raiz + roteamento de cenários
│   ├── main.jsx                      #   Entry point React
│   ├── theme.js                      #   Tema MUI (vermelho/azul, Roboto)
│   ├── components/                   #   Componentes do dashboard
│   │   ├── NavBar.jsx
│   │   ├── HeroBanner.jsx
│   │   ├── StatsGrid.jsx
│   │   ├── TransactionsTable.jsx
│   │   ├── InfoSidebar.jsx
│   │   ├── ActivityFeed.jsx
│   │   └── Footer.jsx
│   └── scenarios/                    #   12 arquivos de cenário (11 de mutação + 1 controle)
│       ├── ScenarioColor.jsx
│       ├── ScenarioLayout.jsx
│       ├── ScenarioTypography.jsx
│       ├── ScenarioDynamic.jsx
│       ├── ScenarioComponent.jsx
│       ├── ScenarioOpacity.jsx
│       ├── ScenarioShadow.jsx
│       ├── ScenarioMicroShift.jsx
│       ├── ScenarioBorder.jsx
│       ├── ScenarioRemoval.jsx
│       ├── ScenarioFontSwap.jsx
│       └── ScenarioIdentical.jsx
│
├── tests/
│   └── scenarios.js                  # Runner dos 13 cenários (dynamic executa 2×: s/ e c/ máscara)
│
├── packages/
│   └── pixelguard/                   # Pacote npm reutilizável
│       ├── bin/
│       │   └── cli.js                #   CLI unificada (entry point)
│       ├── src/                      #   Engine de comparação
│       │   ├── config.js             #     Loader do pixelguard.config.js
│       │   ├── capture.js            #     Captura com Playwright
│       │   ├── capture-baseline.js   #     Captura baseline de origin/baseBranch via worktree
│       │   ├── compare.js            #     Orquestrador de comparação
│       │   ├── report.js             #     Gerador de relatório HTML
│       │   ├── update-baselines.js   #     Copia current → baselines
│       │   ├── deploy.js             #     Build e deploy estático
│       │   └── comparators/          #     Implementações das 3 técnicas
│       │       ├── pixel.js          #       pixelmatch (anti-aliased aware)
│       │       ├── ssim.js           #       SSIM (implementação própria — Wang 2004)
│       │       └── region.js         #       Grade com máscaras
│       ├── review/                   #   Review UI (embutida)
│       │   ├── server/               #     Servidor HTTP + REST API
│       │   │   ├── index.js          #       Router e servidor (porta 8080)
│       │   │   └── review.js         #       Lógica de approve/reject/reset
│       │   ├── dist/                 #     SPA React pré-buildada
│       │   └── src/                  #     Código-fonte React (para rebuild)
│       │       ├── ReviewPage.jsx
│       │       └── components/
│       │           ├── ReviewHeader.jsx
│       │           ├── TestRunPanel.jsx
│       │           ├── DiffListPanel.jsx
│       │           ├── DiffViewer.jsx
│       │           ├── ReviewEmptyState.jsx
│       │           └── shared.jsx
│       ├── package.json
│       └── index.d.ts                #   Definições TypeScript
│
├── .github/workflows/
│   ├── visual-regression.yml         # Check visual em PRs
│   ├── approve-visual.yml            # Comandos via comentário no PR
│   └── vrt-log.yml                   # Log de regressões aprovadas (branch vrt-logs)
│
└── scripts/                          # Utilitários de documentação
    ├── capture-scenarios.js          #   Gera composites docs/images/scenarios/
    ├── build-scenario-panels.js
    ├── capture-figs.js
    ├── combine-diffs.js
    └── trim-images.js
```

---

## Determinismo

Para garantir que capturas consecutivas produzam imagens **bit-idênticas**, o pipeline aplica:

| Técnica | Descrição |
|:--------|:----------|
| **Date congelado** | `new Date()` sempre retorna `2025-06-15T10:00:00` |
| **Math.random determinístico** | PRNG com seed 42 substituído globalmente |
| **Animações desativadas** | CSS injetado: `animation: none !important; transition: none !important` |
| **Locale/timezone fixos** | `pt-BR` e `America/Sao_Paulo` |
| **DeviceScaleFactor = 1** | Evita variação de DPI entre máquinas |

Isso garante que o pipeline não gere falsos positivos por variação de conteúdo dinâmico, e que os resultados sejam reproduzíveis em qualquer ambiente (local, CI, máquinas diferentes).

---

<p align="center">
  <strong>PixelGuard</strong> — Regressão visual automatizada para React
</p>
