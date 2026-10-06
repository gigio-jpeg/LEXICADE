# LEXICADE — guia para iniciantes no Windows

Vamos fazer **um passo por vez**. No chat, eu apresento uma etapa, você a executa e me diz o resultado. Só então seguimos. Você não precisa fazer este documento inteiro agora.

**O projeto está disponível em `gigio-jpeg/LEXICADE` no GitHub.** Primeiro baixe e extraia o pacote; depois siga as instalações abaixo. Os 16 jogos estão implementados e o modo visitante foi testado. O Supabase real ainda precisa receber as migrações por você; envio de e-mail e Google dependem de configuração e validação no serviço.

## Antes de começar

- Seu computador Windows e a máquina da nuvem são lugares diferentes. Instalar aqui na nuvem não instala no seu computador.
- O ZIP do GitHub contém a pasta `LEXICADE-main` com site, dados, testes, SQL e documentos. Você pode baixar e rodar sem usar Git. O envio ao repositório foi autorizado por você; isso não publica o site.
- Seu projeto Supabase já existe. Não vamos criar outro. A URL e a publishable key recebidas já estão somente em `src/core/config.js`. Não precisa preencher esses dois campos novamente.
- Nunca envie pelo chat a senha do banco, senha da conta, secret key, service_role ou tokens. Se houver uma senha necessária, você a digita no seu computador ou no painel oficial.
- Quando eu mostrar um comando, copie somente o texto dentro do bloco. Cole no PowerShell e pressione **Enter**. Execute uma linha por vez.

## Passo 0 — Baixar e extrair o projeto

1. Abra https://github.com/gigio-jpeg/LEXICADE, clique no botão **Code** e depois em **Download ZIP**. O arquivo normalmente se chama `LEXICADE-main.zip`.
2. No Explorador de Arquivos do Windows, clique com o botão direito no ZIP e escolha **Extrair Tudo**.
3. Escolha uma pasta simples, por exemplo `C:\Users\SeuUsuario\Projetos`. O ZIP do GitHub contém uma pasta chamada `LEXICADE-main`. Você pode renomear essa pasta para `LEXICADE` para seguir os exemplos do guia.
4. Abra a pasta extraída e confirme que nela existem `index.html`, `package.json`, `docs`, `src` e `supabase`. Não execute o projeto dentro do ZIP.

**Confirmação:** os arquivos aparecem fora do ZIP. Agora vamos ao Node.js. Não é necessário instalar dependências com npm para jogar.

## Passo 1 — Instalar ou verificar o Node.js

Node.js permite rodar o servidor local e os testes. npm vem junto e serve para executar os comandos do projeto.

**Se já tiver instalado:** abra o menu Iniciar do Windows, digite **PowerShell** e abra **Windows PowerShell** ou **PowerShell**. Uma janela de terminal vai aparecer. Não precisa escolher “Executar como administrador”. Execute:

```powershell
node --version
```

Depois:

```powershell
npm --version
```

O primeiro deve mostrar algo como `v24.x.x`; o segundo, um número de versão. O `x` é apenas um exemplo: você verá números. Se funcionarem, me diga os resultados antes de instalar novamente. Na consulta inicial ao site oficial, a linha 24 era a LTS recomendada; a revisão exata muda com atualizações.

**Se não estiver instalado ou aparecer “não é reconhecido”:**

