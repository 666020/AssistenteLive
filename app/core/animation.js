(() => {
  'use strict';
  const app = window.AssistenteLive;
  app.AnimationPlayer = class {
    constructor(canvas, agent) {
      this.canvas = canvas;
      this.context = canvas.getContext('2d');
      this.agent = agent;
      this.playing = false;
      canvas.width = agent.definition.width;
      canvas.height = agent.definition.height;
    }
    clear() { this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); }
    draw(sprite) {
      const a = this.agent.definition.atlas;
      this.clear();
      this.context.drawImage(this.agent.image,
        (sprite % a.columns) * a.frameWidth, Math.floor(sprite / a.columns) * a.frameHeight,
        a.frameWidth, a.frameHeight, 0, 0, this.canvas.width, this.canvas.height);
    }
    async play(name, signal) {
      if (this.playing) throw new Error('Já existe uma animação em execução.');
      const animation = this.agent.definition.animations[name];
      if (!animation) throw new Error('Animação inexistente: ' + name);
      this.playing = true;
      try {
        // Aguarda também o último quadro. Nenhum temporizador externo corta a sequência.
        for (const frame of animation.frames) {
          app.checkSignal(signal);
          this.draw(frame.sprite);
          await app.wait(frame.duration, signal);
        }
      } finally { this.playing = false; }
    }
  };
})();
