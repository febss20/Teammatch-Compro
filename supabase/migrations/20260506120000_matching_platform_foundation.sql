create extension if not exists pgcrypto;

alter table public.profiles
    add column if not exists username text,
    add column if not exists bio text,
    add column if not exists public_visibility boolean not null default true,
    add column if not exists show_competition_history boolean not null default true,
    add column if not exists profile_completed_at timestamptz,
    add column if not exists verification_status text not null default 'unverified',
    add column if not exists verified_at timestamptz;

alter table public.profiles
    drop constraint if exists profiles_username_length_check,
    drop constraint if exists profiles_bio_length_check,
    drop constraint if exists profiles_verification_status_check;

alter table public.profiles
    add constraint profiles_username_length_check check (username is null or char_length(username) between 3 and 30),
    add constraint profiles_bio_length_check check (bio is null or char_length(bio) between 20 and 280),
    add constraint profiles_verification_status_check check (verification_status in ('unverified', 'verified'));

create unique index if not exists profiles_username_unique_idx
    on public.profiles (lower(username))
    where username is not null;

create table if not exists public.skill_taxonomy (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    label text not null,
    category text not null,
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.competition_type_taxonomy (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    label text not null,
    recommended_skills text[] not null default '{}',
    is_active boolean not null default true,
    sort_order integer not null default 0,
    created_at timestamptz not null default now()
);

create table if not exists public.profile_skills (
    profile_id uuid not null references public.profiles(id) on delete cascade,
    skill_id uuid not null references public.skill_taxonomy(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (profile_id, skill_id)
);

create table if not exists public.profile_competition_preferences (
    profile_id uuid not null references public.profiles(id) on delete cascade,
    competition_type_id uuid not null references public.competition_type_taxonomy(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (profile_id, competition_type_id)
);

create table if not exists public.profile_availability (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    available_months text[] not null default '{}',
    hours_per_week integer not null default 5,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint profile_availability_months_check check (coalesce(array_length(available_months, 1), 0) >= 1),
    constraint profile_availability_hours_check check (hours_per_week between 1 and 80)
);

create table if not exists public.profile_testimonial_summaries (
    profile_id uuid primary key references public.profiles(id) on delete cascade,
    average_rating numeric(3, 2) not null default 0,
    testimonial_count integer not null default 0,
    best_result text,
    competitions_count integer not null default 0,
    updated_at timestamptz not null default now()
);

create table if not exists public.candidate_saved_profiles (
    user_id uuid not null references public.profiles(id) on delete cascade,
    target_profile_id uuid not null references public.profiles(id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, target_profile_id),
    constraint candidate_saved_profiles_no_self_check check (user_id <> target_profile_id)
);

alter table public.competition_idea_boards
    add column if not exists summary text,
    add column if not exists visibility text not null default 'public',
    add column if not exists is_draft boolean not null default false,
    add column if not exists published_at timestamptz,
    add column if not exists closed_at timestamptz,
    add column if not exists last_applicant_at timestamptz;

alter table public.competition_idea_boards
    drop constraint if exists competition_idea_boards_visibility_check,
    drop constraint if exists competition_idea_boards_summary_length_check;

alter table public.competition_idea_boards
    add constraint competition_idea_boards_visibility_check check (visibility in ('public', 'private')),
    add constraint competition_idea_boards_summary_length_check check (summary is null or char_length(summary) between 20 and 220);

create table if not exists public.board_slots (
    id uuid primary key default gen_random_uuid(),
    board_id uuid not null references public.competition_idea_boards(id) on delete cascade,
    role_name text not null,
    slot_count integer not null default 1,
    required_skills text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint board_slots_role_name_check check (char_length(role_name) between 2 and 50),
    constraint board_slots_slot_count_check check (slot_count between 1 and 10)
);

create table if not exists public.board_drafts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    title text,
    summary text,
    competition_type text,
    description text,
    deadline date,
    required_skills text[] not null default '{}',
    visibility text not null default 'public',
    slots jsonb not null default '[]'::jsonb,
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    unique (user_id)
);

create table if not exists public.join_requests (
    id uuid primary key default gen_random_uuid(),
    requester_id uuid not null references public.profiles(id) on delete cascade,
    target_profile_id uuid not null references public.profiles(id) on delete cascade,
    board_id uuid references public.competition_idea_boards(id) on delete set null,
    selected_role text not null,
    message text not null,
    status text not null default 'pending',
    rejection_locked boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    responded_at timestamptz,
    constraint join_requests_message_length_check check (char_length(message) between 1 and 150),
    constraint join_requests_status_check check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
    constraint join_requests_no_self_check check (requester_id <> target_profile_id)
);

create unique index if not exists join_requests_unique_active_request_idx
    on public.join_requests (requester_id, target_profile_id, coalesce(board_id, '00000000-0000-0000-0000-000000000000'::uuid))
    where status in ('pending', 'accepted');

create table if not exists public.join_request_events (
    id uuid primary key default gen_random_uuid(),
    join_request_id uuid not null references public.join_requests(id) on delete cascade,
    actor_id uuid references public.profiles(id) on delete set null,
    event_type text not null,
    note text,
    created_at timestamptz not null default now()
);

create table if not exists public.board_applications (
    id uuid primary key default gen_random_uuid(),
    board_id uuid not null references public.competition_idea_boards(id) on delete cascade,
    applicant_id uuid not null references public.profiles(id) on delete cascade,
    board_slot_id uuid references public.board_slots(id) on delete set null,
    selected_role text not null,
    message text not null,
    status text not null default 'pending',
    skill_match_score integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    responded_at timestamptz,
    constraint board_applications_message_length_check check (char_length(message) between 1 and 200),
    constraint board_applications_status_check check (status in ('pending', 'saved', 'accepted', 'rejected', 'withdrawn')),
    constraint board_applications_skill_match_score_check check (skill_match_score between 0 and 100)
);

create unique index if not exists board_applications_unique_active_idx
    on public.board_applications (board_id, applicant_id)
    where status in ('pending', 'saved', 'accepted');

create table if not exists public.board_application_events (
    id uuid primary key default gen_random_uuid(),
    board_application_id uuid not null references public.board_applications(id) on delete cascade,
    actor_id uuid references public.profiles(id) on delete set null,
    event_type text not null,
    note text,
    created_at timestamptz not null default now()
);

create table if not exists public.teams (
    id uuid primary key default gen_random_uuid(),
    board_id uuid references public.competition_idea_boards(id) on delete set null,
    creator_id uuid not null references public.profiles(id) on delete cascade,
    name text not null,
    competition_name text,
    deadline timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint teams_name_length_check check (char_length(name) between 3 and 80)
);

create table if not exists public.team_members (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams(id) on delete cascade,
    profile_id uuid not null references public.profiles(id) on delete cascade,
    role_name text not null,
    confirmation_status text not null default 'pending',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (team_id, profile_id),
    constraint team_members_confirmation_status_check check (confirmation_status in ('pending', 'confirmed', 'expired'))
);

create table if not exists public.team_commitments (
    id uuid primary key default gen_random_uuid(),
    team_member_id uuid not null references public.team_members(id) on delete cascade,
    hours_per_week integer not null,
    deadline_at timestamptz not null,
    confirmed_at timestamptz,
    last_reminded_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (team_member_id),
    constraint team_commitments_hours_check check (hours_per_week between 1 and 80)
);

create table if not exists public.team_resources (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams(id) on delete cascade,
    resource_type text not null,
    label text not null,
    url text,
    created_at timestamptz not null default now()
);

create table if not exists public.team_activity_events (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams(id) on delete cascade,
    actor_id uuid references public.profiles(id) on delete set null,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

create table if not exists public.competition_history (
    id uuid primary key default gen_random_uuid(),
    profile_id uuid not null references public.profiles(id) on delete cascade,
    competition_name text not null,
    role_name text not null,
    best_result text,
    team_id uuid references public.teams(id) on delete set null,
    created_at timestamptz not null default now()
);

create table if not exists public.team_results (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams(id) on delete cascade,
    result_summary text not null,
    competition_ended_at timestamptz not null,
    created_at timestamptz not null default now()
);

create table if not exists public.testimonials (
    id uuid primary key default gen_random_uuid(),
    team_id uuid not null references public.teams(id) on delete cascade,
    author_id uuid not null references public.profiles(id) on delete cascade,
    target_profile_id uuid not null references public.profiles(id) on delete cascade,
    rating integer not null,
    body text not null,
    locked_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint testimonials_rating_check check (rating between 1 and 5),
    constraint testimonials_body_length_check check (char_length(body) between 10 and 300)
);

create unique index if not exists testimonials_unique_team_pair_idx
    on public.testimonials (team_id, author_id, target_profile_id);

create table if not exists public.testimonial_edits (
    id uuid primary key default gen_random_uuid(),
    testimonial_id uuid not null references public.testimonials(id) on delete cascade,
    previous_body text not null,
    previous_rating integer not null,
    edited_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
    user_id uuid primary key references public.profiles(id) on delete cascade,
    request_updates boolean not null default true,
    board_updates boolean not null default true,
    commitment_updates boolean not null default true,
    reminder_updates boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.user_notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    category text not null,
    title text not null,
    body text not null,
    link_path text,
    is_read boolean not null default false,
    created_at timestamptz not null default now(),
    constraint user_notifications_category_check check (category in ('request', 'application', 'commitment', 'reminder', 'system'))
);

create table if not exists public.privacy_audit_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles(id) on delete cascade,
    event_type text not null,
    payload jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

alter table public.skill_taxonomy enable row level security;
alter table public.competition_type_taxonomy enable row level security;
alter table public.profile_skills enable row level security;
alter table public.profile_competition_preferences enable row level security;
alter table public.profile_availability enable row level security;
alter table public.profile_testimonial_summaries enable row level security;
alter table public.candidate_saved_profiles enable row level security;
alter table public.board_slots enable row level security;
alter table public.board_drafts enable row level security;
alter table public.join_requests enable row level security;
alter table public.join_request_events enable row level security;
alter table public.board_applications enable row level security;
alter table public.board_application_events enable row level security;
alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_commitments enable row level security;
alter table public.team_resources enable row level security;
alter table public.team_activity_events enable row level security;
alter table public.competition_history enable row level security;
alter table public.team_results enable row level security;
alter table public.testimonials enable row level security;
alter table public.testimonial_edits enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.user_notifications enable row level security;
alter table public.privacy_audit_events enable row level security;

drop policy if exists "skill_taxonomy_select_authenticated" on public.skill_taxonomy;
create policy "skill_taxonomy_select_authenticated"
    on public.skill_taxonomy
    for select
    using (auth.role() = 'authenticated');

drop policy if exists "competition_type_taxonomy_select_authenticated" on public.competition_type_taxonomy;
create policy "competition_type_taxonomy_select_authenticated"
    on public.competition_type_taxonomy
    for select
    using (auth.role() = 'authenticated');

drop policy if exists "profiles_select_visible" on public.profiles;
drop policy if exists "profiles_update_own_expanded" on public.profiles;
create policy "profiles_select_visible"
    on public.profiles
    for select
    using (auth.uid() = id or public_visibility = true);

create policy "profiles_update_own_expanded"
    on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

drop policy if exists "profile_skills_select_visible" on public.profile_skills;
drop policy if exists "profile_skills_insert_own" on public.profile_skills;
drop policy if exists "profile_skills_delete_own" on public.profile_skills;
create policy "profile_skills_select_visible"
    on public.profile_skills
    for select
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = profile_skills.profile_id
              and (profiles.id = auth.uid() or profiles.public_visibility = true)
        )
    );

create policy "profile_skills_insert_own"
    on public.profile_skills
    for insert
    with check (auth.uid() = profile_id);

create policy "profile_skills_delete_own"
    on public.profile_skills
    for delete
    using (auth.uid() = profile_id);

drop policy if exists "profile_competition_preferences_select_visible" on public.profile_competition_preferences;
drop policy if exists "profile_competition_preferences_insert_own" on public.profile_competition_preferences;
drop policy if exists "profile_competition_preferences_delete_own" on public.profile_competition_preferences;
create policy "profile_competition_preferences_select_visible"
    on public.profile_competition_preferences
    for select
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = profile_competition_preferences.profile_id
              and (profiles.id = auth.uid() or profiles.public_visibility = true)
        )
    );

