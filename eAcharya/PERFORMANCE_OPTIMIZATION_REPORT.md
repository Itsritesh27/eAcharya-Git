# eAcharya Performance Optimization Report

**Date:** 2026-10-21  
**Source:** Latest uploaded `eAcharya_repaired_full(3).zip`  
**Scope:** Incremental optimization of the existing Next.js 15 / React 19 / Supabase project. Existing lesson video-with-doubts, forum, assessment, Geography Lab, Economics Lab, live-class and Supabase code was retained.

## Changes implemented

### 1. Reduce unnecessary Supabase Auth requests
- Middleware now detects whether a Supabase auth cookie is present before constructing a server client and calling `auth.getUser()`.
- Anonymous visits to public pages skip the Auth network round trip. Anonymous visits to `/dashboard...` still redirect to sign-in.
- Server auth helpers (`getSessionProfile`, `getViewer`, and `isSignedIn`) also short-circuit when no SSR auth cookie is present, avoiding empty-session Auth calls on lesson guards and public pages. If cookie inspection is unavailable, they fall back to normal server validation.
- When an auth cookie exists, normal server-side token validation and session-cookie refresh remain in place.
- Server guards and database RLS continue to enforce access; browser state is not used for authorization.

### 2. Keep public navigation independent of server authentication
- `SiteHeader` is now a synchronous server-rendered navigation component.
- Auth-dependent dashboard/sign-in buttons and the mobile menu are handled by a small client component, `site-header-actions.tsx`.
- The Supabase browser client is dynamically imported only when the browser sees an auth cookie. Its session is used only to select display links; protected pages and actions retain server-side authorization.

### 3. Reduce homepage globe payload and GPU work
- Replaced references to the 4K/2K JPEG textures with `/textures/earth-2k.webp` and removed the now-unreferenced JPEG copies from `public/textures`.
- The WebP texture is 281,800 bytes vs. 1,730,457 bytes for the previous desktop 4K JPEG (about **83.7% smaller** for the texture request).
- The globe caps renderer pixel ratio at 1.5, caps anisotropy, reduces sphere geometry detail slightly, and uses a safe CSS canvas size.
- Animation frames are stopped when the globe is outside the viewport or the tab is hidden. Reduced-motion users get a still globe that redraws when needed.
- Added cleanup for WebGL resources, observers, event listeners and animation frames. The existing SVG fallback remains.

### 4. Reduce duplicate and oversized course data reads
- Wrapped `getPublishedCourseBySlug` in React request-scoped `cache()` so repeated reads in a render request can be deduplicated, including common metadata/page reuse.
- The lesson-page enrollment check now queries only the current course instead of loading all course enrollment IDs for that user.
- User-specific lesson progress, bookmarks, notes, grades, attempts and discussions are not placed in shared public caches.

### 5. Cache public static files
- Added browser caching rules for public `/textures/*` and `/data/*` assets using `Cache-Control: public, max-age=86400, stale-while-revalidate=604800`.
- Expanded the middleware matcher exclusions for common public static file types, including GeoJSON and font assets. Server-side access checks remain required for private routes and actions.

## Static asset size comparison

| Public asset set | Bytes |
|---|---:|
| Previous Earth 4K JPG | 1,730,457 |
| Previous Earth 2K JPG | 475,088 |
| Optimized Earth 2K WebP | 281,800 |
| Net change across the `public` directory* | Approximately 79% smaller |

\*Before: the two Earth JPEGs plus the existing GeoJSON and attribution file. After: the optimized WebP plus the same GeoJSON and attribution file. This comparison covers uncompressed source asset sizes, not transfer sizes after Netlify compression or a live page's total payload.

## Verification performed

- `node --check next.config.mjs`: passed.
- TypeScript/TSX parser syntax checks on the eight changed TypeScript files: passed.
- Asset/reference inspection: passed; the globe points to the WebP texture and no active source references the removed Earth JPEGs.
- ZIP integrity is checked after packaging.

## Verification blocked

- `npm ci` could not complete because npm registry requests failed with DNS error `EAI_AGAIN`.
- `npm test` could not start because `vitest` was not installed.
- `npm run build` could not start because `next` was not installed.
- `tsc --noEmit` could not type-check the project because dependency type definitions were absent in the incomplete install.
- No live production URL, Lighthouse run, browser network waterfall, or Supabase query plan was available. Therefore no claim is made that real-world LCP, TTFB, INP or database latency has been measured or improved.

## Before deployment

On a machine with registry access, run:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

Then test sign-in/sign-out, student and teacher permissions, lesson video playback and timestamped doubts, discussion attachment uploads, assessments, Geography Lab, live classes, and mobile navigation. Deploy only after the build and functional checks pass. No migrations were added, edited or applied, and no RLS policy or environment secret was changed by these performance edits.