1. Abra [nodejs.org/en/download](https://nodejs.org/en/download) no navegador.
2. Escolha a versão identificada como **LTS**, o sistema **Windows** e o **Windows Installer (.msi)**. Não use comandos de Docker nem a versão “Current”. Normalmente o computador usa x64; se for Windows ARM, escolha ARM64. Em caso de dúvida, veja **Configurações → Sistema → Sobre → Tipo de sistema**.
3. Abra o arquivo baixado. Avance com **Next**, aceite a licença e mantenha as opções padrão, incluindo npm e PATH.
4. Se aparecer a opção de instalar ferramentas adicionais para módulos nativos, deixe-a desmarcada: nosso site não precisa delas.
5. Conclua com **Install** e **Finish**. Uma confirmação de permissão do Windows pode aparecer para o instalador oficial.
6. Feche qualquer terminal aberto e abra novamente o PowerShell pelo menu Iniciar. Rode os dois comandos de verificação acima, um por vez.

**Como saber que deu certo:** os dois comandos mostram versões. Se o npm informar bloqueio de scripts, teste `npm.cmd --version` e veja a seção de problemas comuns. Não mude configurações gerais do Windows sem necessidade.

**Pare aqui.** Me diga as duas versões ou copie o erro, sem dados pessoais. Eu confirmo o resultado e apresento o passo 2.

Alternativa para quem já usa o gerenciador do Windows: `winget install --id OpenJS.NodeJS.LTS --exact`. Escolha instalador **ou** winget; não precisa fazer ambos.

## Passo 2 — Instalar o Visual Studio Code

Faça esta etapa quando chegarmos a ela no chat. O VS Code é o programa em que vamos abrir os arquivos do projeto.

1. Abra [code.visualstudio.com/download](https://code.visualstudio.com/download).
2. Para Windows, escolha **User Installer**, na arquitetura do seu computador. O instalador para o usuário é a recomendação oficial para a maioria das pessoas.
3. Execute o instalador, aceite a licença e mantenha as opções padrão. Deixe marcada a opção **Add to PATH / Adicionar ao PATH**. A opção de abrir pastas com o VS Code pelo botão direito também é útil, se oferecida.
4. Conclua e abra o VS Code pelo menu Iniciar.
5. Feche e reabra o PowerShell e execute:

```powershell
code --version
```

**Confirmação:** o editor abre e o comando mostra a versão; também pode mostrar outras linhas de identificação. Se o comando falhar, mas o editor abrir, a instalação pode estar correta e faltar atualizar o PATH.

HTML, CSS e JavaScript já têm suporte integrado. Extensões úteis, opcionais: **Portuguese (Brazil) Language Pack**, da Microsoft, e **Prettier - Code formatter**, do Prettier. Abra o painel de extensões com **Ctrl+Shift+X**, procure o nome, confira o publicador e clique em **Install**. Não habilite formatação automática para todo o projeto por enquanto. Não é necessário instalar Live Server; usaremos o servidor do próprio projeto.

Alternativa: `winget install --id Microsoft.VisualStudioCode --exact`.

**Pare e confirme** que o editor abriu. Não avance para o Git antes da orientação no chat.

## Passo 3 — Instalar o Git para Windows

Git guarda versões do projeto. GitHub é o serviço online onde está seu repositório; são coisas diferentes.

1. Abra [git-scm.com/install/windows](https://git-scm.com/install/windows), que aponta para a distribuição oficial Git for Windows.
2. Baixe o instalador para sua arquitetura e abra-o.
3. Mantenha os padrões recomendados. Se houver escolha de editor, pode selecionar Visual Studio Code. Na opção de PATH, mantenha **Git from the command line and also from 3rd-party software**; isso permite usar Git no PowerShell.
4. Termine, feche e reabra o terminal.
5. Execute:

```powershell
git --version
```

**Confirmação:** uma linha semelhante a `git version 2.x.x.windows.x`. Não precisa copiar exatamente os números do exemplo.

Alternativa: `winget install --id Git.Git --exact`.

**Pare e confirme.** Não faça login em ferramentas nem gere tokens para me enviar.

## Passo 4 — Atualizar o navegador

Use Edge, Chrome ou Firefox atualizado. No Windows, o Edge já costuma estar disponível.

No Edge: menu **… → Ajuda e comentários → Sobre o Microsoft Edge**. Aguarde a verificação e reinicie se solicitado. No Chrome: **⋮ → Ajuda → Sobre o Google Chrome**. No Firefox: **☰ → Ajuda → Sobre o Firefox**.

**Confirmação:** a página informa que está atualizado. Me confirme antes de seguir.

## Passo 5 — Contas que vamos usar

- **GitHub:** usar a conta que tem acesso a `gigio-jpeg/LEXICADE`. Não precisamos criar outro repositório.
- **Supabase:** usar seu projeto já criado e vazio; por enquanto basta saber acessar o painel. Nenhuma mudança no banco nesta etapa.
- **Cloudflare:** minha recomendação para hospedar os arquivos estáticos gratuitamente com Pages. A conta só será necessária na publicação; verifique as condições atuais do plano gratuito.
- **Google Cloud:** somente se você pedir para ativar entrada com Google. O botão ficará desligado até a configuração. Não precisa criar essa conta agora.

Contas e configurações que você precisa fazer serão apresentadas uma por vez. As instalações anteriores não dependem de contratar serviços pagos.

## Passo 6 — Trazer o projeto para o Windows

**Se você extraiu o ZIP no passo 0, esta parte já está feita.** Pule os comandos de clone e siga para abrir a pasta no VS Code. O caminho via Git é uma alternativa ao ZIP, útil para acompanhar versões.

Para baixar via Git, abra o PowerShell pelo menu Iniciar e execute uma linha por vez:

```powershell
New-Item -ItemType Directory -Path "$HOME\Projetos" -Force
```

```powershell
Set-Location "$HOME\Projetos"
```

```powershell
git clone https://github.com/gigio-jpeg/LEXICADE.git
```

```powershell
Set-Location .\LEXICADE
```

Se a pasta já existir, **não apague nem repita o clone sobre ela**. Me avise para verificarmos o conteúdo. Se o repositório for privado, o Git pode abrir a autenticação no navegador. Você entra diretamente no GitHub; não compartilhe tokens.

Para saber em que pasta está:

```powershell
Get-Location
```

Para listar os arquivos:

```powershell
Get-ChildItem
```

**Confirmação:** o caminho termina em `\Projetos\LEXICADE` e existem `index.html`, `package.json` e a pasta `docs`. Se faltarem, pare e me avise.

Alternativa para o ZIP: extraia tudo com **Extrair Tudo**, abra a pasta que realmente contém `index.html` e `package.json`, e use **Arquivo → Abrir Pasta** no VS Code. Não abra o projeto dentro do ZIP.

## Passo 7 — Abrir a pasta e o terminal no VS Code

1. No VS Code, escolha **Arquivo → Abrir Pasta** (ou **File → Open Folder**).
2. Selecione `LEXICADE`, a pasta que contém os arquivos do projeto, e clique em **Selecionar Pasta**. Confie somente se for a pasta que acabamos de obter do seu repositório.
3. Abra **Terminal → Novo Terminal** (ou **Terminal → New Terminal**).
4. No painel inferior, confira se o terminal é **PowerShell**. Se não for, use a seta ao lado do botão **+**, escolha **Selecionar Perfil Padrão → PowerShell** e abra um novo terminal.
5. Execute `Get-Location` para conferir a pasta. Se estiver na pasta errada, use `Set-Location` com o caminho completo entre aspas, por exemplo:

```powershell
Set-Location "C:\Users\SeuUsuario\Projetos\LEXICADE"
```

Substitua `SeuUsuario` pelo nome do seu usuário Windows. Não copie esse exemplo sem ajustar. Aspas protegem caminhos com espaços ou acentos; preferimos uma pasta simples como `Projetos\LEXICADE`.

**Confirmação:** a lista de arquivos aparece à esquerda e o terminal está na pasta certa. Depois da instalação do VS Code, `code .` nessa pasta também pode abri-la.

## Passo 8 — Abrir o site localmente

O servidor é uma utilidade Node, sem build obrigatório. Não abra o HTML por duplo clique: módulos e JSON precisam de um endereço HTTP.

Na pasta do projeto, com `package.json` presente:

```powershell
npm start
```

A implementação deverá mostrar o endereço `http://localhost:5173`. Abra esse endereço no navegador. Mantenha o terminal aberto enquanto usa o site. Se o PowerShell bloquear npm, use `npm.cmd start`.

**Confirmação:** aparece a home LEXICADE, os estilos carregam e o modo visitante abre sem pedir cadastro. Os 16 jogos estão no catálogo. Limitações de conteúdo e revisões necessárias estão em `PENDENCIAS.md`.

Para parar: volte ao terminal e pressione **Ctrl+C**. Se perguntar se deseja encerrar, confirme. Para iniciar outra vez, rode o comando novamente.

Os comandos de rodar e testar foram executados na nuvem. O site e os testes Node não têm dependências que precisem de `npm install`. O cliente Supabase está incluído com versão fixada; testes PostgreSQL locais usam uma dependência opcional, descrita em `supabase/tests/README.md`.

## Passo 9 — Ligar seu projeto Supabase

Faça esta etapa depois de confirmar o modo visitante no seu computador. Os módulos de conta e as migrações já foram entregues e testados localmente. Você executa o SQL no seu painel; não rodei comandos contra seu banco remoto. Consulte também `SETUP-SUPABASE.md`.

### 9.1 Abrir o projeto existente e conferir os dados públicos

1. Entre em [supabase.com/dashboard](https://supabase.com/dashboard).
2. Abra o projeto já criado. Não clique em criar outro.
3. Se estiver pausado, use **Restore / Restaurar** e aguarde ficar ativo.
4. Abra **Connect / Conectar** ou as configurações do projeto para localizar **Project URL**. A chave estará em **Settings → API Keys** ou na área de conexão, conforme a interface atual.
5. Copie a **publishable key**, normalmente começando com `sb_publishable_`. Não escolha secret nem service_role.
6. Os valores públicos recebidos já foram preenchidos em `src/core/config.js`, nos campos `supabaseUrl` e `supabaseKey`. Confira pelo painel apenas se quiser confirmar que são os corretos. `.env.example` contém exemplos; nenhum segredo é necessário no front-end.

**Configuração atual:** os dados públicos corretos foram recebidos depois do anexo e já estão no arquivo de configuração. Não é necessário reenviá-los. Para trocar de projeto no futuro, altere apenas os dois campos públicos nesse arquivo.

Se fosse necessário criar um projeto do zero: o caminho é **New project**, escolher organização/plano gratuito, nome e região próxima dos jogadores, definir a senha do banco diretamente no painel e aguardar provisionar. Esse caminho é referência; para você, vamos aproveitar o projeto existente.

### 9.2 Aplicar migrações e seed no SQL Editor

Migrações são arquivos que criam tabelas, regras de acesso e funções no banco. A ordem importa.

1. Abra `supabase/migrations/` no VS Code.
2. Execute nesta ordem: `001_schema.sql`, `002_rpcs.sql`, `003_queries.sql`; depois `supabase/seed.sql`. Não pule arquivos e não repita uma migração já aplicada.
3. Abra o primeiro arquivo; copie seu conteúdo inteiro com **Ctrl+A**, depois **Ctrl+C**.
4. No painel Supabase, abra **SQL Editor → New query / Nova consulta**, cole e clique em **Run / Executar**. Não execute apenas um trecho selecionado.
5. Me diga o resultado e **pare antes de aplicar o próximo arquivo**. Só seguimos se não houver erro. Uma mensagem como “Success. No rows returned” é normal quando o arquivo cria estruturas.
6. Repita um arquivo por vez até concluir as migrações; depois aplicaremos `supabase/seed.sql` da mesma forma.
7. Confira no **Table Editor** se as tabelas esperadas apareceram. Os testes específicos de RLS ficam em `supabase/tests/` e serão orientados depois, sem enfraquecer as permissões para fazer o site funcionar.

Não desative RLS para resolver erros. Não repita uma migração com erro sem diagnóstico. Não cole aqui tabelas contendo e-mails ou dados de usuários.

### 9.3 Ativar e-mail e confirmação

No painel, procure **Authentication → Sign In / Providers → Email** (os rótulos podem variar). Confirme que a entrada por e-mail está habilitada e que **Confirm email** está ativado; em projetos hospedados a confirmação costuma vir habilitada por padrão. Salve se necessário.

O envio padrão de e-mails tem limites e pode exigir endereços previamente autorizados. Para testar com outros usuários ou lançar o produto, poderemos precisar de um provedor SMTP. Nesse caso, as credenciais são preenchidas por você no painel, nunca no chat nem no repositório. Configurar isso será uma etapa própria, apenas se necessário.

### 9.4 URLs de redirecionamento

Abra **Authentication → URL Configuration**. Estas URLs indicam para onde o usuário volta depois de confirmar e-mail ou recuperar senha.

Durante testes locais, usar **Site URL** `http://localhost:5173`. As URLs adicionais correspondem às páginas implementadas:

- `http://localhost:5173/pages/login.html`
- `http://localhost:5173/pages/redefinir-senha.html`
- `http://localhost:5173/pages/escolher-nome.html`

Na publicação, o **Site URL** passa a ser o endereço HTTPS final. Adicione as três URLs equivalentes desse domínio; mantenha as locais somente se continuar desenvolvendo no seu computador. Não autorize domínios desconhecidos nem curingas amplos em produção. Se a porta local mudar, atualize as URLs durante os testes.

**Confirmação:** as URLs foram salvas e coincidem com o servidor local. Os caminhos acima estão implementados.

### 9.5 Google, somente se você pedir

Vamos criar/configurar um cliente OAuth no Google Cloud, preencher consentimento e domínios, copiar o callback fornecido pelo Supabase para o Google e inserir os dados OAuth diretamente no painel Supabase. O client secret nunca vai para `config.js` nem para o chat. Só depois ativaremos a opção pública que mostra o botão Google no site. A conta ficará em modo visitante ou e-mail enquanto isso.

## Passo 10 — Testar o que foi construído

Os testes abaixo estão disponíveis. A validação local passou; o fluxo remoto precisa ser confirmado depois de aplicar o SQL.

### Teste automático local

Na pasta do projeto, execute:

```powershell
npm test
```

**Resultado esperado:** testes executados, contagem maior que zero e nenhuma falha. Se houver erro, copie somente a parte relevante. Uma execução com zero testes não demonstra que está funcionando.

### Teste visitante

Abra o servidor local, clique em **JOGAR AGORA**, conclua uma partida, confira o resultado e recarregue a página para verificar o recorde. Confira idioma, tema, som, pausa e teclado. A PWA já está implementada: aguarde o primeiro carregamento com internet, depois use o modo offline do navegador para verificar os jogos visitantes. Instalação como app depende do navegador e será conferida no Windows.

### Teste de conta e salvamento

1. Com o Supabase configurado, abra **Entrar → Criar conta**. Use um nome público que não exponha seu nome real, seu e-mail e uma senha que você não vai me enviar. Leia/aceite os termos e as regras de idade.
2. Abra seu e-mail e confirme a conta. O servidor local precisa estar ligado para o retorno ao endereço local funcionar. Se abrir em outro dispositivo, `localhost` apontará para esse outro dispositivo; faça o teste no mesmo computador ou use o site publicado.
3. Entre e escolha o nome público se solicitado. Se houver progresso visitante, teste a oferta de importação uma única vez.
4. Conclua uma partida de TypeRush e confira a confirmação de salvamento, XP e moedas no perfil.
5. No painel Supabase, abra **Table Editor → scores**, atualize a tabela e veja a nova linha: jogo, modo, idioma, pontuação e data devem corresponder à partida.
6. Sair/entrar novamente deve preservar o progresso. Testaremos recuperação, alteração de senha e exclusão com uma conta de teste, sem apagar sua conta principal.

**Confirmação:** a partida aparece no banco e no perfil. Se só existir localmente ou houver erro de envio, o fluxo online ainda não está validado. Estar vendo tabelas como administrador no painel não prova que RLS funciona: os testes de segurança simularão o papel do cliente comum.

## Passo 11 — Publicar com Cloudflare Pages

Faça depois de validar o site, seguindo `DEPLOY.md`. Os arquivos já estão no GitHub. A criação dos arquivos na nuvem não publica o site automaticamente. Publicar exige uma ação sua; vou parar em cada etapa.

1. Crie/acesse sua conta em [dash.cloudflare.com](https://dash.cloudflare.com/).
2. Procure **Workers & Pages**, **Create application** e a opção **Pages → Connect to Git / Import an existing Git repository**, conforme a interface vigente.
3. Autorize a integração GitHub pelo navegador e selecione `gigio-jpeg/LEXICADE`. Limite o acesso ao necessário.
4. Na configuração, use branch de produção **main**, framework **None**, diretório raiz do repositório e diretório de saída **.** (a raiz que contém `index.html`).
5. Não temos build do aplicativo. A documentação Pages recomenda o comando `exit 0` para projetos estáticos sem build. Esse texto é preenchido no campo **Build command** do painel Cloudflare; **não o execute no PowerShell**.
6. Clique em **Save and Deploy** e aguarde sucesso. Abra o endereço `https://<nome>.pages.dev` que o painel fornecer.
7. Confirme home, caminho de um jogo, modo visitante e estilos. Depois atualize Site URL e redirects do Supabase para esse endereço HTTPS, como na etapa 9.4.
8. Teste confirmação de e-mail, login, recuperação e salvamento na versão publicada. Se algum fluxo falhar, a publicação ainda precisa de correção.

Não coloque segredos em variáveis do build para tentar torná-los acessíveis ao navegador. O site é estático e lê os dois valores públicos em `config.js`; não lê `.env` automaticamente.

Depois, se quiser domínio próprio: no projeto Pages, abra **Custom domains → Set up a custom domain** e siga as instruções DNS do painel. Comprar domínio é opcional e pode ter custo. Após ativar HTTPS no domínio, atualize também URLs do Supabase, metadados e sitemap.

## Problemas comuns

### “A execução de scripts foi desabilitada neste sistema”

O PowerShell pode bloquear o arquivo `npm.ps1`, embora Node esteja instalado. Primeiro use a alternativa sem alterar a política:

```powershell
npm.cmd --version
```

Nos comandos do projeto, também é possível usar `npm.cmd start` e `npm.cmd test`.

Se você quiser liberar scripts locais só para seu usuário, no PowerShell comum:

```powershell
Get-ExecutionPolicy -List
```

Guarde a política anterior de `CurrentUser`. Depois:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

Leia e confirme a pergunta do próprio PowerShell se concordar. `RemoteSigned` permite scripts locais e exige assinatura em scripts identificados como baixados da internet; não autoriza executar arquivos desconhecidos com segurança. Não use `Unrestricted`, não altere `LocalMachine` e não tente contornar políticas da empresa. Se houver política administrada, mantenha `npm.cmd` ou peça suporte ao administrador. Para desfazer, restaure o valor anterior; se era `Undefined`, use `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy Undefined`.

### “Node/npm/git/code não é reconhecido”

Feche e reabra terminal e VS Code depois da instalação. Confira se o instalador terminou e adicionou o programa ao PATH. Não reinstale repetidamente; me diga qual comando falha. Se for apenas `code`, ainda dá para abrir o editor pelo menu Iniciar e a pasta por **Arquivo → Abrir Pasta**.

### Porta ocupada

Se houver outro terminal rodando nosso servidor, pare-o com **Ctrl+C**. Não encerre processos desconhecidos. O servidor aceita:

```powershell
npm start -- --port 5174
```

Esse comando já é aceito pelo servidor. A URL será `http://localhost:5174`; para testar contas nessa porta, os redirects do Supabase também precisam corresponder. Me avise antes de alterar tudo.

### Pasta errada, espaços, acentos ou arquivos no OneDrive

Use `Get-Location` e `Get-ChildItem`. Caminhos com espaços ficam entre aspas: `Set-Location "C:\Minha Pasta\LEXICADE"`. Prefira `Projetos\LEXICADE` para simplificar; não use a pasta `Downloads` como instalação permanente. Se sincronização ou antivírus estiver bloqueando arquivos, diagnosticaremos o caminho antes de mover/apagar qualquer coisa.

### Antivírus ou SmartScreen bloqueou algo

Confira se o download veio do site oficial e quem é o publicador. Não desative a proteção nem crie exclusões amplas. Me informe o nome do arquivo e a mensagem, sem dados pessoais, para verificarmos. Em computador gerenciado, a instalação pode precisar do administrador.

### E-mail de confirmação não chega

Confira endereço digitado, spam e limites do provedor. No Supabase, confira o estado do usuário em **Authentication → Users** e o envio configurado. O serviço padrão tem restrições; pode ser necessário SMTP próprio para destinatários não autorizados. Não desative confirmação de e-mail para fingir que o teste passou. Se configurarmos SMTP, insira os segredos apenas no painel.

### Supabase pausado por inatividade

Abra o painel, entre no projeto e use **Restore / Restaurar** se disponível. Aguarde o estado ativo e reteste. Não crie outro projeto nem troque a chave sem necessidade. Se o painel não permitir restauração, siga a mensagem oficial e me informe o impedimento.

### “Permission denied”, erro RLS ou pontuação não salva

Primeiro confira se está logado, se a sessão não expirou e se migrações/seed terminaram sem erros. O site deve salvar por RPC; uma escrita direta em `scores` deve mesmo ser bloqueada. Não torne tabelas públicas nem desative RLS. Registre qual ação falhou e a mensagem, e eu investigo os arquivos. Nunca use service_role no navegador.

### Página em branco ou funciona na home, mas não no jogo

Confira se abriu `http://localhost:5173` pelo servidor, não `file:///...`. Na etapa de diagnóstico, eu te mostrarei **F12 → Console** para copiar o erro relevante. Não compartilhe telas com senhas, tokens ou dados de sessão. Após publicar, caminhos, MIME de módulos e cache do service worker também precisam ser verificados.

## Ao terminar cada fase

As fases de implementação estão registradas em `PLANO.md`; evidências em `VALIDACAO.md`; limitações em `PENDENCIAS.md`. Conforme sua orientação mais recente, as instalações só são apresentadas após entregar os arquivos. Agora comece pelo passo 0: baixar e extrair. No chat, posso conduzir o restante uma etapa por vez, sem pedir senhas ou chaves secretas.

## Referências oficiais consultadas

Consulta inicial em 6 de outubro de 2026. Páginas podem mudar; os nomes de botões serão reconferidos na etapa relevante.

- [Node.js — download LTS](https://nodejs.org/en/download) e [versões](https://nodejs.org/en/about/previous-releases), consultados diretamente.
- [VS Code no Windows](https://code.visualstudio.com/docs/setup/windows) e [terminal integrado](https://code.visualstudio.com/docs/terminal/getting-started); consulta aos [fontes oficiais Windows](https://github.com/microsoft/vscode-docs/blob/main/docs/setup/windows.md) e [terminal](https://github.com/microsoft/vscode-docs/blob/main/docs/terminal/getting-started.md).
- [Git para Windows](https://git-scm.com/install/windows) e [documentação do projeto oficial](https://github.com/git-for-windows/git/blob/master/README.md), esta última consultada.
- [Políticas de execução PowerShell](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_execution_policies); consulta ao [fonte oficial Microsoft](https://github.com/MicrosoftDocs/PowerShell-Docs/blob/main/reference/7.5/Microsoft.PowerShell.Core/About/about_Execution_Policies.md).
- [Supabase — autenticação por senha](https://supabase.com/docs/guides/auth/passwords) e [URLs de redirecionamento](https://supabase.com/docs/guides/auth/redirect-urls); consulta aos fontes oficiais [senha](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/passwords.mdx) e [URLs](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/auth/redirect-urls.mdx).
- [Supabase — API keys](https://supabase.com/docs/guides/api/api-keys): referência para reconferir na etapa 9; a página direta estava bloqueada durante a consulta inicial; as regras e os tipos de chave seguem a documentação da biblioteca e a especificação.
- [Cloudflare Pages — site estático](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/) e [integração Git](https://developers.cloudflare.com/pages/get-started/git-integration/); consulta aos fontes oficiais [site estático](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/pages/framework-guides/deploy-anything.mdx) e [integração](https://github.com/cloudflare/cloudflare-docs/blob/production/src/content/docs/pages/get-started/git-integration.mdx).

Alguns sites diretos foram bloqueados pela rede da nuvem. Foram usados os textos oficiais mantidos no GitHub quando disponíveis; isso não impede você de abrir os sites oficiais no Windows. Nenhuma instalação foi feita no seu computador por mim.
