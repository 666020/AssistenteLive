# 0.24.76 — duplo clique anuncia platinas do histórico

O duplo clique em qualquer prévia de masterização anuncia aquela platina, inclusive as anteriores ao marco atual. O marco continua limitando apenas a fila de anúncios automáticos.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.76.zip`.

---

# 0.24.75 — padrão de configurações atualizado

Os padrões do AssistenteHall agora correspondem à configuração enviada: Agent selecionado Clippy, Agents apresentadores Merlin e Clippy, animações rotativas, boas-vindas ativadas, largura do balão em 800 px e demais opções indicadas. Os padrões são aplicados em uma instalação nova ou ao usar **Restaurar padrões**; preferências existentes não são substituídas ao atualizar.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.75.zip`.

---

# 0.24.74 — histórico completo de masterizações na aba

A aba Masterizações agora exibe todas as linhas coletadas da planilha. Registros anteriores ao marco são marcados e não entram na fila de anúncio. O marco temporal continua iniciando ao abrir o AssistenteHall e pode ser reiniciado em **Atualizar agora**.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.74.zip`.

---

# 0.24.73 — marco temporal para masterizações novas

Ao selecionar **Só as novas, a partir de agora**, o AssistenteHall grava um marco temporal ao iniciar ou quando você clica em **Atualizar**. Só entram na fila platinas cuja data real de conquista na planilha seja posterior ao marco, inclusive quando a planilha recebe a linha mais tarde. Registros anteriores continuam visíveis na aba, mas não são anunciados.

A aba **Masterizações** exibe todas as linhas coletadas da planilha, inclusive as anteriores ao marco. O marco afeta somente a fila e a possibilidade de anunciar.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.73.zip`.

---

# 0.24.71 — largura atualizada imediatamente na fila

Ao alterar a largura do balão, as prévias da fila de masterizações e recrutamentos agora são redimensionadas imediatamente, sem recriar a fila ou recarregar as imagens.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.71.zip`.

---

# 0.24.70 — largura escolhida respeitada no balão

O limite de largura configurado agora continua valendo quando o balão fica ao lado do Agent. Antes, a regra de posicionamento podia substituir esse limite e deixar a mensagem ocupar quase toda a tela.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.70.zip`.

---

# 0.24.69 — anunciar prévia com dois cliques

As prévias de anúncios do Hall, anúncios locais (incluindo a prévia da edição) e masterizações/recrutamentos pendentes agora podem ser anunciadas com dois cliques. As prévias usadas dentro da configuração do **Balão de conversa** continuam apenas para visualização. Também é possível focar uma prévia e usar Enter ou Espaço.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.69.zip`.

---

# 0.24.68 — configuração padrão atualizada

A configuração enviada foi definida como padrão para novas instalações e para a restauração de padrões: Clippy selecionado, animações em rotação, áudio separado para recrutamentos, masterizações, anúncios e anúncios locais, intervalo local de 30 minutos e as demais preferências incluídas no arquivo enviado.

As preferências já salvas em um OBS continuam preservadas. Para aplicar esse padrão em uma instalação existente, use **Configurações → Restaurar padrões**.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.68.zip`.

---

# 0.24.67 — Agents em ordem alfabética

Na aba **Agents**, tanto os cartões de Agents quanto a seleção de apresentadores ficam em ordem alfabética pelo nome exibido. A seleção atual é preservada e as listas se reorganizam quando um nome personalizado é alterado.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.67.zip`.

---

# 0.24.66 — apresentadores em ordem alfabética

Na aba **Agents**, a seleção de **Agents que apresentam mensagens** agora aparece antes da lista de Agents e em ordem alfabética pelo nome exibido. A seleção continua preservada e a lista se reordena quando um nome personalizado é alterado.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.66.zip`.

---

# 0.24.65 — áudio próprio para recrutamentos

A aba **Sons** agora tem uma categoria independente para recrutamentos, com ativação, efeito, arquivo personalizado e volume próprios. Registros de recrutamento usam esse som; as demais masterizações continuam na categoria **Masterizações**. Configurações antigas herdam inicialmente o som de masterizações para preservar o comportamento que já tinham.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.65.zip`.

---

# 0.24.64 — configuração enviada definida como padrão

A configuração enviada foi aplicada como padrão para instalações novas e para **Restaurar padrões**: Agent Merlin selecionado, Merlin e Clippy na apresentação, balões de 304 px, modelos de mensagem, sons, anúncios locais, eventos selecionados e mensagem de boas-vindas. Restaurar os padrões mantém o cache e o histórico de masterizações.

Também foi alinhada a validação de anúncios locais sem título ao formato que o próprio editor salva.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.64.zip`.

---

# 0.24.63 — prévia começa pela conquista mais recente

As prévias de Masterização e Recrutamento agora são ordenadas pela data **Detectado em**, da mais recente para a mais antiga. Enquanto você não troca o exemplo manualmente, a seleção acompanha a conquista mais recente quando o cache é atualizado. Depois de trocar, sua escolha é mantida enquanto o registro continuar disponível.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.63.zip`.

---

# 0.24.62 — prévias separadas por tipo de mensagem

As abas **Masterização** e **Recrutamento** mantêm a mesma disposição, com os campos à esquerda e a prévia à direita. A prévia de Masterização usa somente registros de masterizações; a de Recrutamento usa somente registros de recrutamento. Se ainda não houver recrutas coletados, aparece um exemplo de recrutamento.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.62.zip`.

---

# 0.24.61 — abas de mensagens de masterização e recrutamento

Na aba **Balão de conversa**, alterne entre as abas internas **Masterização** e **Recrutamento** para editar o modelo adequado. A opção de anunciar novos membros e a prévia de recrutamento ficam junto do texto de recrutamento. As configurações de mensagem existentes são preservadas.

Atualize os arquivos da fonte OBS com `AssistenteHall-0.24.61.zip`.

---

