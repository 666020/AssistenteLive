(() => {
  'use strict';
  const app = window.AssistenteLive;
  app.AutomaticEvents = class {
    constructor(panel) {
      this.panel = panel; this.minutes = 60; this.timer = null; this.epoch = 0;
      this.localMinutes = Number(panel.localIntervalInput.value) || 0; this.localTimer = null; this.localEpoch = 0; this.localNextPosition = 0;
      this.paused = !panel.selector.panel.hidden;
      this.input = document.getElementById('auto-interval');
      this.status = document.getElementById('auto-status');
      this.localAutoStatus = document.getElementById('local-auto-status');
      this.nextPosition = 0;
      try {
        const saved = localStorage.getItem('AssistenteLive.intervalMinutes');
        const n = Number(saved);
        if (saved !== null && Number.isInteger(n) && n >= 0 && n <= 10080) this.minutes = n;
        const position = Number(localStorage.getItem('AssistenteLive.nextEventPosition'));
        if (Number.isInteger(position) && position >= 0 && position <= 1000) this.nextPosition = position;
        const localPosition = Number(localStorage.getItem('AssistenteLive.localNextEventPosition'));
        if (Number.isInteger(localPosition) && localPosition >= 0 && localPosition <= 1000) this.localNextPosition = localPosition;
      } catch { this.storageWarning(); }
      this.input.value = String(this.minutes);
      this.input.addEventListener('change', () => this.change());
      panel.auto = this;
      this.schedule();
      this.scheduleLocal();
    }
    storageWarning() { document.getElementById('storage-note').textContent = 'Não foi possível salvar/restaurar as opções neste navegador. Verifique o armazenamento do OBS.'; }
    change() {
      const value = this.input.value.trim(); const n = Number(value);
      if (!value || !Number.isInteger(n) || n < 0 || n > 10080) {
        this.status.textContent = 'Informe minutos inteiros de 0 a 10080. 0 desativa as consultas automáticas.';
        this.input.value = String(this.minutes); return;
      }
      this.minutes = n;
      try { localStorage.setItem('AssistenteLive.intervalMinutes', String(n)); } catch { this.storageWarning(); }
      this.schedule();
    }
    changeLocal() {
      const value = this.panel.localIntervalInput.value.trim(); const n = Number(value);
      if (!value || !Number.isInteger(n) || n < 0 || n > 10080) {
        this.localAutoStatus.textContent = 'Informe minutos inteiros de 0 a 10080. 0 desativa os anúncios locais automáticos.';
        this.panel.localIntervalInput.value = String(this.localMinutes); return;
      }
      this.localMinutes = n;
      try { localStorage.setItem('AssistenteLive.localIntervalMinutes', String(n)); } catch { this.storageWarning(); }
      this.scheduleLocal();
    }
    update() { this.input.disabled = false; }
    pause() {
      this.paused = true; this.epoch++;
      clearTimeout(this.timer); this.timer = null;
      this.localEpoch++; clearTimeout(this.localTimer); this.localTimer = null;
      this.status.textContent = 'Pausado enquanto o painel está aberto. Alterações são salvas automaticamente.';
      this.localAutoStatus.textContent = 'Pausado enquanto o painel está aberto.';
    }
    resume() {
      if (!this.panel.selector.panel.hidden) { this.pause(); return; }
      this.paused = false; this.schedule(); this.scheduleLocal();
    }
    schedule(retryInMs = null) {
      clearTimeout(this.timer); this.timer = null; const epoch = ++this.epoch;
      if (!this.minutes) { this.status.textContent = 'Intervalo 0: nenhuma consulta automática. Os botões manuais continuam disponíveis.'; return; }
      if (this.paused) { this.status.textContent = `Salvo: ${this.minutes} minuto(s) entre mensagens. O intervalo começa ao fechar C.`; return; }
      this.status.textContent = retryInMs === null
        ? `Automático: uma mensagem a cada ${this.minutes} minuto(s), contados após a apresentação. Abrir o painel com F1 pausa e cancela.`
        : 'Aguardando outra atualização ou apresentação terminar para enviar o próximo anúncio.';
      this.timer = setTimeout(() => { void this.tick(epoch); }, retryInMs ?? this.minutes * 60000);
    }
    async tick(epoch) {
      if (epoch !== this.epoch || this.paused || !this.minutes) return;
      this.timer = null;
      if (this.panel.selector.busy || this.panel.syncing || this.panel.loading || this.panel.running) { this.schedule(3000); return; }
      const signal = app.workController.signal;
      this.panel.selector.setBusy(true);
      this.panel.event = null;
      try {
        this.status.textContent = 'Consultando as mensagens ativas…';
        const events = await app.loadAnnouncements(signal);
        app.checkSignal(signal);
        if (epoch !== this.epoch) return;
        this.panel.setActiveEvents(events);
        const selected = this.panel.selectedEvents().filter(event => event.source !== 'local');
        if (selected.length) {
          const position = this.nextPosition % selected.length;
          const event = selected[position];
          this.panel.event = event;
          this.panel.status.textContent = `Anunciando: ${event.title}`;
          const presenterId = this.panel.selector.nextPresenter();
          if (!presenterId) throw new Error('Selecione pelo menos um Agent para apresentar os anúncios.');
          const ok = await this.panel.present(presenterId, 'evento', { ...event, readingMs: this.panel.readingSeconds * 1000 }, signal);
          app.checkSignal(signal);
          if (epoch !== this.epoch) return;
          if (!ok) throw new Error('Falha ao apresentar o evento.');
          this.nextPosition = position + 1;
          try { localStorage.setItem('AssistenteLive.nextEventPosition', String(this.nextPosition)); } catch { this.storageWarning(); }
          this.panel.status.textContent = `Concluído: ${event.title}`;
        } else this.panel.status.textContent = events.length
          ? 'Há mensagens ativas, mas nenhuma está selecionada para anúncio.'
          : 'Nenhuma mensagem ativa dentro do período atual.';
      } catch (error) {
        if (error.name !== 'AbortError' && epoch === this.epoch) {
          this.panel.event = null;
          this.panel.status.textContent = error.message + ' Nova tentativa após o intervalo salvo.';
        }
      } finally {
        if (epoch === this.epoch) { this.panel.selector.setBusy(false); this.schedule(); }
      }
    }
    scheduleLocal(retryInMs = null) {
      clearTimeout(this.localTimer); this.localTimer = null;
      const epoch = ++this.localEpoch;
      if (!this.localMinutes) { this.localAutoStatus.textContent = 'Intervalo 0: anúncios locais automáticos desativados.'; return; }
      if (this.paused) { this.localAutoStatus.textContent = `Salvo: ${this.localMinutes} minuto(s) entre anúncios locais. O intervalo começa ao fechar F1.`; return; }
      this.localAutoStatus.textContent = retryInMs === null
        ? `Automático: um anúncio local a cada ${this.localMinutes} minuto(s), após a apresentação.`
        : 'Aguardando outra atualização ou apresentação terminar para enviar o próximo anúncio local.';
      this.localTimer = setTimeout(() => { void this.tickLocal(epoch); }, retryInMs ?? this.localMinutes * 60000);
    }
    async tickLocal(epoch) {
      if (epoch !== this.localEpoch || this.paused || !this.localMinutes) return;
      this.localTimer = null;
      if (this.panel.selector.busy || this.panel.syncing || this.panel.loading || this.panel.running) { this.scheduleLocal(3000); return; }
      const selected = this.panel.selectedEvents().filter(event => event.source === 'local');
      if (!selected.length || !this.panel.selector.presenterIds.length) {
        this.localAutoStatus.textContent = selected.length ? 'Selecione pelo menos um Agent para apresentar os anúncios locais.' : 'Nenhum anúncio local está selecionado para a sequência automática.';
        this.scheduleLocal(); return;
      }
      const position = this.localNextPosition % selected.length;
      const event = selected[position];
      const signal = app.workController.signal;
      this.panel.selector.setBusy(true);
      this.panel.running = true; this.panel.stopRequested = false;
      this.panel.event = event; this.panel.update();
      try {
        this.localAutoStatus.textContent = `Anunciando: ${event.title}`;
        this.panel.status.textContent = `Anúncio local: ${event.title}`;
        const presenterId = this.panel.selector.nextPresenter();
        if (!presenterId) throw new Error('Selecione pelo menos um Agent para apresentar os anúncios locais.');
        const ok = await this.panel.present(presenterId, 'evento', {
          ...event, readingMs: this.panel.localReadingSeconds * 1000, imagePosition: this.panel.localImagePosition
        }, signal);
        app.checkSignal(signal);
        if (epoch !== this.localEpoch) return;
        if (!ok) throw new Error('Falha ao apresentar o anúncio local.');
        if (this.panel.stopRequested) { this.localAutoStatus.textContent = 'Sequência local parada.'; return; }
        this.localNextPosition = position + 1;
        try { localStorage.setItem('AssistenteLive.localNextEventPosition', String(this.localNextPosition)); } catch { this.storageWarning(); }
        this.localAutoStatus.textContent = `Concluído: ${event.title}`;
      } catch (error) {
        if (error.name !== 'AbortError' && epoch === this.localEpoch) this.localAutoStatus.textContent = error.message;
      } finally {
        if (epoch === this.localEpoch) {
          this.panel.event = null; this.panel.running = false; this.panel.selector.setBusy(false);
          this.panel.auto?.scheduleLocal(); this.panel.update();
        }
      }
    }
  };
})();
