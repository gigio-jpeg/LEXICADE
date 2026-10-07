-- Aplica sobre a versão já instalada. Não altera pontuações antigas.
begin;
alter table public.profiles add column arcade_style jsonb not null default '{}';
create table public.duel_phrases(lang text not null check(lang in ('pt','en','es')), body text not null check(length(body) between 20 and 160), primary key(lang,body));
create table public.duel_matches(
 id uuid primary key default gen_random_uuid(), host_id uuid not null references public.profiles(id) on delete cascade,
 guest_id uuid references public.profiles(id) on delete cascade, lang text not null check(lang in ('pt','en','es')),
 phrases jsonb not null, status text not null default 'waiting' check(status in ('waiting','running','finished','cancelled')),
 starts_at timestamptz, created_at timestamptz not null default clock_timestamp(), expires_at timestamptz not null default clock_timestamp()+interval '15 minutes',
 check(guest_id is null or guest_id<>host_id));
create table public.duel_players(
 match_id uuid not null references public.duel_matches(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete cascade,
 phrase_index int not null default 0 check(phrase_index between 0 and 300),
 completed_chars int not null default 0, current_chars int not null default 0,
 updated_at timestamptz not null default clock_timestamp(), rewarded boolean not null default false,
 primary key(match_id,user_id));
create index duel_host_date on public.duel_matches(host_id,created_at);
create index duel_player_user on public.duel_players(user_id);
alter table public.duel_phrases enable row level security;
alter table public.duel_matches enable row level security;
alter table public.duel_players enable row level security;
revoke all on public.duel_phrases,public.duel_matches,public.duel_players from public,anon,authenticated;
grant select on public.duel_matches,public.duel_players to authenticated;
create policy duel_members on public.duel_matches for select to authenticated using(auth.uid() in (host_id,guest_id));
create policy duel_players_members on public.duel_players for select to authenticated using(exists(select 1 from public.duel_matches m where m.id=match_id and auth.uid() in(m.host_id,m.guest_id)));

create function public.get_arcade_style() returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();style jsonb;rounds int;
begin select arcade_style into style from public.profiles where id=uid;
 select (select count(*) from public.scores where user_id=uid)+(select count(*) from public.duel_players where user_id=uid and rewarded) into rounds;
 return jsonb_build_object('style',style,'rounds',rounds);end $$;
create function public.save_arcade_style(p_style jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();rounds int;required int;title text:=coalesce(p_style->>'title','');finish text:=p_style->>'finish';sticker text:=p_style->>'sticker';
begin
 if jsonb_typeof(p_style)<>'object' or p_style- array['title','finish','sticker'] <> '{}'::jsonb or length(title)>18 or (title<>'' and title !~ '^[[:alnum:] _-]+$') or finish is null or finish not in ('original','sky','violet','gold') or sticker is null or sticker not in ('none','star','crown') then raise exception 'invalid_style';end if;
 select (public.get_arcade_style()->>'rounds')::int into rounds;
 required:=greatest(case finish when 'sky' then 3 when 'violet' then 10 when 'gold' then 25 else 0 end,case sticker when 'star' then 5 when 'crown' then 25 else 0 end);
 if rounds<required then raise exception 'style_locked';end if;
 update public.profiles set arcade_style=p_style,updated_at=clock_timestamp() where id=uid;return p_style;end $$;

create function public.get_duel(p_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();m public.duel_matches;players jsonb;best int;mine int;bonus int;winner uuid;
begin
 select * into m from public.duel_matches where id=p_id and uid in(host_id,guest_id) for update;
 if not found then raise exception 'duel_not_found';end if;
 if m.status='waiting' and clock_timestamp()>m.expires_at then update public.duel_matches set status='cancelled' where id=p_id returning * into m;end if;
 if m.status='running' and clock_timestamp()>=m.starts_at+interval '60 seconds' then update public.duel_matches set status='finished' where id=p_id returning * into m;end if;
 select max(completed_chars+current_chars) into best from public.duel_players where match_id=p_id;
 if m.status='finished' and (select count(*) from public.duel_players where match_id=p_id and completed_chars+current_chars>0)=2 then
  if (select count(*) from public.duel_players where match_id=p_id and completed_chars+current_chars=best)=1 then select user_id into winner from public.duel_players where match_id=p_id and completed_chars+current_chars=best;end if;
  select completed_chars+current_chars into mine from public.duel_players where match_id=p_id and user_id=uid;
  bonus:=case when winner=uid then 50 when winner is null then 35 else 25 end;
  update public.duel_players set rewarded=true where match_id=p_id and user_id=uid and not rewarded;
  if found then update public.profiles set xp=xp+bonus,coins=coins+bonus/5,level=public.level_for_xp(xp+bonus),updated_at=clock_timestamp() where id=uid;end if;
 end if;
 select jsonb_agg(jsonb_build_object('id',d.user_id,'name',p.username,'index',d.phrase_index,'chars',d.completed_chars+d.current_chars,'updated_at',d.updated_at) order by d.user_id) into players from public.duel_players d join public.profiles p on p.id=d.user_id where d.match_id=p_id;
 return jsonb_build_object('id',m.id,'host_id',m.host_id,'guest_id',m.guest_id,'lang',m.lang,'phrases',m.phrases,'status',m.status,'starts_at',m.starts_at,'server_now',clock_timestamp(),'players',players,'winner',winner);
end $$;
create function public.create_duel(p_lang text) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();pid uuid;words jsonb;
begin
 perform 1 from public.profiles where id=uid for update;
 if p_lang not in ('pt','en','es') or p_lang is null then raise exception 'invalid_lang';end if;
 if (select count(*) from public.duel_matches where host_id=uid and created_at>clock_timestamp()-interval '1 day')>=40 or (select count(*) from public.duel_matches where host_id=uid and status='waiting' and expires_at>clock_timestamp())>=3 then raise exception 'duel_rate_limit';end if;
 select jsonb_agg(body order by random()) into words from public.duel_phrases where lang=p_lang;
 if words is null then raise exception 'duel_content_missing';end if;
 insert into public.duel_matches(host_id,lang,phrases) values(uid,p_lang,words) returning id into pid;
 insert into public.duel_players(match_id,user_id) values(pid,uid);return public.get_duel(pid);
end $$;
create function public.join_duel(p_id uuid) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();m public.duel_matches;
begin
 select * into m from public.duel_matches where id=p_id for update;
 if not found then raise exception 'duel_not_found';end if;
 if uid in(m.host_id,m.guest_id) then return public.get_duel(p_id);end if;
 if m.status<>'waiting' or m.guest_id is not null or m.expires_at<clock_timestamp() then raise exception 'duel_unavailable';end if;
 update public.duel_matches set guest_id=uid,status='running',starts_at=clock_timestamp()+interval '5 seconds' where id=p_id;
 insert into public.duel_players(match_id,user_id) values(p_id,uid);return public.get_duel(p_id);
end $$;
create function public.duel_progress(p_id uuid,p_index int,p_text text) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();m public.duel_matches;d public.duel_players;target text;typed text;prefix int:=0;budget int;
begin
 select * into m from public.duel_matches where id=p_id and uid in(host_id,guest_id) for update;
 if not found then raise exception 'duel_not_found';end if;
 if m.status<>'running' or clock_timestamp()<m.starts_at or clock_timestamp()>=m.starts_at+interval '60 seconds' then return public.get_duel(p_id);end if;
 select * into d from public.duel_players where match_id=p_id and user_id=uid for update;
 if p_index is null or p_index<>d.phrase_index or p_text is null or length(p_text)>180 then return public.get_duel(p_id);end if;
 if clock_timestamp()-d.updated_at<interval '120 milliseconds' then return public.get_duel(p_id);end if;
 target:=public.normalized(m.phrases->>(d.phrase_index%jsonb_array_length(m.phrases)));typed:=public.normalized(p_text);
 while prefix<least(length(target),length(typed)) and substr(target,prefix+1,1)=substr(typed,prefix+1,1) loop prefix:=prefix+1;end loop;
 budget:=ceil(greatest(0,extract(epoch from(clock_timestamp()-m.starts_at)))*35)+8;
 if d.completed_chars+prefix>budget then raise exception 'duel_speed_limit';end if;
 if target=typed then
  update public.duel_players set phrase_index=phrase_index+1,completed_chars=completed_chars+length(target),current_chars=0,updated_at=clock_timestamp() where match_id=p_id and user_id=uid;
 else update public.duel_players set current_chars=prefix,updated_at=clock_timestamp() where match_id=p_id and user_id=uid;end if;
 return public.get_duel(p_id);
end $$;
revoke all on function public.get_arcade_style(),public.save_arcade_style(jsonb),public.get_duel(uuid),public.create_duel(text),public.join_duel(uuid),public.duel_progress(uuid,int,text) from public,anon;
grant execute on function public.get_arcade_style(),public.save_arcade_style(jsonb),public.get_duel(uuid),public.create_duel(text),public.join_duel(uuid),public.duel_progress(uuid,int,text) to authenticated;
-- Realtime é uma melhoria; o cliente também usa polling para reconexão.
do $$ begin
 if exists(select 1 from pg_publication where pubname='supabase_realtime') then
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='duel_matches' and schemaname='public') then execute 'alter publication supabase_realtime add table public.duel_matches';end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and tablename='duel_players' and schemaname='public') then execute 'alter publication supabase_realtime add table public.duel_players';end if;
 end if;
end $$;
insert into public.duel_phrases(lang,body) values ('pt','A cidade acende suas luzes quando o sol decide descansar.');
insert into public.duel_phrases(lang,body) values ('pt','Toda grande aventura começa com uma pequena curiosidade.');
insert into public.duel_phrases(lang,body) values ('pt','Há um universo inteiro escondido entre duas palavras.');
insert into public.duel_phrases(lang,body) values ('pt','O café esfriou enquanto eu procurava a frase perfeita.');
insert into public.duel_phrases(lang,body) values ('pt','Hoje é um bom dia para bater o seu próprio recorde.');
insert into public.duel_phrases(lang,body) values ('pt','O vento levou as folhas, mas deixou uma história.');
insert into public.duel_phrases(lang,body) values ('pt','Um teclado, uma ideia e um mundo de possibilidades.');
insert into public.duel_phrases(lang,body) values ('pt','A lua encontrou seu reflexo numa poça de chuva.');
insert into public.duel_phrases(lang,body) values ('pt','Escreva com calma até descobrir o seu próprio ritmo.');
insert into public.duel_phrases(lang,body) values ('pt','Nem todo caminho precisa chegar ao mesmo lugar.');
insert into public.duel_phrases(lang,body) values ('pt','A última máquina do salão guarda o próximo desafio.');
insert into public.duel_phrases(lang,body) values ('pt','Pequenas conquistas também merecem grandes sorrisos.');
insert into public.duel_phrases(lang,body) values ('pt','As estrelas parecem letras espalhadas pelo céu.');
insert into public.duel_phrases(lang,body) values ('pt','O melhor plano às vezes começa com uma tentativa.');
insert into public.duel_phrases(lang,body) values ('pt','A próxima fase fica logo depois da sua coragem.');
insert into public.duel_phrases(lang,body) values ('pt','Entre uma tecla e outra, o tempo muda de velocidade.');
insert into public.duel_phrases(lang,body) values ('pt','Ninguém precisa ser perfeito para começar a jogar.');
insert into public.duel_phrases(lang,body) values ('pt','O silêncio da noite combina com o brilho do neon.');
insert into public.duel_phrases(lang,body) values ('pt','A imaginação abre portas que ainda não existem.');
insert into public.duel_phrases(lang,body) values ('pt','Uma palavra certa pode transformar toda a conversa.');
insert into public.duel_phrases(lang,body) values ('pt','No bolso do casaco encontrei um mapa sem destino.');
insert into public.duel_phrases(lang,body) values ('pt','O relógio corre, mas seus dedos podem correr mais.');
insert into public.duel_phrases(lang,body) values ('pt','Aprender uma palavra é ganhar uma nova janela.');
insert into public.duel_phrases(lang,body) values ('pt','Cada erro é uma pista para acertar na próxima vez.');
insert into public.duel_phrases(lang,body) values ('pt','O trem partiu antes que a despedida terminasse.');
insert into public.duel_phrases(lang,body) values ('pt','Se o céu fosse um livro, as nuvens seriam páginas.');
insert into public.duel_phrases(lang,body) values ('pt','O jardim cresce um pouco mesmo quando ninguém olha.');
insert into public.duel_phrases(lang,body) values ('pt','A gente reconhece uma boa ideia pelo brilho nos olhos.');
insert into public.duel_phrases(lang,body) values ('pt','A chuva desenha caminhos novos no vidro da janela.');
insert into public.duel_phrases(lang,body) values ('pt','Seu próximo recorde começa com a próxima palavra.');
insert into public.duel_phrases(lang,body) values ('en','The city turns on its lights when the sun goes to rest.');
insert into public.duel_phrases(lang,body) values ('en','Every great adventure begins with a little curiosity.');
insert into public.duel_phrases(lang,body) values ('en','A whole universe is hiding between two simple words.');
insert into public.duel_phrases(lang,body) values ('en','My coffee went cold while I searched for the perfect line.');
insert into public.duel_phrases(lang,body) values ('en','Today is a good day to beat your own best score.');
insert into public.duel_phrases(lang,body) values ('en','The wind took the leaves but left behind a story.');
insert into public.duel_phrases(lang,body) values ('en','One keyboard, one idea, and a world of possibilities.');
insert into public.duel_phrases(lang,body) values ('en','The moon found its reflection in a puddle of rain.');
insert into public.duel_phrases(lang,body) values ('en','Take your time until you discover your own rhythm.');
insert into public.duel_phrases(lang,body) values ('en','Not every road needs to lead to the same place.');
insert into public.duel_phrases(lang,body) values ('en','The last machine in the room holds your next challenge.');
insert into public.duel_phrases(lang,body) values ('en','Small victories deserve the biggest smiles.');
insert into public.duel_phrases(lang,body) values ('en','The stars look like letters scattered across the sky.');
insert into public.duel_phrases(lang,body) values ('en','The best plan sometimes starts with a simple attempt.');
insert into public.duel_phrases(lang,body) values ('en','The next level is just beyond a little courage.');
insert into public.duel_phrases(lang,body) values ('en','Between one key and another, time changes its pace.');
insert into public.duel_phrases(lang,body) values ('en','You do not have to be perfect to start playing.');
insert into public.duel_phrases(lang,body) values ('en','The quiet night goes well with the glow of neon.');
insert into public.duel_phrases(lang,body) values ('en','Imagination opens doors that do not exist yet.');
insert into public.duel_phrases(lang,body) values ('en','The right word can change the whole conversation.');
insert into public.duel_phrases(lang,body) values ('en','I found a map with no destination in my coat pocket.');
insert into public.duel_phrases(lang,body) values ('en','The clock is fast, but your fingers can be faster.');
insert into public.duel_phrases(lang,body) values ('en','Learning a new word is like opening a new window.');
insert into public.duel_phrases(lang,body) values ('en','Every mistake is a clue for getting it right next time.');
insert into public.duel_phrases(lang,body) values ('en','The train left before we finished saying goodbye.');
insert into public.duel_phrases(lang,body) values ('en','If the sky were a book, clouds would be its pages.');
insert into public.duel_phrases(lang,body) values ('en','The garden keeps growing even when nobody is watching.');
insert into public.duel_phrases(lang,body) values ('en','A good idea brings a spark to the eyes.');
insert into public.duel_phrases(lang,body) values ('en','Rain draws new paths on the glass of the window.');
insert into public.duel_phrases(lang,body) values ('en','Your next best score starts with the next word.');
insert into public.duel_phrases(lang,body) values ('es','La ciudad enciende sus luces cuando el sol se va a descansar.');
insert into public.duel_phrases(lang,body) values ('es','Toda gran aventura comienza con una pequeña curiosidad.');
insert into public.duel_phrases(lang,body) values ('es','Hay un universo entero escondido entre dos palabras.');
insert into public.duel_phrases(lang,body) values ('es','El café se enfrió mientras buscaba la frase perfecta.');
insert into public.duel_phrases(lang,body) values ('es','Hoy es un buen día para superar tu propio récord.');
insert into public.duel_phrases(lang,body) values ('es','El viento se llevó las hojas, pero dejó una historia.');
insert into public.duel_phrases(lang,body) values ('es','Un teclado, una idea y un mundo de posibilidades.');
insert into public.duel_phrases(lang,body) values ('es','La luna encontró su reflejo en un charco de lluvia.');
insert into public.duel_phrases(lang,body) values ('es','Escribe con calma hasta descubrir tu propio ritmo.');
insert into public.duel_phrases(lang,body) values ('es','No todos los caminos deben llegar al mismo lugar.');
insert into public.duel_phrases(lang,body) values ('es','La última máquina de la sala guarda el próximo desafío.');
insert into public.duel_phrases(lang,body) values ('es','Las pequeñas victorias merecen grandes sonrisas.');
insert into public.duel_phrases(lang,body) values ('es','Las estrellas parecen letras repartidas por el cielo.');
insert into public.duel_phrases(lang,body) values ('es','El mejor plan a veces comienza con un intento.');
insert into public.duel_phrases(lang,body) values ('es','La próxima fase está justo después de tu valentía.');
insert into public.duel_phrases(lang,body) values ('es','Entre una tecla y otra, el tiempo cambia de velocidad.');
insert into public.duel_phrases(lang,body) values ('es','No hace falta ser perfecto para empezar a jugar.');
insert into public.duel_phrases(lang,body) values ('es','El silencio de la noche combina con el brillo del neón.');
insert into public.duel_phrases(lang,body) values ('es','La imaginación abre puertas que todavía no existen.');
insert into public.duel_phrases(lang,body) values ('es','La palabra correcta puede cambiar toda la conversación.');
insert into public.duel_phrases(lang,body) values ('es','Encontré un mapa sin destino en el bolsillo del abrigo.');
insert into public.duel_phrases(lang,body) values ('es','El reloj corre, pero tus dedos pueden correr más.');
insert into public.duel_phrases(lang,body) values ('es','Aprender una palabra es abrir una ventana nueva.');
insert into public.duel_phrases(lang,body) values ('es','Cada error es una pista para acertar la próxima vez.');
insert into public.duel_phrases(lang,body) values ('es','El tren partió antes de que terminara la despedida.');
insert into public.duel_phrases(lang,body) values ('es','Si el cielo fuera un libro, las nubes serían sus páginas.');
insert into public.duel_phrases(lang,body) values ('es','El jardín crece un poco incluso cuando nadie lo mira.');
insert into public.duel_phrases(lang,body) values ('es','Una buena idea trae un brillo nuevo a los ojos.');
insert into public.duel_phrases(lang,body) values ('es','La lluvia dibuja caminos nuevos en el cristal de la ventana.');
insert into public.duel_phrases(lang,body) values ('es','Tu próximo récord empieza con la próxima palabra.');
commit;
