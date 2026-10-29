# eAcharya Performance Report — Phase 1

**Date:** 2026-10-29  
**Scope:** Static source audit plus low-risk homepage and course-page optimizations. No Supabase schema, RLS, production data, authentication rules, or paid infrastructure changed.

## Summary

This pass applies two changes supported by the inspected source:

1. **Defer the decorative homepage 3D Earth.** Before this change, the homepage imported the `Earth3D` client component directly. The component already delayed its internal `three` import and used an SVG fallback, but its own client module was part of the homepage's client dependency graph. A new `DeferredEarth3D` wrapper now renders the lightweight SVG initially and loads the WebGL component only when the hero nears the viewport and the browser is idle. Mobile, Data Saver, and detected low-memory devices retain the SVG and do not import the Three.js component. The redundant second idle delay inside `Earth3D` was removed.
2. **Remove a course-page request waterfall.** After the course and viewer are known, enrolment IDs, completed lesson IDs, and published course resources are independent reads. They previously loaded enrolment/progress in parallel, then waited before issuing the resources request. These now start together with `Promise.all`.
3. **Add targeted timing labels.** With `PERF_LOG=1`, the course route now logs the cached/uncached course-data duration plus enrolment IDs, completed lessons, and published resources timings. This helps separate measured backend wait from assumptions.
4. **Remove existing dead code and lint blockers found during validation.** Removed an unused button import and an unused single-text translation helper (the active batch translation path remains), removed an unused market-equilibrium calculation from the game screen, escaped JSX apostrophes, and corrected the translation reset effect dependency. No runtime feature path was removed; the single-text helper was never called.

## Static baseline (not runtime measurements)

| Item | Observation |
|---|---|
| App routes | 71 `page.tsx` files under `src/app` |
| TypeScript source | 400 `.ts` / `.tsx` files under `src` after this change |
| `public/` size | Approximately 516 KB in this archive |
| Earth texture | `public/textures/earth-2k.webp`, approximately 276 KB |
| Geographic boundary data | `public/data/world-countries-110m.geojson`, approximately 224 KB |
| Large/specialized dependencies | `three`, `leaflet`, LiveKit client/components, `lucide-react` |

The inspected code already dynamically imports Three.js from the Earth component, Leaflet maps with `next/dynamic({ ssr: false })`, and LiveKit only on the live-room route. Those patterns were preserved. The codebase also already has auth timing helpers, request-scoped cache for course detail reads, and public asset cache headers.

## Measurement status

No valid before/after Lighthouse, Core Web Vitals, browser waterfall, production TTFB, or live Supabase request timings were available during this run. No production URL was provided to the tooling, and a production browser session was not available. The changes above are evidence-based optimizations, but the amount of real-world improvement remains **unmeasured**.

## Validation performed

- `node --check next.config.mjs`: passed.
- `node --check scripts/build-boundaries.mjs`: passed.
- TypeScript compiler parser pass over all **400** `.ts` / `.tsx` source files: no syntax parse errors.
- ESLint over `src`: completed with **0 errors and 1 warning**. Remaining warning is the intentional lazy `<img>` used for user-posted Supabase Storage attachments in `src/components/forum/forum-content.tsx`; swapping this to Next Image needs care because URLs are supplied by the configured Supabase origin and image optimization may add server work.
- `npm ci --no-audit --no-fund`: did not complete before environment timeout. The environment was running Node `22.16.0`, while the repository `.nvmrc` pins `22.22.0`; npm also reported that a transitive `machina` package requires Node `>=22.22`.
- `tsc --noEmit` was attempted using the dependency snapshot available in the environment but failed: modules `three`, `@livekit/components-react`, and `livekit-server-sdk` were missing; existing forum test files also use the obsolete category literal `"climate"` where the current type only allows `"general"`. No type diagnostics were reported in the new deferred wrapper, course-page change, curriculum change, Market Master cleanup, translation route cleanup, or attachment uploader cleanup. `earth-3d.tsx` itself reports the unresolved `three` module because that dependency is absent from the available snapshot.
- Vitest could not start because the available dependency snapshot lacks `@rollup/rollup-linux-x64-gnu` (a platform-specific optional dependency). The current environment also lacks a complete Next.js executable/SWC setup, so the production build was not verified. This is **not** a passing typecheck/test/build claim.

## Reproduce timings on your local machine

Use Node `22.22.0` or a compatible newer release, then from the project root:

```powershell
npm ci
npm run typecheck
npm run lint
npm test
npm run build
```

For the existing server timing helper, add `PERF_LOG=1` to `.env.local`, then restart the application. In PowerShell:

```powershell
npm run build
npm run start
```

Open the course listing and a course detail page and inspect the terminal's `[perf]` entries. Remove `PERF_LOG=1` after diagnosis. Do not paste `.env.local` contents into chat or commit them.

For real-user page measurements, run Chrome Lighthouse on the same deployment/device/network for homepage, course listing, course detail, lesson/video, student dashboard, teacher dashboard, GeoLab, and EcoLab. In DevTools → Network, record slow Fetch/XHR request Timing separately from document/JS/image/video loading. Compare the same routes before and after the deployed commit.

## Remaining work / risks

- The 3D globe may appear later on capable desktop devices while the SVG is shown first; this is intentional and gives the page content first priority. The interactive globe remains available once loaded.
- Database indexes, RLS policies, plan/compute upgrades, and schema changes were deliberately left untouched. The prior cumulative `pg_stat_statements` output included migration and metadata statements, so it was not reliable evidence for adding indexes or upgrading Supabase.
- If the site remains slow after these changes, capture the Network waterfall and actual runtime `[perf]` timings before making more changes.
- Validate whether `src/lib/forum/categories.test.ts` and `src/lib/forum/data.test.ts` should be updated to the current class-wise forum model before treating typecheck as clean.
