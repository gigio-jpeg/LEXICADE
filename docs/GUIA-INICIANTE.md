# LEXICADE 2 — guia no Windows

Vamos fazer uma etapa por vez. Você já confirmou Node.js `v25.1.0`, npm `10.8.3` e Git `2.46.0`; atendem ao projeto. **Não precisa reinstalar esses programas.** O endereço da nuvem e os arquivos do seu Windows são coisas diferentes.

## 1. Baixar a revisão 3D

1. Se o servidor antigo estiver rodando, clique no PowerShell dele e pressione **Ctrl+C**. Isso só encerra o servidor.
2. Abra https://github.com/gigio-jpeg/LEXICADE/tree/main. Clique **Code → Download ZIP**.
3. No Explorador de Arquivos, clique com o botão direito no novo ZIP e escolha **Extrair Tudo**. Extraia em uma pasta nova, por exemplo `Documentos\LEXICADE-3D`, para preservar a cópia anterior.
4. Entre na pasta extraída até encontrar `package.json`, `index.html`, `src`, `data` e `supabase`. Pode haver uma pasta `LEXICADE-main` dentro de outra: a pasta correta é a que contém esses arquivos.

**Confirmação:** `package.json` mostra versão `2.0.3`; existe `src\arcade`. Não execute o projeto dentro do ZIP. No chat, diga quando extrair e só então passamos à próxima etapa.

## 2. Abrir a pasta no PowerShell

No Explorador, entre na pasta com `package.json`, clique na barra de endereço, digite `powershell` e pressione Enter. Isso abre o terminal já na pasta certa.

Confira:

```powershell
Get-ChildItem package.json
```

Depois:

```powershell
npm start
```

Não precisa de `npm install`. Deixe o terminal aberto. Abra o endereço que ele mostrar no navegador; o padrão é `http://localhost:5173`. Se ele mostrar outra porta, use a porta exibida.

**Confirmação:** a página mostra uma sala 3D e quatro máquinas. Clique em **Jogar agora**, navegue pelas setas ou clique diretamente numa máquina. Frase Rush só começa a contar o tempo quando você digita. Escape ou **Sair da máquina** retorna à sala. O botão de pausa fica na tela do jogo.

Se aparecer a versão antiga, feche as abas do site, mantenha o servidor novo ligado e abra o endereço novamente. Verifique se o terminal está na pasta da revisão 2, não na cópia antiga. Não apague seus dados locais para tentar corrigir cache.

## 3. Verificar modo visitante

Complete uma partida, veja pontos/XP e inicie outra. O progresso visitante fica neste navegador e computador. A página não precisa de login nem banco para jogar. **Entrar** abre um painel sobre a sala.

Som e música começam habilitados nesta atualização. O navegador pode exigir o primeiro clique/toque para liberar o áudio. No topo há um player discreto: **Ⅱ** pausa, **▷** retoma e **›|** avança. No computador ele mostra o nome da faixa; no celular só os controles. A playlist original tem **Neon Drift**, **Pixel Sunset** e **Midnight Coins**, com avanço automático e repetição da lista. Não precisa adicionar arquivos de áudio. Sua escolha de pausar é preservada nas visitas seguintes.

Em **Ajustes**, escolha o tema e confira a prévia da sala 3D. Clique em **Salvar alterações** para guardar tema, som, música, volume e demais escolhas; aparece a confirmação **Alterações salvas com sucesso**. Fechar o painel sem salvar descarta a prévia. O tema muda a sala, os gabinetes, a iluminação e os painéis. **Efeito de monitor retrô** acrescenta linhas de varredura, brilho e vinheta somente às telas das máquinas; desligar deixa a imagem limpa. Confira a prévia e salve.

Os três idiomas ficam no seletor superior. Perfil, ranking e ajustes ficam nos painéis de conta; o ranking exige banco configurado e internet. Nos ajustes, você pode reduzir movimentos da câmera e alterar som/fonte. Isso não adiciona opções antes dos jogos.