create policy "profile_competition_preferences_insert_own"
    on public.profile_competition_preferences
    for insert
    with check (auth.uid() = profile_id);

create policy "profile_competition_preferences_delete_own"
    on public.profile_competition_preferences
    for delete
    using (auth.uid() = profile_id);

drop policy if exists "profile_availability_select_visible" on public.profile_availability;
drop policy if exists "profile_availability_upsert_own" on public.profile_availability;
create policy "profile_availability_select_visible"
    on public.profile_availability
    for select
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = profile_availability.profile_id
              and (profiles.id = auth.uid() or profiles.public_visibility = true)
        )
    );

create policy "profile_availability_upsert_own"
    on public.profile_availability
    for all
    using (auth.uid() = profile_id)
    with check (auth.uid() = profile_id);

drop policy if exists "profile_testimonial_summaries_select_visible" on public.profile_testimonial_summaries;
create policy "profile_testimonial_summaries_select_visible"
    on public.profile_testimonial_summaries
    for select
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = profile_testimonial_summaries.profile_id
              and (profiles.id = auth.uid() or profiles.public_visibility = true)
        )
    );

drop policy if exists "candidate_saved_profiles_select_own" on public.candidate_saved_profiles;
drop policy if exists "candidate_saved_profiles_insert_own" on public.candidate_saved_profiles;
drop policy if exists "candidate_saved_profiles_delete_own" on public.candidate_saved_profiles;
create policy "candidate_saved_profiles_select_own"
    on public.candidate_saved_profiles
    for select
    using (auth.uid() = user_id);

