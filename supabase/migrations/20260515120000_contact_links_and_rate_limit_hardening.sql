create table if not exists public.contact_messages (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null,
    message text not null,
    created_at timestamptz not null default now(),
    constraint contact_messages_name_length_check check (char_length(btrim(name)) between 2 and 100),
    constraint contact_messages_email_length_check check (char_length(btrim(email)) between 3 and 320),
    constraint contact_messages_message_length_check check (char_length(btrim(message)) between 10 and 2000)
);

alter table public.contact_messages enable row level security;
revoke all on public.contact_messages from public;
revoke all on public.contact_messages from anon, authenticated;
grant insert on public.contact_messages to service_role;

update public.team_resources
set url = null
where url is not null
  and (
      btrim(url) = ''
      or url !~* '^https://[^[:space:]]+$'
  );

alter table public.team_resources
    drop constraint if exists team_resources_url_https_check;

alter table public.team_resources
    add constraint team_resources_url_https_check
    check (
        url is null
        or url ~* '^https://[^[:space:]]+$'
    );

update public.user_notifications
set link_path = null
where link_path is not null
  and (
      (
          link_path <> '/dashboard'
          and link_path not like '/dashboard/%'
          and link_path not like '/dashboard?%'
          and link_path not like '/dashboard#%'
      )
      or link_path ~ '^//'
      or position('://' in link_path) > 0
  );

alter table public.user_notifications
    drop constraint if exists user_notifications_dashboard_link_path_check;

alter table public.user_notifications
    add constraint user_notifications_dashboard_link_path_check
    check (
        link_path is null
        or (
            (
                link_path = '/dashboard'
                or link_path like '/dashboard/%'
                or link_path like '/dashboard?%'
                or link_path like '/dashboard#%'
            )
            and link_path !~ '^//'
            and position('://' in link_path) = 0
        )
    );

revoke all on function public.consume_rate_limit(text, text, integer, integer) from public;
revoke all on function public.consume_rate_limit(text, text, integer, integer) from anon, authenticated;
grant execute on function public.consume_rate_limit(text, text, integer, integer) to service_role;
