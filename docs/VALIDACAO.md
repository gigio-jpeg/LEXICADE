# LEXICADE 2 — evidências de validação

Revisão testada em 6 de outubro de 2026, na nuvem: Node.js 24.19.0, Chromium Linux e PGlite. Nenhum teste acessou o Supabase remoto do proprietário. Limites em [PENDENCIAS.md](PENDENCIAS.md).

## Node

`npm test`: **23 testes aprovados, zero falhas ou testes pulados**. Inclui navegação circular nas quatro máquinas, enquadramento de câmera, 30 frases novas completas por idioma, integridade de módulos/imports/HTML/CSP, catálogo de quatro jogos e traduções. Também mantém testes das regras puras da versão anterior: pistas com letras repetidas, acentos, datas/fusos, economia, labirintos, anagramas e algoritmos legados.

`npm run validate` verifica conteúdo e 180 grades legadas. Avisos editoriais históricos continuam explícitos, sem ocultar déficits como aprovação.

## PostgreSQL local

O harness `supabase/tests/run-local.mjs` instala as migrações 001–004 e o seed, verifica os quatro limiares de conquistas e executa `security.sql` e `economy.sql`. Em uma segunda instância vazia, aplica **o arquivo entregue `INSTALAR-TUDO.sql`** e repete os testes. Ambas as instalações e todas as assertions terminaram com `PASS`.

Verificados bloqueio de escrita direta, isolamento de dados, RPCs privadas, limites de score/taxa, tentativas/pistas, segredo diário legado, importação idempotente com teto, recordes privados, compras sem cobrança duplicada, itens próprios, exportação, exclusão e equivalência de XP/níveis entre JS e SQL. Auth é uma simulação mínima local. Não valida e-mail, OAuth, configuração hospedada ou uma sessão real. Reprodução: [supabase/tests/README.md](../supabase/tests/README.md).

## Navegador com sala 3D

Playwright externo ao checkout executou Chromium com WebGL e renderizador de software. A sala abriu sem fallback ou erros JavaScript. Todas as quatro máquinas iniciaram seus jogos no monitor; Frase Rush respondeu à frase completa, Decifra registrou um palpite, LexiMaze respondeu à direção e Anagrama exibiu suas letras. Pausa, retomada, saída, troca de máquina e visão geral funcionaram. Nenhum seletor de modo/duração apareceu no monitor.

Foram verificadas larguras **320, 390, 768, 1.440 e 3.840 px**, sem overflow horizontal. No celular, as linhas do teclado do Decifra não quebraram e o conteúdo coube no monitor. Escape saiu do jogo mesmo com o campo de texto em foco. Inglês, espanhol e português mantiveram a máquina selecionada. Perfil e login abriram em painel sobre a sala, inclusive usando uma URL antiga. Zero erros JavaScript e zero requisições ao Supabase nos testes visitantes.

## Rodadas completas

Um teste separado montou o mesmo `game-runner` e CSS do monitor, sem renderizar a sala durante o relógio acelerado. Exercitou Frase Rush com frase completa, espaços, pausa e término aos 60 s; seis tentativas e resultado do Decifra; três acertos e término do Anagrama; movimento e encerramento do LexiMaze. Os quatro resultados foram persistidos como visitante: quatro partidas e quatro jogos, sem erros JavaScript. Isso verifica os ciclos completos dos jogos; a interação com a sala foi verificada separadamente acima.

## Offline e fallback

Depois de instalar o service worker e conferir os 373 recursos em cache, o navegador foi colocado offline. A sala reabriu em WebGL e os quatro jogos iniciaram no monitor. Sem erros JavaScript. Em outro contexto, WebGL foi deliberadamente indisponibilizado; os gabinetes simplificados apareceram e Frase Rush iniciou e saiu corretamente. Primeiro acesso online é necessário; login e RPCs não fazem parte do modo offline.

## Evidência visual e limites

Capturas reais da aplicação acompanham `docs/images/`. O 3D é modelado/renderizado pelo site, sem imagens de máquinas usadas para simular volume. A jogabilidade permanece DOM/Canvas para entrada de texto e controles, projetada sobre a tela da máquina 3D.

