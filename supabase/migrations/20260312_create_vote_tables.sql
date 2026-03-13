create extension if not exists pgcrypto;

create table if not exists public.votes (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 3 and 1000),
  options jsonb not null,
  open_time timestamptz not null default now(),
  close_time timestamptz null,
  requires_password boolean not null default false,
  password_hash text null,
  allow_multiple boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null,
  share_url text not null unique,
  creator_user_id uuid null,
  status text not null default 'active' check (status in ('active', 'closed', 'expired')),
  constraint votes_close_after_open check (close_time is null or close_time > open_time),
  constraint votes_password_required check (
    (requires_password = false and password_hash is null)
    or (requires_password = true and password_hash is not null)
  )
);

create table if not exists public.vote_responses (
  id uuid primary key default gen_random_uuid(),
  vote_id uuid not null references public.votes(id) on delete cascade,
  selected_option_ids uuid[] not null,
  submitted_at timestamptz not null default now(),
  voter_fingerprint text not null,
  constraint vote_responses_selected_not_empty check (cardinality(selected_option_ids) >= 1),
  constraint vote_responses_unique_voter unique (vote_id, voter_fingerprint)
);

create index if not exists idx_votes_share_url on public.votes (share_url);
create index if not exists idx_votes_expires_at on public.votes (expires_at);
create index if not exists idx_votes_open_close_time on public.votes (open_time, close_time);
create index if not exists idx_vote_responses_vote_id on public.vote_responses (vote_id);

alter table public.votes enable row level security;
alter table public.vote_responses enable row level security;

drop policy if exists "votes_select_open_or_not_expired" on public.votes;
create policy "votes_select_open_or_not_expired"
on public.votes
for select
using (status = 'active' and expires_at > now());

drop policy if exists "votes_insert_anon" on public.votes;
create policy "votes_insert_anon"
on public.votes
for insert
to anon
with check (true);

drop policy if exists "vote_responses_insert_open_vote" on public.vote_responses;
create policy "vote_responses_insert_open_vote"
on public.vote_responses
for insert
to anon
with check (
  exists (
    select 1
    from public.votes v
    where v.id = vote_id
      and v.status = 'active'
      and v.open_time <= now()
      and (v.close_time is null or v.close_time >= now())
      and v.expires_at > now()
  )
);
