-- Optional after feedback.sql, while no feedback submissions are in progress.
-- All fixture feedback and counter changes roll back.
begin;
do $$
declare v_id uuid; i integer;
begin
 if has_table_privilege('anon','public.tester_feedback','SELECT')
   or has_table_privilege('authenticated','public.tester_feedback','INSERT')
   or has_function_privilege('anon','public.submit_tester_feedback(text,text,text,text,text,integer)','EXECUTE') then
   raise exception 'Private feedback access exposed'; end if;
 insert into public.feedback_rate_limits(bucket,window_start,submissions) values('global',now(),0)
 on conflict(bucket) do update set window_start=now(),submissions=0;
 for i in 1..20 loop
   v_id:=public.submit_tester_feedback(repeat('f',64),'experience','whidbey','Rollback-only feedback fixture',null,4);
   if v_id is null then raise exception 'Feedback rejected below the limit'; end if;
 end loop;
 if public.submit_tester_feedback(repeat('f',64),'experience','whidbey','Rollback-only feedback fixture',null,4) is not null then raise exception 'Address rate limit failed'; end if;
 if (select count(*) from public.tester_feedback where message='Rollback-only feedback fixture')<>20 then raise exception 'Rate-limited feedback was saved'; end if;
end $$;
rollback;
