# Performance and release verification

## What has been cleaned in this release

- Removed a stale nested copy of the Next.js app that could confuse the chosen deployment root.
- Removed duplicate root dotfile aliases and generated TypeScript build cache.
- Removed unused root JPEG Earth textures after checking active root source references; the WebP texture remains.
- Consolidated old phase/handoff Markdown into a small maintained documentation set.
- Replaced Market Master’s separate blue palette with the shared eAcharya brand/forest/sage tokens.
- Kept route-level game components and local game interactions away from Supabase writes.

These changes improve repository hygiene, reduce archive size and improve UI consistency. They do **not**, by themselves, prove a faster live page load.

## Baseline test plan

Run from the project root on a machine with working npm registry access:

```bash
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npm run start
```

Then, against the same deployed commit and test account before/after changes:

1. Capture Lighthouse mobile and desktop for homepage, course listing, lesson/video, student dashboard, teacher dashboard, GeoLab and EcoLab.
2. In Chrome DevTools → Network, record the request waterfall and slowest Fetch/XHR calls on each route. Compare API wait time to browser rendering and assets.
3. Inspect first-load JavaScript for homepage, lesson, assessment, live class and each lab before removing or adding dependencies.
4. Inspect Supabase query timing and resource metrics over a measured window; cumulative `pg_stat_statements` totals alone are not page-load timings.
5. Verify navigation, auth, RLS, private doubts, file access, video uploads, assessments, forum attachments and game controls after performance changes.

## Release checklist

- [ ] Netlify Base directory is blank/root and root `netlify.toml` is used.
- [ ] Environment variables are set without exposing server secrets.
- [ ] TypeScript, lint, tests and production build pass.
- [ ] Main student and teacher routes tested with real role accounts.
- [ ] No uncaught client/server errors on key routes.
- [ ] Network and Lighthouse before/after measurements are recorded.
- [ ] Database migration state is reconciled before using Supabase CLI against production.

## Phase 1 performance changes

See [`PERFORMANCE_REPORT.md`](./PERFORMANCE_REPORT.md) for exact scope and verification limits. The homepage now starts with an SVG Earth and defers the interactive Three.js globe until it is near the viewport and the browser is idle (or skips it entirely for mobile/Data Saver/low-memory devices). Course detail enrolment, completed-lesson, and published-resource reads start in parallel. Course reads have opt-in `[perf]` timing labels when `PERF_LOG=1` is set.
