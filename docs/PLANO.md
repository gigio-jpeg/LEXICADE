# LEXICADE — plano de construção

Especificação: `prompt-lexicade-projeto-completo.md`, enviada pelo usuário. Todos os capítulos, de 0 a 16, fazem parte do escopo. Este plano não substitui os detalhes da especificação.

## Situação desta entrega

- [x] Ler a especificação inteira, começando pelos capítulos 0, 0.1 e 0.2.
- [x] Inspecionar o repositório existente em `/workspace/LEXICADE`: sem arquivos de aplicação e sem commits.
- [x] Criar este plano antes de qualquer código do site.
- [x] Criar `docs/GUIA-INICIANTE.md` depois deste plano.
- [x] Consultar fontes oficiais para as orientações iniciais de Windows.
- [x] Aplicar a orientação atual: implementar antes de pedir instalações no Windows.
- [ ] Depois da entrega, conduzir as instalações conforme o guia.
- [x] Implementar a fundação, as telas, os 16 jogos e os testes; preparar pacote para download.

**Orientação atual do usuário:** construir e entregar o projeto antes de orientar instalações no Windows. Não aguardar instalações locais para implementar. Dados públicos do Supabase recebidos; serão usados exclusivamente em `src/core/config.js`. Manter a proibição de comandos contra o banco remoto: gerar migrações e testes para aplicação posterior pelo usuário. Atualizar o guia final para começar somente após a entrega.

## Regras de execução

1. Construir todas as fases abaixo, na ordem do capítulo 16, sem pedir autorização entre fases. Parar quando for necessária uma ação do usuário e esperar sua confirmação, conforme capítulo 0, regra 9.
2. Orientar em português simples e apresentar apenas o próximo passo no chat. O guia completo serve como referência, não como uma lista para executar de uma vez.
3. Manter este plano atualizado ao concluir cada fase, com testes executados, resultados, revisão crítica, ações do usuário e próximo trabalho.
4. Registrar limitações reais e revisões humanas em `docs/PENDENCIAS.md`. Não declarar uma funcionalidade pronta ou um teste aprovado antes de verificá-lo.
5. Não executar comandos contra o Supabase do usuário. Gerar SQL versionado e orientar sua aplicação pelo painel; o usuário executa as migrações e os testes remotos.
6. Nunca solicitar senhas, chaves secretas, `service_role` ou tokens pelo chat. URL e publishable key são públicas, mas seus valores reais só entram em `src/core/config.js`; `.env.example` recebe exemplos.
7. Usar a pasta existente do repositório. Não criar worktree; a tarefa na nuvem já é isolada.
8. Scripts do projeto em Node.js, compatíveis com PowerShell, sem dependência de comandos exclusivos de Linux e sem build obrigatório.
9. Sem marcas, personagens, artes ou sons copiados. Registrar fontes, versões e licenças antes de incorporar conteúdo externo.

## Arquitetura final

### Site estático e módulos

HTML, CSS e JavaScript puros com ES Modules. Canvas 2D nos jogos de ação; DOM nos jogos de palavras, formulários e telas. JSON carregado por `fetch`. Cada jogo carrega apenas seus módulos e dados. A publicação entrega arquivos estáticos, sem servidor de aplicação ou framework.

A árvore do capítulo 3 será seguida: `index.html`, manifesto e service worker na raiz; `pages/`, `games/`, `src/core/`, `src/ui/`, `src/games/`, `src/styles/`, `data/`, `assets/`, `supabase/`, `tests/` e `docs/`. Cada um dos 16 jogos terá seu `games/<id>/index.html` fino. Lógica pura em `src/games/<id>.js`; código de interface separado em módulos pequenos junto às telas de jogo. Páginas adicionais necessárias para recuperação de senha e escolha de nome ficarão em `pages/`.

`package.json` terá utilidades de desenvolvimento, não um build do site. Planejados: `npm start` para servidor estático em `http://localhost:5173` e `npm test` para `node --test`. Servidor local pequeno, escrito em Node e colocado em `tests/` como utilidade; não será necessário instalar Python. A implementação confirmará esses comandos antes de o usuário executá-los. `.gitattributes`, `.editorconfig` e `.gitignore` cuidarão de quebras de linha, arquivos locais e segredos.

### Núcleo compartilhado

