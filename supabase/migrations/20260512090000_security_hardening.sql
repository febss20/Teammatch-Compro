create table if not exists public.rate_limit_buckets (
    scope text not null,
    subject_hash text not null,
    window_start timestamptz not null,
    request_count integer not null default 0,
    updated_at timestamptz not null default now(),
    primary key (scope, subject_hash, window_start),
    constraint rate_limit_buckets_scope_check check (char_length(scope) between 2 and 80),
    constraint rate_limit_buckets_subject_hash_check check (char_length(subject_hash) between 32 and 128),
    constraint rate_limit_buckets_request_count_check check (request_count >= 0)
);

alter table public.rate_limit_buckets enable row level security;
revoke all on public.rate_limit_buckets from anon, authenticated;

create or replace function public.consume_rate_limit(
    p_scope text,
    p_subject_hash text,
    p_limit_count integer,
    p_window_seconds integer
)
returns table (
    allowed boolean,
    remaining integer,
    reset_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_window_start timestamptz;
    v_count integer;
    v_reset_at timestamptz;
begin
    if p_limit_count < 1 or p_window_seconds < 1 then
        raise exception 'Konfigurasi rate limit tidak valid.';
    end if;

    v_window_start := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
    v_reset_at := v_window_start + make_interval(secs => p_window_seconds);

    insert into public.rate_limit_buckets (scope, subject_hash, window_start, request_count, updated_at)
    values (p_scope, p_subject_hash, v_window_start, 1, now())
    on conflict (scope, subject_hash, window_start)
    do update
    set
        request_count = public.rate_limit_buckets.request_count + 1,
        updated_at = now()
    returning request_count into v_count;

    if v_count > p_limit_count then
        raise exception 'Rate limit exceeded.';
    end if;

    return query
    select
        true,
        greatest(p_limit_count - v_count, 0),
        v_reset_at;
end;
$$;

grant execute on function public.consume_rate_limit(text, text, integer, integer) to anon, authenticated;

create unique index if not exists join_request_events_unique_terminal_idx
    on public.join_request_events (join_request_id, event_type)
    where event_type in ('accepted', 'rejected', 'withdrawn');

create unique index if not exists board_application_events_unique_terminal_idx
    on public.board_application_events (board_application_id, event_type)
    where event_type in ('saved', 'accepted', 'rejected', 'withdrawn');

create unique index if not exists team_results_unique_team_idx
    on public.team_results (team_id);

create table if not exists public.mutation_idempotency_keys (
    user_id uuid not null references public.profiles(id) on delete cascade,
    scope text not null,
    idempotency_key text not null,
    created_at timestamptz not null default now(),
    primary key (user_id, scope, idempotency_key),
    constraint mutation_idempotency_scope_check check (char_length(scope) between 2 and 80),
    constraint mutation_idempotency_key_check check (char_length(idempotency_key) between 8 and 160)
);

alter table public.mutation_idempotency_keys enable row level security;
revoke all on public.mutation_idempotency_keys from anon, authenticated;

create or replace function public.create_join_request(
    p_target_profile_id uuid,
    p_board_id uuid,
    p_selected_role text,
    p_message text,
    p_actor_name text
)
returns table (
    request_id uuid,
    target_profile_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_request_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk mengirim request.';
    end if;

    perform allowed
    from public.consume_rate_limit('join_request', auth.uid()::text, 20, 3600);

    if p_target_profile_id = auth.uid() then
        raise exception 'Anda tidak bisa mengirim request ke diri sendiri.';
    end if;

    if exists (
        select 1
        from public.join_requests
        where requester_id = auth.uid()
          and target_profile_id = p_target_profile_id
          and status = 'rejected'
          and rejection_locked = true
    ) then
        raise exception 'Anda tidak bisa mengirim ulang request ke kandidat yang pernah menolak.';
    end if;

    insert into public.join_requests (
        requester_id,
        target_profile_id,
        board_id,
        selected_role,
        message,
        status,
        rejection_locked,
        responded_at
    )
    values (
        auth.uid(),
        p_target_profile_id,
        p_board_id,
        p_selected_role,
        p_message,
        'pending',
        false,
        null
    )
    returning id into v_request_id;

    insert into public.join_request_events (join_request_id, actor_id, event_type, note)
    values (v_request_id, auth.uid(), 'created', p_actor_name);

    return query select v_request_id, p_target_profile_id;
end;
$$;

grant execute on function public.create_join_request(uuid, uuid, text, text, text) to authenticated;

create or replace function public.withdraw_join_request(p_request_id uuid)
returns table (
    withdrawn_request_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_request record;
begin
    select id, requester_id, status
    into v_request
    from public.join_requests
    where id = p_request_id
    for update;

    if not found or v_request.requester_id <> auth.uid() then
        raise exception 'Request tidak ditemukan atau Anda tidak memiliki akses.';
    end if;

    if v_request.status <> 'pending' then
        raise exception 'Hanya request pending yang dapat ditarik.';
    end if;

    update public.join_requests
    set
        status = 'withdrawn',
        updated_at = now(),
        responded_at = now()
    where id = p_request_id;

    insert into public.join_request_events (join_request_id, actor_id, event_type)
    values (p_request_id, auth.uid(), 'withdrawn');

    return query select p_request_id;
end;
$$;

grant execute on function public.withdraw_join_request(uuid) to authenticated;

create or replace function public.respond_join_request(
    p_request_id uuid,
    p_status text
)
returns table (
    request_id uuid,
    requester_user_id uuid,
    target_profile_id uuid,
    response_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_request record;
begin
    if p_status not in ('accepted', 'rejected') then
        raise exception 'Status response request tidak valid.';
    end if;

    select id, requester_id, target_profile_id, status
    into v_request
    from public.join_requests
    where id = p_request_id
    for update;

    if not found or v_request.target_profile_id <> auth.uid() then
        raise exception 'Request tidak ditemukan atau Anda tidak memiliki akses.';
    end if;

    if v_request.status <> 'pending' then
        raise exception 'Hanya request pending yang dapat diproses.';
    end if;

    update public.join_requests
    set
        status = p_status,
        rejection_locked = p_status = 'rejected',
        updated_at = now(),
        responded_at = now()
    where id = p_request_id;

    insert into public.join_request_events (join_request_id, actor_id, event_type)
    values (p_request_id, auth.uid(), p_status);

    return query
    select
        v_request.id,
        v_request.requester_id,
        v_request.target_profile_id,
        p_status;
end;
$$;

grant execute on function public.respond_join_request(uuid, text) to authenticated;

create or replace function public.withdraw_board_application(p_application_id uuid)
returns table (
    application_id uuid,
    board_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_application record;
begin
    select id, board_id, applicant_id, status
    into v_application
    from public.board_applications
    where id = p_application_id
    for update;

    if not found or v_application.applicant_id <> auth.uid() then
        raise exception 'Lamaran tidak ditemukan atau Anda tidak memiliki akses.';
    end if;

    if v_application.status not in ('pending', 'saved') then
        raise exception 'Lamaran ini tidak dapat ditarik.';
    end if;

    update public.board_applications
    set
        status = 'withdrawn',
        responded_at = now(),
        updated_at = now()
    where id = p_application_id;

    insert into public.board_application_events (board_application_id, actor_id, event_type)
    values (p_application_id, auth.uid(), 'withdrawn');

    return query select v_application.id, v_application.board_id;
end;
$$;

grant execute on function public.withdraw_board_application(uuid) to authenticated;

create or replace function public.create_board_application(
    p_board_id uuid,
    p_board_slot_id uuid,
    p_selected_role text,
    p_message text,
    p_skill_match_score integer,
    p_actor_name text
)
returns table (
    application_id uuid,
    owner_user_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_board record;
    v_slot record;
    v_application_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk mengirim lamaran.';
    end if;

    perform allowed
    from public.consume_rate_limit('board_application', auth.uid()::text, 20, 3600);

    select id, user_id, is_draft, visibility, status
    into v_board
    from public.competition_idea_boards
    where id = p_board_id
    for update;

    if not found or v_board.is_draft = true or v_board.visibility <> 'public' then
        raise exception 'Board tidak ditemukan.';
    end if;

    if v_board.status <> 'open' then
        raise exception 'Board ini belum menerima lamaran baru.';
    end if;

    if v_board.user_id = auth.uid() then
        raise exception 'Anda tidak bisa melamar ke board milik sendiri.';
    end if;

    if p_board_slot_id is not null then
        select id, board_id
        into v_slot
        from public.board_slots
        where id = p_board_slot_id;

        if not found or v_slot.board_id <> p_board_id then
            raise exception 'Role board yang dipilih tidak sesuai dengan board tujuan.';
        end if;
    end if;

    insert into public.board_applications (
        board_id,
        applicant_id,
        board_slot_id,
        selected_role,
        message,
        skill_match_score,
        status,
        responded_at,
        team_id
    )
    values (
        p_board_id,
        auth.uid(),
        p_board_slot_id,
        p_selected_role,
        p_message,
        p_skill_match_score,
        'pending',
        null,
        null
    )
    returning id into v_application_id;

    insert into public.board_application_events (board_application_id, actor_id, event_type, note)
    values (v_application_id, auth.uid(), 'created', p_actor_name);

    update public.competition_idea_boards
    set
        last_applicant_at = now(),
        updated_at = now()
    where id = p_board_id;

    return query select v_application_id, v_board.user_id;
end;
$$;

grant execute on function public.create_board_application(uuid, uuid, text, text, integer, text) to authenticated;

create or replace function public.save_board_application_for_review(p_application_id uuid)
returns table (
    application_id uuid,
    board_id uuid,
    applicant_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_application record;
begin
    select
        ba.id,
        ba.board_id,
        ba.applicant_id,
        ba.status,
        boards.user_id as board_owner_id
    into v_application
    from public.board_applications as ba
    join public.competition_idea_boards as boards
        on boards.id = ba.board_id
    where ba.id = p_application_id
    for update of ba;

    if not found or v_application.board_owner_id <> auth.uid() then
        raise exception 'Lamaran tidak ditemukan atau Anda tidak memiliki akses.';
    end if;

    if v_application.status = 'saved' then
        return query select v_application.id, v_application.board_id, v_application.applicant_id;
        return;
    end if;

    if v_application.status <> 'pending' then
        raise exception 'Hanya lamaran pending yang dapat disimpan.';
    end if;

    update public.board_applications
    set
        status = 'saved',
        updated_at = now()
    where id = p_application_id;

    insert into public.board_application_events (board_application_id, actor_id, event_type)
    values (p_application_id, auth.uid(), 'saved');

    return query select v_application.id, v_application.board_id, v_application.applicant_id;
end;
$$;

grant execute on function public.save_board_application_for_review(uuid) to authenticated;

drop function if exists public.accept_board_application(uuid);
create or replace function public.accept_board_application(p_application_id uuid)
returns table (
    accepted_board_id uuid,
    accepted_selected_role text,
    accepted_applicant_id uuid,
    accepted_team_created boolean,
    accepted_team_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_application record;
    v_team_id uuid;
    v_team_created boolean := false;
    v_applicant_member_id uuid;
begin
    select
        ba.id,
        ba.board_id,
        ba.applicant_id,
        ba.selected_role,
        ba.status,
        boards.user_id as board_owner_id,
        boards.title as board_title,
        boards.deadline as board_deadline
    into v_application
    from public.board_applications as ba
    join public.competition_idea_boards as boards
        on boards.id = ba.board_id
    where ba.id = p_application_id
    for update of ba;

    if not found or v_application.board_owner_id <> auth.uid() then
        raise exception 'Lamaran tidak ditemukan atau Anda tidak memiliki akses.';
    end if;

    if v_application.status not in ('pending', 'saved') then
        raise exception 'Hanya lamaran pending atau saved yang dapat diterima.';
    end if;

    select t.id
    into v_team_id
    from public.teams as t
    where t.board_id = v_application.board_id
    order by t.created_at asc, t.id asc
    limit 1
    for update;

    if v_team_id is null then
        insert into public.teams (board_id, creator_id, name, competition_name, deadline)
        values (v_application.board_id, auth.uid(), v_application.board_title, v_application.board_title, v_application.board_deadline)
        returning id into v_team_id;

        v_team_created := true;
    end if;

    insert into public.team_members (team_id, profile_id, role_name, confirmation_status, updated_at)
    values (v_team_id, auth.uid(), 'Creator', 'confirmed', now())
    on conflict (team_id, profile_id)
    do update
    set
        confirmation_status = 'confirmed',
        updated_at = now();

    insert into public.team_members (team_id, profile_id, role_name, confirmation_status, updated_at)
    values (v_team_id, v_application.applicant_id, v_application.selected_role, 'pending', now())
    on conflict (team_id, profile_id)
    do update
    set
        role_name = excluded.role_name,
        updated_at = now()
    returning id into v_applicant_member_id;

    if v_applicant_member_id is null then
        select tm.id
        into v_applicant_member_id
        from public.team_members as tm
        where tm.team_id = v_team_id
          and tm.profile_id = v_application.applicant_id
        limit 1;
    end if;

    insert into public.team_commitments (team_member_id, hours_per_week, deadline_at, created_at, updated_at)
    values (v_applicant_member_id, 5, now() + interval '48 hours', now(), now())
    on conflict (team_member_id)
    do nothing;

    update public.board_applications
    set
        status = 'accepted',
        responded_at = now(),
        updated_at = now(),
        team_id = v_team_id
    where id = p_application_id;

    insert into public.board_application_events (board_application_id, actor_id, event_type, note)
    values (p_application_id, auth.uid(), 'accepted', case when v_team_created then 'team_created' else 'team_reused' end);

    insert into public.team_activity_events (team_id, actor_id, event_type, payload)
    values (
        v_team_id,
        auth.uid(),
        'application_accepted',
        jsonb_build_object(
            'application_id', v_application.id,
            'applicant_id', v_application.applicant_id,
            'role_name', v_application.selected_role,
            'team_created', v_team_created
        )
    );

    return query
    select
        v_application.board_id,
        v_application.selected_role,
        v_application.applicant_id,
        v_team_created,
        v_team_id;
end;
$$;

grant execute on function public.accept_board_application(uuid) to authenticated;

create or replace function public.reject_board_application(p_application_id uuid)
returns table (
    application_id uuid,
    board_id uuid,
    applicant_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_application record;
begin
    select
        ba.id,
        ba.board_id,
        ba.applicant_id,
        ba.status,
        boards.user_id as board_owner_id
    into v_application
    from public.board_applications as ba
    join public.competition_idea_boards as boards
        on boards.id = ba.board_id
    where ba.id = p_application_id
    for update of ba;

    if not found or v_application.board_owner_id <> auth.uid() then
        raise exception 'Lamaran tidak ditemukan atau Anda tidak memiliki akses.';
    end if;

    if v_application.status not in ('pending', 'saved') then
        raise exception 'Lamaran ini tidak dapat ditolak.';
    end if;

    update public.board_applications
    set
        status = 'rejected',
        responded_at = now(),
        updated_at = now()
    where id = p_application_id;

    insert into public.board_application_events (board_application_id, actor_id, event_type)
    values (p_application_id, auth.uid(), 'rejected');

    return query select v_application.id, v_application.board_id, v_application.applicant_id;
end;
$$;

grant execute on function public.reject_board_application(uuid) to authenticated;

create or replace function public.confirm_team_commitment(
    p_team_member_id uuid,
    p_hours_per_week integer
)
returns table (
    confirmed_team_id uuid,
    confirmed_team_name text,
    creator_user_id uuid,
    all_members_confirmed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_member record;
    v_team record;
    v_all_confirmed boolean;
begin
    if p_hours_per_week < 1 or p_hours_per_week > 80 then
        raise exception 'Jam komitmen tidak valid.';
    end if;

    select id, profile_id, team_id
    into v_member
    from public.team_members
    where id = p_team_member_id
    for update;

    if not found or v_member.profile_id <> auth.uid() then
        raise exception 'Anda tidak memiliki akses untuk mengonfirmasi komitmen ini.';
    end if;

    select id, creator_id, name
    into v_team
    from public.teams
    where id = v_member.team_id;

    update public.team_commitments
    set
        hours_per_week = p_hours_per_week,
        confirmed_at = now(),
        updated_at = now()
    where team_member_id = v_member.id;

    if not found then
        raise exception 'Komitmen tim tidak ditemukan.';
    end if;

    update public.team_members
    set
        confirmation_status = 'confirmed',
        updated_at = now()
    where id = v_member.id;

    select coalesce(bool_and(confirmation_status = 'confirmed'), false)
    into v_all_confirmed
    from public.team_members
    where team_id = v_member.team_id;

    insert into public.team_activity_events (team_id, actor_id, event_type, payload)
    values (
        v_member.team_id,
        auth.uid(),
        'commitment_confirmed',
        jsonb_build_object('team_member_id', v_member.id, 'hours_per_week', p_hours_per_week)
    );

    return query
    select v_member.team_id, v_team.name, v_team.creator_id, v_all_confirmed;
end;
$$;

grant execute on function public.confirm_team_commitment(uuid, integer) to authenticated;

create or replace function public.send_commitment_reminder(p_team_member_id uuid)
returns table (
    reminder_team_id uuid,
    reminder_team_name text,
    reminder_profile_id uuid,
    reminder_role_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_member record;
    v_commitment_id uuid;
begin
    select
        tm.id,
        tm.profile_id,
        tm.role_name,
        tm.team_id,
        t.creator_id,
        t.name as team_name,
        tc.id as commitment_id
    into v_member
    from public.team_members as tm
    join public.teams as t
        on t.id = tm.team_id
    join public.team_commitments as tc
        on tc.team_member_id = tm.id
    where tm.id = p_team_member_id
    for update of tm;

    if not found or v_member.creator_id <> auth.uid() then
        raise exception 'Anda tidak memiliki akses untuk mengirim reminder ini.';
    end if;

    update public.team_commitments
    set
        last_reminded_at = now(),
        updated_at = now()
    where id = v_member.commitment_id
      and (last_reminded_at is null or last_reminded_at < now() - interval '1 hour')
    returning id into v_commitment_id;

    if v_commitment_id is null then
        raise exception 'Reminder manual hanya dapat dikirim maksimal 1 kali per jam.';
    end if;

    insert into public.team_activity_events (team_id, actor_id, event_type, payload)
    values (
        v_member.team_id,
        auth.uid(),
        'commitment_reminder_sent',
        jsonb_build_object('team_member_id', v_member.id, 'role_name', v_member.role_name)
    );

    return query
    select v_member.team_id, v_member.team_name, v_member.profile_id, v_member.role_name;
end;
$$;

grant execute on function public.send_commitment_reminder(uuid) to authenticated;

create or replace function public.reopen_expired_slot(p_team_member_id uuid)
returns table (
    reopened_team_id uuid,
    reopened_board_id uuid,
    reopened_team_name text,
    reopened_role_name text
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_member record;
begin
    select
        tm.id,
        tm.profile_id,
        tm.role_name,
        tm.team_id,
        t.creator_id,
        t.board_id,
        t.name as team_name,
        tc.deadline_at,
        tc.confirmed_at
    into v_member
    from public.team_members as tm
    join public.teams as t
        on t.id = tm.team_id
    join public.team_commitments as tc
        on tc.team_member_id = tm.id
    where tm.id = p_team_member_id
    for update of tm;

    if not found or v_member.creator_id <> auth.uid() then
        raise exception 'Anda tidak memiliki akses untuk membuka ulang slot ini.';
    end if;

    if v_member.confirmed_at is not null then
        raise exception 'Anggota ini sudah mengonfirmasi komitmen.';
    end if;

    if v_member.deadline_at > now() then
        raise exception 'Slot belum melewati deadline 48 jam.';
    end if;

    update public.team_members
    set
        confirmation_status = 'expired',
        updated_at = now()
    where id = v_member.id;

    if v_member.board_id is not null then
        update public.competition_idea_boards
        set
            status = 'open',
            updated_at = now()
        where id = v_member.board_id;
    end if;

    insert into public.team_activity_events (team_id, actor_id, event_type, payload)
    values (
        v_member.team_id,
        auth.uid(),
        'slot_reopened',
        jsonb_build_object('team_member_id', v_member.id, 'role_name', v_member.role_name)
    );

    return query
    select v_member.team_id, v_member.board_id, v_member.team_name, v_member.role_name;
end;
$$;

grant execute on function public.reopen_expired_slot(uuid) to authenticated;

create or replace function public.record_team_result_and_history(
    p_team_id uuid,
    p_competition_name text,
    p_result_summary text,
    p_best_result text,
    p_competition_ended_at timestamptz,
    p_actor_user_id uuid
)
returns table (
    team_result_id uuid,
    affected_profile_ids uuid[]
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_team record;
    v_team_result_id uuid;
    v_affected_profile_ids uuid[];
begin
    if auth.uid() is null or auth.uid() <> p_actor_user_id then
        raise exception 'Anda tidak memiliki akses untuk mencatat hasil lomba ini.';
    end if;

    select t.id, t.creator_id, t.name, t.competition_name
    into v_team
    from public.teams as t
    where t.id = p_team_id
    for update;

    if not found or v_team.creator_id <> p_actor_user_id then
        raise exception 'Tim tidak ditemukan atau Anda tidak memiliki akses.';
    end if;

    if exists (select 1 from public.team_results where team_id = p_team_id) then
        raise exception 'Hasil lomba untuk tim ini sudah dicatat.';
    end if;

    select coalesce(array_agg(tm.profile_id order by tm.created_at, tm.id), '{}'::uuid[])
    into v_affected_profile_ids
    from public.team_members as tm
    where tm.team_id = p_team_id;

    insert into public.team_results (team_id, result_summary, competition_ended_at)
    values (p_team_id, p_result_summary, p_competition_ended_at)
    returning id into v_team_result_id;

    insert into public.competition_history (profile_id, competition_name, role_name, best_result, team_id)
    select
        tm.profile_id,
        coalesce(nullif(trim(p_competition_name), ''), nullif(trim(v_team.competition_name), ''), v_team.name),
        tm.role_name,
        p_best_result,
        p_team_id
    from public.team_members as tm
    where tm.team_id = p_team_id;

    insert into public.team_activity_events (team_id, actor_id, event_type, payload)
    values (
        p_team_id,
        auth.uid(),
        'competition_result_recorded',
        jsonb_build_object('result_summary', p_result_summary, 'competition_ended_at', p_competition_ended_at)
    );

    return query select v_team_result_id, v_affected_profile_ids;
end;
$$;

grant execute on function public.record_team_result_and_history(uuid, text, text, text, timestamptz, uuid) to authenticated;

create or replace function public.run_dashboard_maintenance()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_lock_key bigint := 780120260512;
    v_locked boolean;
    v_member record;
    v_processed_count integer := 0;
begin
    v_locked := pg_try_advisory_lock(v_lock_key);
    if not v_locked then
        return 0;
    end if;

    begin
        for v_member in
            select
                tm.id,
                tm.profile_id,
                tm.role_name,
                tm.team_id,
                t.board_id,
                t.creator_id,
                t.name as team_name,
                tc.deadline_at
            from public.team_members as tm
            join public.teams as t
                on t.id = tm.team_id
            join public.team_commitments as tc
                on tc.team_member_id = tm.id
            where tm.confirmation_status = 'pending'
              and tc.deadline_at < now()
              and tc.confirmed_at is null
            for update of tm skip locked
        loop
            update public.team_members
            set
                confirmation_status = 'expired',
                updated_at = now()
            where id = v_member.id;

            if v_member.board_id is not null then
                update public.competition_idea_boards
                set
                    status = 'open',
                    updated_at = now()
                where id = v_member.board_id;
            end if;

            insert into public.team_activity_events (team_id, actor_id, event_type, payload)
            values (
                v_member.team_id,
                null,
                'slot_expired_auto',
                jsonb_build_object(
                    'team_member_id', v_member.id,
                    'role_name', v_member.role_name,
                    'deadline_at', v_member.deadline_at
                )
            );

            insert into public.user_notifications (user_id, category, title, body, link_path)
            values (
                v_member.creator_id,
                'commitment',
                'Slot tim terbuka kembali otomatis',
                format('Slot %s pada tim %s dibuka ulang karena batas konfirmasi 48 jam terlewati.', v_member.role_name, v_member.team_name),
                format('/dashboard/teams/%s', v_member.team_id)
            );

            v_processed_count := v_processed_count + 1;
        end loop;

        perform pg_advisory_unlock(v_lock_key);
        return v_processed_count;
    exception
        when others then
            perform pg_advisory_unlock(v_lock_key);
            raise;
    end;
end;
$$;

revoke all on function public.run_dashboard_maintenance() from anon, authenticated;

drop policy if exists "join_requests_update_participant" on public.join_requests;
drop policy if exists "join_requests_insert_requester" on public.join_requests;
drop policy if exists "board_applications_update_participant" on public.board_applications;
drop policy if exists "board_applications_insert_applicant" on public.board_applications;
drop policy if exists "team_members_manage_creator" on public.team_members;
drop policy if exists "team_members_update_self_commitment" on public.team_members;
drop policy if exists "team_commitments_update_member_creator" on public.team_commitments;
drop policy if exists "team_results_manage_creator" on public.team_results;

create policy "join_requests_insert_requester_pending"
    on public.join_requests
    for insert
    with check (
        auth.uid() = requester_id
        and status = 'pending'
        and rejection_locked = false
        and responded_at is null
    );

create policy "board_applications_insert_applicant_pending"
    on public.board_applications
    for insert
    with check (
        auth.uid() = applicant_id
        and status = 'pending'
        and responded_at is null
        and team_id is null
    );

drop trigger if exists testimonials_validate_write on public.testimonials;
drop function if exists public.validate_testimonial_write();
create or replace function public.validate_testimonial_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null or new.author_id <> auth.uid() then
        raise exception 'Anda tidak memiliki akses untuk menyimpan testimoni.';
    end if;

    if new.author_id = new.target_profile_id then
        raise exception 'Testimoni untuk diri sendiri tidak diizinkan.';
    end if;

    if tg_op = 'UPDATE' then
        if new.author_id <> old.author_id
            or new.target_profile_id <> old.target_profile_id
            or new.team_id <> old.team_id
            or new.created_at <> old.created_at
        then
            raise exception 'Kolom identitas testimoni tidak boleh diubah.';
        end if;

        if old.created_at < now() - interval '7 days' then
            raise exception 'Testimoni sudah terkunci dan tidak bisa diedit lagi.';
        end if;
    end if;

    if not exists (
        select 1
        from public.team_members as author_member
        join public.team_members as target_member
            on target_member.team_id = author_member.team_id
        where author_member.team_id = new.team_id
          and author_member.profile_id = new.author_id
          and target_member.profile_id = new.target_profile_id
    ) then
        raise exception 'Testimoni hanya dapat dibuat untuk anggota tim yang sama.';
    end if;

    return new;
end;
$$;

create trigger testimonials_validate_write
    before insert or update on public.testimonials
    for each row
    execute function public.validate_testimonial_write();

revoke insert, update on public.join_requests from anon, authenticated;
revoke insert, update on public.board_applications from anon, authenticated;
revoke insert, update, delete on public.team_members from anon, authenticated;
revoke insert, update, delete on public.team_commitments from anon, authenticated;
revoke insert, update, delete on public.team_results from anon, authenticated;

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to anon, authenticated;

revoke all on function public.create_join_request(uuid, uuid, text, text, text) from public;
grant execute on function public.create_join_request(uuid, uuid, text, text, text) to authenticated;

revoke all on function public.withdraw_join_request(uuid) from public;
grant execute on function public.withdraw_join_request(uuid) to authenticated;

revoke all on function public.respond_join_request(uuid, text) from public;
grant execute on function public.respond_join_request(uuid, text) to authenticated;

revoke all on function public.create_board_application(uuid, uuid, text, text, integer, text) from public;
grant execute on function public.create_board_application(uuid, uuid, text, text, integer, text) to authenticated;

revoke all on function public.withdraw_board_application(uuid) from public;
grant execute on function public.withdraw_board_application(uuid) to authenticated;

revoke all on function public.save_board_application_for_review(uuid) from public;
grant execute on function public.save_board_application_for_review(uuid) to authenticated;

revoke all on function public.accept_board_application(uuid) from public;
grant execute on function public.accept_board_application(uuid) to authenticated;

revoke all on function public.reject_board_application(uuid) from public;
grant execute on function public.reject_board_application(uuid) to authenticated;

revoke all on function public.confirm_team_commitment(uuid, integer) from public;
grant execute on function public.confirm_team_commitment(uuid, integer) to authenticated;

revoke all on function public.send_commitment_reminder(uuid) from public;
grant execute on function public.send_commitment_reminder(uuid) to authenticated;

revoke all on function public.reopen_expired_slot(uuid) from public;
grant execute on function public.reopen_expired_slot(uuid) to authenticated;

revoke all on function public.record_team_result_and_history(uuid, text, text, text, timestamptz, uuid) from public;
grant execute on function public.record_team_result_and_history(uuid, text, text, text, timestamptz, uuid) to authenticated;

revoke all on function public.run_dashboard_maintenance() from public;
grant execute on function public.run_dashboard_maintenance() to service_role;
