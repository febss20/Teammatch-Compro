create or replace function public.create_board_with_slots(
    p_user_id uuid,
    p_title text,
    p_summary text,
    p_competition_type text,
    p_description text,
    p_deadline timestamptz,
    p_required_skills text[],
    p_visibility text,
    p_slots jsonb
)
returns table (
    board_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_board_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk membuat board.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk membuat board ini.';
    end if;

    if p_visibility not in ('public', 'private') then
        raise exception 'Visibilitas board tidak valid.';
    end if;

    if p_slots is null then
        raise exception 'Board harus memiliki minimal satu slot.';
    end if;

    if jsonb_typeof(p_slots) <> 'array' then
        raise exception 'Format slot board tidak valid.';
    end if;

    if jsonb_array_length(p_slots) = 0 then
        raise exception 'Board harus memiliki minimal satu slot.';
    end if;

    insert into public.competition_idea_boards (
        user_id,
        title,
        summary,
        competition_type,
        description,
        deadline,
        required_skills,
        status,
        visibility,
        is_draft,
        published_at,
        updated_at
    )
    values (
        p_user_id,
        p_title,
        p_summary,
        p_competition_type,
        p_description,
        p_deadline,
        p_required_skills,
        'open',
        p_visibility,
        false,
        now(),
        now()
    )
    returning id into v_board_id;

    insert into public.board_slots (
        board_id,
        role_name,
        slot_count,
        required_skills
    )
    select
        v_board_id,
        slot_input.role_name,
        slot_input.slot_count,
        coalesce(slot_input.required_skills, '{}'::text[])
    from jsonb_to_recordset(p_slots) as slot_input(
        role_name text,
        slot_count integer,
        required_skills text[]
    );

    delete from public.board_drafts
    where user_id = p_user_id;

    return query select v_board_id;
end;
$$;

create or replace function public.update_board_with_slots(
    p_user_id uuid,
    p_board_id uuid,
    p_title text,
    p_summary text,
    p_competition_type text,
    p_description text,
    p_deadline timestamptz,
    p_required_skills text[],
    p_visibility text,
    p_status text,
    p_slots jsonb
)
returns table (
    board_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_board_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk memperbarui board.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk memperbarui board ini.';
    end if;

    if p_visibility not in ('public', 'private') then
        raise exception 'Visibilitas board tidak valid.';
    end if;

    if p_status not in ('open', 'closed') then
        raise exception 'Status board tidak valid.';
    end if;

    if p_slots is null then
        raise exception 'Board harus memiliki minimal satu slot.';
    end if;

    if jsonb_typeof(p_slots) <> 'array' then
        raise exception 'Format slot board tidak valid.';
    end if;

    if jsonb_array_length(p_slots) = 0 then
        raise exception 'Board harus memiliki minimal satu slot.';
    end if;

    select id
    into v_board_id
    from public.competition_idea_boards
    where id = p_board_id
        and user_id = p_user_id
    for update;

    if not found then
        raise exception 'Board ide tidak ditemukan atau Anda tidak memiliki akses.';
    end if;

    update public.competition_idea_boards
    set
        title = p_title,
        summary = p_summary,
        competition_type = p_competition_type,
        description = p_description,
        deadline = p_deadline,
        required_skills = p_required_skills,
        visibility = p_visibility,
        status = p_status,
        closed_at = case when p_status = 'closed' then now() else null end,
        updated_at = now()
    where id = p_board_id;

    delete from public.board_slots
    where board_id = p_board_id;

    insert into public.board_slots (
        board_id,
        role_name,
        slot_count,
        required_skills
    )
    select
        p_board_id,
        slot_input.role_name,
        slot_input.slot_count,
        coalesce(slot_input.required_skills, '{}'::text[])
    from jsonb_to_recordset(p_slots) as slot_input(
        role_name text,
        slot_count integer,
        required_skills text[]
    );

    return query select v_board_id;
end;
$$;

create or replace function public.replace_profile_step_two(
    p_user_id uuid,
    p_skills uuid[],
    p_custom_skills text[],
    p_competition_types uuid[],
    p_custom_competition_types text[]
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_skill_total integer := coalesce(array_length(p_skills, 1), 0) + coalesce(array_length(p_custom_skills, 1), 0);
    v_competition_total integer := coalesce(array_length(p_competition_types, 1), 0) + coalesce(array_length(p_custom_competition_types, 1), 0);
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk memperbarui profil.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk memperbarui profil ini.';
    end if;

    if v_skill_total < 1 or v_skill_total > 5 then
        raise exception 'Total skill profil harus 1 sampai 5.';
    end if;

    if v_competition_total < 1 or v_competition_total > 5 then
        raise exception 'Total jenis lomba profil harus 1 sampai 5.';
    end if;

    perform 1
    from public.profiles
    where id = p_user_id
    for update;

    if not found then
        raise exception 'Profil tidak ditemukan.';
    end if;

    delete from public.profile_skills
    where profile_id = p_user_id;

    delete from public.profile_competition_preferences
    where profile_id = p_user_id;

    delete from public.profile_custom_skills
    where profile_id = p_user_id;

    delete from public.profile_custom_competition_type
    where profile_id = p_user_id;

    insert into public.profile_skills (profile_id, skill_id)
    select
        p_user_id,
        distinct_skill.skill_id
    from (
        select distinct unnest(coalesce(p_skills, '{}'::uuid[])) as skill_id
    ) as distinct_skill
    where distinct_skill.skill_id is not null;

    insert into public.profile_custom_skills (profile_id, label, normalized_label)
    select
        p_user_id,
        custom_skill.label,
        custom_skill.normalized_label
    from (
        select distinct on (prepared_skill.normalized_label)
            prepared_skill.label,
            prepared_skill.normalized_label
        from (
            select
                btrim(raw_skill.value) as label,
                lower(regexp_replace(btrim(raw_skill.value), '\s+', ' ', 'g')) as normalized_label,
                raw_skill.ordinality
            from unnest(coalesce(p_custom_skills, '{}'::text[])) with ordinality as raw_skill(value, ordinality)
        ) as prepared_skill
        where prepared_skill.label <> ''
        order by prepared_skill.normalized_label, prepared_skill.ordinality
    ) as custom_skill
    where custom_skill.label <> '';

    insert into public.profile_competition_preferences (profile_id, competition_type_id)
    select
        p_user_id,
        distinct_competition.competition_type_id
    from (
        select distinct unnest(coalesce(p_competition_types, '{}'::uuid[])) as competition_type_id
    ) as distinct_competition
    where distinct_competition.competition_type_id is not null;

    insert into public.profile_custom_competition_type (profile_id, label, normalized_label)
    select
        p_user_id,
        custom_competition.label,
        custom_competition.normalized_label
    from (
        select distinct on (prepared_competition.normalized_label)
            prepared_competition.label,
            prepared_competition.normalized_label
        from (
            select
                btrim(raw_competition.value) as label,
                lower(regexp_replace(btrim(raw_competition.value), '\s+', ' ', 'g')) as normalized_label,
                raw_competition.ordinality
            from unnest(coalesce(p_custom_competition_types, '{}'::text[])) with ordinality as raw_competition(value, ordinality)
        ) as prepared_competition
        where prepared_competition.label <> ''
        order by prepared_competition.normalized_label, prepared_competition.ordinality
    ) as custom_competition
    where custom_competition.label <> '';
end;
$$;

create or replace function public.save_profile_step_three_atomic(
    p_user_id uuid,
    p_available_months text[],
    p_hours_per_week integer,
    p_public_visibility boolean,
    p_show_competition_history boolean,
    p_complete_profile boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_current_profile record;
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk memperbarui profil.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk memperbarui profil ini.';
    end if;

    select
        id,
        public_visibility,
        show_competition_history
    into v_current_profile
    from public.profiles
    where id = p_user_id
    for update;

    if not found then
        raise exception 'Profil tidak ditemukan.';
    end if;

    insert into public.profile_availability (
        profile_id,
        available_months,
        hours_per_week,
        updated_at
    )
    values (
        p_user_id,
        p_available_months,
        p_hours_per_week,
        now()
    )
    on conflict (profile_id) do update
    set
        available_months = excluded.available_months,
        hours_per_week = excluded.hours_per_week,
        updated_at = now();

    update public.profiles
    set
        public_visibility = p_public_visibility,
        show_competition_history = p_show_competition_history,
        profile_completed_at = case when p_complete_profile then now() else profile_completed_at end,
        updated_at = now()
    where id = p_user_id;

    insert into public.notification_preferences (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;

    if
        v_current_profile.public_visibility <> p_public_visibility
        or v_current_profile.show_competition_history <> p_show_competition_history
    then
        insert into public.privacy_audit_events (
            user_id,
            event_type,
            payload
        )
        values (
            p_user_id,
            'profile_privacy_updated',
            jsonb_build_object(
                'public_visibility',
                case when p_public_visibility then 'public' else 'private' end,
                'show_competition_history',
                p_show_competition_history,
                'completed_profile',
                p_complete_profile
            )
        );
    end if;
end;
$$;

create or replace function public.update_profile_atomic(
    p_user_id uuid,
    p_full_name text,
    p_campus_name text,
    p_username text,
    p_bio text,
    p_skills uuid[],
    p_custom_skills text[],
    p_competition_types uuid[],
    p_custom_competition_types text[],
    p_available_months text[],
    p_hours_per_week integer,
    p_public_visibility boolean,
    p_show_competition_history boolean,
    p_complete_profile boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_current_profile record;
    v_skill_total integer := coalesce(array_length(p_skills, 1), 0) + coalesce(array_length(p_custom_skills, 1), 0);
    v_competition_total integer := coalesce(array_length(p_competition_types, 1), 0) + coalesce(array_length(p_custom_competition_types, 1), 0);
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk memperbarui profil.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk memperbarui profil ini.';
    end if;

    if v_skill_total < 1 or v_skill_total > 5 then
        raise exception 'Total skill profil harus 1 sampai 5.';
    end if;

    if v_competition_total < 1 or v_competition_total > 5 then
        raise exception 'Total jenis lomba profil harus 1 sampai 5.';
    end if;

    select
        id,
        public_visibility,
        show_competition_history
    into v_current_profile
    from public.profiles
    where id = p_user_id
    for update;

    if not found then
        raise exception 'Profil tidak ditemukan.';
    end if;

    update public.profiles
    set
        full_name = p_full_name,
        campus_name = p_campus_name,
        username = p_username,
        bio = p_bio,
        public_visibility = p_public_visibility,
        show_competition_history = p_show_competition_history,
        profile_completed_at = case when p_complete_profile then now() else profile_completed_at end,
        updated_at = now()
    where id = p_user_id;

    delete from public.profile_skills
    where profile_id = p_user_id;

    delete from public.profile_competition_preferences
    where profile_id = p_user_id;

    delete from public.profile_custom_skills
    where profile_id = p_user_id;

    delete from public.profile_custom_competition_type
    where profile_id = p_user_id;

    insert into public.profile_skills (profile_id, skill_id)
    select
        p_user_id,
        distinct_skill.skill_id
    from (
        select distinct unnest(coalesce(p_skills, '{}'::uuid[])) as skill_id
    ) as distinct_skill
    where distinct_skill.skill_id is not null;

    insert into public.profile_custom_skills (profile_id, label, normalized_label)
    select
        p_user_id,
        custom_skill.label,
        custom_skill.normalized_label
    from (
        select distinct on (prepared_skill.normalized_label)
            prepared_skill.label,
            prepared_skill.normalized_label
        from (
            select
                btrim(raw_skill.value) as label,
                lower(regexp_replace(btrim(raw_skill.value), '\s+', ' ', 'g')) as normalized_label,
                raw_skill.ordinality
            from unnest(coalesce(p_custom_skills, '{}'::text[])) with ordinality as raw_skill(value, ordinality)
        ) as prepared_skill
        where prepared_skill.label <> ''
        order by prepared_skill.normalized_label, prepared_skill.ordinality
    ) as custom_skill
    where custom_skill.label <> '';

    insert into public.profile_competition_preferences (profile_id, competition_type_id)
    select
        p_user_id,
        distinct_competition.competition_type_id
    from (
        select distinct unnest(coalesce(p_competition_types, '{}'::uuid[])) as competition_type_id
    ) as distinct_competition
    where distinct_competition.competition_type_id is not null;

    insert into public.profile_custom_competition_type (profile_id, label, normalized_label)
    select
        p_user_id,
        custom_competition.label,
        custom_competition.normalized_label
    from (
        select distinct on (prepared_competition.normalized_label)
            prepared_competition.label,
            prepared_competition.normalized_label
        from (
            select
                btrim(raw_competition.value) as label,
                lower(regexp_replace(btrim(raw_competition.value), '\s+', ' ', 'g')) as normalized_label,
                raw_competition.ordinality
            from unnest(coalesce(p_custom_competition_types, '{}'::text[])) with ordinality as raw_competition(value, ordinality)
        ) as prepared_competition
        where prepared_competition.label <> ''
        order by prepared_competition.normalized_label, prepared_competition.ordinality
    ) as custom_competition
    where custom_competition.label <> '';

    insert into public.profile_availability (
        profile_id,
        available_months,
        hours_per_week,
        updated_at
    )
    values (
        p_user_id,
        p_available_months,
        p_hours_per_week,
        now()
    )
    on conflict (profile_id) do update
    set
        available_months = excluded.available_months,
        hours_per_week = excluded.hours_per_week,
        updated_at = now();

    insert into public.notification_preferences (user_id)
    values (p_user_id)
    on conflict (user_id) do nothing;

    if
        v_current_profile.public_visibility <> p_public_visibility
        or v_current_profile.show_competition_history <> p_show_competition_history
    then
        insert into public.privacy_audit_events (
            user_id,
            event_type,
            payload
        )
        values (
            p_user_id,
            'profile_privacy_updated',
            jsonb_build_object(
                'public_visibility',
                case when p_public_visibility then 'public' else 'private' end,
                'show_competition_history',
                p_show_competition_history,
                'completed_profile',
                p_complete_profile
            )
        );
    end if;
end;
$$;

create or replace function public.update_settings_atomic(
    p_user_id uuid,
    p_public_visibility boolean,
    p_show_competition_history boolean,
    p_request_updates boolean,
    p_board_updates boolean,
    p_commitment_updates boolean,
    p_reminder_updates boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk memperbarui pengaturan.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk memperbarui pengaturan ini.';
    end if;

    perform 1
    from public.profiles
    where id = p_user_id
    for update;

    if not found then
        raise exception 'Profil tidak ditemukan.';
    end if;

    update public.profiles
    set
        public_visibility = p_public_visibility,
        show_competition_history = p_show_competition_history,
        updated_at = now()
    where id = p_user_id;

    insert into public.notification_preferences (
        user_id,
        request_updates,
        board_updates,
        commitment_updates,
        reminder_updates,
        updated_at
    )
    values (
        p_user_id,
        p_request_updates,
        p_board_updates,
        p_commitment_updates,
        p_reminder_updates,
        now()
    )
    on conflict (user_id) do update
    set
        request_updates = excluded.request_updates,
        board_updates = excluded.board_updates,
        commitment_updates = excluded.commitment_updates,
        reminder_updates = excluded.reminder_updates,
        updated_at = now();

    insert into public.privacy_audit_events (
        user_id,
        event_type,
        payload
    )
    values (
        p_user_id,
        'settings_updated',
        jsonb_build_object(
            'public_visibility',
            case when p_public_visibility then 'public' else 'private' end,
            'show_competition_history',
            p_show_competition_history,
            'request_updates',
            p_request_updates,
            'board_updates',
            p_board_updates,
            'commitment_updates',
            p_commitment_updates,
            'reminder_updates',
            p_reminder_updates
        )
    );
end;
$$;

revoke all on function public.create_board_with_slots(uuid, text, text, text, text, timestamptz, text[], text, jsonb) from public;
grant execute on function public.create_board_with_slots(uuid, text, text, text, text, timestamptz, text[], text, jsonb) to authenticated;

revoke all on function public.update_board_with_slots(uuid, uuid, text, text, text, text, timestamptz, text[], text, text, jsonb) from public;
grant execute on function public.update_board_with_slots(uuid, uuid, text, text, text, text, timestamptz, text[], text, text, jsonb) to authenticated;

revoke all on function public.replace_profile_step_two(uuid, uuid[], text[], uuid[], text[]) from public;
grant execute on function public.replace_profile_step_two(uuid, uuid[], text[], uuid[], text[]) to authenticated;

revoke all on function public.save_profile_step_three_atomic(uuid, text[], integer, boolean, boolean, boolean) from public;
grant execute on function public.save_profile_step_three_atomic(uuid, text[], integer, boolean, boolean, boolean) to authenticated;

revoke all on function public.update_profile_atomic(uuid, text, text, text, text, uuid[], text[], uuid[], text[], text[], integer, boolean, boolean, boolean) from public;
grant execute on function public.update_profile_atomic(uuid, text, text, text, text, uuid[], text[], uuid[], text[], text[], integer, boolean, boolean, boolean) to authenticated;

revoke all on function public.update_settings_atomic(uuid, boolean, boolean, boolean, boolean, boolean, boolean) from public;
grant execute on function public.update_settings_atomic(uuid, boolean, boolean, boolean, boolean, boolean, boolean) to authenticated;