# 0.24.60 — atualização leve das masterizações

O Worker do Cloudflare passa a gravar Console e Imagem membro na aba **Masterizações** e a manter a versão atual em `N2` (coluna oculta). Um pequeno catálogo JSON em `O2` preserva a lista completa de membros ativos e consoles para as configurações do painel. O AssistenteHall consulta N2:O2 a cada 30 segundos e baixa as linhas A:M somente quando a versão muda. A primeira consulta após limpar cache ou instalar em outro OBS continua sendo completa.

**Ordem de atualização:** para habilitar a coleta incremental, publique primeiro `cloudflare/src/worker.mjs` (versão 0.18.29). Na primeira execução agendada, o Worker cria as colunas `Console`, `Imagem membro`, `Versão Assistente` e `Catálogo Assistente`, oculta N:O, preenche os campos ausentes das linhas antigas e inicia o marcador em 1. Não acrescente as colunas manualmente antes de publicar o Worker.

## Worker 0.18.29 — retenção de 90 dias

O Worker apaga automaticamente da aba **Masterizações** as linhas cuja data em **Detectado em** seja anterior aos últimos 90 dias. A exclusão aumenta `N2`, então o AssistenteHall percebe a mudança e atualiza o cache. A recuperação histórica também usa o mesmo período e não reinsere conquistas vencidas.

Para mudar o período no Cloudflare sem editar o código, abra **Workers & Pages → assistentelive → Settings → Variables and Secrets** e adicione ou altere a variável de texto `MASTERIES_RETENTION_DAYS` (por exemplo, `90`). Se ela estiver ausente ou inválida, o padrão é 90 dias. O valor aceito vai de 1 a 3650 dias. Publique o Worker 0.18.29; o ZIP da fonte OBS não precisa ser atualizado.

---
# 0.24.59 — configurações de recrutas no Balão de conversa

O controle para anunciar platinas que tornam um recruta membro e seu modelo de texto agora ficam na aba **Balão de conversa**, sem uma aba separada. O texto do recruta permanece independente do modelo geral.

Atualize os arquivos da fonte OBS com o pacote AssistenteHall-0.24.59.zip. O Worker não precisa ser alterado.

---
# 0.24.43 — restauração sem diálogo bloqueado

A restauração de padrões agora usa uma confirmação dentro do próprio painel, para funcionar no Interagir do OBS mesmo quando diálogos nativos do navegador não aparecem. Clique em Restaurar padrões e depois em Confirmar restauração.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.43.zip`. O Worker não precisa ser alterado.

---

# 0.24.42 — rolagem da área JSON

A área de exportação/importação JSON agora respeita a largura da aba e não exibe barras de rolagem. O conteúdo continua navegável com a roda do mouse e as teclas.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.42.zip`. O Worker não precisa ser alterado.

---

# 0.24.41 — aba Configurações restaurada

A aba **Configurações** voltou ao painel. Use **Exportar configurações** para guardar suas preferências em JSON, **Restaurar padrões** para limpar as preferências e **Importar configurações** para recuperá-las depois. O cache e o histórico de masterizações são preservados pela restauração e não fazem parte do JSON.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.41.zip`. O Worker não precisa ser alterado.

---

# 0.24.40 — rodapé dos Agents apresentadores

O rodapé da aba Agents agora informa quais Agents alternam na apresentação das mensagens, em vez de indicar apenas qual Agent está selecionado para edição e teste.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.40.zip`. O Worker não precisa ser alterado.

---

# 0.24.39 — organização das abas e cor do balão

As abas principais seguem a ordem Agents, Balão de conversa, Anúncios, Anúncios locais, Masterizações, Sons, Membros e Consoles. Em Balão de conversa, escolha uma cor de fundo pelo seletor, código hexadecimal ou amostras; a prévia e os balões de anúncios e masterizações acompanham a escolha. A cor do texto ajusta automaticamente para manter contraste. A preferência fica salva neste OBS.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.39.zip`. O Worker não precisa ser alterado.

---

# 0.24.38 — pausa confiável ao abrir o painel

Ao abrir o painel, as filas são canceladas depois que o painel já está marcado como aberto. Isso impede que uma fila pendente inicie uma nova mensagem durante a abertura. Temporizadores automáticos permanecem pausados enquanto o painel está visível.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.38.zip`. O Worker não precisa ser alterado.

---

# 0.24.37 — tentativas automáticas após bloqueios

Se uma atualização em segundo plano ou outra apresentação estiver ocupada quando o intervalo automático vencer, o anúncio tenta novamente após uma espera curta. Isso evita que intervalos de 1 ou 2 minutos sejam reiniciados repetidamente quando coincidem com a atualização periódica.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.37.zip`. O Worker não precisa ser alterado.

---

# 0.24.36 — áudio por categoria corrigido

Corrigido o encaminhamento do som escolhido para anúncios da planilha e anúncios locais. Cada mensagem usa sua categoria configurada na aba **Sons**.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.36.zip`. O Worker não precisa ser alterado.

---

# 0.24.35 — alternância entre Agents

Na aba **Agents**, marque um ou mais personagens em **Agents que apresentam mensagens**. Eles se alternam a cada anúncio, incluindo eventos da planilha, anúncios locais e cada item da fila de masterizações. A seleção é independente do Agent que você está editando e fica salva neste OBS; ela também acompanha a exportação/importação de configurações.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.35.zip`. O Worker não precisa ser alterado.

---

# 0.24.34 — sons independentes por categoria

Na aba **Sons**, configure separadamente a ativação, o efeito, o arquivo personalizado e o volume de **Masterizações**, **Anúncios** da planilha e **Anúncios locais**. As configurações de som das versões anteriores são migradas para cada categoria. O importador agora aceita configurações de até 4 MB para comportar três arquivos personalizados.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.34.zip`. O Worker não precisa ser alterado.

---

# 0.24.31 — correção de inicialização

