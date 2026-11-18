(() => {
  'use strict';
  const app = window.AssistenteLive;
  const STORAGE_KEY = 'AssistenteLive.agentAnimationSequence.v1';
  const MODE_STORAGE_KEY = 'AssistenteLive.agentMessageAnimationMode.v1';
  const GROUPS = ['entry', 'message', 'exit'];
  const DEFAULT_CHOICES = { entry: ['SHOW'], message: ['CONGRATULATE'], exit: ['HIDE'] };
  const cloneChoices = value => Object.fromEntries(GROUPS.map(group => [group, value[group].slice()]));

  app.agentMessageAnimationMode = () => {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY);
      if (saved === 'rotate' || saved === 'loop') return saved;
      const legacyModes = Object.values(readSequences()).map(value => value?.messageMode).filter(mode => mode === 'rotate' || mode === 'loop');
      const mode = legacyModes.filter(value => value === 'rotate').length > legacyModes.filter(value => value === 'loop').length ? 'rotate' : 'loop';
      localStorage.setItem(MODE_STORAGE_KEY, mode);
      return mode;
    }
    catch { return 'loop'; }
  };

  function readSequences() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    } catch { return {}; }
  }

  function normalize(value) {
    if (Array.isArray(value)) {
      return { entry: value.length ? [value[0]] : DEFAULT_CHOICES.entry.slice(),
        message: value.length > 2 ? value.slice(1, -1) : DEFAULT_CHOICES.message.slice(),
        exit: value.length > 1 ? [value[value.length - 1]] : DEFAULT_CHOICES.exit.slice() };
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const choices = {};
    for (const group of GROUPS) {
      if (!Array.isArray(value[group]) || !value[group].length || value[group].length > 30
        || value[group].some(name => typeof name !== 'string')) return null;
      choices[group] = [...new Set(value[group])];
    }
    return choices;
  }

  app.agentAnimationChoices = id => {
    const saved = readSequences()[id];
    return normalize(saved) || cloneChoices(DEFAULT_CHOICES);
  };

  app.saveAgentAnimationChoices = (id, choices) => {
    const agent = app.selector?.loaded.get(id);
    const normalized = normalize(choices);
    if (!agent || !normalized || GROUPS.some(group => normalized[group].some(name => !agent.definition.animations[name]))) {
      throw new Error('Escolha pelo menos uma animação existente para Entrada, Mensagem e Final.');
    }
    const values = readSequences();
    if (JSON.stringify(normalized) === JSON.stringify(DEFAULT_CHOICES)) delete values[id];
    else values[id] = normalized;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
  };

  app.AgentAnimationEditor = class {
    constructor(selector) {
      this.selector = selector;
      this.agentId = null;
      this.choices = cloneChoices(DEFAULT_CHOICES);
      this.messageMode = app.agentMessageAnimationMode();
      this.search = document.getElementById('agent-animation-search');
      this.status = document.getElementById('agent-animation-status');
      this.previewCanvas = document.getElementById('agent-animation-preview-canvas');
      this.previewName = document.getElementById('agent-animation-preview-name');
      this.previewSequenceButton = document.getElementById('agent-animation-preview-sequence');
      this.previewStopButton = document.getElementById('agent-animation-preview-stop');
      this.list = document.getElementById('agent-animation-list');
      this.previewController = null;
      this.previewPlayer = null;
      this.resetButton = document.getElementById('agent-animation-reset');
      this.messageModeInputs = [...document.querySelectorAll('input[name="agent-message-mode"]')];
      this.search.addEventListener('input', () => this.render());
      for (const input of this.messageModeInputs) input.addEventListener('change', () => {
        if (!input.checked) return;
        this.messageMode = input.value === 'rotate' ? 'rotate' : 'loop';
        try {
          localStorage.setItem(MODE_STORAGE_KEY, this.messageMode);
          this.render();
        } catch { this.status.textContent = 'Não foi possível salvar a opção global neste OBS.'; }
      });
      this.resetButton.addEventListener('click', () => {
        this.choices = cloneChoices(DEFAULT_CHOICES);
        this.save();
      });
      this.previewSequenceButton.addEventListener('click', () => { void this.previewSequence(); });
      this.previewStopButton.addEventListener('click', () => this.stopPreview());
      this.render();
    }

    agent() { return this.selector.loaded.get(this.agentId); }
    names() { return Object.keys(this.agent()?.definition.animations || {}).sort((a, b) => a.localeCompare(b)); }

    selectAgent(id) {
      if (this.agentId === id) return;
      this.stopPreview();
      this.agentId = id;
      this.choices = normalize(app.agentAnimationChoices(id)) || cloneChoices(DEFAULT_CHOICES);
      this.previewPlayer = this.agent() ? new app.AnimationPlayer(this.previewCanvas, this.agent()) : null;
      this.render();
    }

    render() {
      const agent = this.agent();
      const disabled = !agent || this.selector.busy;
      this.search.disabled = disabled;
      this.previewSequenceButton.disabled = disabled;
      this.resetButton.disabled = disabled;
      for (const input of this.messageModeInputs) {
        input.checked = input.value === this.messageMode;
        input.disabled = false;
      }
      if (!agent) { this.status.textContent = 'Selecione um Agent que carregou corretamente.'; return; }
      const query = this.search.value.trim().toLocaleLowerCase();
      const names = this.names().filter(name => name.toLocaleLowerCase().includes(query));
      this.list.replaceChildren();
      for (const name of names) {
        const row = document.createElement('div'); row.className = 'agent-animation-row';
        const label = document.createElement('strong'); label.className = 'agent-animation-row-name'; label.textContent = name;
        row.append(label, this.button('▶', `Pré-visualizar ${name}`, () => { void this.previewOne(name); }, disabled));
        for (const [group, title] of [['entry', 'Entrada'], ['message', 'Mensagem'], ['exit', 'Saída']]) {
          const button = this.button(title, `${title} · ${name}`, () => this.toggleChoice(group, name), disabled);
          button.classList.add('agent-animation-role-button');
          button.removeAttribute('title');
          button.dataset.role = group;
          button.setAttribute('aria-pressed', String(this.choices[group].includes(name)));
          row.append(button);
        }
        this.list.append(row);
      }
      if (!names.length) {
        const hint = document.createElement('p'); hint.className = 'setting-hint';
        hint.textContent = 'Nenhuma animação corresponde à busca.';
        this.list.append(hint);
      }
      this.status.textContent = `${this.selector.agentName(this.agentId)} · uma opção aleatória de cada etapa será usada. A configuração é salva neste OBS.`;
    }

    toggleChoice(group, name) {
      if (this.choices[group].includes(name)) {
        if (this.choices[group].length <= 1) {
          this.status.textContent = 'Mantenha ao menos uma animação em cada etapa.';
          return;
        }
        this.choices[group] = this.choices[group].filter(item => item !== name);
      } else {
        if (this.choices[group].length >= 30) {
          this.status.textContent = 'O limite é de 30 opções por etapa.';
          return;
        }
        this.choices[group].push(name);
      }
      this.save();
    }

    button(text, label, action, disabled) {
      const button = document.createElement('button'); button.type = 'button'; button.textContent = text;
      button.setAttribute('aria-label', label); button.title = label; button.disabled = disabled;
      button.addEventListener('click', action); return button;
    }

    stopPreview() {
      if (this.previewController) {
        this.previewController.abort();
        this.previewName.textContent = 'Prévia interrompida';
      }
      this.previewController = null;
      this.previewStopButton.disabled = true;
    }

    async startPreview(label, playback) {
      if (!this.agent() || this.selector.busy) return;
      this.stopPreview();
      const controller = new AbortController();
      const player = new app.AnimationPlayer(this.previewCanvas, this.agent());
      this.previewPlayer = player;
      this.previewController = controller;
      this.previewStopButton.disabled = false;
      this.previewName.textContent = label;
      try { await playback(controller.signal, player); }
      catch (error) { if (error.name !== 'AbortError') this.status.textContent = `Falha na prévia: ${error.message}`; }
      finally {
        if (this.previewController === controller) {
          this.previewController = null;
          this.previewStopButton.disabled = true;
          this.previewName.textContent = 'Prévia concluída';
        }
      }
    }

    async previewOne(name) {
      if (!this.agent()) return;
      await this.startPreview(`Prévia · ${name}`, (signal, player) => player.play(name, signal));
    }

    async previewSequence() {
      if (!this.agent()) return;
      const choose = options => options[Math.floor(Math.random() * options.length)];
      const entrance = choose(this.choices.entry);
      const exit = choose(this.choices.exit);
      const messageOptions = this.choices.message.slice();
      const mode = this.messageMode;
      await this.startPreview(`Prévia completa · ${entrance} → Mensagem → ${exit}`, async (signal, player) => {
        await player.play(entrance, signal);
        let elapsed = false;
        const duration = app.wait(5000).then(() => { elapsed = true; });
        let index = Math.floor(Math.random() * messageOptions.length);
        if (mode === 'loop') {
          const chosen = messageOptions[index];
          while (!elapsed) await player.play(chosen, signal);
        } else {
          while (!elapsed) {
            await player.play(messageOptions[index], signal);
            index = (index + 1) % messageOptions.length;
          }
        }
        await duration;
        await player.play(exit, signal);
      });
    }

    save() {
      try {
        this.stopPreview();
        app.saveAgentAnimationChoices(this.agentId, this.choices);
        this.render();
      } catch (error) { this.status.textContent = error.message; }
    }
  };
})();