| Módulos | Responsabilidade |
|---|---|
| `config.js` | Nome trocável, versão, idiomas, constantes, configuração pública Supabase e opção de Google desligada inicialmente |
| `supabase.js`, `auth.js`, `api.js` | Cliente oficial único com versão fixada, sessão e autenticação; todas as consultas e RPCs centralizadas |
| `storage.js`, `guest.js` | Persistência local com tratamento de falhas, recordes por jogo/modo/idioma e importação sem duplicação |
| `i18n.js`, `router.js` | Traduções hierárquicas e plural simples; navegação com caminhos relativos e suporte a hospedagem em subpasta |
| `audio.js`, `input.js`, `loop.js` | Web Audio original, teclado/toque/controles virtuais, passo de tempo fixo e descarte de eventos e animações |
| `rng.js`, `scoring.js` | Semente determinística, normalização compartilhada de acentos, XP, níveis, moedas e combos testáveis |

Interface nos módulos do capítulo 3: cabeçalho, componentes, resultados, HUD, gráficos próprios SVG/canvas, confete e tutorial pulável. Nenhum dado do usuário será inserido com HTML interpretado; usar `textContent`.

### Visual e experiência

Tokens CSS, três pilhas tipográficas (pixel, mono e sans), ícones SVG e arte originais, telas mobile-first e 5 temas: Neon Arcade, Escuro Suave, Claro, Retrô Fósforo e Minimalista. Preferência de sistema na primeira visita e escolha persistida depois.

Jogar sem cadastro, botão “JOGAR AGORA” abre TypeRush, catálogo com filtros e recordes. Casco único com pausa, HUD, tutorial de até 3 linhas e resultados completos. Som baixo/desligado inicialmente. Teclado nativo no toque para digitação; deslizar/D-pad nos jogos de movimento. Atalhos do capítulo 5.

Acessibilidade: foco visível, teclado, `aria-live`, rótulos, alvos de 44 px, contraste, símbolos além de cores, tamanho de fonte, redução de movimento. Validar larguras de 320 px a 4K; 60 FPS nos jogos de ação como meta medida, não promessa sem teste.

### Idiomas e conteúdo

Interface `pt-BR`, `en`, `es`; pastas de conteúdo e valores no banco `pt`, `en`, `es`. Mapeamento explícito para não misturar `pt-BR` e `pt`. Traduções completas em JSON, incluindo telas de erro, tutoriais e resultados. Acentos preservados para exibição, comparação normalizada e opção de exigir acentos em digitação.

Conteúdo por idioma, sem duplicatas, nomes próprios nas respostas ou termos impróprios. Metas do capítulo 11:

| Conteúdo por idioma | Meta |
|---|---:|
| Palavras comuns em 3 dificuldades | 2.000 |
| Frases / textos curtos | 150 / 30 |
| Respostas Decifra de 5 letras / válidas de 5 letras | 1.500 / 10.000 |
| Palavras para cruzadinhas com dicas temáticas | 500 |
| Grupos de rimas | 300 |
| Conjuntos de Intrusa | 200 |
| Pares e explicações de Ortografia | 400 |
| Grades válidas de cruzadinhas / dias diários incluídos | 60 / 30 |

As listas de 4 e 6 letras também serão validadas. Verificar disponibilidade real de 10.000 palavras adequadas de 5 letras em cada idioma: não inventar entradas para alcançar uma contagem. Qualquer meta não atingida será quantificada em `PENDENCIAS.md`. Conteúdo licenciado e conteúdo autoral serão distinguidos em `LICENCAS.md`; revisão linguística humana continua necessária.

### Supabase, segurança e progresso

Os dados públicos foram recebidos em mensagem posterior e colocados somente em `src/core/config.js`. O projeto Supabase já existe e está vazio; não criar outro nem executar comandos contra ele. O visitante funciona antes de aplicar o SQL. Autenticação real e rankings serão confirmados pelo usuário depois de configurar o banco.

Tabelas previstas no capítulo 8: `profiles`, `scores`, `personal_bests`, `daily_words`, `daily_results`, `achievements`, `user_achievements`, `user_items`, `game_limits`. Acrescentar apenas tabelas auxiliares necessárias, documentadas, para tentativas diárias, catálogo/preços, importações idempotentes e validação de partidas. Migrações ordenadas, seed e testes em `supabase/`.

RLS em todas as tabelas. Cliente não escreve pontuações, XP, moedas, níveis ou conquistas diretamente e não lê `daily_words`/`game_limits`. Perfis públicos e rankings expõem só campos seguros; revogar acessos à tabela base e revisar permissões das views. Todas as RPCs privilegiadas terão identidade validada, `search_path` fixado, concessões explícitas, validação de parâmetros, limites e transações. Bloquear condições de corrida em saldo, compras, tentativas e importações.