Corrigida a referência ao status do intervalo automático local, que causava falha ao iniciar o painel. As opções locais e as demais abas voltam a carregar.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.31.zip`. O Worker não precisa ser alterado.

---

# 0.24.30 — opções dos anúncios locais

Na aba **Anúncios locais**, ajuste o tempo de exibição, o intervalo automático e o lado da imagem independentemente dos anúncios da planilha. Intervalo 0 desativa somente a sequência automática local. Configurações ficam salvas neste OBS e podem ser levadas por exportação/importação.

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.30.zip`. O Worker não precisa ser alterado.

---

# 0.24.29 — anúncios locais

## Atualizar

Atualize somente os arquivos da fonte OBS com o pacote `AssistenteLive-Marco-001-Anuncios-hall-0.24.29.zip`. O Worker não precisa ser alterado.

## Anúncios locais

Na aba **Anúncios locais**, crie mensagens de live com título, texto e URL opcional de imagem (HTTP ou HTTPS). As mensagens ficam salvas neste OBS, podem ser editadas/excluídas e selecionadas para a sequência manual ou automática. Elas também aparecem na aba **Anúncios** junto dos eventos existentes e usam o mesmo intervalo e o mesmo tempo de exibição.

---

# 0.24.28 — rótulo simples de som

O controle que liga e desliga o áudio agora usa o rótulo curto “Ativar som”.

Atualize somente os arquivos da fonte OBS pelo pacote 0.24.28; o Worker não precisa ser alterado.

---

# 0.24.27 — opções de som sem lista suspensa

As opções de som agora aparecem como seletores visíveis em vez de uma lista suspensa, para facilitar a escolha no Interagir do OBS. Os quatro efeitos, arquivo personalizado, volume, teste e ativação continuam disponíveis na aba Sons.

Atualize somente os arquivos da fonte OBS pelo pacote 0.24.27; o Worker não precisa ser alterado.

---

# 0.24.26 — aba de sons

Os controles de som agora ficam em uma aba própria. Escolha entre quatro efeitos prontos ou carregue um arquivo de áudio próprio de até 650 KB; é possível testar, ajustar o volume e ligar/desligar o áudio. As opções e o arquivo personalizado continuam salvos e exportáveis.

Atualize somente os arquivos da fonte OBS pelo pacote 0.24.26; o Worker não precisa ser alterado.

---

# 0.24.25 — sons escolhidos para anúncios

Na aba Balão de conversa, escolha entre quatro efeitos prontos ou carregue um arquivo de áudio próprio de até 650 KB. Você pode testar o som, ajustar o volume e ligar/desligar a reprodução em todos os anúncios. O som personalizado fica salvo e acompanha a exportação das configurações. O recurso vem desligado por padrão.

Atualize somente os arquivos da fonte OBS pelo pacote 0.24.25; o Worker não precisa ser alterado.

---

# 0.24.24 — efeito sonoro nos anúncios

Na aba Balão de conversa, o som pode ser ligado ou desligado, ter o volume ajustado e ser testado. O efeito curto acompanha anúncios de eventos e masterizações; por padrão, fica desligado.

Atualize somente os arquivos da fonte OBS pelo pacote 0.24.24; o Worker não precisa ser alterado.

---

# 0.24.23 — prévia de consoles corrigida

Alterar o nome de um console atualiza o texto de todos os cartões de masterização em exibição imediatamente, sem depender de correspondência do console nem de uma nova coleta.

Atualize somente os arquivos da fonte OBS pelo pacote 0.24.23; o Worker não precisa ser alterado.

---

# 0.24.22 — atualização direta das prévias de masterizações

As edições dos nomes de membros e consoles atualizam diretamente os cartões e a lista coletada de masterizações, sem reconstruir as listas nem esperar uma nova coleta.

Atualize somente os arquivos da fonte OBS pelo pacote 0.24.22; o Worker não precisa ser alterado.

---

# 0.24.21 — prévias rápidas de membros e consoles

As prévias respondem imediatamente à edição de nomes de membros e consoles. Os textos dos cartões da fila são atualizados diretamente, sem reconstruir as listas completas a cada tecla.

Atualize somente os arquivos da fonte OBS pelo pacote 0.24.21; o Worker não precisa ser alterado.

---

# 0.24.20 — rótulos do padrão de novos anúncios

Na aba Anúncios, os rótulos do padrão de novas mensagens foram simplificados para “Novos anúncios vêm: Ativados / Desativados”.

Atualize somente os arquivos da fonte OBS pelo pacote 0.24.20; o Worker não precisa ser alterado.

---

# 0.20.8 — anúncios sem recarga ao abrir a aba

Abrir a aba Anúncios não inicia outra leitura da planilha. A lista carrega na inicialização e se atualiza em segundo plano a cada minuto; o botão Atualizar mensagens ativas permanece disponível para atualização manual.

Atualize somente os arquivos da fonte OBS pelo pacote 0.20.8; o Worker não precisa ser alterado.

---

# 0.20.7 — padrões de anúncios e membros ativos

Os padrões iniciais agora seguem as opções mostradas: intervalo de anúncios de 60 minutos, novos anúncios selecionados, imagem à esquerda; Balão em Trebuchet MS médio, imagens ligadas, membro à esquerda, capa à direita, imagens automáticas, largura 1000 px, tempo em dias/horas/minutos e somente masterizações novas; coleta automática ligada e lista coletada oculta. A aba Membros exibe somente IDs com STATUS ativo na planilha MEMBROS. Preferências já salvas neste OBS continuam respeitadas.

Atualize somente os arquivos da fonte OBS pelo pacote 0.20.7; o Worker não precisa ser alterado.

---

# 0.20.6 — aba Configurações oculta

A aba Configurações foi retirada da navegação por enquanto. O conteúdo e o código continuam preservados no projeto para reativação futura.

Atualize somente os arquivos da fonte OBS pelo pacote 0.20.6; o Worker não precisa ser alterado.

