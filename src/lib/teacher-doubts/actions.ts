"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const BUCKET = "teacher-doubt-attachments";
const generic = "We could not save this doubt. Please check the database migration and try again.";
const questionSchema = z.object({
  courseId: z.string().uuid(),
  lessonId: z.string().uuid(),
  timestampSeconds: z.number().int().min(0).max(86400).nullable(),
  title: z.string().trim().min(5).max(200),
  body: z.string().trim().min(10).max(10000),
  attachmentPaths: z.array(z.string().min(1).max(500)).max(5).default([]),
});
const replySchema = z.object({ id: z.string().uuid(), reply: z.string().trim().min(1).max(10000) });

function first<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export type DoubtActionResult = { ok: true } | { ok: false; error: string };

export async function createTeacherDoubtAction(input: unknown): Promise<DoubtActionResult> {
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a title (5–200 characters) and question (10–10,000 characters)." };
  if (!isSupabaseConfigured()) return { ok: false, error: "The learning platform is not connected to Supabase." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again to send a private doubt." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "student") {
    return { ok: false, error: "Only student accounts can send a private doubt." };
  }
  if (parsed.data.attachmentPaths.some((path) => !path.startsWith(`${user.id}/`)) || new Set(parsed.data.attachmentPaths).size !== parsed.data.attachmentPaths.length) {
    return { ok: false, error: "One of the attachments is invalid. Please attach the files again." };
  }

  const { data: lessonRow, error: lessonError } = await supabase
    .from("lessons")
    .select("id, unit:units(course_id, course:courses(id, status))")
    .eq("id", parsed.data.lessonId)
    .maybeSingle();
  if (lessonError || !lessonRow) return { ok: false, error: "This lesson is no longer available." };
  const lesson = lessonRow as unknown as { id: string; unit: { course_id: string; course: { id: string; status: string } | { id: string; status: string }[] | null } | { course_id: string; course: { id: string; status: string } | { id: string; status: string }[] | null }[] | null };
  const unit = first(lesson.unit);
  const course = first(unit?.course);
  if (!unit || !course || unit.course_id !== parsed.data.courseId || course.id !== parsed.data.courseId || course.status !== "published") {
    return { ok: false, error: "Ask a question from a lesson in a published course." };
  }

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user.id)
    .eq("course_id", parsed.data.courseId)
    .maybeSingle();
  if (!enrollment) return { ok: false, error: "Enrol in this course before sending a private doubt." };

  const { data: courses, error: coursesError } = await supabase.rpc("student_teacher_courses");
  if (coursesError || !Array.isArray(courses)) return { ok: false, error: "Private doubts are not set up yet. Please contact the site administrator." };
  const teacherCourse = (courses as { course_id: string; teacher_id: string }[]).find((c) => c.course_id === parsed.data.courseId);
  if (!teacherCourse?.teacher_id) return { ok: false, error: "No teacher is assigned to this published course yet." };

  const { error } = await supabase.from("teacher_doubts").insert({
    student_id: user.id,
    teacher_id: teacherCourse.teacher_id,
    course_id: parsed.data.courseId,
    lesson_id: parsed.data.lessonId,
    timestamp_seconds: parsed.data.timestampSeconds,
    question_title: parsed.data.title,
    question_body: parsed.data.body,
    attachment_paths: parsed.data.attachmentPaths,
  });
  if (error) {
    if (parsed.data.attachmentPaths.length) await supabase.storage.from(BUCKET).remove(parsed.data.attachmentPaths);
    if (error.code === "42501") return { ok: false, error: "You do not have permission to send this private doubt." };
    if (error.code === "42P01" || error.code === "PGRST202") return { ok: false, error: "Private doubts are not set up yet. Apply the eAcharya repair migration in Supabase." };
    return { ok: false, error: error.code === "23514" ? (error.message || "One of the question fields is invalid.") : generic };
  }

  revalidatePath(`/tutorials/${parsed.data.lessonId}`);
  revalidatePath("/dashboard/teacher/doubts");
  return { ok: true };
}

export async function replyTeacherDoubtAction(input: unknown): Promise<DoubtActionResult> {
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Write a reply between 1 and 10,000 characters." };
  if (!isSupabaseConfigured()) return { ok: false, error: "The learning platform is not connected to Supabase." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again to reply." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== "teacher") return { ok: false, error: "Only the assigned teacher can reply." };

  const { data, error } = await supabase
    .from("teacher_doubts")
    .update({ teacher_reply: parsed.data.reply, replied_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("teacher_id", user.id)
    .select("id, lesson_id")
    .maybeSingle();
  if (error) {
    if (error.code === "42501") return { ok: false, error: "You can only reply to doubts assigned to you." };
    return { ok: false, error: error.code === "42P01" ? "Private doubts are not set up yet. Apply the eAcharya repair migration in Supabase." : generic };
  }
  if (!data) return { ok: false, error: "This private doubt was not found in your inbox." };

  const row = data as { id: string; lesson_id: string | null };
  if (row.lesson_id) revalidatePath(`/tutorials/${row.lesson_id}`);
  revalidatePath("/dashboard/teacher/doubts");
  return { ok: true };
}
