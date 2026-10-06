begin;
create function public.username_available(p_username text) returns boolean language sql stable security definer set search_path=public as $$
  select public.username_allowed(p_username) and not exists(select 1 from public.profiles where lower(username)=lower(p_username) and id is distinct from auth.uid());
$$;
create function public.update_profile(p_username text,p_country text,p_lang text,p_avatar text,p_time_zone text,p_age_band text,p_guardian_consent boolean,p_terms_accepted boolean) returns jsonb
language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player(false); p public.profiles%rowtype;
begin
  select * into p from public.profiles where id=uid for update;
  if not public.username_allowed(p_username) or p_lang not in ('pt','en','es') or (p_country is not null and p_country !~ '^[A-Z]{2}$') or p_avatar not in ('default','spark','nova','leaf','comet') then raise exception 'invalid_profile';end if;
  if p_age_band not in ('adult','teen') or p_age_band is null or not coalesce(p_terms_accepted,false) or (p_age_band='teen' and not coalesce(p_guardian_consent,false)) then raise exception 'consent_required';end if;
  if not exists(select 1 from pg_catalog.pg_timezone_names where name=p_time_zone) then raise exception 'invalid_timezone';end if;
  if p_time_zone<>p.time_zone and not p.onboarding_required and p.timezone_changed_at>now()-interval '30 days' then raise exception 'timezone_change_limited';end if;
  update public.profiles set username=p_username,country=p_country,preferred_lang=p_lang,avatar_id=p_avatar,
    time_zone=p_time_zone,timezone_changed_at=case when p_time_zone<>time_zone then now() else timezone_changed_at end,
    age_band=p_age_band,guardian_consent=p_guardian_consent,terms_accepted_at=coalesce(terms_accepted_at,now()),onboarding_required=false,updated_at=now() where id=uid;
  return jsonb_build_object('saved',true);
end $$;

create function public.submit_score(p_game text,p_mode text,p_lang text,p_score int,p_metrics jsonb,p_duration_ms int) returns jsonb
language plpgsql security definer set search_path=public as $$
declare
  uid uuid:=public.require_player(); p public.profiles%rowtype;l public.game_limits%rowtype;
  previous int;newbest boolean;today date;streak int;performance numeric;xp_gain int;coin_gain int;
  daily_bonus int:=0;daily_attempt public.daily_attempts%rowtype;award public.achievements%rowtype;
  value numeric;award_ids jsonb:='[]';changed int;oldlevel int;ranking int;
  rounds_count bigint;game_count int;lang_count int;maxppm numeric;maxscore int;key text;required_keys text[];counter numeric;cap numeric;
