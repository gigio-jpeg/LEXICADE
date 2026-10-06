# LEXICADE — pendências e verificações humanas

O código dos 16 jogos, telas, integração Supabase e ferramentas foi entregue. Estas limitações fazem parte da entrega; não considerar este documento uma lista de funções silenciosamente aprovadas para produção. Evidências locais estão em `VALIDACAO.md`.

## Banco, conta e publicação

- O projeto remoto do usuário não foi consultado nem alterado. Ele continua dependendo da aplicação de `001_schema.sql`, `002_rpcs.sql`, `003_queries.sql` e `seed.sql`, nessa ordem, pelo proprietário. Depois executar os testes SQL transacionais.
- URL e publishable key recebidas estão apenas em `src/core/config.js`. Não faltam esses dados. O banco foi validado em PostgreSQL local com Auth mínimo simulado; isso não verifica confirmação de e-mail, entrega SMTP, redirects, tokens reais ou configurações da plataforma.
- Testar cadastro, confirmação, entrada, link mágico, recuperação, importação, pontuação, compra, exportação e exclusão no Supabase real. Google está implementado, porém desligado até configurar o provedor e validar o fluxo.
- O repositório remoto estava vazio no início. O proprietário autorizou a entrega do código pelo GitHub em `gigio-jpeg/LEXICADE`, branch `main`. Nenhum deploy do site ou publicação do ambiente foi feito. O ZIP do GitHub não contém `.git`; para guardar versões, clonar o repositório conforme o guia.
- `lexicade.example` é o domínio inicial dos metadados. Usar `node tests/configure-domain.mjs https://SEU-DOMINIO` antes de publicar. URLs Auth de produção também dependem do endereço escolhido.

## Quantidades de conteúdo

Contagens verificadas automaticamente em `data/content-counts.json`. As metas são por idioma. Letras são normalizadas para jogo, preservando acentos onde necessário.

| Conteúdo | Meta | Português | Inglês | Espanhol |
|---|---:|---:|---:|---:|
| Palavras comuns | 2.000 | 2.000 | 2.000 | 2.000 |
| Frases | 150 | 150 | 150 | 150 |
| Textos curtos | 30 | 30 | 30 | 30 |
| Respostas Decifra, 5 letras | 1.500 | 33 | 34 | 29 |
| Válidas Decifra, 5 letras | 10.000 | 5.069 | 6.476 | 4.859 |
| Palavras com dicas de cruzadinha | 500 | 126 | 127 | 126 |
| Grupos de rimas | 300 | 10 | 10 | 10 |
| Conjuntos de Intrusa | 200 | 200 | 200 | 200 |
| Pares de Ortografia | 400 | 400 | 400 | 400 |

As metas de respostas, válidas, dicas e rimas **não foram atingidas**. A especificação permite registrar déficits; não foram inventadas palavras para completar números. O conjunto pequeno de respostas provoca repetição nos diários. Ampliar com fontes licenciadas e revisão linguística; refletir mudanças nos JSON, seed SQL e cache. As 180 grades (60 por idioma, 30 destinadas ao diário) são conexas e validadas, mas reutilizam o conjunto limitado de dicas.

As frases/textos foram compostos com modelos originais; os exercícios de Ortografia incluem variantes de inversão de letras. Quantidade não equivale a diversidade editorial ou explicações individualizadas. Rimas e respostas são listas autorais curtas. A revisão de português, inglês e espanhol continua necessária: retirar flexões pouco naturais, nomes próprios e termos inadequados; melhorar dicas, rimas, exercícios e traduções. O filtro automático de termos sensíveis não substitui avaliação humana de adequação etária.

## Privacidade, idade e identidade

- Termos/privacidade são rascunhos visíveis como tal. Antes do lançamento, definir responsável, contato, prazos de retenção, finalidade, jurisdição e canal de direitos; obter revisão jurídica. Não inventar dados de um controlador.
- Cadastro bloqueia menores de 13 e exige declaração adicional de autorização dos 13 aos 17. Isso não verifica a identidade do responsável; revisar o mecanismo e a legislação aplicável antes de abrir contas ao público.
- Arte, sons e implementação dos jogos são originais. Conferir disponibilidade do nome LEXICADE e domínio antes de lançamento comercial. Conteúdo externo CC BY-SA e licenças de bibliotecas/fontes estão em `LICENCAS.md`.
- O servidor valida métricas, limites, duração, tentativas diárias, economia e taxa. Jogos estáticos ainda permitem adulterar o cliente. Não prometer ranking invulnerável; considerar monitoramento adicional para competição com prêmios.

## Validações ainda necessárias

- Windows real: as utilidades usam apenas APIs Node compatíveis com Windows e não exigem bash. Não foram executadas em uma máquina Windows; o usuário confirmará Node/PowerShell, caminhos, extração, firewall e navegador.
- Navegadores/dispositivos: testes funcionais em Chromium Linux. Safari, Firefox, Edge real, instalação PWA no Windows, toque em aparelho físico e leitores de tela não foram avaliados integralmente.
- Desempenho: laço de tempo fixo e carregamento por jogo implementados; 60 FPS em aparelhos de entrada e notas Lighthouse não foram medidos. Não há relatório que permita declarar essas metas cumpridas.
- Acessibilidade: foco, controles com rótulos, atalhos, modo daltônico e redução de movimento implementados. Contraste de todos os estados, leitor de tela e jogabilidade Canvas sem visão requerem auditoria humana.
- Cache: primeiro carregamento precisa baixar os arquivos. Offline não oferece login, ranking, sincronização ou compra da conta. Após uma atualização, fechar as abas antigas para ativar a nova versão e repetir o teste offline.

## Instalação depois da entrega

Primeiro baixar/extrair o ZIP pelo GitHub (**Code → Download ZIP**). Para rodar, instalar Node.js LTS; VS Code é recomendado para editar, Git/GitHub Desktop para publicar. Acompanhar `GUIA-INICIANTE.md` uma etapa por vez. Nenhuma instalação no computador do usuário foi feita por esta tarefa.
