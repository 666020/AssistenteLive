(() => {
  'use strict';
  const app = window.AssistenteLive;
  const pendingImageFits = new WeakMap();
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
    const fit = () => {
      if (!container.isConnected) return 'detached';
      const images = [...container.querySelectorAll(selector)];
      if (!images.length) return 'done';
      const style = getComputedStyle(container);
      const containerWidth = container.clientWidth;
      const textHeight = text.getBoundingClientRect().height;
      if (containerWidth <= 0 || textHeight <= 0) return 'hidden';
      const horizontalSpace = containerWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0) - (parseFloat(style.borderLeftWidth) || 0) - (parseFloat(style.borderRightWidth) || 0);
      const gap = parseFloat(style.columnGap) || parseFloat(style.gap) || 0;
      const fontSize = parseFloat(getComputedStyle(text).fontSize) || 16;
      const minimumTextWidth = Math.max(120, fontSize * 7);
      const widthLimit = Math.max(32, (horizontalSpace - gap * images.length - minimumTextWidth) / images.length);
      const size = Math.ceil(Math.min(maxSize, widthLimit, Math.max(32, textHeight)));
      for (const image of images) {
        image.style.width = `${size}px`; image.style.height = `${size}px`; image.style.flexBasis = `${size}px`;
        image.style.visibility = 'visible';
      }
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