begin
  select * into p from public.profiles where id=uid for update;
  select * into l from public.game_limits where game=p_game and mode=p_mode;
  if not found or p_lang is null or p_lang not in ('pt','en','es') or p_score is null or p_score<0 or p_score>l.max_score
    or p_duration_ms is null or p_duration_ms<l.min_duration_ms or p_duration_ms>7200000
    or p_metrics is null or jsonb_typeof(p_metrics)<>'object' or octet_length(p_metrics::text)>4096 then raise exception 'invalid_score';end if;
  if exists(select 1 from public.scores where user_id=uid and game=p_game and created_at>now()-interval '5 seconds') then raise exception 'rate_limited';end if;
  -- Numeric metrics are numbers, not strings; no NaN, negative or implausible counters.
  foreach key in array array['ppm','precisao','nivel_max','caracteres_certos','erros','fase','palavras','fantasmas_capturados','palavras_certas','ajudas','nivel','ondas','chefes','maior_palavra','tamanho_grade','vidas_restantes','passos','minimo','tamanho_max','cadeia_max','portais','acertos','sequencia_max','tempo_medio','rimas','maior_sequencia','tentativas','tamanho'] loop
    if p_metrics ? key and (jsonb_typeof(p_metrics->key)<>'number' or (p_metrics->>key)::numeric<0 or (p_metrics->>key)::numeric>10000000) then raise exception 'invalid_metrics';end if;
  end loop;
  if p_metrics ? 'precisao' and (p_metrics->>'precisao')::numeric>100 then raise exception 'invalid_metrics';end if;
  required_keys:=case p_game
    when 'wordman' then array['fase','palavras','fantasmas_capturados'] when 'chuva' then array['palavras','nivel','precisao']
    when 'space-letters' then array['ondas','chefes','precisao'] when 'anagrama' then array['palavras','maior_palavra']
    when 'caca-palavras' then array['palavras','tamanho_grade'] when 'forca' then array['palavras','vidas_restantes']
    when 'snake' then array['palavras','tamanho_max'] when 'tetris-letras' then array['palavras','cadeia_max']
    when 'flappy' then array['palavras','portais'] when 'intrusa' then array['acertos','sequencia_max']
    when 'ortografia' then array['acertos','tempo_medio'] when 'rimas' then array['rimas','maior_sequencia']
    when 'typerush' then array['ppm','precisao','nivel_max','caracteres_certos','erros']
    when 'decifra' then array['tentativas','resolvido','tamanho','variante']
    when 'cruzadinha' then array['palavras_certas','ajudas','dificuldade']
    when 'escada' then array['passos','minimo']
    else array[]::text[] end;
  if not(p_metrics ?& required_keys) then raise exception 'missing_metrics';end if;
  if exists(select 1 from jsonb_object_keys(p_metrics) k where not(k=any(required_keys))) then raise exception 'invalid_metrics';end if;
  counter:=coalesce((p_metrics->>'palavras')::numeric,(p_metrics->>'acertos')::numeric,(p_metrics->>'rimas')::numeric,0);
  if counter>p_duration_ms::numeric/300+10 then raise exception 'implausible_progress';end if;
  cap:=case p_game
    when 'wordman' then (counter+1)*12*100*(p_metrics->>'fase')::numeric+counter*300+(p_metrics->>'fantasmas_capturados')::numeric*200
    when 'chuva' then counter*12*50*(p_metrics->>'nivel')::numeric+counter*110
    when 'space-letters' then ((p_metrics->>'ondas')::numeric+1)*9*12*200+((p_metrics->>'chefes')::numeric+1)*200*200
    when 'anagrama' then counter*740 when 'caca-palavras' then counter*1200 when 'forca' then counter*1500
    when 'snake' then counter*1300+1000 when 'tetris-letras' then counter*12*80*greatest(1,(p_metrics->>'cadeia_max')::numeric)
    when 'flappy' then counter*300+(p_metrics->>'portais')::numeric*150
    when 'intrusa' then counter*100+15*counter*(counter+1)/2 when 'ortografia' then counter*220
    when 'rimas' then counter*620 else l.max_score end;
  if p_score>cap then raise exception 'score_metrics_mismatch';end if;
  if p_game='flappy' and p_score<>cap then raise exception 'score_metrics_mismatch';end if;
  if p_game='typerush' then
    if not (p_metrics ?& array['ppm','precisao','nivel_max','caracteres_certos','erros']) or (p_metrics->>'ppm')::numeric>l.max_ppm
      or (p_metrics->>'caracteres_certos')::numeric>p_duration_ms::numeric/60000*l.max_ppm*5+10
      or abs((p_metrics->>'ppm')::numeric-round((p_metrics->>'caracteres_certos')::numeric/5/(p_duration_ms::numeric/60000)))>2
      or (p_metrics->>'nivel_max')::numeric not between 1 and 12
      or p_score>(p_metrics->>'caracteres_certos')::numeric*50*(p_metrics->>'nivel_max')::numeric then raise exception 'invalid_typing';end if;
  elsif p_game='decifra' then
    if not (p_metrics ?& array['tentativas','resolvido','tamanho','variante']) or jsonb_typeof(p_metrics->'resolvido')<>'boolean'
      or (p_metrics->>'tentativas')::int not between 1 and 9 or (p_metrics->>'tamanho')::int not between 4 and 6 then raise exception 'invalid_decifra';end if;
    if p_metrics->>'variante'<>p_mode or (p_metrics->>'tentativas')::int>(case p_mode when 'quartet' then 9 when 'duet' then 7 else 6 end)
      or p_score<>(case when (p_metrics->>'resolvido')::boolean then greatest(100,(8-(p_metrics->>'tentativas')::int)*150)*(case p_mode when 'quartet' then 4 when 'duet' then 2 else 1 end) else 0 end) then raise exception 'invalid_decifra';end if;
  elsif p_game='cruzadinha' then
    if not (p_metrics ? 'palavras_certas') or (p_metrics->>'palavras_certas')::int not between 0 and 10 or p_score>10000 then raise exception 'invalid_crossword';end if;
  elsif p_game='escada' then
    if not (p_metrics ?& array['passos','minimo']) or (p_metrics->>'passos')::int<(p_metrics->>'minimo')::int or p_score>1500 then raise exception 'invalid_ladder';end if;
  end if;
  today:=public.player_date(uid);
  if p_mode='daily' then
    if p_game not in ('typerush','decifra','cruzadinha','escada') or exists(select 1 from public.daily_results where user_id=uid and play_date=today and game=p_game and lang=p_lang) then raise exception 'daily_already_submitted';end if;
    if p_game='decifra' then
      select * into daily_attempt from public.daily_attempts where user_id=uid and play_date=today and lang=p_lang;
      if not found or (not daily_attempt.solved and jsonb_array_length(daily_attempt.history)<6) then raise exception 'daily_not_finished';end if;
      if p_score<>(case when daily_attempt.solved then greatest(100,(8-jsonb_array_length(daily_attempt.history))*150) else 0 end)
        or (p_metrics->>'tentativas')::int<>jsonb_array_length(daily_attempt.history) or (p_metrics->>'resolvido')::boolean<>daily_attempt.solved then raise exception 'daily_mismatch';end if;
    end if;
    if p_game='typerush' and p_duration_ms<58000 then raise exception 'daily_not_finished';end if;
    insert into public.daily_results(user_id,play_date,game,lang,attempts,solved,score)
      values(uid,today,p_game,p_lang,(p_metrics->>'tentativas')::int,coalesce((p_metrics->>'resolvido')::boolean,true),p_score);
    daily_bonus:=20;
  end if;
  select best_score into previous from public.personal_bests where user_id=uid and game=p_game and mode=p_mode and lang=p_lang;
  newbest:=p_score>coalesce(previous,0);
  insert into public.scores(user_id,game,mode,lang,score,metrics,duration_ms) values(uid,p_game,p_mode,p_lang,p_score,p_metrics,p_duration_ms);
  insert into public.personal_bests(user_id,game,mode,lang,best_score,best_metrics) values(uid,p_game,p_mode,p_lang,p_score,p_metrics)
    on conflict(user_id,game,mode,lang) do update set best_score=excluded.best_score,best_metrics=excluded.best_metrics,achieved_at=now() where excluded.best_score>personal_bests.best_score;
  streak:=case when p.last_played_on=today then p.streak_current when p.last_played_on=today-1 then p.streak_current+1 else 1 end;
  performance:=least(2,greatest(0.5,p_score::numeric/(p_duration_ms::numeric/1000)/5));
  xp_gain:=round((30*performance+case when newbest then 10 else 0 end+daily_bonus)*(1+least(0.5,streak::numeric*0.01)));
  coin_gain:=floor(xp_gain*0.2);oldlevel:=p.level;
  update public.profiles set xp=xp+xp_gain,coins=coins+coin_gain,level=greatest(level,public.level_for_xp(xp+xp_gain)),streak_current=streak,
    streak_best=greatest(streak_best,streak),last_played_on=today,updated_at=now() where id=uid returning * into p;
  select count(*),count(distinct game),count(distinct lang),coalesce(max((metrics->>'ppm')::numeric),0),max(score)
    into rounds_count,game_count,lang_count,maxppm,maxscore from public.scores where user_id=uid;
  for award in select * from public.achievements where id not in(select achievement_id from public.user_achievements where user_id=uid) loop
    value:=case award.kind when 'rounds' then rounds_count when 'games' then game_count when 'langs' then lang_count when 'ppm' then maxppm when 'score' then maxscore when 'level' then p.level when 'streak' then streak else 0 end;
    if value>=award.target then
      insert into public.user_achievements(user_id,achievement_id) values(uid,award.id) on conflict do nothing;
      get diagnostics changed=row_count;
      if changed>0 then xp_gain:=xp_gain+award.xp_reward;coin_gain:=coin_gain+award.coin_reward;award_ids:=award_ids||jsonb_build_array(award.id);
        update public.profiles set xp=xp+award.xp_reward,coins=coins+award.coin_reward,level=greatest(level,public.level_for_xp(xp+award.xp_reward)) where id=uid returning * into p;
      end if;
    end if;
  end loop;
  select count(*)+1 into ranking from(select user_id,max(best_score) as best from public.personal_bests where game=p_game and mode=p_mode and lang=p_lang group by user_id) b where best>p_score;
  return jsonb_build_object('xp_ganho',xp_gain,'moedas_ganhas',coin_gain,'subiu_de_nivel',p.level>oldlevel,'novo_recorde',newbest,'conquistas',award_ids,'posicao_ranking',ranking,'level',p.level);
