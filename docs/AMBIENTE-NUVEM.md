# Ambiente de desenvolvimento na nuvem

O checkout usado é `/workspace/LEXICADE`; esta tarefa já é isolada e não precisa de worktree. A construção do site foi autorizada pelo usuário, além da preparação do ambiente.

Node.js 24.19.0 e npm disponíveis. Three.js e Supabase estão distribuídos localmente em `vendor/`. Não há dependências npm obrigatórias ou build; `npm start` inicia o servidor estático. O servidor foi iniciado/reiniciado e validado por HTTP e testes de navegador. `npm test` executou 24 testes; SQL foi testado isoladamente em PGlite instalado em uma pasta temporária fora do checkout. Evidências completas em `VALIDACAO.md`.

Foram salvas as instruções reutilizáveis de inicialização no campo **start_skill** do rascunho do ambiente, usando a skill **cloud-environment-onboarding:setup**. Configurações de rede, segredos e repositórios foram preservadas. Não há script de instalação a adicionar para iniciar este projeto.

Esse salvamento não executa comandos, não publica o site e não confirma restauração em uma nova tarefa. Para reutilizar o ambiente, revisar e salvar as mudanças nas configurações do ambiente e publicar o ambiente pela interface. O envio do código ao GitHub em `gigio-jpeg/LEXICADE`, branch `main`, foi autorizado pelo proprietário. Não depende do link de artefato da interface: baixar pelo GitHub em **Code → Download ZIP**. A publicação do site em Cloudflare Pages é uma ação diferente, descrita em `DEPLOY.md`.

Não colocar senhas/segredos em instruções ou executar SQL contra o Supabase do proprietário. Migrações e validação de uma conta real dependem das ações posteriores do usuário. Processos em execução precisam ser reiniciados em novas tarefas.
