# Configurar seu Supabase

Esta etapa acontece **depois de receber e abrir o projeto**. Seu banco já foi criado e está vazio. Os arquivos SQL foram testados em PostgreSQL local isolado; não executei comandos contra seu projeto remoto.

## 1. Abrir o projeto existente

Entre em `https://supabase.com/dashboard`, abra seu projeto e aguarde ficar ativo. Não crie outro. Se pausado por inatividade, use **Restore / Restaurar** no painel. Se fosse um projeto novo, **New project** pediria nome, organização, região próxima dos jogadores e senha do banco; a senha seria digitada apenas no painel.

URL e publishable key recebidas já estão em `src/core/config.js`. Não coloque chaves secretas em nenhum arquivo. Os dois valores públicos reais não devem ser duplicados em `.env.example`, documentação ou scripts.

## 2. Criar tabelas e funções

Abra o arquivo indicado no VS Code, use Ctrl+A e Ctrl+C. No Supabase, abra **SQL Editor → New query**, cole tudo e pressione **Run**. Execute **um arquivo por vez**, nesta ordem:

1. `supabase/migrations/001_schema.sql`: tabelas, índices, RLS, gatilho de perfil e auxiliares privados.
2. `supabase/migrations/002_rpcs.sql`: validação de partidas, Decifra diário, compras, importação, perfil e exclusão.
3. `supabase/migrations/003_queries.sql`: perfil público seguro, ranking, estatísticas, desafios e exportação.
4. `supabase/seed.sql`: limites dos jogos, catálogo de conquistas/loja e vocabulário do servidor.

“Success. No rows returned” é normal para criação de estruturas. Se um arquivo falhar, pare e informe o nome do arquivo e o erro; não envie senhas ou dados pessoais. Cada migração usa uma transação. Se o editor informar que a transação está abortada, execute `rollback;` antes de investigar. Não repita uma migração já aplicada: as tabelas/funções são criadas uma vez. O seed admite reaplicação dos catálogos.

Depois confira no **Table Editor** se `profiles`, `scores` e os demais objetos apareceram. O usuário do painel é administrador: ver dados ali não demonstra o que um jogador pode ler. Nunca desligue RLS para tentar resolver uma falha do site.

As respostas diárias são sorteadas **dentro do servidor**, na primeira tentativa daquele dia/idioma. Não é necessário agendar um job ou preencher manualmente palavras todos os dias. `daily_words`, listas privadas, tentativas, limites e preços não têm acesso direto de clientes. O visitante usa uma escolha local determinística e inspecionável, informada na interface.

## 3. Autenticação por e-mail

Em **Authentication → Sign In / Providers → Email**, mantenha entrada por e-mail e **Confirm email** habilitados. Em **Authentication → URL Configuration**, durante o desenvolvimento:

- Site URL: `http://localhost:5173`.
- Redirect URLs: `http://localhost:5173/pages/login.html`, `http://localhost:5173/pages/redefinir-senha.html`, `http://localhost:5173/pages/escolher-nome.html`.

Na produção, Site URL será o endereço HTTPS publicado; cadastre os três caminhos equivalentes nesse domínio. Só mantenha localhost se você também for usar o ambiente local. Evite curingas amplos na produção. A porta precisa corresponder ao servidor; se usar 5174, ajuste as URLs locais.

O serviço padrão de e-mail Supabase é limitado e pode aceitar apenas endereços autorizados. Para testar com público externo ou lançar o site, configure um provedor SMTP em **Authentication → Email / SMTP Settings** se necessário. Preencha segredos diretamente no painel. Não cole senha SMTP nem tokens no chat. Verifique caixa de spam, configuração do remetente e logs de autenticação, sem expor mensagens contendo tokens.

Um e-mail local aberto em outro dispositivo não consegue acessar o servidor do seu computador: `localhost` se refere ao dispositivo onde o link foi aberto. Teste a confirmação no mesmo computador ou use a URL publicada.

## 4. Criar e testar uma conta

Com `npm start` rodando, abra o site, entre em **Entrar → Criar conta** e preencha nome público, e-mail, senha, faixa de idade e consentimentos. Use um nome diferente do seu nome real. Contas de menores de 13 são bloqueadas; visitantes continuam livres. A declaração de autorização para 13–17 precisa de revisão jurídica antes do uso público.

