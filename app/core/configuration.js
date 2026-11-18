(() => {
  'use strict';
  const app = window.AssistenteLive;
  const FORMAT = 'AssistenteLive.settings';
  const VERSION = 1;
  const WELCOME_DEFAULT = 'Olá! Seja bem-vindo(a) à live. Pressione F1 para abrir o menu.';
  const KEYS = [
    'AssistenteLive.activeTab',
    'AssistenteLive.agentOverrides.v1',
    'AssistenteLive.agentAnimationSequence.v1',
    'AssistenteLive.agentMessageAnimationMode.v1',
    'AssistenteLive.messageExample',
    'AssistenteLive.welcomeEnabled.v1',
    'AssistenteLive.welcomeMessage.v1',
    'AssistenteLive.selectedAgent',
    'AssistenteLive.presentationAgents.v1',
    'AssistenteLive.merlinSettings.v1',
    'AssistenteLive.selectedEventMessages.v1',
    'AssistenteLive.localAnnouncements.v1',
    'AssistenteLive.localEventReadingSeconds.v1',
    'AssistenteLive.localIntervalMinutes',
    'AssistenteLive.localEventImagePosition.v1',
    'AssistenteLive.localNextEventPosition',
    'AssistenteLive.newEventMessagesSelected.v1',
    'AssistenteLive.eventImagePosition.v1',
    'AssistenteLive.eventReadingSeconds.v1',
    'AssistenteLive.intervalMinutes',
    'AssistenteLive.nextEventPosition',
    'AssistenteLive.merlinCollection.v1'
  ];
  const TAB_NAMES = ['mascotes', 'merlin', 'anuncios', 'anuncios-locais', 'merlin-fila', 'sons', 'membros', 'console', 'configuracoes'];
  const EXAMPLES = ['curto', 'longo', 'saudacao'];

  function isObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
  function validStoredValue(key, raw, selector) {
    if (raw === null) return true;
    if (typeof raw !== 'string' || raw.length > (key === 'AssistenteLive.merlinSettings.v1' ? 3000000 : 1000000)) return false;
    if (key === 'AssistenteLive.activeTab') return TAB_NAMES.includes(raw);
    if (key === 'AssistenteLive.messageExample') return EXAMPLES.includes(raw);
    if (key === 'AssistenteLive.welcomeEnabled.v1') return raw === 'true' || raw === 'false';
    if (key === 'AssistenteLive.welcomeMessage.v1') return raw.length <= 350;
    if (key === 'AssistenteLive.selectedAgent') return selector.catalog.some(entry => entry.id === raw);
    if (key === 'AssistenteLive.presentationAgents.v1') {
      let ids;
      try { ids = JSON.parse(raw); } catch { return false; }
      return Array.isArray(ids) && ids.length >= 1 && ids.length <= selector.catalog.length
        && new Set(ids).size === ids.length && ids.every(id => selector.loaded.has(id));
    }
    if (key === 'AssistenteLive.newEventMessagesSelected.v1') return raw === 'true' || raw === 'false';
    if (key === 'AssistenteLive.eventImagePosition.v1') return raw === 'left' || raw === 'right';
    if (key === 'AssistenteLive.agentMessageAnimationMode.v1') return raw === 'loop' || raw === 'rotate';
    if (key === 'AssistenteLive.eventReadingSeconds.v1') return /^\d+$/.test(raw) && Number(raw) >= 3 && Number(raw) <= 120;
    if (key === 'AssistenteLive.localEventReadingSeconds.v1') return /^\d+$/.test(raw) && Number(raw) >= 3 && Number(raw) <= 120;
    if (key === 'AssistenteLive.localIntervalMinutes') return /^\d+$/.test(raw) && Number(raw) <= 10080;
    if (key === 'AssistenteLive.localEventImagePosition.v1') return raw === 'left' || raw === 'right';
    if (key === 'AssistenteLive.localNextEventPosition') return /^\d+$/.test(raw) && Number(raw) <= 1000;
    if (key === 'AssistenteLive.intervalMinutes') return /^\d+$/.test(raw) && Number(raw) <= 10080;
    if (key === 'AssistenteLive.nextEventPosition') return /^\d+$/.test(raw) && Number(raw) <= 1000;
    let value;
    try { value = JSON.parse(raw); } catch { return false; }
    if (key === 'AssistenteLive.agentOverrides.v1' || key === 'AssistenteLive.merlinSettings.v1') return isObject(value);
    if (key === 'AssistenteLive.agentAnimationSequence.v1') return isObject(value)
      && Object.entries(value).length <= selector.catalog.length
      && Object.entries(value).every(([agentId, choices]) => {
        if (!selector.catalog.some(entry => entry.id === agentId)) return false;
        const available = selector.loaded.get(agentId)?.definition.animations || {};
        if (Array.isArray(choices)) return choices.length >= 2 && choices.length <= 30
          && choices.every(name => typeof name === 'string' && name.length <= 100 && available[name]);
        return isObject(choices) && (choices.messageMode === undefined || choices.messageMode === 'loop' || choices.messageMode === 'rotate')
          && ['entry', 'message', 'exit'].every(group => Array.isArray(choices[group])
          && choices[group].length >= 1 && choices[group].length <= 30
          && choices[group].every(name => typeof name === 'string' && name.length <= 100 && available[name]));
      });
    if (key === 'AssistenteLive.selectedEventMessages.v1') {
      return isObject(value) && Array.isArray(value.selected) && Array.isArray(value.known)
        && value.selected.length <= 10000 && value.known.length <= 10000
        && [...value.selected, ...value.known].every(item => typeof item === 'string' && item.length <= 1000);
    }
    if (key === 'AssistenteLive.localAnnouncements.v1') return Array.isArray(value) && value.length <= 50
      && value.every(item => isObject(item) && typeof item.id === 'string' && item.id.length <= 100
        && typeof item.message === 'string' && item.message.trim().length > 0 && item.message.length <= 350
        && typeof item.imageUrl === 'string' && item.imageUrl.length <= 2048
        && (!item.imageUrl || /^https?:\/\//i.test(item.imageUrl)));
    if (key === 'AssistenteLive.merlinCollection.v1') return isObject(value)
      && (value.enabled === undefined || typeof value.enabled === 'boolean')
      && (value.showList === undefined || typeof value.showList === 'boolean');
    return false;
  }

  app.ConfigurationPanel = class {
    constructor(selector) {
      this.selector = selector;
      this.status = document.getElementById('configuration-status');
      this.exportData = document.getElementById('settings-export-data');
      this.exportLabel = document.getElementById('settings-export-label');
      this.importData = document.getElementById('settings-import-data');
      this.restoreConfirmation = document.getElementById('restore-settings-confirmation');
      this.confirmRestoreButton = document.getElementById('confirm-restore-settings');
      this.welcomeEnabled = document.getElementById('welcome-enabled');
      this.welcomeMessage = document.getElementById('welcome-message');
      try {
        this.welcomeEnabled.checked = localStorage.getItem('AssistenteLive.welcomeEnabled.v1') !== 'false';
        this.welcomeMessage.value = localStorage.getItem('AssistenteLive.welcomeMessage.v1') ?? WELCOME_DEFAULT;
      } catch {
        this.welcomeEnabled.checked = true;
        this.welcomeMessage.value = WELCOME_DEFAULT;
      }
      this.welcomeEnabled.addEventListener('change', () => this.saveWelcomeSettings());
      this.welcomeMessage.addEventListener('change', () => this.saveWelcomeSettings());
      document.getElementById('export-settings').addEventListener('click', () => this.export());
      document.getElementById('copy-settings').addEventListener('click', () => this.copyExport());
      document.getElementById('import-pasted-settings').addEventListener('click', () => this.importPastedSettings());
      document.getElementById('restore-settings').addEventListener('click', () => this.restoreDefaults());
      this.confirmRestoreButton.addEventListener('click', () => this.confirmRestoreDefaults());
      document.getElementById('cancel-restore-settings').addEventListener('click', () => {
        this.restoreConfirmation.hidden = true;
        this.status.textContent = 'Restauração cancelada. Suas configurações foram mantidas.';
      });
    }

    saveWelcomeSettings() {
      try {
        localStorage.setItem('AssistenteLive.welcomeEnabled.v1', String(this.welcomeEnabled.checked));
        localStorage.setItem('AssistenteLive.welcomeMessage.v1', this.welcomeMessage.value.slice(0, 350));
        this.status.textContent = 'Mensagem de boas-vindas salva neste OBS.';
      } catch {
        this.status.textContent = 'Não foi possível salvar a mensagem de boas-vindas neste OBS.';
      }
    }

    async export() {
      try {
        const settings = Object.fromEntries(KEYS.map(key => [key, localStorage.getItem(key)]));
        const documentData = { format: FORMAT, version: VERSION, exportedAt: new Date().toISOString(), settings };
        const json = JSON.stringify(documentData, null, 2);
        const filename = `AssistenteHall-configuracoes-${new Date().toISOString().slice(0, 10)}.json`;
        // OBS injects this object into its Browser Source. Its CEF save picker can
        // create a file but silently leave it empty, so use the copy fallback there.
        if (window.obsstudio) {
          this.showExportData(json, 'No OBS, o seletor pode criar um arquivo vazio. Copie o JSON e salve pelo Bloco de Notas.');
          return;
        }
        if (typeof window.showSaveFilePicker !== 'function') {
          this.showExportData(json);
          return;
        }
        let writable = null;
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: filename,
            types: [{ description: 'Arquivo de configurações JSON', accept: { 'application/json': ['.json'] } }]
          });
          writable = await handle.createWritable();
          await writable.write(json);
          await writable.close();
          const savedFile = await handle.getFile();
          if (savedFile.size !== new Blob([json]).size) {
            this.showExportData(json, 'O arquivo criado ficou vazio ou incompleto.');
            return;
          }
          this.status.textContent = 'Configurações salvas no local escolhido. O cache de masterizações não foi incluído.';
        } catch (error) {
          try { await writable?.abort(); } catch {}
          if (error.name === 'AbortError') {
            this.status.textContent = 'Exportação cancelada.';
            return;
          }
          this.showExportData(json, 'O OBS não conseguiu gravar o arquivo diretamente.');
        }
      } catch (error) {
        this.status.textContent = `Não foi possível exportar as configurações: ${error.message}`;
      }
    }

    showExportData(json, notice = '') {
      this.exportData.value = json;
      this.exportData.hidden = false;
      this.exportLabel.hidden = false;
      document.getElementById('copy-settings').hidden = false;
      this.copyExport();
      if (notice) this.status.textContent = `${notice} ${this.status.textContent}`;
    }

    copyExport() {
      this.exportData.focus();
      this.exportData.select();
      let copied = false;
      try { copied = document.execCommand('copy'); } catch { /* A seleção continua disponível para Ctrl+C. */ }
      this.status.textContent = copied
        ? 'JSON copiado. Cole no Bloco de Notas e salve como AssistenteHall-configuracoes.json.'
        : 'O JSON está selecionado. Pressione Ctrl+C, cole no Bloco de Notas e salve como AssistenteHall-configuracoes.json.';
    }

    importPastedSettings() {
      try {
        if (this.importData.value.length > 4 * 1024 * 1024) throw new Error('O texto é grande demais para importar (máximo de 4 MB).');
        const parsed = JSON.parse(this.importData.value);
        this.applyImportedSettings(parsed);
      } catch (error) {
        this.status.textContent = `Não foi possível importar o JSON colado: ${error.message}`;
      }
    }

    applyImportedSettings(parsed) {
      if (!isObject(parsed) || parsed.format !== FORMAT || parsed.version !== VERSION || !isObject(parsed.settings)) {
        throw new Error('Esse conteúdo não é uma exportação de configurações compatível do AssistenteHall.');
      }
      for (const key of KEYS) {
        const value = Object.prototype.hasOwnProperty.call(parsed.settings, key) ? parsed.settings[key] : null;
        if (!validStoredValue(key, value, this.selector)) throw new Error(`Valor inválido na configuração “${key}”.`);
      }
      for (const [key, value] of Object.entries(parsed.settings)) {
        if (KEYS.includes(key) && value !== null) localStorage.setItem(key, value);
        else if (KEYS.includes(key)) localStorage.removeItem(key);
      }
      this.status.textContent = 'Configurações importadas. Recarregando o AssistenteHall…';
      setTimeout(() => window.location.reload(), 350);
    }

    restoreDefaults() {
      this.restoreConfirmation.hidden = false;
      this.status.textContent = 'Confirme a restauração abaixo. Suas preferências ainda não foram alteradas.';
      this.confirmRestoreButton.focus();
    }

    confirmRestoreDefaults() {
      try {
        for (const key of KEYS) localStorage.removeItem(key);
        this.restoreConfirmation.hidden = true;
        this.status.textContent = 'Configurações restauradas para o padrão. Cache e histórico preservados; recarregando…';
        setTimeout(() => window.location.reload(), 350);
      } catch (error) {
        this.status.textContent = `Não foi possível restaurar os padrões: ${error.message}`;
      }
    }
  };
})();
