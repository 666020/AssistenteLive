(() => {
  'use strict';
  const app = window.AssistenteLive;
  const STORAGE_KEY = 'AssistenteLive.merlinSettings.v1';
  const MEMBER_IMAGE_CACHE_KEY = 'AssistenteLive.hallMemberImageVersion.v1';
  const CUSTOM_SOUND_MAX_BYTES = 650 * 1024;
  const SOUND_TYPES = new Set(['magic', 'arcade', 'coin', 'soft', 'custom']);
  const SOUND_CATEGORIES = ['masterizations', 'announcements', 'localAnnouncements'];
  const defaultSoundSettings = () => Object.fromEntries(SOUND_CATEGORIES.map(category => [category, {
    enabled: false, type: 'magic', volume: 35, customSoundData: '', customSoundName: ''
  }]));
  let memberImageVersion = '1';
  let announcementAudioContext = null;
  let customSoundPlayer = null;
  const DEFAULTS = {
    template: '{Evento} {Membro} platinou\n{Jogo} ({Console})\nem {Tempo}',
    timeFormat: 'dhm',
    historyPolicy: 'new-only',
    showGameImage: true,
    showMemberImage: true,
    memberPosition: 'left',
    gamePosition: 'right',
    imageSize: 'auto',
    memberImageShape: 'circle',
    bubbleWidth: '1000',
    fontSize: 'medium',
    fontFamily: 'trebuchet',
    bubbleColor: '#fffdf5',
    readingSeconds: 12,
    soundSettings: defaultSoundSettings(),
    consoleNames: {},
    memberNames: {}
  };
  const EMPTY_PREVIEW = { Membro: '', Jogo: '', Console: '', Tempo: '', Evento: '', raUser: '', image: '' };
  const TIME_FORMATS = new Set(['human', 'dhm', 'hms', 'seconds']);
  const HISTORY_POLICIES = new Set(['new-only', 'unannounced']);
  const IMAGE_POSITIONS = new Set(['left', 'right']);
  const IMAGE_SIZES = new Set(['small', 'medium', 'large', 'auto']);
  const BUBBLE_WIDTHS = new Set(['auto', '480', '640', '800', '1000']);
  const MEMBER_IMAGE_SHAPES = new Set(['square', 'circle']);
  const FONT_SIZES = new Set(['small', 'medium', 'large', 'xlarge']);
  const FONT_FAMILIES = new Set(['arial', 'verdana', 'trebuchet', 'georgia', 'courier']);

  function formatTime(seconds, format) {
    if (seconds == null || String(seconds).trim() === '') return 'tempo não informado';
    const total = Number(seconds);
    if (!Number.isSafeInteger(total) || total < 0) return 'tempo não informado';
    if (format === 'seconds') return `${total.toLocaleString('pt-BR')} segundos`;
    if (format === 'dhm') {
      const days = Math.floor(total / 86400);
      const hoursInDay = Math.floor((total % 86400) / 3600);
      const minutesInHour = Math.floor((total % 3600) / 60);
      const hourText = `${hoursInDay} hora${hoursInDay === 1 ? '' : 's'}`;
      const minuteText = `${minutesInHour} minuto${minutesInHour === 1 ? '' : 's'}`;
      if (days) return `${days} dia${days === 1 ? '' : 's'}, ${hourText} e ${minuteText}`;
      return `${hourText} e ${minuteText}`;
    }
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    const remainingSeconds = total % 60;
    if (format === 'hms') return `${hours}h ${minutes}min ${remainingSeconds}s`;
    if (hours && minutes) return `${hours} horas e ${minutes} minutos`;
    if (hours) return `${hours} horas`;
    if (minutes) return `${minutes} minutos`;
    return `${remainingSeconds} segundos`;
  }

  function render(template, data, timeFormat) {
    return String(template || '').replace(/\{(Membro|Jogo|Console|Tempo|Evento)\}/g, (_match, key) => {
      if (key === 'Tempo') return formatTime(data.Tempo, timeFormat);
      return String(data[key] ?? '');
    }).trim();
  }

  function hallMemberPicture(imageUrl) {
    const value = String(imageUrl || '').trim();
    if (!value) return '';
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
      try { memberImageVersion = localStorage.getItem(MEMBER_IMAGE_CACHE_KEY) || memberImageVersion; } catch {}
      url.searchParams.set('v', memberImageVersion);
      return url.href;
    } catch { return ''; }
  }

  function invalidateHallMemberImageCache() {
    memberImageVersion = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    try { localStorage.setItem(MEMBER_IMAGE_CACHE_KEY, memberImageVersion); } catch {}
  }

  function prepareAnnouncementAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return Promise.resolve(false);
    try {
      announcementAudioContext ||= new AudioContextClass();
      return announcementAudioContext.state === 'suspended'
        ? announcementAudioContext.resume().then(() => true).catch(() => false)
        : Promise.resolve(true);
    } catch { return Promise.resolve(false); }
  }

  async function playAnnouncementSound(category = 'masterizations', force = false) {
    const settings = app.merlinSettings?.value;
    const sound = settings?.soundSettings?.[category] || DEFAULTS.soundSettings[category];
    if (!sound || (!force && !sound.enabled)) return;
    const volume = Math.max(0, Math.min(100, Number(sound.volume ?? 35))) / 100;
    if (!volume) return;
    if (sound.type === 'custom') {
      if (!sound.customSoundData) return;
      try {
        customSoundPlayer?.pause();
        customSoundPlayer = new Audio(sound.customSoundData);
        customSoundPlayer.volume = volume;
        void customSoundPlayer.play().catch(() => {});
      } catch {}
      return;
    }
    if (!(await prepareAnnouncementAudio()) || !announcementAudioContext) return;
    const context = announcementAudioContext;
    const start = context.currentTime + 0.015;
    const presets = {
      magic: { wave: 'sine', notes: [[0, 659.25, 0.24], [0.09, 783.99, 0.24], [0.18, 1046.5, 0.28]] },
      arcade: { wave: 'square', notes: [[0, 523.25, 0.1], [0.08, 659.25, 0.1], [0.16, 783.99, 0.1], [0.24, 1046.5, 0.16]] },
      coin: { wave: 'triangle', notes: [[0, 987.77, 0.13], [0.07, 1318.51, 0.13], [0.14, 1760, 0.2]] },
      soft: { wave: 'sine', notes: [[0, 523.25, 0.25], [0.14, 659.25, 0.32]] }
    };
    const preset = presets[sound.type] || presets.magic;
    for (const [offset, frequency, duration] of preset.notes) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = preset.wave;
      oscillator.frequency.setValueAtTime(frequency, start + offset);
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * (preset.wave === 'square' ? 0.12 : 0.3)), start + offset + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + duration);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(start + offset); oscillator.stop(start + offset + duration + 0.01);
    }
  }

  app.merlinMessage = { formatTime, render, invalidateHallMemberImageCache };
  app.prepareAnnouncementAudio = prepareAnnouncementAudio;
  app.playAnnouncementSound = playAnnouncementSound;
  app.MerlinSettings = class {
    constructor() {
      this.template = document.getElementById('merlin-template');
      this.readingTimeInput = document.getElementById('merlin-reading-seconds');
      this.soundCards = new Map([...document.querySelectorAll('[data-sound-category]')].map(card => [card.dataset.soundCategory, card]));
      this.timeFormats = [...document.querySelectorAll('input[name="merlin-time-format"]')];
      this.historyPolicies = [...document.querySelectorAll('input[name="merlin-history-policy"]')];
      this.memberPositions = [...document.querySelectorAll('input[name="merlin-member-position"]')];
      this.gamePositions = [...document.querySelectorAll('input[name="merlin-game-position"]')];
      this.imageSizes = [...document.querySelectorAll('input[name="merlin-image-size"]')];
      this.bubbleWidths = [...document.querySelectorAll('input[name="merlin-bubble-width"]')];
      this.memberImageShapes = [...document.querySelectorAll('input[name="merlin-member-image-shape"]')];
      this.fontSizes = [...document.querySelectorAll('input[name="merlin-font-size"]')];
      this.fontFamilies = [...document.querySelectorAll('input[name="merlin-font-family"]')];
      this.consoleList = document.getElementById('console-name-list');
      this.availableConsoles = null;
      this.memberList = document.getElementById('member-name-list');
      this.availableMembers = null;
      this.showGameImage = document.getElementById('merlin-show-game-image');
      this.showMemberImage = document.getElementById('merlin-show-member-image');
      this.preview = document.getElementById('merlin-template-preview');
      this.previewBubble = document.getElementById('merlin-preview-bubble');
      this.bubbleColorPicker = document.getElementById('merlin-bubble-color-picker');
      this.bubbleColorHex = document.getElementById('merlin-bubble-color-hex');
      this.bubbleColorReset = document.getElementById('merlin-bubble-color-reset');
      this.bubbleColorSwatches = [...document.querySelectorAll('[data-bubble-color]')];
      this.previewControl = document.getElementById('merlin-preview');
      this.status = document.getElementById('merlin-settings-status');
      this.previewIndex = -1;
      this.previewRecords = [];
      this.announcementPreviewRecords = [];
      this.previewRecord = EMPTY_PREVIEW;
      this.previewKey = '';
      this.value = this.load();
      this.template.value = this.value.template;
      this.readingTimeInput.value = String(this.value.readingSeconds);
      for (const category of SOUND_CATEGORIES) this.syncSoundCard(category);
      for (const option of this.timeFormats) option.checked = option.value === this.value.timeFormat;
      for (const option of this.historyPolicies) option.checked = option.value === this.value.historyPolicy;
      for (const option of this.memberPositions) option.checked = option.value === this.value.memberPosition;
      for (const option of this.gamePositions) option.checked = option.value === this.value.gamePosition;
      for (const option of this.imageSizes) option.checked = option.value === this.value.imageSize;
      for (const option of this.bubbleWidths) option.checked = option.value === this.value.bubbleWidth;
      for (const option of this.memberImageShapes) option.checked = option.value === this.value.memberImageShape;
      for (const option of this.fontSizes) option.checked = option.value === this.value.fontSize;
      for (const option of this.fontFamilies) option.checked = option.value === this.value.fontFamily;
      this.showGameImage.checked = this.value.showGameImage;
      this.showMemberImage.checked = this.value.showMemberImage;
      this.bubbleColorPicker.value = this.value.bubbleColor;
      this.bubbleColorHex.value = this.value.bubbleColor;
      this.bubbleColorPicker.addEventListener('input', () => {
        this.bubbleColorHex.value = this.bubbleColorPicker.value;
        this.save({ refreshPanels: false });
      });
      this.bubbleColorPicker.addEventListener('change', () => this.save());
      this.bubbleColorHex.addEventListener('change', () => {
        const color = this.normalizeBubbleColor(this.bubbleColorHex.value);
        if (!color) {
          this.bubbleColorHex.value = this.value.bubbleColor;
          this.status.textContent = 'Digite uma cor hexadecimal válida, como #d9c7ff.';
          return;
        }
        this.bubbleColorPicker.value = color;
        this.save();
      });
      this.bubbleColorReset.addEventListener('click', () => {
        this.bubbleColorPicker.value = DEFAULTS.bubbleColor;
        this.bubbleColorHex.value = DEFAULTS.bubbleColor;
        this.save();
      });
      for (const swatch of this.bubbleColorSwatches) swatch.addEventListener('click', () => {
        const color = this.normalizeBubbleColor(swatch.dataset.bubbleColor);
        if (!color) return;
        this.bubbleColorPicker.value = color;
        this.bubbleColorHex.value = color;
        this.save();
      });
      this.template.addEventListener('input', () => this.save());
      this.readingTimeInput.addEventListener('change', () => this.save());
      for (const [category, card] of this.soundCards) {
        const enabled = card.querySelector('[data-sound-enabled]');
        const types = [...card.querySelectorAll('input[type="radio"]')];
        const volume = card.querySelector('[data-sound-volume]');
        const output = card.querySelector('[data-sound-volume-value]');
        const file = card.querySelector('[data-sound-file]');
        enabled.addEventListener('change', () => { this.save({ refreshPanels: false }); if (enabled.checked) void prepareAnnouncementAudio(); });
        for (const option of types) option.addEventListener('change', () => this.save({ refreshPanels: false }));
        card.querySelector('[data-sound-choose]').addEventListener('click', () => file.click());
        file.addEventListener('change', () => this.loadCustomSound(category));
        card.querySelector('[data-sound-remove]').addEventListener('click', () => {
          const sound = this.value.soundSettings[category];
          sound.customSoundData = ''; sound.customSoundName = '';
          if (this.selected(types) === 'custom') types.find(option => option.value === 'magic').checked = true;
          this.syncSoundCard(category); this.save({ refreshPanels: false });
        });
        volume.addEventListener('input', () => { output.value = `${volume.value}%`; output.textContent = `${volume.value}%`; this.save({ refreshPanels: false }); });
        card.querySelector('[data-sound-test]').addEventListener('click', () => { void playAnnouncementSound(category, true); });
      }
      for (const option of [...this.timeFormats, ...this.historyPolicies, ...this.memberPositions, ...this.gamePositions, ...this.imageSizes, ...this.bubbleWidths, ...this.memberImageShapes, ...this.fontSizes, ...this.fontFamilies, this.showGameImage, this.showMemberImage]) option.addEventListener('change', () => this.save());
      this.previewControl.addEventListener('click', () => this.nextPreview());
      this.previewControl.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault(); this.nextPreview();
      });
      this.refreshPreview();
    }
    load() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const savedTemplate = typeof saved.template === 'string' ? saved.template : DEFAULTS.template;
        const legacySoundType = SOUND_TYPES.has(saved.soundType) ? saved.soundType : DEFAULTS.soundType;
        const legacySoundData = typeof saved.customSoundData === 'string' && saved.customSoundData.startsWith('data:audio/') && saved.customSoundData.length <= 940000 ? saved.customSoundData : '';
        const soundSettings = Object.fromEntries(SOUND_CATEGORIES.map(category => {
          const item = saved.soundSettings?.[category];
          if (item && typeof item === 'object' && !Array.isArray(item)) return [category, {
            enabled: typeof item.enabled === 'boolean' ? item.enabled : false,
            type: SOUND_TYPES.has(item.type) && (item.type !== 'custom' || (typeof item.customSoundData === 'string' && item.customSoundData.startsWith('data:audio/') && item.customSoundData.length <= 940000)) ? item.type : 'magic',
            volume: Number.isInteger(item.volume) && item.volume >= 0 && item.volume <= 100 ? item.volume : 35,
            customSoundData: typeof item.customSoundData === 'string' && item.customSoundData.startsWith('data:audio/') && item.customSoundData.length <= 940000 ? item.customSoundData : '',
            customSoundName: typeof item.customSoundName === 'string' ? item.customSoundName.slice(0, 120) : ''
          }];
          const enabled = typeof saved.soundCategories?.[category] === 'boolean' ? saved.soundCategories[category] : saved.soundEnabled === true;
          return [category, {
            enabled,
            type: legacySoundType === 'custom' && !legacySoundData ? 'magic' : legacySoundType,
            volume: Number.isInteger(saved.soundVolume) && saved.soundVolume >= 0 && saved.soundVolume <= 100 ? saved.soundVolume : 35,
            customSoundData: legacySoundData,
            customSoundName: typeof saved.customSoundName === 'string' ? saved.customSoundName.slice(0, 120) : ''
          }];
        }));
        return {
          template: /\{(?:RA|Origem|Data)\}/.test(savedTemplate) ? DEFAULTS.template : savedTemplate.slice(0, 500),
          timeFormat: TIME_FORMATS.has(saved.timeFormat) ? saved.timeFormat : DEFAULTS.timeFormat,
          historyPolicy: HISTORY_POLICIES.has(saved.historyPolicy) ? saved.historyPolicy : DEFAULTS.historyPolicy,
          showGameImage: typeof saved.showGameImage === 'boolean' ? saved.showGameImage : DEFAULTS.showGameImage,
          showMemberImage: typeof saved.showMemberImage === 'boolean' ? saved.showMemberImage : DEFAULTS.showMemberImage,
          memberPosition: IMAGE_POSITIONS.has(saved.memberPosition) ? saved.memberPosition : IMAGE_POSITIONS.has(saved.imagePosition) ? saved.imagePosition : DEFAULTS.memberPosition,
          gamePosition: IMAGE_POSITIONS.has(saved.gamePosition) ? saved.gamePosition : IMAGE_POSITIONS.has(saved.imagePosition) ? saved.imagePosition : DEFAULTS.gamePosition,
          imageSize: IMAGE_SIZES.has(saved.imageSize) ? saved.imageSize : DEFAULTS.imageSize,
          memberImageShape: MEMBER_IMAGE_SHAPES.has(saved.memberImageShape) ? saved.memberImageShape : DEFAULTS.memberImageShape,
          bubbleWidth: BUBBLE_WIDTHS.has(String(saved.bubbleWidth)) ? String(saved.bubbleWidth) : DEFAULTS.bubbleWidth,
          fontSize: FONT_SIZES.has(saved.fontSize) ? saved.fontSize : DEFAULTS.fontSize,
          fontFamily: FONT_FAMILIES.has(saved.fontFamily) ? saved.fontFamily : DEFAULTS.fontFamily,
          bubbleColor: this.normalizeBubbleColor(saved.bubbleColor) || DEFAULTS.bubbleColor,
          readingSeconds: Number.isInteger(saved.readingSeconds) && saved.readingSeconds >= 3 && saved.readingSeconds <= 120 ? saved.readingSeconds : DEFAULTS.readingSeconds,
          soundSettings,
          consoleNames: saved.consoleNames && typeof saved.consoleNames === 'object' && !Array.isArray(saved.consoleNames)
            ? Object.fromEntries(Object.entries(saved.consoleNames).filter(([key, value]) => typeof key === 'string' && typeof value === 'string').map(([key, value]) => [key.slice(0, 100), value.slice(0, 100)]))
            : {},
          memberNames: saved.memberNames && typeof saved.memberNames === 'object' && !Array.isArray(saved.memberNames)
            ? Object.fromEntries(Object.entries(saved.memberNames).filter(([key, value]) => typeof key === 'string' && typeof value === 'string').map(([key, value]) => [key.slice(0, 100), value.slice(0, 100)]))
            : {}
        };
      } catch {
        this.status.textContent = 'Não foi possível ler as preferências salvas neste navegador.';
        return { ...DEFAULTS, soundSettings: defaultSoundSettings() };
      }
    }
    save({ refreshPanels = true } = {}) {
      const soundSettings = Object.fromEntries(SOUND_CATEGORIES.map(category => {
        const card = this.soundCards.get(category);
        const previous = this.value.soundSettings[category];
        return [category, {
          enabled: card.querySelector('[data-sound-enabled]').checked,
          type: SOUND_TYPES.has(this.selected([...card.querySelectorAll('input[type="radio"]')])) ? this.selected([...card.querySelectorAll('input[type="radio"]')]) : 'magic',
          volume: Math.max(0, Math.min(100, Number(card.querySelector('[data-sound-volume]').value) || 0)),
          customSoundData: previous.customSoundData || '',
          customSoundName: previous.customSoundName || ''
        }];
      }));
      this.value = {
        template: this.template.value.slice(0, 500),
        timeFormat: TIME_FORMATS.has(this.selected(this.timeFormats)) ? this.selected(this.timeFormats) : DEFAULTS.timeFormat,
        historyPolicy: HISTORY_POLICIES.has(this.selected(this.historyPolicies)) ? this.selected(this.historyPolicies) : DEFAULTS.historyPolicy,
        showGameImage: this.showGameImage.checked,
        showMemberImage: this.showMemberImage.checked,
        memberPosition: IMAGE_POSITIONS.has(this.selected(this.memberPositions)) ? this.selected(this.memberPositions) : DEFAULTS.memberPosition,
        gamePosition: IMAGE_POSITIONS.has(this.selected(this.gamePositions)) ? this.selected(this.gamePositions) : DEFAULTS.gamePosition,
        imageSize: IMAGE_SIZES.has(this.selected(this.imageSizes)) ? this.selected(this.imageSizes) : DEFAULTS.imageSize,
        memberImageShape: MEMBER_IMAGE_SHAPES.has(this.selected(this.memberImageShapes)) ? this.selected(this.memberImageShapes) : DEFAULTS.memberImageShape,
        bubbleWidth: BUBBLE_WIDTHS.has(this.selected(this.bubbleWidths)) ? this.selected(this.bubbleWidths) : DEFAULTS.bubbleWidth,
        fontSize: FONT_SIZES.has(this.selected(this.fontSizes)) ? this.selected(this.fontSizes) : DEFAULTS.fontSize,
        fontFamily: FONT_FAMILIES.has(this.selected(this.fontFamilies)) ? this.selected(this.fontFamilies) : DEFAULTS.fontFamily,
        bubbleColor: this.normalizeBubbleColor(this.bubbleColorHex.value) || this.value.bubbleColor || DEFAULTS.bubbleColor,
        readingSeconds: Number.isInteger(Number(this.readingTimeInput.value)) && Number(this.readingTimeInput.value) >= 3 && Number(this.readingTimeInput.value) <= 120
          ? Number(this.readingTimeInput.value) : this.value.readingSeconds || DEFAULTS.readingSeconds,
        soundSettings,
        consoleNames: this.value.consoleNames || {},
        memberNames: this.value.memberNames || {}
      };
      try {
        this.readingTimeInput.value = String(this.value.readingSeconds);
        this.bubbleColorPicker.value = this.value.bubbleColor;
        this.bubbleColorHex.value = this.value.bubbleColor;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.value));
        this.status.textContent = 'Preferências salvas neste OBS.';
      } catch {
        this.status.textContent = 'Preferências aplicadas, mas não foi possível salvá-las neste navegador.';
      }
      this.refreshPreview();
      if (refreshPanels) {
        app.eventsPanel?.renderEvents();
        this.selector.merlinPanel?.render();
      }
    }
    selected(options) { return options.find(option => option.checked)?.value || ''; }
    normalizeBubbleColor(value) { return /^#[0-9a-f]{6}$/i.test(String(value || '').trim()) ? String(value).trim().toLowerCase() : ''; }
    applyBubbleColor(element, color = this.value.bubbleColor) {
      const normalized = this.normalizeBubbleColor(color) || DEFAULTS.bubbleColor;
      const channels = normalized.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255).map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
      const luminance = 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
      element.style.setProperty('--bubble-background', normalized);
      element.style.setProperty('--bubble-foreground', luminance > 0.42 ? '#25202d' : '#fffdf5');
    }
    syncSoundCard(category) {
      const card = this.soundCards.get(category);
      const sound = this.value.soundSettings[category];
      card.querySelector('[data-sound-enabled]').checked = Boolean(sound.enabled);
      const types = [...card.querySelectorAll('input[type="radio"]')];
      for (const option of types) option.checked = option.value === sound.type;
      types.find(option => option.value === 'custom').disabled = !sound.customSoundData;
      card.querySelector('[data-sound-remove]').disabled = !sound.customSoundData;
      const name = card.querySelector('[data-sound-name]');
      name.textContent = sound.customSoundName || 'Nenhum arquivo personalizado carregado. Máximo: 650 KB.';
      const volume = card.querySelector('[data-sound-volume]');
      const output = card.querySelector('[data-sound-volume-value]');
      volume.value = String(sound.volume);
      output.value = `${sound.volume}%`; output.textContent = `${sound.volume}%`;
    }
    loadCustomSound(category) {
      const card = this.soundCards.get(category);
      const fileInput = card.querySelector('[data-sound-file]');
      const file = fileInput.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('audio/') || file.size > CUSTOM_SOUND_MAX_BYTES) {
        this.status.textContent = 'Escolha um arquivo de áudio de até 650 KB.';
        fileInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const data = String(reader.result || '');
        if (!data.startsWith('data:audio/') || data.length > 940000) {
          this.status.textContent = 'Não foi possível carregar esse áudio. Tente um arquivo menor.';
          return;
        }
        const sound = this.value.soundSettings[category];
        sound.customSoundData = data;
        sound.customSoundName = file.name.slice(0, 120);
        const types = [...card.querySelectorAll('input[type="radio"]')];
        types.find(option => option.value === 'custom').checked = true;
        this.syncSoundCard(category);
        this.save({ refreshPanels: false });
        this.status.textContent = `Som personalizado carregado: ${file.name}. Use “Testar som” para ouvir.`;
      });
      reader.addEventListener('error', () => { this.status.textContent = 'Não consegui ler esse arquivo de áudio.'; });
      reader.readAsDataURL(file);
    }
    consoleName(value) {
      const original = String(value || '').trim();
      return String(this.value.consoleNames?.[original] || '').trim() || original;
    }
    memberName(memberId, original) {
      const custom = String(this.value.memberNames?.[String(memberId || '')] || '').trim();
      return custom.replace(/\*/g, '').trim() || String(original || '').trim();
    }
    isMemberHidden(memberId) {
      return String(this.value.memberNames?.[String(memberId || '')] || '').includes('*');
    }
    setAvailableConsoles(values) {
      const consoles = [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
      if (Array.isArray(this.availableConsoles) && consoles.length === this.availableConsoles.length && consoles.every((name, index) => name === this.availableConsoles[index])) return;
      this.availableConsoles = consoles;
      const fragment = document.createDocumentFragment();
      if (!this.availableConsoles.length) {
        const empty = document.createElement('p');
        empty.className = 'tab-description';
        empty.textContent = 'Os consoles aparecem aqui depois que o Merlin carregar o catálogo do Hall.';
        fragment.append(empty);
      }
      for (const consoleName of this.availableConsoles) {
        const label = document.createElement('label');
        label.className = 'console-name-row';
        const caption = document.createElement('span');
        caption.textContent = consoleName;
        const input = document.createElement('input');
        input.type = 'text'; input.maxLength = 100; input.value = this.value.consoleNames[consoleName] || '';
        input.placeholder = consoleName; input.setAttribute('aria-label', `Nome exibido para ${consoleName}`);
        input.addEventListener('input', () => {
          this.value.consoleNames[consoleName] = input.value.slice(0, 100);
          this.save({ refreshPanels: false });
          app.merlinPanel?.refreshNamePreviews();
        });
        label.append(caption, input); fragment.append(label);
      }
      this.consoleList.replaceChildren(fragment);
      this.refreshPreview();
    }
    setAvailableMembers(values) {
      const members = [...new Map(values.map(value => [String(value.memberId || ''), { id: String(value.memberId || ''), name: String(value.member || '').trim() }]).filter(([id, member]) => id && member.name)).values()]
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      if (Array.isArray(this.availableMembers) && members.length === this.availableMembers.length && members.every((member, index) => member.id === this.availableMembers[index].id && member.name === this.availableMembers[index].name)) return;
      this.availableMembers = members;
      const fragment = document.createDocumentFragment();
      if (!members.length) {
        const empty = document.createElement('p'); empty.className = 'tab-description';
        empty.textContent = 'Os membros aparecem aqui depois da primeira coleta da planilha.'; fragment.append(empty);
      }
      for (const member of members) {
        const label = document.createElement('label'); label.className = 'console-name-row';
        const caption = document.createElement('span'); caption.textContent = member.name;
        const input = document.createElement('input'); input.type = 'text'; input.maxLength = 100;
        input.value = this.value.memberNames[member.id] || ''; input.placeholder = member.name;
        input.setAttribute('aria-label', `Nome personalizado ou * para ocultar ${member.name}`);
        input.addEventListener('input', () => {
          const wasHidden = this.isMemberHidden(member.id);
          this.value.memberNames[member.id] = input.value.slice(0, 100);
          this.save({ refreshPanels: false });
          if (wasHidden !== this.isMemberHidden(member.id)) app.merlinPanel?.render();
          else app.merlinPanel?.refreshNamePreviews({ memberId: member.id });
        });
        label.append(caption, input); fragment.append(label);
      }
      this.memberList.replaceChildren(fragment);
      this.refreshPreview();
    }
    imageOptions(record = this.previewRecord) {
      const images = [];
      if (this.value.showMemberImage) {
        const url = hallMemberPicture(record.memberImage);
        if (url) images.push({ url, type: 'member', position: this.value.memberPosition, alt: `Foto de ${record.member || record.Membro || ''}`.trim() });
      }
      if (this.value.showGameImage && (record.gameImage || record.image)) images.push({ url: record.gameImage || record.image, type: 'game', position: this.value.gamePosition, alt: `Capa de ${record.game || record.Jogo || ''}`.trim() });
      return images;
    }
    imageLayout() { return { size: this.value.imageSize, memberShape: this.value.memberImageShape, bubbleWidth: this.value.bubbleWidth, fontSize: this.value.fontSize, fontFamily: this.value.fontFamily, bubbleColor: this.value.bubbleColor }; }
    setPreviewRecords(records) {
      const previousKey = this.previewKey;
      const masteryRecords = records.filter(record => !this.isMemberHidden(record.memberId)).map(record => ({
        key: record.key, memberId: record.memberId || '', member: record.member || '', Membro: this.memberName(record.memberId, record.member), Jogo: record.game || '', Console: record.console || '',
        console: record.console || '', Tempo: record.time ?? '', Evento: record.activity || '', raUser: record.raUser || '', memberImage: record.memberImage || '', image: record.image || ''
      }));
      this.previewRecords = [...masteryRecords, ...this.announcementPreviewRecords];
      if (!this.previewRecords.length) {
        this.previewIndex = -1; this.previewKey = ''; this.previewRecord = EMPTY_PREVIEW;
      } else {
        this.previewIndex = Math.max(0, this.previewRecords.findIndex(record => record.key === previousKey));
        this.previewRecord = this.previewRecords[this.previewIndex];
        this.previewKey = this.previewRecord.key;
      }
      this.refreshPreview();
    }
    setAnnouncementPreviewRecords(events) {
      const previousKey = this.previewKey;
      this.announcementPreviewRecords = events.map(event => ({
        key: `announcement:${event.source || ''}:${event.title}:${event.message}`,
        announcement: true, title: event.title || '', message: event.message || '', image: event.imageUrl || event.imageUrls?.[0] || '', imageUrls: event.imageUrls || [],
        Membro: '', Jogo: event.title || '', Console: '', Tempo: '', Evento: ''
      }));
      const masteryRecords = this.previewRecords.filter(record => !record.announcement);
      this.previewRecords = [...masteryRecords, ...this.announcementPreviewRecords];
      if (this.previewRecords.length) {
        const nextIndex = this.previewRecords.findIndex(record => record.key === previousKey);
        this.previewIndex = nextIndex >= 0 ? nextIndex : 0;
        this.previewRecord = this.previewRecords[this.previewIndex];
        this.previewKey = this.previewRecord.key;
      } else { this.previewIndex = -1; this.previewRecord = EMPTY_PREVIEW; this.previewKey = ''; }
      this.refreshPreview();
    }
    nextPreview() {
      if (this.previewRecords.length < 2) return;
      let next = this.previewIndex;
      while (next === this.previewIndex) next = Math.floor(Math.random() * this.previewRecords.length);
      this.previewIndex = next;
      this.previewRecord = this.previewRecords[next];
      this.previewKey = this.previewRecord.key;
      this.refreshPreview();
    }
    refreshPreview() {
      this.applyBubbleColor(this.previewBubble);
      this.preview.textContent = this.previewRecords.length
        ? this.previewRecord.announcement
          ? `${this.previewRecord.title}\n${this.previewRecord.message}`
          : render(this.template.value, {
            ...this.previewRecord,
            Membro: this.memberName(this.previewRecord.memberId, this.previewRecord.member || this.previewRecord.Membro),
            Console: this.consoleName(this.previewRecord.console)
          }, this.selected(this.timeFormats) || DEFAULTS.timeFormat)
        : 'Aguardando masterizações da planilha…';
      this.previewBubble.classList.remove('image-size-small', 'image-size-medium', 'image-size-large', 'image-size-auto');
      this.previewBubble.classList.add(`image-size-${this.value.imageSize}`);
      this.previewBubble.classList.remove('message-width-auto', 'message-width-480', 'message-width-640', 'message-width-800', 'message-width-1000');
      this.previewBubble.classList.add(`message-width-${this.value.bubbleWidth}`);
      this.previewBubble.style.setProperty('--message-width', `${this.value.bubbleWidth === 'auto' ? 0 : this.value.bubbleWidth}px`);
      this.previewBubble.classList.remove('mastery-text-small', 'mastery-text-medium', 'mastery-text-large', 'mastery-text-xlarge');
      this.previewBubble.classList.add(`mastery-text-${this.value.fontSize}`);
      this.previewBubble.classList.remove('message-font-arial', 'message-font-verdana', 'message-font-trebuchet', 'message-font-georgia', 'message-font-courier');
      this.previewBubble.classList.add(`message-font-${this.value.fontFamily}`);
      this.previewBubble.classList.remove('member-image-shape-square', 'member-image-shape-circle');
      this.previewBubble.classList.add(`member-image-shape-${this.value.memberImageShape}`);
      const images = (this.previewRecord.announcement
        ? this.value.showGameImage && this.previewRecord.image
          ? [{ url: this.previewRecord.image, urls: this.previewRecord.imageUrls, type: 'game', position: this.eventImagePosition(), alt: `Imagem de ${this.previewRecord.title}` }]
          : []
        : this.imageOptions(this.previewRecord)).map(spec => {
        const image = document.createElement('img');
        image.src = spec.url; image.alt = spec.alt;
        image.className = `event-image ${spec.type}-image image-${spec.position}`;
        image.referrerPolicy = 'no-referrer';
        if (spec.urls?.length) {
          let sourceIndex = spec.urls.indexOf(spec.url);
          if (sourceIndex < 0) sourceIndex = 0;
          image.addEventListener('error', () => { if (++sourceIndex < spec.urls.length) image.src = spec.urls[sourceIndex]; else image.remove(); });
        } else image.addEventListener('error', () => image.remove(), { once: true });
        return image;
      });
      this.previewBubble.replaceChildren(...images, this.preview);
      if (this.value.imageSize === 'auto') {
        app.fitImagesToText(this.previewBubble, this.preview);
      }
    }
    eventImagePosition() {
      try { return localStorage.getItem('AssistenteLive.eventImagePosition.v1') === 'right' ? 'right' : 'left'; } catch { return 'left'; }
    }
  };
  app.merlinMessage = { ...app.merlinMessage, hallMemberPicture };
})();
