import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";

const BUCKET = "teacher-doubt-attachments";

export interface DoubtAttachmentView {
  name: string;
  url: string;
}
export interface StudentLessonDoubt {
  id: string;
  title: string;
  body: string;
  timestampSeconds: number | null;
  teacherReply: string | null;
  repliedAt: string | null;
  createdAt: string;
  attachments: DoubtAttachmentView[];
}
export interface TeacherDoubtInboxItem extends StudentLessonDoubt {
  studentName: string;
  courseTitle: string;
  lessonTitle: string;
  lessonId: string | null;
}

type RawDoubt = {
  id: string;
  student_id: string;
  course_id: string;
  lesson_id: string | null;
  timestamp_seconds: number | null;
  question_title: string;
  question_body: string;
  attachment_paths: string[] | null;
  teacher_reply: string | null;
  replied_at: string | null;
  created_at: string;
  lesson?: { id: string; title: string; unit: { title: string; course: { title: string } | { title: string }[] | null } | { title: string; course: { title: string } | { title: string }[] | null }[] | null } | { id: string; title: string; unit: { title: string; course: { title: string } | { title: string }[] | null } | { title: string; course: { title: string } | { title: string }[] | null }[] | null }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

async function signedAttachments(supabase: Awaited<ReturnType<typeof createClient>>, paths: string[] | null | undefined): Promise<DoubtAttachmentView[]> {
  const out: DoubtAttachmentView[] = [];
  for (const path of (paths ?? []).slice(0, 5)) {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 20);
    if (error || !data?.signedUrl) continue;
    const leaf = path.split("/").pop() ?? "attachment";
    const name = leaf.replace(/^[0-9a-f-]{36}-/i, "") || "Attachment";
    out.push({ name, url: data.signedUrl });
  }
  return out;
}

function mapCommon(row: RawDoubt, attachments: DoubtAttachmentView[]): StudentLessonDoubt {
  return {
    id: row.id,
    title: row.question_title,
    body: row.question_body,
    timestampSeconds: row.timestamp_seconds,
    teacherReply: row.teacher_reply,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
    attachments,
  };
}

export async function getStudentLessonDoubts(userId: string, lessonId: string): Promise<StudentLessonDoubt[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_doubts")
    .select("id, student_id, course_id, lesson_id, timestamp_seconds, question_title, question_body, attachment_paths, teacher_reply, replied_at, created_at")
    .eq("student_id", userId)
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return [];
  return Promise.all((data as unknown as RawDoubt[]).map(async (row) => mapCommon(row, await signedAttachments(supabase, row.attachment_paths))));
}

export async function getTeacherDoubts(userId: string): Promise<TeacherDoubtInboxItem[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("teacher_doubts")
    .select("id, student_id, course_id, lesson_id, timestamp_seconds, question_title, question_body, attachment_paths, teacher_reply, replied_at, created_at, lesson:lessons(id, title, unit:units(title, course:courses(title)))")
    .eq("teacher_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];

  const rows = data as unknown as RawDoubt[];
  const studentIds = [...new Set(rows.map((r) => r.student_id))];
  const { data: contacts } = await supabase.rpc("teacher_doubt_contact_cards", { p_ids: studentIds });
  const names = new Map(((contacts ?? []) as { id: string; display_name: string }[]).map((c) => [c.id, c.display_name]));

  return Promise.all(rows.map(async (row) => {
    const lesson = one(row.lesson);
    const unit = one(lesson?.unit);
    const course = one(unit?.course);
    return {
      ...mapCommon(row, await signedAttachments(supabase, row.attachment_paths)),
      studentName: names.get(row.student_id) ?? "Student",
      courseTitle: course?.title ?? "Course",
      lessonTitle: lesson?.title ?? "Lesson removed",
      lessonId: row.lesson_id,
    };
  }));
}
