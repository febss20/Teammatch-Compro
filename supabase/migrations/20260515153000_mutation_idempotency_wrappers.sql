alter table public.competition_idea_boards
    add column if not exists creation_request_id text;

create unique index if not exists competition_idea_boards_creation_request_id_idx
    on public.competition_idea_boards (user_id, creation_request_id)
    where creation_request_id is not null;

create or replace function public.create_board_with_slots_idempotent(
    p_user_id uuid,
    p_title text,
    p_summary text,
    p_competition_type text,
    p_description text,
    p_deadline timestamptz,
    p_required_skills text[],
    p_visibility text,
    p_slots jsonb,
    p_idempotency_key text
)
returns table (
    board_id uuid,
    was_replayed boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_existing_board_id uuid;
    v_inserted integer;
    v_trimmed_idempotency_key text := trim(coalesce(p_idempotency_key, ''));
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk membuat board.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk membuat board ini.';
    end if;

    if char_length(v_trimmed_idempotency_key) < 8 then
        raise exception 'Kunci idempotensi board tidak valid.';
    end if;

    insert into public.mutation_idempotency_keys (user_id, scope, idempotency_key)
    values (p_user_id, 'create_board_with_slots', v_trimmed_idempotency_key)
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted = 0 then
        select id
        into v_existing_board_id
        from public.competition_idea_boards
        where user_id = p_user_id
            and creation_request_id = v_trimmed_idempotency_key
        order by created_at desc
        limit 1;

        if v_existing_board_id is null then
            raise exception 'Permintaan pembuatan board ini sudah pernah diproses tetapi hasilnya tidak ditemukan.';
        end if;

        return query
        select
            v_existing_board_id,
            true;
        return;
    end if;

    select created.board_id
    into v_existing_board_id
    from public.create_board_with_slots(
        p_user_id,
        p_title,
        p_summary,
        p_competition_type,
        p_description,
        p_deadline,
        p_required_skills,
        p_visibility,
        p_slots
    ) as created
    limit 1;

    if v_existing_board_id is null then
        raise exception 'Board ide tidak berhasil dibuat.';
    end if;

    update public.competition_idea_boards
    set
        creation_request_id = v_trimmed_idempotency_key,
        updated_at = now()
    where id = v_existing_board_id;

    return query
    select
        v_existing_board_id,
        false;
end;
$$;

create or replace function public.update_board_with_slots_idempotent(
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
    p_slots jsonb,
    p_idempotency_key text
)
returns table (
    board_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
    v_inserted integer;
    v_scope text := format('update_board_with_slots:%s', p_board_id::text);
    v_trimmed_idempotency_key text := trim(coalesce(p_idempotency_key, ''));
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk memperbarui board.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk memperbarui board ini.';
    end if;

    if char_length(v_trimmed_idempotency_key) < 8 then
        raise exception 'Kunci idempotensi board tidak valid.';
    end if;

    insert into public.mutation_idempotency_keys (user_id, scope, idempotency_key)
    values (p_user_id, v_scope, v_trimmed_idempotency_key)
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted = 0 then
        return query
        select p_board_id;
        return;
    end if;

    return query
    select updated.board_id
    from public.update_board_with_slots(
        p_user_id,
        p_board_id,
        p_title,
        p_summary,
        p_competition_type,
        p_description,
        p_deadline,
        p_required_skills,
        p_visibility,
        p_status,
        p_slots
    ) as updated;
end;
$$;

create or replace function public.replace_profile_step_two_idempotent(
    p_user_id uuid,
    p_skills uuid[],
    p_custom_skills text[],
    p_competition_types uuid[],
    p_custom_competition_types text[],
    p_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_inserted integer;
    v_trimmed_idempotency_key text := trim(coalesce(p_idempotency_key, ''));
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk memperbarui profil.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk memperbarui profil ini.';
    end if;

    if char_length(v_trimmed_idempotency_key) < 8 then
        raise exception 'Kunci idempotensi profil tidak valid.';
    end if;

    insert into public.mutation_idempotency_keys (user_id, scope, idempotency_key)
    values (p_user_id, 'replace_profile_step_two', v_trimmed_idempotency_key)
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted = 0 then
        return;
    end if;

    perform public.replace_profile_step_two(
        p_user_id,
        p_skills,
        p_custom_skills,
        p_competition_types,
        p_custom_competition_types
    );
end;
$$;

create or replace function public.save_profile_step_three_atomic_idempotent(
    p_user_id uuid,
    p_available_months text[],
    p_hours_per_week integer,
    p_public_visibility boolean,
    p_show_competition_history boolean,
    p_complete_profile boolean,
    p_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_inserted integer;
    v_trimmed_idempotency_key text := trim(coalesce(p_idempotency_key, ''));
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk memperbarui profil.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk memperbarui profil ini.';
    end if;

    if char_length(v_trimmed_idempotency_key) < 8 then
        raise exception 'Kunci idempotensi profil tidak valid.';
    end if;

    insert into public.mutation_idempotency_keys (user_id, scope, idempotency_key)
    values (p_user_id, 'save_profile_step_three_atomic', v_trimmed_idempotency_key)
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted = 0 then
        return;
    end if;

    perform public.save_profile_step_three_atomic(
        p_user_id,
        p_available_months,
        p_hours_per_week,
        p_public_visibility,
        p_show_competition_history,
        p_complete_profile
    );
end;
$$;

create or replace function public.update_profile_atomic_idempotent(
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
    p_complete_profile boolean,
    p_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_inserted integer;
    v_trimmed_idempotency_key text := trim(coalesce(p_idempotency_key, ''));
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk memperbarui profil.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk memperbarui profil ini.';
    end if;

    if char_length(v_trimmed_idempotency_key) < 8 then
        raise exception 'Kunci idempotensi profil tidak valid.';
    end if;

    insert into public.mutation_idempotency_keys (user_id, scope, idempotency_key)
    values (p_user_id, 'update_profile_atomic', v_trimmed_idempotency_key)
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted = 0 then
        return;
    end if;

    perform public.update_profile_atomic(
        p_user_id,
        p_full_name,
        p_campus_name,
        p_username,
        p_bio,
        p_skills,
        p_custom_skills,
        p_competition_types,
        p_custom_competition_types,
        p_available_months,
        p_hours_per_week,
        p_public_visibility,
        p_show_competition_history,
        p_complete_profile
    );
end;
$$;

create or replace function public.update_settings_atomic_idempotent(
    p_user_id uuid,
    p_public_visibility boolean,
    p_show_competition_history boolean,
    p_request_updates boolean,
    p_board_updates boolean,
    p_commitment_updates boolean,
    p_reminder_updates boolean,
    p_idempotency_key text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    v_inserted integer;
    v_trimmed_idempotency_key text := trim(coalesce(p_idempotency_key, ''));
begin
    if auth.uid() is null then
        raise exception 'Anda harus login untuk memperbarui pengaturan.';
    end if;

    if auth.uid() <> p_user_id then
        raise exception 'Anda tidak memiliki akses untuk memperbarui pengaturan ini.';
    end if;

    if char_length(v_trimmed_idempotency_key) < 8 then
        raise exception 'Kunci idempotensi pengaturan tidak valid.';
    end if;

    insert into public.mutation_idempotency_keys (user_id, scope, idempotency_key)
    values (p_user_id, 'update_settings_atomic', v_trimmed_idempotency_key)
    on conflict do nothing;

    get diagnostics v_inserted = row_count;

    if v_inserted = 0 then
        return;
    end if;

    perform public.update_settings_atomic(
        p_user_id,
        p_public_visibility,
        p_show_competition_history,
        p_request_updates,
        p_board_updates,
        p_commitment_updates,
        p_reminder_updates
    );
end;
$$;

revoke all on function public.create_board_with_slots_idempotent(uuid, text, text, text, text, timestamptz, text[], text, jsonb, text) from public, anon;
grant execute on function public.create_board_with_slots_idempotent(uuid, text, text, text, text, timestamptz, text[], text, jsonb, text) to authenticated, service_role;

revoke all on function public.update_board_with_slots_idempotent(uuid, uuid, text, text, text, text, timestamptz, text[], text, text, jsonb, text) from public, anon;
grant execute on function public.update_board_with_slots_idempotent(uuid, uuid, text, text, text, text, timestamptz, text[], text, text, jsonb, text) to authenticated, service_role;

revoke all on function public.replace_profile_step_two_idempotent(uuid, uuid[], text[], uuid[], text[], text) from public, anon;
grant execute on function public.replace_profile_step_two_idempotent(uuid, uuid[], text[], uuid[], text[], text) to authenticated, service_role;

revoke all on function public.save_profile_step_three_atomic_idempotent(uuid, text[], integer, boolean, boolean, boolean, text) from public, anon;
grant execute on function public.save_profile_step_three_atomic_idempotent(uuid, text[], integer, boolean, boolean, boolean, text) to authenticated, service_role;

revoke all on function public.update_profile_atomic_idempotent(uuid, text, text, text, text, uuid[], text[], uuid[], text[], text[], integer, boolean, boolean, boolean, text) from public, anon;
grant execute on function public.update_profile_atomic_idempotent(uuid, text, text, text, text, uuid[], text[], uuid[], text[], text[], integer, boolean, boolean, boolean, text) to authenticated, service_role;

revoke all on function public.update_settings_atomic_idempotent(uuid, boolean, boolean, boolean, boolean, boolean, boolean, text) from public, anon;
grant execute on function public.update_settings_atomic_idempotent(uuid, boolean, boolean, boolean, boolean, boolean, boolean, text) to authenticated, service_role;