---

# 0.20.5 — importar JSON colado sem arquivo

A aba Configurações agora permite colar o JSON exportado e importar diretamente. Isso contorna o bloqueio de salvamento de arquivos do navegador embutido do OBS na transferência entre instalações.

Atualize somente os arquivos da fonte OBS pelo pacote 0.20.5; o Worker não precisa ser alterado.

---

# 0.20.4 — confirmação ao restaurar padrões

O botão Restaurar padrões pede confirmação antes de apagar as preferências. Cancelar mantém as configurações atuais; confirmar preserva o cache e o histórico de masterizações.

Atualize somente os arquivos da fonte OBS pelo pacote 0.20.4; o Worker não precisa ser alterado.

---

# 0.20.3 — exportar pelo painel do OBS

Como o OBS bloqueia janelas e downloads, a exportação agora mostra o JSON dentro do painel e tenta copiá-lo. Se a cópia automática for bloqueada, o texto fica selecionado: pressione Ctrl+C, cole no Bloco de Notas e salve com a extensão .json.

Atualize somente os arquivos da fonte OBS pelo pacote 0.20.3; o Worker não precisa ser alterado.

---

# 0.20.2 — salvar exportação pelo OBS

No OBS, que não oferece o seletor nativo de local, exportar abre o JSON em outra janela. Use Ctrl+S nessa janela para escolher a pasta e o nome. Se o OBS bloquear a janela, o arquivo continua sendo baixado na pasta padrão.

Atualize somente os arquivos da fonte OBS pelo pacote 0.20.2; o Worker não precisa ser alterado.

---

# 0.20.1 — seletor de local para exportar configurações

O botão de exportar agora usa o seletor nativo de arquivo para escolher o nome e a pasta, quando disponível no OBS. Se o navegador embutido não oferecer essa API, o arquivo é baixado na pasta padrão e o painel informa isso.

Atualize somente os arquivos da fonte OBS pelo pacote 0.20.1; o Worker não precisa ser alterado.

---

# 0.20.0 — importar, exportar e restaurar configurações

Nova aba **Configurações** exporta e importa um arquivo JSON com as preferências de Agents, anúncios, intervalo, consoles, membros e Balão de conversa. Restaurar padrões remove somente essas preferências e mantém o cache, o catálogo e o histórico de masterizações.

Atualize somente os arquivos da fonte OBS pelo pacote 0.20.0; o Worker não precisa ser alterado.

---

# 0.19.3 — prévia do Balão sem Agent

Removi o Agent da prévia do Balão de conversa. O preview continua trocando o exemplo ao clicar.

Atualize somente os arquivos da fonte OBS pelo pacote 0.19.3; o Worker não precisa ser alterado.

---

# 0.19.2 — medição automática depois de exibir a aba

Prévia, Anúncios e Masterizações agora esperam o conteúdo ficar visível para medir a altura do texto e ajustar as imagens automáticas. Isso evita que uma renderização em aba oculta calcule largura zero e deixe as imagens minúsculas.

Atualize somente os arquivos da fonte OBS pelo pacote 0.19.2; o Worker não precisa ser alterado.

---

# 0.19.1 — abas em ordem alfabética

As abas visíveis agora estão em ordem alfabética, e a navegação com as setas segue a mesma ordem.

Atualize somente os arquivos da fonte OBS pelo pacote 0.19.1; o Worker não precisa ser alterado.

---

# 0.19.0 — aba Membros e imagens automáticas sem salto visual

Nova aba **Membros** permite definir um nome personalizado por ID; deixar em branco mantém o nome original. Se o campo personalizado contiver `*`, as masterizações desse membro continuam coletadas localmente, mas são removidas das prévias e ignoradas pela fila de anúncios. Imagens em tamanho automático ficam ocultas até receberem o tamanho calculado, evitando que apareçam pequenas antes de crescer.

Atualize somente os arquivos da fonte OBS pelo pacote 0.19.0; o Worker não precisa ser alterado.

---

# 0.18.9 — prévias em largura total e preferência de seleção

Anúncios e Masterizações agora aparecem em uma coluna, para manter texto e imagem legíveis. A coleta de masterizações usa o intervalo fixo de 30 segundos e não exibe mais um seletor de intervalo. Em Anúncios, a seleção de cada mensagem fica persistente entre atualizações, inclusive se o texto ou a imagem mudar; uma nova opção define se mensagens novas começam marcadas ou desmarcadas.

Atualize somente os arquivos da fonte OBS pelo pacote 0.18.9; o Worker não precisa ser alterado.

---

# 0.18.8 — prévias sincronizadas e anúncios no ciclo de exemplos

Os cards da aba **Anúncios** e a lista de **Masterizações** agora reaplicam a largura, tamanho das imagens, fonte e tamanho do texto escolhidos no Balão de conversa. A prévia clicável do Balão mistura masterizações com anúncios ativos e mostra os dados e a imagem do anúncio selecionado.

Atualize somente os arquivos da fonte OBS pelo pacote 0.18.8; o Worker não precisa ser alterado.

---

# 0.18.7 — largura e tamanho de imagem consistentes

O balão usa `box-sizing: border-box` para que 480 px inclua bordas e espaçamento, e mantém imagens e texto na mesma linha. O tamanho automático das imagens agora respeita a largura disponível e reserva espaço para o texto, evitando que as imagens cresçam e comprimam a mensagem. Prévia, fila e apresentação usam o mesmo cálculo. Anúncios também herdam do Balão de conversa as opções de tamanho de imagem, largura, fonte e tamanho do texto.

Atualize somente os arquivos da fonte OBS pelo pacote 0.18.7; o Worker não precisa ser alterado.

---

# 0.18.6 — sincronização automática de anúncios

