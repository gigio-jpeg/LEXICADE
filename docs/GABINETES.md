# Gabinetes com identidade própria

Abra **Menu → Extras**. Os cartões mostram o modelo, descrição e requisito. A prévia 3D usa a mesma geometria da sala; arraste para girar. Modelos bloqueados podem ser vistos, mas só modelos desbloqueados podem ser salvos.

| Modelo | Desbloqueio | Identidade |
|---|---:|---|
| Original | Sempre disponível | Neon e arte específica de cada jogo |
| Madeira retrô | 5 partidas | Veios, molduras de latão e grelha vintage |
| Circuito cristal | 15 partidas | Carcaça translúcida, placas, chips e trilhas internas |
| Cromado orbital | 30 partidas | Metal escovado, reflexos, colunas e antenas luminosas |

Nome, adesivo e acabamento continuam disponíveis; modelos especiais aplicam a cor aos detalhes para preservar seus materiais. **Salvar alterações** aplica à sala. **Restaurar padrão** volta ao Original e preserva progresso/desbloqueios. Contas sincronizam pelo Supabase; visitantes usam armazenamento deste navegador.

Estas são capturas reais da sala em Chromium, com o nome de demonstração PIXEL LAB. Não são imagens usadas como cenário.

## Madeira retrô

![Gabinetes de madeira com molduras e grelha](images/cabinet-wood.png)

## Circuito cristal

![Carcaça translúcida com placas internas](images/cabinet-circuit.png)

## Cromado orbital

![Colunas cromadas e detalhes luminosos](images/cabinet-chrome.png)

## Atualização do Supabase

Se 005 e 006 já estão aplicadas, execute somente `supabase/migrations/007_cabinet_models.sql` no SQL Editor. Ela preserva estilos antigos e valida os desbloqueios no servidor. Não reaplique INSTALAR-TUDO em banco existente.
