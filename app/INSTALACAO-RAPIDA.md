# AssistenteHall 0.24.76 — instalação no OBS

## Instalar

1. Extraia o ZIP inteiro para uma pasta permanente. Não mova essa pasta depois de adicionar a fonte ao OBS.
2. No OBS, em **Fontes**, clique em **+** e escolha **Navegador**.
3. Marque **Arquivo local** e selecione o arquivo `index.html` da pasta extraída.
4. Defina a largura e a altura para o tamanho da sua tela ou cena e confirme.
5. Clique com o botão direito na fonte e escolha **Interagir**. Use **F1** para abrir ou fechar o painel.

Mantenha a fonte carregada enquanto estiver usando o OBS. Ela precisa de conexão com a internet para carregar os dados e imagens publicados.

## O que esta cópia já usa

Os anúncios e dados do Hall vêm das planilhas públicas configuradas nesta cópia. A pessoa que instalar verá os mesmos dados. As preferências do painel, anúncios locais e sons personalizados ficam salvos no próprio OBS e não são incluídos no ZIP.

Para usar outras planilhas, será necessário alterar `data/eventos-config.js` e publicar as planilhas com acesso de leitura para o navegador.

## Demonstrar as opções padrão no seu OBS

1. Abra **Configurações** e clique em **Exportar configurações**. Guarde o JSON em um local seguro.
2. Clique em **Restaurar padrões** e confirme. O cache e o histórico de masterizações são mantidos.
3. Faça a demonstração com as opções padrão.
4. Para voltar à sua configuração, abra **Configurações**, importe o JSON salvo e aguarde o recarregamento.

O JSON guarda as preferências do painel; não inclui o cache nem o histórico coletado de masterizações.

## Atualizações

Extraia o pacote novo em uma pasta estável e atualize o caminho do arquivo `index.html` nas propriedades da fonte **Navegador**. O Worker 0.18.29 prepara a aba Masterizações automaticamente; não crie as colunas técnicas manualmente.