A lista de anúncios agora é carregada quando o AssistenteLive inicia e atualizada em segundo plano a cada minuto, mesmo sem abrir a aba **Anúncios**. Esse ciclo só atualiza os dados e as prévias; a frequência de apresentação continua sendo controlada pelo intervalo geral. Se outra operação estiver em andamento, a atualização é adiada para o próximo minuto.

As imagens voltaram a priorizar a URL visível no CSV, que já funcionava para os demais eventos. Os links HTML e a versão sem espaços ficam como alternativas; quando uma URL falha, a prévia e o balão tentam os próximos endereços disponíveis.

Atualize somente os arquivos da fonte OBS pelo pacote 0.18.6; o Worker não precisa ser alterado.

---

# 0.18.5 — URLs com espaços nas imagens do Hall

Ao procurar a imagem de um evento do Hall, a leitura agora prioriza o endereço real do hiperlink e normaliza espaços no endereço exportado pela planilha. Mantém `BADGE EVENTO` como primeira opção e `BANNER EVENTO` como alternativa. Atualize somente os arquivos da fonte OBS pelo pacote 0.18.5; o Worker não precisa ser alterado.

---

# 0.18.4 — imagem alternativa dos eventos do Hall

Nos anúncios de **GERAL EVENTOS**, a imagem usa `BADGE EVENTO` primeiro e `BANNER EVENTO` como alternativa quando o badge estiver vazio. Isso permite mostrar eventos que têm apenas banner cadastrado, como o WiiVERSO. Atualize somente os arquivos da fonte OBS pelo pacote 0.18.4; o Worker não precisa ser alterado.

---

# 0.18.3 — eventos gerais do Hall nos anúncios

A aba **Anúncios** agora apresenta duas listas separadas: mensagens criadas na aba Eventos da planilha Mensageiro do Hall e eventos ativos da aba **GERAL EVENTOS** do catálogo do Hall. Para os eventos do Hall, `NOME EVENTO` vira título, `BADGE EVENTO` vira imagem, `DESCRIÇÃO` vira mensagem, e somente linhas com `STATUS` ativo entram.

As duas fontes compartilham seleção de mensagens, intervalo automático e lado da imagem. Mensagens novas de cada fonte entram selecionadas por padrão. Atualize somente os arquivos da fonte OBS pelo pacote 0.18.3; o Worker não precisa ser alterado.

---

# 0.18.2 — prévias e imagens dos anúncios

A coluna `Ativo` foi removida da aba **Eventos** da planilha Mensageiro do Hall. Agora uma mensagem fica disponível enquanto ainda estiver dentro de `Início`, `Fim` e `Hora fim`; datas vazias continuam sem limitar o período.

Na aba **Anúncios**, cada mensagem ativa aparece em uma prévia de balão com título, texto e imagem. A escolha de imagem à esquerda ou à direita fica salva neste OBS e também se aplica ao anúncio real. As caixas de seleção continuam servindo para decidir quais mensagens entram na rotação.

A aba Eventos agora tem seis colunas: `Título`, `Mensagem`, `Início`, `Fim`, `Hora fim` e `Imagem`. Atualize a fonte do OBS pelo pacote 0.18.2; o Worker não precisa ser alterado.

---

# 0.18.1 — anúncios de eventos configuráveis

A aba **Planilha** agora se chama **Anúncios** e mostra apenas as mensagens ativas da aba Eventos, dentro das datas e horários definidos. Cada mensagem tem uma caixa de seleção; mensagens novas são selecionadas por padrão. **Selecionar todas**, **Desmarcar todas** e **Anunciar selecionadas agora** controlam a seleção e a apresentação manual.

O intervalo geral, em minutos, determina a frequência da apresentação automática, que percorre as mensagens selecionadas. O valor `0` desativa a apresentação automática. As escolhas e o intervalo ficam salvos neste OBS. Ao abrir Anúncios, a lista é atualizada da planilha.

Os controles e a lista de coleta de masterizações foram movidos para a aba **Masterizações**; a coleta automática continua independente do intervalo de anúncios.

Atualize somente os arquivos da fonte OBS pelo pacote 0.18.1. O Worker e as planilhas não precisam ser alterados.

---

# 0.18.0 — organização do painel OBS

As abas do painel foram reorganizadas: **Mascotes** passou a **Agents**, **Planilha** passou a **Anúncios**, **Merlin** a **Balão de conversa** e **Fila do Merlin** a **Masterizações**. Na aba Agents, cada personagem pode receber um nome e tamanho próprios, salvos neste OBS. A aba Mensagens de teste continua no HTML, mas fica oculta da navegação.

A aba **Masterizações** mostra a coleta de masterizações da planilha Google, com atualização automática ativada por padrão, intervalo de 30 segundos, 1 minuto ou 2 minutos, atualização manual e opção para mostrar/ocultar os registros coletados. A leitura continua somente leitura e não usa o Worker. A aba também exibe prévias das mensagens e estados em ordem da mais antiga para a mais recente; permite anunciar pendentes manualmente e limpar o cache para buscar novamente.

Atualize somente os arquivos da fonte OBS pelo pacote 0.18.0. O Worker e as planilhas não precisam ser alterados.

---

# 0.14.0 — aba Merlin no painel OBS

O painel aberto por Interagir → C agora tem uma aba `Merlin` separada de `Planilha` e `Mensagens de teste`. Nela, configure o modelo com `{Membro}`, `{Jogo}` e `{Tempo}`, escolha o formato do tempo e defina se considera somente masterizações novas ou todas as ainda não anunciadas. As opções e a prévia são salvas neste OBS. Esta entrega prepara as configurações; a leitura real das linhas de masterizações será ligada em uma etapa seguinte.

Atualize os arquivos da fonte OBS pelo pacote 0.14.0. O endereço `index.html` continua o mesmo. Não é necessário alterar ou publicar novamente o Worker para usar esta aba de configuração.

---

# Cloudflare — etapa 2: teste RA / Primowit

Pré-requisito: Secret RA_API_KEY cadastrado em Production. Nunca colocar seu valor nos arquivos.

