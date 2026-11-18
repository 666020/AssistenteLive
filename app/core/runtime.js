(() => {
  'use strict';
  const app = window.AssistenteLive;
  app.workController = new AbortController();
  app.abortError = () => new DOMException('Operação cancelada.', 'AbortError');
  app.checkSignal = signal => { if (signal?.aborted) throw app.abortError(); };
  app.cancelWork = () => {
    app.workController.abort();
    app.workController = new AbortController();
    app.cancelPresentation?.();
  };
  app.wait = (milliseconds, signal) => new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(app.abortError()); return; }
    const done = () => { signal?.removeEventListener('abort', cancel); resolve(); };
    const timer = setTimeout(done, milliseconds);
    const cancel = () => { clearTimeout(timer); signal.removeEventListener('abort', cancel); reject(app.abortError()); };
    signal?.addEventListener('abort', cancel, { once: true });
  });
})();
