(() => {
  'use strict';
  const app = window.AssistenteLive;
  const STORAGE_KEY = 'AssistenteLive.merlinQueue.v1';
  const COLLECTION_SETTINGS_KEY = 'AssistenteLive.merlinCollection.v1';
  const DEFAULT_POLL_INTERVAL_MS = 30 * 1000;
  const MAX_ROWS = 5000;
  const MAX_COLLECTION_PREVIEW_ROWS = 200;

  app.MerlinPanel = class {
    constructor(selector, present) {
      this.selector = selector;
      this.present = present;
      this.running = false;
      this.stopRequested = false;
      this.loading = false;
      this.deferAuto = false;
      this.pollTimer = null;
      this.status = document.getElementById('merlin-queue-status');
      this.collectStatus = document.getElementById('merlin-collect-status');
      this.list = document.getElementById('merlin-queue-list');
      this.collectedList = document.getElementById('merlin-collected-list');
      this.refreshButton = document.getElementById('merlin-sheet-refresh');
      this.autoCollectInput = document.getElementById('merlin-auto-collect');
      this.showCollectedInput = document.getElementById('merlin-show-collected');
      this.announceButton = document.getElementById('merlin-announce-pending');
      this.clearButton = document.getElementById('merlin-clear-history');
      this.collectionSettings = this.loadCollectionSettings();
      this.autoCollectInput.checked = this.collectionSettings.enabled;
      this.showCollectedInput.checked = this.collectionSettings.showList;
      this.collectedList.hidden = !this.collectionSettings.showList;
      this.cache = this.loadCache();
      this.applyHistoryPolicy(false, true);
      selector.merlinSettings.setPreviewRecords(this.cache.records);
      selector.merlinSettings.setAvailableMembers(this.cache.catalog?.members || this.activeMemberOptions(this.cache.records));
      selector.merlinSettings.setAvailableConsoles(this.cache.catalog?.consoles || this.cache.records.map(record => record.console));
      this.refreshButton.addEventListener('click', () => {
        this.applyHistoryPolicy(true, true);
        void this.sync(true);
      });
      this.autoCollectInput.addEventListener('change', () => {
        this.collectionSettings.enabled = this.autoCollectInput.checked;
        this.saveCollectionSettings();
        if (this.collectionSettings.enabled) {
          void this.sync(false);
          this.schedulePoll();
        } else {
          clearTimeout(this.pollTimer);
          this.pollTimer = null;
          this.collectStatus.textContent = 'Coleta automática desativada. Você ainda pode atualizar manualmente.';
        }
      });
      this.showCollectedInput.addEventListener('change', () => {
        this.collectionSettings.showList = this.showCollectedInput.checked;
        this.collectedList.hidden = !this.collectionSettings.showList;
        this.saveCollectionSettings();
      });
      this.announceButton.addEventListener('click', () => { void this.announcePending(); });
      this.clearButton.addEventListener('click', () => this.clearHistory());
      this.render();
      if (this.cache.records.length) {
        this.status.textContent = `Cache local: ${this.cache.records.length} masterização(ões). Última leitura: ${this.date(this.cache.syncedAt)}.`;
        this.collectStatus.textContent = `Cache disponível: ${this.cache.records.length} masterização(ões). Última leitura: ${this.date(this.cache.syncedAt)}.`;
      }
      selector.merlinPanel = this;
      this.updateControls();
      if (this.collectionSettings.enabled) void this.sync(false);
      this.schedulePoll();
    }

    loadCollectionSettings() {
      try {
        const saved = JSON.parse(localStorage.getItem(COLLECTION_SETTINGS_KEY) || 'null');
        return {
          enabled: saved?.enabled !== false,
          showList: saved?.showList === true
        };
      } catch { return { enabled: true, showList: false }; }
    }

    saveCollectionSettings() {
      try { localStorage.setItem(COLLECTION_SETTINGS_KEY, JSON.stringify(this.collectionSettings)); }
      catch { document.getElementById('storage-note').textContent = 'Não foi possível salvar as opções da coleta neste OBS.'; }
    }

    loadCache() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (saved?.version === 1 && Array.isArray(saved.records) && saved.records.length <= MAX_ROWS) {
          return {
            version: 1, initialized: Boolean(saved.initialized), syncedAt: Number(saved.syncedAt) || 0,
            policy: saved.policy === 'new-only' ? 'new-only' : 'unannounced',
            historyCutoffAt: Number.isFinite(Number(saved.historyCutoffAt)) ? Number(saved.historyCutoffAt) : 0,
            resetAllPending: Boolean(saved.resetAllPending),
            revision: String(saved.revision || ''),
            catalog: saved.catalog && typeof saved.catalog === 'object' && Array.isArray(saved.catalog.members) && Array.isArray(saved.catalog.consoles) ? saved.catalog : null,
            records: saved.records.filter(row => row && typeof row.key === 'string' && row.key),
            shown: saved.shown && typeof saved.shown === 'object' ? saved.shown : {},
            ignored: Array.isArray(saved.ignored) ? saved.ignored.filter(key => typeof key === 'string') : []
          };
        }
      } catch {}
      return { version: 1, initialized: false, syncedAt: 0, policy: '', historyCutoffAt: 0, resetAllPending: false, revision: '', catalog: null, records: [], shown: {}, ignored: [] };
    }

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cache));
        return true;
      } catch {
        this.status.textContent = 'Não consegui salvar o cache neste OBS. Libere espaço nos dados locais do navegador.';
        return false;
      }
    }

    date(value) {
      const date = new Date(value);
      return Number.isNaN(date.getTime()) ? String(value || 'data não informada') : date.toLocaleString('pt-BR');
    }

    onOpen() {
      this.fitAutoImages();
      if (this.collectionSettings.enabled && !this.cache.initialized) void this.sync(true);
    }

    fitAutoImages() {
      if (app.merlinSettings.imageLayout().size !== 'auto') return;
      for (const bubble of this.list.querySelectorAll('.merlin-queue-preview.image-size-auto')) {
        app.fitImagesToText(bubble, bubble.querySelector('.mastery-text'));
      }
    }

    refreshPreviewWidths() {
      const width = app.merlinSettings.imageLayout().bubbleWidth || 'max';
      for (const bubble of this.list.querySelectorAll('.merlin-queue-preview')) {
        bubble.classList.remove('message-width-auto', 'message-width-320', 'message-width-400', 'message-width-480', 'message-width-640', 'message-width-800', 'message-width-1000', 'message-width-1200', 'message-width-max');
        bubble.classList.add(`message-width-${width}`);
        bubble.style.setProperty('--message-width', `${width === 'max' ? 0 : width}px`);
      }
      this.fitAutoImages();
    }

    refreshNamePreviews({ memberId = null } = {}) {
      const settings = app.merlinSettings;
      for (const item of this.list.querySelectorAll('.merlin-queue-item')) {
        const record = item._merlinRecord;
        if (!record || (memberId && record.memberId !== memberId)) continue;
        item.querySelector(':scope > strong').textContent = `${settings.memberName(record.memberId, record.member)} — ${record.game}`;
        const text = item.querySelector('.mastery-text');
        if (text) {
          text.replaceChildren();
          app.appendFormattedText(text, app.merlinMessage.render(settings.templateFor(record), {
            Membro: settings.memberName(record.memberId, record.member), Jogo: record.game, Console: settings.consoleName(record.console),
            Tempo: record.time, Evento: record.activity
          }, settings.value.timeFormat));
        }
      }
      if (memberId && this.collectedList) {
        for (const row of this.collectedList.querySelectorAll('tr')) {
          const record = row._merlinRecord;
          if (record?.memberId === memberId) row.cells[1].textContent = settings.memberName(record.memberId, record.member);
        }
      }
    }

    schedulePoll() {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
      if (!this.collectionSettings.enabled) return;
      this.pollTimer = setTimeout(async () => {
        await this.sync(false);
        this.schedulePoll();
      }, DEFAULT_POLL_INTERVAL_MS);
    }

    processPending() {
      if (this.loading || this.running || this.deferAuto || this.selector.busy || this.selector.events?.running || this.selector.panel.hidden === false || this.counts().pending === 0) return;
      void this.announcePending();
    }

    async sync(force) {
      if (this.loading) return;
      if (!force && !this.collectionSettings.enabled) return;
      const signal = app.workController.signal;
      this.loading = true;
      this.updateControls();
      this.status.textContent = force || !this.cache.initialized ? 'Lendo as masterizações do Google Sheets…' : 'Verificando se há novas masterizações…';
      this.collectStatus.textContent = force || !this.cache.initialized ? 'Lendo a aba Masterizações do Google Sheets…' : 'Verificando a versão da aba Masterizações…';
      const controller = new AbortController();
      const cancel = () => controller.abort();
      signal.addEventListener('abort', cancel, { once: true });
      const timer = setTimeout(cancel, 20000);
      try {
        const config = app.eventsConfig;
        const marker = await this.readRevision(config, controller.signal);
        const revision = marker.revision;
        app.checkSignal(signal);
        if (controller.signal.aborted) throw app.abortError();
        if (!force && this.cache.initialized && revision && revision === this.cache.revision && this.cache.policy === this.policy()) {
          this.cache.syncedAt = Date.now();
          this.status.textContent = `Sem mudanças nas masterizações. Versão ${revision}; verificada às ${this.date(this.cache.syncedAt)}.`;
          this.collectStatus.textContent = `Sem novas masterizações. Versão ${revision}; próxima verificação em 30 s.`;
          return;
        }
        const url = new URL(`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq`);
        url.search = new URLSearchParams({
          tqx: 'out:csv', sheet: config.masteriesSheetName, range: 'A1:M5000', headers: '1', t: String(Date.now())
        }).toString();
        const response = await fetch(url.href, {
          method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store',
          referrerPolicy: 'no-referrer', signal: controller.signal
        });
        if (!response.ok) throw new Error(`Google Sheets respondeu HTTP ${response.status}. Confira se a planilha permite leitura neste OBS.`);
        const csv = await response.text();
        app.checkSignal(signal);
        if (controller.signal.aborted) throw app.abortError();
        const rows = this.parseSheet(csv);
        this.cache.catalog = marker.catalog;
        this.selector.merlinSettings.setAvailableMembers(marker.catalog?.members || this.activeMemberOptions(rows));
        this.selector.merlinSettings.setAvailableConsoles(marker.catalog?.consoles || rows.map(row => row.console));
        this.merge(rows);
        this.selector.merlinSettings.setPreviewRecords(this.cache.records);
        this.deferAuto = false;
        this.cache.syncedAt = Date.now();
        this.cache.revision = revision;
        this.cache.initialized = true;
        this.cache.resetAllPending = false;
        this.cache.policy = this.policy();
        this.save();
        this.status.textContent = `Coleta concluída: ${this.cache.records.length} masterização(ões) no cache local. ${this.counts().pending} pendente(s).`;
        this.collectStatus.textContent = `Coleta concluída: ${this.cache.records.length} masterização(ões), versão ${revision || 'não informada'}. Próxima verificação ${this.collectionSettings.enabled ? 'em 30 s' : 'manual'}.`;
        this.render();
      } catch (error) {
        this.status.textContent = signal.aborted ? 'Coleta cancelada.'
          : controller.signal.aborted ? 'A coleta passou de 20 segundos. Tente novamente.'
          : error instanceof TypeError ? 'Não consegui ler a planilha diretamente. Confira a internet, o acesso de leitura e se o Google Sheets permite a consulta.'
          : error.message;
        this.collectStatus.textContent = signal.aborted ? 'Coleta cancelada.' : this.status.textContent;
      } finally {
        clearTimeout(timer);
        signal.removeEventListener('abort', cancel);
        this.loading = false;
        this.updateControls();
        if (!signal.aborted) this.processPending();
      }
    }

    policy() { return app.merlinSettings?.value?.historyPolicy || 'new-only'; }

    applyHistoryPolicy(refresh = true, resetWindow = false) {
      const policy = this.policy();
      const changed = this.cache.policy !== policy;
      const hasCutoff = Number.isFinite(Number(this.cache.historyCutoffAt)) && Number(this.cache.historyCutoffAt) > 0;
      const needsUpdate = policy === 'new-only'
        ? resetWindow || !hasCutoff
        : hasCutoff || this.cache.ignored.length > 0;
      if (!changed && !needsUpdate) return false;
      this.cache.historyCutoffAt = policy === 'new-only' ? Math.floor(Date.now() / 1000) * 1000 - 999 : 0;
      this.cache.ignored = [];
      this.cache.resetAllPending = false;
      this.cache.policy = policy;
      this.save();
      if (refresh) {
        this.render();
        this.updateControls();
      }
      if (policy === 'unannounced') this.processPending();
      return true;
    }

    isAfterHistoryCutoff(record) {
      if (this.policy() !== 'new-only') return true;
      const detectedAt = Date.parse(record?.detectedAt || '');
      const cutoff = Number(this.cache.historyCutoffAt) || 0;
      return cutoff > 0 && Number.isFinite(detectedAt) && detectedAt > cutoff;
    }

    activeMemberOptions(records = []) {
      return [...new Map(records.map(record => [String(record.memberId || ''), { memberId: String(record.memberId || ''), member: String(record.member || '').trim() }]).filter(([id, item]) => id && item.member)).values()];
    }

    async readRevision(config, signal) {
      const url = new URL(`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq`);
      url.search = new URLSearchParams({ tqx: 'out:csv', sheet: config.masteriesSheetName, range: 'N2:O2', headers: '0', t: String(Date.now()) }).toString();
      const response = await fetch(url.href, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal });
      if (!response.ok) throw new Error(`Google Sheets respondeu HTTP ${response.status} ao verificar a versão.`);
      const rows = app.parseCSV(await response.text());
      let catalog = null;
      try {
        const parsed = JSON.parse(String(rows[0]?.[1] || ''));
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.members) && Array.isArray(parsed.consoles)) catalog = parsed;
      } catch {}
      return { revision: String(rows[0]?.[0] || '').trim(), catalog };
    }
    parseSheet(csv) {
      if (/^\s*</.test(csv)) throw new Error('O Google não liberou a planilha para leitura direta. Confira o compartilhamento de leitor.');
      const rows = app.parseCSV(csv);
      const normalize = value => String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const headers = (rows.shift() || []).map(normalize);
      const expected = ['chave', 'detectado em', 'membro id', 'membro', 'usuario ra', 'jogo ra id', 'jogo', 'imagem', 'origem', 'evento/sorteio'];
      if (expected.some((header, index) => headers[index] !== header) || headers.length > 13 || (headers.length >= 11 && headers[10] !== 'tempo') || (headers.length >= 12 && headers[11] !== 'console') || (headers.length >= 13 && headers[12] !== 'imagem membro')) {
        throw new Error('Cabeçalhos da aba Masterizações diferentes do esperado. Confira as colunas Chave até Imagem membro.');
      }
      if (headers.length < 10) throw new Error('A aba Masterizações está sem todas as colunas necessárias.');
      const records = rows.map(row => ({
        key: String(row[0] || '').trim(), detectedAt: String(row[1] || '').trim(),
        gameId: String(row[5] || '').trim(),
        memberId: String(row[2] || '').trim(), member: String(row[3] || '').trim(), raUser: String(row[4] || '').trim(),
        game: String(row[6] || '').trim(), image: String(row[7] || '').trim(),
        console: String(row[11] || '').trim(), memberImage: String(row[12] || '').trim(),
        activity: String(row[9] || '').trim(),
        time: headers[10] ? String(row[10] || '').trim() : ''
      })).filter(row => row.key && row.member && row.game);
      if (records.length > MAX_ROWS) throw new Error('A aba Masterizações tem mais de 5.000 linhas.');
      return [...new Map(records.map(record => [record.key, record])).values()];
    }

    merge(rows) {
      const oldByKey = new Map(this.cache.records.map(record => [record.key, record]));
      const shown = { ...this.cache.shown };
      const ignored = new Set(this.cache.ignored);
      const policy = this.policy();
      if (policy === 'unannounced') ignored.clear();
      const records = rows.map(row => ({
        key: String(row.key || '').trim(), detectedAt: String(row.detectedAt || ''),
        memberId: String(row.memberId || ''), member: String(row.member || ''), raUser: String(row.raUser || ''),
        gameId: String(row.gameId || ''), game: String(row.game || ''), console: String(row.console || ''), image: String(row.image || ''), memberImage: String(row.memberImage || ''),
        activity: String(row.activity || ''), time: row.time == null ? '' : String(row.time)
      })).filter(row => row.key && row.member && row.game);
      for (const record of records) {
        if (!oldByKey.has(record.key)) ignored.delete(record.key);
      }
      this.cache.records = records;
      this.cache.shown = shown;
      this.cache.ignored = [...ignored];
      this.cache.policy = policy;
    }

    counts() {
      const ignored = new Set(this.cache.ignored);
      let announced = 0, skipped = 0;
      for (const record of this.cache.records) {
        if (app.merlinSettings?.isMemberHidden(record.memberId) || !this.isAfterHistoryCutoff(record)) continue;
        if (this.cache.shown[record.key]) announced++;
        else if (ignored.has(record.key)) skipped++;
        else if (app.merlinSettings?.isRecruitment(record) && !app.merlinSettings.value.recruitsEnabled) skipped++;
      }
      const visibleCount = this.cache.records.filter(record => !app.merlinSettings?.isMemberHidden(record.memberId) && this.isAfterHistoryCutoff(record)).length;
      return { announced, skipped, pending: visibleCount - announced - skipped };
    }

    state(record) {
      if (this.cache.shown[record.key]) return 'Anunciada';
      if (!this.isAfterHistoryCutoff(record)) return 'Anterior ao início atual';
      if (this.cache.ignored.includes(record.key)) return 'Ignorada pela configuração';
      if (app.merlinSettings?.isRecruitment(record) && !app.merlinSettings.value.recruitsEnabled) return 'Desativada nas configurações do balão';
      return 'Pendente';
    }

    render() {
      this.renderCollectorList();
      const counts = this.counts();
      const summary = document.createElement('p');
      summary.className = 'merlin-queue-summary';
      summary.textContent = `${counts.pending} pendente(s) · ${counts.announced} anunciada(s) · ${counts.skipped} ignorada(s)`;
      const fragment = document.createDocumentFragment();
      fragment.append(summary);
      const ordered = [...this.cache.records].sort((a, b) => (Date.parse(b.detectedAt) || 0) - (Date.parse(a.detectedAt) || 0));
      for (const record of ordered) {
        const item = document.createElement('article');
        item.className = 'merlin-queue-item';
        item._merlinRecord = record;
        const heading = document.createElement('strong');
        heading.textContent = `${app.merlinSettings.memberName(record.memberId, record.member)} — ${record.game}`;
        const preview = this.messagePreview(record);
        this.bindAnnouncementPreview(preview, record);
        item.append(heading, preview);
        const detail = document.createElement('span');
        const time = Number.isFinite(Number(record.time)) && record.time !== '' ? `${record.time} s` : 'tempo não informado';
        detail.textContent = `${this.date(record.detectedAt)} · ${time}`;
        const state = document.createElement('span');
        const stateText = this.state(record);
        state.textContent = stateText === 'Anunciada' && this.cache.shown[record.key]?.at
          ? `Anunciada em ${this.date(this.cache.shown[record.key].at)}` : stateText;
        state.className = 'merlin-queue-state ' + (stateText === 'Anunciada' ? 'is-shown' : stateText === 'Pendente' ? 'is-pending' : 'is-ignored');
        item.append(detail, state);
        fragment.append(item);
      }
      if (!ordered.length) {
        const empty = document.createElement('p');
        empty.className = 'merlin-queue-empty';
        empty.textContent = 'Nenhuma masterização foi coletada ainda. Use “Atualizar agora” para ler a planilha.';
        fragment.append(empty);
      }
      this.list.replaceChildren(fragment);
      this.fitAutoImages();
      this.updateControls();
    }

    renderCollectorList() {
      if (!this.collectedList) return;
      const records = [...this.cache.records].sort((a, b) => (Date.parse(b.detectedAt) || 0) - (Date.parse(a.detectedAt) || 0));
      const shown = records.slice(0, MAX_COLLECTION_PREVIEW_ROWS);
      const table = document.createElement('table');
      table.className = 'collected-table';
      const head = document.createElement('thead');
      const headerRow = document.createElement('tr');
      for (const title of ['Detectado em', 'Membro', 'Jogo', 'Evento/Sorteio', 'Tempo', 'Estado']) {
        const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = title; headerRow.append(cell);
      }
      head.append(headerRow);
      const body = document.createElement('tbody');
      for (const record of shown) {
        const row = document.createElement('tr');
        row._merlinRecord = record;
        const values = [this.date(record.detectedAt), app.merlinSettings.memberName(record.memberId, record.member), record.game, record.activity || '—', record.time ? `${record.time} s` : '—', this.state(record)];
        for (const value of values) { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }
        body.append(row);
      }
      table.append(head, body);
      const summary = document.createElement('p');
      summary.className = 'collected-list-summary';
      summary.textContent = records.length > shown.length ? `Mostrando os ${shown.length} mais recentes de ${records.length} registros.` : `${records.length} registro(s) no cache local, das mais recentes para as mais antigas.`;
      if (!records.length) summary.textContent = 'A lista aparecerá aqui depois da primeira coleta.';
      this.collectedList.replaceChildren(summary, table);
    }

    messagePreview(record) {
      const settings = app.merlinSettings;
      const layout = settings.imageLayout();
      const bubble = document.createElement('div');
      settings.applyBubbleColor(bubble, layout.bubbleColor);
      const bubbleWidth = layout.bubbleWidth === 'auto' ? 'max' : layout.bubbleWidth;
      bubble.className = `merlin-queue-preview mastery image-size-${layout.size} message-width-${bubbleWidth} mastery-text-${layout.fontSize} message-font-${layout.fontFamily} member-image-shape-${layout.memberShape}`;
      bubble.style.setProperty('--message-width', `${bubbleWidth === 'max' ? 0 : bubbleWidth}px`);
      for (const spec of settings.imageOptions(record)) {
        const image = document.createElement('img');
        image.className = `event-image ${spec.type}-image image-${spec.position}`;
        image.src = spec.url; image.alt = spec.alt; image.referrerPolicy = 'no-referrer';
        image.addEventListener('error', () => image.remove(), { once: true });
        bubble.append(image);
      }
      const text = document.createElement('p');
      text.className = 'mastery-text';
      app.appendFormattedText(text, app.merlinMessage.render(settings.templateFor(record), {
        Membro: settings.memberName(record.memberId, record.member), Jogo: record.game, Console: settings.consoleName(record.console),
        Tempo: record.time, Evento: record.activity
      }, settings.value.timeFormat));
      bubble.append(text);
      return bubble;
    }

    bindAnnouncementPreview(preview, record) {
      preview.title = 'Dê dois cliques para anunciar esta masterização';
      preview.setAttribute('role', 'button');
      preview.tabIndex = 0;
      preview.addEventListener('dblclick', () => { void this.announceRecord(record); });
      preview.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        void this.announceRecord(record);
      });
    }

    async announceRecord(record) {
      if (this.loading || this.running || this.selector.busy || this.selector.events?.running) {
        this.status.textContent = 'Aguarde a operação atual terminar para anunciar esta masterização.';
        return;
      }
      const settings = app.merlinSettings;
      if (settings.isMemberHidden(record.memberId)) {
        this.status.textContent = 'Este membro está oculto nas configurações e não pode ser anunciado.';
        return;
      }
      if (settings.isRecruitment(record) && !settings.value.recruitsEnabled) {
        this.status.textContent = 'Ative os anúncios de recrutamento na aba Balão de conversa para apresentar esta mensagem.';
        return;
      }
      const presenterId = this.selector.nextPresenter();
      if (!presenterId) {
        this.status.textContent = 'Selecione pelo menos um Agent para apresentar as masterizações.';
        return;
      }
      const signal = app.workController.signal;
      this.running = true;
      this.selector.close();
      this.selector.events?.auto?.pause();
      this.selector.setBusy(true);
      this.updateControls();
      try {
        const text = app.merlinMessage.render(settings.templateFor(record), {
          Membro: settings.memberName(record.memberId, record.member), Jogo: record.game,
          Console: settings.consoleName(record.console), Tempo: record.time, Evento: record.activity
        }, settings.value.timeFormat);
        const message = {
          text, images: settings.imageOptions(record), displayOptions: settings.imageLayout(),
          readingMs: settings.value.readingSeconds * 1000, mastery: true,
          soundCategory: settings.isRecruitment(record) ? 'recruits' : 'masterizations'
        };
        this.status.textContent = `${this.selector.agentName(presenterId)} apresenta ${settings.memberName(record.memberId, record.member)} — ${record.game}`;
        const ok = await this.present(presenterId, 'evento', null, signal, [message], async () => {
          this.cache.shown[record.key] = { at: new Date().toISOString() };
          this.cache.ignored = this.cache.ignored.filter(key => key !== record.key);
          this.save();
          this.status.textContent = `Anunciada: ${settings.memberName(record.memberId, record.member)} — ${record.game}`;
          this.render();
        });
        app.checkSignal(signal);
        if (!ok) throw new Error('A apresentação falhou. A masterização não foi marcada como anunciada.');
      } catch (error) {
        if (error.name !== 'AbortError') this.status.textContent = error.message;
      } finally {
        this.running = false;
        this.selector.setBusy(false);
        this.selector.events?.auto?.resume();
        this.updateControls();
        this.processPending();
      }
    }

    updateControls() {
      const counts = this.counts();
      this.refreshButton.disabled = this.loading || this.running;
      this.announceButton.disabled = this.loading || this.running || counts.pending === 0 || !this.selector.presenterIds.length;
      this.clearButton.disabled = this.loading || this.running;
    }

    clearHistory() {
      if (this.loading || this.running) return;
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('AssistenteLive.hallCatalog.v2');
        localStorage.removeItem('AssistenteLive.hallCatalog.v1');
      } catch {}
      this.cache = { version: 1, initialized: false, syncedAt: 0, policy: this.policy(), historyCutoffAt: 0, resetAllPending: false, revision: '', catalog: null, records: [], shown: {}, ignored: [] };
      this.applyHistoryPolicy(false, true);
      this.deferAuto = false;
      app.merlinMessage.invalidateHallMemberImageCache();
      this.selector.merlinSettings.setPreviewRecords([]);
      this.selector.merlinSettings.setAvailableMembers([]);
      this.selector.merlinSettings.setAvailableConsoles([]);
      this.status.textContent = 'Cache das masterizações apagado. Buscando novamente…';
      this.render();
      void this.sync(true);
    }

    cancel() {
      if (!this.running && !this.loading) return;
      this.stopRequested = true;
      if (this.running) this.status.textContent = 'Fila interrompida ao abrir o painel. A masterização atual não foi marcada se a apresentação não terminou.';
      this.updateControls();
    }

    async announcePending() {
      if (this.loading || this.running || this.selector.busy || this.selector.events?.running || !this.selector.presenterIds.length) return;
      const pending = this.cache.records
        .filter(record => this.isAfterHistoryCutoff(record) && !app.merlinSettings.isMemberHidden(record.memberId) && (!app.merlinSettings.isRecruitment(record) || app.merlinSettings.value.recruitsEnabled) && this.state(record) === 'Pendente')
        .sort((a, b) => (Date.parse(a.detectedAt) || 0) - (Date.parse(b.detectedAt) || 0));
      if (!pending.length) return;
      const signal = app.workController.signal;
      this.running = true;
      this.stopRequested = false;
      this.selector.close();
      this.selector.events?.auto?.pause();
      this.selector.setBusy(true);
      this.updateControls();
      let completed = 0;
      try {
        const settings = app.merlinSettings;
        const messages = pending.map(record => {
          const text = app.merlinMessage.render(settings.templateFor(record), {
            Membro: settings.memberName(record.memberId, record.member), Jogo: record.game, Console: settings.consoleName(record.console), Tempo: record.time,
            Evento: record.activity
          }, settings.value.timeFormat);
          return {
            text, images: settings.imageOptions(record), displayOptions: settings.imageLayout(),
            readingMs: settings.value.readingSeconds * 1000, mastery: true,
            soundCategory: settings.isRecruitment(record) ? 'recruits' : 'masterizations'
          };
        });
        this.status.textContent = `Anunciando sequência de ${pending.length} masterização(ões), da mais antiga para a mais recente…`;
        for (let index = 0; index < messages.length; index++) {
          app.checkSignal(signal);
          if (this.stopRequested) break;
          if (completed) await app.wait(1200, signal);
          if (this.stopRequested) break;
          const presenterId = this.selector.nextPresenter();
          if (!presenterId) throw new Error('Selecione pelo menos um Agent para apresentar as masterizações.');
          const record = pending[index];
          this.status.textContent = `Masterização ${index + 1} de ${pending.length}: ${this.selector.agentName(presenterId)} apresenta ${settings.memberName(record.memberId, record.member)} — ${record.game}`;
          const ok = await this.present(presenterId, 'evento', null, signal, [messages[index]], async () => {
            this.cache.shown[record.key] = { at: new Date().toISOString() };
            this.cache.ignored = this.cache.ignored.filter(key => key !== record.key);
            this.save();
            completed++;
            this.status.textContent = `Anunciadas ${completed} de ${pending.length}: ${settings.memberName(record.memberId, record.member)} — ${record.game}`;
            this.render();
          });
          this.selector.setBusy(true);
          app.checkSignal(signal);
          if (!ok) throw new Error('A apresentação falhou. O item atual continua pendente.');
        }
        const left = this.counts().pending;
        this.status.textContent = this.stopRequested
          ? `Fila interrompida. ${completed} anunciada(s); ${left} ainda pendente(s).`
          : `Fila concluída. ${completed} masterização(ões) anunciada(s); ${left} pendente(s).`;
      } catch (error) {
        if (error.name !== 'AbortError') {
          this.deferAuto = true;
          this.status.textContent = error.message;
        }
      } finally {
        this.running = false;
        this.stopRequested = false;
        this.selector.setBusy(false);
        this.selector.events?.auto?.resume();
        this.updateControls();
        this.processPending();
      }
    }
  };
})();


