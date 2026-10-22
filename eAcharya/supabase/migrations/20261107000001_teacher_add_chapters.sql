-- Let a teacher add NEW chapters (units) to a course they own, even once it is published.
-- Existing chapters stay protected: only INSERT is opened up; update/delete remain draft-only.
drop policy if exists "units: teacher add chapters to own courses" on public.units;
create policy "units: teacher add chapters to own courses" on public.units for insert to authenticated
  with check (
    public.current_user_role() = 'teacher'
    and exists (
      select 1 from public.courses c
      where c.id = units.course_id and c.created_by = (select auth.uid())
    )
  );
