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

  // Técnicas de comparação executadas em paralelo
  comparators: ['pixel', 'ssim', 'region'],

  // Limiares de aceitação por técnica — valores adotados no estudo
  thresholds: {
    pixel: {
      tolerance:      0.1,  // sensibilidade por canal RGB (0–1); 0.1 = padrão pixelmatch
      maxDiffPercent: 0.1,  // até 0,1 % dos pixels podem divergir antes de FAIL
    },

    ssim: {
      minScore:  0.99,  // ≥ 0,99 para PASS — elevado de 0,98: a 0,98 mudanças
                        // sutis de cor, componente e remoção passavam sem detecção
      blockSize: 8,     // janela de cálculo em pixels (blocos não sobrepostos)
    },

    region: {
      gridCols:       4,    // grade 4 × 6 = 24 células por imagem
      gridRows:       6,
      maxDiffPercent: 1.0,  // até 1 % de pixels diferentes dentro da célula = PASS
    },
  },
};
