create or replace function public.is_team_viewer(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select public.is_team_creator(target_team_id) or public.is_team_member(target_team_id);
$$;

create or replace function public.is_profile_teammate(target_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.team_members as self_member
        join public.team_members as teammate_member
            on teammate_member.team_id = self_member.team_id
        where self_member.profile_id = auth.uid()
          and teammate_member.profile_id = target_profile_id
    );
$$;

drop policy if exists "profiles_select_teammate_context" on public.profiles;
create policy "profiles_select_teammate_context"
    on public.profiles
    for select
    using (public.is_profile_teammate(id));

drop policy if exists "team_members_select_member" on public.team_members;
create policy "team_members_select_member"
    on public.team_members
    for select
    using (public.is_team_viewer(team_id));

drop policy if exists "team_commitments_select_member" on public.team_commitments;
create policy "team_commitments_select_member"
    on public.team_commitments
    for select
    using (
        exists (
            select 1
            from public.team_members
            where team_members.id = team_commitments.team_member_id
              and public.is_team_viewer(team_members.team_id)
        )
    );

do $$
declare
    duplicate_board record;
    canonical_team_id uuid;
    duplicate_team record;
    duplicate_member record;
    canonical_member_id uuid;
    duplicate_commitment record;
begin
    for duplicate_board in
        select board_id
        from public.teams
        where board_id is not null
        group by board_id
        having count(*) > 1
    loop
        select t.id
        into canonical_team_id
        from public.teams as t
        where t.board_id = duplicate_board.board_id
        order by t.created_at asc, t.id asc
        limit 1;

        for duplicate_team in
            select t.id
            from public.teams as t
            where t.board_id = duplicate_board.board_id
              and t.id <> canonical_team_id
            order by t.created_at asc, t.id asc
        loop
            for duplicate_member in
                select tm.id, tm.profile_id, tm.role_name, tm.confirmation_status
                from public.team_members as tm
                where tm.team_id = duplicate_team.id
                order by tm.created_at asc, tm.id asc
            loop
                select tm.id
                into canonical_member_id
                from public.team_members as tm
                where tm.team_id = canonical_team_id
                  and tm.profile_id = duplicate_member.profile_id
                limit 1;

                if canonical_member_id is null then
                    update public.team_members
                    set team_id = canonical_team_id,
                        updated_at = now()
                    where id = duplicate_member.id;
                else
                    update public.team_members
                    set role_name = case
                            when team_members.role_name = 'Creator' then team_members.role_name
                            when duplicate_member.role_name = 'Creator' then 'Creator'
                            else team_members.role_name
                        end,
                        confirmation_status = case
                            when team_members.confirmation_status = 'confirmed'
                                or duplicate_member.confirmation_status = 'confirmed' then 'confirmed'
                            when team_members.confirmation_status = 'expired'
                                or duplicate_member.confirmation_status = 'expired' then 'expired'
                            else 'pending'
                        end,
                        updated_at = now()
                    where id = canonical_member_id;

                    select tc.id, tc.hours_per_week, tc.deadline_at, tc.confirmed_at, tc.last_reminded_at
                    into duplicate_commitment
                    from public.team_commitments as tc
                    where tc.team_member_id = duplicate_member.id
                    limit 1;

                    if duplicate_commitment.id is not null then
                        if exists (
                            select 1
                            from public.team_commitments
                            where team_member_id = canonical_member_id
                        ) then
                            update public.team_commitments
                            set hours_per_week = coalesce(public.team_commitments.hours_per_week, duplicate_commitment.hours_per_week),
                                deadline_at = case
                                    when public.team_commitments.deadline_at > duplicate_commitment.deadline_at
                                        then duplicate_commitment.deadline_at
                                    else public.team_commitments.deadline_at
                                end,
                                confirmed_at = coalesce(public.team_commitments.confirmed_at, duplicate_commitment.confirmed_at),
                                last_reminded_at = coalesce(public.team_commitments.last_reminded_at, duplicate_commitment.last_reminded_at),
                                updated_at = now()
                            where team_member_id = canonical_member_id;

                            delete from public.team_commitments
                            where id = duplicate_commitment.id;
                        else
                            update public.team_commitments
                            set team_member_id = canonical_member_id,
                                updated_at = now()
                            where id = duplicate_commitment.id;
                        end if;
                    end if;

                    delete from public.team_members
                    where id = duplicate_member.id;
                end if;
            end loop;

            update public.board_applications
            set team_id = canonical_team_id,
                updated_at = now()
            where team_id = duplicate_team.id;

            update public.team_resources
            set team_id = canonical_team_id
            where team_id = duplicate_team.id;

            update public.team_activity_events
            set team_id = canonical_team_id
            where team_id = duplicate_team.id;

            update public.team_results
            set team_id = canonical_team_id
            where team_id = duplicate_team.id;

            update public.testimonials
            set team_id = canonical_team_id
            where team_id = duplicate_team.id;

            update public.competition_history
            set team_id = canonical_team_id
            where team_id = duplicate_team.id;

            delete from public.teams
            where id = duplicate_team.id;
        end loop;
    end loop;
end;
$$;

insert into public.team_commitments (
    team_member_id,
    hours_per_week,
    deadline_at,
    confirmed_at,
    created_at,
    updated_at
)
select
    tm.id,
    5,
    now() + interval '48 hours',
    case
        when tm.confirmation_status = 'confirmed' then now()
        else null
    end,
    now(),
    now()
from public.team_members as tm
join public.teams as t
    on t.id = tm.team_id
left join public.team_commitments as tc
    on tc.team_member_id = tm.id
where t.board_id is not null
  and tm.role_name <> 'Creator'
  and tc.id is null;

with canonical_teams as (
    select distinct on (board_id)
        board_id,
        id as canonical_team_id
    from public.teams
    where board_id is not null
    order by board_id, created_at asc, id asc
)
update public.board_applications as ba
set team_id = canonical_teams.canonical_team_id,
    updated_at = now()
from canonical_teams
where ba.board_id = canonical_teams.board_id
  and ba.status = 'accepted'
  and ba.team_id is distinct from canonical_teams.canonical_team_id;

create unique index if not exists teams_board_id_unique_idx
    on public.teams (board_id)
    where board_id is not null;
