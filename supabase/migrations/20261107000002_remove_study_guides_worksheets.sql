-- Removes the auto-generated "Study guide: ..." and "Practice worksheet: ..." lessons (and the worksheet
-- resources) from every course. Chapters (units) are kept.
-- A lesson that already has a video is kept, so teacher uploads are never deleted.
delete from public.resources
where resource_type = 'notes' and title like 'Practice worksheet: %';

delete from public.lessons l
where (l.title like 'Study guide: %' or l.title like 'Practice worksheet: %')
  and not exists (
    select 1 from public.lesson_content lc where lc.lesson_id = l.id and lc.video_url is not null
  );

-- Check: should return 0 rows.
select l.id, l.title from public.lessons l
where l.title like 'Study guide: %' or l.title like 'Practice worksheet: %';
