-- Private bucket for mechanic profile pictures.
-- Recommended object path format: <mechanic-id>/<timestamp>.<ext>

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'mechanic-avatars',
  'mechanic-avatars',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can view mechanic avatars"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'mechanic-avatars'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can upload mechanic avatars"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'mechanic-avatars'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can update mechanic avatars"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'mechanic-avatars'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'mechanic-avatars'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete mechanic avatars"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'mechanic-avatars'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);
