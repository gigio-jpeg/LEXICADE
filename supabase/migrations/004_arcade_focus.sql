-- Revisão 2: metas de conquistas para as quatro máquinas.
-- Compatível com uma base já instalada; não apaga perfis ou pontuações.
begin;
update public.achievements set target=1 where id='games-3';
update public.achievements set target=2 where id='games-6';
update public.achievements set target=3 where id='games-10';
update public.achievements set target=4 where id='games-16';
commit;
