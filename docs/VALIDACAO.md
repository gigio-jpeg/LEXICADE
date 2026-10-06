# LEXICADE — evidências de validação

Validação executada em 6 de outubro de 2026 na máquina da nuvem, Node.js 24.19.0, Chromium Linux e PostgreSQL local PGlite 0.3.14. Nenhum comando foi executado contra o Supabase remoto do usuário. As limitações e metas editoriais incompletas estão em `PENDENCIAS.md`.

## Testes Node sem dependências

`npm test`: **20 testes aprovados**, zero falhas. Exercitam pistas do Decifra com letras repetidas, modo difícil, acentos/pontuação, dia/fuso e determinismo, XP/níveis/moedas, cruzadinha conexa, caça-palavras, BFS da Escada, anagramas, Forca, Snake, limpeza/gravidade de letras, oito labirintos/quatro IAs, efeitos de Chuva, física de Flappy, ortografia/rimas, idempotência dos diários visitantes, conteúdo/i18n e integridade dos módulos/HTML.

`npm run validate`: verifica esquema, normalização, duplicatas, chaves dos três idiomas, respostas presentes nas palavras válidas, catálogos e **180 grades de cruzadinha**. Emite avisos explícitos para as metas abaixo do mínimo; esses avisos não são falhas escondidas ou aprovação editorial.

`npm run crosswords`: gerador reproduzível de 60 grades por idioma; pelo menos 30 para os diários. Grades verificadas quanto a interseções, adjacências e conexão.

## PostgreSQL local

Aplicadas do zero as três migrações e o seed em PGlite. O harness cria apenas a superfície mínima de Auth (`auth.users`, `auth.uid()` e papéis); executa o mesmo SQL entregue, sem conectar ao projeto do usuário.

- `security.sql`: dois usuários fictícios e rollback; escrita direta bloqueada, dados privados isolados, funções auxiliares privadas, score impossível/taxa rejeitados, pistas com repetição, segredo diário preservado até fim e limite de tentativas.
- `economy.sql`: teto e importação única, recordes importados fora do ranking, compra repetida sem cobrança dupla, equipar só itens próprios, exportação, exclusão em cascata e comparação de XP/nível JS com SQL.
- Ambas as suítes terminaram com `PASS`. Instruções de reprodução em `supabase/tests/README.md`.

Isso valida SQL/PostgreSQL local. Não prova funcionamento do serviço Auth, e-mail, OAuth, configuração RLS/URLs da plataforma publicada nem integração com uma sessão real; repetir os testes no projeto conforme `SETUP-SUPABASE.md`.

## Navegador e servidor

Servidor iniciado com `npm start`, arquivos servidos com MIME de ES Modules e jogos carregados via HTTP. Foram realizados testes externos de Playwright na nuvem; Playwright não é dependência para o usuário rodar o site.

- Os **16 jogos** carregaram e chegaram a resultados por interação ou esgotamento de tempo/vidas. TypeRush, Cruzadinha, Escada, Caça-Palavras e jogos de reflexo tiveram partidas com acertos e pontuação; jogos Canvas também tiveram ciclo de início/atualização/fim verificado.
- TypeRush: partida de 25 palavras, resultado e reinício em sobrevivência; Decifra: infinito, dueto e quarteto; cruzadinha: preenchimento das dez respostas; Forca: fim de rodada; anagrama: três respostas; Intrusa/Ortografia: fim; rimas: repetição rejeitada; Tetris: queda rápida e fim. Gravação visitante e páginas auxiliares exercitadas. Verificada a página 404 em caminho profundo e corrigida a preservação de quadros resolvidos/compartilhamento no Decifra de múltiplos quadros.
- **100 verificações de layout**: home, 16 jogos e oito páginas, nas larguras 320, 768, 1440 e 3840 px; nenhuma largura horizontal excedente detectada. Isso não substitui revisão visual de cada estado autenticado.
- Home nos **três idiomas e cinco temas**; catálogo com 16 cartões em todos. Revisão visual por capturas desktop/mobile.
- **Offline dos 16 jogos**: aguardar instalação do service worker, cortar rede, abrir cada página e iniciar; dados e módulos disponíveis, aviso offline presente e nenhum erro JavaScript. Sem cache de respostas Supabase ou segredos do diário de conta.
- As verificações funcionais de visitante bloquearam destinos Supabase; não dependeram de uma consulta remota para passar.

## Não executado / sem aprovação de lançamento

Cadastro com e-mail real, recuperação/Google, todas as operações em conta real, SMTP, redirects de produção, deploy, domínio, Windows real, Safari/Firefox/leitor de tela, medição de 60 FPS e Lighthouse. Nenhum desses itens é apresentado como aprovado. Os textos legais e o conteúdo ainda dependem de revisão humana.

## Repetir antes de publicar

1. `npm test` e `npm run validate`.
2. Servir o site, concluir uma partida visitante, recarregar e confirmar progresso.
3. Aplicar SQL pelo painel, executar os testes transacionais e testar uma conta de teste de ponta a ponta.
4. Definir domínio/metadados e URLs Auth; auditar conteúdo, termos e acessibilidade.
5. Publicar, testar caminhos/conta e instalar/cachear todos os jogos para repetir offline.
