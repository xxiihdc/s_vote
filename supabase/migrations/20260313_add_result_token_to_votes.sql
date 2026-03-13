create extension if not exists pgcrypto;

alter table public.votes
  add column if not exists result_token_hash text,
  add column if not exists token_expires_at timestamptz;

update public.votes
set
  result_token_hash = coalesce(result_token_hash, encode(digest(share_url, 'sha256'), 'hex')),
  token_expires_at = coalesce(token_expires_at, expires_at)
where result_token_hash is null or token_expires_at is null;

alter table public.votes
  alter column result_token_hash set not null,
  alter column token_expires_at set not null;

create unique index if not exists idx_votes_result_token_hash on public.votes (result_token_hash);
create index if not exists idx_votes_token_expires_at on public.votes (token_expires_at);

alter table public.votes drop constraint if exists votes_status_check;
alter table public.votes
  add constraint votes_status_check check (status in ('active', 'closed', 'expired', 'archived', 'deleted'));

alter table public.votes enable row level security;

drop policy if exists "votes_token_result_read" on public.votes;
create policy "votes_token_result_read"
on public.votes
for select
to anon
using (
  result_token_hash is not null
  and status = 'active'
  and token_expires_at > now()
);
