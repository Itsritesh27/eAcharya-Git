-- PROPOSAL ONLY. NOT in supabase/migrations/, NOT applied, NOT run by anything.
--
-- WHY: RLS policies call public.is_admin(), public.is_teacher_or_admin() and
-- public.current_user_role() without wrapping them in (select ...). These are SECURITY DEFINER
-- functions that each look up public.profiles, and Postgres then runs them ONCE PER ROW scanned
-- instead of once per query. Wrapping them as (select public.is_admin()) makes Postgres evaluate
-- them once (an "InitPlan"). The result is identical (the functions are STABLE and depend only on
-- the signed-in user), so access rules do not change; only how often the check runs.
-- This is the "Auth RLS Initialization Plan" warning in Supabase Dashboard -> Advisors -> Performance.
--
-- HOW TO USE (Supabase SQL Editor):
--   STEP 1  Run the AUDIT query below. Read-only. Shows how many policies are affected.
--   STEP 2  Run the DO block as-is. apply = false, so it ONLY prints the ALTER POLICY statements
--           (Messages / Notices tab). Nothing is changed. Skim them: each should only wrap the helper calls.
--   STEP 3  Take a backup / note the date, change `apply := false` to `apply := true`, run again.
--   STEP 4  Re-run supabase/tests/*_rls_checks.sql and click through as student, teacher and admin.
--   ROLLBACK  Run the DO block with apply := true and revert := true (it unwraps the same calls).
--
-- Policies that take a row argument (is_enrolled_in_course(...), is_assessment_open(...), etc.)
-- are deliberately NOT touched: they cannot be hoisted out of the row loop.

-- ============================== STEP 1: AUDIT (read-only) ==============================
select schemaname, tablename, policyname, cmd,
       (coalesce(qual, '') || ' ' || coalesce(with_check, '')) as expression
from pg_policies
where schemaname = 'public'
  and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) ~ '(is_admin|is_teacher_or_admin|current_user_role)\(\)'
  and (coalesce(qual, '') || ' ' || coalesce(with_check, '')) !~* 'select\s+(public\.)?(is_admin|is_teacher_or_admin|current_user_role)\(\)'
order by tablename, policyname;

-- ============================== STEP 2/3: REWRITE (preview by default) ==============================
do $$
declare
  apply  boolean := false;   -- <- set to true to actually run the ALTER POLICY statements
  revert boolean := false;   -- <- set to true (with apply) to undo
  r record;
  new_qual text;
  new_check text;
  stmt text;
  n int := 0;
  pat  text := '(public\.)?(is_admin|is_teacher_or_admin|current_user_role)\(\)';
  wrapped text := '\(\s*select\s+(public\.)?(is_admin|is_teacher_or_admin|current_user_role)\(\)(\s+as\s+\w+)?\s*\)';
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
    order by tablename, policyname
  loop
    new_qual := r.qual;
    new_check := r.with_check;

    if not revert then
      -- skip anything already wrapped so the script is safe to re-run
      if r.qual is not null and r.qual ~ pat and r.qual !~* 'select\s+(public\.)?(is_admin|is_teacher_or_admin|current_user_role)\(\)' then
        new_qual := regexp_replace(r.qual, pat, '(select public.\2())', 'g');
      end if;
      if r.with_check is not null and r.with_check ~ pat and r.with_check !~* 'select\s+(public\.)?(is_admin|is_teacher_or_admin|current_user_role)\(\)' then
        new_check := regexp_replace(r.with_check, pat, '(select public.\2())', 'g');
      end if;
    else
      if r.qual is not null and r.qual ~* wrapped then
        new_qual := regexp_replace(r.qual, wrapped, 'public.\2()', 'g');
      end if;
      if r.with_check is not null and r.with_check ~* wrapped then
        new_check := regexp_replace(r.with_check, wrapped, 'public.\2()', 'g');
      end if;
    end if;

    if new_qual is distinct from r.qual or new_check is distinct from r.with_check then
      stmt := format('alter policy %I on %I.%I', r.policyname, r.schemaname, r.tablename);
      if new_qual is distinct from r.qual then stmt := stmt || format(' using (%s)', new_qual); end if;
      if new_check is distinct from r.with_check then stmt := stmt || format(' with check (%s)', new_check); end if;
      raise notice '%;', stmt;
      if apply then execute stmt; end if;
      n := n + 1;
    end if;
  end loop;
  raise notice '% policies %', n, case when apply then 'REWRITTEN' else 'would be rewritten (preview only: nothing changed)' end;
end $$;