Confirme o e-mail, entre e termine uma partida. Em **Table Editor → scores**, a linha deve corresponder a jogo, modo, idioma, pontuação e data. No perfil, confira XP, moedas e recorde. Teste sair e entrar de novo. Recuperação de senha usa uma página dedicada; teste com uma conta de teste antes de publicar.

A aplicação oferece importar progresso visitante. XP máximo importado: 1.000; moedas: 250; até 100 recordes, com limites por jogo e teto de 50.000 pontos por recorde. A importação é única por conta e os recordes importados ficam em `guest_bests`, fora dos rankings. Eles continuam visíveis no seu perfil privado.

## 5. Testes de segurança no painel

Depois das migrações e seed, execute `supabase/tests/security.sql`. Ele cria dois usuários fictícios **dentro de uma transação** e desfaz tudo ao final. Demonstra bloqueios de escrita direta, isolamento, limite de taxa, pistas com letras repetidas e resposta secreta até o fim. O resultado esperado termina com `PASS`.

Depois execute `supabase/tests/economy.sql`: importação limitada/idempotente, recordes privados, compra sem duplicar cobrança, equipar apenas itens próprios, exportação e exclusão em cascata. Também desfaz tudo no final. Se um teste falhar, execute `rollback;` e investigue antes de publicar. Não altere uma assertion para esconder a falha.

Esses arquivos foram aprovados no PostgreSQL local com uma representação mínima de Supabase Auth. A execução no serviço real continua necessária porque Auth e configurações da plataforma não são reproduzidos integralmente no teste local.

## 6. Google (opcional, desligado inicialmente)

Somente quando quiser ativar:

1. No Google Cloud Console, crie/selecione um projeto e abra a configuração de **Google Auth Platform / OAuth consent**. Preencha dados do aplicativo e adicione usuários de teste se o consentimento estiver em teste.
2. Em **Clients / Credentials**, crie um cliente OAuth do tipo **Web application**. Adicione origem local e origem HTTPS de produção autorizadas.
3. Em **Supabase → Authentication → Providers → Google**, copie a URL de callback fornecida e cadastre-a nas **Authorized redirect URIs** do cliente Google. O callback do Google é do Supabase; não é a página de login do site.
4. Preencha client ID e client secret **apenas no painel Supabase**, habilite o provedor e salve. Nunca cole o secret no código/chat.
5. Confirme Redirect URLs do próprio site, incluindo `pages/escolher-nome.html`.
6. Em `src/core/config.js`, altere `googleEnabled` para `true`, publique essa alteração e teste o fluxo completo. Quem não tem nome público/consentimentos vai para a página de conclusão de cadastro. O gatilho cria um identificador reservado até essa escolha.

Link mágico é oferecido para entrar em uma conta existente; não cria contas sem passar pela faixa etária/consentimento do cadastro.

## 7. Regras documentadas

- O dia de desafios e sequência usa o relógio do servidor e o fuso IANA do perfil, inicialmente vindo do navegador. O servidor rejeita datas arbitrárias enviadas pelo cliente. Alterações de fuso são limitadas a uma por 30 dias para dificultar duplicação de bônus. Horário de verão é tratado pelo PostgreSQL e `Intl`.
- Rankings de dia/semana/mês usam UTC; semana começa na segunda. Essa referência única mantém a comparação entre jogadores consistente.
- Taxa: no máximo uma partida por 5 segundos **por jogo**, com trava no perfil e verificações transacionais.
- XP base 30; desempenho limitado a 0,5–2; recorde +10; diário +20; sequência +1% por dia até +50%; moedas 20% do XP antes de recompensas de conquistas. JS e SQL usam as mesmas fórmulas; o retorno do servidor vale para a conta.
- As demais partidas verificam limites, métricas, duração e consistência, mas um cliente estático não é prova criptográfica de que alguém jogou honestamente. Uma implantação competitiva exige monitoramento e revisão adicional de trapaças.

## Referências

Guias oficiais: [senha](https://supabase.com/docs/guides/auth/passwords), [redirecionamentos](https://supabase.com/docs/guides/auth/redirect-urls), [Google](https://supabase.com/docs/guides/auth/social-login/auth-google), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [API keys](https://supabase.com/docs/guides/api/api-keys). Rótulos do painel podem mudar.
