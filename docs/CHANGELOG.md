# Change summary

## Repository hygiene and UI consistency

- Made repository root the single canonical Next.js web app and removed the stale nested `netlify/` duplicate.
- Consolidated 25+ legacy top-level implementation/status Markdown files into maintained docs under `docs/`.
- Removed duplicate `gitignore`/`gitattributes` aliases and `tsconfig.tsbuildinfo`.
- Removed unused root JPEG Earth textures; retained the referenced WebP.
- Normalized local Supabase migration filenames to avoid duplicate version numbers; production migration history still requires manual reconciliation.
- Standardized Market Master colors on the same shared green/forest/sage palette used by the rest of eAcharya.
- Added deployment, architecture, features, database/security and performance guidance.

## Existing games retained

- Geo Detective: `/geography-lab/geo-detective`
- Market Master: `/economics-lab/market-master`

Both games continue to store best scores locally in the browser; they do not currently sync game scores to Supabase.

## Geo Detective map refresh
- Replaced the cartoon/schematic India silhouette with a static SVG rendered from the provided India state/UT GeoJSON.
- Simplified the boundary geometry for display and moved it into `public/maps/india-state-boundaries.svg` so 100+ KB of paths are fetched as a cacheable image asset instead of being embedded in the route's JavaScript.
- Repositioned answer markers using longitude/latitude anchors; close markers receive small visual offsets to improve tap targets. Choice buttons remain as an accessible alternative.
- Added map-data attribution/limitations documentation and tests for SVG availability, clue-anchor coverage and projection bounds.
- Validation: changed files pass ESLint. Full Vitest cannot currently start in this environment because `@rollup/rollup-linux-x64-gnu` is missing from the provided partial `node_modules`. Full project typecheck still reports existing unrelated errors in LiveKit dependencies/forum test fixtures.


## Geo Detective population missions
- Added four map-linked missions covering dense settlement in the Northern Plains, settlement constraints in high Himalayan areas, water scarcity and settlement in the Indian Desert, and employment-led migration to Bengaluru.
- Added approximate map anchors for Bengaluru, Mumbai, Delhi and Kolkata so the migration mission uses the same map interaction as existing missions.
- Made mission totals, score cap and progress labels derive from the mission dataset, and separated the new best-score key from previous 10-mission scores.
- Population explanations are qualitative and note local variation; they avoid hard-coded population counts or presenting illustrative map markers as exact spatial extents.
