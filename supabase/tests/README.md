# Testes PostgreSQL

`security.sql`, `economy.sql` e `social.sql` foram executados em PostgreSQL local isolado por PGlite 0.3.14, com esquema mínimo de Auth. Não acessam um servidor remoto. Para repetir opcionalmente no Windows:

```powershell
npm install --no-save --package-lock=false @electric-sql/pglite@0.3.14
```

```powershell
node supabase/tests/run-local.mjs
```

Essa dependência só é necessária para testes de banco locais, não para rodar o site nem `npm test`. O teste cria uma base em memória, aplica as migrações e seed e executa os três arquivos de segurança. Não use senhas, URLs ou chaves na execução local.

Para verificar **seu Supabase real**, após aplicar migrações e seed, você pode executar cada arquivo SQL pelo painel. Todos usam uma transação, usuários fictícios `example.invalid` e `rollback` ao final. Se houver erro antes do rollback, execute `rollback;` e investigue. O agente não executou esses arquivos no seu projeto.

Cobertura: privilégios/RLS, privacidade de perfis, isolamento entre usuários, escrita direta bloqueada, score impossível, rate limit, pistas com repetidas, limite de seis tentativas, segredo diário até o fim, importação com teto/sem ranking, compras idempotentes, equipar somente itens próprios, exportar dados e exclusão em cascata.

O mock não reproduz envio de e-mail, OAuth, políticas da infraestrutura ou toda a estrutura de `auth.users`. Teste essas partes no serviço real antes de publicar.

## Revisão 2

O harness também aplica `004_arcade_focus.sql` e valida limiares de 1, 2, 3 e 4 jogos nas conquistas. Em outra instância vazia, instala `INSTALAR-TUDO.sql` e repete as suítes de segurança/economia. O bundle é gerado por `node tests/generate-sql.mjs`. Não reaplique o instalador completo em um banco da versão anterior; aplique só 004.

## Revisão 2.1

O harness aplica também `005_arcade_social.sql`. `social.sql` verifica duelo com dois participantes, rejeição de terceiros, RLS, validação da frase no servidor, bloqueio de escrita direta, recompensa única e personalização com desbloqueios validados no servidor. O instalador único recebe as mesmas verificações. Para um banco existente com 004 aplicada, aplique somente 005.

## Modelos 2.3

A migração 007 mantém estilos sem model como Original, valida limites 5/15/30 e aceita classic livre. A suíte social verifica rejeição dos três modelos sem partidas, restauração livre e persistência dos três após 30 partidas criadas por fixture privilegiada. Os clientes continuam sem poder escrever diretamente em scores ou profiles.
