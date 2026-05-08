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
security invoker
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
        ba.team_id,
        boards.user_id as board_owner_id,
        boards.title as board_title,
        boards.deadline as board_deadline
    into v_application
    from public.board_applications as ba
    join public.competition_idea_boards as boards
        on boards.id = ba.board_id
    where ba.id = p_application_id
    for update of ba;

    if not found then
        raise exception 'Lamaran tidak ditemukan.';
    end if;

    if v_application.board_owner_id <> auth.uid() then
        raise exception 'Anda tidak memiliki akses untuk menerima lamaran ini.';
    end if;

    if v_application.status <> 'pending' then
        raise exception 'Hanya lamaran dengan status pending yang dapat diterima.';
    end if;

    select t.id
    into v_team_id
    from public.teams as t
    where t.board_id = v_application.board_id
    order by t.created_at asc, t.id asc
    limit 1
    for update;

    if v_team_id is null then
        insert into public.teams (
            board_id,
            creator_id,
            name,
            competition_name,
            deadline
        )
        values (
            v_application.board_id,
            auth.uid(),
            v_application.board_title,
            v_application.board_title,
            v_application.board_deadline
        )
        returning id into v_team_id;

        v_team_created := true;
    end if;

    insert into public.team_members (
        team_id,
        profile_id,
        role_name,
        confirmation_status,
        updated_at
    )
    values (
        v_team_id,
        auth.uid(),
        'Creator',
        'confirmed',
        now()
    )
    on conflict (team_id, profile_id)
    do update
    set
        confirmation_status = 'confirmed',
        updated_at = now();

    insert into public.team_members (
        team_id,
        profile_id,
        role_name,
        confirmation_status,
        updated_at
    )
    values (
        v_team_id,
        v_application.applicant_id,
        v_application.selected_role,
        'pending',
        now()
    )
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

    insert into public.team_commitments (
        team_member_id,
        hours_per_week,
        deadline_at,
        created_at,
        updated_at
    )
    values (
        v_applicant_member_id,
        5,
        now() + interval '48 hours',
        now(),
        now()
    )
    on conflict (team_member_id)
    do nothing;

    update public.board_applications as ba
    set
        status = 'accepted',
        responded_at = now(),
        updated_at = now(),
        team_id = v_team_id
    where ba.id = p_application_id;

    return query
    select
        v_application.board_id,
        v_application.selected_role,
        v_application.applicant_id,
        v_team_created,
        v_team_id;
end;
$$;
