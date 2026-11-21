/* Painel local: apenas seleção e teste. Nenhuma integração externa. */
(() => {
  'use strict';
  const app = window.AssistenteLive;
  app.Selector = class {
    constructor(catalog, loaded, onTest) {
      this.catalog = catalog; this.loaded = loaded; this.busy = false;
      this.onTest = onTest;
      this.panel = document.getElementById('settings');
      this.status = document.getElementById('panel-status');
      this.testButton = document.getElementById('test-agent');
      this.radios = [];
      this.presenterChecks = [];
      this.agentCards = new Map();
      this.loadingIds = new Set(catalog.filter(entry => !loaded.has(entry.id) && !app.loadErrors.some(error => error.id === entry.id)).map(entry => entry.id));
      this.failedIds = new Set(app.loadErrors.map(error => error.id));
      this.presenterIndex = 0;
      this.presenterIds = catalog.filter(entry => loaded.has(entry.id)).slice(0, 1).map(entry => entry.id);
      try {
        const savedPresenters = JSON.parse(localStorage.getItem('AssistenteLive.presentationAgents.v1') || 'null');
        if (Array.isArray(savedPresenters)) {
          const valid = catalog.map(entry => entry.id).filter(id => savedPresenters.includes(id));
          this.presenterIds = valid.length ? valid : this.presenterIds;
        }
      } catch { document.getElementById('storage-note').textContent = 'Neste navegador, a escolha dos Agents vale apenas até recarregar.'; }
      this.agentOverrides = this.loadAgentOverrides();
      this.agentCardNames = new Map();
      this.agentNameInput = document.getElementById('agent-edit-name');
      this.agentWidthInput = document.getElementById('agent-edit-width');
      this.agentWidthValue = document.getElementById('agent-edit-width-value');
      this.agentResetButton = document.getElementById('agent-edit-reset');
      this.agentPositionButtons = [...document.querySelectorAll('.agent-position-option')];
      this.tabs = new app.PanelTabs();
      this.merlinSettings = app.merlinSettings = new app.MerlinSettings();
      this.example = 'curto';
      const examples = ['curto', 'longo', 'saudacao'];
      try { const saved = localStorage.getItem('AssistenteLive.messageExample'); if (examples.includes(saved)) this.example = saved; } catch {}
      for (const example of examples) {
        document.getElementById(`example-${example}`).setAttribute('aria-pressed', String(example === this.example));
        document.getElementById(`example-${example}`).addEventListener('click', () => {
          this.example = example;
          try { localStorage.setItem('AssistenteLive.messageExample', example); } catch { document.getElementById('storage-note').textContent = 'Não foi possível salvar a escolha da mensagem neste navegador.'; }
          for (const choice of examples) {
            document.getElementById(`example-${choice}`).setAttribute('aria-pressed', String(choice === example));
          }
        });
      }
      this.selected = catalog.find(entry => loaded.has(entry.id))?.id || null;
      this.pendingSelected = null;
      this.followPendingSelection = false;
      try {
        const saved = localStorage.getItem('AssistenteLive.selectedAgent');
        if (loaded.has(saved)) this.selected = saved;
        else if (catalog.some(entry => entry.id === saved)) { this.pendingSelected = saved; this.followPendingSelection = true; }
      } catch { document.getElementById('storage-note').textContent = 'Neste navegador, a escolha vale apenas até recarregar.'; }
      const grid = document.getElementById('agent-grid');
      for (const entry of catalog) {
        const label = document.createElement('label'); label.className = 'agent-card';
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = 'agent-choice'; radio.value = entry.id;
        radio.checked = entry.id === this.selected; radio.disabled = !loaded.has(entry.id);
        const thumbnail = document.createElement('canvas'); thumbnail.className = 'agent-thumbnail';
        thumbnail.setAttribute('aria-hidden', 'true');
        const name = document.createElement('span'); name.textContent = this.agentName(entry.id);
        this.agentCardNames.set(entry.id, name);
        label.append(radio, thumbnail, name);
        const loadStatus = document.createElement('small');
        loadStatus.textContent = loaded.has(entry.id) ? '' : 'Carregando…';
        label.append(loadStatus);
        if (loaded.has(entry.id)) this.drawAgentThumbnail(entry, loaded.get(entry.id), thumbnail);
        else label.classList.add('unavailable');
        this.agentCards.set(entry.id, { label, radio, thumbnail, loadStatus });
        radio.addEventListener('change', () => {
          if (!radio.checked) return;
          this.followPendingSelection = false;
          this.selected = entry.id;
          try { localStorage.setItem('AssistenteLive.selectedAgent', entry.id); }
          catch { document.getElementById('storage-note').textContent = 'Escolha aplicada, mas não foi possível salvá-la para a próxima abertura.'; }
          this.update();
        });
        this.radios.push(radio); grid.append(label);
        if (loaded.has(entry.id)) this.addPresenterOption(entry);
      }
      this.sortAgentCards();
      this.agentNameInput.addEventListener('input', () => {
        if (!this.selected) return;
        this.agentOverrides[this.selected] = { ...(this.agentOverrides[this.selected] || {}), name: this.agentNameInput.value.slice(0, 40) };
        this.saveAgentOverrides();
        this.refreshAgentName(this.selected);
        this.update();
      });
      this.agentWidthInput.addEventListener('input', () => {
        if (!this.selected) return;
        const width = Number(this.agentWidthInput.value);
        this.agentOverrides[this.selected] = { ...(this.agentOverrides[this.selected] || {}), width };
        this.agentWidthValue.value = `${width} px`;
        this.agentWidthValue.textContent = `${width} px`;
        this.saveAgentOverrides();
      });
      for (const button of this.agentPositionButtons) button.addEventListener('click', () => {
        if (!this.selected) return;
        const selected = this.agentPositions(this.selected);
        const next = selected.includes(button.dataset.position)
          ? selected.filter(position => position !== button.dataset.position)
          : [...selected, button.dataset.position];
        if (!next.length) {
          this.status.textContent = 'Mantenha pelo menos um local selecionado para este Agent.';
          return;
        }
        this.agentOverrides[this.selected] = { ...(this.agentOverrides[this.selected] || {}), positions: next };
        this.saveAgentOverrides();
        this.update();
      });
      this.agentResetButton.addEventListener('click', () => {
        if (!this.selected) return;
        delete this.agentOverrides[this.selected];
        this.saveAgentOverrides();
        this.update();
      });
      this.animationEditor = new app.AgentAnimationEditor(this);
      this.animationEditor.render();
      document.getElementById('close-panel').addEventListener('click', () => this.close());
      document.addEventListener('keydown', event => {
        if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
        if (event.key === 'F1') {
          event.preventDefault(); if (this.panel.hidden) this.open(); else this.close();
        } else if (event.key === 'Escape' && !this.panel.hidden) { event.preventDefault(); this.close(); }
      });
      this.testButton.addEventListener('click', () => {
        if (this.busy || !this.selected) return;
        const example = this.example;
        this.close(); void onTest(this.selected, example);
      });
      this.update();
      if (app.ConfigurationPanel) this.configurationPanel = app.configurationPanel = new app.ConfigurationPanel(this);
    }
    drawAgentThumbnail(entry, agent, thumbnail) {
      const sprite = agent.definition.animations.RESTPOSE.frames[0].sprite;
      if (entry.thumbnail) {
        const { x, y, width, height } = entry.thumbnail;
        const atlas = agent.definition.atlas;
        thumbnail.width = width; thumbnail.height = height;
        thumbnail.getContext('2d').drawImage(agent.image,
          (sprite % atlas.columns) * atlas.frameWidth + x,
          Math.floor(sprite / atlas.columns) * atlas.frameHeight + y,
          width, height, 0, 0, width, height);
      } else {
        const player = new app.AnimationPlayer(thumbnail, agent);
        player.draw(sprite);
      }
    }
    addPresenterOption(entry) {
      if (this.presenterChecks.some(item => item.id === entry.id)) return;
      const presenterLabel = document.createElement('label');
      presenterLabel.className = 'agent-presenter-option';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox'; checkbox.value = entry.id;
      checkbox.checked = this.presenterIds.includes(entry.id);
      const presenterName = document.createElement('span'); presenterName.textContent = this.agentName(entry.id);
      checkbox.addEventListener('change', () => {
        const next = checkbox.checked
          ? [...this.presenterIds, entry.id]
          : this.presenterIds.filter(id => id !== entry.id);
        if (!next.length) {
          checkbox.checked = true;
          this.status.textContent = 'Mantenha pelo menos um Agent selecionado para apresentar mensagens.';
          return;
        }
        this.presenterIds = this.catalog.filter(item => next.includes(item.id)).map(item => item.id);
        this.presenterIndex = 0;
        try { localStorage.setItem('AssistenteLive.presentationAgents.v1', JSON.stringify(this.presenterIds)); }
        catch { document.getElementById('storage-note').textContent = 'Escolha aplicada, mas não foi possível salvar os Agents que apresentam mensagens.'; }
        this.update();
      });
      presenterLabel.append(checkbox, presenterName);
      this.presenterChecks.push({ id: entry.id, checkbox, name: presenterName, label: presenterLabel });
      this.sortPresenterOptions();
    }
    sortPresenterOptions() {
      this.presenterChecks.sort((a, b) => a.name.textContent.localeCompare(b.name.textContent, 'pt-BR', { sensitivity: 'base' }));
      const grid = document.getElementById('agent-presenter-grid');
      for (const item of this.presenterChecks) grid.append(item.label);
    }
    sortAgentCards() {
      const ordered = [...this.agentCards.entries()].sort(([idA], [idB]) =>
        this.agentCardNames.get(idA).textContent.localeCompare(this.agentCardNames.get(idB).textContent, 'pt-BR', { sensitivity: 'base' }));
      const grid = document.getElementById('agent-grid');
      for (const [, card] of ordered) grid.append(card.label);
    }
    agentLoaded(entry, agent) {
      const card = this.agentCards.get(entry.id);
      if (!card) return;
      this.loadingIds.delete(entry.id);
      this.failedIds.delete(entry.id);
      card.radio.disabled = false;
      card.label.classList.remove('unavailable');
      card.loadStatus.remove();
      this.drawAgentThumbnail(entry, agent, card.thumbnail);
      this.addPresenterOption(entry);
      if (this.followPendingSelection && this.pendingSelected === entry.id) {
        this.selected = entry.id;
        card.radio.checked = true;
        this.followPendingSelection = false;
      }
      this.update();
    }
    agentLoadFailed(entry) {
      const card = this.agentCards.get(entry.id);
      if (!card) return;
      this.loadingIds.delete(entry.id);
      this.failedIds.add(entry.id);
      card.label.classList.add('unavailable');
      card.loadStatus.textContent = 'Não carregou';
      this.update();
    }
    loadAgentOverrides() {
      try {
        const saved = JSON.parse(localStorage.getItem('AssistenteLive.agentOverrides.v1') || '{}');
        return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
      } catch { return {}; }
    }
    saveAgentOverrides() {
      try { localStorage.setItem('AssistenteLive.agentOverrides.v1', JSON.stringify(this.agentOverrides)); }
      catch { document.getElementById('storage-note').textContent = 'Não foi possível salvar as opções dos Agents neste OBS.'; }
    }
    testAnimationSequence() {
      if (this.busy || !this.selected || !this.loaded.has(this.selected)) return;
      const id = this.selected;
      this.close({ suppressPending: true });
      void this.onTest(id, 'animation-test', null, undefined, [{
        text: 'Prévia da animação selecionada', readingMs: 5000, mastery: false
      }]);
    }
    agentName(id) {
      const entry = this.catalog.find(item => item.id === id);
      return String(this.agentOverrides[id]?.name ?? '').trim() || entry?.name || id;
    }
    agentWidth(id) {
      const entry = this.catalog.find(item => item.id === id);
      const width = Number(this.agentOverrides[id]?.width);
      return Number.isFinite(width) && width >= 96 && width <= 400 ? width : entry?.displayWidth || 192;
    }
    agentPosition(id) {
      const positions = ['bottom-left', 'bottom-center', 'bottom-right', 'center-left', 'center', 'center-right', 'top-left', 'top-center', 'top-right'];
      const position = this.agentOverrides[id]?.position;
      return positions.includes(position) ? position : 'bottom-left';
    }
    agentPositions(id) {
      const valid = new Set(['bottom-left', 'bottom-center', 'bottom-right', 'center-left', 'center', 'center-right', 'top-left', 'top-center', 'top-right']);
      const saved = this.agentOverrides[id]?.positions;
      if (Array.isArray(saved)) {
        const positions = [...new Set(saved.filter(position => valid.has(position)))];
        if (positions.length) return positions;
      }
      if (this.agentOverrides[id]?.randomPosition === true) return [...valid];
      return [this.agentPosition(id)];
    }
    presentationPosition(id) {
      const positions = this.agentPositions(id);
      return positions[Math.floor(Math.random() * positions.length)];
    }
    nextPresenter() {
      const available = this.presenterIds.filter(id => this.loaded.has(id));
      if (!available.length) return null;
      const id = available[this.presenterIndex % available.length];
      this.presenterIndex = (this.presenterIndex + 1) % available.length;
      return id;
    }
    refreshAgentName(id) {
      const label = this.agentCardNames.get(id);
      if (label) {
        label.textContent = this.agentName(id);
        this.sortAgentCards();
      }
      const presenter = this.presenterChecks.find(item => item.id === id);
      if (presenter) {
        presenter.name.textContent = this.agentName(id);
        this.sortPresenterOptions();
      }
    }
    open() {
      app.hideStartupLoading?.();
      this.events?.auto?.pause();
      app.cancelWork();
      // Exponha o estado aberto antes de liberar filas; setBusy(false) pode tentar processar masterizações pendentes.
      this.panel.hidden = false;
      this.events?.cancel();
      this.merlinPanel?.cancel();
      if (this.tabs.active === 'merlin-fila') this.merlinPanel?.onOpen();
      if (this.tabs.active === 'anuncios') this.events?.onOpen();
      if (this.tabs.active !== 'mascotes') {
        document.getElementById(`tab-${this.tabs.active}`).focus();
        return;
      }
      const radio = this.radios.find(item => item.checked) || this.radios.find(item => !item.disabled);
      if (radio) radio.focus(); else document.getElementById('close-panel').focus();
    }
    close({ suppressPending = false } = {}) {
      if (this.events?.auto && this.events.auto.input.value !== String(this.events.auto.minutes)) this.events.auto.change();
      this.panel.hidden = true; this.events?.auto?.resume();
      app.showStartupLoadingIfPending?.();
      if (!suppressPending) this.merlinPanel?.processPending();
    }
    setBusy(value) {
      this.busy = value || Boolean(this.events?.running);
      this.update();
      if (!value) this.merlinPanel?.processPending();
    }
    update() {
      const entry = this.catalog.find(item => item.id === this.selected);
      const editedEntry = entry ? { ...entry, name: this.agentName(entry.id) } : null;
      document.getElementById('selected-agent-name').textContent = entry ? `${editedEntry.name} selecionado` : 'Nenhum Agent';
      if (entry && document.activeElement !== this.agentNameInput) this.agentNameInput.value = this.agentOverrides[entry.id]?.name ?? entry.name;
      this.agentNameInput.disabled = !entry;
      this.agentWidthInput.disabled = !entry;
      this.agentResetButton.disabled = !entry;
      for (const button of this.agentPositionButtons) {
        button.disabled = !entry;
        button.setAttribute('aria-pressed', String(Boolean(entry && this.agentPositions(entry.id).includes(button.dataset.position))));
      }
      if (entry && document.activeElement !== this.agentWidthInput) this.agentWidthInput.value = String(this.agentWidth(entry.id));
      this.agentWidthValue.value = `${entry ? this.agentWidth(entry.id) : 192} px`;
      this.agentWidthValue.textContent = this.agentWidthValue.value;
      const presenters = this.presenterIds.map(id => this.agentName(id));
      const presenterStatus = presenters.length > 1
        ? `${presenters.slice(0, -1).join(', ')} e ${presenters.at(-1)} alternam nas mensagens.`
        : presenters.length === 1 ? `${presenters[0]} apresenta as mensagens.` : 'Nenhum Agent selecionado para apresentar mensagens.';
      this.status.textContent = this.busy
        ? 'Apresentação em andamento. Aguarde a saída completa para testar outro.'
        : entry ? presenterStatus : 'Nenhum Agent carregou. Confira se a pasta foi extraída inteira.';
      if (this.loadingIds.size) this.status.textContent += ` Carregando ${this.loadingIds.size} Agent(s) em segundo plano.`;
      if (this.failedIds.size) this.status.textContent += ` ${this.failedIds.size} Agent(s) não carregaram; confira os arquivos.`;
      this.testButton.disabled = this.busy || !entry;
      this.testButton.textContent = entry ? `Testar ${editedEntry.name}` : 'Testar Agent';
      this.animationEditor?.selectAgent(this.selected);
      this.animationEditor?.render();
      if (this.events) this.events.update();
    }
    reportError(name) {
      this.status.textContent = `Não foi possível apresentar ${name}. Confira os arquivos e atualize a fonte.`;
      this.open();
    }
  };
})();
