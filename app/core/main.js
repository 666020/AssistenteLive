(() => {
  'use strict';
  const app = window.AssistenteLive = window.AssistenteLive || {};
  app.state = 'loading';
  app.ready = (async () => {
    const catalog = app.catalog;
    const loaded = new Map();
    app.loadErrors = [];
    const loadingScreen = document.getElementById('startup-loading');
    const loadingProgress = document.getElementById('startup-loading-progress');
    const loadingTitle = document.getElementById('startup-loading-title');
    const loadingDetail = document.getElementById('startup-loading-detail');
    const completedLoads = new Set();
    loadingProgress.max = catalog.length;
    loadingProgress.value = 0;
    loadingDetail.textContent = `Preparando Agents (0 de ${catalog.length})`;
    const markLoadComplete = entry => {
      completedLoads.add(entry.id);
      loadingProgress.value = completedLoads.size;
      loadingDetail.textContent = `Carregando Agents (${completedLoads.size} de ${catalog.length})`;
      if (completedLoads.size >= catalog.length) {
        loadingTitle.textContent = 'Carregamento concluído';
        setTimeout(() => { loadingScreen.hidden = true; }, 450);
      }
    };
    app.hideStartupLoading = () => { loadingScreen.hidden = true; };
    app.showStartupLoadingIfPending = () => {
      if (completedLoads.size < catalog.length) loadingScreen.hidden = false;
    };
    const loadEntry = async entry => {
      loadingTitle.textContent = 'Carregando AssistenteLive…';
      try {
        const definition = app[entry.id];
        const agent = await app.loadAgent(definition, entry.image);
        for (const name of ['SHOW', 'GREET', 'RESTPOSE', 'HIDE']) {
          if (!definition.animations[name]) throw new Error('Animação necessária ausente: ' + name);
        }
        loaded.set(entry.id, agent);
        return agent;
      } catch (error) {
        app.loadErrors.push({ id: entry.id, message: error.message });
        console.error('AssistenteLive: falha ao carregar ' + entry.name, error);
        return null;
      } finally {
        markLoadComplete(entry);
      }
    };
    let preferredId = null;
    try { preferredId = localStorage.getItem('AssistenteLive.selectedAgent'); } catch {}
    const firstEntry = catalog.find(entry => entry.id === preferredId) || catalog[0];
    let firstLoaded = await loadEntry(firstEntry);
    if (!firstLoaded) {
      for (const entry of catalog) {
        if (entry === firstEntry) continue;
        firstLoaded = await loadEntry(entry);
        if (firstLoaded) break;
      }
    }
    if (!firstLoaded) throw new Error('Nenhum Agent conseguiu carregar. Confira sua conexão e tente atualizar a página.');
    const canvas = document.getElementById('agent');
    const stage = document.getElementById('stage');
    const bubble = document.getElementById('bubble');
    let busy = false;
    let selector;
    app.cancelPresentation = () => {
      stage.hidden = true; bubble.hidden = true;
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    };
    async function present(id, example = 'curto', event = null, signal = app.workController.signal, messageOverride = null, onSequenceItemComplete = null) {
      if (signal.aborted) return false;
      if (busy || !loaded.has(id)) return false;
      busy = true;
      selector.setBusy(true);
      let failed = false;
      const agent = loaded.get(id);
      try {
        app.state = 'waiting';
        app.currentAgent = selector.agentName(id);
        canvas.setAttribute('aria-label', app.currentAgent);
        // Escala fixa por personagem, aplicada ao quadro inteiro durante todo o ciclo.
        const entry = catalog.find(item => item.id === id);
        stage.style.setProperty('--agent-width', `${selector.agentWidth(id)}px`);
        stage.dataset.position = selector.presentationPosition(id);
        await app.wait(800, signal);
        if (event && !app.eventInWindow(event)) return true;
        const player = new app.AnimationPlayer(canvas, agent);
        const presentation = new app.Presentation(player, stage, bubble, app.agentAnimationChoices(id), app.agentMessageAnimationMode());
        const message = messageOverride || (event ? app.makeEventMessage(event) : app.makeMessage(example, app.currentAgent));
        const sequence = Array.isArray(message) ? message : null;
        bubble.classList.toggle('mastery', sequence ? sequence[0]?.mastery !== false : message.mastery);
        if (sequence) await presentation.runSequence(sequence, signal, onSequenceItemComplete);
        else await presentation.run(message.text, message.readingMs, signal, message.images || message.imageUrl, message.displayOptions || app.merlinSettings?.imageLayout?.(), message.soundCategory);
      } catch (error) {
        if (error.name === 'AbortError') return false;
        failed = true;
        app.state = 'error'; app.error = error.message;
        console.error('AssistenteLive: falha na apresentação.', error);
      } finally {
        stage.hidden = true; bubble.hidden = true;
        busy = false; selector.setBusy(false);
        if (example !== 'evento' && !signal.aborted) selector.events?.auto?.schedule();
      }
      if (failed) selector.reportError(selector.agentName(id));
      return !failed;
    }
    selector = app.selector = new app.Selector(catalog, loaded, present);
    const eventsPanel = app.eventsPanel = new app.EventsPanel(selector, present);
    new app.AutomaticEvents(eventsPanel);
    app.merlinPanel = new app.MerlinPanel(selector, present);
    app.state = 'ready';
    if (!selector.selected) { app.state = 'error'; selector.open(); }
    void Promise.all(catalog.filter(entry => !loaded.has(entry.id)).map(async entry => {
      const agent = await loadEntry(entry);
      if (agent) selector.agentLoaded(entry, agent);
      else selector.agentLoadFailed(entry);
    })).then(async () => {
      let enabled = true;
      let welcome = 'Olá! Seja bem-vindo(a) à live. Pressione F1 para abrir o menu.';
      try {
        enabled = localStorage.getItem('AssistenteLive.welcomeEnabled.v1') !== 'false';
        welcome = localStorage.getItem('AssistenteLive.welcomeMessage.v1') ?? welcome;
      } catch {}
      welcome = String(welcome).trim() || 'Olá! Seja bem-vindo(a) à live. Pressione F1 para abrir o menu.';
      if (!enabled || !selector.panel.hidden) return;
      try { await app.wait(500, app.workController.signal); } catch { return; }
      if (!selector.panel.hidden || app.state !== 'ready') return;
      const presenterId = loaded.has(selector.selected) ? selector.selected : catalog.find(entry => loaded.has(entry.id))?.id;
      if (!presenterId) return;
      const readingMs = Math.max(5000, Math.min(15000, Math.ceil(welcome.length / 18) * 1000));
      await present(presenterId, 'welcome', null, app.workController.signal, [{
        text: welcome, readingMs, mastery: false, soundCategory: 'announcements'
      }]);
    });
  })().catch(error => {
    app.state = 'error';
    app.error = error.message;
    document.getElementById('stage').hidden = true;
    document.getElementById('startup-loading').hidden = true;
    document.getElementById('panel-status').textContent = 'Falha ao iniciar. Confira os arquivos da pasta e atualize a fonte.';
    document.getElementById('settings').hidden = false;
    console.error('AssistenteLive: falha ao iniciar.', error);
  });
})();