RPCs obrigatórias: `submit_score`, `check_guess`, `get_leaderboard`, `get_my_stats`, `buy_item`, `equip_item`, `import_guest_data`, `delete_my_account`, `update_profile`. `submit_score` limita a uma partida por 5 segundos por jogo, valida métricas/duração/limites e retorna a verdade de XP, moedas, nível, recorde, conquistas e ranking. Não tratar métricas enviadas pelo navegador como prova de honestidade; limites reduzem abuso, mas não garantem invulnerabilidade a trapaças num jogo estático.

Decifra diário autenticado: resposta e tentativas ficam no servidor, 6 tentativas por dia/idioma; nenhuma resposta nas mensagens antes do fim. No modo visitante a resposta determinística local é inspecionável, com aviso honesto. Sem duplicar bônus ao reenviar uma partida.

XP e moedas: fórmula do capítulo 8.4 centralizada em JS e espelhada em SQL, com testes de equivalência. Definir bases por jogo, bônus e fração das moedas em constantes documentadas; desempenho limitado entre 0,5 e 2, sequência até +50%, limiar de nível `round(100 × n^1.5)` e nível não diminui. A animação local é uma prévia quando logado.

### Autenticação, menores e privacidade

E-mail/senha com confirmação, entrada/saída, recuperação e página dedicada de redefinição, sessão renovável, perfil editável e exclusão completa. Nome público único de 3–20 caracteres alfanuméricos/sublinhado, filtro nos 3 idiomas, validação e prevenção de duplo envio. Primeiro login via Google/link mágico exige escolha de nome antes de usar a área autenticada; visitante continua livre.

Conciliação do perfil automático com nome obrigatório: o gatilho criará um nome técnico único reservado e marcará o cadastro como incompleto para OAuth; atualização final validará nome escolhido. Não atribuir automaticamente um nome público derivado do e-mail. Documentar esse ajuste no SQL.

Google implementado, porém desativado por padrão até o usuário pedir a configuração. Link mágico se simples. País opcional, consentimento dos termos, declaração de idade, menores de 13 sem conta e fluxo de consentimento para 13–17 sujeito à revisão jurídica. Evitar armazenar data de nascimento completa se declaração suficiente. Exportação/exclusão, coleta mínima, sem anúncios/rastreadores e CSP restritiva. Textos legais em 3 idiomas com revisão profissional pendente.

### Diários, rankings e offline

Desafios de Decifra, Cruzadinha, Escada e TypeRush. A data muda à meia-noite no fuso IANA do jogador. Mesmo conteúdo por data civil e idioma; o servidor calcula a data com seu próprio relógio e fuso validado do perfil, não aceita uma data arbitrária do cliente. Mudanças de fuso não podem conceder dois bônus no mesmo intervalo; regra final e testes de horário de verão serão documentados. O padrão vem do navegador, não de um fuso fixo para todos.

Rankings por jogo/modo, idioma, país, dia/semana/mês/geral, paginação, posição do usuário e dados públicos mínimos. Perfil com gráficos, histórico, estatísticas e vitrine; pelo menos 40 conquistas traduzidas. Loja apenas com moedas de jogo e itens equipáveis.

Manifesto e service worker: cache versionado de arquivos e conteúdo para todos os jogos visitantes, atualização segura e aviso claro para funções online. Não cachear sessões, respostas privadas, pontuações remotas nem respostas secretas. Verificar disponibilidade offline de cada jogo e de seus dados, não apenas da home.

## Tarefas na ordem do capítulo 16

### Fase 0 — Fundação

- [x] Item 0: criar plano e guia inicial, consultar documentação oficial.
- [ ] Item 0: usuário confirma Node/npm, depois VS Code, Git e navegador, uma etapa por vez.
- [x] Item 1: criar árvore de pastas e configuração; utilidades npm, compatibilidade Windows, design/tokens/5 temas e todos os módulos de núcleo.
- [x] Item 2: cabeçalho, casco, HUD, tutorial, resultados, home, catálogo e filtros.
- [ ] Item 0: transferir a versão implementada ao Windows e confirmar o site no navegador.
- [x] Item 3: gerar migrações, RLS, RPCs, seed e testes; cliente, auth, api, guest; login, redefinição e ajustes iniciais.
- [ ] Item 3: orientar dados públicos, configurações Auth/URLs, aplicação de SQL pelo usuário e testes remotos.
- [x] Rodar testes do núcleo/i18n/SQL local possível, revisar criticamente, registrar limites e atualizar o plano. Validação remota exige ação do usuário e será distinguida da validação local.

