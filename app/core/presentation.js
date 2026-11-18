(() => {
  'use strict';
  const app = window.AssistenteLive;
  app.Presentation = class {
    constructor(player, stage, bubble, animationSequence = null, messageAnimationMode = 'loop') {
      Object.assign(this, { player, stage, bubble, animationSequence, messageAnimationMode, running: false });
    }
    async run(message, readingMs = 5000, signal, imageSource, displayOptions = {}, soundCategory = null) {
      return this.runSequence([{ text: message, readingMs, images: imageSource, displayOptions, mastery: this.bubble.classList.contains('mastery'), soundCategory }], signal);
    }
    async runSequence(items, signal, onItemComplete = null) {
      if (this.running) return;
      const sequence = Array.isArray(items) ? items : [];
      if (!sequence.length) return;
      this.running = true;
      try {
        app.checkSignal(signal);
        this.bubble.hidden = true;
        this.player.clear();
        const loadPictures = async item => {
          const imageSource = item.images || item.imageSource;
          const imageSpecs = Array.isArray(imageSource) ? imageSource : imageSource ? [{ url: imageSource, type: 'game', alt: '' }] : [];
          return Promise.all(imageSpecs.map(async spec => ({
            spec, picture: await app.loadEventImage(spec.urls || spec.url, signal, `event-image ${spec.type || 'game'}-image`, spec.alt || '')
          })));
        };
        let pictures = await loadPictures(sequence[0]);
        app.checkSignal(signal);
        const applyLayout = displayOptions => {
          app.merlinSettings?.applyBubbleColor?.(this.bubble, displayOptions.bubbleColor);
          const size = ['small', 'medium', 'large', 'auto'].includes(displayOptions.size) ? displayOptions.size : 'medium';
          const fontSize = ['small', 'medium', 'large', 'xlarge'].includes(displayOptions.fontSize) ? displayOptions.fontSize : 'medium';
          const fontFamily = ['arial', 'verdana', 'trebuchet', 'georgia', 'courier'].includes(displayOptions.fontFamily) ? displayOptions.fontFamily : 'arial';
          const savedWidth = String(displayOptions.bubbleWidth);
          const width = savedWidth === 'auto' ? 'max' : ['320', '400', '480', '640', '800', '1000', '1200', 'max'].includes(savedWidth) ? savedWidth : '1000';
          this.bubble.classList.remove('image-size-small', 'image-size-medium', 'image-size-large', 'image-size-auto');
          this.bubble.classList.add(`image-size-${size}`);
          this.bubble.classList.remove('message-width-auto', 'message-width-320', 'message-width-400', 'message-width-480', 'message-width-640', 'message-width-800', 'message-width-1000', 'message-width-1200', 'message-width-max');
          this.bubble.classList.add(`message-width-${width}`);
          this.bubble.style.setProperty('--message-width', `${width === 'max' ? 0 : width}px`);
          this.bubble.classList.remove('member-image-shape-square', 'member-image-shape-circle');
          this.bubble.classList.add(`member-image-shape-${displayOptions.memberShape === 'square' ? 'square' : 'circle'}`);
          this.bubble.classList.remove('mastery-text-small', 'mastery-text-medium', 'mastery-text-large', 'mastery-text-xlarge');
          this.bubble.classList.add(`mastery-text-${fontSize}`);
          this.bubble.classList.remove('message-font-arial', 'message-font-verdana', 'message-font-trebuchet', 'message-font-georgia', 'message-font-courier');
          this.bubble.classList.add(`message-font-${fontFamily}`);
        };
        const showItem = (item, loadedPictures) => {
          this.bubble.textContent = '';
          for (const { picture, spec } of loadedPictures) {
            if (!picture) continue;
            picture.classList.add(`image-${spec.position === 'right' ? 'right' : 'left'}`);
            this.bubble.append(picture);
          }
          const text = document.createElement('span');
          text.className = 'mastery-text';
          text.textContent = item.text;
          this.bubble.append(text);
          this.bubble.hidden = false;
          void app.playAnnouncementSound?.(item.soundCategory || (item.mastery === false ? 'announcements' : 'masterizations'));
          if (item.displayOptions?.size === 'auto') app.fitImagesToText(this.bubble, text);
          this.positionBubble();
        };
        this.stage.hidden = false;
        app.state = 'show';
        const choices = this.animationSequence;
        const custom = choices && ['entry', 'message', 'exit'].every(group => Array.isArray(choices[group]) && choices[group].length);
        const choose = options => options[Math.floor(Math.random() * options.length)];
        const entrance = custom ? choose(choices.entry) : 'SHOW';
        const exit = custom ? choose(choices.exit) : 'HIDE';
        await this.player.play(entrance, signal);
        let nextPictures = null;
        for (let index = 0; index < sequence.length; index++) {
          app.checkSignal(signal);
          const item = sequence[index];
          const displayOptions = item.displayOptions || {};
          applyLayout(displayOptions);
          this.bubble.classList.toggle('mastery', item.mastery !== false);
          showItem(item, pictures);
          if (!custom && index === 0) {
            app.state = 'greet';
            await this.player.play('GREET', signal);
          }
          if (index + 1 < sequence.length) nextPictures = loadPictures(sequence[index + 1]);
          app.state = 'message';
          let restpose = true;
          const animateRestpose = async () => {
            if (custom) {
              if (this.messageAnimationMode === 'rotate') {
                let index = Math.floor(Math.random() * choices.message.length);
                while (restpose) {
                  await this.player.play(choices.message[index], signal);
                  index = (index + 1) % choices.message.length;
                }
              } else {
                const action = choose(choices.message);
                while (restpose) await this.player.play(action, signal);
              }
            } else if (!custom) {
              while (restpose) await this.player.play('RESTPOSE', signal);
            }
          };
          const animation = animateRestpose();
          try { await app.wait(Number(item.readingMs) || 5000, signal); }
          finally { restpose = false; await animation; }
          await onItemComplete?.(index);
          if (nextPictures) pictures = await nextPictures;
        }
        this.bubble.hidden = true;
        app.state = 'hide';
        await this.player.play(exit, signal);
      } finally {
        this.bubble.hidden = true;
        this.stage.hidden = true;
        this.player.clear();
        this.bubble.textContent = '';
        this.bubble.style.removeProperty('--message-width');
        this.bubble.classList.remove('image-size-small', 'image-size-medium', 'image-size-large', 'image-size-auto', 'member-image-shape-square', 'member-image-shape-circle', 'message-width-auto', 'message-width-320', 'message-width-400', 'message-width-480', 'message-width-640', 'message-width-800', 'message-width-1000', 'message-width-1200', 'message-width-max');
        this.bubble.classList.remove('mastery-text-small', 'mastery-text-medium', 'mastery-text-large', 'mastery-text-xlarge');
        this.bubble.classList.remove('message-font-arial', 'message-font-verdana', 'message-font-trebuchet', 'message-font-georgia', 'message-font-courier');
        this.running = false;
        app.state = 'finished';
      }
    }

    positionBubble() {
      const position = this.stage.dataset.position || 'bottom-left';
      const agent = this.player.canvas.getBoundingClientRect();
      const bubble = this.bubble.getBoundingClientRect();
      const margin = 24;
      const aboveSpace = Math.max(0, agent.top - margin);
      const belowSpace = Math.max(0, window.innerHeight - agent.bottom - margin);
      const centerColumn = position === 'center' || position.endsWith('-center');
      let side;
      if (!centerColumn && position.endsWith('-left')) side = 'right';
      else if (!centerColumn && position.endsWith('-right')) side = 'left';
      else {
        side = position.startsWith('top-') ? 'below'
          : position.startsWith('bottom-') ? 'above'
          : aboveSpace >= belowSpace ? 'above' : 'below';
        const chosenSpace = side === 'above' ? aboveSpace : belowSpace;
        const otherSpace = side === 'above' ? belowSpace : aboveSpace;
        if (bubble.height > chosenSpace && otherSpace > chosenSpace) side = side === 'above' ? 'below' : 'above';
      }
      this.stage.dataset.bubbleSide = side;
    }
  };
})();
