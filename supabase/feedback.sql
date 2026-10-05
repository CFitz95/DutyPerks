-- Existing project: run once after the DutyPerks schema. Repeatable.
-- Private feedback only. No public table reads or anonymous database writes.
begin;
create table if not exists public.tester_feedback (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('experience','problem','offer_issue','suggestion')),
 region text not null check(region in ('san_diego','whidbey','other')),
 message text not null check(length(message) between 10 and 2000),
 contact_email text check(contact_email is null or length(contact_email)<=254),
 rating smallint check(rating between 1 and 5),
 state text not null default 'new' check(state in ('new','reviewed')),
 created_at timestamptz not null default now(), reviewed_at timestamptz, reviewed_by uuid
);
create index if not exists tester_feedback_queue_idx on public.tester_feedback(state,created_at desc);
create table if not exists public.feedback_rate_limits (
 bucket text primary key, window_start timestamptz not null, submissions integer not null
);
alter table public.tester_feedback enable row level security;
alter table public.feedback_rate_limits enable row level security;
revoke all on public.tester_feedback,public.feedback_rate_limits from public,anon,authenticated;
grant select,insert,update,delete on public.tester_feedback,public.feedback_rate_limits to service_role;

create or replace function public.submit_tester_feedback(
 p_bucket text,p_kind text,p_region text,p_message text,p_email text default null,p_rating integer default null
) returns uuid language plpgsql security invoker set search_path='' as $$
declare v_count integer; v_id uuid;
begin
 if p_bucket is null or p_bucket !~ '^[a-f0-9]{64}$' then raise exception 'Invalid submission bucket'; end if;
 if p_kind is null or p_kind<>all(array['experience','problem','offer_issue','suggestion'])
   or p_region is null or p_region<>all(array['san_diego','whidbey','other']) then raise exception 'Invalid feedback category'; end if;
 if p_message is null or length(btrim(p_message))<10 or length(p_message)>2000 then raise exception 'Invalid feedback length'; end if;
 if p_email is not null and (length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$') then raise exception 'Invalid email'; end if;
 if p_rating is not null and (p_rating<1 or p_rating>5) then raise exception 'Invalid rating'; end if;
 -- Global lock first ensures a consistent order for concurrent requests.
 insert into public.feedback_rate_limits(bucket,window_start,submissions) values('global',now(),1)
 on conflict(bucket) do update set
   submissions=case when public.feedback_rate_limits.window_start<=now()-interval '24 hours' then 1 else public.feedback_rate_limits.submissions+1 end,
   window_start=case when public.feedback_rate_limits.window_start<=now()-interval '24 hours' then now() else public.feedback_rate_limits.window_start end
 returning submissions into v_count;
 if v_count>200 then return null; end if;
 insert into public.feedback_rate_limits(bucket,window_start,submissions) values(p_bucket,now(),1)
 on conflict(bucket) do update set
   submissions=case when public.feedback_rate_limits.window_start<=now()-interval '15 minutes' then 1 else public.feedback_rate_limits.submissions+1 end,
   window_start=case when public.feedback_rate_limits.window_start<=now()-interval '15 minutes' then now() else public.feedback_rate_limits.window_start end
 returning submissions into v_count;
 if v_count>20 then return null; end if;
 -- Remove old pseudonymous counters; raw IP addresses are never supplied here.
 delete from public.feedback_rate_limits where bucket<>'global' and window_start<now()-interval '2 days';
 insert into public.tester_feedback(kind,region,message,contact_email,rating)
 values(p_kind,p_region,btrim(p_message),nullif(btrim(p_email),''),p_rating) returning id into v_id;
 return v_id;
end $$;
revoke execute on function public.submit_tester_feedback(text,text,text,text,text,integer) from public,anon,authenticated;
grant execute on function public.submit_tester_feedback(text,text,text,text,text,integer) to service_role;
notify pgrst,'reload schema';
commit;
