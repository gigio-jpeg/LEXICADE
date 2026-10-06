begin;
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values
 ('33333333-3333-4333-8333-333333333333','economy@example.invalid','{"username":"EconomyPlayer","age_band":"adult","terms_accepted":true}','{"provider":"email"}');
select set_config('request.jwt.claim.sub','33333333-3333-4333-8333-333333333333',true);
do $$ declare response jsonb;balance int;begin
  execute 'set local role authenticated';
  begin perform public.equip_item('frame-orbit');raise exception 'TEST FAILED: unowned item';exception when raise_exception then if sqlerrm<>'item_not_owned' then raise;end if;end;
  begin perform public.buy_item('frame-orbit');raise exception 'TEST FAILED: negative balance';exception when raise_exception then if sqlerrm<>'insufficient_coins' then raise;end if;end;
  response:=public.import_guest_data('{"xp":99999999,"coins":99999999,"bests":{"typerush:classic:pt":{"game":"typerush","mode":"classic","lang":"pt","score":2000,"metrics":{"ppm":50}}}}');
  if (response->>'xp')::int<>1000 or (response->>'coins')::int<>250 then raise exception 'TEST FAILED: import caps';end if;
  if (select count(*) from public.guest_bests)<>1 or (select count(*) from public.scores)<>0 then raise exception 'TEST FAILED: import privacy';end if;
  response:=public.get_my_stats();if jsonb_array_length(response->'bests')<>1 then raise exception 'TEST FAILED: imported records missing';end if;
  response:=public.import_guest_data('{"xp":99999999,"coins":99999999,"bests":{}}');
  if not (response->>'already_imported')::boolean then raise exception 'TEST FAILED: double import';end if;
  response:=public.buy_item('frame-orbit');balance:=(response->>'coins')::int;
  response:=public.buy_item('frame-orbit');if (response->>'coins')::int<>balance then raise exception 'TEST FAILED: double charge';end if;
  perform public.equip_item('frame-orbit');
  response:=public.export_my_data();if response->'profile'->>'username'<>'EconomyPlayer' then raise exception 'TEST FAILED: export';end if;
  perform public.delete_my_account();execute 'reset role';
  if exists(select 1 from public.profiles where id='33333333-3333-4333-8333-333333333333') or exists(select 1 from public.user_items where user_id='33333333-3333-4333-8333-333333333333') then raise exception 'TEST FAILED: cascade deletion';end if;
end $$;
rollback;
