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

    select
        t.id,
        t.creator_id,
        t.name,
        t.competition_name
    into v_team
    from public.teams as t
    where t.id = p_team_id
    for update;

    if not found then
        raise exception 'Tim tidak ditemukan.';
    end if;

    if v_team.creator_id <> p_actor_user_id then
        raise exception 'Anda bukan creator tim ini.';
    end if;

    select coalesce(array_agg(tm.profile_id order by tm.created_at, tm.id), '{}'::uuid[])
    into v_affected_profile_ids
    from public.team_members as tm
    where tm.team_id = p_team_id;

    insert into public.team_results (
        team_id,
        result_summary,
        competition_ended_at
    )
    values (
        p_team_id,
        p_result_summary,
        p_competition_ended_at
    )
    returning id into v_team_result_id;

    insert into public.competition_history (
        profile_id,
        competition_name,
        role_name,
        best_result,
        team_id
    )
    select
        tm.profile_id,
        coalesce(nullif(trim(p_competition_name), ''), nullif(trim(v_team.competition_name), ''), v_team.name),
        tm.role_name,
        p_best_result,
        p_team_id
    from public.team_members as tm
    where tm.team_id = p_team_id;

    return query
    select
        v_team_result_id,
        v_affected_profile_ids;
end;
$$;
