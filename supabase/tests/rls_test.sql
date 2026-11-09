\set ON_ERROR_STOP 0
-- create users through the trigger path (role metadata must be ignored)
insert into auth.users (id, email, raw_user_meta_data) values
 ('a0000000-0000-0000-0000-000000000001','admin@x.az','{"full_name":"Admin","role":"admin"}'),
 ('b0000000-0000-0000-0000-000000000001','teacherA@x.az','{"full_name":"Teacher A","role":"admin"}'),
 ('b0000000-0000-0000-0000-000000000002','teacherB@x.az','{"full_name":"Teacher B"}'),
 ('c0000000-0000-0000-0000-000000000001','student@x.az','{"full_name":"Student","role":"teacher"}');
select 'signup with role=admin in metadata ->', role as resulting_role from profiles where id='b0000000-0000-0000-0000-000000000001';
select 'signup with role=teacher in metadata ->', role from profiles where id='c0000000-0000-0000-0000-000000000001';
-- promote via dashboard-style SQL (auth.uid() is null): allowed
update profiles set role='admin' where id='a0000000-0000-0000-0000-000000000001';
update profiles set role='teacher' where id in ('b0000000-0000-0000-0000-000000000001','b0000000-0000-0000-0000-000000000002');

create or replace function t_try(uid uuid, who text, label text, stmt text, as_role text default 'authenticated') returns void language plpgsql as $$
declare n int; res text;
begin
  perform set_config('request.jwt.claim.sub', coalesce(uid::text,''), true);
  begin
    execute 'set local role ' || as_role;
    execute stmt; get diagnostics n = row_count;
    res := 'allowed, rows=' || n;
  exception when others then res := 'DENIED (' || left(sqlerrm, 60) || ')';
  end;
  execute 'reset role';
  raise notice '% | % | %', rpad(who, 9), rpad(label, 46), res;
end $$;

\set A  'b0000000-0000-0000-0000-000000000001'
\set B  'b0000000-0000-0000-0000-000000000002'
\set S  'c0000000-0000-0000-0000-000000000001'
\set AD 'a0000000-0000-0000-0000-000000000001'

create or replace function mk(uid uuid, path text) returns text language sql as $$
 select format($f$insert into materials (title, subject_id, academic_year, teacher_id, file_path, file_name) select 'T', id, '2026/2027', %L, %L, 'f.pdf' from subjects limit 1$f$, uid, path) $$;

select t_try(:'S', 'student',  'insert material', mk(:'S','s/1/f.pdf'));
select t_try(:'A', 'teacher A','insert own material', mk(:'A','a/1/f.pdf'));
select t_try(:'A', 'teacher A','insert material as teacher B', mk(:'B','a/2/f.pdf'));
select t_try(:'B', 'teacher B','insert own material', mk(:'B','b/1/f.pdf'));
select t_try(:'S', 'student',  'select materials (expect 2)', 'select * from materials');
select t_try(null, 'anon',     'select materials', 'select * from materials', 'anon');
select t_try(:'B', 'teacher B','update A''s material (expect 0 rows)', $q$update materials set title='hack' where file_path='a/1/f.pdf'$q$);
select t_try(:'B', 'teacher B','delete A''s material (expect 0 rows)', $q$delete from materials where file_path='a/1/f.pdf'$q$);
select t_try(:'S', 'student',  'update a material (expect 0 rows)', $q$update materials set title='hack'$q$);
select t_try(:'S', 'student',  'delete a material (expect 0 rows)', 'delete from materials');
select t_try(:'A', 'teacher A','update own material (expect 1)', $q$update materials set title='ok' where file_path='a/1/f.pdf'$q$);
select t_try(:'A', 'teacher A','reassign own material to teacher B', format($q$update materials set teacher_id=%L where file_path='a/1/f.pdf'$q$, :'B'));
select t_try(:'A', 'teacher A','link own material to a group', $q$insert into material_groups select m.id, g.id from materials m, study_groups g where m.file_path='a/1/f.pdf' limit 1$q$);
select t_try(:'B', 'teacher B','link A''s material to a group', $q$insert into material_groups select m.id, g.id from materials m, study_groups g where m.file_path='a/1/f.pdf' and g.name='AM-31'$q$);
select t_try(:'S', 'student',  'link a material to a group', $q$insert into material_groups select m.id, g.id from materials m, study_groups g where g.name='AM-33' limit 1$q$);
select t_try(:'S', 'student',  'promote self to admin', format($q$update profiles set role='admin' where id=%L$q$, :'S'));
select t_try(:'A', 'teacher A','promote self to admin', format($q$update profiles set role='admin' where id=%L$q$, :'A'));
select t_try(:'S', 'student',  'edit own name (expect 1)', format($q$update profiles set full_name='Turan' where id=%L$q$, :'S'));
select t_try(:'S', 'student',  'edit someone else''s profile (expect 0)', format($q$update profiles set full_name='x' where id=%L$q$, :'B'));
select t_try(:'S', 'student',  'insert subject (catalog)', $q$insert into subjects (department_id, name) select id, 'X' from departments limit 1$q$);
select t_try(:'AD','admin',    'insert subject (catalog)', $q$insert into subjects (department_id, name) select id, 'X' from departments limit 1$q$);
select t_try(:'AD','admin',    'promote student to teacher', format($q$update profiles set role='teacher' where id=%L$q$, :'S'));
select t_try(:'AD','admin',    'update teacher B material (expect 1)', $q$update materials set title='by admin' where file_path='b/1/f.pdf'$q$);
-- storage
select t_try(:'S', 'student',  'storage: upload', $q$insert into storage.objects (bucket_id, name) values ('course-materials','c0000000-0000-0000-0000-000000000001/x.pdf')$q$);
select t_try(:'A', 'teacher A','storage: upload into own folder', $q$insert into storage.objects (bucket_id, name) values ('course-materials','b0000000-0000-0000-0000-000000000001/1/a.pdf')$q$);
select t_try(:'A', 'teacher A','storage: upload into teacher B folder', $q$insert into storage.objects (bucket_id, name) values ('course-materials','b0000000-0000-0000-0000-000000000002/1/a.pdf')$q$);
select t_try(:'A', 'teacher A','storage: upload to another bucket path', $q$insert into storage.objects (bucket_id, name) values ('other','b0000000-0000-0000-0000-000000000001/1/a.pdf')$q$);
select t_try(:'S', 'student',  'storage: read (expect 1)', 'select * from storage.objects');
select t_try(null,'anon',      'storage: read', 'select * from storage.objects', 'anon');
select t_try(:'B', 'teacher B','storage: delete A''s file (expect 0)', $q$delete from storage.objects where name like 'b0000000-0000-0000-0000-000000000001/%'$q$);
select t_try(:'S', 'student',  'storage: delete (expect 0)', 'delete from storage.objects');
select t_try(:'A', 'teacher A','storage: delete own file (expect 1)', $q$delete from storage.objects where name like 'b0000000-0000-0000-0000-000000000001/%'$q$);
select t_try(:'AD','admin',    'storage: upload into any folder', $q$insert into storage.objects (bucket_id, name) values ('course-materials','b0000000-0000-0000-0000-000000000002/9/a.pdf')$q$);
