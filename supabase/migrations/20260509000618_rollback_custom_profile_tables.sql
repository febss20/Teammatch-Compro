create table if not exists public.profile_custom_skills (
    id uuid primary key default gen_random_uuid (),
    profile_id uuid not null references public.profiles (id) on delete cascade,
    label text not null,
    normalized_label text not null,
    created_at timestamptz not null default now(),
    unique (profile_id, normalized_label)
);

create table if not exists public.profile_custom_competition_type (
    id uuid primary key default gen_random_uuid (),
    profile_id uuid not null references public.profiles (id) on delete cascade,
    label text not null,
    normalized_label text not null,
    created_at timestamptz not null default now(),
    unique (profile_id, normalized_label)
);

alter table public.profile_custom_skills enable row level security;

alter table public.profile_custom_competition_type enable row level security;

create policy "profile_custom_skills_select_visible" on public.profile_custom_skills for
select using (
        exists (
            select 1
            from public.profiles
            where
                profiles.id = profile_custom_skills.profile_id
                and (
                    profiles.id = auth.uid ()
                    or profiles.public_visibility = true
                )
        )
    );

create policy "profile_custom_skills_insert_own" on public.profile_custom_skills for
insert
with
    check (auth.uid () = profile_id);

create policy "profile_custom_skills_delete_own" on public.profile_custom_skills for delete using (auth.uid () = profile_id);

create policy "profile_custom_competition_type_select_visible" on public.profile_custom_competition_type for
select using (
        exists (
            select 1
            from public.profiles
            where
                profiles.id = profile_custom_competition_type.profile_id
                and (
                    profiles.id = auth.uid ()
                    or profiles.public_visibility = true
                )
        )
    );

create policy "profile_custom_competition_type_insert_own" on public.profile_custom_competition_type for
insert
with
    check (auth.uid () = profile_id);

create policy "profile_custom_competition_type_delete_own" on public.profile_custom_competition_type for delete using (auth.uid () = profile_id);