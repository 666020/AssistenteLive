(() => {
  'use strict';
  const app = window.AssistenteLive;
  const SELECTION_KEY = 'AssistenteLive.selectedEventMessages.v1';
  const DEFAULT_SELECTION_KEY = 'AssistenteLive.newEventMessagesSelected.v1';
  const IMAGE_POSITION_KEY = 'AssistenteLive.eventImagePosition.v1';
  const LOCAL_ANNOUNCEMENTS_KEY = 'AssistenteLive.localAnnouncements.v1';
  const eventKey = event => JSON.stringify([event.source || 'created', String(event.id || event.title || '').trim()]);

  app.EventsPanel = class {
    constructor(selector, present) {
      this.selector = selector; this.present = present; this.event = null;
      this.activeEvents = []; this.remoteEvents = []; this.localEvents = this.loadLocalAnnouncements(); this.selectedKeys = new Set(); this.knownKeys = new Set();
      this.loading = false; this.syncing = false; this.syncTimer = null;
      this.running = false; this.stopRequested = false; this.operation = 0;
      this.status = document.getElementById('events-status');
      this.loadButton = document.getElementById('load-events');
      this.allButton = document.getElementById('announce-all-events');
      this.selectAllButton = document.getElementById('select-all-events');
      this.selectNoneButton = document.getElementById('select-no-events');
      this.stopButton = document.getElementById('stop-events');
      this.list = document.getElementById('event-announcements');
      this.localList = document.getElementById('local-announcement-list');
      this.localMessageInput = document.getElementById('local-announcement-message');
      this.localImageInput = document.getElementById('local-announcement-image');
      this.localSaveButton = document.getElementById('local-announcement-save');
      this.localCancelButton = document.getElementById('local-announcement-cancel');
      this.localEditorTitle = document.getElementById('local-announcement-editor-title');
      this.localStatus = document.getElementById('local-announcement-status');
      this.localCount = document.getElementById('local-announcement-count');
      this.localSelectAllButton = document.getElementById('local-announcement-select-all');
      this.localSelectNoneButton = document.getElementById('local-announcement-select-none');
      this.localAnnounceButton = document.getElementById('local-announcement-announce');
      this.localStopButton = document.getElementById('local-announcement-stop');
      this.editingLocalId = '';
      this.readingTimeInput = document.getElementById('event-reading-seconds');
      this.localReadingTimeInput = document.getElementById('local-reading-seconds');
      this.localIntervalInput = document.getElementById('local-auto-interval');
      this.localAutoStatus = document.getElementById('local-auto-status');
      this.readingSeconds = 20;
      try {
        const saved = Number(localStorage.getItem('AssistenteLive.eventReadingSeconds.v1'));
        if (Number.isInteger(saved) && saved >= 3 && saved <= 120) this.readingSeconds = saved;
      } catch {}
      this.readingTimeInput.value = String(this.readingSeconds);
      this.localReadingSeconds = this.loadBoundedSetting('AssistenteLive.localEventReadingSeconds.v1', 20, 3, 120);
      this.localReadingTimeInput.value = String(this.localReadingSeconds);
      this.localReadingTimeInput.addEventListener('change', () => {
        const value = Number(this.localReadingTimeInput.value);
        if (!Number.isInteger(value) || value < 3 || value > 120) { this.localReadingTimeInput.value = String(this.localReadingSeconds); return; }
        this.localReadingSeconds = value;
        try { localStorage.setItem('AssistenteLive.localEventReadingSeconds.v1', String(value)); }
        catch { document.getElementById('storage-note').textContent = 'Não foi possível salvar o tempo dos anúncios locais neste OBS.'; }
      });
      this.localIntervalInput.value = String(this.loadBoundedSetting('AssistenteLive.localIntervalMinutes', 60, 0, 10080));
      this.localIntervalInput.addEventListener('change', () => this.auto?.changeLocal());
      this.readingTimeInput.addEventListener('change', () => {
        const value = Number(this.readingTimeInput.value);
        if (!Number.isInteger(value) || value < 3 || value > 120) {
          this.readingTimeInput.value = String(this.readingSeconds);
          return;
        }
        this.readingSeconds = value;
        try { localStorage.setItem('AssistenteLive.eventReadingSeconds.v1', String(value)); }
        catch { document.getElementById('storage-note').textContent = 'Não foi possível salvar o tempo dos anúncios neste OBS.'; }
      });
      this.imagePositionInputs = [...document.querySelectorAll('input[name="event-image-position"]')];
      this.localImagePositionInputs = [...document.querySelectorAll('input[name="local-image-position"]')];
      this.newEventDefaultInputs = [...document.querySelectorAll('input[name="new-event-default-selected"]')];
      this.newEventDefaultSelected = true;
      this.imagePosition = 'left';
      this.localImagePosition = this.loadLocalImagePosition();
      this.loadSelection();
      this.loadImagePosition();
      this.loadNewEventDefault();
      this.loadButton.addEventListener('click', () => { void this.load(false); });
      this.allButton.addEventListener('click', () => { void this.load(true); });
      this.selectAllButton.addEventListener('click', () => this.setSelection(this.activeEvents.map(eventKey)));
      this.selectNoneButton.addEventListener('click', () => this.setSelection([]));
      for (const input of this.imagePositionInputs) {
        input.checked = input.value === this.imagePosition;
        input.addEventListener('change', () => {
          if (!input.checked) return;
          this.imagePosition = input.value;
          try { localStorage.setItem(IMAGE_POSITION_KEY, this.imagePosition); }
          catch { document.getElementById('storage-note').textContent = 'Não foi possível salvar a posição da imagem neste OBS.'; }
          this.renderEvents();
        });
      }
      for (const input of this.localImagePositionInputs) {
        input.checked = input.value === this.localImagePosition;
        input.addEventListener('change', () => {
          if (!input.checked) return;
          this.localImagePosition = input.value;
          try { localStorage.setItem('AssistenteLive.localEventImagePosition.v1', this.localImagePosition); }
          catch { document.getElementById('storage-note').textContent = 'Não foi possível salvar a posição da imagem dos anúncios locais neste OBS.'; }
          this.renderLocalAnnouncements();
        });
      }
      for (const input of this.newEventDefaultInputs) {
        input.checked = input.value === String(this.newEventDefaultSelected);
        input.addEventListener('change', () => {
          if (!input.checked) return;
          this.newEventDefaultSelected = input.value === 'true';
          try { localStorage.setItem(DEFAULT_SELECTION_KEY, String(this.newEventDefaultSelected)); }
          catch { document.getElementById('storage-note').textContent = 'Não foi possível salvar o padrão dos novos anúncios neste OBS.'; }
        });
      }
      this.stopButton.addEventListener('click', () => {
        this.stopRequested = true;
        this.status.textContent = 'Parando após a apresentação atual, sem cortar a saída.';
        this.update();
      });
      this.localSaveButton.addEventListener('click', () => this.saveLocalAnnouncement());
      this.localCancelButton.addEventListener('click', () => this.resetLocalEditor());
      this.localSelectAllButton.addEventListener('click', () => this.setSelection([...this.selectedKeys, ...this.localEvents.map(eventKey)]));
      this.localSelectNoneButton.addEventListener('click', () => this.setSelection([...this.selectedKeys].filter(key => !this.localEvents.some(event => eventKey(event) === key))));
      this.localAnnounceButton.addEventListener('click', () => {
        const selected = this.selectedEvents().filter(event => event.source === 'local');
        if (!this.selector.busy && selected.length && this.selector.presenterIds.length) void this.runQueue(this.selector.selected, selected);
      });
      this.localStopButton.addEventListener('click', () => {
        this.stopRequested = true;
        this.localStatus.textContent = 'Parando após a mensagem atual, sem cortar a saída.';
        this.update();
      });
      selector.events = this;
      this.setActiveEvents([]);
      this.update(); this.startBackgroundSync();
    }

    loadLocalAnnouncements() {
      try {
        const saved = JSON.parse(localStorage.getItem(LOCAL_ANNOUNCEMENTS_KEY) || '[]');
        if (!Array.isArray(saved)) return [];
        return saved.slice(0, 50).flatMap(item => {
          if (!item || typeof item !== 'object') return [];
          const id = String(item.id || '').slice(0, 100);
          const title = String(item.title || '').trim().slice(0, 100);
          const message = String(item.message || item.title || '').trim().slice(0, 350);
          const imageUrl = this.localImageUrl(item.imageUrl);
          return id && message ? [{ id, title: '', message, imageUrl, source: 'local' }] : [];
        });
      } catch { return []; }
    }

    loadBoundedSetting(key, fallback, min, max) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return fallback;
        const value = Number(raw);
        if (Number.isInteger(value) && value >= min && value <= max) return value;
      } catch {}
      return fallback;
    }

    loadLocalImagePosition() {
      try { return localStorage.getItem('AssistenteLive.localEventImagePosition.v1') === 'right' ? 'right' : 'left'; }
      catch { return 'left'; }
    }

    localImageUrl(value) {
      const raw = String(value || '').trim();
      if (!raw) return '';
      try {
        const url = new URL(raw);
        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
      } catch { return ''; }
    }

    saveLocalAnnouncement() {
      const message = this.localMessageInput.value.trim();
      const rawImage = this.localImageInput.value.trim();
      const imageUrl = this.localImageUrl(rawImage);
      if (!message) { this.localStatus.textContent = 'Escreva a mensagem.'; return; }
      if (message.length > 350 || rawImage && !imageUrl) {
        this.localStatus.textContent = 'Confira os limites: mensagem até 350 caracteres e imagem por URL HTTP ou HTTPS.'; return;
      }
      const id = this.editingLocalId || `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
      const updated = { id, title: '', message, imageUrl, source: 'local' };
      const index = this.localEvents.findIndex(event => event.id === id);
      if (index >= 0) this.localEvents[index] = updated;
      else this.localEvents.push(updated);
      this.persistLocalAnnouncements();
      this.resetLocalEditor();
      this.setActiveEvents(this.remoteEvents);
      this.localStatus.textContent = index >= 0 ? 'Anúncio local atualizado.' : 'Anúncio local adicionado.';
    }

    persistLocalAnnouncements() {
      try {
        localStorage.setItem(LOCAL_ANNOUNCEMENTS_KEY, JSON.stringify(this.localEvents.map(({ id, message, imageUrl }) => ({ id, message, imageUrl }))));
      } catch { this.localStatus.textContent = 'Não foi possível salvar os anúncios locais neste OBS.'; }
    }

    editLocalAnnouncement(id) {
      const event = this.localEvents.find(item => item.id === id);
      if (!event) return;
      this.editingLocalId = id;
      this.localMessageInput.value = event.message;
      this.localImageInput.value = event.imageUrl;
      this.localEditorTitle.textContent = 'Editar anúncio';
      this.localSaveButton.textContent = 'Salvar alterações';
      this.localCancelButton.hidden = false;
      this.localMessageInput.focus();
    }

    resetLocalEditor() {
      this.editingLocalId = '';
      this.localMessageInput.value = '';
      this.localImageInput.value = '';
      this.localEditorTitle.textContent = 'Criar anúncio';
      this.localSaveButton.textContent = 'Adicionar anúncio';
      this.localCancelButton.hidden = true;
    }

    deleteLocalAnnouncement(id) {
      const event = this.localEvents.find(item => item.id === id);
      if (!event || !window.confirm(`Excluir a mensagem local “${event.message.slice(0, 80)}”?`)) return;
      const key = eventKey(event);
      this.localEvents = this.localEvents.filter(item => item.id !== id);
      this.selectedKeys.delete(key); this.knownKeys.delete(key);
      this.saveSelection(); this.persistLocalAnnouncements();
      if (this.editingLocalId === id) this.resetLocalEditor();
      this.setActiveEvents(this.remoteEvents);
      this.localStatus.textContent = 'Anúncio local excluído.';
    }

    loadSelection() {
      try {
        const saved = JSON.parse(localStorage.getItem(SELECTION_KEY) || 'null');
        if (saved && Array.isArray(saved.selected) && Array.isArray(saved.known)) {
          const migrate = value => {
            if (typeof value !== 'string') return '';
            try {
              const parts = JSON.parse(value);
              return Array.isArray(parts) && parts.length >= 2 ? JSON.stringify([parts[0] || 'created', String(parts[1] || '').trim()]) : value;
            } catch { return value; }
          };
          this.selectedKeys = new Set(saved.selected.map(migrate).filter(Boolean));
          this.knownKeys = new Set(saved.known.map(migrate).filter(Boolean));
        }
      } catch {}
    }

    loadNewEventDefault() {
      try { this.newEventDefaultSelected = localStorage.getItem(DEFAULT_SELECTION_KEY) !== 'false'; }
      catch { this.newEventDefaultSelected = true; }
    }

    loadImagePosition() {
      try {
        const saved = localStorage.getItem(IMAGE_POSITION_KEY);
        if (saved === 'left' || saved === 'right') this.imagePosition = saved;
      } catch {}
    }

    saveSelection() {
      try { localStorage.setItem(SELECTION_KEY, JSON.stringify({ selected: [...this.selectedKeys], known: [...this.knownKeys] })); }
      catch { document.getElementById('storage-note').textContent = 'Não foi possível salvar os anúncios escolhidos neste OBS.'; }
    }

    setActiveEvents(events) {
      this.remoteEvents = events.filter(event => event.source !== 'local');
      this.activeEvents = [...this.remoteEvents, ...this.localEvents];
      for (const event of this.activeEvents) {
        const key = eventKey(event);
        if (!this.knownKeys.has(key)) {
          if (this.newEventDefaultSelected) this.selectedKeys.add(key);
          else this.selectedKeys.delete(key);
        }
        this.knownKeys.add(key);
      }
      this.saveSelection();
      app.merlinSettings?.setAnnouncementPreviewRecords(this.activeEvents);
      this.renderEvents();
      this.update();
    }

    setSelection(keys) {
      this.selectedKeys = new Set(keys);
      this.saveSelection();
      this.renderEvents();
      this.renderLocalAnnouncements();
      this.update();
      this.updateStatusCount();
    }

    selectedEvents() {
      return this.activeEvents.filter(event => this.selectedKeys.has(eventKey(event)));
    }

    updateStatusCount() {
      if (!this.loading && !this.running && this.activeEvents.length) {
        this.status.textContent = `${this.activeEvents.length} mensagem(ns) ativa(s) · ${this.selectedEvents().length} selecionada(s).`;
      }
    }

    renderEvents() {
      const fragment = document.createDocumentFragment();
      const groups = [
        { key: 'created', title: 'Anúncios criados', empty: 'Nenhum anúncio criado está ativo.' },
        { key: 'hall-general', title: 'Geral eventos do Hall', empty: 'Nenhum evento do Hall está com status ativo.' },
        { key: 'local', title: 'Anúncios locais', empty: 'Nenhum anúncio local cadastrado. Crie lembretes na aba Anúncios locais.' }
      ];
      for (const group of groups) {
        const events = this.activeEvents.filter(event => (event.source || 'created') === group.key);
        const heading = document.createElement('h3'); heading.className = 'event-announcement-group-title'; heading.textContent = group.title; fragment.append(heading);
        if (!events.length) {
          const empty = document.createElement('p'); empty.className = 'event-announcements-empty'; empty.textContent = group.empty; fragment.append(empty);
          continue;
        }
        for (const [index, event] of events.entries()) {
        const key = eventKey(event);
        const card = document.createElement('article'); card.className = 'event-announcement-card';
        const label = document.createElement('label'); label.className = 'event-announcement-choice';
        const input = document.createElement('input'); input.type = 'checkbox'; input.checked = this.selectedKeys.has(key);
        input.setAttribute('aria-label', `Incluir mensagem: ${event.message.slice(0, 80)}`);
        input.setAttribute('aria-label', `Incluir mensagem: ${event.message.slice(0, 80)}`);
        input.addEventListener('change', () => {
          if (input.checked) this.selectedKeys.add(key); else this.selectedKeys.delete(key);
          this.saveSelection(); this.renderLocalAnnouncements(); this.update(); this.updateStatusCount();
        });
        label.append(input); card.append(label);
        const layout = app.merlinSettings?.imageLayout?.() || {};
        const preview = document.createElement('div');
        app.merlinSettings?.applyBubbleColor?.(preview, layout.bubbleColor);
        const bubbleWidth = layout.bubbleWidth === 'auto' ? 'max' : layout.bubbleWidth || 'max';
        preview.className = `event-announcement-preview image-${this.imagePosition} image-size-${layout.size || 'medium'} message-width-${bubbleWidth} mastery-text-${layout.fontSize || 'medium'} message-font-${layout.fontFamily || 'arial'}`;
        preview.style.setProperty('--message-width', `${bubbleWidth === 'max' ? 0 : bubbleWidth}px`);
        if (event.imageUrl || event.imageUrls?.length) {
          const image = document.createElement('img'); image.className = 'event-announcement-image';
          const sources = event.imageUrls?.length ? event.imageUrls : [event.imageUrl];
          let sourceIndex = 0;
          image.src = sources[sourceIndex]; image.alt = ''; image.referrerPolicy = 'no-referrer';
          image.dataset.imageSources = JSON.stringify(sources);
          image.addEventListener('error', () => { if (++sourceIndex < sources.length) image.src = sources[sourceIndex]; else image.remove(); });
          preview.append(image);
        }
        const text = document.createElement('div'); text.className = 'event-announcement-text';
        const message = document.createElement('p'); app.appendFormattedText(message, event.message);
        text.append(message); preview.append(text); card.append(preview);
        card.dataset.position = String(index); fragment.append(card);
        }
      }
      this.list.replaceChildren(fragment);
      this.renderLocalAnnouncements();
      this.fitAutoImages();
    }

    renderLocalAnnouncements() {
      if (!this.localList) return;
      const fragment = document.createDocumentFragment();
      const selected = this.localEvents.filter(event => this.selectedKeys.has(eventKey(event))).length;
      this.localCount.textContent = `${this.localEvents.length} anúncio(s) local(is) · ${selected} selecionado(s).`;
      if (!this.localEvents.length) {
        const empty = document.createElement('p'); empty.className = 'event-announcements-empty';
        empty.textContent = 'Crie mensagens como “Bebam água” ou “Deixem o like”. Elas aparecerão aqui.';
        fragment.append(empty);
      }
      const layout = app.merlinSettings?.imageLayout?.() || {};
      for (const event of this.localEvents) {
        const key = eventKey(event);
        const card = document.createElement('article'); card.className = 'event-announcement-card local-announcement-card';
        const label = document.createElement('label'); label.className = 'event-announcement-choice';
        const input = document.createElement('input'); input.type = 'checkbox'; input.checked = this.selectedKeys.has(key);
        input.setAttribute('aria-label', `Incluir mensagem: ${event.message.slice(0, 80)}`);
        input.addEventListener('change', () => {
          if (input.checked) this.selectedKeys.add(key); else this.selectedKeys.delete(key);
          this.saveSelection(); this.renderEvents(); this.update(); this.updateStatusCount();
        });
        label.append(input); card.append(label);
        const preview = document.createElement('div');
        app.merlinSettings?.applyBubbleColor?.(preview, layout.bubbleColor);
        const bubbleWidth = layout.bubbleWidth === 'auto' ? 'max' : layout.bubbleWidth || 'max';
        preview.className = `event-announcement-preview image-${this.localImagePosition} image-size-${layout.size || 'medium'} message-width-${bubbleWidth} mastery-text-${layout.fontSize || 'medium'} message-font-${layout.fontFamily || 'arial'}`;
        preview.style.setProperty('--message-width', `${bubbleWidth === 'max' ? 0 : bubbleWidth}px`);
        if (event.imageUrl) {
          const image = document.createElement('img'); image.className = 'event-announcement-image';
          image.src = event.imageUrl; image.alt = ''; image.referrerPolicy = 'no-referrer';
          image.addEventListener('error', () => image.remove(), { once: true }); preview.append(image);
        }
        const text = document.createElement('div'); text.className = 'event-announcement-text';
        const message = document.createElement('p'); app.appendFormattedText(message, event.message);
        text.append(message); preview.append(text); card.append(preview);
        const actions = document.createElement('div'); actions.className = 'local-announcement-card-actions';
        const edit = document.createElement('button'); edit.type = 'button'; edit.textContent = 'Editar'; edit.addEventListener('click', () => this.editLocalAnnouncement(event.id));
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = 'Excluir'; remove.addEventListener('click', () => this.deleteLocalAnnouncement(event.id));
        actions.append(edit, remove); card.append(actions); fragment.append(card);
      }
      this.localList.replaceChildren(fragment);
      this.fitAutoImages();
    }

    onOpen() { this.fitAutoImages(); }

    fitAutoImages() {
      if (app.merlinSettings?.imageLayout?.().size !== 'auto') return;
      for (const list of [this.list, this.localList]) {
        for (const preview of list.querySelectorAll('.event-announcement-preview.image-size-auto')) {
          app.fitImagesToText(preview, preview.querySelector('.event-announcement-text'), '.event-announcement-image');
        }
      }
    }

    startBackgroundSync() {
      const refresh = async () => {
        if (this.selector.busy || this.loading || this.running || this.syncing) return;
        this.syncing = true;
        this.update();
        const controller = new AbortController();
        const signal = controller.signal;
        try {
          const events = await app.loadAnnouncements(signal);
          this.setActiveEvents(events);
          this.status.textContent = events.length
            ? `Lista atualizada em segundo plano: ${events.length} mensagem(ns) ativa(s) · ${this.selectedEvents().length} selecionada(s).`
            : 'Lista atualizada em segundo plano: nenhum anúncio ativo.';
        } catch (error) {
          if (error.name !== 'AbortError') this.status.textContent = `Atualização dos anúncios falhou: ${error.message}`;
        } finally { this.syncing = false; this.update(); }
      };
      void refresh();
      this.syncTimer = setInterval(() => { void refresh(); }, 60000);
    }

    update() {
      const busy = this.selector.busy || this.loading || this.running || this.syncing;
      const hasEvents = this.activeEvents.length > 0;
      this.loadButton.disabled = busy;
      this.allButton.disabled = busy || !this.selectedEvents().length || !this.selector.presenterIds.length;
      this.selectAllButton.disabled = busy || !hasEvents;
      this.selectNoneButton.disabled = busy || !this.selectedEvents().length;
      this.stopButton.disabled = !this.running || this.stopRequested;
      const localSelected = this.selectedEvents().some(event => event.source === 'local');
      this.localSelectAllButton.disabled = busy || !this.localEvents.length;
      this.localSelectNoneButton.disabled = busy || !localSelected;
      this.localAnnounceButton.disabled = busy || !localSelected || !this.selector.presenterIds.length;
      this.localStopButton.disabled = !this.running || this.stopRequested;
      if (this.auto) this.auto.update();
    }

    cancel() {
      this.operation++; this.loading = false; this.running = false; this.stopRequested = true;
      this.selector.setBusy(false);
      this.status.textContent = 'Painel aberto: apresentação e sequência canceladas. Pronto para editar.';
    }

    async load(announce) {
      if (this.selector.busy || this.running || this.loading || this.syncing) return;
      const agentId = this.selector.selected;
      const operation = ++this.operation;
      const signal = app.workController.signal;
      let loaded = false;
      this.loading = true; this.selector.setBusy(true);
      this.status.textContent = 'Lendo anúncios criados e eventos ativos do Hall…'; this.update();
      try {
        const events = await app.loadAnnouncements(signal);
        app.checkSignal(signal);
        if (operation !== this.operation) return;
        this.setActiveEvents(events);
        loaded = true;
        this.status.textContent = events.length
          ? `${events.length} mensagem(ns) ativa(s) · ${this.selectedEvents().length} selecionada(s).`
          : 'Nenhum anúncio criado ou evento ativo do Hall no momento.';
      } catch (error) {
        if (operation === this.operation && error.name !== 'AbortError') this.status.textContent = error.message;
      } finally {
        if (operation === this.operation) { this.loading = false; this.selector.setBusy(false); this.update(); }
      }
      if (signal.aborted || operation !== this.operation || !announce || !loaded) return;
      const selected = this.selectedEvents();
      if (!selected.length) { this.status.textContent = 'Marque pelo menos uma mensagem ativa para anunciar.'; return; }
      if (this.selector.presenterIds.length) await this.runQueue(agentId, selected, signal);
    }

    async runQueue(agentId, events, signal = app.workController.signal) {
      const operation = ++this.operation;
      this.running = true; this.stopRequested = false;
      this.selector.setBusy(true); this.selector.close(); this.update();
      let completed = 0;
      try {
        for (const event of events) {
          app.checkSignal(signal);
          if (this.stopRequested) break;
          if (completed) {
            await app.wait(1200, signal);
            if (this.stopRequested) break;
          }
          this.status.textContent = `Anúncio ${completed + 1} de ${events.length}: ${event.title}`;
          if (app.eventInWindow && !app.eventInWindow(event)) continue;
          const local = event.source === 'local';
          const presenterId = this.selector.nextPresenter();
          if (!presenterId) throw new Error('Selecione pelo menos um Agent para apresentar os anúncios.');
          this.status.textContent = `Anúncio ${completed + 1} de ${events.length}: ${event.title} · ${this.selector.agentName(presenterId)}`;
          const success = await this.present(presenterId, 'evento', {
            ...event,
            readingMs: (local ? this.localReadingSeconds : this.readingSeconds) * 1000,
            ...(local ? { imagePosition: this.localImagePosition } : {})
          }, signal);
          app.checkSignal(signal);
          if (success === false) throw new Error('A sequência foi interrompida por uma falha na apresentação.');
          completed++;
        }
        this.status.textContent = this.stopRequested
          ? `Sequência parada. ${completed} de ${events.length} anúncio(s) concluído(s).`
          : `Sequência concluída: ${completed} anúncio(s).`;
      } catch (error) {
        if (error.name !== 'AbortError' && operation === this.operation) { this.status.textContent = error.message; this.selector.open(); }
      } finally {
        if (operation === this.operation) { this.running = false; this.selector.setBusy(false); this.auto?.schedule(); this.update(); }
      }
    }
  };
})();
