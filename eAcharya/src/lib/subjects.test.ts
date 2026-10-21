import { describe, expect, it } from "vitest";
import { SUBJECTS, coursesHref, parseSubject, subjectName } from "./subjects";

describe("subjects", () => {
  it("accepts only known subject slugs", () => {
    expect(parseSubject("economics")).toBe("economics");
    expect(parseSubject("geography")).toBe("geography");
    for (const bad of [undefined, "", "Economics", "maths", "economics;drop"]) expect(parseSubject(bad)).toBeUndefined();
  });
  it("has unique slugs and readable names", () => {
    expect(new Set(SUBJECTS.map((s) => s.slug)).size).toBe(SUBJECTS.length);
    expect(subjectName("economics")).toBe("Economics");
  });
  it("builds course hrefs", () => {
    expect(coursesHref({})).toBe("/courses");
    expect(coursesHref({ grade: 11 })).toBe("/courses?grade=11");
    expect(coursesHref({ subject: "economics", grade: 12 })).toBe("/courses?subject=economics&grade=12");
  });
});
