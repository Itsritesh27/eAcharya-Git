# Local setup

## Prerequisites

- Node.js 22.22+
- npm (use the committed `package-lock.json`)
- Access to an existing Supabase project, or a local Supabase stack if you intentionally want one

## Run the web app locally

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Use your project's public/publishable key. Never use `service_role` or a secret key in a `NEXT_PUBLIC_` variable.
3. Install exact locked dependencies and start the app:

   ```bash
   npm ci
   npm run dev
   ```

4. Open <http://localhost:3000>.
5. In Supabase Authentication → URL Configuration, add `http://localhost:3000/auth/callback` while preserving the existing production callback URL.

PowerShell copy command: `Copy-Item .env.example .env.local`.

## Production-mode local verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run start
```

`npm run start` expects a successful production build. Do not use the development server as the sole speed benchmark.

## Protect production data

Local code changes do not require recreating Supabase tables. Do not run `supabase db reset` against production. Before applying migrations, review [Database & security](DATABASE_AND_SECURITY.md). Keep `.env.local` out of ZIPs, source control and chat messages.
