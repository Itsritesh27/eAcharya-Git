import type { Metadata } from "next";
import { MessageCircle, LockKeyhole } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DoubtForm, type DoubtCourseOption } from "@/components/doubts/doubt-form";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Private doubts" };
export const dynamic = "force-dynamic";

type DoubtRow = {
  id: string; student_id: string; teacher_id: string; course_id: string; lesson_id: string | null; timestamp_seconds: number | null;
  question_title: string; question_body: string; teacher_reply: string | null; replied_at: string | null; created_at: string;
  course: { title: string } | { title: string }[] | null;
};
function courseTitle(row: DoubtRow) { const c = Array.isArray(row.course) ? row.course[0] : row.course; return c?.title ?? "Course"; }
function localDate(value: string) { return new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }); }

export default async function StudentDoubtsPage({ searchParams }: { searchParams: Promise<{ courseId?: string; lessonId?: string; t?: string }> }) {
  const session = await requireRole("student");
  const params = await searchParams;
  const supabase = await createClient();
  const [courseResult, doubtResult] = await Promise.all([
    supabase.rpc("student_teacher_courses"),
    supabase.from("teacher_doubts")
      .select("id, student_id, teacher_id, course_id, lesson_id, timestamp_seconds, question_title, question_body, teacher_reply, replied_at, created_at, course:courses(title)")
      .eq("student_id", session.userId).order("created_at", { ascending: false }).limit(100),
  ]);
  const courses = ((courseResult.data ?? []) as DoubtCourseOption[]);
  const doubts = (doubtResult.data ?? []) as unknown as DoubtRow[];
  const counterpartIds = Array.from(new Set(doubts.map(d => d.teacher_id)));
  const namesResult = counterpartIds.length ? await supabase.rpc("teacher_doubt_contact_cards", { p_ids: counterpartIds }) : { data: [], error: null };
  const names = new Map(((namesResult.data ?? []) as { id: string; display_name: string }[]).map(row => [row.id, row.display_name]));
  const setupError = Boolean(courseResult.error || doubtResult.error);
  const initialCourseId = courses.some(c => c.course_id === params.courseId) ? params.courseId : courses[0]?.course_id ?? "";
  const validLessonParam = params.lessonId && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(params.lessonId);
  const lessonId = validLessonParam && courses.some((c) => c.course_id === params.courseId) ? params.lessonId! : null;
  const timestampCandidate = typeof params.t === "string" && /^\d{1,5}$/.test(params.t) ? Number(params.t) : NaN;
  const initialTimestampSeconds = lessonId && Number.isInteger(timestampCandidate) && timestampCandidate >= 0 && timestampCandidate <= 86400 ? timestampCandidate : null;

  return <DashboardShell session={session}>
    <div className="flex items-start gap-3">
      <span className="mt-1 rounded-xl bg-brand-50 p-2 text-brand-700"><LockKeyhole className="h-5 w-5" aria-hidden /></span>
      <div><h1 className="text-2xl font-extrabold sm:text-3xl">Private doubts</h1><p className="mt-1 max-w-2xl text-sm text-forest-600">Send a question directly to the teacher of a published course. Only you and that teacher can read the message and reply.</p></div>
    </div>

    {setupError && <div className="mt-6"><Alert tone="error">Private doubts are not configured in Supabase yet, or the database request failed. Run the latest migration file and refresh this page.</Alert></div>}
    <Card className="mt-6 max-w-3xl"><CardBody><h2 className="mb-4 text-lg font-bold">Ask your teacher</h2><DoubtForm courses={courses} initialCourseId={initialCourseId} lessonId={lessonId} initialTimestampSeconds={initialTimestampSeconds} /></CardBody></Card>

    <section className="mt-10 max-w-3xl" aria-labelledby="my-doubts-heading">
      <h2 id="my-doubts-heading" className="text-xl font-bold">Your private questions ({doubts.length})</h2>
      {doubts.length === 0 ? <p className="mt-3 rounded-xl border border-dashed border-sage-300 p-5 text-sm text-forest-600">Your questions and teacher replies will appear here.</p> :
        <ol className="mt-4 space-y-4">{doubts.map(d => <li key={d.id} className="rounded-card border border-sage-200 bg-white p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-sage-100 px-2.5 py-1 text-xs font-semibold text-forest-800">{courseTitle(d)}</span><span className="text-xs text-forest-500">{localDate(d.created_at)}</span></div>
          <h3 className="mt-3 font-bold">{d.question_title}</h3>{d.timestamp_seconds != null && <p className="mt-1 text-xs font-semibold text-brand-700">Video timestamp: {formatTimestamp(d.timestamp_seconds)}</p>}<p className="mt-2 whitespace-pre-wrap break-words text-sm text-forest-800">{d.question_body}</p>
          <p className="mt-3 text-xs text-forest-600">To: {names.get(d.teacher_id) ?? "Course teacher"}</p>
          <div className="mt-4 rounded-xl bg-sage-50 p-4"><h4 className="flex items-center gap-2 text-sm font-bold"><MessageCircle className="h-4 w-4" aria-hidden />Teacher&apos;s reply</h4>
            {d.teacher_reply ? <><p className="mt-2 whitespace-pre-wrap break-words text-sm">{d.teacher_reply}</p>{d.replied_at && <p className="mt-2 text-xs text-forest-500">Replied {localDate(d.replied_at)}</p>}</> : <p className="mt-2 text-sm text-forest-600">Waiting for the teacher to reply.</p>}
          </div>
        </li>)}</ol>}
    </section>
  </DashboardShell>;
}

function formatTimestamp(seconds: number): string { const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60; return h > 0 ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`; }