create policy "candidate_saved_profiles_insert_own"
    on public.candidate_saved_profiles
    for insert
    with check (auth.uid() = user_id);

create policy "candidate_saved_profiles_delete_own"
    on public.candidate_saved_profiles
    for delete
    using (auth.uid() = user_id);

drop policy if exists "boards_select_visible" on public.competition_idea_boards;
drop policy if exists "boards_insert_own_expanded" on public.competition_idea_boards;
drop policy if exists "boards_update_own_expanded" on public.competition_idea_boards;
drop policy if exists "boards_delete_own_expanded" on public.competition_idea_boards;
create policy "boards_select_visible"
    on public.competition_idea_boards
    for select
    using (auth.uid() = user_id or (visibility = 'public' and is_draft = false));

create policy "boards_insert_own_expanded"
    on public.competition_idea_boards
    for insert
    with check (auth.uid() = user_id);

create policy "boards_update_own_expanded"
    on public.competition_idea_boards
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy "boards_delete_own_expanded"
    on public.competition_idea_boards
    for delete
    using (auth.uid() = user_id);

drop policy if exists "board_slots_select_visible" on public.board_slots;
drop policy if exists "board_slots_manage_owner" on public.board_slots;
create policy "board_slots_select_visible"
    on public.board_slots
    for select
    using (
        exists (
            select 1
            from public.competition_idea_boards
            where competition_idea_boards.id = board_slots.board_id
              and (competition_idea_boards.user_id = auth.uid() or (competition_idea_boards.visibility = 'public' and competition_idea_boards.is_draft = false))
        )
    );

