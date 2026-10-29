# Architecture overview

## Stack

- Next.js App Router (React 19) and TypeScript
- Tailwind CSS with the shared brand/forest/sage/sand design tokens in `tailwind.config.ts`
- Supabase Auth, PostgreSQL, Storage, RLS and RPCs
- Netlify deployment configured by root `netlify.toml` (Node.js 22.22+)
- Vitest for unit tests; ESLint and TypeScript checks through npm scripts

## Project map

- `src/app/`: route entry points, layouts, loading/error boundaries and route handlers
- `src/components/`: shared UI and feature components
- `src/lib/`: server/client integration, validation, domain logic and game rules
- `public/`: public assets and geography datasets (do not put private files here)
- `supabase/migrations/`: SQL migrations; review history before applying to a remote project
- `supabase/seed.sql`: development seed data; do not treat sample content as real curriculum
- `android/`: separate Capacitor/Android companion project; not part of the Next.js web bundle
- `docs/`: maintained setup, feature, security, deployment and release documentation

## Performance principles

- Keep route-specific heavy features behind route-level/dynamic imports where practical.
- Keep maps, 3D, live video and chart dependencies out of unrelated first-load routes.
- Do not fetch all lessons/resources at once; page large lists.
- Prefer local computation for transient game interactions; persist meaningful completed attempts rather than every slider move.
- Never cache private student/teacher responses across users.
- Use real browser and production-build measurements before deciding which dependency or database query to optimize.
