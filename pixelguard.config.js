/** @type {import('pixelguard').PixelGuardConfig} */
export default {
  // Viewports capturados — um arquivo por viewport por página
  viewports: [
    { name: 'mobile',  width: 360,  height: 640  },
    { name: 'tablet',  width: 768,  height: 1024 },
    { name: 'desktop', width: 1366, height: 768  },
  ],

  // Páginas monitoradas
  pages: [{ name: 'dashboard', path: '/' }],

  thresholds: {
    // 0.99 em vez do default 0.98: a 0.98 mudanças sutis de cor,
    // componente e remoção de elemento passavam sem detecção.
    ssim: { minScore: 0.99 },
  },
};
