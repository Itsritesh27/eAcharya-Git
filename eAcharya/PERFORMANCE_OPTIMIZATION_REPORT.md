# eAcharya Performance Optimization Report

**Date:** 2026-10-21  
**Source:** Latest uploaded `eAcharya_netlify_ready (1).zip`  
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
- Replaced references to the 4K/2K JPEG textures with `/textures/earth-1k-v1.webp` and removed the now-unreferenced JPEG copies from `public/textures`.
- The WebP texture is 114,738 bytes vs. 1,730,457 bytes for the previous desktop 4K JPEG (about **93.4% smaller** for the texture request).
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
| Optimized Earth 1K WebP | 281,800 |
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


## Latest optimization pass (2026-10-21)

### Course-detail query round trips
- `getPublishedCourseBySlug` previously fetched the published course, unit list, then lesson list sequentially (up to three Supabase requests).
- Replaced this with one nested PostgREST query that returns course/unit/lesson data together, sorts units and lessons in memory, and excludes unpublished lessons from the returned course view.
- Query still runs through the authenticated request-scoped Supabase client; RLS remains enabled.

### Delay globe boot until it is near the viewport
- Three.js initialization and texture download now wait until the globe is within a 180px viewport margin, using `IntersectionObserver`.
- The existing SVG illustration remains as the placeholder/fallback; WebGL cleanup, reduced-motion handling, visibility pause and off-screen animation pause remain intact.
- The texture was resized to 1024×512 WebP (`public/textures/earth-1k-v1.webp`, 114,738 bytes). It is appropriate to the 460–520 CSS-pixel hero display with the existing renderer DPR cap of 1.5.
- Removed unreferenced `earth-4k.jpg`, `earth-2k.jpg`, and the superseded `earth-2k.webp`.

### Static texture caching
- Public texture cache policy now uses a one-year immutable cache. The texture file uses a versioned name (`earth-1k-v1.webp`); change the filename/version when changing its contents.

### Web-only packaging
- Removed the Android project folder from this Netlify website ZIP. No Android build is needed for the website deployment.
- Preserved the Next.js app, Supabase migrations, APIs, LiveKit code and all learning features.

## Verification
- Source/asset checks: checked the course query function, new texture reference, and removal of the unused texture files and Android project.
- A dependency install was attempted for typecheck/build validation but did not complete within this environment's execution window; resulting `node_modules` state was incomplete and has been excluded from the ZIP.
- Therefore a full production build, TypeScript checks, route benchmarks and real-device Lighthouse comparisons have **not** been certified here. Run the checks below from the project folder before deploy:

```bash
npm ci
npm run typecheck
npm test
npm run build
```

No live load-time or Lighthouse scores are claimed. The measured byte-size changes refer to local asset file sizes only.


### Additional package/deployment cleanup
- Removed root `capacitor.config.ts` and the generated `tsconfig.tsbuildinfo` cache.
- `android/` and legacy `netlify/` paths remain excluded from TypeScript discovery to guard against stale copies lingering in the connected Git repository.
- `package.json` and lockfile contain no Capacitor dependency; this deliverable is for the Next.js website only.
- Static validation completed: `node --check next.config.mjs` passed; `package.json` and `package-lock.json` parse as valid JSON; new texture reference exists; deleted texture paths are no longer referenced by application source.
