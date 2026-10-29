// Map projection and feature anchors for the user-provided India boundary dataset (source metadata: SimpleMaps).
// Representative clue anchors are for educational interaction, not the exact extent of physical features.
export const INDIA_MAP_VIEWBOX = "0 0 460 540";
export const INDIA_MAP_PROJECTION = {
  cosLatitude: 0.927183854567, minProjectedX: 63.221188977993, maxLatitude: 37.078268147904, scale: 15.499698989267, offsetX: 20.000000000000, offsetY: 34.993468271379,
} as const;
export type MapCoordinate = { x: number; y: number };
export function projectIndiaCoordinate(longitude: number, latitude: number): MapCoordinate {
  const projection = INDIA_MAP_PROJECTION;
  return { x: projection.offsetX + (longitude * projection.cosLatitude - projection.minProjectedX) * projection.scale, y: projection.offsetY + (projection.maxLatitude - latitude) * projection.scale };
}
export const GEO_FEATURE_ANCHORS: Record<string, readonly [number, number]> = {
  "aravalli": [
    74.7,
    26.0
  ],
  "western-ghats": [
    75.1,
    15.0
  ],
  "eastern-ghats": [
    82.1,
    16.5
  ],
  "himalayas": [
    80.0,
    31.1
  ],
  "thar-desert": [
    71.4,
    27.5
  ],
  "indian-desert": [
    71.5,
    27.2
  ],
  "northern-plains": [
    81.0,
    26.5
  ],
  "deccan-plateau": [
    77.7,
    17.6
  ],
  "coastal-plains": [
    80.5,
    16.8
  ],
  "brahmaputra-valley": [
    92.6,
    26.2
  ],
  "narmada": [
    76.7,
    22.7
  ],
  "ganga": [
    83.0,
    25.3
  ],
  "godavari": [
    80.8,
    17.5
  ],
  "brahmaputra": [
    92.3,
    26.0
  ],
  "kaveri": [
    78.6,
    11.6
  ],
  "western-coastal-plains": [
    74.0,
    15.0
  ],
  "eastern-coastal-plains": [
    82.0,
    16.0
  ],
  "kerala-monsoon": [
    76.4,
    10.4
  ],
  "punjab-plains": [
    75.6,
    30.8
  ],
  "eastern-coast": [
    82.2,
    15.3
  ],
  // Approximate city-centre markers for the population/migration missions.
  "bengaluru": [77.5946, 12.9716],
  "mumbai": [72.8777, 19.0760],
  "delhi": [77.1025, 28.7041],
  "kolkata": [88.3639, 22.5726]
};
