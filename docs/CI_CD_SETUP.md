# PixelGuard — CI/CD com GitHub Actions

Guia completo para configurar a integração contínua de regressão visual com GitHub Actions.

---

## Visão Geral do Fluxo

```
PR aberta → GitHub Actions captura + compara → diffs encontrados?
  ├─ NÃO → status check ✅ (merge liberado)
  └─ SIM → status check ⏳ (merge bloqueado)
           ├─ Bot comenta no PR com resumo
           ├─ Artefatos uploadados (screenshots + diffs)
           └─ Desenvolvedor revisa localmente na UI
               ├─ Aprova todas → status check ✅ (merge liberado)
               └─ Rejeita alguma → status check ❌ (merge negado)

Merge na main → Workflow atualiza baselines automaticamente
```

---

## Pré-requisitos

- Repositório no GitHub
- Node.js 20+
- Playwright (Chromium)

---

## 1. Configuração do Repositório GitHub

### 1.1 Branch Protection Rules (obrigatório)

Para que o merge só seja permitido após aprovação visual:

1. Vá em **Settings → Branches → Add branch protection rule**
2. Branch name pattern: `main`
3. Marque **Require status checks to pass before merging**
4. Busque e adicione o check: **`visual-regression/review`**
5. (Opcional) Marque **Require branches to be up to date before merging**
6. Salve

> ⚠️ O status check `visual-regression/review` só aparece para seleção **depois** que o workflow roda pela primeira vez.
> Execute o workflow manualmente uma vez (via `workflow_dispatch`) para registrar o check.

### 1.2 Permissões do GITHUB_TOKEN

O `GITHUB_TOKEN` padrão do Actions já tem permissão suficiente. Os workflows declaram:

```yaml
permissions:
  contents: read        # ler código
  pull-requests: write  # comentar no PR
  statuses: write       # criar status checks
```

---

## 2. Workflows

### 2.1 `visual-regression.yml` — CI Check no PR

**Trigger:** toda PR para `main` (+ dispatch manual)

**O que faz:**
1. Instala dependências e Chromium
2. Captura screenshots de todas as telas/viewports
3. Compara com baselines
4. Gera `results/meta.json` com info do commit/branch/PR
5. Se **sem diffs**: status check → ✅ success
6. Se **com diffs**:
   - Status check → ⏳ pending
   - Upload de artefatos (pasta `results/`)
   - Bot comenta no PR com tabela de resultados por técnica
   - Instruções de review local no comentário

### 2.2 `update-baselines.yml` — Atualiza Baselines no Merge

**Trigger:** push na `main` (após merge)

**O que faz:**
1. Captura screenshots atuais (do código merged)
2. Executa `npm run update-baselines` (copia `current/` → `baselines/`)
3. Reseta `reviews.json`
4. Commita e pusha com `[skip ci]`

---

## 3. Review Local (quando há diffs)

Quando o CI encontra diffs, o bot comenta no PR com instruções. Processo:

### 3.1 Baixar artefatos

1. Acesse o link do workflow no comentário do bot
2. Na seção **Artifacts**, baixe `visual-regression-results`
3. Extraia o ZIP na pasta `results/` na raiz do projeto:

```bash
# Exemplo (ajuste o caminho do download)
unzip visual-regression-results.zip -d results/
```

### 3.2 Iniciar Review UI

```bash
# Terminal 1 — Servidor API (porta 3060)
npm run review:ui

# Terminal 2 — Frontend Vite (porta 3050)
npm run dev
```

Acesse: **http://localhost:3050/review**

### 3.3 Revisar telas

- A UI mostra cada tela com as 3 técnicas (Pixel, SSIM, Região)
- Alterne entre técnicas usando o seletor na área de comparação
- Aprove ✅ ou rejeite ❌ cada tela

### 3.4 Atualização automática do status check

Para que a aprovação/rejeição reflita no PR, configure o token:

**Windows (PowerShell):**
```powershell
$env:GITHUB_TOKEN = "ghp_SeuTokenAqui"
npm run review:ui
```

**Linux/macOS:**
```bash
GITHUB_TOKEN=ghp_SeuTokenAqui npm run review:ui
```

> O token precisa ter permissão `repo:status` (ou ser um PAT com escopo `repo`).

Quando **todas** as telas forem aprovadas:
- Status check → ✅ success → merge liberado

Quando **qualquer** tela for rejeitada:
- Status check → ❌ failure → merge bloqueado

---

## 4. Criação do GitHub Token (PAT)

1. GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens**
2. **New token**
3. Nome: `pixelguard-review`
4. Repositório: selecione o repositório específico
5. Permissions:
   - **Commit statuses**: Read and Write
6. Gere e copie o token

Ou, com token clássico:
1. GitHub → **Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. Escopo: `repo:status`

---

## 5. Estrutura de Arquivos

```
.github/
  workflows/
    visual-regression.yml    # CI check no PR
    update-baselines.yml     # Atualiza baselines no merge
baselines/                   # Screenshots de referência
results/
  results.json               # Resultados da comparação
  reviews.json               # Status das revisões
  meta.json                  # Info do CI (commit, branch, PR)
  current/                   # Screenshots atuais
  diffs/                     # Imagens de diferença
```

---

## 6. O que o Bot Comenta no PR

Exemplo de comentário automático:

> ## 🔍 Review Visual Necessário
>
> **Commit:** `a1b2c3d` · **Branch:** `feature/nova-tela`
>
> | Técnica | Resultado |
> |---------|----------|
> | Pixel | ❌ 2 OK / 1 FAIL |
> | SSIM | ✅ 3 OK / 0 FAIL |
> | Região | ❌ 2 OK / 1 FAIL |
>
> ### ⏳ Merge bloqueado até review visual ser aprovado
>
> **Para revisar localmente:**
> 1. Baixe os artefatos do workflow
> 2. Extraia a pasta `results/` na raiz do projeto
> 3. Execute: `npm run review:ui` e `npm run dev`
> 4. Acesse: http://localhost:3050/review
> 5. Ao aprovar todas as telas, o status da PR será atualizado automaticamente

---

## 7. Info de CI na Review UI

O header da Review UI mostra automaticamente:

- **Branch** — chip roxo com nome da branch (ex: `feature/nova-tela`)
- **Commit** — chip azul com SHA curto, clicável (abre no GitHub)
- **PR** — chip verde `PR #42`, clicável (abre o PR)

Quando rodando localmente sem `meta.json`, exibe "Execução local".

---

## 8. Resumo dos Comandos

| Comando | Descrição |
|---------|-----------|
| `npm run capture` | Captura screenshots de todas as telas |
| `npm run compare` | Compara screenshots com baselines |
| `npm run update-baselines` | Copia `current/` → `baselines/` |
| `npm run review:ui` | Inicia servidor de review (porta 3060) |
| `npm run dev` | Inicia frontend Vite (porta 3050) |

---

## FAQ

**P: O status check não aparece na branch protection?**
R: Execute o workflow pelo menos uma vez. O check só fica disponível após o primeiro uso.

**P: Como forçar re-run do check visual?**
R: Faça um novo push na branch ou re-execute o workflow no GitHub Actions.

**P: As baselines ficam no git?**
R: Sim, na pasta `baselines/`. São commitadas automaticamente pelo workflow `update-baselines`.

**P: Posso usar isso em outro projeto?**
R: Sim! Os scripts de captura, comparação e review são independentes. Copie os scripts, workflows e configure as URLs/viewports no arquivo de configuração.
