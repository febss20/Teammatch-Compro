create or replace function public.enforce_campus_profile_email_domain()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
    auth_email text;
    auth_email_domain text;
begin
    select lower(email)
    into auth_email
    from auth.users
    where id = new.id;

    if auth_email is null or position('@' in auth_email) = 0 then
        raise exception 'Campus email is required for profile creation'
            using errcode = '23514';
    end if;

    auth_email_domain := split_part(auth_email, '@', 2);

    if auth_email_domain !~ '(^.+\.ac\.id$|^.+\.edu$)' then
        raise exception 'Only campus email profiles are allowed'
            using errcode = '23514';
    end if;

    if new.email_domain is null then
        new.email_domain := auth_email_domain;
    end if;

    if lower(new.email_domain) <> auth_email_domain then
        raise exception 'Profile email domain must match authenticated user email domain'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

drop trigger if exists enforce_campus_profile_email_domain_trigger on public.profiles;

create trigger enforce_campus_profile_email_domain_trigger
    before insert or update of email_domain, id on public.profiles
    for each row
    execute function public.enforce_campus_profile_email_domain();