end $$;

create function public.guess_colors(p_answer text,p_guess text) returns jsonb language plpgsql immutable set search_path=public as $$
declare a text:=public.normalized(p_answer);g text:=public.normalized(p_guess);colors text[]:=array['absent','absent','absent','absent','absent'];remaining text:='';i int;at int;letter text;
begin
  for i in 1..5 loop if substr(a,i,1)=substr(g,i,1) then colors[i]:='correct';else remaining:=remaining||substr(a,i,1);end if;end loop;
  for i in 1..5 loop if colors[i]<>'correct' then letter:=substr(g,i,1);at:=position(letter in remaining);if at>0 then colors[i]:='present';remaining:=overlay(remaining placing '' from at for 1);end if;end if;end loop;
  return to_jsonb(colors);
end $$;
create function public.check_guess(p_play_date date,p_lang text,p_guess text) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();today date;answer text;attempt public.daily_attempts%rowtype;colors jsonb;guess_word text:=public.normalized(p_guess);finished boolean;
begin
  perform 1 from public.profiles where id=uid for update;
  today:=public.player_date(uid);
  if p_play_date is null or p_play_date<>today or p_lang is null or p_lang not in ('pt','en','es') or guess_word is null or guess_word !~ '^[a-z]{5}$' then raise exception 'invalid_guess';end if;
  if not exists(select 1 from public.valid_words where lang=p_lang and public.normalized(valid_words.word)=guess_word) then raise exception 'invalid_word';end if;
  -- Serialize creation across users; the secret is randomly selected on the server.
  perform pg_catalog.pg_advisory_xact_lock(hashtext(today::text||':'||p_lang));
  select daily_words.answer into answer from public.daily_words where play_date=today and lang=p_lang;
  if answer is null then
    select word_answers.word into answer from public.word_answers where lang=p_lang order by random() limit 1;
    if answer is null then raise exception 'daily_content_missing';end if;
    insert into public.daily_words values(today,p_lang,answer);
  end if;
  insert into public.daily_attempts(user_id,play_date,lang) values(uid,today,p_lang) on conflict do nothing;
  select * into attempt from public.daily_attempts where user_id=uid and play_date=today and lang=p_lang for update;
  if not attempt.solved and jsonb_array_length(attempt.history)<6 then
    colors:=public.guess_colors(answer,guess_word);
    attempt.history:=attempt.history||jsonb_build_array(jsonb_build_object('word',guess_word,'colors',jsonb_build_array(colors)));
    attempt.solved:=public.normalized(answer)=guess_word;
    update public.daily_attempts set history=attempt.history,solved=attempt.solved where user_id=uid and play_date=today and lang=p_lang;
  else colors:=attempt.history->-1->'colors'->0;end if;
  finished:=attempt.solved or jsonb_array_length(attempt.history)>=6;
  return jsonb_build_object('colors',colors,'solved',attempt.solved,'attempts',jsonb_array_length(attempt.history),'history',attempt.history,'answer',case when finished then answer else null end);
