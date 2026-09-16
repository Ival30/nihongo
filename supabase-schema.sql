-- Skema Supabase untuk Nihongo. Jalankan sekali di SQL Editor.
-- Auth: email+password aktif (Authentication → Providers → Email ON).

create table if not exists public.user_progress (
  user_id uuid primary key references auth.users (id) on delete cascade,
  srs jsonb not null default '{}'::jsonb,
  progress jsonb not null default '{}'::jsonb,
  streak jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_progress enable row level security;

drop policy if exists "own row read" on public.user_progress;
drop policy if exists "own row write" on public.user_progress;

create policy "own row read" on public.user_progress
  for select using (auth.uid() = user_id);

create policy "own row write" on public.user_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
