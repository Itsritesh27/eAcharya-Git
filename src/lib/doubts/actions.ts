"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const uuid = z.string().uuid();
const titleSchema = z.string().trim().min(5, "Enter a title of at least 5 characters.").max(200, "Keep the title under 200 characters.");
const bodySchema = z.string().trim().min(10, "Describe your doubt in at least 10 characters.").max(10000, "Keep the question under 10,000 characters.");

export type DoubtActionResult = { ok: true; id?: string } | { ok: false; error: string };

async function userContext(expectedRole: "student" | "teacher") {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if ((profile as { role?: string } | null)?.role !== expectedRole) return null;
  return { supabase, userId: user.id };
}

export async function createTeacherDoubtAction(input: unknown): Promise<DoubtActionResult> {
  const parsed = z.object({
    courseId: uuid,
    lessonId: uuid.nullable().optional(),
    timestampSeconds: z.number().int().min(0).max(86400).nullable().optional(),
    title: titleSchema,
    body: bodySchema,
  }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the question and try again." };
  const ctx = await userContext("student");
  if (!ctx) return { ok: false, error: "Please sign in with a student account to send a private doubt." };

  const { data: course, error: courseError } = await ctx.supabase
    .from("courses")
    .select("id, created_by, status")
    .eq("id", parsed.data.courseId)
    .eq("status", "published")
    .maybeSingle();
  if (courseError || !course || !course.created_by) {
    return { ok: false, error: "Choose a published course that has a teacher assigned." };
  }

  const { data, error } = await ctx.supabase.from("teacher_doubts").insert({
    student_id: ctx.userId,
    teacher_id: course.created_by,
    course_id: course.id,
    lesson_id: parsed.data.lessonId ?? null,
    timestamp_seconds: parsed.data.timestampSeconds ?? null,
    question_title: parsed.data.title,
    question_body: parsed.data.body,
  }).select("id").single();

  if (error || !data) {
    if (error?.code === "42P01" || error?.code === "PGRST205") {
      return { ok: false, error: "Private doubts are not set up yet. Apply the latest Supabase migration first." };
    }
    if (error?.code === "42501") return { ok: false, error: "You can send private doubts only to the teacher of a published course." };
    if (error?.code === "23514") return { ok: false, error: error.message?.includes("Choose a published course") ? error.message : "Check the selected course and question, then try again." };
    return { ok: false, error: "Your private doubt could not be sent. Please try again." };
  }

  revalidatePath("/dashboard/student/doubts");
  revalidatePath("/dashboard/teacher/doubts");
  return { ok: true, id: (data as { id: string }).id };
}

export async function replyToTeacherDoubtAction(input: unknown): Promise<DoubtActionResult> {
  const parsed = z.object({ id: uuid, reply: z.string().trim().min(1, "Write a reply first.").max(10000, "Keep the reply under 10,000 characters.") }).safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the reply and try again." };
  const ctx = await userContext("teacher");
  if (!ctx) return { ok: false, error: "Please sign in with the assigned teacher account to reply." };

  const { data, error } = await ctx.supabase.from("teacher_doubts")
    .update({ teacher_reply: parsed.data.reply, replied_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("teacher_id", ctx.userId)
    .select("id");
  if (error || !data || data.length === 0) {
    if (error?.code === "42P01" || error?.code === "PGRST205") return { ok: false, error: "Private doubts are not set up yet. Apply the latest Supabase migration first." };
    if (error?.code === "42501") return { ok: false, error: "Only the assigned teacher can reply to this doubt." };
    return { ok: false, error: "Your reply could not be saved. Please try again." };
  }
  revalidatePath("/dashboard/teacher/doubts");
  revalidatePath("/dashboard/student/doubts");
  return { ok: true };
}
