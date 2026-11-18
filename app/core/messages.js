(() => {
  'use strict';
  const app = window.AssistenteLive;
  app.makeMessage = function (example, agentName) {
    if (example === 'saudacao') {
      const text = agentName === 'Merlin' ? 'Olá! Eu sou Merlin, seu novo assistente de lives!'
        : agentName === 'Clippy' ? 'Olá! Eu sou Clippy. Também estou aqui para ajudar na sua live!'
        : `Olá! Eu sou ${agentName}, seu assistente de lives!`;
      return { text, readingMs: 5000, mastery: false };
    }
    const data = app.masteryExamples[example];
    if (!data || ['player', 'game', 'message'].some(key => typeof data[key] !== 'string' || !data[key].trim())) {
      throw new Error('Exemplo de masterização inválido. Confira data/masterizacoes-teste.js.');
    }
    const text = `MASTERIZAÇÃO · TESTE SIMULADO\n${data.player}\n${data.game}\n${data.message}`;
    // Tempo de leitura após a saudação, proporcional ao tamanho do texto.
    return { text, readingMs: Math.max(8000, Math.ceil(text.length / 15) * 1000), mastery: true };
  };
})();