Não foi medido desempenho em GPU física ou aparelho de entrada; não declarar meta de FPS cumprida. Testes Linux não comprovam execução em Windows, toque físico, Safari ou leitor de tela. A aprovação do banco hospedado e autenticação depende das ações do proprietário.

## Correção 2.0.1 — notificações e música (7 de outubro de 2026)

23 testes Node aprovados. Teste adicional em Chromium com WebGL, AudioContext real e analisadores de sinal: o botão musical iniciou áudio não nulo; desligá-lo silenciou o sinal; música funcionou com efeitos desligados, continuou após fechar Ajustes e foi restaurada após recarregar/interagir. Notificações de erro do login foram verificadas acima do backdrop desfocado, como popover na camada superior e descendente do diálogo ativo. A resposta de credenciais inválidas foi simulada no navegador; nenhuma requisição alcançou o Supabase. Zero erros JavaScript.

A trilha é sintetizada localmente e precisa de uma interação para respeitar a política de áudio do navegador. A atualização do service worker é `lexicade-v2.0.1`. Nenhuma alteração de banco foi necessária.

## Revisão 2.0.2 — playlist, temas e painéis (7 de outubro de 2026)

24 testes Node aprovados, incluindo regressão da playlist: avanço automático, lista circular e avanço em pausa sem reiniciar o áudio, com efeitos desligados. No Chromium com WebGL e AudioContext reais foram conferidos padrões de som/música ligados, áudio liberado pela primeira interação, três faixas distintas, pausa e avanço manual. A opção de pausa permaneceu após recarregar.

Login: distância de 14 px entre Entrar e Enviar link mágico; centros do X e navegação alinhados. Temas neon, soft, light, phosphor e minimal aplicaram a prévia na sala. O tema claro alterou pixels da cena efetivamente, além da interface. Salvar mostrou confirmação acima do painel e persistiu a escolha após recarregar. Fechar sem salvar restaurou o tema anterior. Player testado em 320, 390, 768 e 1.440 px; botão Salvar e X acessíveis ao rolar o painel no celular. Zero erros JavaScript; Supabase remoto não foi acessado.

Padrões de áudio são atualizados uma vez nesta revisão para ligar som/música; depois escolhas de pausa são respeitadas. A playlist é sintetizada localmente e o navegador pode exigir o primeiro clique/toque para permitir reprodução. Cache atualizado para `lexicade-v2.0.2`, com 374 arquivos. Sem mudança de banco.

## Revisão 2.0.3 — notificações e monitor retrô

26 testes Node aprovados. Os testes novos distinguem avisos conhecidos de ResizeObserver de erros reais e verificam que exceções/rejeições continuam registradas e notificadas. O redimensionamento WebGL passou a ocorrer no próximo frame e apenas quando as dimensões mudam, evitando reescritas de layout dentro do callback do observador. Notificações iguais já visíveis não criam cópias adicionais.

No Chromium com WebGL, a navegação pelos quatro jogos e painéis não reproduziu o relato de três notificações: zero eventos globais de erro/rejeição capturados. Portanto a causa específica no navegador do proprietário ainda depende do texto do Console solicitado no chat. Não atribuir o relato a ResizeObserver como causa comprovada.

Teste funcional posterior: monitor retrô mostra linhas de varredura, máscara RGB, brilho e vinheta; desligar remove o efeito. A prévia em Ajustes funciona e a escolha salva persiste após recarregar. As telas de demonstração dos quatro gabinetes também respeitam a preferência. Sem efeito global sobre controles e formulários, sem animação de cintilação.

Eventos de layout conhecidos foram simulados e não geraram popup. Três erros reais simulados mantiveram registro no Console e exibiram uma única notificação, inclusive acima de um painel aberto. Nenhum erro real foi suprimido pelo classificador. Sem acesso ao Supabase remoto. Cache atualizado para 375 recursos e versão 2.0.3.

## Revisão 2.1 — fantasma, duelo, sala e personalização

30 testes Node passaram, incluindo banco aleatório sem repetição, persistência do fantasma, validação dos convites e build de produção com todos os 381 recursos offline e sem arquivos internos. `npm run validate` terminou sem erro estrutural; continuam os avisos de metas editoriais antigas documentadas em PENDENCIAS.

