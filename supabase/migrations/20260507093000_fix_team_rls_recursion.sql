create or replace function public.is_team_creator(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.teams
        where teams.id = target_team_id
          and teams.creator_id = auth.uid()
    );
$$;

create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
    select exists (
        select 1
        from public.team_members
        where team_members.team_id = target_team_id
          and team_members.profile_id = auth.uid()
    );
$$;

drop policy if exists "teams_select_member" on public.teams;
drop policy if exists "teams_manage_creator" on public.teams;
create policy "teams_select_member"
    on public.teams
    for select
    using (
        creator_id = auth.uid()
        or public.is_team_member(id)
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
        or public.is_team_creator(team_id)
    );

create policy "team_members_manage_creator"
    on public.team_members
    for all
    using (public.is_team_creator(team_id))
    with check (public.is_team_creator(team_id));

drop policy if exists "team_commitments_select_member" on public.team_commitments;
drop policy if exists "team_commitments_update_member_creator" on public.team_commitments;
create policy "team_commitments_select_member"
    on public.team_commitments
    for select
    using (
        exists (
            select 1
            from public.team_members
            where team_members.id = team_commitments.team_member_id
              and (
                  team_members.profile_id = auth.uid()
                  or public.is_team_creator(team_members.team_id)
              )
        )
    );

create policy "team_commitments_update_member_creator"
    on public.team_commitments
    for all
    using (
        exists (
            select 1
            from public.team_members
            where team_members.id = team_commitments.team_member_id
              and (
                  team_members.profile_id = auth.uid()
                  or public.is_team_creator(team_members.team_id)
              )
        )
    )
    with check (
        exists (
            select 1
            from public.team_members
            where team_members.id = team_commitments.team_member_id
              and (
                  team_members.profile_id = auth.uid()
                  or public.is_team_creator(team_members.team_id)
              )
        )
    );

drop policy if exists "team_resources_select_member" on public.team_resources;
drop policy if exists "team_resources_manage_creator" on public.team_resources;
create policy "team_resources_select_member"
    on public.team_resources
    for select
    using (
        public.is_team_creator(team_id)
        or public.is_team_member(team_id)
    );

create policy "team_resources_manage_creator"
    on public.team_resources
    for all
    using (public.is_team_creator(team_id))
    with check (public.is_team_creator(team_id));

drop policy if exists "team_activity_events_select_member" on public.team_activity_events;
drop policy if exists "team_activity_events_insert_member" on public.team_activity_events;
create policy "team_activity_events_select_member"
    on public.team_activity_events
    for select
    using (
        public.is_team_creator(team_id)
        or public.is_team_member(team_id)
    );

create policy "team_activity_events_insert_member"
    on public.team_activity_events
    for insert
    with check (
        public.is_team_creator(team_id)
        or public.is_team_member(team_id)
    );

drop policy if exists "team_results_select_member" on public.team_results;
drop policy if exists "team_results_manage_creator" on public.team_results;
create policy "team_results_select_member"
    on public.team_results
    for select
    using (
        public.is_team_creator(team_id)
        or public.is_team_member(team_id)
    );

create policy "team_results_manage_creator"
    on public.team_results
    for all
    using (public.is_team_creator(team_id))
    with check (public.is_team_creator(team_id));