create policy "board_slots_manage_owner"
    on public.board_slots
    for all
    using (
        exists (
            select 1
            from public.competition_idea_boards
            where competition_idea_boards.id = board_slots.board_id
              and competition_idea_boards.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.competition_idea_boards
            where competition_idea_boards.id = board_slots.board_id
              and competition_idea_boards.user_id = auth.uid()
        )
    );

drop policy if exists "board_drafts_select_own" on public.board_drafts;
drop policy if exists "board_drafts_manage_own" on public.board_drafts;
create policy "board_drafts_select_own"
    on public.board_drafts
    for select
    using (auth.uid() = user_id);

create policy "board_drafts_manage_own"
    on public.board_drafts
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "join_requests_select_participant" on public.join_requests;
drop policy if exists "join_requests_insert_requester" on public.join_requests;
drop policy if exists "join_requests_update_participant" on public.join_requests;
create policy "join_requests_select_participant"
    on public.join_requests
    for select
    using (auth.uid() = requester_id or auth.uid() = target_profile_id);

create policy "join_requests_insert_requester"
    on public.join_requests
    for insert
    with check (auth.uid() = requester_id);

create policy "join_requests_update_participant"
    on public.join_requests
    for update
    using (auth.uid() = requester_id or auth.uid() = target_profile_id)
    with check (auth.uid() = requester_id or auth.uid() = target_profile_id);

