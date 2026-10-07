-- Modelos novos; estilos anteriores sem model continuam classic.
begin;
create or replace function public.save_arcade_style(p_style jsonb) returns jsonb language plpgsql security definer set search_path=public as $$
declare uid uuid:=public.require_player();rounds int;required int;title text:=coalesce(p_style->>'title','');finish text:=p_style->>'finish';sticker text:=p_style->>'sticker';model text:=coalesce(p_style->>'model','classic');
begin
 if jsonb_typeof(p_style)<>'object' or p_style- array['title','finish','sticker','model'] <> '{}'::jsonb or length(title)>18 or (title<>'' and title !~ '^[[:alnum:] _-]+$') or finish is null or finish not in ('original','sky','violet','gold','mint','ember','rose','pearl','aurora') or sticker is null or sticker not in ('none','star','crown') or model not in ('classic','wood','circuit','chrome') then raise exception 'invalid_style';end if;
 select (public.get_arcade_style()->>'rounds')::int into rounds;
 required:=greatest(case finish when 'sky' then 3 when 'violet' then 10 when 'gold' then 25 when 'mint' then 5 when 'ember' then 8 when 'rose' then 15 when 'pearl' then 40 when 'aurora' then 50 else 0 end,case sticker when 'star' then 5 when 'crown' then 25 else 0 end,case model when 'wood' then 5 when 'circuit' then 15 when 'chrome' then 30 else 0 end);
 if rounds<required then raise exception 'style_locked';end if;
 update public.profiles set arcade_style=p_style,updated_at=clock_timestamp() where id=uid;return p_style;end $$;

revoke all on function public.save_arcade_style(jsonb) from public,anon;
grant execute on function public.save_arcade_style(jsonb) to authenticated;
commit;
