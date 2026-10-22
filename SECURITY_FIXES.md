# Audit fixes applied

Done in code: HSTS + enforced CSP basics + full CSP in Report-Only (next.config.mjs); forum attachments only trusted on our
Supabase origin and now actually rendered (ForumContent wired into replies and discussions); download route no longer leaks
DB errors and refuses non-https targets; per-instance rate limits on download + live token routes (src/lib/utils/rate-limit.ts);
password-reset/verification links no longer built from forwarded headers in production; other sessions are signed out after a
password reset; admin role changes are logged, and the admin user list has search, paging and correct role totals; root
error.tsx + global-error.tsx; sitemap.ts, robots.ts, manifest.ts; skip-link target on the live page; placeholder contrast;
duplicate migration renamed to 20261106000002; stray tsbuildinfo / android/local.properties removed and gitignored.

# Still needs you (could not be done safely from here)

1. ROTATE the LiveKit API key/secret (the old .env.local was shared). .env.local is NOT in this zip.
2. Make the `lesson-videos` and `forum-attachments` buckets private and serve signed URLs. Stored rows hold public URLs,
   so this needs a data migration + code change; test on a copy of the database first.
3. LiveKit: restrict student publishing (e.g. no screen share via canPublishSources) once you confirm the SDK version's API.
4. Watch the browser console for "Content-Security-Policy-Report-Only" violations; when clean, rename that header to
   "Content-Security-Policy" in next.config.mjs.
5. Real rate limiting across instances (Upstash/Netlify Blobs) and for auth/forum actions.
6. package.json: add @netlify/plugin-nextjs (and @capacitor/* if you keep the Android app); remove `three`/`@types/three`
   and components/landing/earth-3d.tsx if the 3D globe stays disabled. Run `npm install` to refresh package-lock.json.
7. If the DB already recorded 20261106000001, `supabase db push` will apply the renamed ...000002 file once; it is idempotent.
8. Run: npm run typecheck && npm test && npm run build.
