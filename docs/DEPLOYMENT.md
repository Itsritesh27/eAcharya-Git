# Deployment (Netlify)

## Canonical build directory

The web application and the authoritative `netlify.toml` are at the repository root. In Netlify, set **Base directory** to blank/root. Do not set it to `netlify`; that nested stale duplicate has been removed. The repository root is the intended build context.

## Build settings

Use Node.js 22.22+ for the current locked dependency tree. The root `netlify.toml` pins the Netlify build runtime accordingly and sets:

- Build command: `npm run build`
- Publish directory: `.next`
- Next.js plugin: `@netlify/plugin-nextjs`

Netlify's UI configuration can override values in the repository, so verify the displayed Build settings after reconnecting/triggering the deploy.

## Environment variables

Configure these in the Netlify site's environment settings (do not commit actual values):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SITE_URL` set to the deployed HTTPS origin
- Any server-only integration variables required by enabled features, such as LiveKit/translation services

Keep private service credentials server-only. Do not prefix secrets with `NEXT_PUBLIC_`. Rotate credentials that have ever been committed, pasted into chat, or included in an archive.

## Verify after deploy

1. Confirm the deploy used the repository root and the expected commit/archive.
2. Verify homepage, course list, lesson/video page, student dashboard, teacher dashboard, forum, assessment, GeoLab and EcoLab.
3. Verify student/teacher role access and Supabase-backed functionality.
4. Review browser console, Network timings and Netlify function logs for errors.
5. Do not treat a green deploy alone as proof all routes and permissions work.
