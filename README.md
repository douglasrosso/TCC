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
npm run review          # Build + start review UI (http://localhost:3060)
npm run review:start    # Start review server only (assumes dist/)
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
| `npm run review` | Build + start review UI (http://localhost:3060) |
| `npm run review:approve-all` | Aprovar todas as diffs |
| `npm run review:reject-all` | Rejeitar todas as diffs |
| `npm run review:history` | Histórico de reviews |
| `npm run review:reset` | Resetar status |
| `npm run review:start` | Start review server (serve `packages/pixelguard-review/dist/`) |
| `npm run review:build` | Build da UI de review (packages/pixelguard-review) |
| `npm run e2e` | Testes E2E Playwright |
| `npm run e2e:ui` | Testes E2E com interface visual |

## Testes E2E

```bash
npm run e2e              # Roda todos (14 funcionais + 4 visuais)
npm run e2e:ui           # Interface visual do Playwright
```

## Avaliação para TCC

## Configuração necessária

Antes de usar o pipeline de Visual Regression e o Review UI, confirme as configurações abaixo:

- **Segredos / Tokens (CI e local)**:
  - `VRT_TOKEN` (recomendado): token usado pelo servidor de review para postar status no GitHub e pelo workflow `update-baselines` para commitar baselines. No GitHub Actions crie um Secret `VRT_TOKEN` com um Personal Access Token (PAT) que tenha as permissões descritas abaixo.
  - Alternativas aceitas pelo servidor: `GITHUB_TOKEN`, `GH_TOKEN`, `GITHUB_PAT` (o servidor procura por essas variáveis também).

- **Permissões do PAT**:
  - `repo` (ou pelo menos `repo:status` + `contents:write`) — necessário para que a ação/CLI poste `status` checks e para que o workflow que atualiza baselines consiga commitar e pushar alterações em `baselines/`.
  - Se você pretende alterar regras de branch protection via API, o token precisa de permissões administrativas no repositório (`admin:repo_hook` / `repo` com privilégios suficientes).

- **Branch protection (recomendado)**:
  - Adicione uma regra de proteção para `main` que exija o status check `visual-regression/review` (o workflow usa esse contexto). Assim PRs ficam bloqueadas até o review visual ser aprovado.

- **Diretórios e artefatos**:
  - `results/` — artefatos gerados pelo CI (upload/download de resultados para revisão local).
  - `baselines/` — imagens de referência que o comparador usa. O workflow `update-baselines` atualiza este diretório quando um merge é realizado em `main`.

- **Portas padrão (local)**:
  - Dashboard: `http://localhost:3050/` (Vite dev)
  - Review UI: `http://localhost:3060/` (servidor estático + API)

- **Uso local (exemplo)**:
  - Defina o token localmente (PowerShell):
    ```powershell
    $env:VRT_TOKEN = "ghp_SeuTokenAqui"
    npm run review
    ```
  - Ou (Linux/macOS):
    ```bash
    VRT_TOKEN=ghp_SeuTokenAqui npm run review
    ```

  ### Passo a passo (criar token, adicionar secret e configurar branch protection)

  1) Criar um PAT no GitHub (opção simples — Token clássico)
    - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token
    - Name: `pixelguard-review`
    - Expiration: escolha conforme sua política (ou `No expiration` para testes locais)
    - Scopes: marque `repo` (ou ao menos `repo:status` + `repo` > `contents:write`)
    - Generate token → copie o valor (será mostrado só uma vez)

  2) (Opcional) Criar Fine-grained token
    - GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
    - Resource owner: selecione seu repositório
    - Permissions: `Commit statuses: Read & write`, `Contents: Read & write` (ou equivalente)
    - Generate token → copie o valor

  3) Adicionar secret no repositório
    - Vá em `Settings → Secrets and variables → Actions → New repository secret`
    - Name: `VRT_TOKEN`
    - Value: cole o token gerado
    - Save secret

  4) Configurar Branch Protection para `main`
    - Vá em `Settings → Branches → Add rule`
    - Branch name pattern: `main`
    - Marque `Require status checks to pass before merging`
    - Na lista de checks, selecione `visual-regression/review` (se não aparecer, rode o workflow manualmente uma vez)
    - (Opcional) marque `Require branches to be up to date before merging`
    - Save changes

  5) Verificar / registrar o status check
    - Rode manualmente o workflow `visual-regression.yml` (Actions → Visual Regression → Run workflow) para que o context `visual-regression/review` apareça na lista de checks.

  6) Exemplo de uso local
  ```powershell
  $env:VRT_TOKEN = "ghp_SeuTokenAqui"
  npm run review
  ```

  ou (Linux/macOS):

  ```bash
  VRT_TOKEN=ghp_SeuTokenAqui npm run review
  ```

  Se quiser, posso gerar capturas passo-a-passo (screens) mostrando exatamente onde clicar no GitHub UI e opcionalmente criar uma ação de CI que faz build do `packages/pixelguard-review` para publicar um preview (Netlify/Vercel/GitHub Pages). Diga qual prefere.

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