## 4. Instalar as tabelas no Supabase

Seu projeto já existe. A URL e a publishable key estão preenchidas em `src\core\config.js`; não precisa copiá-las novamente. Nunca envie senha, secret key, service_role ou token pelo chat.

Abra seu projeto no painel Supabase e olhe **Table Editor**:

- Se **não existe `profiles`**, use a instalação única para banco vazio.
- Se já aplicou o SQL da primeira versão e **`profiles` existe**, use somente a atualização `004_arcade_focus.sql`.
- Se tentou uma instalação e apareceu erro, pare e me envie a mensagem, sem senhas. Não apague tabelas nem execute tudo outra vez.

### Projeto vazio

No PowerShell aberto na pasta do projeto:

```powershell
Get-Content -Raw -Encoding UTF8 ".\supabase\INSTALAR-TUDO.sql" | Set-Clipboard
```

Esse comando copia o SQL, preservando os acentos. Abra **Supabase → SQL Editor → New query**, cole com Ctrl+V e clique em **Run**. Não copie o conteúdo do terminal: o SQL já está na área de transferência.

**Confirmação:** execução sem erro; tabelas como `profiles`, `scores`, `personal_bests` e `achievements` aparecem no Table Editor. O arquivo usa uma transação: uma falha desfaz a instalação inteira. Pare aqui e me diga o resultado.

### Primeira versão já instalada

```powershell
Get-Content -Raw -Encoding UTF8 ".\supabase\migrations\004_arcade_focus.sql" | Set-Clipboard
```

Cole no SQL Editor e execute. Atualiza metas das quatro máquinas; não apaga progresso. Não executar `INSTALAR-TUDO.sql` sobre uma instalação existente.

## 5. Configurar e-mail e URLs de retorno

Siga a seção correspondente em `SETUP-SUPABASE.md`. No painel, procure **Authentication → Providers / Email** e mantenha confirmação de e-mail. Depois, **Authentication → URL Configuration**:

- Site URL: `http://localhost:5173` no desenvolvimento.
- Redirect URLs: `http://localhost:5173/pages/login.html`, `http://localhost:5173/pages/redefinir-senha.html`, `http://localhost:5173/pages/escolher-nome.html`.

Se seu terminal mostra outra porta, substitua `5173` por ela em todas as URLs. Essas páginas encaminham para os painéis da sala 3D, preservando o retorno da autenticação. Na publicação, usar o domínio HTTPS real e os mesmos caminhos.

O e-mail padrão Supabase tem limites; SMTP próprio pode ser necessário para usuários externos. Digite segredos somente no painel oficial. Google é opcional e fica desligado enquanto não configurar o provedor.

**Confirmação:** URLs salvas e endereço de confirmação acessível no mesmo computador onde o servidor está rodando.

## 6. Testar uma conta

1. Na sala, clique **Entrar → Criar conta**. Use nome público, e-mail, senha e preencha os consentimentos/faixa etária. Não envie a senha para mim.
2. Abra o e-mail no mesmo computador e confirme. O servidor precisa continuar ligado.
3. Entre, escolha seu nome se solicitado e teste importar o progresso visitante uma única vez.
4. Complete uma partida e confirme a mensagem **Progresso salvo na sua conta**.
5. No Supabase, abra **Table Editor → scores** e confira jogo, pontuação e data. Sair/entrar novamente deve manter o progresso.

Ver a partida só no navegador não confirma sincronização. Para verificar segurança, execute os testes transacionais da seção 5 de `SETUP-SUPABASE.md`; eles usam usuários fictícios e desfazem os dados ao final.

## 7. Testes locais

```powershell
npm test
```

```powershell
npm run validate
```

Resultado esperado: testes executados e nenhuma falha. Avisos de conteúdo antigo abaixo das metas editoriais estão documentados; os jogos ativos são quatro. Testes PostgreSQL locais são opcionais e têm uma dependência separada, descrita em `supabase\tests\README.md`.

