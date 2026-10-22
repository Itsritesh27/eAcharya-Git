-- eAcharya repair migration.
-- Fixes the class-first forum constraint order, attachment bucket setup, published-course
-- video insertion, and private student-to-teacher doubts. Safe to re-run manually.

-- 1) Normalize the forum category before enforcing the class-first constraint.
alter table public.discussions drop constraint if exists discussions_category_check;
update public.discussions set category = 'general' where category is distinct from 'general';
alter table public.discussions add constraint discussions_category_check check (category = 'general');
alter table public.discussions alter column category set default 'general';

alter table public.discussions enable row level security;
alter table public.discussion_replies enable row level security;
grant select on public.discussions, public.discussion_replies to authenticated;
grant insert (author_id, grade, category, title, body, links, client_token) on public.discussions to authenticated;
grant insert (author_id, discussion_id, body, client_token) on public.discussion_replies to authenticated;
drop policy if exists "discussions: insert as self" on public.discussions;
create policy "discussions: insert as self" on public.discussions for insert to authenticated
  with check (author_id = (select auth.uid()) and not is_hidden);
drop policy if exists "replies: insert as self on visible discussion" on public.discussion_replies;
create policy "replies: insert as self on visible discussion" on public.discussion_replies for insert to authenticated
  with check (
    author_id = (select auth.uid()) and not is_hidden
    and exists (select 1 from public.discussions d where d.id = discussion_id and not d.is_hidden)
  );

-- 2) Public-read forum attachment bucket. Uploads are confined to each authenticated user's folder.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('forum-attachments', 'forum-attachments', true, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
on conflict (id) do update set
  name = excluded.name,
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "forum-attachments: authenticated read" on storage.objects;
create policy "forum-attachments: authenticated read" on storage.objects for select to authenticated
  using (bucket_id = 'forum-attachments');
drop policy if exists "forum-attachments: upload own folder" on storage.objects;
create policy "forum-attachments: upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'forum-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "forum-attachments: delete own folder" on storage.objects;
create policy "forum-attachments: delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'forum-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 3) Permit a teacher to add immediately-published lessons to a published course they own.
-- The existing draft-course edit/delete policies are intentionally unchanged.
drop policy if exists "lessons: teacher add videos to own published courses" on public.lessons;
create policy "lessons: teacher add videos to own published courses" on public.lessons for insert to authenticated
  with check (
    public.current_user_role() = 'teacher'
    and is_published = true
    and exists (
      select 1 from public.units u join public.courses c on c.id = u.course_id
      where u.id = lessons.unit_id and c.created_by = (select auth.uid()) and c.status = 'published'
    )
  );

-- Narrow compensation path for the rare case where a video lesson row is inserted but
-- its lesson_content insert fails. It can only delete recent, empty lessons from the caller's own course.
create or replace function public.cleanup_failed_teacher_video_lessons(p_lesson_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or public.current_user_role() <> 'teacher' then
    raise exception 'Teacher access required.' using errcode = '42501';
  end if;
  if cardinality(coalesce(p_lesson_ids, '{}'::uuid[])) < 1 or cardinality(coalesce(p_lesson_ids, '{}'::uuid[])) > 20 then
    raise exception 'Invalid cleanup request.' using errcode = '22023';
  end if;
  delete from public.lessons l
  using public.units u, public.courses c
  where l.id = any(p_lesson_ids)
    and l.unit_id = u.id
    and u.course_id = c.id
    and c.created_by = (select auth.uid())
    and l.created_at > now() - interval '15 minutes'
    and not exists (select 1 from public.lesson_content lc where lc.lesson_id = l.id)
    and not exists (select 1 from public.resources r where r.lesson_id = l.id);
end;
$$;
revoke all on function public.cleanup_failed_teacher_video_lessons(uuid[]) from public, anon;
grant execute on function public.cleanup_failed_teacher_video_lessons(uuid[]) to authenticated;
-- Keep the table privileges explicit; row-level policies still govern which rows can be inserted/read.
grant select on public.lessons to authenticated;
grant insert (unit_id, title, description, position, is_published) on public.lessons to authenticated;

-- 4) Private teacher doubts. Private attachments use their own non-public bucket (not the public forum bucket).
create table if not exists public.teacher_doubts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  timestamp_seconds integer check (timestamp_seconds is null or timestamp_seconds between 0 and 86400),
  question_title text not null check (char_length(btrim(question_title)) between 5 and 200),
  question_body text not null check (char_length(btrim(question_body)) between 10 and 10000),
  attachment_paths text[] not null default '{}'::text[] check (cardinality(attachment_paths) <= 5),
  teacher_reply text check (teacher_reply is null or char_length(btrim(teacher_reply)) between 1 and 10000),
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.teacher_doubts add column if not exists attachment_paths text[] not null default '{}'::text[];
create index if not exists teacher_doubts_student_idx on public.teacher_doubts(student_id, created_at desc);
create index if not exists teacher_doubts_teacher_idx on public.teacher_doubts(teacher_id, created_at desc);
create index if not exists teacher_doubts_course_idx on public.teacher_doubts(course_id, created_at desc);
drop trigger if exists teacher_doubts_set_updated_at on public.teacher_doubts;
create trigger teacher_doubts_set_updated_at before update on public.teacher_doubts
  for each row execute function public.set_updated_at();

