alter table public.profiles
    add column if not exists email_domain text,
    add column if not exists oauth_avatar_url text,
    add column if not exists manual_avatar_path text,
    add column if not exists avatar_source text not null default 'none',
    add column if not exists avatar_updated_at timestamptz;

alter table public.profiles
    drop constraint if exists profiles_email_domain_check,
    drop constraint if exists profiles_avatar_source_check,
    drop constraint if exists profiles_oauth_avatar_url_check,
    drop constraint if exists profiles_manual_avatar_path_check;

alter table public.profiles
    add constraint profiles_email_domain_check
        check (email_domain is null or email_domain ~* '(^.+\.ac\.id$|^.+\.edu$)'),
    add constraint profiles_avatar_source_check
        check (avatar_source in ('none', 'oauth', 'manual')),
    add constraint profiles_oauth_avatar_url_check
        check (oauth_avatar_url is null or (oauth_avatar_url ~* '^https://' and char_length(oauth_avatar_url) <= 500)),
    add constraint profiles_manual_avatar_path_check
        check (manual_avatar_path is null or (manual_avatar_path !~ '\.\.' and char_length(manual_avatar_path) <= 220));

create index if not exists profiles_email_domain_idx
    on public.profiles (lower(email_domain))
    where email_domain is not null;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'profile-avatars',
    'profile-avatars',
    true,
    1048576,
    array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
    public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "avatar_select_public" on storage.objects;
drop policy if exists "avatar_insert_own_folder" on storage.objects;
drop policy if exists "avatar_update_own_folder" on storage.objects;
drop policy if exists "avatar_delete_own_folder" on storage.objects;

create policy "avatar_select_public"
    on storage.objects
    for select
    using (bucket_id = 'profile-avatars');

create policy "avatar_insert_own_folder"
    on storage.objects
    for insert
    with check (
        bucket_id = 'profile-avatars'
        and auth.role() = 'authenticated'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "avatar_update_own_folder"
    on storage.objects
    for update
    using (
        bucket_id = 'profile-avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
        bucket_id = 'profile-avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

create policy "avatar_delete_own_folder"
    on storage.objects
    for delete
    using (
        bucket_id = 'profile-avatars'
        and auth.uid()::text = (storage.foldername(name))[1]
    );
