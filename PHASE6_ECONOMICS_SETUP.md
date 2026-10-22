# Phase 6 — Economics added alongside Geography (on the updated project with Live Classes)

eAcharya now carries two subjects, Geography and Economics, for Classes 9–12. Geography content and the Geography Lab are unchanged, and Live Classes and the class-based forum are untouched.

## What was added

**Database — `supabase/migrations/20261105000001_phase6_economics_content.sql`** (numbered after your Live Classes and forum-attachment migrations)
- `economics` subject and six NCERT-aligned book courses (36 chapters): Class 9 Economics (4), Class 10 Understanding Economic Development (5), Class 11 Indian Economic Development (8), Class 11 Statistics for Economics (8), Class 12 Introductory Microeconomics (5), Class 12 Introductory Macroeconomics (6).
- Per chapter: a unit, a study-guide lesson, a practice-worksheet lesson (with objectives) and a worksheet resource. One official-textbook link per book.
- Class descriptions made subject-neutral.
- No forum changes: your forum now has a single `general` category per class, so the Economics forum categories from the earlier build were dropped.
- Rollback: `supabase/rollbacks/20261105000001_phase6_economics_content_rollback.sql`.

**App**
- `src/lib/subjects.ts` — subject list, `?subject=` parsing, course links.
- Courses page: subject filter chips plus the class filter.
- Economics Lab at `/economics-lab`: Demand and Supply Explorer, Price Index and Inflation Calculator, National Income Calculator, Data Summary Calculator. Public pages, run in the browser, no database writes.
- Public header, student sidebar (next to Live Classes), landing page, About, dashboard and forum copy updated for both subjects.
- Unit tests: `src/lib/subjects.test.ts`, `src/lib/economics-lab/*.test.ts`.

## How to apply
1. Back up Supabase, then run the migration file once in the SQL Editor (safe to re-run).
2. Commit the code and let Netlify build. Run `npm run typecheck`, `npm run lint` and `npm test` first if you can; this was written without `node_modules`, so they have not been run here.
3. Check Courses → Economics, the Economics Lab and the sidebar.

## Things to check
- Chapter lists follow the current NCERT Economics books as listed by several education sites; confirm on the NCERT portal. Class 11 Statistics for Economics titles differ between sources.
- Every Economics textbook link opens the NCERT textbook portal (https://ncert.nic.in/textbook.php), not a book-specific page.
- Study text is original eAcharya material.
- Optional: `supabase/proposed/phase6_fix_geography_study_routine_newlines_PROPOSAL.sql` fixes literal `\n` characters in the Phase 5 Geography study notes.
