# LEXICADE 2 — limites e ações restantes

A revisão atual entrega uma sala 3D com quatro jogos. Os outros jogos e as metas extensas da primeira especificação ficaram como histórico e compatibilidade de dados; não fazem parte da experiência principal. Evidências em [VALIDACAO.md](VALIDACAO.md).

## Supabase e publicação

O Supabase remoto não foi consultado nem alterado. URL e chave publicável recebidas já estão no cliente, exclusivamente em `src/core/config.js`. No banco vazio, o proprietário aplica `supabase/INSTALAR-TUDO.sql`; no banco da versão anterior, apenas `004_arcade_focus.sql`. SQL e testes de segurança/economia passaram em PostgreSQL local, inclusive a instalação completa em outra instância vazia.

Ainda precisa ser testado no serviço real: cadastro, confirmação de e-mail, entrada, recuperação, sincronização de partidas, importação de progresso, compra, exportação e exclusão. Os testes locais simulam a superfície mínima de Auth e não comprovam SMTP, tokens ou redirects hospedados. Google está desligado até configurar o provedor.

A entrega ao GitHub foi autorizada. Publicação do site e do ambiente são ações separadas. Antes de publicar, configurar o domínio com `node tests/configure-domain.mjs https://SEU-DOMINIO` e os redirects de autenticação, conforme [DEPLOY.md](DEPLOY.md). Não há implantação pública feita por esta tarefa.

## Conteúdo dos quatro jogos

Frase Rush usa **30 frases originais completas por idioma**, feitas para esta revisão, e uma rodada direta de 60 segundos. Não usa os textos gerados por modelos da versão anterior. Decifra usa respostas curadas de cinco letras: 33 em português, 34 em inglês e 29 em espanhol. O conjunto pequeno pode repetir palavras. Listas de palpites válidos têm respectivamente 5.069, 6.476 e 4.859 entradas. Anagrama e LexiMaze usam o vocabulário curado existente.

Revisão linguística humana dos três idiomas e ampliação das respostas do Decifra continuam recomendadas. As contagens e avisos de `npm run validate` também incluem dados legados (cruzadinhas/rimas/outros jogos); seus antigos déficits não são requisitos desta revisão.

## Dispositivos e gráficos

A sala usa geometria WebGL real, sombras, reflexos e efeitos luminosos; jogos DOM/Canvas são posicionados no monitor do gabinete pelo CSS3DRenderer. Sem WebGL, há uma alternativa simplificada e jogável. Não é uma reprodução visual equivalente ao 3D.

Testado em Chromium Linux com renderização de software e larguras de 320 a 3.840 px. Não foram medidos 60 FPS em uma GPU física, Lighthouse ou consumo em celulares de entrada. Windows real, Safari, Firefox, aparelhos com toque, leitor de tela e instalação PWA ainda precisam de avaliação. Os controles de toque existem; simulação de largura não substitui teste físico.

Primeiro acesso precisa baixar os recursos. Offline permite os quatro jogos e progresso visitante; conta, ranking e sincronização precisam de internet. Feche as abas antigas após atualizar para ativar o novo service worker.

## Conta e revisão pública

Termos e privacidade continuam rascunhos. Definir responsável, contato, retenção e condições antes de abrir contas ao público. O cadastro bloqueia menores de 13 e pede declaração adicional de 13–17; não verifica identidade do responsável. Revisar esse fluxo juridicamente. Arte e som são originais; licenças externas estão em [LICENCAS.md](LICENCAS.md).

O servidor valida pontuações, duração, métricas, taxa e economia; um cliente estático pode ser adulterado. Ranking com prêmios exige monitoramento adicional. Foco, rótulos, redução de movimento e controles foram implementados; contraste de todos os estados e jogabilidade sem visão precisam de auditoria humana.

Você já confirmou Node 25.1.0, npm 10.8.3 e Git 2.46.0 no Windows. Não precisa baixá-los novamente. A atualização e as etapas do banco estão em [GUIA-INICIANTE.md](GUIA-INICIANTE.md).
