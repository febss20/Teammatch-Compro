create extension if not exists pgcrypto;

create table if not exists public.competition_idea_boards (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    competition_type text not null,
    description text not null,
    deadline timestamptz not null,
    required_skills text[] not null,
    status text not null default 'open',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint competition_idea_boards_title_length_check check (char_length(title) between 5 and 120),
    constraint competition_idea_boards_type_length_check check (char_length(competition_type) between 3 and 50),
    constraint competition_idea_boards_description_length_check check (char_length(description) between 30 and 2000),
    constraint competition_idea_boards_required_skills_count_check check (coalesce(array_length(required_skills, 1), 0) >= 1),
    constraint competition_idea_boards_status_check check (status in ('open', 'closed'))
);

create index if not exists competition_idea_boards_user_created_idx
    on public.competition_idea_boards (user_id, created_at desc);

create index if not exists competition_idea_boards_user_status_idx
    on public.competition_idea_boards (user_id, status);
