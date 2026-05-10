CREATE EXTENSION IF NOT EXISTS pgcrypto;

DROP FUNCTION IF EXISTS record_team_competition_result(uuid, text, timestamptz, uuid);

CREATE OR REPLACE FUNCTION record_team_competition_result(
    p_team_id uuid,
    p_result_summary text,
    p_competition_ended_at timestamptz,
    p_creator_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
    v_team_name text;
    v_competition_name text;
    member_record record;
    v_error_message text;
begin
    if not exists (
        select 1 from teams 
        where id = p_team_id and creator_id = p_creator_id
    ) then
        raise exception 'Anda tidak memiliki akses untuk mencatat hasil tim ini.';
    end if;

    select name, competition_name into v_team_name, v_competition_name
    from teams
    where id = p_team_id;

    if v_team_name is null then
        raise exception 'Tim tidak ditemukan.';
    end if;

    insert into team_results (
        team_id,
        result_summary,
        competition_ended_at,
        created_at
    ) values (
        p_team_id,
        p_result_summary,
        p_competition_ended_at,
        now()
    );

    for member_record in 
        select profile_id, role_name 
        from team_members 
        where team_id = p_team_id
    loop
        begin
            insert into competition_history (
                profile_id,
                competition_name,
                role_name,
                best_result,
                team_id,
                created_at
            ) values (
                member_record.profile_id,
                coalesce(v_competition_name, v_team_name),
                member_record.role_name,
                p_result_summary,
                p_team_id,
                now()
            );
        exception when others then
            get stacked diagnostics v_error_message = message_text;
            raise warning 'Gagal insert competition history untuk profile %: %', member_record.profile_id, v_error_message;
        end;
    end loop;

    insert into team_activity_events (
        team_id,
        actor_id,
        event_type,
        payload,
        created_at
    ) values (
        p_team_id,
        p_creator_id,
        'competition_result_recorded',
        json_build_object(
            'result_summary', p_result_summary,
            'competition_ended_at', p_competition_ended_at
        ),
        now()
    );

end;
$$;

GRANT EXECUTE ON FUNCTION record_team_competition_result TO authenticated;

-- 4. Refresh table statistics (bukan materialized view)
-- profile_testimonial_summaries adalah regular table, tidak perlu REFRESH

DROP POLICY IF EXISTS "competition_history_manage_own" ON public.competition_history;
CREATE POLICY "competition_history_manage_own"
    ON public.competition_history
    FOR ALL
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Function untuk refresh profile summary yang dipanggil oleh trigger
CREATE OR REPLACE FUNCTION refresh_profile_summary(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
declare
    history_count integer;
    history_best_result text;
    ratings numeric[];
    avg_rating numeric;
    testimonial_count integer;
    v_best_result text;
begin
    -- Ambil competition history count dan best result
    select count(*), max(best_result) into history_count, history_best_result
    from competition_history
    where profile_id = p_profile_id;

    select array_agg(rating) into ratings
    from testimonials
    where target_profile_id = p_profile_id;

    testimonial_count := array_length(ratings, 0);
    
    if testimonial_count > 0 then
        avg_rating := (select sum(rating) / count(rating) from testimonials where target_profile_id = p_profile_id);
    else
        avg_rating := 0;
    end if;

    if history_best_result is not null then
        v_best_result := history_best_result;
    else
        v_best_result := null;
    end if;

    insert into profile_testimonial_summaries (
        profile_id,
        average_rating,
        testimonial_count,
        best_result,
        competitions_count,
        updated_at
    ) values (
        p_profile_id,
        round(avg_rating::numeric, 2),
        testimonial_count,
        v_best_result,
        history_count,
        now()
    )
    on conflict (profile_id) do update set
        average_rating = round(avg_rating::numeric, 2),
        testimonial_count = testimonial_count,
        best_result = v_best_result,
        competitions_count = history_count,
        updated_at = now();
end;
$$;

GRANT EXECUTE ON FUNCTION refresh_profile_summary TO authenticated;

CREATE OR REPLACE FUNCTION update_profile_summary_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        PERFORM refresh_profile_summary(NEW.target_profile_id);
        RETURN COALESCE(NEW, OLD);
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS testimonial_summary_trigger ON testimonials;
CREATE TRIGGER testimonial_summary_trigger
    AFTER INSERT OR UPDATE OR DELETE ON testimonials
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_summary_trigger();