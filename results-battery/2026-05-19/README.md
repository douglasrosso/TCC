# Bateria de testes — 2026-05-19

Executado em: 2026-05-19T00:15:39Z  
Comando: `node tests/scenarios.js`  
Node.js: v24.12.0 | Playwright: 1.58.2 | Chromium headless

## Configuração dos limiares

| Técnica | Parâmetros |
|---------|-----------|
| Pixel | tolerance=0.1, maxDiffPercent=0.1% |
| SSIM | minScore=0.99, blockSize=8 |
| Região | grade 4×6 (24 células), maxDiffPercent=1.0% por célula |

## Resultados por cenário

| Cenário | Pixel | SSIM | Regiões |
|---------|-------|------|---------|
| Mudança sutil de cor | FAIL (5.854%) | PASS (0.9976) | FAIL (8/24) |
| Deslocamento de layout | FAIL (0.637%) | FAIL (0.8762) | FAIL (15/24) |
| Variação tipográfica | FAIL (2.186%) | FAIL (0.9269) | FAIL (13/24) |
| Conteúdo dinâmico s/ máscara | PASS (0.064%) | PASS (0.9979) | FAIL (1/24) |
| Conteúdo dinâmico c/ máscara | PASS (0.064%) | PASS (0.9979) | PASS (0/24) |
| Alteração de componente | FAIL (0.128%) | PASS (0.9924) | FAIL (1/24) |
| Opacidade e transparência | PASS (0%) | PASS (0.9996) | PASS (0/24) |
| Sombra e elevação | PASS (0%) | PASS (0.9953) | PASS (0/24) |
| Micro-deslocamento (1px) | FAIL (0.198%) | FAIL (0.9316) | FAIL (14/24) |
| Alteração de borda fina | FAIL (0.273%) | PASS (0.9998) | FAIL (4/24) |
| Remoção de elemento | FAIL (0.399%) | FAIL (0.9822) | FAIL (3/24) |
| Troca de família de fonte | FAIL (2.614%) | FAIL (0.8886) | FAIL (14/24) |
| Imagem idêntica (controle) | PASS (0%) | PASS (1.0000) | PASS (0/24) |

## Resumo de detecção (12 cenários com mutação)

- Pixel: **8/12** detectados
- SSIM: **5/12** detectados
- Regiões: **9/12** detectados
- Falso positivo no controle: **nenhum**

## Tempos médios de execução (13 cenários)

- Pixel: ~122 ms | SSIM: ~129 ms | Regiões: ~122 ms

## Estrutura da pasta

```
baseline/       — 13 capturas de referência (PNG, sem mutação)
current/        — 13 capturas atuais (PNG, com mutação ou variação)
diffs/pixel/    — 13 imagens de diferença pixel a pixel
diffs/ssim/     — 13 heatmaps de similaridade SSIM
diffs/region/   — 13 mapas de grade por regiões
scenarios-results.json — resultados completos em JSON
```
