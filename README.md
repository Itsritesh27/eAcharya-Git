# eAcharya — Geography Learning Platform

eAcharya is a Next.js 15 / React 19 learning platform for Classes 9–12. It uses TypeScript, Tailwind CSS and Supabase for authentication, PostgreSQL, Storage and Row Level Security. The canonical web app is this repository root.

## Quick start

Prerequisites: Node.js 22.22+ and npm.

```bash
cp .env.example .env.local
npm ci
npm run dev
```

On Windows PowerShell, use `Copy-Item .env.example .env.local` for the first command. Fill in the public Supabase URL and publishable key in `.env.local`; never place a service-role/secret key in the browser or commit local secrets. Open <http://localhost:3000>.

## Useful scripts

```bash
npm run dev        # local development
npm run typecheck  # TypeScript checks
npm run lint       # ESLint
npm test           # Vitest tests
npm run build      # production build
```

## Main areas

- Student learning: courses, lessons, video, transcript, notes, resources, progress and bookmarks.
- Teacher tools: course/lesson management, assessments, grading, analytics and student doubts.
- Class-wise discussion forum with moderation and attachments.
- GeoLab: map and geography practical activities plus **Geo Detective**.
- EcoLab: economics learning activities plus **Market Master**.
- Live classes, multilingual learning and administrator tools.

## Deployment and database safety

- The root `netlify.toml` is the deployment config. Set Netlify's **Base directory to blank/root** unless you deliberately maintain a monorepo. The old nested duplicate app has been removed to avoid building a stale copy.
- Read [Deployment](docs/DEPLOYMENT.md), [Database & security](docs/DATABASE_AND_SECURITY.md), and [Performance](docs/PERFORMANCE.md) before production changes.
- Do **not** run `supabase db push`, `db reset`, or new SQL migrations on production until the local migration list has been reconciled with the remote migration history. Existing Supabase data is not included in this repository.
- A present route or successful static check is not proof of live production readiness. Run the verification checklist in [Performance & release checks](docs/PERFORMANCE.md).

## Documentation

- [Local setup](docs/LOCAL_SETUP.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Features](docs/FEATURES.md)
- [Database & security](docs/DATABASE_AND_SECURITY.md)
- [Performance & release checks](docs/PERFORMANCE.md)
- [Change summary](docs/CHANGELOG.md)
