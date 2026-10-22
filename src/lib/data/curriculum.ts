import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient, CURRICULUM_TAG, CURRICULUM_TTL } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { ClassRow, CourseRow, LessonRow, UnitRow } from "@/types/app";

/**
 * Read helpers. All queries run as the current user (or anon), so RLS decides
 * what is visible. These functions return empty results on any failure so pages
 * can show honest empty states instead of crashing.
 */

async function loadActiveClasses(): Promise<ClassRow[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("classes")
    .select("id, grade, name, description, is_active")
    .eq("is_active", true)
    .order("grade", { ascending: true });
  if (error) throw new Error(`classes: ${error.message}`); // thrown errors are never cached
  return (data ?? []) as ClassRow[];
}

const cachedActiveClasses = unstable_cache(loadActiveClasses, ["active-classes"], {
  tags: [CURRICULUM_TAG],
  revalidate: CURRICULUM_TTL,
});

export async function getActiveClasses(): Promise<ClassRow[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    return await cachedActiveClasses();
  } catch (err) {
    console.error("[curriculum] getActiveClasses failed:", err);
    return [];
  }
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

async function loadPublishedCourses(grade?: number): Promise<CourseWithClass[]> {
  const supabase = createPublicClient();

  let query = supabase
    .from("courses")
    .select(COURSE_LIST_SELECT)
    .eq("status", "published")
    .order("title");
  if (grade) query = query.eq("class.grade", grade);

  const { data, error } = await query;
  if (error) throw new Error(`courses: ${error.message}`); // thrown errors are never cached
  return (data ?? []) as unknown as CourseWithClass[];
}

const cachedPublishedCourses = unstable_cache(loadPublishedCourses, ["published-courses"], {
  tags: [CURRICULUM_TAG],
  revalidate: CURRICULUM_TTL,
});

export async function getPublishedCourses(grade?: number, subject?: string): Promise<CourseWithClass[]> {
  if (!isSupabaseConfigured()) return [];
  let rows: CourseWithClass[];
  try {
    rows = await cachedPublishedCourses(grade);
  } catch (err) {
    console.error("[curriculum] getPublishedCourses failed:", err);
    return [];
  }
  // The course list is small, so the subject filter runs here instead of adding an inner join to the shared select.
  return subject ? rows.filter((c) => c.subject?.slug === subject) : rows;
}

export interface CourseDetail {
  course: CourseWithClass;
  units: (UnitRow & { lessons: LessonRow[] })[];
}

async function loadPublishedCourseBySlug(slug: string): Promise<CourseDetail | null> {
  const supabase = createPublicClient();

  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select(
      "id, title, slug, description, class_id, subject_id, thumbnail_url, status, created_by, created_at, updated_at, class:classes(grade, name), subject:subjects(name)",
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (courseError) throw new Error(`course: ${courseError.message}`);
  if (!course) return null;

  const courseRow = course as unknown as CourseWithClass;

  const { data: units, error: unitsError } = await supabase
    .from("units")
    .select("id, course_id, title, description, position")
    .eq("course_id", courseRow.id)
    .order("position");
  // Throw instead of treating a failed query as "no chapters": an empty result would otherwise
  // be cached (unstable_cache) and the whole syllabus would vanish for students until it expires.
  if (unitsError) throw new Error(`units: ${unitsError.message}`);

  const unitRows = (units ?? []) as UnitRow[];
  const unitIds = unitRows.map((u) => u.id);

  let lessonRows: LessonRow[] = [];
  if (unitIds.length > 0) {
    const { data: lessons, error: lessonsError } = await supabase
      .from("lessons")
      .select("id, unit_id, title, description, position, is_published")
      .in("unit_id", unitIds)
      .eq("is_published", true)
      .order("position");
    if (lessonsError) throw new Error(`lessons: ${lessonsError.message}`);
    lessonRows = (lessons ?? []) as LessonRow[];
  }

  return {
    course: courseRow,
    units: unitRows.map((u) => ({ ...u, lessons: lessonRows.filter((l) => l.unit_id === u.id) })),
  };
}

const cachedCourseBySlug = unstable_cache(loadPublishedCourseBySlug, ["published-course-by-slug"], {
  tags: [CURRICULUM_TAG],
  revalidate: CURRICULUM_TTL,
});

export const getPublishedCourseBySlug = cache(async (slug: string): Promise<CourseDetail | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    return await cachedCourseBySlug(slug);
  } catch (err) {
    console.error("[curriculum] getPublishedCourseBySlug failed:", err);
    return null;
  }
});