PostgreSQL local via PGlite: migrações incrementais e instalador completo passaram em segurança, economia e social. A suíte social valida participantes, bloqueio de terceiros, frases do servidor, recompensa idempotente e desbloqueio de estilo.

Chromium com duas sessões simuladas, RPCs executadas no PostgreSQL local real e Realtime indisponível para exercitar polling: convite, mesmas frases, placar remoto, perda de rede/retomada, resultado comum e XP concedido uma vez passaram; zero erros JavaScript. Não houve autenticação ou execução SQL no Supabase hospedado. Realtime hospedado, e-mails e URLs de produção precisam do teste final do proprietário.

Rodadas dos quatro jogos passaram novamente. O fantasma gravou o recorde e repetiu a sequência na rodada seguinte. Anagrama resolveu três sorteios do banco ampliado e persistiu resultado. Na sala WebGL real: nome, acabamento dourado e coroa salvaram, acerto disparou reação e Extras funcionou em 320, 390, 768 e 1.440 px sem overflow; zero erros JavaScript. Fantasma é local ao navegador; estilo de conta usa RPC.

O pacote `dist` foi servido separadamente e abriu a sala WebGL e Extras sem erros JavaScript. Isso verifica os arquivos de produção, mas não representa um deploy na Vercel.

## Revisão 2.1.1 — personalização visível e comemorações

A pintura agora altera também o corpo frontal e os LEDs, com emissão suave para continuar visível na sala escura. A placa de nome ganhou largura, fonte maior e moldura. Teste Chromium/WebGL salvou acabamento dourado, nome e coroa e capturou a mudança real da cena; Extras preservou escolhas em 320, 390, 768 e 1.440 px, sem erros JavaScript.

Combos de Frase Rush e Anagrama disparam ondas no chão e partículas 3D ascendentes. Recordes acrescentam aviso grande e 40 confetes na camada visual sobre a sala. Teste funcional conferiu combo por acerto real, evento de recorde, confetes e redução de movimento: sem partículas animadas, mantendo confirmação textual. A rotina substitui a comemoração anterior e libera recursos ao fechar a sala. Nenhuma migração nova de banco. Cache: 382 arquivos.

## Revisão 2.2 — menu e playlist

O cabeçalho usa botões Ver a sala e Menu com SVGs locais. Progresso, ranking e ajustes têm entradas próprias e botão para voltar; player e idioma ficam no menu, com nome da faixa também no celular. A navegação duplicada no cabeçalho dos painéis foi removida.

Playlist de seis composições sintetizadas localmente: synth, funk sincopado, jazz com swing, arcade rápido, valsa em três tempos e breakbeat. Cada faixa tem melodia, harmonia, percussão e pausas próprias, em vez de alterar somente BPM. O Chromium conferiu áudio real nas seis, pausa, avanço em pausa, navegação Ajustes/voltar e cabeçalho/player em 320, 390, 768 e 1.440 px sem overflow. Os 30 testes Node passaram, incluindo avanço automático e build público. Sem alteração SQL.

Menu/player também abriu e fechou durante Frase Rush em 320 px, permitindo controlar música e retornar à partida. Zero erros JavaScript na execução completa.

## Revisão 2.2.1 — restaurar padrão e novos acabamentos

Original continua o valor inicial, sem requisito de partidas. O botão Restaurar padrão salva original/nome vazio/sem adesivo diretamente, sem apagar dados de progresso. Menta (5), Cobre solar (8), Rosa retrô (15), Pérola (40) e Aurora (50) ampliam a coleção. Aurora alterna cores por gabinete; detalhes gráficos e LEDs próprios de cada jogo evitam uniformizar toda a sala. A migração 006 amplia apenas a validação dos acabamentos no servidor, preservando estilos antigos e RLS.

Validação: 30 testes Node aprovados. Migrações incrementais e instalador completo passaram nas suítes PostgreSQL de segurança/economia/social, incluindo bloqueio de cada novo acabamento e restauração livre. Chromium/WebGL confirmou Original no início, Aurora renderizada, reset persistido sem alterar partidas, zero partidas com reset disponível e opções bloqueadas, e painel acessível em 320 px; zero erros JavaScript.