create or replace function public.guard_teacher_doubt()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  course_owner uuid;
  course_status public.course_status;
begin
  -- Trusted SQL maintenance can bypass client guards; app sessions are verified below.
  if (select auth.uid()) is null then return new; end if;

  if tg_op = 'INSERT' then
    if new.student_id <> (select auth.uid()) or public.current_user_role() <> 'student' then
      raise exception 'Only students can send a private doubt as themselves.' using errcode = '42501';
    end if;
    select c.created_by, c.status into course_owner, course_status
      from public.courses c where c.id = new.course_id;
    if course_owner is null or course_owner <> new.teacher_id or course_status <> 'published'
       or not exists (select 1 from public.profiles p where p.id = new.teacher_id and p.role = 'teacher') then
      raise exception 'Choose a published course that belongs to a teacher.' using errcode = '23514';
    end if;
    if cardinality(coalesce(new.attachment_paths, '{}'::text[])) > 5
       or exists (
         select 1 from unnest(coalesce(new.attachment_paths, '{}'::text[])) as attachment(path)
         where path is null or char_length(path) > 500 or path !~ ('^' || new.student_id::text || '/[A-Za-z0-9._/-]+$')
       ) then
      raise exception 'One or more private attachments are invalid.' using errcode = '23514';
    end if;
    if new.lesson_id is not null and not exists (
      select 1 from public.lessons l join public.units u on u.id = l.unit_id
      where l.id = new.lesson_id and u.course_id = new.course_id
    ) then
      raise exception 'The selected lesson does not belong to this course.' using errcode = '23514';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.student_id is distinct from old.student_id
     or new.teacher_id is distinct from old.teacher_id
     or new.course_id is distinct from old.course_id
     or (new.lesson_id is distinct from old.lesson_id and not (old.lesson_id is not null and new.lesson_id is null))
     or new.timestamp_seconds is distinct from old.timestamp_seconds
     or new.question_title is distinct from old.question_title
     or new.question_body is distinct from old.question_body
     or new.attachment_paths is distinct from old.attachment_paths then
    raise exception 'The original private question cannot be edited.' using errcode = '42501';
  end if;
  if new.teacher_id <> (select auth.uid()) or public.current_user_role() <> 'teacher' then
    raise exception 'Only the assigned teacher can reply to this private doubt.' using errcode = '42501';
  end if;
  if new.teacher_reply is null or char_length(btrim(new.teacher_reply)) not between 1 and 10000 then
    raise exception 'Write a reply between 1 and 10000 characters.' using errcode = '23514';
  end if;
  new.replied_at := now();
  return new;
end;
$$;
revoke all on function public.guard_teacher_doubt() from public, anon, authenticated;
drop trigger if exists teacher_doubts_guard on public.teacher_doubts;
create trigger teacher_doubts_guard before insert or update on public.teacher_doubts
  for each row execute function public.guard_teacher_doubt();

