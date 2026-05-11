drop policy if exists "team_members_update_self_commitment" on public.team_members;
create policy "team_members_update_self_commitment"
    on public.team_members
    for update
    using (profile_id = auth.uid())
    with check (profile_id = auth.uid());
