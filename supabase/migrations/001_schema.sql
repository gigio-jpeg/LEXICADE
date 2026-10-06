-- Aplique no seu projeto Supabase vazio pelo SQL Editor. Não contém credenciais.
begin;
revoke create on schema public from public;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  avatar_id text not null default 'default',
  country char(2), preferred_lang text not null default 'pt' check (preferred_lang in ('pt','en','es')),
  xp bigint not null default 0 check (xp >= 0), level int not null default 1 check (level >= 1),
  coins int not null default 0 check (coins >= 0),
  streak_current int not null default 0, streak_best int not null default 0,
  last_played_on date, equipped jsonb not null default '{}',
  time_zone text not null default 'UTC', timezone_changed_at timestamptz not null default now(),
  age_band text check (age_band in ('adult','teen')), guardian_consent boolean not null default false,
  terms_accepted_at timestamptz, onboarding_required boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index profiles_username_lower on public.profiles (lower(username));
create table public.scores (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  game text not null, mode text not null, lang text not null check (lang in ('pt','en','es')),
  score int not null check (score >= 0), metrics jsonb not null default '{}',
  duration_ms int not null check (duration_ms > 0), created_at timestamptz not null default now()
);
create index scores_leaderboard on public.scores (game,mode,lang,score desc);
create index scores_history on public.scores (user_id,game,created_at desc);
create index scores_time on public.scores (created_at);
create table public.personal_bests (
  user_id uuid references public.profiles(id) on delete cascade,
  game text, mode text, lang text check(lang in ('pt','en','es')), best_score int not null,
  best_metrics jsonb not null default '{}', achieved_at timestamptz not null default now(),
  primary key (user_id,game,mode,lang)
);
create table public.daily_words (play_date date,lang text,answer text not null,primary key(play_date,lang));
create table public.daily_results (
  user_id uuid references public.profiles(id) on delete cascade,
  play_date date, game text, lang text, attempts int, solved boolean not null,
  score int not null default 0, created_at timestamptz not null default now(),
  primary key(user_id,play_date,game,lang)
);
create table public.achievements (
  id text primary key, kind text not null, target int not null,
  xp_reward int not null default 0,coin_reward int not null default 0
);
create table public.user_achievements (
  user_id uuid references public.profiles(id) on delete cascade,
  achievement_id text references public.achievements(id), unlocked_at timestamptz not null default now(),
  primary key(user_id,achievement_id)
);
create table public.user_items (
  user_id uuid references public.profiles(id) on delete cascade,
  item_id text,acquired_at timestamptz not null default now(),primary key(user_id,item_id)
);
create table public.game_limits (
  game text,mode text,max_score int not null,max_ppm int,min_duration_ms int not null,
  primary key(game,mode)
);
create table public.shop_items (id text primary key,type text not null,price int not null check(price>=0));
create table public.word_answers (lang text,word text,primary key(lang,word));
create table public.valid_words (lang text,word text,primary key(lang,word));
create table public.daily_attempts (
  user_id uuid references public.profiles(id) on delete cascade,
  play_date date,lang text,history jsonb not null default '[]',solved boolean not null default false,
  primary key(user_id,play_date,lang)
);
create table public.guest_imports (user_id uuid primary key references public.profiles(id) on delete cascade, imported_at timestamptz not null default now());
create table public.guest_bests (
  user_id uuid references public.profiles(id) on delete cascade,game text,mode text,lang text,
  best_score int not null,best_metrics jsonb not null default '{}',achieved_at timestamptz not null default now(),
  primary key(user_id,game,mode,lang)
);

do $$ declare tab text; begin
  foreach tab in array array['profiles','scores','personal_bests','daily_words','daily_results','achievements','user_achievements','user_items','game_limits','shop_items','word_answers','valid_words','daily_attempts','guest_imports','guest_bests'] loop
    execute format('alter table public.%I enable row level security',tab);
    execute format('revoke all on public.%I from anon,authenticated',tab);
  end loop;
end $$;
revoke all on all sequences in schema public from anon,authenticated;
create policy own_profile_read on public.profiles for select to authenticated using(id=auth.uid());
grant select on public.profiles to authenticated;
do $$ declare tab text; begin
  foreach tab in array array['scores','personal_bests','daily_results','user_achievements','user_items','guest_bests'] loop
    execute format('create policy own_read on public.%I for select to authenticated using (user_id=auth.uid())',tab);
    execute format('grant select on public.%I to authenticated',tab);
  end loop;
end $$;
create policy catalog_read on public.achievements for select to anon,authenticated using(true);
grant select on public.achievements to anon,authenticated;

create function public.normalized(p_text text) returns text language sql immutable strict set search_path=public as $$
  select lower(translate(trim(p_text),'áàâãäéèêëíìîïóòôõöúùûüçñ','aaaaaeeeeiiiiooooouuuucn'));
$$;
create function public.username_allowed(p_name text) returns boolean language sql immutable set search_path=public as $$
  select coalesce(p_name ~ '^[A-Za-z0-9_]{3,20}$'
    and lower(p_name) not like 'player\_%' escape '\'
    and public.normalized(regexp_replace(p_name,'[^A-Za-z0-9]','','g')) !~ '(fuck|shit|bitch|nazi|hitler|puta|caralho|buceta|foder|merda|joder|mierda|admin|moderator|support)',false);
$$;
create function public.level_for_xp(p_xp bigint) returns int language plpgsql immutable set search_path=public as $$
declare n int:=1; begin while n<10000 and p_xp>=round(100*power((n+1)::numeric,1.5)) loop n:=n+1; end loop; return n; end $$;
create function public.require_player(p_ready boolean default true) returns uuid language plpgsql stable security definer set search_path=public as $$
declare uid uuid:=auth.uid(); begin
  if uid is null then raise exception 'authentication_required';end if;
  if not exists(select 1 from public.profiles where id=uid and (not p_ready or not onboarding_required)) then raise exception 'profile_required';end if;
  return uid;
end $$;
create function public.player_date(p_uid uuid) returns date language sql stable security definer set search_path=public as $$
  select (now() at time zone time_zone)::date from public.profiles where id=p_uid;
$$;
create function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare
  meta jsonb:=coalesce(new.raw_user_meta_data,'{}'); candidate text:=meta->>'username';
  ready boolean:=false;tz text:=coalesce(meta->>'time_zone','UTC'); age text:=meta->>'age_band';
begin
  ready:=public.username_allowed(candidate) and coalesce((meta->>'terms_accepted')::boolean,false)
    and (age='adult' or (age='teen' and coalesce((meta->>'guardian_consent')::boolean,false)));
  if coalesce(new.raw_app_meta_data->>'provider','email')='email' and not coalesce(ready,false) then raise exception 'signup_metadata_required';end if;
  if not exists(select 1 from pg_catalog.pg_timezone_names where name=tz) then tz:='UTC';end if;
  insert into public.profiles(id,username,preferred_lang,time_zone,age_band,guardian_consent,terms_accepted_at,onboarding_required)
  values(new.id,case when ready then candidate else 'player_'||substr(replace(new.id::text,'-',''),1,12) end,
    case when meta->>'preferred_lang' in ('pt','en','es') then meta->>'preferred_lang' else 'pt' end,
    tz,case when ready then age else null end,ready and age='teen',case when ready then now() end,not coalesce(ready,false));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
-- Private helpers cannot be invoked as arbitrary RPCs.
revoke all on function public.normalized(text),public.username_allowed(text),public.level_for_xp(bigint),public.require_player(boolean),public.player_date(uuid),public.handle_new_user() from public,anon,authenticated;
commit;
