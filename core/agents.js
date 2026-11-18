/* Carregamento independente do personagem e sem dependências externas. */
(() => {
  'use strict';
  const app = window.AssistenteLive;
  app.loadAgent = async function (definition, imagePath) {
    if (!definition?.atlas || !definition.animations) throw new Error('Definição do agente ausente.');
    const image = new Image();
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('Não foi possível carregar ' + imagePath));
      image.src = imagePath;
    });
    const a = definition.atlas;
    if (image.naturalWidth !== a.columns * a.frameWidth) throw new Error('Atlas incompatível.');
    const count = a.columns * Math.floor(image.naturalHeight / a.frameHeight);
    for (const animation of Object.values(definition.animations)) {
      if (!animation.frames?.length) throw new Error('Animação vazia.');
      for (const frame of animation.frames) {
        if (!Number.isInteger(frame.sprite) || frame.sprite < 0 || frame.sprite >= count || !Number.isFinite(frame.duration) || frame.duration <= 0) throw new Error('Quadro inválido.');
      }
    }
    return { definition, image };
  };
})();
