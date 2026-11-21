(() => {
  'use strict';
  const app = window.AssistenteLive;
  app.PanelTabs = class {
    constructor() {
      this.names = ['mascotes', 'merlin', 'anuncios', 'anuncios-locais', 'merlin-fila', 'sons', 'membros', 'console', 'configuracoes'];
      this.active = 'mascotes';
      try { const saved = localStorage.getItem('AssistenteLive.activeTab'); if (this.names.includes(saved)) this.active = saved; } catch {}
      for (const name of this.names) {
        const button = document.getElementById(`tab-${name}`);
        button.addEventListener('click', () => this.select(name));
        button.addEventListener('keydown', event => {
          const index = this.names.indexOf(name);
          let next;
          if (event.key === 'ArrowRight') next = (index + 1) % this.names.length;
          else if (event.key === 'ArrowLeft') next = (index + this.names.length - 1) % this.names.length;
          else if (event.key === 'Home') next = 0;
          else if (event.key === 'End') next = this.names.length - 1;
          else return;
          event.preventDefault(); this.select(this.names[next]);
        });
      }
      this.select(this.active, false);
    }
    select(name, focus = true) {
      if (!this.names.includes(name)) return;
      this.active = name;
      try { localStorage.setItem('AssistenteLive.activeTab', name); } catch {}
      for (const item of this.names) {
        const selected = item === name;
        const button = document.getElementById(`tab-${item}`);
        button.setAttribute('aria-selected', String(selected));
        button.tabIndex = selected ? 0 : -1;
        document.getElementById(`pane-${item}`).hidden = !selected;
      }
      if (name === 'merlin-fila') app.merlinPanel?.onOpen();
      if (name === 'anuncios') app.eventsPanel?.onOpen();
      if (name === 'anuncios-locais') app.eventsPanel?.onOpen();
      if (name === 'merlin') app.merlinSettings?.refreshPreview();
      if (focus) document.getElementById(`tab-${name}`).focus();
    }
  };
})();

