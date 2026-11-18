(() => {
  'use strict';
  const app = window.AssistenteLive;
  const STORAGE_KEY = 'AssistenteLive.merlinQueue.v1';
  const CATALOG_STORAGE_KEY = 'AssistenteLive.hallCatalog.v2';
  const COLLECTION_SETTINGS_KEY = 'AssistenteLive.merlinCollection.v1';
  const DEFAULT_POLL_INTERVAL_MS = 30 * 1000;
  const COLLECTION_CACHE_TTL_MS = 30 * 1000;
  const CATALOG_TTL_MS = 5 * 60 * 1000;
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
      this.hallCatalog = this.loadHallCatalogCache();
      this.cache = this.loadCache();
      selector.merlinSettings.setPreviewRecords(this.cache.records);
      selector.merlinSettings.setAvailableMembers(this.activeMemberOptions(this.cache.records));
      this.refreshButton.addEventListener('click', () => { void this.sync(true); });
      this.autoCollectInput.addEventListener('change', () => {
        this.collectionSettings.enabled = this.autoCollectInput.checked;
        this.saveCollectionSettings();
        if (this.collectionSettings.enabled) {
          void this.sync(true);
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
      if (this.collectionSettings.enabled) void this.sync(true);
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
            resetAllPending: Boolean(saved.resetAllPending),
            records: saved.records.filter(row => row && typeof row.key === 'string' && row.key),
            shown: saved.shown && typeof saved.shown === 'object' ? saved.shown : {},
            ignored: Array.isArray(saved.ignored) ? saved.ignored.filter(key => typeof key === 'string') : []
          };
        }
      } catch {}
      return { version: 1, initialized: false, syncedAt: 0, policy: '', resetAllPending: false, records: [], shown: {}, ignored: [] };
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

    refreshNamePreviews({ memberId = null } = {}) {
      const settings = app.merlinSettings;
      for (const item of this.list.querySelectorAll('.merlin-queue-item')) {
        const record = item._merlinRecord;
        if (!record || (memberId && record.memberId !== memberId)) continue;
        item.querySelector(':scope > strong').textContent = `${settings.memberName(record.memberId, record.member)} — ${record.game}`;
        const text = item.querySelector('.mastery-text');
        if (text) text.textContent = app.merlinMessage.render(settings.value.template, {
          Membro: settings.memberName(record.memberId, record.member), Jogo: record.game, Console: settings.consoleName(record.console),
          Tempo: record.time, Evento: record.activity
        }, settings.value.timeFormat);
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
        await this.sync(true);
        this.schedulePoll();
      }, DEFAULT_POLL_INTERVAL_MS);
    }

    processPending() {
      if (this.loading || this.running || this.deferAuto || this.selector.busy || this.selector.events?.running || this.selector.panel.hidden === false || this.counts().pending === 0) return;
      void this.announcePending();
    }

    async sync(force) {
      if (this.loading) return;
      if (!force && this.cache.initialized && Date.now() - this.cache.syncedAt <= COLLECTION_CACHE_TTL_MS) return;
      const signal = app.workController.signal;
      this.loading = true;
      this.updateControls();
      this.status.textContent = 'Lendo as masterizações diretamente no Google Sheets…';
      this.collectStatus.textContent = 'Lendo a aba Masterizações do Google Sheets…';
      const controller = new AbortController();
      const cancel = () => controller.abort();
      signal.addEventListener('abort', cancel, { once: true });
      const timer = setTimeout(cancel, 20000);
      try {
        const config = app.eventsConfig;
        const url = new URL(`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq`);
        url.search = new URLSearchParams({
          tqx: 'out:csv', sheet: config.masteriesSheetName, range: 'A1:K5000', headers: '1', t: String(Date.now())
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
        const catalog = await this.loadHallCatalog(signal);
        this.selector.merlinSettings.setAvailableConsoles(Object.values(catalog.games).map(game => game.console));
        this.selector.merlinSettings.setAvailableMembers(this.activeMemberOptions(rows));
        for (const row of rows) {
          const hallGame = catalog.games[row.gameId] || catalog.gamesByName[this.normalizeCatalogName(row.game)] || {};
          row.console = row.console || hallGame.console || '';
          // Prefer the Hall badge; fall back to the game image URL captured in the Masterizações sheet.
          row.image = hallGame.image || row.image || '';
          row.memberImage = catalog.members[row.memberId] || '';
        }
        this.merge(rows);
        this.selector.merlinSettings.setPreviewRecords(this.cache.records);
        this.deferAuto = false;
        this.cache.syncedAt = Date.now();
        this.cache.initialized = true;
        this.cache.resetAllPending = false;
        this.cache.policy = this.policy();
        this.save();
        this.status.textContent = `Coleta concluída: ${this.cache.records.length} masterização(ões) no cache local. ${this.counts().pending} pendente(s).`;
        this.collectStatus.textContent = `Coleta concluída: ${this.cache.records.length} masterização(ões). Atualização automática ${this.collectionSettings.enabled ? 'a cada 30 s' : 'desativada'}.`;
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

    loadHallCatalogCache() {
      try {
        const saved = JSON.parse(localStorage.getItem(CATALOG_STORAGE_KEY) || 'null');
        if (saved?.version === 5 && saved.games && typeof saved.games === 'object' && saved.members && typeof saved.members === 'object') {
          return {
            syncedAt: Number(saved.syncedAt) || 0, games: saved.games, gamesByName: saved.gamesByName || {}, members: saved.members,
            memberNames: saved.memberNames && typeof saved.memberNames === 'object' ? saved.memberNames : {},
            activeMemberIds: Array.isArray(saved.activeMemberIds) ? saved.activeMemberIds.filter(id => /^\d+$/.test(String(id))).map(String) : []
          };
        }
      } catch {}
      return { syncedAt: 0, games: {}, gamesByName: {}, members: {}, memberNames: {}, activeMemberIds: [] };
    }

    normalizeCatalogName(value) {
      return String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();
    }

    activeMemberOptions(records = []) {
      const activeIds = new Set((this.hallCatalog.activeMemberIds || []).map(String));
      const activeNames = Object.entries(this.hallCatalog.memberNames || {})
        .filter(([memberId]) => activeIds.has(String(memberId)))
        .map(([memberId, member]) => ({ memberId, member }));
      return [...activeNames, ...records.filter(record => activeIds.has(String(record.memberId || '')))];
    }

    async loadHallCatalog(signal) {
      if (this.hallCatalog.syncedAt && Date.now() - this.hallCatalog.syncedAt < CATALOG_TTL_MS) return this.hallCatalog;
      const config = app.eventsConfig;
      const normalize = value => String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const idFrom = value => {
        const text = String(value || '').trim();
        const match = /(?:retroachievements\.org\/(?:game|game\/))([0-9]{1,10})/i.exec(text) || /(?:^|\D)([0-9]{1,10})(?:\D|$)/.exec(text);
        return match?.[1] || '';
      };
      const urlFrom = value => /https?:\/\/[^\s"')]+/i.exec(String(value || ''))?.[0] || '';
      let sheets;
      try {
        sheets = await Promise.all(config.hallCatalogTabs.map(async tab => {
          const url = new URL(`https://docs.google.com/spreadsheets/d/e/${config.hallPublishedId}/pub`);
          url.search = new URLSearchParams({ gid: tab.gid, single: 'true', output: 'csv' }).toString();
          const response = await fetch(url.href, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal });
          if (!response.ok) throw new Error(`Catálogo Hall (${tab.name}) respondeu HTTP ${response.status}.`);
          const rows = app.parseCSV(await response.text());
          let links = [];
          try {
            const htmlUrl = new URL(`https://docs.google.com/spreadsheets/d/e/${config.hallPublishedId}/pubhtml/sheet`);
            htmlUrl.search = new URLSearchParams({ headers: 'false', gid: tab.gid }).toString();
            const htmlResponse = await fetch(htmlUrl.href, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal });
            if (htmlResponse.ok) {
              const table = /<table\b[^>]*class=["'][^"']*waffle[^"']*["'][^>]*>([\s\S]*?)<\/table>/i.exec(await htmlResponse.text())?.[1] || '';
              links = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1).map(match => [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => {
                const href = /<a\b[^>]*href=["']([^"']+)["']/i.exec(cell[1])?.[1] || '';
                return href.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
              }));
            }
          } catch {}
          return { tab: tab.name, rows, links };
        }));
      } catch {
        return this.hallCatalog;
      }
      const games = {};
      const gamesByName = {};
      const members = {};
      const memberNames = {};
      const activeMemberIds = new Set();
      for (const { tab, rows, links } of sheets) {
        if (!rows.length) continue;
        const headers = rows.shift().map(normalize);
        const index = names => headers.findIndex(header => names.some(name => header === normalize(name)));
        const cell = (row, ...names) => {
          const position = index(names);
          return position < 0 ? '' : String(row[position] || '').trim();
        };
        if (normalize(tab) === 'membros') {
          const idColumn = index(['ID', 'MEMBRO ID']);
          const photoColumn = index(['FOTO', 'IMAGEM', 'AVATAR']);
          const memberNameColumn = index(['MEMBRO', 'NOME', 'NOME DO MEMBRO', 'MEMBER', 'NOME EXIBIDO']);
          const statusColumn = index(['STATUS', 'SITUACAO']);
          if (idColumn >= 0 && statusColumn >= 0) {
            for (const [rowIndex, row] of rows.entries()) {
              const memberId = String(row[idColumn] || '').trim();
              const status = normalize(row[statusColumn]);
              if (!/^\d+$/.test(memberId) || !['ativo', 'ativa', 'active'].includes(status)) continue;
              activeMemberIds.add(memberId);
              const photo = photoColumn >= 0 ? urlFrom(cell(row, 'FOTO', 'IMAGEM', 'AVATAR')) || urlFrom(links[rowIndex]?.[photoColumn]) : '';
              const name = memberNameColumn >= 0 ? String(row[memberNameColumn] || '').trim() : '';
              if (photo) members[memberId] = photo;
              if (name) memberNames[memberId] = name;
            }
          }
          continue;
        }
        for (const [rowIndex, row] of rows.entries()) {
          const linkColumn = index(['LINK RA']);
          const id = idFrom(cell(row, 'LINK RA', 'JOGO ID', 'JOGO RA ID', 'ID RA', 'RA ID')) || (linkColumn < 0 ? '' : idFrom(links[rowIndex]?.[linkColumn]));
          const gameName = cell(row, 'NOME DO JOGO', 'NOME JOGO', 'JOGO', 'NOME', 'GAME', 'GAME NAME');
          if (!id && !gameName) continue;
          const imageColumn = index(['BADGE', 'BADGE DO JOGO', 'IMAGEM']);
          const image = urlFrom(cell(row, 'BADGE', 'BADGE DO JOGO', 'IMAGEM')) || (imageColumn < 0 ? '' : urlFrom(links[rowIndex]?.[imageColumn]));
          const gameConsole = cell(row, 'CONSOLE', 'PLATAFORMA', 'SISTEMA');
          const existing = id ? games[id] || { console: '', image: '' } : { console: '', image: '' };
          const details = { console: gameConsole || existing.console, image: existing.image || image };
          if (id) games[id] = details;
          if (gameName) gamesByName[this.normalizeCatalogName(gameName)] = details;
        }
      }
      this.hallCatalog = { syncedAt: Date.now(), games, gamesByName, members, memberNames, activeMemberIds: [...activeMemberIds] };
      try { localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify({ version: 5, ...this.hallCatalog })); } catch {}
      return this.hallCatalog;
    }

    parseSheet(csv) {
      if (/^\s*</.test(csv)) throw new Error('O Google não liberou a planilha para leitura direta. Confira o compartilhamento de leitor.');
      const rows = app.parseCSV(csv);
      const normalize = value => String(value || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const headers = (rows.shift() || []).map(normalize);
      const expected = ['chave', 'detectado em', 'membro id', 'membro', 'usuario ra', 'jogo ra id', 'jogo', 'imagem', 'origem', 'evento/sorteio'];
      if (expected.some((header, index) => headers[index] !== header) || (headers.length > 11) || (headers.length === 11 && headers[10] !== 'tempo')) {
        throw new Error('Cabeçalhos da aba Masterizações diferentes do esperado. Confira as colunas Chave até Tempo.');
      }
      if (headers.length < 10) throw new Error('A aba Masterizações está sem todas as colunas necessárias.');
      const records = rows.map(row => ({
        key: String(row[0] || '').trim(), detectedAt: String(row[1] || '').trim(),
        gameId: String(row[5] || '').trim(),
        memberId: String(row[2] || '').trim(), member: String(row[3] || '').trim(), raUser: String(row[4] || '').trim(),
        game: String(row[6] || '').trim(), image: String(row[7] || '').trim(),
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
      const firstCollection = !this.cache.initialized;
      const policyChanged = this.cache.initialized && this.cache.policy !== policy;
      if (policyChanged && policy === 'new-only' && !this.cache.resetAllPending) {
        for (const record of this.cache.records) if (!shown[record.key]) ignored.add(record.key);
      } else if (policyChanged && policy === 'unannounced') {
        for (const record of this.cache.records) ignored.delete(record.key);
      }
      const records = rows.map(row => ({
        key: String(row.key || '').trim(), detectedAt: String(row.detectedAt || ''),
        memberId: String(row.memberId || ''), member: String(row.member || ''), raUser: String(row.raUser || ''),
        gameId: String(row.gameId || ''), game: String(row.game || ''), console: String(row.console || ''), image: String(row.image || ''), memberImage: String(row.memberImage || ''),
        activity: String(row.activity || ''), time: row.time == null ? '' : String(row.time)
      })).filter(row => row.key && row.member && row.game);
      if (firstCollection && policy === 'new-only' && !this.cache.resetAllPending) {
        for (const record of records) ignored.add(record.key);
      } else {
        for (const record of records) {
          if (!oldByKey.has(record.key)) ignored.delete(record.key);
        }
      }
      this.cache.records = records;
      this.cache.shown = shown;
      this.cache.ignored = [...ignored];
    }

    counts() {
      const ignored = new Set(this.cache.ignored);
      let announced = 0, skipped = 0;
      for (const record of this.cache.records) {
        if (app.merlinSettings?.isMemberHidden(record.memberId)) continue;
        if (this.cache.shown[record.key]) announced++;
        else if (ignored.has(record.key)) skipped++;
      }
      const visibleCount = this.cache.records.filter(record => !app.merlinSettings?.isMemberHidden(record.memberId)).length;
      return { announced, skipped, pending: visibleCount - announced - skipped };
    }

    state(record) {
      if (this.cache.shown[record.key]) return 'Anunciada';
      if (this.cache.ignored.includes(record.key)) return 'Ignorada pela configuração';
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
      const ordered = this.cache.records.filter(record => !app.merlinSettings?.isMemberHidden(record.memberId)).sort((a, b) => (Date.parse(b.detectedAt) || 0) - (Date.parse(a.detectedAt) || 0));
      for (const record of ordered) {
        const item = document.createElement('article');
        item.className = 'merlin-queue-item';
        item._merlinRecord = record;
        const heading = document.createElement('strong');
        heading.textContent = `${app.merlinSettings.memberName(record.memberId, record.member)} — ${record.game}`;
        item.append(heading, this.messagePreview(record));
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
        empty.textContent = 'A fila está vazia. Use “Atualizar agora” nesta aba para coletar as linhas.';
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
      text.textContent = app.merlinMessage.render(settings.value.template, {
        Membro: settings.memberName(record.memberId, record.member), Jogo: record.game, Console: settings.consoleName(record.console),
        Tempo: record.time, Evento: record.activity
      }, settings.value.timeFormat);
      bubble.append(text);
      return bubble;
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
        localStorage.removeItem(CATALOG_STORAGE_KEY);
        localStorage.removeItem('AssistenteLive.hallCatalog.v1');
      } catch {}
      this.cache = { version: 1, initialized: false, syncedAt: 0, policy: this.policy(), resetAllPending: true, records: [], shown: {}, ignored: [] };
      this.hallCatalog = { syncedAt: 0, games: {}, members: {}, memberNames: {}, activeMemberIds: [] };
      this.deferAuto = false;
      app.merlinMessage.invalidateHallMemberImageCache();
      this.selector.merlinSettings.setPreviewRecords([]);
      this.status.textContent = 'Cache das masterizações, catálogo e fotos do Hall apagado. Buscando tudo novamente…';
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
        .filter(record => !app.merlinSettings.isMemberHidden(record.memberId) && this.state(record) === 'Pendente')
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
          const text = app.merlinMessage.render(settings.value.template, {
            Membro: settings.memberName(record.memberId, record.member), Jogo: record.game, Console: settings.consoleName(record.console), Tempo: record.time,
            Evento: record.activity
          }, settings.value.timeFormat);
          return {
            text, images: settings.imageOptions(record), displayOptions: settings.imageLayout(),
            readingMs: settings.value.readingSeconds * 1000, mastery: true, soundCategory: 'masterizations'
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

