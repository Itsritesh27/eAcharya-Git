# Geo Detective India map data

Geo Detective uses the user-provided `in.json` GeoJSON dataset. Each feature includes `source: https://simplemaps.com` metadata and a state/union-territory name. The 36 state/UT polygon features are simplified with topology-preserving coverage simplification into `public/maps/india-state-boundaries.svg` (about 161 KB uncompressed). The original 3 MB GeoJSON and detailed paths are not embedded in the client JavaScript bundle; the game fetches the SVG as a separately cacheable static asset. The small TypeScript module only contains the projection and feature-marker anchors.

## Projection and markers

The map uses an equirectangular-style projection with a longitude scale correction at 22° latitude to give India a more proportionate portrait silhouette. The source polygons are simplified for display and are not intended for measurement or navigation. A–D markers use representative longitude/latitude anchors for each educational clue; these are point markers, not exact boundaries of a physical feature. Population and migration missions also use approximate city-centre markers for Bengaluru, Mumbai, Delhi and Kolkata. Markers that overlap are nudged slightly on screen for clickability. The original option buttons remain as an accessible fallback.

## Attribution and limitations

Source metadata: [SimpleMaps](https://simplemaps.com), supplied as `in.json` for this project. Confirm the dataset's applicable license/attribution terms before redistributing this app publicly. The source uses some historical administrative display names (for example, Orissa and Uttaranchal); this map displays names on hover via SVG titles rather than presenting them as current visible labels. Boundary geometry and representation are for educational orientation only.
