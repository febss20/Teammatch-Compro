create or replace function public.sync_legacy_team_data(target_board_id uuid)
returns table (
    processed_board_id uuid,
    canonical_team_id uuid,
    merged_team_count integer,
    synced_member_count integer,
    relinked_application_count integer,
    created_commitment_count integer
)
language plpgsql
set search_path = public
as $$
declare
    board_row record;
    canonical_team_row record;
    duplicate_team_row record;
    duplicate_member_row record;
    accepted_application_row record;
    duplicate_commitment_row record;
    canonical_member_id uuid;
    ensured_member_id uuid;
    affected_rows integer;
    board_merged_team_count integer;
    board_synced_member_count integer;
    board_relinked_application_count integer;
    board_created_commitment_count integer;
begin
    for board_row in
        select distinct t.board_id
        from public.teams as t
        where t.board_id is not null
          and (target_board_id is null or t.board_id = target_board_id)
    loop
        board_merged_team_count := 0;
        board_synced_member_count := 0;
        board_relinked_application_count := 0;
        board_created_commitment_count := 0;

        select
            t.id,
            t.creator_id,
            t.name,
            t.competition_name,
            t.deadline
        into canonical_team_row
        from public.teams as t
        where t.board_id = board_row.board_id
        order by t.created_at asc, t.id asc
        limit 1;

        if canonical_team_row.id is null then
            continue;
        end if;

        insert into public.team_members (
            team_id,
            profile_id,
            role_name,
            confirmation_status,
            updated_at
        )
        values (
            canonical_team_row.id,
            canonical_team_row.creator_id,
            'Creator',
            'confirmed',
            now()
        )
        on conflict (team_id, profile_id)
        do update
        set
            role_name = 'Creator',
            confirmation_status = 'confirmed',
            updated_at = now();

        for duplicate_team_row in
            select t.id
            from public.teams as t
            where t.board_id = board_row.board_id
              and t.id <> canonical_team_row.id
            order by t.created_at asc, t.id asc
        loop
            board_merged_team_count := board_merged_team_count + 1;

            for duplicate_member_row in
                select tm.id, tm.profile_id, tm.role_name, tm.confirmation_status
                from public.team_members as tm
                where tm.team_id = duplicate_team_row.id
                order by tm.created_at asc, tm.id asc
            loop
                select tm.id
                into canonical_member_id
                from public.team_members as tm
                where tm.team_id = canonical_team_row.id
                  and tm.profile_id = duplicate_member_row.profile_id
                limit 1;

                if canonical_member_id is null then
                    update public.team_members
                    set team_id = canonical_team_row.id,
                        updated_at = now()
                    where id = duplicate_member_row.id;

                    board_synced_member_count := board_synced_member_count + 1;
                else
                    update public.team_members as tm
                    set role_name = case
                            when tm.role_name = 'Creator' then tm.role_name
                            when duplicate_member_row.role_name = 'Creator' then 'Creator'
                            else tm.role_name
                        end,
                        confirmation_status = case
                            when tm.confirmation_status = 'confirmed'
                                or duplicate_member_row.confirmation_status = 'confirmed' then 'confirmed'
                            when tm.confirmation_status = 'expired'
                                or duplicate_member_row.confirmation_status = 'expired' then 'expired'
                            else 'pending'
                        end,
                        updated_at = now()
                    where tm.id = canonical_member_id;

                    select
                        tc.id,
                        tc.hours_per_week,
                        tc.deadline_at,
                        tc.confirmed_at,
                        tc.last_reminded_at
                    into duplicate_commitment_row
                    from public.team_commitments as tc
                    where tc.team_member_id = duplicate_member_row.id
                    limit 1;

                    if duplicate_commitment_row.id is not null then
                        if exists (
                            select 1
                            from public.team_commitments
                            where team_member_id = canonical_member_id
                        ) then
                            update public.team_commitments as tc
                            set hours_per_week = coalesce(tc.hours_per_week, duplicate_commitment_row.hours_per_week),
                                deadline_at = least(tc.deadline_at, duplicate_commitment_row.deadline_at),
                                confirmed_at = coalesce(tc.confirmed_at, duplicate_commitment_row.confirmed_at),
                                last_reminded_at = coalesce(tc.last_reminded_at, duplicate_commitment_row.last_reminded_at),
                                updated_at = now()
                            where tc.team_member_id = canonical_member_id;

                            delete from public.team_commitments
                            where id = duplicate_commitment_row.id;
                        else
                            update public.team_commitments
                            set team_member_id = canonical_member_id,
                                updated_at = now()
                            where id = duplicate_commitment_row.id;
                        end if;
                    end if;

                    delete from public.team_members
                    where id = duplicate_member_row.id;

                    board_synced_member_count := board_synced_member_count + 1;
                end if;
            end loop;

            update public.board_applications
            set team_id = canonical_team_row.id,
                updated_at = now()
            where team_id = duplicate_team_row.id;

            get diagnostics affected_rows = row_count;
            board_relinked_application_count := board_relinked_application_count + affected_rows;

            update public.team_resources
            set team_id = canonical_team_row.id
            where team_id = duplicate_team_row.id;

            update public.team_activity_events
            set team_id = canonical_team_row.id
            where team_id = duplicate_team_row.id;

            update public.team_results
            set team_id = canonical_team_row.id
            where team_id = duplicate_team_row.id;

            update public.testimonials
            set team_id = canonical_team_row.id
            where team_id = duplicate_team_row.id;

            update public.competition_history
            set team_id = canonical_team_row.id
            where team_id = duplicate_team_row.id;

            delete from public.teams
            where id = duplicate_team_row.id;
        end loop;

        for accepted_application_row in
            select
                ba.applicant_id,
                ba.selected_role
            from public.board_applications as ba
            where ba.board_id = board_row.board_id
              and ba.status = 'accepted'
        loop
            insert into public.team_members (
                team_id,
                profile_id,
                role_name,
                confirmation_status,
                updated_at
            )
            values (
                canonical_team_row.id,
                accepted_application_row.applicant_id,
                accepted_application_row.selected_role,
                'pending',
                now()
            )
            on conflict (team_id, profile_id)
            do update
            set
                role_name = excluded.role_name,
                updated_at = now()
            returning id into ensured_member_id;

            if ensured_member_id is null then
                select tm.id
                into ensured_member_id
                from public.team_members as tm
                where tm.team_id = canonical_team_row.id
                  and tm.profile_id = accepted_application_row.applicant_id
                limit 1;
            else
                board_synced_member_count := board_synced_member_count + 1;
            end if;

            insert into public.team_commitments (
                team_member_id,
                hours_per_week,
                deadline_at,
                confirmed_at,
                created_at,
                updated_at
            )
            values (
                ensured_member_id,
                5,
                now() + interval '48 hours',
                null,
                now(),
                now()
            )
            on conflict (team_member_id)
            do nothing;

            get diagnostics affected_rows = row_count;
            board_created_commitment_count := board_created_commitment_count + affected_rows;
        end loop;

        update public.board_applications as ba
        set team_id = canonical_team_row.id,
            updated_at = now()
        where ba.board_id = board_row.board_id
          and ba.status = 'accepted'
          and ba.team_id is distinct from canonical_team_row.id;

        get diagnostics affected_rows = row_count;
        board_relinked_application_count := board_relinked_application_count + affected_rows;

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
        where tm.team_id = canonical_team_row.id
          and tm.role_name <> 'Creator'
          and not exists (
              select 1
              from public.team_commitments as tc
              where tc.team_member_id = tm.id
          );

        get diagnostics affected_rows = row_count;
        board_created_commitment_count := board_created_commitment_count + affected_rows;

        processed_board_id := board_row.board_id;
        canonical_team_id := canonical_team_row.id;
        merged_team_count := board_merged_team_count;
        synced_member_count := board_synced_member_count;
        relinked_application_count := board_relinked_application_count;
        created_commitment_count := board_created_commitment_count;
        return next;
    end loop;
end;
$$;

select *
from public.sync_legacy_team_data(null);