drop policy if exists "join_request_events_select_participant" on public.join_request_events;
drop policy if exists "join_request_events_insert_participant" on public.join_request_events;
create policy "join_request_events_select_participant"
    on public.join_request_events
    for select
    using (
        exists (
            select 1
            from public.join_requests
            where join_requests.id = join_request_events.join_request_id
              and (join_requests.requester_id = auth.uid() or join_requests.target_profile_id = auth.uid())
        )
    );

create policy "join_request_events_insert_participant"
    on public.join_request_events
    for insert
    with check (
        exists (
            select 1
            from public.join_requests
            where join_requests.id = join_request_events.join_request_id
              and (join_requests.requester_id = auth.uid() or join_requests.target_profile_id = auth.uid())
        )
    );

drop policy if exists "board_applications_select_participant" on public.board_applications;
drop policy if exists "board_applications_insert_applicant" on public.board_applications;
drop policy if exists "board_applications_update_participant" on public.board_applications;
create policy "board_applications_select_participant"
    on public.board_applications
    for select
    using (
        auth.uid() = applicant_id
        or exists (
            select 1
            from public.competition_idea_boards
            where competition_idea_boards.id = board_applications.board_id
              and competition_idea_boards.user_id = auth.uid()
        )
    );

create policy "board_applications_insert_applicant"
    on public.board_applications
    for insert
    with check (auth.uid() = applicant_id);

create policy "board_applications_update_participant"
    on public.board_applications
    for update
    using (
        auth.uid() = applicant_id
        or exists (
            select 1
            from public.competition_idea_boards
            where competition_idea_boards.id = board_applications.board_id
              and competition_idea_boards.user_id = auth.uid()
        )
    )
    with check (
        auth.uid() = applicant_id
        or exists (
            select 1
            from public.competition_idea_boards
            where competition_idea_boards.id = board_applications.board_id
              and competition_idea_boards.user_id = auth.uid()
        )
    );

drop policy if exists "board_application_events_select_participant" on public.board_application_events;
drop policy if exists "board_application_events_insert_participant" on public.board_application_events;
create policy "board_application_events_select_participant"
    on public.board_application_events
    for select
    using (
        exists (
            select 1
            from public.board_applications
            join public.competition_idea_boards on competition_idea_boards.id = board_applications.board_id
            where board_applications.id = board_application_events.board_application_id
              and (board_applications.applicant_id = auth.uid() or competition_idea_boards.user_id = auth.uid())
        )
    );

create policy "board_application_events_insert_participant"
    on public.board_application_events
    for insert
    with check (
        exists (
            select 1
            from public.board_applications
            join public.competition_idea_boards on competition_idea_boards.id = board_applications.board_id
            where board_applications.id = board_application_events.board_application_id
              and (board_applications.applicant_id = auth.uid() or competition_idea_boards.user_id = auth.uid())
        )
    );

drop policy if exists "teams_select_member" on public.teams;
drop policy if exists "teams_manage_creator" on public.teams;
create policy "teams_select_member"
    on public.teams
    for select
    using (
        creator_id = auth.uid()
        or exists (
            select 1
            from public.team_members
            where team_members.team_id = teams.id
              and team_members.profile_id = auth.uid()
        )
    );

create policy "teams_manage_creator"
    on public.teams
    for all
    using (creator_id = auth.uid())
    with check (creator_id = auth.uid());

drop policy if exists "team_members_select_member" on public.team_members;
drop policy if exists "team_members_manage_creator" on public.team_members;
create policy "team_members_select_member"
    on public.team_members
    for select
    using (
        profile_id = auth.uid()
        or exists (
            select 1
            from public.teams
            where teams.id = team_members.team_id
              and teams.creator_id = auth.uid()
        )
    );