### Fase 1 — Núcleo jogável

- [x] Item 4: TypeRush — clássico 15/30/60/120 s e 25/50/100 palavras, palavras/frases/textos, pontuação/maiúsculas, aceleração e sobrevivência; pressão, PPM/precisão/combos, gráfico temporal e letras mais erradas.
- [x] Item 5: Decifra — diário servidor/visitante, infinito 4/5/6 letras, dueto 7 tentativas, quarteto 9, modo difícil, palavras válidas, teclado e resultados sem spoiler.
- [x] Item 6: Word-Man — 8 labirintos, letras em ordem, 3 vidas, pílulas, 4 IAs distintas, túneis, progressão, teclado/toque e arte original.
- [x] Item 7: perfil, gráficos, histórico, integração de resultados, XP/níveis/moedas e importação de visitante de ponta a ponta.
- [x] Testar e corrigir localmente; registrar evidências e limites em VALIDACAO e ações posteriores em PENDENCIAS; atualizar plano.

### Fase 2 — Expansão

- [x] Item 8: Cruzadinha — 10 dicas, diário/livre, temas, 3 dificuldades, ajudas; gerador conexo com cruzamentos consistentes e pelo menos 60 grades/idioma (30 dias).
- [x] Item 9: Chuva — queda, especiais dourada/congelante/coração/bomba, vidas, níveis e combo.
- [x] Item 9: Space Letters — ondas, chefes a cada 5, escudo/tiro duplo/bomba, frases e arte original.
- [x] Item 9: Anagrama — relógio progressivo, modo avançado de múltiplas palavras e ajudas com custo.
- [x] Item 10: rankings completos, desafio diário unificado/sequência e pelo menos 40 conquistas traduzidas com recompensa.
- [x] Testar e corrigir localmente; registrar evidências e limites em VALIDACAO e ações posteriores em PENDENCIAS; atualizar plano.

### Fase 3 — Completar o fliperama

- [x] Item 11: Caça-Palavras — gerador testado, seleção mouse/toque, direções/dificuldades/temas, relógio e filtro de conteúdo.
- [x] Item 11: Forca — arte pixel original, letras/dicas, aposta de vida, temas e sequência.
- [x] Item 11: Escada — palavras válidas, uma letra por passo, busca em largura, caminho mínimo, dica e diário.
- [x] Item 12: Snake — ordem das letras, encolher ao errar, colisões, obstáculos e velocidade progressiva.
- [x] Item 12: Tetris de letras — posicionar, palavras em linhas/colunas, limpeza e reação em cadeia, aceleração e grade inicial.
- [x] Item 12: Flappy — toque/Espaço, portais de letras corretas, física e progressão.
- [x] Item 13: Intrusa — grupos, categorias progressivas, tempo e sequência.
- [x] Item 13: Ortografia — aprovar/rejeitar, acentos, explicações e tempo de resposta.
- [x] Item 13: Rimas — validade por idioma, sem repetição, relógio, bônus e combos.
- [x] Validar regras/métricas e ciclo visitante dos 16 jogos localmente. Conta real e toque em aparelho físico permanecem explicitamente pendentes.
- [x] Testar e corrigir localmente; registrar evidências e limites em VALIDACAO e ações posteriores em PENDENCIAS; atualizar plano.

### Fase 4 — Acabamento de produto

- [x] Item 14: loja/catálogos/equipar, cosméticos no perfil/ranking, ajustes completos, exportação e exclusão de dados/conta.
- [x] Item 15: PWA e offline, atualização do cache, ícones; SEO por página/idioma, Open Graph, imagem original, robots/sitemap/dados estruturados.
- [x] Item 15: desempenho, descarte de eventos/loops, carregamento sob demanda, revisão de acessibilidade e segurança/CSP/RLS, mensagens globais de erro e logs de desenvolvimento.
- [x] Item 16: testes locais finais e revisão do checklist do capítulo 15; corrigir falhas, registrar contagens reais e critérios ainda não verificados.
- [x] Item 16: finalizar README, GUIA, SETUP-SUPABASE, DEPLOY, LICENCAS, PENDENCIAS e este plano; orientar publicação e domínio.
- [x] Entrega final curta: o que foi feito, como rodar, como publicar, pendências; separar testes automáticos, validações do usuário e recursos não verificados.

