/**
 * Subjects offered on the platform. The `subjects` table in the database is the source of truth for course content;
 * this list only drives navigation, filters and labels, so its slugs must match the `slug` column of `subjects`.
 */
export const SUBJECTS = [
  { slug: "geography", name: "Geography", lab: { href: "/geography-lab", label: "Geography Lab" } },
  { slug: "economics", name: "Economics", lab: { href: "/economics-lab", label: "Economics Lab" } },
] as const;

export type SubjectSlug = (typeof SUBJECTS)[number]["slug"];

/** Accepts only a known subject slug from a query string; anything else means "all subjects". */
export function parseSubject(value: string | undefined): SubjectSlug | undefined {
  return SUBJECTS.find((s) => s.slug === value)?.slug;
}

export function subjectName(slug: SubjectSlug): string {
  return SUBJECTS.find((s) => s.slug === slug)?.name ?? slug;
}

export function coursesHref(f: { grade?: number; subject?: SubjectSlug }): string {
  const p = new URLSearchParams();
  if (f.subject) p.set("subject", f.subject);
  if (f.grade) p.set("grade", String(f.grade));
  const s = p.toString();
  return s ? `/courses?${s}` : "/courses";
}