1. Abra cloudflare/CODIGO-PARA-COLAR.txt no Bloco de Notas e copie todo o conteúdo.
2. No Cloudflare, abra assistentelive → Edit code. Selecione todo o código do editor e substitua pelo conteúdo copiado.
3. Clique em Deploy.
4. Abra https://assistentelive.cleitondiles32.workers.dev/ra/test

Aprovação: ok true, raConnected true e user Primowit. checkedAt registra quando ocorreu a consulta. Se der erro, compartilhe apenas a resposta pública, nunca a chave.

A rota usa API_GetUserProfile.php, com usuário fixo Primowit. Não aceita parâmetros. Retorna apenas confirmação e horário, sem detalhes extras do perfil. Consulta tem limite de 8 segundos. Sucesso pode ser reutilizado por 5 minutos e falha por 30 segundos, na mesma instância. Chamadas simultâneas na mesma instância são agrupadas. Isto não é limite global: a rota é pública e diferentes instâncias podem fazer novas consultas. Esta etapa serve somente para diagnóstico manual; proteção e orçamento de consultas do monitor virão antes da automação.

/health continua sendo apenas diagnóstico de conectividade, com o contrato anterior (raConnected false). Use /ra/test para testar o RA. O botão atual no OBS testa somente /health. Nenhum anúncio ou monitoramento RA foi adicionado.

Testes locais: três testes Node passaram para health, rotas, métodos, Secret ausente, parâmetros recusados, chamada fixa, cache, concorrência, chave não exposta e respostas de erro. API real ainda não testada: a chave permanece somente no Cloudflare. O overlay permanece na versão 0.13.0.

Referência: https://api-docs.retroachievements.org/v1/get-user-profile.html

---
# 0.13.0 — teste de conexão Cloudflare no OBS

Atualize a fonte de navegador existente, que continua apontando para o mesmo index.html. No OBS, abra Interagir → C → Planilha → Testar Cloudflare. O bloco aparece no início da aba. Confira a versão 0.13.0 no topo do painel.

Aprovação: aparecer “Conexão com o Cloudflare OK neste navegador. RetroAchievements ainda não conectado.” dentro do OBS. Testar no navegador externo não substitui este teste.

O endereço já está configurado em data/cloudflare-config.js. A consulta só acontece ao clicar no botão, mesmo com intervalo automático 0. Não consulta o RA e não usa chaves. Não modifica a escolha do mascote, o intervalo ou a planilha. Tempo limite: 10 segundos. Abrir C novamente cancela consulta pendente. O resultado é desta sessão e não é salvo como confirmação permanente.

Testes locais em Node/DOM simulado: sucesso, HTTP de erro, CORS/rede, JSON inválido, resposta inesperada, tempo limite, cancelamento e clique duplo. Regressões de persistência, dez mascotes, cancelamento de apresentações e imagens também passaram. O teste real de rede/CORS no OBS ainda depende da ação acima.

Pasta fixa atualizada e backups anteriores preservados. Não é necessário alterar ou publicar novamente o Worker nesta etapa.

---
# 0.12.0 — imagem opcional nos eventos

Na planilha, use a coluna G, Imagem, para colar um link direto público. GIF animado, PNG, JPG e WebP são exibidos pelo navegador. Não use fórmula IMAGE nem link de página que exige login. Deixe vazio para anunciar só texto.

O link fornecido foi colocado em G2, no primeiro evento de teste. A imagem aparece ao lado do texto, sem recorte, com proporções preservadas. Falha ou espera maior que 5 segundos: o anúncio continua sem imagem. C cancela também o carregamento. O intervalo em minutos, persistência e datas continuam iguais.

Teste no OBS: atualize a fonte existente (mesmo index.html), abra Interagir → C → Planilha → Carregar eventos → Anunciar primeiro ativo. Confira GIF animado, texto legível e entrada/saída completas. Depois teste uma linha sem imagem. Abra C durante a apresentação: tudo deve sumir imediatamente.

Aprovação: imagem e texto visíveis sem sobreposição, GIF animado, anúncio sem imagem funcionando e C cancelando imediatamente. Se aprovado, mantenha o intervalo desejado; 0 desliga consultas automáticas.

Validação: testes locais de lógica em Node/DOM simulado passaram para imagem, erro, timeout, cancelamento, CSV, ciclo completo, dez mascotes, persistência e datas/horas. O carregamento real deste GIF e o visual no OBS precisam ser confirmados no teste acima.

Atualizado na pasta fixa. ZIPs anteriores preservados. Para voltar, use uma versão anterior completa na mesma pasta.

---

# Eventos sem ID — alteração da versão 0.11.0

A coluna ID foi removida da planilha. Agora preencha apenas **Ativo, Título, Mensagem, Início, Fim e Hora fim**. Não há códigos para criar ou manter.

O automático segue a ordem das linhas ativas e dentro do período: primeira, segunda, terceira, depois volta à primeira. A próxima posição fica salva localmente. Ao atualizar para esta versão, começa pela primeira posição; o antigo ID salvo não é usado. Intervalo, mascote, aba e mensagem de teste salvos continuam preservados.

Se inserir, remover, desativar, vencer ou reorganizar linhas, a lista muda: uma mensagem pode se repetir ou ficar para o ciclo seguinte. Títulos e mensagens repetidos são permitidos e cada linha é tratada separadamente.

**Teste:** atualize a fonte para 0.11.0, abra C → Planilha → Carregar eventos e anuncie todos os ativos. Para conferir a alternância automática, use temporariamente 1 minuto. Datas, hora fim, 0 sem consultas automáticas e cancelamento pelo C continuam iguais.

Mensagens, marcações, datas, horários, validações e formatação foram conferidos após remover a coluna. Nenhuma nova mensagem foi inserida. Os ZIPs anteriores foram preservados, mas as versões anteriores que exigem ID precisam da coluna antiga para funcionar; restaurar só o ZIP não reverte a planilha.

