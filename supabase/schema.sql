-- =====================================================================================
-- AkademAI · Course Materials ("Dərs Materialları") — Supabase schema
-- Run this whole file once in: Supabase Dashboard → SQL Editor → New query → Run.
-- It is idempotent (safe to run again). It creates:
--   · catalog tables: faculties, departments, study_groups, subjects
--   · profiles (role: student | teacher | admin) linked to Supabase Auth
--   · materials + material_groups (file metadata)
--   · a PRIVATE Storage bucket "course-materials"
--   · Row Level Security (RLS) policies for tables and Storage
--   · a small catalog seed (faculty, departments, groups, subjects)
-- =====================================================================================

create extension if not exists pgcrypto;

-- ---------- catalog ------------------------------------------------------------------
create table if not exists public.faculties (
  id   uuid primary key default gen_random_uuid(),
  name text not null unique
);
create table if not exists public.departments (
  id         uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculties(id) on delete cascade,
  name       text not null,
  unique (faculty_id, name)
);
create table if not exists public.study_groups (
  id         uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references public.faculties(id) on delete cascade,
  name       text not null,
  unique (faculty_id, name)
);
create table if not exists public.subjects (
  id            uuid primary key default gen_random_uuid(),
  department_id uuid not null references public.departments(id) on delete cascade,
  name          text not null,
  code          text,
  unique (department_id, name)
);

-- ---------- profiles (one row per auth user) -----------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text not null default '',
  role           text not null default 'student' check (role in ('student', 'teacher', 'admin')),
  study_group_id uuid references public.study_groups(id) on delete set null,
  created_at     timestamptz not null default now()
);

-- Role of the signed-in user. SECURITY DEFINER so that policies can call it without recursion.
create or replace function public.current_user_role()
returns text language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

-- New sign-ups always become students. The role is NEVER read from client-supplied metadata.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Only an administrator (or SQL run in the dashboard, where auth.uid() is null) may change a role.
create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null and coalesce(public.current_user_role(), '') <> 'admin' then
    raise exception 'Only an administrator can change roles';
  end if;
  return new;
end $$;
drop trigger if exists guard_profile_role on public.profiles;
create trigger guard_profile_role before update on public.profiles for each row execute function public.guard_profile_role();

-- ---------- materials ----------------------------------------------------------------
create table if not exists public.materials (
  id            uuid primary key default gen_random_uuid(),
  title         text not null check (char_length(trim(title)) between 1 and 200),
  description   text not null default '' check (char_length(description) <= 2000),
  category      text not null default 'other' check (category in ('syllabus', 'lecture', 'presentation', 'seminar', 'exam_prep', 'other')),
  subject_id    uuid not null references public.subjects(id) on delete restrict,
  academic_year text not null check (academic_year ~ '^[0-9]{4}/[0-9]{4}$'),
  teacher_id    uuid not null references public.profiles(id) on delete restrict,
  file_path     text not null unique,            -- object key inside the "course-materials" bucket
  file_name     text not null,
  file_ext      text not null default '',
  file_size     bigint not null default 0,
  mime_type     text not null default '',
  is_sample     boolean not null default false,  -- true for the demo files
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists materials_subject_idx on public.materials(subject_id);
create index if not exists materials_teacher_idx on public.materials(teacher_id);
create index if not exists materials_year_idx    on public.materials(academic_year);

create table if not exists public.material_groups (
  material_id uuid not null references public.materials(id) on delete cascade,
  group_id    uuid not null references public.study_groups(id) on delete cascade,
  primary key (material_id, group_id)
);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists materials_touch on public.materials;
create trigger materials_touch before update on public.materials for each row execute function public.touch_updated_at();

-- ---------- Row Level Security -------------------------------------------------------
alter table public.faculties        enable row level security;
alter table public.departments      enable row level security;
alter table public.study_groups     enable row level security;
alter table public.subjects         enable row level security;
alter table public.profiles         enable row level security;
alter table public.materials        enable row level security;
alter table public.material_groups  enable row level security;

revoke all on public.faculties, public.departments, public.study_groups, public.subjects, public.profiles, public.materials, public.material_groups from anon;

-- Catalog: everyone signed in can read; only administrators can change it.
do $$
declare t text;
begin
  foreach t in array array['faculties', 'departments', 'study_groups', 'subjects'] loop
    execute format('drop policy if exists "%1$s read" on public.%1$s', t);
    execute format('drop policy if exists "%1$s admin write" on public.%1$s', t);
    execute format('create policy "%1$s read" on public.%1$s for select to authenticated using (true)', t);
    execute format('create policy "%1$s admin write" on public.%1$s for all to authenticated using (public.current_user_role() = ''admin'') with check (public.current_user_role() = ''admin'')', t);
  end loop;
end $$;

-- Profiles: signed-in users can read names/roles (needed to show the teacher); each user edits only their own row;
-- the trigger above stops anyone but an administrator from changing a role.
drop policy if exists "profiles read" on public.profiles;
drop policy if exists "profiles update own" on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;
create policy "profiles read"         on public.profiles for select to authenticated using (true);
create policy "profiles update own"   on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles admin update" on public.profiles for update to authenticated using (public.current_user_role() = 'admin') with check (true);

-- Materials: every signed-in user can read; teachers manage their own; administrators manage all.
drop policy if exists "materials read"   on public.materials;
drop policy if exists "materials insert" on public.materials;
drop policy if exists "materials update" on public.materials;
drop policy if exists "materials delete" on public.materials;
create policy "materials read" on public.materials for select to authenticated using (true);
create policy "materials insert" on public.materials for insert to authenticated
  with check (public.current_user_role() = 'admin' or (public.current_user_role() = 'teacher' and teacher_id = auth.uid()));
create policy "materials update" on public.materials for update to authenticated
  using (public.current_user_role() = 'admin' or (public.current_user_role() = 'teacher' and teacher_id = auth.uid()))
  with check (public.current_user_role() = 'admin' or (public.current_user_role() = 'teacher' and teacher_id = auth.uid()));
create policy "materials delete" on public.materials for delete to authenticated
  using (public.current_user_role() = 'admin' or (public.current_user_role() = 'teacher' and teacher_id = auth.uid()));

drop policy if exists "material_groups read"  on public.material_groups;
drop policy if exists "material_groups write" on public.material_groups;
create policy "material_groups read" on public.material_groups for select to authenticated using (true);
create policy "material_groups write" on public.material_groups for all to authenticated
  using (exists (select 1 from public.materials m where m.id = material_id
                 and (public.current_user_role() = 'admin' or (public.current_user_role() = 'teacher' and m.teacher_id = auth.uid()))))
  with check (exists (select 1 from public.materials m where m.id = material_id
                 and (public.current_user_role() = 'admin' or (public.current_user_role() = 'teacher' and m.teacher_id = auth.uid()))));

-- ---------- Storage (PRIVATE bucket; files are served through short-lived signed URLs) --
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('course-materials', 'course-materials', false, 26214400,
        array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
              'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Object keys look like  <teacher-user-id>/<material-id>/<timestamp>-<file name>
drop policy if exists "course-materials read"   on storage.objects;
drop policy if exists "course-materials insert" on storage.objects;
drop policy if exists "course-materials update" on storage.objects;
drop policy if exists "course-materials delete" on storage.objects;
create policy "course-materials read" on storage.objects for select to authenticated using (bucket_id = 'course-materials');
create policy "course-materials insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'course-materials' and (public.current_user_role() = 'admin'
              or (public.current_user_role() = 'teacher' and (storage.foldername(name))[1] = auth.uid()::text)));
