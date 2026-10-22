-- Purani description mein "study guides / worksheets" likha tha. Syllabus-only courses ke liye saaf description.
update public.courses
set description = 'NCERT-aligned syllabus for ' || title || ', chapter by chapter, with a link to the official NCERT textbook.'
where created_by is null
  and (description ilike '%study guide%' or description ilike '%worksheet%' or description ilike '%study notes%' or description ilike '%chapter notes%');