---

# AssistenteLive 0.11.0 — intervalo em minutos e painel imediato

## Atualizar

A pasta fixa continua sendo **AssistenteLive-Marco-001**. Atualize a fonte se ela aponta para a pasta deste projeto. Se usa outra instalação, copie todo o conteúdo da pasta do ZIP sobre ela. Os ZIPs anteriores permanecem como backup.

## Novo comportamento

- **Abrir C cancela imediatamente** animação, balão, fila e consultas em andamento. Não espera HIDE: o palco é limpo para permitir edição. O painel continua ocupando toda a área da fonte.
- Enquanto C está aberto, não há consultas ou anúncios automáticos. Os botões manuais continuam disponíveis para testar quando você quiser.
- Na aba Planilha, há apenas **Intervalo entre mensagens (minutos)**. Não há botões Iniciar/Parar automático.
- Padrão para uma instalação sem valor salvo: **120 minutos**. Aceita minutos inteiros de **0 a 10080**.
- **0 desativa as consultas automáticas**, inclusive ao recarregar. Os botões Carregar/Anunciar continuam funcionando quando clicados explicitamente.
- Valor positivo ativa o agendamento. Ao abrir a fonte ou fechar C, aguarda o intervalo completo antes da primeira consulta. Não consulta imediatamente.
- A cada intervalo, relê a planilha e anuncia **um evento**, alternando entre os ativos válidos. O próximo intervalo começa após terminar a apresentação. Não apresenta a lista inteira de uma vez no automático.
- Fechar C reinicia a contagem pelo intervalo salvo. Abrir C cancela também uma fila manual. O botão Parar sequência permanece para uma parada manual sem cortar a apresentação atual.

## Persistência

Salvamento automático local: intervalo, mascote, última aba, exemplo de teste e próxima posição na lista de eventos disponíveis. A recarga restaura essas escolhas. Não é salvo o tempo restante: a contagem recomeça completa na abertura/fechamento do painel.

O salvamento pertence ao navegador da fonte OBS e ao seu caminho. Limpar os dados do navegador ou mudar de instalação pode apagar/separar essas preferências. O painel avisa quando o armazenamento não está disponível. ZIPs preservam os arquivos, não os dados internos do OBS.

## Teste recomendado

1. Atualize a fonte. Não deve aparecer a antiga mensagem de teste automática na abertura.
2. Abra **Interagir → C → Planilha**. Confira o padrão **120**.
3. Escolha **1 minuto**, feche C e aguarde: apenas um evento deverá aparecer. Após terminar, o próximo aparece depois de mais um minuto.
4. Durante um anúncio, abra C: ele deve sumir imediatamente e liberar os controles.
5. Coloque **0**, feche C e recarregue a fonte. Abra C e confira que 0 continua salvo. Nenhuma consulta automática será feita.
6. Volte a 120 (ou outro intervalo) para uso normal. Escolha mascote, aba e exemplo, recarregue e confira a restauração.

## Planilha e anúncios manuais

Aba Eventos: Ativo, Título, Mensagem, Início, Fim, Hora fim. Datas opcionais em dd/mm/aaaa; Hora fim em HH:mm, exigindo Fim. Fuso: Brasília. Leitura A1:F1000. Não há alteração da planilha pelo overlay.

Carregar eventos consulta por ação explícita. Anunciar primeiro ativo e Anunciar todos os ativos continuam disponíveis e consultam novamente antes de começar. Datas e hora são conferidas antes de cada apresentação. No automático, falha de rede não anuncia dados antigos: mostra aviso e tenta novamente após o intervalo salvo. Sem eventos válidos, aguarda o próximo intervalo.

O painel aberto aparece na cena: configure fora do ar. A execução depende de a fonte permanecer carregada no OBS.

## Estrutura e testes

core/runtime.js controla esperas canceláveis e consultas. core/events-auto.js agenda uma mensagem por intervalo e guarda o cursor. Motor, apresentação, painel e abas compartilham o cancelamento. Recursos originais dos dez personagens preservados.

Testes automatizados: 120 padrão, 0 sem consultas, persistência, alternância de eventos, C durante preparação/SHOW/GREET/leitura/HIDE, cancelamento de fila e consulta tardia, dez mascotes completos e regressão de datas/horários. Conferência final no OBS pendente.
# Worker Cloudflare: monitor de masterizações

O pacote também inclui a etapa local do Worker que monitora conclusões Hardcore e grava deduplicado na aba `Masterizações`. Para atualizar, siga [ETAPA-04-MONITOR-RA.md](cloudflare/ETAPA-04-MONITOR-RA.md). A versão 0.18.16 guarda o estado na aba oculta `_Estado Assistente` da planilha; o Worker pode migrar os dados do KV antigo uma vez. O pacote não publica nada automaticamente.

Correções 0.14.1–0.14.7: o Worker separa a planilha publicada do Mensageiro do Hall, corrige os parâmetros de consulta ao Google Sheets, trata jogos ausentes na resposta do RA como zero conquistas Hardcore, valida hyperlink e texto da célula RA e faz uma consulta final ao responsável quando um jogo monitorado muda de `andamento` para `masterizado`, capturando conclusões que aconteceram entre rodadas. O código atualizado está em `cloudflare/CODIGO-PARA-COLAR.txt`.

# 0.14.1 — opções Merlin clicáveis no OBS

As listas suspensas da aba Merlin foram trocadas por opções de rádio dentro do painel. Clique diretamente em “Horas e minutos”, “Horas, minutos e segundos”, “Total em segundos” ou na política de masterizações antigas. Os valores já salvos neste OBS continuam sendo lidos, e as novas escolhas continuam sendo salvas automaticamente.

Atualize os arquivos da fonte OBS pelo pacote 0.14.1. Não é necessário alterar ou publicar novamente o Worker.

---

