create table if not exists public.notification_delivery_failures (
    id bigint generated always as identity primary key,
    channel text not null,
    event_type text not null,
    target_user_id uuid not null references public.profiles(id) on delete cascade,
    category text not null,
    error_message text not null,
    payload jsonb not null default '{}'::jsonb,
    attempted_at timestamptz not null default now(),
    constraint notification_delivery_failures_channel_check check (channel in ('server', 'admin')),
    constraint notification_delivery_failures_event_type_check check (char_length(event_type) between 2 and 80),
    constraint notification_delivery_failures_category_check check (char_length(category) between 2 and 40),
    constraint notification_delivery_failures_error_message_check check (char_length(error_message) between 3 and 400)
);

create index if not exists notification_delivery_failures_attempted_at_idx
    on public.notification_delivery_failures (attempted_at desc);

create index if not exists notification_delivery_failures_target_user_idx
    on public.notification_delivery_failures (target_user_id, attempted_at desc);

alter table public.notification_delivery_failures enable row level security;
revoke all on public.notification_delivery_failures from anon, authenticated;
