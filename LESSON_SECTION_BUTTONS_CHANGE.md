# Lesson section buttons update

The student lesson page now displays a row of controls beneath the lecture tools:

- **Transcript** opens the transcript panel.
- **Notes** opens the student's personal notes panel.
- **Resources** opens resources linked to the lesson.
- **Ask Doubt** opens the existing private doubt form for enrolled students.

No panel is open on initial page load. Clicking an open control closes that panel. Selecting a different control opens its panel. The existing private doubt submission action, current video timestamp, attachment handling, teacher replies, and access restrictions are retained.

Implementation files:

- `src/app/tutorials/[lessonId]/page.tsx`
- `src/components/teacher-doubts/lesson-video-with-doubts.tsx`

Validation performed: TypeScript/TSX syntax transpilation passed for the two changed files. Full type-check, tests, and production build were not run because project dependencies are not installed in this environment.
