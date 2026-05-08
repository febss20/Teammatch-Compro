alter table public.board_applications
    add column if not exists team_id uuid references public.teams(id) on delete set null;

create index if not exists board_applications_team_id_idx
    on public.board_applications (team_id);

with ranked_team_matches as (
    select
        ba.id as board_application_id,
        t.id as team_id,
        row_number() over (
            partition by ba.id
            order by t.created_at asc, t.id asc
        ) as row_number_rank
    from public.board_applications as ba
    join public.team_members as tm
        on tm.profile_id = ba.applicant_id
    join public.teams as t
        on t.id = tm.team_id
       and t.board_id = ba.board_id
    where ba.status = 'accepted'
)
update public.board_applications as ba
set team_id = ranked_team_matches.team_id
from ranked_team_matches
where ba.id = ranked_team_matches.board_application_id
  and ranked_team_matches.row_number_rank = 1
  and ba.team_id is null;

create or replace function public.prevent_multiple_teams_per_board()
returns trigger
language plpgsql
as $$
begin
    if new.board_id is null then
        return new;
    end if;

    if exists (
        select 1
        from public.teams
        where board_id = new.board_id
          and id is distinct from new.id
        limit 1
    ) then
        raise exception 'Satu board hanya boleh memiliki satu team aktif.';
    end if;

    return new;
end;
$$;

drop trigger if exists prevent_multiple_teams_per_board_trigger on public.teams;
create trigger prevent_multiple_teams_per_board_trigger
    before insert or update of board_id
    on public.teams
    for each row
    execute function public.prevent_multiple_teams_per_board();

create or replace function public.accept_board_application(p_application_id uuid)
returns table (
    board_id uuid,
    selected_role text,
    applicant_id uuid,
    team_created boolean,
    team_id uuid
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

    select teams.id
    into v_team_id
    from public.teams
    where teams.board_id = v_application.board_id
    order by teams.created_at asc, teams.id asc
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
        select team_members.id
        into v_applicant_member_id
        from public.team_members
        where team_members.team_id = v_team_id
          and team_members.profile_id = v_application.applicant_id
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

    update public.board_applications
    set
        status = 'accepted',
        responded_at = now(),
        updated_at = now(),
        team_id = v_team_id
    where id = p_application_id;

    return query
    select
        v_application.board_id,
        v_application.selected_role,
        v_application.applicant_id,
        v_team_created,
        v_team_id;
end;
$$;
