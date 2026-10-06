# LEXICADE

Um fliperama de palavras com 16 jogos, português/inglês/espanhol, cinco temas básicos, progresso visitante, contas Supabase, rankings, conquistas e loja de cosméticos. HTML, CSS e JavaScript puros: **não há build de aplicação**.

Comece pelo [GUIA-INICIANTE](docs/GUIA-INICIANTE.md) se usa Windows. Você pode jogar sem configurar o banco. O código está entregue; a aplicação do SQL, o teste de e-mail/OAuth no seu projeto e a publicação precisam ser feitos pelo proprietário, conforme a especificação.

## Rodar

Instale Node.js LTS (22 ou superior; recomendado LTS 24), extraia o pacote e abra o PowerShell na pasta com `package.json`:

```powershell
npm start
```

Abra `http://localhost:5173` no seu computador. Ctrl+C para parar. Não precisa de `npm install` para rodar, gerar conteúdo, empacotar ou executar os testes de lógica; o cliente Supabase está copiado em `vendor/` com versão fixada e licenças. Para outra porta: `npm start -- --port 5174`.

## Testes e ferramentas

```powershell
npm test
```

```powershell
npm run validate
```

```powershell
npm run crosswords
```

```powershell
node tests/update-cache.mjs
```

```powershell
npm run package
```

Os testes Node exercitam regras de jogos, acentos, pontuação, geradores, desafios determinísticos, conteúdo e módulos/páginas. SQL e fluxo de navegador estão detalhados em [VALIDACAO](docs/VALIDACAO.md). Para os testes PostgreSQL locais opcionais, veja [supabase/tests/README.md](supabase/tests/README.md).

## Contas e banco

Siga [SETUP-SUPABASE](docs/SETUP-SUPABASE.md). Execute `001_schema.sql`, `002_rpcs.sql`, `003_queries.sql`, depois `seed.sql`, pelo seu painel. URL e publishable key recebidas já estão apenas em `src/core/config.js`. `.env.example` é referência com exemplos; o navegador não lê `.env`.

O visitante joga e guarda progresso localmente. Quem entra usa RPCs: escrita direta em pontuações/XP/moedas é bloqueada. A importação tem teto e recordes importados ficam privados, fora do ranking. Login Google fica desligado até configurar o provedor; link mágico funciona para contas já cadastradas. Rascunhos legais, consentimento de menores e conteúdo precisam de revisão humana antes do lançamento público.

## Publicar

Recomendação: **Cloudflare Pages**, integração GitHub, branch `main`, framework `None`, comando da hospedagem `exit 0`, diretório de saída `.`. O comando `exit 0` é um campo do painel Cloudflare, não um script do projeto nem uma instrução PowerShell. Veja [DEPLOY](docs/DEPLOY.md).

Depois de escolher o endereço real, gere os metadados:

```powershell
node tests/configure-domain.mjs https://SEU-NOME.pages.dev
```

O sitemap inicial usa `lexicade.example`; substitua antes de publicar. Atualize as URLs de confirmação/recuperação no Supabase. Netlify, Vercel e GitHub Pages podem servir os mesmos arquivos; para uma subpasta como GitHub Pages, informe a URL completa com a subpasta ao script. O servidor Node é apenas para desenvolvimento.

## Estrutura

| Pasta | Uso |
|---|---|
| `src/core/` | Configuração, autenticação, API, dados locais, idiomas, áudio, entrada e regras compartilhadas |
| `src/games/` | Lógica pura de cada jogo |
| `src/ui/controllers/` | Interface de cada jogo e desenho original Canvas |
| `src/ui/pages/` | Contas, perfil, loja, ranking, desafios, ajustes e privacidade |
| `src/styles/` | Tokens, temas e componentes |
| `games/`, `pages/` | Documentos HTML finos |
| `data/` | Catálogo, idiomas, palavras, grades, conquistas e loja |
| `supabase/` | Migrações, seed e testes de segurança |
| `tests/` | Testes Node e utilidades compatíveis com Windows |
| `docs/` | Plano, guia, banco, publicação, licenças e pendências |
| `vendor/` | Supabase JS 2.57.4 e licenças de suas dependências |

## Novo jogo ou idioma

Novo jogo: escreva funções puras em `src/games/<id>.js`, um controlador pequeno em `src/ui/controllers/<id>.js` e um HTML baseado em `games/typerush/index.html`. Cadastre caminho, nome, categoria e ícone em `data/games.json`. O controlador expõe `start`, `update`, `render`, `mode` e `destroy` quando necessário; usa o contexto do casco e encerra com `finish`. Adicione limites e validação de métricas no SQL, traduções, testes e atualize o cache. Não reutilize marcas ou personagens de terceiros.

Novo idioma: adicione JSON completo em `data/i18n/`, pastas em `data/words/` e `data/crosswords/`, traduza os catálogos, registre o idioma em `config.js` e atualize as validações/constraints SQL. O idioma de interface `pt-BR` corresponde a `pt` nas pastas e no banco. Rode testes de completude, conteúdo e geradores.

## Limites reais

Há 2.000 palavras comuns, 150 frases, 30 textos, 200 grupos de Intrusa, 400 exercícios de Ortografia e 60 grades de cruzadinha por idioma. As respostas cuidadosamente selecionadas do Decifra, os grupos de rimas e as dicas autorais ainda ficam abaixo das metas da especificação. Consulte as contagens e revisões em [PENDENCIAS](docs/PENDENCIAS.md). Não há garantia de invulnerabilidade a trapaças em jogos estáticos: o servidor valida plausibilidade e limita envios, mantendo o Decifra diário secreto.

As fontes externas, licenças e adaptações estão em [LICENCAS](docs/LICENCAS.md). O envio do projeto para `gigio-jpeg/LEXICADE`, branch `main`, foi autorizado pelo proprietário. Para baixar, use **Code → Download ZIP** no GitHub. O envio do código não publica o site.
