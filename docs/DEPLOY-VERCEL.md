# Publicar LEXICADE 2.1 na Vercel com Supabase

Você já tem Node, npm e Git. Não precisa baixar outro programa, instalar a CLI da Vercel ou executar `npm install`. A Vercel publica pelo GitHub; o Supabase guarda as contas, resultados e duelos. A URL e a chave publicável já estão configuradas no código. Nenhuma chave privada é necessária no navegador ou na Vercel.

## 1. Atualizar os arquivos

Se sua pasta veio de `git clone`, abra o PowerShell nela e execute:

```powershell
git pull origin main
```

Se veio de um ZIP, baixe **Code → Download ZIP** em https://github.com/gigio-jpeg/LEXICADE e extraia em uma pasta nova. Não execute `git pull` em uma pasta extraída sem `.git`. A pasta correta contém `package.json`, com versão **2.3.0**, e `vercel.json`.

Para testar no computador, execute `npm start` e abra o endereço que o terminal mostrar. Para verificar o pacote de produção: `npm test` e depois `npm run build`. O build cria `dist`, só com os arquivos públicos do site.

## 2. Atualizar o Supabase

Entre em https://supabase.com/dashboard e abra seu projeto. Abra **SQL Editor → New query**.

**Se as contas e o ranking já funcionavam na versão 2.0:** aplique `supabase/migrations/005_arcade_social.sql` e depois `supabase/migrations/006_cabinet_finishes.sql`. Na pasta do projeto, o PowerShell copia o arquivo inteiro:

```powershell
Get-Content -Raw -Encoding UTF8 .\supabase\migrations\005_arcade_social.sql | Set-Clipboard
```

Cole no SQL Editor com Ctrl+V e clique **Run**. Espere a mensagem de sucesso. Essa migração adiciona duelo, frases validadas no servidor, personalização, políticas de privacidade e publicação Realtime. Preserva os dados anteriores. Se você ainda não aplicou a migração `004_arcade_focus.sql`, aplique-a antes da 005.

**Se o banco continua vazio:** use `supabase/INSTALAR-TUDO.sql`, que já inclui todas as migrações. Copie com:

```powershell
Get-Content -Raw -Encoding UTF8 .\supabase\INSTALAR-TUDO.sql | Set-Clipboard
```

Cole e execute uma vez. Não execute esse instalador em um banco que já contém as tabelas do projeto.

Não é necessário abrir as tabelas para visitantes ou desligar RLS. As funções fazem as alterações autorizadas; um terceiro não pode ler ou participar de um duelo já ocupado. A migração inclui `duel_matches` e `duel_players` na publicação `supabase_realtime`. Se seu projeto não tem essa publicação, verifique **Database → Replication** e habilite essas duas tabelas para Realtime. O placar também tem atualização periódica como alternativa quando a conexão Realtime cai.

## 3. Importar na Vercel

1. Entre em https://vercel.com com seu GitHub.
2. Escolha **Add New → Project** e importe `gigio-jpeg/LEXICADE`. Se não aparecer, use a opção de ajustar o acesso da Vercel ao GitHub e autorize esse repositório.
3. Selecione a branch `main`. Mantenha **Root Directory** na raiz.
4. Confira as opções abaixo. `vercel.json` já configura build e saída.

| Campo | Valor |
|---|---|
| Framework Preset | Other |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `node --version` |
| Node.js Version | 24.x, ou outra versão suportada >=22 |
| Environment Variables | Nenhuma necessária para esta versão |

5. Clique **Deploy** e espere o resultado de sucesso.
6. Abra o domínio de produção HTTPS que a Vercel fornecer, por exemplo `https://nome-real-do-projeto.vercel.app`. Use seu endereço real nos próximos passos.

Não publique a raiz inteira do repositório: `dist` mantém SQL, testes, documentação e arquivos de configuração fora do pacote público. As páginas já existem como HTML; não é preciso configurar uma regra que redirecione todos os caminhos à home.

## 4. Autorizar o endereço no Supabase Auth

No Supabase, abra **Authentication → URL Configuration**.

Em **Site URL**, coloque o domínio de produção completo, sem caminho, por exemplo `https://nome-real-do-projeto.vercel.app`.

Em **Redirect URLs**, adicione três endereços, substituindo o domínio pelo seu:

```text
https://nome-real-do-projeto.vercel.app/pages/escolher-nome.html
https://nome-real-do-projeto.vercel.app/pages/login.html
https://nome-real-do-projeto.vercel.app/pages/redefinir-senha.html
```

Clique **Save**. Confira em **Authentication → Providers** que Email está habilitado. Quando trocar por um domínio próprio, atualize Site URL e essas três entradas. Use o domínio estável de produção; URLs temporárias de preview são diferentes.

