insert into public.profiles (id)
select distinct boards.user_id
from public.competition_idea_boards as boards
left join public.profiles as profiles
    on profiles.id = boards.user_id
where boards.user_id is not null
  and profiles.id is null;

do $$
declare
    fk_name text;
begin
    for fk_name in
        select constraints.conname
        from pg_constraint as constraints
        join pg_class as tables
            on tables.oid = constraints.conrelid
        join pg_namespace as schemas
            on schemas.oid = tables.relnamespace
        where schemas.nspname = 'public'
          and tables.relname = 'competition_idea_boards'
          and constraints.contype = 'f'
          and array_position(constraints.conkey, (
              select attributes.attnum
              from pg_attribute as attributes
              where attributes.attrelid = tables.oid
                and attributes.attname = 'user_id'
                and attributes.attisdropped = false
          )) is not null
    loop
        execute format(
            'alter table public.competition_idea_boards drop constraint if exists %I',
            fk_name
        );
    end loop;
end $$;

alter table public.competition_idea_boards
    add constraint competition_idea_boards_user_id_profiles_fkey
    foreign key (user_id)
    references public.profiles(id)
    on delete cascade;