alter table public.teacher_doubts enable row level security;
revoke all on public.teacher_doubts from anon, authenticated;
grant select on public.teacher_doubts to authenticated;
grant insert (student_id, teacher_id, course_id, lesson_id, timestamp_seconds, question_title, question_body, attachment_paths) on public.teacher_doubts to authenticated;
grant update (teacher_reply, replied_at) on public.teacher_doubts to authenticated;
drop policy if exists "teacher_doubts: participants read" on public.teacher_doubts;
create policy "teacher_doubts: participants read" on public.teacher_doubts for select to authenticated
  using (student_id = (select auth.uid()) or teacher_id = (select auth.uid()));
drop policy if exists "teacher_doubts: students ask course teacher" on public.teacher_doubts;
create policy "teacher_doubts: students ask course teacher" on public.teacher_doubts for insert to authenticated
  with check (
    student_id = (select auth.uid())
    and public.current_user_role() = 'student'
    and exists (select 1 from public.courses c where c.id = course_id and c.created_by = teacher_id and c.status = 'published')
  );
drop policy if exists "teacher_doubts: assigned teacher replies" on public.teacher_doubts;
create policy "teacher_doubts: assigned teacher replies" on public.teacher_doubts for update to authenticated
  using (teacher_id = (select auth.uid()) and public.current_user_role() = 'teacher')
  with check (teacher_id = (select auth.uid()) and public.current_user_role() = 'teacher');

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('teacher-doubt-attachments', 'teacher-doubt-attachments', false, 10485760,
  array['image/jpeg','image/png','image/webp','image/gif','application/pdf'])
on conflict (id) do update set
  name = excluded.name,
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
drop policy if exists "teacher doubt files: upload own folder" on storage.objects;
create policy "teacher doubt files: upload own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'teacher-doubt-attachments' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "teacher doubt files: participants read linked files" on storage.objects;
create policy "teacher doubt files: participants read linked files" on storage.objects for select to authenticated
  using (
    bucket_id = 'teacher-doubt-attachments'
    and exists (
      select 1 from public.teacher_doubts d
      where d.attachment_paths @> array[storage.objects.name]
        and (d.student_id = (select auth.uid()) or d.teacher_id = (select auth.uid()))
    )
  );
drop policy if exists "teacher doubt files: cleanup unlinked own files" on storage.objects;
create policy "teacher doubt files: cleanup unlinked own files" on storage.objects for delete to authenticated
  using (
    bucket_id = 'teacher-doubt-attachments'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and not exists (select 1 from public.teacher_doubts d where d.attachment_paths @> array[storage.objects.name])
  );

create or replace function public.student_teacher_courses()
returns table (course_id uuid, course_title text, grade smallint, teacher_id uuid, teacher_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select c.id, c.title, cl.grade, p.id,
         coalesce(nullif(btrim(p.full_name), ''), 'Teacher')
  from public.courses c
  join public.classes cl on cl.id = c.class_id
  join public.profiles p on p.id = c.created_by and p.role = 'teacher'
  where c.status = 'published'
    and (select auth.uid()) is not null
    and public.current_user_role() = 'student'
  order by cl.grade, c.title;
$$;
revoke all on function public.student_teacher_courses() from public, anon;
grant execute on function public.student_teacher_courses() to authenticated;

create or replace function public.teacher_doubt_contact_cards(p_ids uuid[])
returns table (id uuid, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, coalesce(nullif(btrim(p.full_name), ''), 'eAcharya member')
  from public.profiles p
  where (select auth.uid()) is not null
    and p.id = any(coalesce(p_ids, '{}'::uuid[]))
    and cardinality(coalesce(p_ids, '{}'::uuid[])) <= 100
    and exists (
      select 1 from public.teacher_doubts d
      where (d.student_id = (select auth.uid()) and d.teacher_id = p.id)
         or (d.teacher_id = (select auth.uid()) and d.student_id = p.id)
    );
$$;
revoke all on function public.teacher_doubt_contact_cards(uuid[]) from public, anon;
grant execute on function public.teacher_doubt_contact_cards(uuid[]) to authenticated;
