begin;
-- A controlled owner view exposes only these public fields, never email or private history.
create view public.public_profiles with (security_barrier=true) as
  select username,avatar_id,country,level,equipped from public.profiles where not onboarding_required;
grant select on public.public_profiles to anon,authenticated;

create function public.get_leaderboard(p_game text,p_mode text,p_lang text default null,p_period text default 'all',p_country text default null,p_limit int default 20,p_offset int default 0) returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare since timestamptz;result jsonb;my_position bigint;
begin
  if p_period is null or p_period not in ('day','week','month','all') or p_limit is null or p_limit not between 1 and 50 or p_offset is null or p_offset not between 0 and 100000 or (p_lang is not null and p_lang not in ('pt','en','es')) or (p_country is not null and p_country !~ '^[A-Z]{2}$') then raise exception 'invalid_filters';end if;
  if not exists(select 1 from public.game_limits where game=p_game and mode=p_mode) then return jsonb_build_object('rows','[]'::jsonb,'my_position',null);end if;
  since:=case when p_period='all' then '-infinity'::timestamptz else date_trunc(p_period,now() at time zone 'UTC') at time zone 'UTC' end;
  with best as (
    select s.user_id,max(s.score) score from public.scores s join public.profiles p on p.id=s.user_id
    where s.game=p_game and s.mode=p_mode and (p_lang is null or s.lang=p_lang) and s.created_at>=since and (p_country is null or p.country=p_country) and not p.onboarding_required group by s.user_id
  ), ranked as (
    select b.user_id,b.score,p.username,p.avatar_id,p.country,p.level,p.equipped,row_number() over(order by b.score desc,lower(p.username)) as position from best b join public.profiles p on p.id=b.user_id
  ) select (select coalesce(jsonb_agg(jsonb_build_object('position',r.position,'username',r.username,'avatar_id',r.avatar_id,'country',r.country,'level',r.level,'equipped',r.equipped,'score',r.score,'is_me',r.user_id=auth.uid()) order by r.position),'[]'::jsonb) from(select * from ranked order by position limit p_limit offset p_offset)r),
    (select position from ranked where user_id=auth.uid()) into result,my_position;
  return jsonb_build_object('rows',result,'my_position',my_position);
end $$;
create function public.get_my_stats() returns jsonb language plpgsql stable security definer set search_path=public as $$
declare uid uuid:=public.require_player();result jsonb;
begin select jsonb_build_object(
  'rounds',(select count(*) from public.scores where user_id=uid),
  'time_ms',(select coalesce(sum(duration_ms),0) from public.scores where user_id=uid),
  'history',(select coalesce(jsonb_agg(to_jsonb(s) order by s.created_at desc),'[]') from(select game,mode,lang,score,metrics,duration_ms,created_at from public.scores where user_id=uid order by created_at desc limit 200)s),
  'bests',(select coalesce(jsonb_agg(to_jsonb(b)),'[]') from(select distinct on(game,mode,lang) * from(select * from public.personal_bests where user_id=uid union all select * from public.guest_bests where user_id=uid) combined order by game,mode,lang,best_score desc)b),
  'achievements',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.user_achievements a where a.user_id=uid),
  'items',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from public.user_items i where i.user_id=uid)
  ,'per_game',(select coalesce(jsonb_agg(to_jsonb(g)),'[]') from(select game,count(*) as rounds,sum(duration_ms) as duration_ms from public.scores where user_id=uid group by game)g)
  ,'decifra',(select jsonb_build_object('played',count(*),'wins',count(*) filter(where(metrics->>'resolvido')::boolean),'distribution',
    (select coalesce(jsonb_object_agg(attempts,wins),'{}') from(select metrics->>'tentativas' attempts,count(*) wins from public.scores where user_id=uid and game='decifra' and(metrics->>'resolvido')::boolean group by metrics->>'tentativas')d)) from public.scores where user_id=uid and game='decifra')
  ) into result;return result;
end $$;
create function public.get_daily_state() returns jsonb language plpgsql stable security definer set search_path=public as $$
declare uid uuid:=public.require_player();today date:=public.player_date(uid);
begin return jsonb_build_object('play_date',today,'results',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from public.daily_results r where user_id=uid and play_date=today));end $$;
create function public.export_my_data() returns jsonb language plpgsql stable security definer set search_path=public as $$
declare uid uuid:=public.require_player(false);
begin return jsonb_build_object('exported_at',now(),'profile',(select to_jsonb(p) from public.profiles p where p.id=uid),
  'scores',(select coalesce(jsonb_agg(to_jsonb(s)),'[]') from public.scores s where user_id=uid),
  'personal_bests',(select coalesce(jsonb_agg(to_jsonb(b)),'[]') from public.personal_bests b where user_id=uid),
  'imported_bests',(select coalesce(jsonb_agg(to_jsonb(b)),'[]') from public.guest_bests b where user_id=uid),
  'daily_results',(select coalesce(jsonb_agg(to_jsonb(r)),'[]') from public.daily_results r where user_id=uid),
  'achievements',(select coalesce(jsonb_agg(to_jsonb(a)),'[]') from public.user_achievements a where user_id=uid),
  'items',(select coalesce(jsonb_agg(to_jsonb(i)),'[]') from public.user_items i where user_id=uid));end $$;
revoke all on function public.get_leaderboard(text,text,text,text,text,int,int),public.get_my_stats(),public.get_daily_state(),public.export_my_data() from public,anon,authenticated;
grant execute on function public.get_leaderboard(text,text,text,text,text,int,int) to anon,authenticated;
grant execute on function public.get_my_stats(),public.get_daily_state(),public.export_my_data() to authenticated;
commit;
