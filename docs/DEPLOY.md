# Publicar no Cloudflare Pages

O projeto é estático; o Node é usado somente no desenvolvimento e nos testes. O envio do código ao GitHub foi autorizado pelo proprietário. Isso não publicou o site.

## Antes da publicação

Rode `npm test`, `npm run validate` e teste o site visitante. Leia `PENDENCIAS.md`: revisão linguística/jurídica e ampliação de conteúdo estão separadas de implementação. Aplique o SQL e confirme o fluxo remoto de login antes de anunciar contas/rankings como funcionando.

## 1. Código no GitHub

O projeto está no repositório `gigio-jpeg/LEXICADE`, branch `main`. Não é necessário enviar a primeira versão novamente. Para baixar sem instalar Git: abra https://github.com/gigio-jpeg/LEXICADE e escolha **Code → Download ZIP**. Extraia a pasta `LEXICADE-main`; pode renomeá-la para `LEXICADE`.

Para acompanhar versões e enviar alterações futuras, use GitHub Desktop: **File → Clone repository**, selecione `gigio-jpeg/LEXICADE`, escolha uma pasta nova e clique em **Clone**. Entre no GitHub pelo navegador se solicitado. Não envie tokens ou senhas pelo chat.

A alternativa PowerShell, após instalar Git, é:

```powershell
git clone https://github.com/gigio-jpeg/LEXICADE.git
```

```powershell
Set-Location LEXICADE
```

Não faça clone em uma pasta que já contenha a cópia extraída. O ZIP não inclui histórico Git; para usar controle de versões, prefira clonar em outra pasta. Não use `git init` e force push para substituir o remoto que já contém esta entrega. O guia acompanha um passo de cada vez.

## 2. Conectar Pages

No painel Cloudflare, procure **Workers & Pages → Create application → Pages → Connect to Git / Import an existing Git repository**. Autorize seu GitHub para o repositório e selecione LEXICADE.

| Campo | Valor |
|---|---|
| Production branch | `main` |
| Framework preset | `None` |
| Root directory | raiz do repositório |
| Build command | `exit 0` |
| Build output directory | `.` |

`exit 0` é a configuração indicada pela documentação Pages para um site sem build. Preencha o campo do painel; não execute esse comando no PowerShell. Não configure variáveis secretas de Supabase no build: o front-end usa só URL/publishable key públicas.

Clique em **Save and Deploy**, espere sucesso e abra a URL HTTPS fornecida. Teste também `/games/typerush/index.html`, não apenas a home.

## 3. Metadados e Supabase

Depois de conhecer a URL real, na pasta local:

```powershell
node tests/configure-domain.mjs https://SEU-NOME.pages.dev
```

O script atualiza canonical, Open Graph e sitemap. O domínio `lexicade.example` entregue inicialmente é um exemplo, não uma URL publicada. Execute `node tests/update-cache.mjs`, revise alterações, crie um novo commit e envie ao GitHub para o Pages atualizar.

No Supabase, mude Site URL para o domínio publicado e adicione redirects exatos de `pages/login.html`, `pages/redefinir-senha.html` e `pages/escolher-nome.html`. Teste cadastro, confirmação, entrada, recuperação, uma partida em `scores`, ranking, compra e exclusão com uma conta de teste.

O `_headers` entregue adiciona CSP, proteção contra MIME incorreto e permissões mínimas no Cloudflare/Netlify. No Vercel, use regras de headers equivalentes no painel/configuração; GitHub Pages não aplica `_headers`, mas conserva a CSP meta.

## 4. Domínio próprio (opcional)

No projeto Pages: **Custom domains → Set up a custom domain**. Siga o DNS indicado pelo painel e aguarde HTTPS. Domínio próprio pode ter custo; o endereço pages.dev é suficiente. Repita o script de metadados com o domínio definitivo e atualize URLs do Supabase.

## 5. Offline e atualização

Depois da primeira visita online, aguarde terminar o cache, ative modo offline no navegador e recarregue um jogo. Visitante continua disponível; contas/rankings exigem conexão.

Ao alterar arquivos de uma versão publicada, atualize a constante `VERSION` em `sw.js` e a versão em `config.js`, execute `node tests/update-cache.mjs`, rode testes e publique. O worker novo espera os antigos clientes fecharem antes de assumir; não interrompe uma partida com atualização forçada. Feche/reabra as abas para ver a nova versão.

## Fontes oficiais

[Cloudflare: site estático](https://developers.cloudflare.com/pages/framework-guides/deploy-anything/), [integração Git](https://developers.cloudflare.com/pages/get-started/git-integration/) e [domínios personalizados](https://developers.cloudflare.com/pages/configuration/custom-domains/).

## Sala 3D da revisão 2

Publique também `vendor/three/` e todos os seus addons; sem eles a sala não renderiza em 3D. Não há build obrigatório. O service worker usa `lexicade-v2.0.1`; feche abas antigas para ativar a atualização. URLs antigas de login/recuperação/perfil continuam válidas e encaminham para painéis na sala preservando parâmetros de autenticação.
