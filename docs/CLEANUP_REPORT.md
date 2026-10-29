# eAcharya Cleanup Report

## Completed offline changes

- Root is now the only maintained Next.js application copy; stale nested `netlify/` application removed. Configure Netlify Base directory to blank/root.
- Consolidated historical Markdown/handoff files into six maintained documents under `docs/`.
- Removed duplicate plain `gitignore` and `gitattributes` aliases, plus generated `tsconfig.tsbuildinfo`.
- Removed unused root Earth JPEGs after confirming active root app references the WebP texture.
- Standardized the Market Master UI palette to shared eAcharya tokens.
- Updated the TypeScript project exclusions and pinned the Netlify build to Node.js 22.22+, matching a dependency engine requirement found during audit.
- Resolved obvious local migration filename collisions by removing an exact duplicate migration and assigning the teacher-chapter policy migration a unique local version.

## Not verified / requires your environment

- `npm ci` was attempted but timed out before install completed. This container runs Node.js 22.16.0, while a locked dependency (`machina`) declares Node.js `>=22.22`; the project and Netlify runtime are now pointed at 22.22.0, but full build/test verification remains pending.

- Netlify's remote Base directory setting cannot be inspected from this archive. Set it to blank/root before deploying.
- Production Supabase migration history cannot be inspected here. Review `docs/DATABASE_AND_SECURITY.md` before `supabase db push`; do not run `db reset` on production.
- Full install/typecheck/lint/tests/build and live Lighthouse/Network measurements must run on a machine with dependencies installed and against the actual deployment.