create policy "course-materials update" on storage.objects for update to authenticated
  using (bucket_id = 'course-materials' and (public.current_user_role() = 'admin'
         or (public.current_user_role() = 'teacher' and (storage.foldername(name))[1] = auth.uid()::text)));
create policy "course-materials delete" on storage.objects for delete to authenticated
  using (bucket_id = 'course-materials' and (public.current_user_role() = 'admin'
         or (public.current_user_role() = 'teacher' and (storage.foldername(name))[1] = auth.uid()::text)));

-- ---------- catalog seed (edit freely) -----------------------------------------------
insert into public.faculties (name) values ('Tətbiqi Riyaziyyat və İnformatika fakültəsi') on conflict do nothing;

insert into public.departments (faculty_id, name)
select f.id, d.name from public.faculties f,
  (values ('Kompüter elmləri kafedrası'), ('Riyaziyyat kafedrası'), ('Fizika kafedrası'), ('Xarici dillər kafedrası')) as d(name)
where f.name = 'Tətbiqi Riyaziyyat və İnformatika fakültəsi' on conflict do nothing;

insert into public.study_groups (faculty_id, name)
select f.id, g.name from public.faculties f, (values ('AM-31'), ('AM-32'), ('AM-33')) as g(name)
where f.name = 'Tətbiqi Riyaziyyat və İnformatika fakültəsi' on conflict do nothing;

insert into public.subjects (department_id, name, code)
select d.id, s.name, s.code
from (values
  ('Kompüter elmləri kafedrası', 'Verilənlər bazası sistemləri', 'DBS-301'),
  ('Kompüter elmləri kafedrası', 'Proqramlaşdırma', 'PRG-201'),
  ('Kompüter elmləri kafedrası', 'Süni intellektə giriş', 'AI-301'),
  ('Riyaziyyat kafedrası', 'Riyazi analiz', 'MAT-101'),
  ('Riyaziyyat kafedrası', 'Ehtimal nəzəriyyəsi', 'MAT-202'),
  ('Riyaziyyat kafedrası', 'Statistik metodlar', 'STA-301'),
  ('Fizika kafedrası', 'Fizika', 'FIZ-101'),
  ('Xarici dillər kafedrası', 'İngilis dili', 'ENG-101')
) as s(dep, name, code)
join public.departments d on d.name = s.dep
on conflict do nothing;
