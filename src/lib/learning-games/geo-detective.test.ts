import { describe, expect, it } from "vitest";
import { GEO_DETECTIVE_MISSIONS, scoreGeoAnswer } from "./geo-detective";

describe("Geo Detective missions and scoring", () => {
  it("ships complete missions with valid answer choices", () => {
    expect(GEO_DETECTIVE_MISSIONS).toHaveLength(14);
    for (const mission of GEO_DETECTIVE_MISSIONS) {
      expect(mission.clues).toHaveLength(3);
      expect(mission.choices).toHaveLength(4);
      expect(mission.choices.some((choice) => choice.id === mission.answerId)).toBe(true);
      expect(new Set(mission.choices.map((choice) => choice.id)).size).toBe(4);
      expect(mission.explanation.length).toBeGreaterThan(40);
    }
  });

  it("includes population distribution, density and migration missions", () => {
    const populationMissions = GEO_DETECTIVE_MISSIONS.filter((mission) =>
      /population|migration|urbanisation/i.test(`${mission.chapter} ${mission.title}`),
    );
    expect(populationMissions).toHaveLength(4);
    expect(populationMissions.map((mission) => mission.id)).toEqual(
      expect.arrayContaining([
        "northern-plains-population",
        "himalayan-settlement",
        "desert-population",
        "urban-migration-bengaluru",
      ]),
    );
    for (const mission of populationMissions) {
      expect(mission.objective.length).toBeGreaterThan(10);
      expect(mission.takeaway.length).toBeGreaterThan(40);
      expect(mission.choices.some((choice) => choice.id === mission.answerId)).toBe(true);
    }
  });

  it("awards full points on first try and applies hint and retry deductions", () => {
    expect(scoreGeoAnswer({ usedHint: 0, previousWrongAttempt: false, streak: 0 })).toBe(100);
    expect(scoreGeoAnswer({ usedHint: 1, previousWrongAttempt: false, streak: 0 })).toBe(90);
    expect(scoreGeoAnswer({ usedHint: 0, previousWrongAttempt: true, streak: 0 })).toBe(70);
    expect(scoreGeoAnswer({ usedHint: 2, previousWrongAttempt: true, streak: 0 })).toBe(50);
  });

  it("caps streak bonus and never awards less than fifty for a correct answer", () => {
    expect(scoreGeoAnswer({ usedHint: 0, previousWrongAttempt: false, streak: 99 })).toBe(120);
    expect(scoreGeoAnswer({ usedHint: 9, previousWrongAttempt: true, streak: 0 })).toBe(50);
  });
});