# 0.17.9 — avatares atualizados e formato de dias

O cabeçalho do painel ocupa uma linha, com indicação compacta do mascote selecionado. Na aba **Merlin**, você pode mostrar ou esconder a capa do jogo e o avatar do membro, escolher separadamente se cada um fica à esquerda ou à direita do texto e selecionar tamanho pequeno, médio ou grande. A prévia respeita as posições; os controles ficam em uma grade regular mais compacta para reduzir a rolagem. O tamanho selecionado se aplica igualmente às duas imagens. A foto do membro também pode ser quadrada ou redonda. Capas do RetroAchievements usam o domínio oficial de imagens. O avatar é carregado pelo nome em `Usuário RA` na planilha; se não houver avatar disponível, o anúncio continua sem ele.

Removi a borda do avatar do membro. “Limpar cache e buscar novamente” também troca a versão de cache nos endereços dos avatares, forçando o navegador a buscá-los novamente junto com a coleta das planilhas. O tempo ganhou o formato dias, horas e minutos. Atualize apenas os arquivos da fonte OBS pelo pacote 0.17.9; não precisa publicar o Worker.

## 0.17.10 — fotos do Hall por membro

O avatar agora vem da coluna **FOTO** da aba **MEMBROS** da planilha publicada do Hall, associado pelo **Membro ID** da aba Masterizações. O Merlin não usa mais o avatar do RetroAchievements como substituto, para evitar mostrar a foto de outra conta. Se não houver foto cadastrada para aquele ID, o anúncio fica sem avatar. A capa do jogo continua vindo do catálogo do Hall pelo Jogo RA ID. Limpar o cache apaga também o catálogo de fotos e força a leitura de novo.

Atualize apenas os arquivos da fonte OBS pelo pacote 0.17.10; não precisa publicar o Worker. A aba MEMBROS e as demais abas do catálogo precisam permitir leitura pública sem login no navegador do OBS.

## 0.17.11 — sequência contínua e nomes de console

Quando há várias masterizações pendentes, o mascote entra uma vez, mostra cada mensagem em sequência mantendo-se na cena e só executa a saída depois da última. Cada linha é marcada como anunciada assim que sua mensagem termina; se a sequência for interrompida, as seguintes continuam pendentes. Na aba **Merlin**, escolha o tamanho do texto: pequeno, médio, grande ou extra grande.

A nova aba **Console** lista os consoles do catálogo do Hall. Preencha o nome de exibição para personalizar o valor da chave `{Console}`; campo vazio usa o nome original. O atalho do painel mudou de C para **F1**, inclusive durante a edição do modelo da mensagem.

Atualize apenas os arquivos da fonte OBS pelo pacote 0.17.11. O Worker e as planilhas não precisam ser alterados.

## 0.17.12 — ajuste da largura da aba Console

O tamanho automático das imagens foi alterado para acompanhar uma linha do texto. A aba Console usa toda a largura disponível: três colunas em telas largas, duas em telas médias e uma em telas estreitas.

Atualize apenas os arquivos da fonte OBS pelo pacote 0.17.12. O Worker e as planilhas não precisam ser alterados.

## 0.17.13 — tamanho automático pela altura do bloco de texto

O tamanho automático das imagens agora acompanha a altura do bloco inteiro de texto, incluindo suas quebras de linha. O valor é medido uma única vez e limitado para evitar que o aumento das imagens provoque mais quebras e faça o layout crescer sem controle. Prévia e anúncio usam o mesmo critério.

Atualize apenas os arquivos da fonte OBS pelo pacote 0.17.13. O Worker e as planilhas não precisam ser alterados.

## 0.17.14 — escolha da fonte do anúncio

Na aba **Merlin**, escolha Arial, Verdana, Trebuchet MS, Georgia ou Courier New. A escolha fica salva neste perfil do OBS e é aplicada tanto à prévia quanto ao balão dos anúncios. Arial é a opção inicial para quem ainda não escolheu uma fonte.

Atualize apenas os arquivos da fonte OBS pelo pacote 0.17.14. O Worker e as planilhas não precisam ser alterados.

---

# 0.16.0 — atualização automática do Merlin

Enquanto a fonte do navegador do OBS estiver ativa, o Merlin lê diretamente a aba Masterizações do Google Sheets no início e a cada 30 segundos, mesmo com o painel C fechado. Não passa pelo Worker nem grava na planilha. **Atualizar da planilha** continua disponível para uma leitura imediata.

- **Só as novas, a partir de agora:** na primeira coleta, as linhas que já existiam ficam como ignoradas. Linhas novas aparecem pendentes.
- **Todas que ainda não foram anunciadas:** as linhas sem histórico local aparecem pendentes.
- **Pendentes:** o Merlin inicia a apresentação automaticamente assim que uma coleta identifica uma pendência. Apresenta os itens em sequência e marca cada linha como anunciada somente depois de a apresentação terminar. Abrir C interrompe a apresentação atual; o item interrompido continua pendente e volta à fila ao fechar C.
- **Anunciar pendentes agora:** também inicia manualmente a fila pendente.
- **Limpar histórico e deixar tudo pendente:** limpa os estados locais de anúncio/ignoradas. Mantém o cache e deixa os itens prontos para serem apresentados automaticamente quando o painel for fechado.

O cache e o histórico pertencem a este perfil de navegador do OBS. Se os dados locais do navegador forem apagados ou a fonte for usada em outro perfil, o Merlin começará sem esse histórico. A leitura direta exige que a planilha permita leitura sem login no navegador do OBS, como já acontece com a aba Eventos.

Para usar, atualize apenas os arquivos da fonte OBS pelo pacote 0.17.9. Não precisa substituir nem publicar o Worker. Se o Google bloquear a leitura, confira se as duas planilhas estão compartilhadas com permissão de leitor para quem tem o link. A coleta para quando a própria fonte do navegador do OBS é desligada ou descarregada.

---



