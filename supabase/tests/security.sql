-- Teste transacional: cria usuários fictícios e desfaz TUDO no final.
-- Execute APENAS após migrações + seed. Não usa senhas nem credenciais reais.
-- Se falhar, execute ROLLBACK antes de investigar. Não desative RLS.
begin;
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values
 ('11111111-1111-4111-8111-111111111111','lexicade-one@example.invalid','{"username":"TestPlayerOne","age_band":"adult","terms_accepted":true,"preferred_lang":"pt","time_zone":"UTC"}','{"provider":"email"}'),
 ('22222222-2222-4222-8222-222222222222','lexicade-two@example.invalid','{"username":"TestPlayerTwo","age_band":"adult","terms_accepted":true,"preferred_lang":"en","time_zone":"UTC"}','{"provider":"email"}');
select set_config('request.jwt.claim.sub','11111111-1111-4111-8111-111111111111',true);

do $$ declare count_rows int; begin
  execute 'set local role authenticated';
  begin insert into public.scores(user_id,game,mode,lang,score,duration_ms) values('11111111-1111-4111-8111-111111111111','typerush','classic','pt',1,1000);raise exception 'TEST FAILED: direct score write';exception when insufficient_privilege then null;end;
  begin update public.profiles set xp=999999 where id='11111111-1111-4111-8111-111111111111';raise exception 'TEST FAILED: direct XP write';exception when insufficient_privilege then null;end;
  begin perform * from public.daily_words;raise exception 'TEST FAILED: secret read';exception when insufficient_privilege then null;end;
  begin perform public.guess_colors('apple','allee');raise exception 'TEST FAILED: private helper';exception when insufficient_privilege then null;end;
  select count(*) into count_rows from public.profiles;
  if count_rows<>1 then raise exception 'TEST FAILED: profile isolation';end if;
  begin perform public.submit_score('typerush','classic','pt',999999999,'{"ppm":50,"precisao":100,"nivel_max":1,"caracteres_certos":125,"erros":0}',30000);raise exception 'TEST FAILED: impossible score';exception when raise_exception then if sqlerrm<>'invalid_score' then raise;end if;end;
  perform public.submit_score('typerush','classic','pt',1000,'{"ppm":50,"precisao":100,"nivel_max":1,"caracteres_certos":125,"erros":0}',30000);
  begin perform public.submit_score('typerush','classic','pt',1000,'{"ppm":50,"precisao":100,"nivel_max":1,"caracteres_certos":125,"erros":0}',30000);raise exception 'TEST FAILED: rate limit';exception when raise_exception then if sqlerrm<>'rate_limited' then raise;end if;end;
  execute 'reset role';
end $$;

-- Fixe uma palavra APENAS para este teste transacional.
insert into public.daily_words(play_date,lang,answer) values(current_date,'en','apple') on conflict(play_date,lang) do update set answer='apple';
insert into public.valid_words values('en','apple'),('en','allee') on conflict do nothing;
do $$ declare response jsonb;i int;begin
  execute 'set local role authenticated';
  response:=public.check_guess(current_date,'en','allee');
  if response->>'answer' is not null then raise exception 'TEST FAILED: early answer reveal';end if;
  if response->'colors'<>'["correct","present","absent","absent","correct"]'::jsonb then raise exception 'TEST FAILED: repeated letter clues';end if;
  for i in 2..6 loop response:=public.check_guess(current_date,'en','allee');end loop;
  if (response->>'attempts')::int<>6 or response->>'answer'<>'apple' then raise exception 'TEST FAILED: end reveal';end if;
  response:=public.check_guess(current_date,'en','apple');
  if (response->>'attempts')::int<>6 or (response->>'solved')::boolean then raise exception 'TEST FAILED: seventh attempt';end if;
  execute 'reset role';
end $$;

select set_config('request.jwt.claim.sub','22222222-2222-4222-8222-222222222222',true);
do $$ declare result int;begin
  execute 'set local role authenticated';
  select count(*) into result from public.scores;
  if result<>0 then raise exception 'TEST FAILED: score isolation';end if;
  begin update public.profiles set username='HackedName' where id='11111111-1111-4111-8111-111111111111';raise exception 'TEST FAILED: another profile write';exception when insufficient_privilege then null;end;
  execute 'reset role';
end $$;
select set_config('request.jwt.claim.sub','',true);
do $$ begin
  execute 'set local role anon';
  begin perform * from public.profiles;raise exception 'TEST FAILED: anonymous private profile';exception when insufficient_privilege then null;end;
  perform * from public.public_profiles;
  perform public.get_leaderboard('typerush','classic','pt','all',null,20,0);
  begin perform public.submit_score('typerush','classic','pt',1,'{}',1000);raise exception 'TEST FAILED: anonymous RPC write';exception when insufficient_privilege then null;end;
  execute 'reset role';
end $$;
rollback;
select 'PASS: RLS, isolamento, pontuação, taxa, segredo diário e limite de tentativas' as resultado;
