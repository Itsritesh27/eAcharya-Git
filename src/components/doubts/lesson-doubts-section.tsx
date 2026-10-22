import Link from "next/link";
import { Clock3, LockKeyhole, MessageCircle } from "lucide-react";
import { DoubtForm, type DoubtCourseOption } from "@/components/doubts/doubt-form";
import { DoubtReplyForm } from "@/components/doubts/doubt-reply-form";
import { Alert } from "@/components/ui/alert";
import { Card, CardBody } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

type Role = "student" | "teacher";
type DoubtRow = {
  id: string;
  student_id: string;
  teacher_id: string;
  course_id: string;
  lesson_id: string | null;
  timestamp_seconds: number | null;
  question_title: string;
  question_body: string;
  teacher_reply: string | null;
  replied_at: string | null;
  created_at: string;
  course: { title: string } | { title: string }[] | null;
};

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
    : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function localDate(value: string): string {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
}

/**
 * Private lecture questions. RLS limits students to their own doubts and teachers to doubts
 * assigned to them, so this section can sit directly beneath the lesson without exposing
 * another student's private messages.
 */
export async function LessonDoubtsSection({
  courseId,
  lessonId,
  userId,
  role,
  timestampSeconds = null,
}: {
  courseId: string;
  lessonId: string;
  userId: string;
  role: Role;
  timestampSeconds?: number | null;
}) {
  const supabase = await createClient();
  let courses: DoubtCourseOption[] = [];
  const query = supabase
    .from("teacher_doubts")
    .select("id, student_id, teacher_id, course_id, lesson_id, timestamp_seconds, question_title, question_body, teacher_reply, replied_at, created_at, course:courses(title)")
    .eq("lesson_id", lessonId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (role === "student") {
    const [courseResult, doubtResult] = await Promise.all([
      supabase.rpc("student_teacher_courses"),
      query.eq("student_id", userId),
    ]);
    courses = ((courseResult.data ?? []) as DoubtCourseOption[]).filter((course) => course.course_id === courseId);
    const doubts = (doubtResult.data ?? []) as unknown as DoubtRow[];
    const namesResult = doubts.length
      ? await supabase.rpc("teacher_doubt_contact_cards", { p_ids: Array.from(new Set(doubts.map((d) => d.teacher_id))) })
      : { data: [], error: null };
    const names = new Map(((namesResult.data ?? []) as { id: string; display_name: string }[]).map((r) => [r.id, r.display_name]));

    return (
      <section id="lesson-doubts" className="scroll-mt-24 space-y-5" aria-labelledby="lesson-doubts-title">
        <div className="flex items-start gap-3">
          <span className="mt-1 rounded-xl bg-brand-50 p-2 text-brand-700"><LockKeyhole className="h-5 w-5" aria-hidden /></span>
          <div>
            <h2 id="lesson-doubts-title" className="text-xl font-extrabold">Ask the teacher about this lecture</h2>
            <p className="mt-1 text-sm text-forest-600">Only you and this course&apos;s teacher can see your question and reply.</p>
          </div>
        </div>
        <Card><CardBody>
          {courseResult.error ? (
            <Alert tone="error">Private lecture questions are not configured yet. Apply the latest Supabase migration, then refresh.</Alert>
          ) : (
            <DoubtForm
              key={`${lessonId}-${timestampSeconds ?? "none"}`}
              courses={courses}
              initialCourseId={courseId}
              lessonId={lessonId}
              initialTimestampSeconds={timestampSeconds}
            />
          )}
        </CardBody></Card>
        <div>
          <h3 className="text-lg font-bold">Your questions about this lecture ({doubts.length})</h3>
          {doubtResult.error ? (
            <p className="mt-3 text-sm text-forest-600">Questions could not be loaded. Refresh the page after checking the Supabase migration.</p>
          ) : doubts.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-sage-300 p-4 text-sm text-forest-600">You have not asked a private question about this lecture yet.</p>
          ) : (
            <ol className="mt-3 space-y-3">{doubts.map((doubt) => (
              <li key={doubt.id}><Card><CardBody>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-forest-500">
                  <span>{localDate(doubt.created_at)}</span>
                  <span className="font-semibold text-forest-700">To: {names.get(doubt.teacher_id) ?? "Course teacher"}</span>
                </div>
                <h4 className="mt-3 font-bold">{doubt.question_title}</h4>
                {doubt.timestamp_seconds != null && <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><Clock3 className="h-3.5 w-3.5" aria-hidden />Video timestamp: {formatTimestamp(doubt.timestamp_seconds)}</p>}
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-forest-800">{doubt.question_body}</p>
                <div className="mt-4 rounded-xl bg-sage-50 p-4">
                  <h5 className="flex items-center gap-2 text-sm font-bold"><MessageCircle className="h-4 w-4" aria-hidden />Teacher&apos;s reply</h5>
                  {doubt.teacher_reply ? <><p className="mt-2 whitespace-pre-wrap break-words text-sm text-forest-800">{doubt.teacher_reply}</p>{doubt.replied_at && <p className="mt-2 text-xs text-forest-500">Replied {localDate(doubt.replied_at)}</p>}</> : <p className="mt-2 text-sm text-forest-600">Waiting for the teacher to reply.</p>}
                </div>
              </CardBody></Card></li>
            ))}</ol>
          )}
          <Link href="/dashboard/student/doubts" className="mt-4 inline-block text-sm font-semibold text-brand-700 underline">View all private doubts</Link>
        </div>
      </section>
    );
  }

  const { data, error } = await query.eq("teacher_id", userId);
  const doubts = (data ?? []) as unknown as DoubtRow[];
  const studentIds = Array.from(new Set(doubts.map((d) => d.student_id)));
  const namesResult = studentIds.length
    ? await supabase.rpc("teacher_doubt_contact_cards", { p_ids: studentIds })
    : { data: [], error: null };
  const names = new Map(((namesResult.data ?? []) as { id: string; display_name: string }[]).map((r) => [r.id, r.display_name]));

  return (
    <section id="lesson-doubts" className="scroll-mt-24 space-y-4" aria-labelledby="lesson-doubts-title">
      <div className="flex items-start gap-3">
        <span className="mt-1 rounded-xl bg-brand-50 p-2 text-brand-700"><MessageCircle className="h-5 w-5" aria-hidden /></span>
        <div>
          <h2 id="lesson-doubts-title" className="text-xl font-extrabold">Student doubts about this lecture</h2>
          <p className="mt-1 text-sm text-forest-600">Only questions sent privately to you are shown here.</p>
        </div>
      </div>
      {error ? <Alert tone="error">Private lecture questions could not be loaded. Apply the latest Supabase migration and refresh.</Alert> : doubts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-sage-300 p-5 text-sm text-forest-600">No private questions about this lecture yet.</div>
      ) : (
        <ol className="space-y-3">{doubts.map((doubt) => (
          <li key={doubt.id}><Card><CardBody>
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-forest-500"><span>From: <strong className="text-forest-900">{names.get(doubt.student_id) ?? "Student"}</strong></span><span>{localDate(doubt.created_at)}</span></div>
            <h3 className="mt-3 font-bold">{doubt.question_title}</h3>
            {doubt.timestamp_seconds != null && <p className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand-700"><Clock3 className="h-3.5 w-3.5" aria-hidden />Video timestamp: {formatTimestamp(doubt.timestamp_seconds)}</p>}
            <p className="mt-2 whitespace-pre-wrap break-words text-sm text-forest-800">{doubt.question_body}</p>
            <DoubtReplyForm id={doubt.id} initialReply={doubt.teacher_reply} />
          </CardBody></Card></li>
        ))}</ol>
      )}
      <Link href="/dashboard/teacher/doubts" className="inline-block text-sm font-semibold text-brand-700 underline">Open all private student doubts</Link>
    </section>
  );
}
