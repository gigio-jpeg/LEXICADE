# Fontes, licenças e originalidade

## Dados de frequência

Fonte: [FrequencyWords, Hermit Dave](https://github.com/hermitdave/FrequencyWords), arquivos `content/2018/pt/pt_50k.txt`, `en/en_50k.txt` e `es/es_50k.txt`. O [README da fonte](https://github.com/hermitdave/FrequencyWords/blob/master/README.md) declara **CC BY-SA 4.0 para o conteúdo** e MIT apenas para o código. Não tratar MIT do código como licença dos dados.

Origem informada pelo autor: corpus tokenizado OpenSubtitles 2018. Consulta/download nesta entrega; listas foram filtradas por caracteres/tamanho, normalizadas para eliminar duplicatas e tiveram termos explícitos conhecidos removidos. A qualidade não é equivalente a um dicionário revisado. Não foram copiados trechos de legendas para as frases do jogo.

Arquivos derivados: `comuns.json`, `decifra-validas.json` e parte do vocabulário usado em `ortografia.json`. Essas adaptações de dados são distribuídas sob **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**. Atribuição: Hermit Dave / FrequencyWords; alterações: filtragem, curadoria, agrupamento por tamanho/dificuldade e exercícios de letras trocadas para LEXICADE. Redistribuições/modificações desses dados devem manter atribuição, indicar mudanças e respeitar ShareAlike. A licença não obriga todo o código independente do site a adotar a mesma licença.

Listas candidatas podem conter grafias informais, nomes próprios ou termos inadequados que escapem ao filtro. As respostas do Decifra foram restringidas ao vocabulário autoral selecionado de objetos/natureza/etc.; não usar toda a lista candidata como respostas. Revisão linguística e de adequação etária continua pendente.

## Conteúdo autoral

`curadas.json`, palavras/dicas temáticas, grupos de rimas, exercícios de Intrusa, explicações, frases/textos e interface foram escritos para este projeto. As frases e textos usam combinações de modelos autorais com palavras selecionadas; cumprem contagens, mas não representam diversidade editorial equivalente a centenas de textos independentes. Grades são geradas pelo algoritmo próprio de cruzadinhas.

Revisão humana necessária: acentuação, pronúncia de rimas, ambiguidade de categorias/dicas e ensino de ortografia. Não preencher metas inventando palavras ou copiando listas sem licença.

## Fonte tipográfica

**Silkscreen**, Jason Kottke / colaboradores, obtida do [repositório oficial Google Fonts](https://github.com/google/fonts/tree/main/ofl/silkscreen), **SIL Open Font License 1.1**. Fonte sem alterações em `assets/fonts/Silkscreen-Regular.ttf`; texto completo da licença em `Silkscreen-OFL.txt`. Demais pilhas tipográficas usam fontes já instaladas no sistema, sem distribuir arquivos dessas fontes.

## Supabase JS

Cliente oficial `@supabase/supabase-js` **2.57.4**, licença **MIT**, empacotado como módulo ESM de navegador em `vendor/supabase-2.57.4.js`. Sem carregamento de CDN em tempo de execução. Licenças de cliente e dependências copiadas em `vendor/licenses/`; inventário em `packages.json`. Bundle gerado com esbuild 0.25.10 (ferramenta de preparação, não necessária para rodar o produto).

## Arte e áudio

Logo SVG, ícones PNG, imagem Open Graph, tabuleiro decorativo e personagens/efeitos Canvas são originais. Sons e melodias são síntese própria via Web Audio; não há músicas/sons comerciais copiados. Não foram incorporados personagens, mapas ou imagens de jogos conhecidos.

As mecânicas seguem a especificação inspirada em gêneros clássicos; nomes e apresentação comercial devem passar pela revisão jurídica de marcas antes do lançamento. A licença de distribuição do código autoral do projeto deve ser definida por seu titular; este documento não presume uma transferência de direitos sobre o projeto.

## Ferramentas de validação

Node.js, Chromium/Playwright e PGlite foram usados no desenvolvimento/testes. Não são carregados pelo site. PGlite só é instalado opcionalmente para testes SQL; o pacote do site não distribui essa dependência. O teste local não substitui o teste final no Supabase hospedado.
