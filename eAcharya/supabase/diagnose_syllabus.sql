-- Run in Supabase SQL Editor. 1) Do the NCERT courses have chapters?
select c.slug, c.status, c.created_by, count(u.id) as chapters
from public.courses c left join public.units u on u.course_id = c.id
group by c.id order by c.slug;

-- 2) If chapters = 0 for a course, re-run supabase/migrations/20261102000001_phase5_ncert_geography_content.sql
--    (it is idempotent: it only creates what is missing and keeps existing lessons/videos).

-- 3) NCERT courses have created_by = null, so no teacher "owns" them and the Videos page shows nothing.
--    Give a teacher ownership to let them upload videos into those chapters:
--    update public.courses set created_by = '<TEACHER_USER_ID>' where slug like 'class-%' and created_by is null;
--    (find the id in Authentication > Users, or: select id, full_name from public.profiles where role = 'teacher';)
