DROP POLICY IF EXISTS "profile_testimonial_summaries_manage_own" ON public.profile_testimonial_summaries;
DROP POLICY IF EXISTS "profile_testimonial_summaries_select_own" ON public.profile_testimonial_summaries;

CREATE POLICY "profile_testimonial_summaries_function_access"
    ON public.profile_testimonial_summaries
    FOR ALL
    USING (
        pg_has_role(session_user, 'service_role') OR
        auth.uid() = profile_id
    )
    WITH CHECK (
        pg_has_role(session_user, 'service_role') OR
        auth.uid() = profile_id
    );

ALTER TABLE public.profile_testimonial_summaries ENABLE ROW LEVEL SECURITY;

GRANT ALL ON public.profile_testimonial_summaries TO service_role;
GRANT SELECT ON public.profile_testimonial_summaries TO authenticated;
GRANT INSERT ON public.profile_testimonial_summaries TO authenticated;
GRANT UPDATE ON public.profile_testimonial_summaries TO authenticated;

DROP FUNCTION IF EXISTS refresh_profile_summary CASCADE;

CREATE OR REPLACE FUNCTION refresh_profile_summary(p_profile_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
    history_count integer;
    history_best_result text;
    v_avg_rating numeric;
    v_testimonial_count integer;
    v_best_result text;
    v_profile_exists boolean;
begin
    SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_profile_id) INTO v_profile_exists;
    
    IF NOT v_profile_exists THEN
        RAISE WARNING 'Profile % tidak ditemukan', p_profile_id;
        RETURN;
    END IF;

    select count(*), max(best_result) into history_count, history_best_result
    from competition_history
    where profile_id = p_profile_id;

    select count(*), avg(rating) into v_testimonial_count, v_avg_rating
    from testimonials
    where target_profile_id = p_profile_id;

    IF v_testimonial_count = 0 THEN
        v_avg_rating := 0;
    ELSE
        v_avg_rating := round(v_avg_rating::numeric, 2);
    END IF;

    v_best_result := history_best_result; 

    insert into profile_testimonial_summaries (
        profile_id,
        average_rating,
        testimonial_count,
        best_result,
        competitions_count,
        updated_at
    ) values (
        p_profile_id,
        COALESCE(v_avg_rating, 0), 
        COALESCE(v_testimonial_count, 0), 
        v_best_result, 
        COALESCE(history_count, 0), 
        now()
    )
    on conflict (profile_id) do update set
        average_rating = COALESCE(v_avg_rating, 0),
        testimonial_count = COALESCE(v_testimonial_count, 0),
        best_result = v_best_result,
        competitions_count = COALESCE(history_count, 0),
        updated_at = now();
end;
$$;

GRANT EXECUTE ON FUNCTION refresh_profile_summary TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_profile_summary TO service_role;
