(() => {
  'use strict';
  const app = window.AssistenteLive;
  const pendingImageFits = new WeakMap();
  const imageFitListeners = new WeakMap();
  app.loadEventImage = function (value, signal, className = 'event-image', alt = '') {
    app.checkSignal(signal);
    const sources = Array.isArray(value) ? value : [value];
    if (!sources.length) return Promise.resolve(null);
    return new Promise((resolve, reject) => {
      const picture = new Image();
      let settled = false;
      let sourceIndex = 0;
      const finish = (result, error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal?.removeEventListener('abort', cancel);
        picture.onload = picture.onerror = null;
        if (!result) picture.removeAttribute('src');
        if (error) reject(error); else resolve(result);
      };
      const cancel = () => finish(null, app.abortError());
      const tryNext = () => {
        while (sourceIndex < sources.length) {
          let url;
          try { url = new URL(String(sources[sourceIndex++] || '').trim()); } catch { continue; }
          if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) continue;
          picture.src = url.href;
          return;
        }
        finish(null);
      };
      const timer = setTimeout(() => finish(null), 5000);
      picture.className = className;
      picture.alt = alt;
      picture.referrerPolicy = 'no-referrer';
      picture.onload = () => picture.naturalWidth > 0 ? finish(picture) : tryNext();
      picture.onerror = tryNext;
      signal?.addEventListener('abort', cancel, { once: true });
      tryNext();
    });
  };
  app.fitImagesToText = function (container, text, selector = '.event-image', maxSize = 240) {
    if (!container || !text) return;
    const observeImages = images => {
      const previous = imageFitListeners.get(container);
      previous?.forEach(({ image, load, error }) => {
        image.removeEventListener('load', load);
        image.removeEventListener('error', error);
      });
      const listeners = [];
      for (const image of images) {
        const retry = () => requestAnimationFrame(fit);
        image.addEventListener('load', retry);
        image.addEventListener('error', retry);
        listeners.push({ image, load: retry, error: retry });
      }
      imageFitListeners.set(container, listeners);
    };
    const fit = () => {
      if (!container.isConnected) return 'detached';
      const images = [...container.querySelectorAll(selector)];
      if (!images.length) return 'done';
      observeImages(images);
      if (text.getBoundingClientRect().height <= 0) return 'hidden';

      // Each pass remeasures after the image width changes the text wrapping.
      // Keep the source aspect ratio and leave a usable column for the message.
      for (let pass = 0; pass < 8; pass += 1) {
        const textHeight = text.getBoundingClientRect().height;
        if (textHeight <= 0) return 'hidden';
        const targetHeight = Math.ceil(Math.min(maxSize, Math.max(32, textHeight)));
        const style = getComputedStyle(container);
        const innerWidth = Math.max(0, container.clientWidth
          - parseFloat(style.paddingLeft || 0) - parseFloat(style.paddingRight || 0));
        const gap = parseFloat(style.columnGap || style.gap || 0) || 0;
        const textFloor = Math.min(180, innerWidth * 0.35);
        const widthBudget = Math.max(32, innerWidth - textFloor - gap * images.length);
        let usedWidth = 0;
        for (const image of images) {
          const ratio = image.naturalWidth > 0 && image.naturalHeight > 0
            ? image.naturalWidth / image.naturalHeight : 1;
          const naturalWidth = targetHeight * ratio;
          const width = Math.max(1, Math.min(naturalWidth, maxSize * 2, Math.max(32, widthBudget - usedWidth)));
          const height = Math.max(1, width / ratio);
          image.style.width = `${width}px`;
          image.style.height = `${height}px`;
          image.style.flexBasis = `${width}px`;
          image.style.visibility = image.complete && image.naturalWidth > 0 ? 'visible' : 'hidden';
          usedWidth += width;
        }
      }
      for (const image of images) image.style.visibility = image.complete && image.naturalWidth > 0 ? 'visible' : 'hidden';
      return 'done';
    };
    const previous = pendingImageFits.get(container);
    previous?.disconnect();
    const result = fit();
    if (result !== 'hidden' || typeof ResizeObserver !== 'function') {
      pendingImageFits.delete(container);
      return;
    }
    const observer = new ResizeObserver(() => {
      const next = fit();
      if (next !== 'hidden') {
        observer.disconnect();
        pendingImageFits.delete(container);
      }
    });
    pendingImageFits.set(container, observer);
    observer.observe(container);
    observer.observe(text);
  };
})();