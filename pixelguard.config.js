/**
 * PixelGuard — Arquivo de configuração do projeto.
 *
 * Todos os campos abaixo são opcionais. Se um campo for omitido, o PixelGuard
 * usa o valor padrão definido na biblioteca. Para `thresholds`, o merge é
 * profundo: você pode sobrescrever apenas uma chave (ex.: só `pixel.maxDiffPercent`)
 * sem precisar redeclarar o restante.
 *
 * Documentação completa: packages/pixelguard/README.md
 *
 * @type {import('pixelguard').PixelGuardConfig}
 */
export default {
  // ─── Servidor da aplicação a ser testada ───────────────────────────────────
  // URL base onde a aplicação está rodando.
  // Deixe `null` para o PixelGuard subir um servidor Vite automaticamente
  // (útil em desenvolvimento e CI). Use uma URL completa
  // (ex.: "http://localhost:3000") para apontar para um servidor já em execução.
  baseUrl: null,

  // Porta em que o Vite será iniciado quando `baseUrl` for `null`.
  // Ignorado se `baseUrl` já estiver definido.
  port: 8000,

  // ─── O que capturar ────────────────────────────────────────────────────────
  // Larguras (viewports) em que cada página será capturada.
  // Cada item gera um arquivo separado por página, no formato
  // "<page>-<viewport>-<width>w.png".
  viewports: [
    { name: "mobile", width: 360, height: 640 },
    { name: "tablet", width: 768, height: 1024 },
    { name: "desktop", width: 1366, height: 768 },
  ],

  // Páginas a capturar. `path` é relativo a `baseUrl`.
  // Adicione uma entrada por rota relevante da aplicação.
  pages: [{ name: "dashboard", path: "/" }],

  // ─── Limiares de aceitação por técnica ─────────────────────────────────────
  // Estes são os valores adotados como ponto de partida no estudo. Cada
  // aplicação tem um perfil próprio de ruído (anti-aliasing, fontes, gradientes)
  // e de tipos de mudança esperados; ajuste os valores conforme necessário.
  // Você pode sobrescrever apenas as chaves que quiser — o restante mantém
  // os defaults da biblioteca (merge profundo no loader de configuração).
  thresholds: {
    // Comparação pixel a pixel (biblioteca pixelmatch).
    pixel: {
      // Sensibilidade por canal de cor (0–1). Menor = mais sensível.
      // 0.1 é o valor padrão da pixelmatch.
      tolerance: 0.1,
      // Percentual máximo de pixels diferentes na imagem inteira aceito como PASS.
      // Ex.: 0.1 = até 0,1% da imagem pode divergir antes de marcar como FAIL.
      maxDiffPercent: 0.1,
    },

    // Comparação perceptual SSIM (similaridade estrutural).
    ssim: {
      // Pontuação SSIM mínima aceita como PASS (0–1, mais próximo de 1 = mais rígido).
      // 0.99 é o default da ferramenta (revisado após análise dos cenários
      // do estudo: a 0.98 a SSIM deixava passar mudanças sutis de cor, de
      // componente e de remoção de elemento; a 0.99 essas três passam a ser
      // detectadas sem causar falso positivo no cenário de conteúdo dinâmico
      // com mascaramento, que registra SSIM ≈ 0,9982). Reduza (ex.: 0.97)
      // se a aplicação tiver muito ruído de anti-aliasing entre execuções.
      minScore: 0.99,
      // Tamanho da janela em pixels usada no cálculo em blocos.
      // Valores maiores = menos blocos, custo menor, granularidade menor.
      blockSize: 8,
    },

    // Comparação por regiões (segmentação em grade).
    region: {
      // Número de colunas e linhas da grade. Total de células = gridCols * gridRows.
      gridCols: 4,
      gridRows: 6,
      // Percentual máximo de pixels diferentes dentro de uma célula
      // antes que a célula seja considerada reprovada.
      maxDiffPercent: 1.0,
    },
  },

  // ─── Mascaramento de regiões dinâmicas ─────────────────────────────────────
  // Lista de células da grade do comparador `region` que devem ser ignoradas.
  // Use para áreas inevitavelmente variáveis (data, hora, contadores ao vivo).
  // Coordenadas começam em 0. Ex.: { row: 0, col: 3 } ignora a 1ª linha, 4ª coluna.
  // Mantenha a lista mínima — máscaras amplas escondem regressões reais.
  masks: [],

  // ─── Quais técnicas executar ───────────────────────────────────────────────
  // Subconjunto de ['pixel', 'ssim', 'region']. As três rodam em paralelo
  // por padrão. Remova alguma se quiser um fluxo mais leve em CI.
  comparators: ["pixel", "ssim", "region"],

  // ─── Diretórios (relativos à raiz do projeto) ──────────────────────────────
  // Onde ficam as imagens de referência (versionadas no Git).
  baselinesDir: "baselines",
  // Onde o PixelGuard escreve capturas atuais, diffs, JSONs e relatório HTML.
  resultsDir: "results",

  // ─── Determinismo da captura ───────────────────────────────────────────────
  // Quando `true`, o PixelGuard congela `Date` e `Math.random` no navegador
  // antes do carregamento da página, eliminando variações entre execuções
  // causadas por relógio ou números aleatórios. Mantenha `true` em CI.
  freeze: true,

  // ─── Interface de revisão ──────────────────────────────────────────────────
  // Porta usada pelo comando `pixelguard review` para abrir a Review UI local.
  reviewPort: 8080,
};