Para offline, primeiro carregue a sala com internet, aguarde a instalação do cache e visite as máquinas. Depois teste desconectar a rede; os quatro jogos visitantes devem continuar disponíveis. Login, ranking e sincronização não funcionam sem internet. Instalação como aplicativo depende do navegador e HTTPS ou localhost.

## 8. Publicar

Use `DEPLOY.md`: Cloudflare Pages, repositório `gigio-jpeg/LEXICADE`, branch `main`, framework **None**, comando da hospedagem `exit 0`, saída `.`. Esse comando é preenchido no painel; não é uma instrução PowerShell.

Depois de escolher o endereço público:

```powershell
node tests/configure-domain.mjs https://SEU-NOME.pages.dev
```

```powershell
node tests/update-cache.mjs
```

Envie a alteração pelo GitHub e atualize as URLs Auth no Supabase. O ZIP não contém histórico Git: para guardar versões, use **GitHub Desktop → File → Clone repository** em uma pasta nova ou siga a alternativa Git de `DEPLOY.md`. Não faça `git pull` numa pasta extraída sem `.git`.

Antes de abrir contas ao público: revisar termos, consentimentos para menores, contato do responsável e conteúdo. O site não foi publicado automaticamente nesta tarefa.

## Problemas comuns

**PowerShell bloqueou `npm.ps1`:** use `npm.cmd start` ou `npm.cmd test`. Não precisa alterar a política do sistema. Se quiser configurar `RemoteSigned` para seu usuário, veja a documentação oficial e guarde o valor anterior; não use `Unrestricted` nem contorne uma política empresarial.

**Comando não reconhecido:** feche e reabra o terminal depois da instalação. Node.js LTS: https://nodejs.org/en/download; VS Code: https://code.visualstudio.com/; Git para Windows: https://git-scm.com/install/windows. VS Code é opcional para jogar: abra pelo menu Iniciar e use **Arquivo → Abrir Pasta**. Terminal integrado: **Terminal → Novo Terminal**. Para quem ainda não instalou Node, o instalador LTS oficial inclui npm; `winget install OpenJS.NodeJS.LTS` é uma alternativa.

**Porta ocupada:** encerre o servidor anterior com Ctrl+C. Não encerre processos desconhecidos. Outra porta: `npm start -- --port 5174`; URLs Auth devem corresponder.

**Pasta errada/espaços/OneDrive:** confira `Get-Location` e `Get-ChildItem`. Use aspas nos caminhos: `Set-Location "C:\Minha Pasta\LEXICADE-main"`. Não apague arquivos para resolver um erro de caminho.

**A sala não aparece em 3D:** o site mostra uma alternativa jogável se WebGL não estiver disponível. Atualize Chrome/Edge, confira aceleração gráfica nas configurações do navegador e reinicie. Não desative antivírus/SmartScreen. No Windows, o teste real de placa gráfica e toque será confirmado com você.

**E-mail não chega:** confira spam, endereço e limites do provedor. SMTP pode exigir configuração pelo painel. Não desative confirmação apenas para esconder o erro.

**Supabase pausado:** abra o projeto no painel e use Restore/Restaurar, se disponível. Espere ficar ativo; não crie outro projeto nem troque chaves sem necessidade.

**RLS/pontuação não salva:** confira instalação do SQL, login/sessão e mensagem de sincronização. Não desative RLS e não coloque service_role no navegador. Copie a mensagem relevante sem tokens.

**Tela antiga ou vazia:** use o endereço HTTP do servidor, não `file:///`. Confirme a pasta da revisão 2 e feche abas antigas. Posso te orientar a abrir F12 → Console e copiar apenas o erro relevante.

## Referências

Guias oficiais: Node.js LTS, VS Code Windows, Git for Windows, políticas de execução PowerShell, Supabase Auth/URLs/RLS e Cloudflare Pages, listados também em `SETUP-SUPABASE.md` e `DEPLOY.md`. A primeira entrega consultou fontes oficiais; nomes de botões podem mudar. Não foi feita instalação no seu computador pela máquina da nuvem.
