# eAcharya — Netlify Web-Only Package

## Changes made
- Removed `capacitor.config.ts`, which imported `@capacitor/cli` and caused the reported Next.js TypeScript build failure.
- Removed the `android/` native project folder because this package is intended only for Netlify website hosting.
- Removed `.env.local` from the ZIP to avoid distributing local secrets. Configure required values in Netlify Site configuration instead.
- Removed generated TypeScript incremental build cache (`*.tsbuildinfo`).
- Preserved the Next.js source, Supabase migrations/configuration, package manifest/lockfile, and existing features.
- Kept the root `netlify.toml` using `npm run build` and the Next.js runtime plugin.

## Deploy
1. Extract this ZIP.
2. Use the project root containing `package.json` and `netlify.toml` as Netlify's base directory (if uploading the contents of this folder, the base directory is the site root).
3. Set these environment variables in Netlify if your app uses them:
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `LIVEKIT_API_KEY`
   - `LIVEKIT_API_SECRET`
   - `LIVEKIT_URL`
4. Push the extracted project contents to the Git branch connected to Netlify, ensuring deleted files are also removed from the repository, or upload the folder as a new deploy where supported.
5. Trigger a fresh deploy and inspect the build log.

## Verification
The archive was inspected and the Capacitor configuration, Android folder, local environment file, and TypeScript build cache are absent. A full production build was not run here, so deployment success is not guaranteed until Netlify completes `npm run build`.
