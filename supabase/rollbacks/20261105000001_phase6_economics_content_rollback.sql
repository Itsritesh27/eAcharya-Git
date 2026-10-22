-- Rollback for 20261105000001_phase6_economics_content.sql
-- Run only if no student progress or assessments should be kept for Economics.
-- Remove Economics resources, then courses (units and lessons follow their course by foreign key; any assessment attached to these courses must be removed first).
DELETE FROM public.resources WHERE course_id IN (SELECT c.id FROM public.courses c JOIN public.subjects s ON s.id = c.subject_id WHERE s.slug = 'economics');
DELETE FROM public.courses WHERE subject_id IN (SELECT id FROM public.subjects WHERE slug = 'economics');
DELETE FROM public.subjects WHERE slug = 'economics';
-- Restore the Geography-only class descriptions from Phase 5.
UPDATE public.classes SET description = 'NCERT-aligned Geography foundations' WHERE grade = 9;
UPDATE public.classes SET description = 'NCERT-aligned resources and development' WHERE grade = 10;
UPDATE public.classes SET description = 'Physical Geography and India physical environment' WHERE grade = 11;
UPDATE public.classes SET description = 'Human Geography and India people and economy' WHERE grade = 12;
