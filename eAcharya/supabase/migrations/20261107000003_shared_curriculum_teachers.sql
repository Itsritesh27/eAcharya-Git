-- Shared NCERT curriculum: any teacher can add chapters, videos and study materials to a course that has
-- no owner (created_by is null, e.g. the seeded NCERT courses) AND to courses they own themselves.
-- A course owned by ANOTHER teacher stays off limits. Students and anonymous users get no new access.
-- Existing lessons in published courses are still not editable/deletable (only additions are opened up).

-- helper: may the signed-in user (a teacher) add content to this course?
create or replace function public.teacher_can_add_to_course(p_course uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_user_role() = 'teacher'
    and exists (
      select 1 from public.courses c
      where c.id = p_course
        and (c.created_by = (select auth.uid()) or c.created_by is null)
    );
$$;
revoke all on function public.teacher_can_add_to_course(uuid) from public, anon;
grant execute on function public.teacher_can_add_to_course(uuid) to authenticated;

-- lesson_content (video link, files) follows the same rule
create or replace function public.owns_lesson_course(p_lesson uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.lessons l
    join public.units u on u.id = l.unit_id
    join public.courses c on c.id = u.course_id
    where l.id = p_lesson
      and (
        c.created_by = (select auth.uid())
        or (c.created_by is null and public.current_user_role() = 'teacher')
      )
  );
$$;

-- chapters
drop policy if exists "units: teacher add chapters to own courses" on public.units;
create policy "units: teacher add chapters to own courses" on public.units for insert to authenticated
  with check (public.teacher_can_add_to_course(course_id));

-- video lessons in published courses
drop policy if exists "lessons: teacher add videos to own published courses" on public.lessons;
create policy "lessons: teacher add videos to own published courses" on public.lessons for insert to authenticated
  with check (
    public.current_user_role() = 'teacher'
    and is_published = true
    and exists (
      select 1 from public.units u
      where u.id = lessons.unit_id
        and public.teacher_can_add_to_course(u.course_id)
    )
  );

-- study materials attached to a lesson
drop policy if exists "resources: teachers create own" on public.resources;
create policy "resources: teachers create own"
  on public.resources for insert to authenticated
  with check (
    public.is_teacher_or_admin()
    and created_by = (select auth.uid())
    and (
      is_published = false
      or public.is_admin()
      or (
        course_id is not null
        and public.teacher_can_add_to_course(course_id)
        and (
          unit_id is null
          or exists (select 1 from public.units u where u.id = resources.unit_id and u.course_id = resources.course_id)
        )
        and (
          lesson_id is null
          or exists (
            select 1 from public.lessons l join public.units u on u.id = l.unit_id
            where l.id = resources.lesson_id and u.course_id = resources.course_id
          )
        )
      )
    )
  );

drop policy if exists "resources: teachers update own" on public.resources;
create policy "resources: teachers update own"
  on public.resources for update to authenticated
  using (public.is_teacher_or_admin() and created_by = (select auth.uid()))
  with check (
    created_by = (select auth.uid())
    and (is_published = false or public.teacher_can_add_to_course(course_id))
  );

-- clean-up of a half-saved video lesson
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
  using public.units u
  where l.id = any(p_lesson_ids)
    and l.unit_id = u.id
    and public.teacher_can_add_to_course(u.course_id)
    and l.created_at > now() - interval '15 minutes'
    and not exists (select 1 from public.lesson_content lc where lc.lesson_id = l.id)
    and not exists (select 1 from public.resources r where r.lesson_id = l.id);
end;
$$;
revoke all on function public.cleanup_failed_teacher_video_lessons(uuid[]) from public, anon;
grant execute on function public.cleanup_failed_teacher_video_lessons(uuid[]) to authenticated;