Se os e-mails não chegarem, confira spam e os limites de envio em **Authentication → Email/SMTP**. O remetente padrão do Supabase limita envios e destinatários; para receber cadastros de outras pessoas, configure um provedor SMTP no painel. Essa configuração é feita com o provedor e o Supabase; não coloque credenciais de SMTP no código.

## 5. Testar a publicação

- Abra o site pelo domínio de produção, inclusive no celular; percorra as quatro máquinas.
- Faça login, confirme e-mail se solicitado e termine o cadastro. Jogue uma rodada e confira **Meu progresso**.
- Complete uma rodada pontuada de Frase Rush. Na próxima, o fantasma repete a sequência do seu melhor percurso e mostra seu ritmo. O fantasma fica neste navegador, separado por conta e idioma; não é transferido de localhost para o domínio publicado.
- Abra **Extras → Seu fliperama**, dê um nome e salve. Cores e adesivos desbloqueiam com rodadas concluídas. Visitante salva no navegador; conta salva no Supabase e restaura ao entrar em outro aparelho.
- Para o duelo, use **duas contas diferentes**: uma no navegador normal, outra em janela anônima ou no aparelho de um amigo. Em **Extras → Duelo ao vivo**, crie e copie o convite. Abra o convite com a segunda conta. Há contagem regressiva e os dois recebem as mesmas frases durante 60 segundos. Teste placar, resultado e XP. O convite vale 15 minutos para começar; após iniciado, o relógio continua mesmo se sair. Reabrir o link permite retomar enquanto a partida estiver em andamento.
- Se a Vercel pedir login ao visitante, confira **Settings → Deployment Protection**: o domínio de produção precisa estar acessível ao seu público. Não use um link de preview protegido como convite.

Música habilitada por padrão começa após a primeira interação quando o navegador exige esse gesto. A sala reage a acertos, sequências e recordes; a opção de reduzir movimento desativa esses pulsos.

## 6. Ajustar metadados para seu domínio

Na cópia clonada, substitua o exemplo pelo endereço real e execute:

```powershell
node tests/configure-domain.mjs https://nome-real-do-projeto.vercel.app
node tests/update-cache.mjs
npm test
npm run build
git add .
git commit -m "Configura dominio de producao"
git push origin main
```

Revise os arquivos alterados antes de `git add .` se você fez outras mudanças na pasta. A Vercel publica novamente quando recebe o commit na `main`. Quem usa ZIP pode clonar pelo GitHub Desktop em outra pasta e executar esses comandos nela.

## Se algo não funcionar

**Extras mostra mensagem sobre SQL:** confirme que a migração 005 terminou com sucesso no mesmo projeto configurado no site. Não afeta os jogos visitantes.

**Duelo não começa:** use contas diferentes, um convite novo e o mesmo domínio em ambas. Cada jogador precisa concluir o perfil. Confira a migração e a conectividade; não compartilhe chaves privadas para resolver isso.

**Está vendo a versão antiga:** recarregue com Ctrl+F5; se necessário, em DevTools → Application → Service Workers, remova o worker antigo desse site e recarregue. Isso não apaga dados do Supabase.

**Build falhou:** confira raiz, versão Node e os quatro campos da tabela. Abra os logs da Vercel; o primeiro erro é o mais útil.

A publicação e a execução do SQL remoto dependem da sua conta nos painéis. Os testes locais usam PostgreSQL compatível e autenticação simulada; o teste final no seu domínio confirma Auth, e-mail e Realtime do projeto hospedado.

## Atualização de acabamentos 2.3.0

Com 005 já aplicada, copie somente `supabase/migrations/006_cabinet_finishes.sql` e execute no SQL Editor. Ela libera os novos nomes de acabamento na validação do servidor e mantém os desbloqueios. Não reaplique INSTALAR-TUDO em banco existente. Restaurar padrão já funciona com 005: abra Menu → Extras → Restaurar padrão; remove nome/adesivo/pintura personalizados e preserva progresso.

## Modelos de gabinete 2.3

Com 005 e 006 instaladas, aplique somente `supabase/migrations/007_cabinet_models.sql` no SQL Editor. Ela preserva estilos anteriores e valida classic (livre), wood (5 partidas), circuit (15) e chrome (30) no servidor. Não execute INSTALAR-TUDO no banco existente. Abra Menu → Extras: os cartões permitem prévia 3D, inclusive dos modelos bloqueados. Arraste para girar e clique Salvar alterações para aplicar um modelo desbloqueado. Restaurar padrão volta ao Original e mantém seu progresso. Modelos visitantes ficam neste navegador; modelos de conta sincronizam via RPC do Supabase.
