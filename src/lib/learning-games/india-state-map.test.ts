import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { GEO_DETECTIVE_MISSIONS } from "./geo-detective";
import {
  GEO_FEATURE_ANCHORS,
  INDIA_MAP_VIEWBOX,
  projectIndiaCoordinate,
} from "./india-state-map";

describe("Geo Detective India state map", () => {
  it("ships a standalone, simplified SVG map asset", () => {
    const asset = readFileSync(join(process.cwd(), "public/maps/india-state-boundaries.svg"), "utf8");
    expect(INDIA_MAP_VIEWBOX).toBe("0 0 460 540");
    expect(asset.startsWith("<svg")).toBe(true);
    expect(asset.match(/<path /g)?.length).toBeGreaterThanOrEqual(38);
    expect(asset).toContain("Andaman and Nicobar");
    expect(GEO_FEATURE_ANCHORS["western-ghats"]).toBeDefined();
  });

  it("defines a geographic anchor for every answer choice", () => {
    const missing = GEO_DETECTIVE_MISSIONS.flatMap((mission) =>
      mission.choices.filter((choice) => !GEO_FEATURE_ANCHORS[choice.id]).map((choice) => choice.id),
    );
    expect(missing).toEqual([]);
  });

  it("projects every answer marker inside the SVG map viewport", () => {
    for (const [longitude, latitude] of Object.values(GEO_FEATURE_ANCHORS)) {
      const point = projectIndiaCoordinate(longitude, latitude);
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
      expect(point.x).toBeGreaterThanOrEqual(0);
      expect(point.x).toBeLessThanOrEqual(460);
      expect(point.y).toBeGreaterThanOrEqual(0);
      expect(point.y).toBeLessThanOrEqual(540);
    }
  });
});
