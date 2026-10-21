import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ClassRow, CourseRow, LessonRow, UnitRow } from "@/types/app";

/**
 * Read helpers. All queries run as the current user (or anon), so RLS decides
 * what is visible. These functions return empty results on any failure so pages
 * can show honest empty states instead of crashing.
 */

export async function getActiveClasses(): Promise<ClassRow[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("classes")
    .select("id, grade, name, description, is_active")
    .eq("is_active", true)
    .order("grade", { ascending: true });
  return (data ?? []) as ClassRow[];
}

export type CourseWithClass = CourseRow & {
  class: Pick<ClassRow, "grade" | "name"> | null;
  subject?: { name: string; slug?: string } | null;
  units?: { id: string; lessons: { id: string; is_published: boolean }[] }[];
};

/** Counts of units and PUBLISHED lessons for a course loaded with nested units/lessons. */
export function courseCounts(course: CourseWithClass) {
  const units = course.units ?? [];
  const lessonIds = units.flatMap((u) => u.lessons.filter((l) => l.is_published).map((l) => l.id));
  return { unitCount: units.length, lessonCount: lessonIds.length, lessonIds };
}

export const COURSE_LIST_SELECT =
  "id, title, slug, description, class_id, subject_id, thumbnail_url, status, created_by, created_at, updated_at, class:classes!inner(grade, name), subject:subjects(name, slug), units(id, lessons(id, is_published))";

export async function getPublishedCourses(grade?: number, subject?: string): Promise<CourseWithClass[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  let query = supabase
    .from("courses")
    .select(COURSE_LIST_SELECT)
    .eq("status", "published")
    .order("title");
  if (grade) query = query.eq("class.grade", grade);

  const { data } = await query;
  const rows = (data ?? []) as unknown as CourseWithClass[];
  // The course list is small, so the subject filter runs here instead of adding an inner join to the shared select.
  return subject ? rows.filter((c) => c.subject?.slug === subject) : rows;
}

export interface CourseDetail {
  course: CourseWithClass;
  units: (UnitRow & { lessons: LessonRow[] })[];
}

export const getPublishedCourseBySlug = cache(async (slug: string): Promise<CourseDetail | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();

  // Fetch the course, ordered curriculum and lessons in one PostgREST request.
  // The previous implementation made up to three sequential round trips before
  // the page could render. RLS remains active because this uses the request user.
  const { data: course } = await supabase
    .from("courses")
    .select(
      "id, title, slug, description, class_id, subject_id, thumbnail_url, status, created_by, created_at, updated_at, class:classes(grade, name), subject:subjects(name), units(id, course_id, title, description, position, lessons(id, unit_id, title, description, position, is_published))",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!course) return null;

  type NestedUnit = UnitRow & { lessons: LessonRow[] };
  const courseRow = course as unknown as CourseWithClass & { units?: NestedUnit[] };
  const units = [...(courseRow.units ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((unit) => ({
      ...unit,
      // Keep draft lessons out of the published course view even if a role's
      // RLS policy permits reading them.
      lessons: [...(unit.lessons ?? [])]
        .filter((lesson) => lesson.is_published)
        .sort((a, b) => a.position - b.position),
    }));

  return { course: courseRow, units };
});
