/* Leitura pública e somente leitura. Sem chaves, cookies ou código da planilha. */
(() => {
  'use strict';
  const app = window.AssistenteLive;
  app.parseCSV = function (input) {
    if (input.length > 500000) throw new Error('Planilha grande demais para este teste.');
    const text = input.replace(/^\uFEFF/, '');
    if (/^\s*</.test(text)) throw new Error('O Google retornou uma página de acesso, não os eventos.');
    const rows = []; let row = [], field = '', quoted = false, closed = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (quoted) {
        if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (ch === '"') { quoted = false; closed = true; }
        else field += ch;
      } else if (ch === ',' || ch === '\n' || ch === '\r') {
        row.push(field); field = ''; closed = false;
        if (ch !== ',') { rows.push(row); row = []; if (ch === '\r' && text[i + 1] === '\n') i++; }
      } else if (ch === '"' && !field && !closed) quoted = true;
      else { if (closed || ch === '"') throw new Error('CSV inválido.'); field += ch; }
    }
    if (quoted) throw new Error('CSV incompleto. Tente carregar novamente.');
    if (field || row.length || closed) { row.push(field); rows.push(row); }
    return rows;
  };
  app.eventDate = function (value) {
    if (!value.trim()) return null;
    const br = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value.trim());
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!br && !iso) throw new Error('Use datas no formato dd/mm/aaaa, sem horário.');
    const [y, m, d] = br ? [+br[3], +br[2], +br[1]] : [+iso[1], +iso[2], +iso[3]];
    const date = new Date(Date.UTC(y, m - 1, d));
    if (y < 1900 || date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) throw new Error('Data inexistente: ' + value);
    return y * 10000 + m * 100 + d;
  };
  app.eventTime = function (value) {
    if (!value.trim()) return null;
    const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(value.trim());
    if (!match || +match[1] > 23 || +match[2] > 59 || +(match[3] || 0) > 59) throw new Error('Hora fim inválida. Use HH:mm, de 00:00 a 23:59.');
    return +match[1] * 3600 + +match[2] * 60 + +(match[3] || 0);
  };
  app.eventInWindow = function (event, now = new Date()) {
    const parts = new Intl.DateTimeFormat('en', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    const part = key => Number(parts.find(p => p.type === key).value);
    const day = part('year') * 10000 + part('month') * 100 + part('day');
    if (event.startDate && day < event.startDate || event.endDate && day > event.endDate) return false;
    if (event.endDate === day && event.endTime != null) {
      return part('hour') * 3600 + part('minute') * 60 + part('second') < event.endTime;
    }
    return true;
  };
  app.readEvents = function (csv, now = new Date()) {
    const rows = app.parseCSV(csv);
    const normalize = text => text.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const headers = (rows.shift() || []).map(normalize);
    const columns = ['titulo', 'mensagem'].map(key => {
      if (headers.filter(header => header === key).length !== 1) throw new Error('Cabeçalhos esperados: Título e Mensagem.');
      return headers.indexOf(key);
    });
    const active = [];
    for (const name of ['inicio', 'fim', 'hora fim', 'imagem']) if (headers.filter(h => h === name).length > 1) throw new Error('Coluna repetida: ' + name);
    for (const [index, row] of rows.entries()) {
      const line = index + 2;
      const [title, message] = columns.map(index => (row[index] || '').trim());
      if (!title && !message) continue;
      if (!title || !message) throw new Error(`Linha ${line}: mensagem sem título ou texto.`);
      if (title.length > 100 || message.length > 350) throw new Error('Para este teste, use títulos até 100 caracteres e mensagens até 350.');
      const startText = (row[headers.indexOf('inicio')] || '').trim();
      const endText = (row[headers.indexOf('fim')] || '').trim();
      const timeText = (row[headers.indexOf('hora fim')] || '').trim();
      let startDate, endDate, endTime;
      try { startDate = app.eventDate(startText); endDate = app.eventDate(endText); endTime = app.eventTime(timeText); }
      catch (error) { throw new Error(`Linha ${line}: ${error.message}`); }
      if (startDate && endDate && endDate < startDate) throw new Error(`Linha ${line}: Fim deve ser igual ou posterior ao Início.`);
      if (endTime != null && !endDate) throw new Error(`Linha ${line}: preencha a data Fim ao usar Hora fim.`);
      const imageUrl = (row[headers.indexOf('imagem')] || '').trim();
      const event = { title, message, startDate, endDate, endTime, imageUrl };
      if (app.eventInWindow(event, now)) active.push(event);
    }
    return active;
  };
  app.loadEvents = async function (signal) {
    if (signal?.aborted) throw app.abortError();
    const config = app.eventsConfig;
    const url = new URL(`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/gviz/tq`);
    // Leia também colunas extras no caso de a aba ainda ter colunas antigas à direita.
    url.search = new URLSearchParams({ tqx: 'out:csv', gid: config.gid, range: 'A1:Z1000', headers: '1', t: String(Date.now()) }).toString();
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(url.href, { mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: controller.signal });
      if (!response.ok) throw new Error('Não foi possível ler a planilha (HTTP ' + response.status + ').');
      return app.readEvents(await response.text());
    } catch (error) {
      if (signal?.aborted) throw app.abortError();
      if (error.name === 'AbortError') throw new Error('A consulta demorou mais de 15 segundos. Tente novamente.');
      if (error instanceof TypeError) throw new Error('Não consegui ler a planilha. Confira a internet e se o link permite leitura sem login.');
      throw error;
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
  };
  app.readHallGeneralEvents = function (csv, links = []) {
    const rows = app.parseCSV(csv);
    const normalize = text => String(text || '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const headers = (rows.shift() || []).map(normalize);
    const index = (...names) => headers.findIndex(header => names.some(name => header === normalize(name)));
    const titleColumn = index('nome evento');
    const messageColumn = index('descricao', 'descrição');
    const imageColumn = index('badge evento');
    const bannerColumn = index('banner evento');
    const statusColumn = index('status');
    if ([titleColumn, messageColumn, imageColumn, statusColumn].some(column => column < 0)) {
      throw new Error('A aba Geral eventos precisa ter Nome evento, Badge evento, Descrição e Status.');
    }
    const urlFrom = value => /https?:\/\/[^\s"')]+/i.exec(String(value || ''))?.[0] || '';
    const compactUrlFrom = value => {
      const text = String(value || '').trim();
      const start = text.search(/https?:\/\//i);
      if (start < 0) return '';
      const candidate = text.slice(start).replace(/["'<>].*$/s, '').replace(/\s+/g, '').replace(/[),.;]+$/g, '');
      try {
        const url = new URL(candidate);
        return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
      } catch { return ''; }
    };
    return rows.flatMap((row, rowIndex) => {
      const status = normalize(row[statusColumn]);
      if (!['ativo', 'ativa', 'active'].includes(status)) return [];
      const title = String(row[titleColumn] || '').trim();
      const message = String(row[messageColumn] || '').trim();
      if (!title || !message) return [];
      const imageUrls = [...new Set([
        urlFrom(row[imageColumn]), compactUrlFrom(row[imageColumn]), urlFrom(links[rowIndex]?.[imageColumn]),
        ...(bannerColumn >= 0 ? [urlFrom(row[bannerColumn]), compactUrlFrom(row[bannerColumn]), urlFrom(links[rowIndex]?.[bannerColumn])] : [])
      ].filter(Boolean))];
      return [{ title, message, imageUrl: imageUrls[0] || '', imageUrls, source: 'hall-general' }];
    });
  };
  app.loadHallGeneralEvents = async function (signal) {
    if (signal?.aborted) throw app.abortError();
    const config = app.eventsConfig;
    const url = new URL(`https://docs.google.com/spreadsheets/d/e/${config.hallPublishedId}/pub`);
    url.search = new URLSearchParams({ gid: config.hallGeneralEventsGid, single: 'true', output: 'csv', t: String(Date.now()) }).toString();
    const controller = new AbortController();
    const cancel = () => controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    const timer = setTimeout(cancel, 15000);
    try {
      const response = await fetch(url.href, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: controller.signal });
      if (!response.ok) throw new Error(`Geral eventos do Hall respondeu HTTP ${response.status}.`);
      const csv = await response.text();
      let links = [];
      const htmlUrl = new URL(`https://docs.google.com/spreadsheets/d/e/${config.hallPublishedId}/pubhtml/sheet`);
      htmlUrl.search = new URLSearchParams({ headers: 'false', gid: config.hallGeneralEventsGid }).toString();
      try {
        const htmlResponse = await fetch(htmlUrl.href, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-store', referrerPolicy: 'no-referrer', signal: controller.signal });
        if (htmlResponse.ok) {
          const table = /<table\b[^>]*class=["'][^"']*waffle[^"']*["'][^>]*>([\s\S]*?)<\/table>/i.exec(await htmlResponse.text())?.[1] || '';
          links = [...table.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1).map(match => [...match[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => {
            const href = /<a\b[^>]*href=["']([^"']+)["']/i.exec(cell[1])?.[1] || '';
            return href.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
          }));
        }
      } catch { if (signal?.aborted) throw app.abortError(); }
      if (controller.signal.aborted) throw signal?.aborted ? app.abortError() : new Error('A consulta de Geral eventos demorou mais de 15 segundos. Tente novamente.');
      return app.readHallGeneralEvents(csv, links);
    } catch (error) {
      if (signal?.aborted) throw app.abortError();
      if (error.name === 'AbortError') throw new Error('A consulta de Geral eventos demorou mais de 15 segundos. Tente novamente.');
      if (error instanceof TypeError) throw new Error('Não consegui ler Geral eventos do Hall. Confira a conexão e se a publicação está disponível.');
      throw error;
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
  };
  app.loadAnnouncements = async function (signal) {
    const [created, hall] = await Promise.all([app.loadEvents(signal), app.loadHallGeneralEvents(signal)]);
    return [...created.map(event => ({ ...event, source: 'created' })), ...hall];
  };
  app.makeEventMessage = function (event) {
    const text = event.message;
    let position = event.imagePosition === 'right' ? 'right' : 'left';
    if (event.imagePosition !== 'left' && event.imagePosition !== 'right') {
      try { if (localStorage.getItem('AssistenteLive.eventImagePosition.v1') === 'right') position = 'right'; } catch {}
    }
    const images = event.imageUrl ? [{ url: event.imageUrl, urls: event.imageUrls, type: 'game', alt: `Imagem de ${event.title}`, position }] : [];
    const displayOptions = app.merlinSettings?.imageLayout?.() || {};
    const readingMs = Number.isFinite(Number(event.readingMs)) && Number(event.readingMs) >= 3000
      ? Number(event.readingMs) : Math.max(8000, Math.ceil(text.length / 15) * 1000);
    return { text, images, displayOptions, readingMs, mastery: true, soundCategory: event.source === 'local' ? 'localAnnouncements' : 'announcements' };
  };
})();