end $$;

create function public.buy_item(p_item_id text) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();p public.profiles%rowtype;item public.shop_items%rowtype;
begin select * into p from public.profiles where id=uid for update;select * into item from public.shop_items where id=p_item_id;
  if not found then raise exception 'invalid_item';end if;
  if exists(select 1 from public.user_items where user_id=uid and item_id=p_item_id) then return jsonb_build_object('coins',p.coins);end if;
  if p.coins<item.price then raise exception 'insufficient_coins';end if;
  update public.profiles set coins=coins-item.price where id=uid returning coins into p.coins;
  insert into public.user_items(user_id,item_id) values(uid,p_item_id);return jsonb_build_object('coins',p.coins);
end $$;
create function public.equip_item(p_item_id text) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();kind text;
begin perform 1 from public.profiles where id=uid for update;
  select type into kind from public.shop_items where id=p_item_id;
  if kind is null or not exists(select 1 from public.user_items where user_id=uid and item_id=p_item_id) then raise exception 'item_not_owned';end if;
  update public.profiles set equipped=jsonb_set(equipped,array[kind],to_jsonb(p_item_id)) where id=uid;
  return jsonb_build_object('equipped',true);
end $$;
create function public.import_guest_data(p_payload jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();p public.profiles%rowtype;xp_gain int;coins_gain int;record jsonb;max_value int;
begin select * into p from public.profiles where id=uid for update;
  if p_payload is null or jsonb_typeof(p_payload)<>'object' or octet_length(p_payload::text)>200000 then raise exception 'invalid_import';end if;
  if exists(select 1 from public.guest_imports where user_id=uid) then return jsonb_build_object('imported',false,'already_imported',true);end if;
  if jsonb_typeof(p_payload->'xp')<>'number' or jsonb_typeof(p_payload->'coins')<>'number' then raise exception 'invalid_import';end if;
  xp_gain:=least(1000,greatest(0,(p_payload->>'xp')::numeric))::int;coins_gain:=least(250,greatest(0,(p_payload->>'coins')::numeric))::int;
  -- Imported records are kept as private metrics, never admitted to ranked scores.
  if jsonb_typeof(p_payload->'bests')<>'object' then raise exception 'invalid_import';end if;
  if (select count(*) from jsonb_each(p_payload->'bests'))>100 then raise exception 'invalid_import';end if;
  for record in select value from jsonb_each(p_payload->'bests') loop
    select max_score into max_value from public.game_limits where game=record->>'game' and mode=record->>'mode';
    if max_value is null or record->>'lang' not in ('pt','en','es') or jsonb_typeof(record->'score')<>'number'
      or (record->>'score')::numeric<0 or (record->>'score')::numeric>max_value or jsonb_typeof(record->'metrics')<>'object' then raise exception 'invalid_import_record';end if;
    insert into public.guest_bests(user_id,game,mode,lang,best_score,best_metrics)
      values(uid,record->>'game',record->>'mode',record->>'lang',least(50000,(record->>'score')::int),record->'metrics')
      on conflict(user_id,game,mode,lang) do update set best_score=greatest(guest_bests.best_score,excluded.best_score);
  end loop;
  insert into public.guest_imports(user_id) values(uid);
  update public.profiles set xp=xp+xp_gain,coins=coins+coins_gain,level=greatest(level,public.level_for_xp(xp+xp_gain)) where id=uid;
  return jsonb_build_object('imported',true,'xp',xp_gain,'coins',coins_gain);
end $$;
create function public.delete_my_account() returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player(false);begin delete from auth.users where id=uid;return jsonb_build_object('deleted',true);end $$;

revoke all on function public.guess_colors(text,text) from public,anon,authenticated;
revoke all on function public.username_available(text),public.update_profile(text,text,text,text,text,text,boolean,boolean),public.submit_score(text,text,text,int,jsonb,int),public.check_guess(date,text,text),public.buy_item(text),public.equip_item(text),public.import_guest_data(jsonb),public.delete_my_account() from public,anon,authenticated;
grant execute on function public.username_available(text) to anon,authenticated;
grant execute on function public.update_profile(text,text,text,text,text,text,boolean,boolean),public.submit_score(text,text,text,int,jsonb,int),public.check_guess(date,text,text),public.buy_item(text),public.equip_item(text),public.import_guest_data(jsonb),public.delete_my_account() to authenticated;
commit;
