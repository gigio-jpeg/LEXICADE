begin;
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values
 ('33333333-3333-4333-8333-333333333333','duel-one@example.invalid','{"username":"DuelOne","age_band":"adult","terms_accepted":true}','{"provider":"email"}'),
 ('44444444-4444-4444-8444-444444444444','duel-two@example.invalid','{"username":"DuelTwo","age_band":"adult","terms_accepted":true}','{"provider":"email"}'),
 ('55555555-5555-4555-8555-555555555555','duel-outsider@example.invalid','{"username":"DuelOutside","age_band":"adult","terms_accepted":true}','{"provider":"email"}');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ declare m jsonb;id uuid;finish_name text;begin
 execute 'set local role authenticated';
 m:=public.create_duel('pt');id:=(m->>'id')::uuid;perform set_config('test.duel',id::text,true);
 if m->>'status'<>'waiting' or jsonb_array_length(m->'phrases')<>30 then raise exception 'TEST FAILED: creation/content';end if;
 begin insert into public.duel_players(match_id,user_id) values(id,auth.uid());raise exception 'TEST FAILED: direct write';exception when insufficient_privilege then null;end;
 begin perform public.save_arcade_style('{"title":"MINHA MAQUINA","finish":"gold","sticker":"none"}');raise exception 'TEST FAILED: locked finish';exception when raise_exception then if sqlerrm<>'style_locked' then raise;end if;end;
 perform public.save_arcade_style('{"title":"MINHA MAQUINA","finish":"original","sticker":"none"}');
 foreach finish_name in array array['mint','ember','rose','pearl','aurora'] loop
  begin perform public.save_arcade_style(jsonb_build_object('title','','finish',finish_name,'sticker','none'));raise exception 'TEST FAILED: unlocked new finish';exception when raise_exception then if sqlerrm<>'style_locked' then raise;end if;end;
 end loop;
 foreach finish_name in array array['wood','circuit','chrome'] loop
  begin perform public.save_arcade_style(jsonb_build_object('title','','finish','original','sticker','none','model',finish_name));raise exception 'TEST FAILED: locked model allowed';exception when raise_exception then if sqlerrm<>'style_locked' then raise;end if;end;
 end loop;
 perform public.save_arcade_style('{"title":"","finish":"original","sticker":"none","model":"classic"}');
 perform public.save_arcade_style('{"title":"","finish":"original","sticker":"none"}');
 if public.get_arcade_style()->'style'->>'finish'<>'original' then raise exception 'TEST FAILED: restore default';end if;
 execute 'reset role';
end $$;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
do $$ declare m jsonb;begin
 execute 'set local role authenticated';m:=public.join_duel(current_setting('test.duel')::uuid);
 if m->>'status'<>'running' or jsonb_array_length(m->'players')<>2 then raise exception 'TEST FAILED: join';end if;
 execute 'reset role';end $$;
select set_config('request.jwt.claim.sub','55555555-5555-4555-8555-555555555555',true);
do $$ declare count_rows int;begin
 execute 'set local role authenticated';
 select count(*) into count_rows from public.duel_players where match_id=current_setting('test.duel')::uuid;
 if count_rows<>0 then raise exception 'TEST FAILED: private duel rows';end if;
 begin perform public.get_duel(current_setting('test.duel')::uuid);raise exception 'TEST FAILED: outsider snapshot';exception when raise_exception then if sqlerrm<>'duel_not_found' then raise;end if;end;
 begin perform public.join_duel(current_setting('test.duel')::uuid);raise exception 'TEST FAILED: third player';exception when raise_exception then if sqlerrm<>'duel_unavailable' then raise;end if;end;
 execute 'reset role';end $$;
-- Clock manipulation is privileged test preparation; clients cannot change it.
update public.duel_matches set starts_at=clock_timestamp()-interval '10 seconds' where id=current_setting('test.duel')::uuid;
update public.duel_players set updated_at=clock_timestamp()-interval '2 seconds' where match_id=current_setting('test.duel')::uuid;
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ declare m jsonb;phrase text;begin
 select phrases->>0 into phrase from public.duel_matches where id=current_setting('test.duel')::uuid;
 execute 'set local role authenticated';
 m:=public.duel_progress(current_setting('test.duel')::uuid,0,phrase);
 if (select phrase_index from public.duel_players where match_id=current_setting('test.duel')::uuid and user_id=auth.uid())<>1 then raise exception 'TEST FAILED: phrase validation';end if;
 execute 'reset role';end $$;
-- Two nonempty players, deterministic result and reward idempotence.
update public.duel_players set completed_chars=case when user_id='33333333-3333-4333-8333-333333333333' then 100 else 50 end,current_chars=0 where match_id=current_setting('test.duel')::uuid;
update public.duel_matches set starts_at=clock_timestamp()-interval '61 seconds' where id=current_setting('test.duel')::uuid;
do $$ declare m jsonb;xp1 bigint;xp2 bigint;begin
 execute 'set local role authenticated';m:=public.get_duel(current_setting('test.duel')::uuid);
 if m->>'status'<>'finished' or m->>'winner'<>'33333333-3333-4333-8333-333333333333' then raise exception 'TEST FAILED: winner';end if;
 select xp into xp1 from public.profiles where id=auth.uid();perform public.get_duel(current_setting('test.duel')::uuid);select xp into xp2 from public.profiles where id=auth.uid();
 if xp1<>50 or xp2<>xp1 then raise exception 'TEST FAILED: duplicated reward';end if;
 execute 'reset role';end $$;
select set_config('request.jwt.claim.sub','44444444-4444-4444-8444-444444444444',true);
do $$ begin execute 'set local role authenticated';perform public.get_duel(current_setting('test.duel')::uuid);if (select xp from public.profiles where id=auth.uid())<>25 then raise exception 'TEST FAILED: second reward';end if;execute 'reset role';end $$;
do $$ begin
 execute 'set local role anon';
 begin perform public.create_duel('pt');raise exception 'TEST FAILED: anonymous duel';exception when insufficient_privilege then null;end;
 execute 'reset role';
end $$;

-- Privileged fixture creates 30 completed rounds; clients cannot insert scores.
insert into public.scores(user_id,game,mode,lang,score,duration_ms)
select '33333333-3333-4333-8333-333333333333','typerush','classic','pt',100,60000 from generate_series(1,30);
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ declare model_name text;begin
 execute 'set local role authenticated';
 foreach model_name in array array['wood','circuit','chrome'] loop
  perform public.save_arcade_style(jsonb_build_object('model',model_name,'title','MODEL TEST','finish','original','sticker','none'));
  if public.get_arcade_style()->'style'->>'model'<>model_name then raise exception 'TEST FAILED: unlocked model persistence';end if;
 end loop;
 execute 'reset role';end $$;
select 'PASS social: private matches, no direct writes, server phrases, join, styles and rewards';
rollback;
