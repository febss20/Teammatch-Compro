create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text null,
    campus_name text null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.competition_idea_boards
    add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table public.profiles enable row level security;
alter table public.competition_idea_boards enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "boards_select_own" on public.competition_idea_boards;
drop policy if exists "boards_insert_own" on public.competition_idea_boards;
drop policy if exists "boards_update_own" on public.competition_idea_boards;
drop policy if exists "boards_delete_own" on public.competition_idea_boards;

create policy "profiles_select_own"
    on public.profiles
    for select
    using (auth.uid() = id);

create policy "profiles_insert_own"
    on public.profiles
    for insert
    with check (auth.uid() = id);

create policy "profiles_update_own"
    on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

create policy "boards_select_own"
    on public.competition_idea_boards
    for select
    using (auth.uid() = user_id);

create policy "boards_insert_own"
    on public.competition_idea_boards
    for insert
    with check (auth.uid() = user_id);

create policy "boards_update_own"
    on public.competition_idea_boards
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "boards_delete_own"
    on public.competition_idea_boards
    for delete
    using (auth.uid() = user_id);