## Validação e critérios de conclusão

- Testes Node: Decifra com letras repetidas; XP/nível/moedas; cruzadinhas conexas; caça-palavras; busca da Escada; acentos; JSON e conteúdo; chaves i18n; desafios determinísticos; limites e casos inválidos dos jogos.
- SQL: escrita direta em `scores` e XP bloqueada; `daily_words` inacessível; score impossível/rápido rejeitado; resposta diária secreta até o fim; isolamento de dois usuários. Executar localmente se houver recursos; no projeto remoto somente o usuário.
- Funcional: fluxo visitante completo e, após configuração, cadastro/confirmação/entrada/recuperação/importação/jogar/salvar/compra/exportar/excluir. Não considerar só uma porta aberta como validação.
- Navegador: três idiomas, cinco temas, teclado e toque, 320 px a 4K, foco/contraste/movimento, offline em cada jogo, desempenho e Lighthouse. Documentar limites do navegador disponível; Windows real exige confirmação do usuário.
- Publicação: arquivos estáticos em Cloudflare Pages; HTTPS, URLs Auth de produção e caminhos corretos. Conta, conexão GitHub, aplicação de SQL, testes remotos e publicação são pontos de ação do usuário.

## Suposições e decisões iniciais

1. Usar Node LTS vigente (linha 24 indicada pelo site oficial na consulta inicial); preferir o instalador oficial Windows. Não obrigar reinstalação se a versão suportada já estiver presente.
2. Recomendar Cloudflare Pages com integração GitHub e nenhum build de aplicação. `exit 0` é apenas uma configuração da hospedagem, não um comando PowerShell do projeto.
3. Desenvolver modo visitante e integração Supabase sem tocar no banco remoto. Os dados públicos recebidos foram aplicados ao cliente; configuração do serviço real fica documentada para depois da entrega.
4. Cliente Supabase 2.57.4 copiado localmente, com licenças e dependências identificadas, para tornar CSP/cache previsíveis.
5. Não ativar Google sem solicitação. Implementar suporte e documentação; registrar a validação OAuth como não executada até a configuração.
6. As quantidades de conteúdo são metas a medir, não dados já disponíveis. Revisão linguística, adequação etária e revisão jurídica serão explicitamente pendentes.
7. Não publicar, enviar commits ao remoto ou afirmar restauração de ambiente como consequência automática da criação destes documentos.

## Registro de verificações desta entrega

- Leitura integral da especificação e comparação dos requisitos com este plano.
- Node: página oficial de download consultada; LTS indicado como linha 24.
- VS Code/PowerShell: documentação oficial consultada pelo código-fonte público mantido pelos respectivos projetos.
- Git: documentação do projeto Git for Windows consultada; Supabase: guias oficiais de senha e redirecionamentos consultados; Cloudflare: guias oficiais de Pages estático/integração Git consultados.
- Alguns sites diretos foram bloqueados pela política de rede; fontes oficiais acessíveis via GitHub foram usadas quando disponíveis. A página específica de API keys não pôde ser consultada nesta entrega; reconferir antes da etapa Supabase.
- Implementação validada com 20 testes Node, duas suítes PostgreSQL locais e navegação/offline em Chromium. Evidências e limites em `VALIDACAO.md`.

## Situação final de implementação

Código de todas as fases entregue; aprovação integral de lançamento ainda não atingida. As marcações de implementação não são aprovação automática de lançamento: o usuário ainda aplicará SQL, validará e-mail/OAuth no Supabase real e publicará. Revisões humanas, metas editoriais abaixo do mínimo e validação Windows real estão em `PENDENCIAS.md`.

- Núcleo, 16 jogos, 11 páginas auxiliares, 5 temas básicos + 2 cosméticos, 40 conquistas, catálogo de loja, PWA/offline e documentos criados.
- 180 grades validadas: 60 por idioma, com 30 diárias por idioma. Contagens de conteúdo em `data/content-counts.json`.
- Testes Node e PostgreSQL local executados; testes de navegador incluindo resultados, persistência, idiomas, temas e offline. Detalhes atualizados em `VALIDACAO.md`.
- Nenhuma consulta/escrita no Supabase remoto e nenhuma publicação do site. Após falha do link do artefato, o proprietário autorizou enviar o código ao GitHub em `gigio-jpeg/LEXICADE`, branch `main`.
- Instruções Windows ficam para depois do pacote, conforme a orientação mais recente do usuário.
