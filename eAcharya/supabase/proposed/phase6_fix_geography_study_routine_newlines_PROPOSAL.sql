-- OPTIONAL fix, not applied automatically (lives in supabase/proposed).
-- The Phase 5 Geography migration wrote the "Study routine" list inside a plain SQL string, so the line breaks were stored as the two
-- characters backslash + n instead of real newlines. This replaces them with real newlines in existing lesson notes.
-- Safe to re-run: once fixed, no backslash-n sequences remain to replace.
-- Review with the SELECT first.
-- SELECT count(*) FROM public.lesson_content WHERE transcript LIKE '%' || chr(92) || 'n%';
UPDATE public.lesson_content
SET transcript = replace(transcript, chr(92) || 'n', E'\n'), updated_at = now()
WHERE transcript LIKE '%' || chr(92) || 'n%';