create policy "team_members_manage_creator"
    on public.team_members
    for all
    using (
        exists (
            select 1
            from public.teams
            where teams.id = team_members.team_id
              and teams.creator_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.teams
            where teams.id = team_members.team_id
              and teams.creator_id = auth.uid()
        )
    );

drop policy if exists "team_commitments_select_member" on public.team_commitments;
drop policy if exists "team_commitments_update_member_creator" on public.team_commitments;
create policy "team_commitments_select_member"
    on public.team_commitments
    for select
    using (
        exists (
            select 1
            from public.team_members
            join public.teams on teams.id = team_members.team_id
            where team_members.id = team_commitments.team_member_id
              and (team_members.profile_id = auth.uid() or teams.creator_id = auth.uid())
        )
    );

create policy "team_commitments_update_member_creator"
    on public.team_commitments
    for all
    using (
        exists (
            select 1
            from public.team_members
            join public.teams on teams.id = team_members.team_id
            where team_members.id = team_commitments.team_member_id
              and (team_members.profile_id = auth.uid() or teams.creator_id = auth.uid())
        )
    )
    with check (
        exists (
            select 1
            from public.team_members
            join public.teams on teams.id = team_members.team_id
            where team_members.id = team_commitments.team_member_id
              and (team_members.profile_id = auth.uid() or teams.creator_id = auth.uid())
        )
    );

drop policy if exists "team_resources_select_member" on public.team_resources;
drop policy if exists "team_resources_manage_creator" on public.team_resources;
create policy "team_resources_select_member"
    on public.team_resources
    for select
    using (
        exists (
            select 1
            from public.teams
            left join public.team_members on team_members.team_id = teams.id
            where teams.id = team_resources.team_id
              and (teams.creator_id = auth.uid() or team_members.profile_id = auth.uid())
        )
    );

create policy "team_resources_manage_creator"
    on public.team_resources
    for all
    using (
        exists (
            select 1
            from public.teams
            where teams.id = team_resources.team_id
              and teams.creator_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.teams
            where teams.id = team_resources.team_id
              and teams.creator_id = auth.uid()
        )
    );

drop policy if exists "team_activity_events_select_member" on public.team_activity_events;
drop policy if exists "team_activity_events_insert_member" on public.team_activity_events;
create policy "team_activity_events_select_member"
    on public.team_activity_events
    for select
    using (
        exists (
            select 1
            from public.teams
            left join public.team_members on team_members.team_id = teams.id
            where teams.id = team_activity_events.team_id
              and (teams.creator_id = auth.uid() or team_members.profile_id = auth.uid())
        )
    );

create policy "team_activity_events_insert_member"
    on public.team_activity_events
    for insert
    with check (
        exists (
            select 1
            from public.teams
            left join public.team_members on team_members.team_id = teams.id
            where teams.id = team_activity_events.team_id
              and (teams.creator_id = auth.uid() or team_members.profile_id = auth.uid())
        )
    );

drop policy if exists "competition_history_select_visible" on public.competition_history;
drop policy if exists "competition_history_manage_own" on public.competition_history;
create policy "competition_history_select_visible"
    on public.competition_history
    for select
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = competition_history.profile_id
              and (profiles.id = auth.uid() or (profiles.public_visibility = true and profiles.show_competition_history = true))
        )
    );

create policy "competition_history_manage_own"
    on public.competition_history
    for all
    using (auth.uid() = profile_id)
    with check (auth.uid() = profile_id);

drop policy if exists "team_results_select_member" on public.team_results;
drop policy if exists "team_results_manage_creator" on public.team_results;
create policy "team_results_select_member"
    on public.team_results
    for select
    using (
        exists (
            select 1
            from public.teams
            left join public.team_members on team_members.team_id = teams.id
            where teams.id = team_results.team_id
              and (teams.creator_id = auth.uid() or team_members.profile_id = auth.uid())
        )
    );

create policy "team_results_manage_creator"
    on public.team_results
    for all
    using (
        exists (
            select 1
            from public.teams
            where teams.id = team_results.team_id
              and teams.creator_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1
            from public.teams
            where teams.id = team_results.team_id
              and teams.creator_id = auth.uid()
        )
    );

