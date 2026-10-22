-- Supabase SQL Editor mein chalao. Teeno result dekhke bata do.

-- 1) Naya permission rule lagu hua? (1 row aani chahiye: teacher_can_add_to_course)
select proname from pg_proc
where pronamespace = 'public'::regnamespace and proname = 'teacher_can_add_to_course';

-- 2) Chapters wali policy ka naam + rule (with_check mein teacher_can_add_to_course dikhna chahiye)
select policyname, with_check from pg_policies
where schemaname = 'public' and tablename = 'units' and cmd = 'INSERT';

-- 3) Teacher ka role (teacher dikhna chahiye)
select u.email, p.role from auth.users u join public.profiles p on p.id = u.id
where lower(u.email) = 'itsme27here@gmail.com';
