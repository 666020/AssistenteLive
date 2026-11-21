(() => {
  'use strict';
  const app = window.AssistenteLive;
  const button = document.getElementById('test-cloudflare');
  const status = document.getElementById('cloudflare-status');
  let running = false;
  button.addEventListener('click', async () => {
    if (running) return;
    running = true;
    button.disabled = true;
    status.textContent = 'Testando conexão com o Cloudflare…';
    const controller = new AbortController();
    const signal = app.workController.signal;
    const cancel = () => controller.abort();
    signal.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(cancel, 10000);
    try {
      app.checkSignal(signal);
      const response = await fetch(app.cloudflareConfig.healthUrl, {
        mode: 'cors', credentials: 'omit', cache: 'no-store',
        referrerPolicy: 'no-referrer', signal: controller.signal
      });
      if (!response.ok) throw new Error('O Cloudflare respondeu HTTP ' + response.status + '. Confira se o código foi publicado.');
      const data = await response.json();
      app.checkSignal(signal);
      if (controller.signal.aborted) throw app.abortError();
      if (data.ok !== true || data.service !== 'AssistenteLive' || data.stage !== 'connectivity' || data.raConnected !== false) {
        throw new Error('Resposta diferente da esperada. Confira o endereço e a versão do Worker.');
      }
      status.textContent = 'Conexão com o Cloudflare OK neste navegador. RetroAchievements ainda não conectado.';
    } catch (error) {
      status.textContent = signal.aborted ? 'Teste cancelado. Clique para testar novamente.'
        : controller.signal.aborted ? 'O teste demorou mais de 10 segundos. Confira a internet e tente novamente.'
        : error instanceof TypeError ? 'Não foi possível conectar. Confira a internet, o endereço e a configuração CORS do Worker.'
        : error instanceof SyntaxError ? 'O Worker não retornou a resposta esperada. Confira o código publicado.'
        : error.message;
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', cancel);
      running = false;
      button.disabled = false;
    }
  });
})();