drop policy if exists "testimonials_select_visible" on public.testimonials;
drop policy if exists "testimonials_manage_author" on public.testimonials;
create policy "testimonials_select_visible"
    on public.testimonials
    for select
    using (
        exists (
            select 1
            from public.profiles
            where profiles.id = testimonials.target_profile_id
              and (profiles.id = auth.uid() or profiles.public_visibility = true)
        )
    );

create policy "testimonials_manage_author"
    on public.testimonials
    for all
    using (auth.uid() = author_id)
    with check (auth.uid() = author_id);

drop policy if exists "testimonial_edits_select_author_target" on public.testimonial_edits;
drop policy if exists "testimonial_edits_insert_author" on public.testimonial_edits;
create policy "testimonial_edits_select_author_target"
    on public.testimonial_edits
    for select
    using (
        exists (
            select 1
            from public.testimonials
            where testimonials.id = testimonial_edits.testimonial_id
              and (testimonials.author_id = auth.uid() or testimonials.target_profile_id = auth.uid())
        )
    );

create policy "testimonial_edits_insert_author"
    on public.testimonial_edits
    for insert
    with check (
        exists (
            select 1
            from public.testimonials
            where testimonials.id = testimonial_edits.testimonial_id
              and testimonials.author_id = auth.uid()
        )
    );

drop policy if exists "notification_preferences_select_own" on public.notification_preferences;
drop policy if exists "notification_preferences_manage_own" on public.notification_preferences;
create policy "notification_preferences_select_own"
    on public.notification_preferences
    for select
    using (auth.uid() = user_id);

create policy "notification_preferences_manage_own"
    on public.notification_preferences
    for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "user_notifications_select_own" on public.user_notifications;
drop policy if exists "user_notifications_update_own" on public.user_notifications;
create policy "user_notifications_select_own"
    on public.user_notifications
    for select
    using (auth.uid() = user_id);

create policy "user_notifications_update_own"
    on public.user_notifications
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "privacy_audit_events_select_own" on public.privacy_audit_events;
drop policy if exists "privacy_audit_events_insert_own" on public.privacy_audit_events;
create policy "privacy_audit_events_select_own"
    on public.privacy_audit_events
    for select
    using (auth.uid() = user_id);

create policy "privacy_audit_events_insert_own"
    on public.privacy_audit_events
    for insert
    with check (auth.uid() = user_id);

insert into public.skill_taxonomy (slug, label, category, sort_order)
values
    ('frontend-react', 'Frontend React', 'engineering', 10),
    ('backend-api', 'Backend API', 'engineering', 20),
    ('ui-ux-design', 'UI/UX Design', 'design', 30),
    ('machine-learning', 'Machine Learning', 'data', 40),
    ('data-analysis', 'Data Analysis', 'data', 50),
    ('pitch-deck', 'Pitch Deck', 'business', 60),
    ('product-strategy', 'Product Strategy', 'business', 70),
    ('research-writing', 'Research Writing', 'research', 80),
    ('public-speaking', 'Public Speaking', 'communication', 90),
    ('project-management', 'Project Management', 'operations', 100)
on conflict (slug) do update
set
    label = excluded.label,
    category = excluded.category,
    sort_order = excluded.sort_order,
    is_active = true;

insert into public.competition_type_taxonomy (slug, label, recommended_skills, sort_order)
values
    ('hackathon', 'Hackathon', '{"Frontend React","Backend API","UI/UX Design","Product Strategy"}', 10),
    ('pkm', 'PKM', '{"Research Writing","Project Management","Public Speaking"}', 20),
    ('business', 'Business', '{"Pitch Deck","Product Strategy","Public Speaking","Data Analysis"}', 30),
    ('ui-ux-design', 'UI/UX Design', '{"UI/UX Design","Frontend React","Product Strategy"}', 40),
    ('data-science', 'Data Science', '{"Machine Learning","Data Analysis","Backend API"}', 50),
    ('karya-tulis', 'Karya Tulis', '{"Research Writing","Public Speaking","Project Management"}', 60),
    ('others', 'Lainnya', '{"Project Management","Public Speaking"}', 70)
on conflict (slug) do update
set
    label = excluded.label,
    recommended_skills = excluded.recommended_skills,
    sort_order = excluded.sort_order,
    is_active = true;
