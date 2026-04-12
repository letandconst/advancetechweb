-- Users management policies and helper function
-- Run in Supabase SQL editor

alter table if exists public.profiles enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_insert_admin" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;

create policy "profiles_select_authenticated"
on public.profiles
for select
to authenticated
using (true);

-- Users can update only their own profile row (avatar, names, etc.)
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
)
with check (
  id = auth.uid()
);

-- Admins can insert new profile rows for invited/created accounts
create policy "profiles_insert_admin"
on public.profiles
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles as p
    where p.id = auth.uid() and p.role = 'admin'
  )
);

create or replace function public.admin_update_user(
  target_user_id uuid,
  new_email text,
  new_username text,
  new_first_name text,
  new_last_name text,
  new_role text
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_role text;
  target_role text;
  updated_row public.profiles;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select role
  into requester_role
  from public.profiles
  where id = auth.uid();

  if requester_role <> 'admin' then
    raise exception 'Only admins can update users';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Use profile settings to update your own account';
  end if;

  select role
  into target_role
  from public.profiles
  where id = target_user_id;

  if target_role is null then
    raise exception 'Target user not found';
  end if;

  if target_role = 'admin' then
    raise exception 'Admin accounts are protected from peer admin updates';
  end if;

  if new_role not in ('admin', 'user') then
    raise exception 'Invalid role value';
  end if;

  update public.profiles
  set
    email = new_email,
    username = new_username,
    first_name = new_first_name,
    last_name = new_last_name,
    role = new_role
  where id = target_user_id
  returning * into updated_row;

  return updated_row;
end;
$$;

create or replace function public.admin_delete_user(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') then
    raise exception 'Only admins can delete users';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Admins cannot delete their own active account';
  end if;

  if exists (
    select 1
    from public.profiles
    where id = target_user_id and role = 'admin'
  ) then
    raise exception 'Admin accounts are protected from peer admin deletion';
  end if;

  delete from auth.users where id = target_user_id;
end;
$$;

grant execute on function public.admin_update_user(uuid, text, text, text, text, text) to authenticated;
grant execute on function public.admin_delete_user(uuid) to authenticated;
