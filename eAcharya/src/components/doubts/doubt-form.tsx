"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createTeacherDoubtAction } from "@/lib/doubts/actions";

export interface DoubtCourseOption { course_id: string; course_title: string; grade: number; teacher_id: string; teacher_name: string }

export function DoubtForm({ courses, initialCourseId = "", lessonId = null, initialTimestampSeconds = null }: { courses: DoubtCourseOption[]; initialCourseId?: string; lessonId?: string | null; initialTimestampSeconds?: number | null }) {
  const router = useRouter();
  const [courseId, setCourseId] = useState((initialCourseId && courses.some(c => c.course_id === initialCourseId) ? initialCourseId : courses[0]?.course_id) || "");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [timestamp, setTimestamp] = useState(initialTimestampSeconds == null ? "" : formatTimestamp(initialTimestampSeconds));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const timestampSeconds = lessonId ? parseTimestamp(timestamp) : null;
      if (lessonId && timestamp.trim() !== "" && timestampSeconds == null) { setError("Enter the video time as MM:SS or HH:MM:SS."); return; }
      const result = await createTeacherDoubtAction({ courseId, lessonId, timestampSeconds, title, body });
      if (!result.ok) { setError(result.error); return; }
      setTitle(""); setBody(""); setTimestamp(""); setSuccess(true); router.refresh();
    });
  }

  if (courses.length === 0) return <p className="text-sm text-forest-700">No published teacher-owned courses are available for private questions yet.</p>;

  return <form onSubmit={submit} className="space-y-4" aria-busy={pending}>
    {error && <Alert tone="error">{error}</Alert>}
    {success && <Alert tone="success">Your doubt was sent privately to the course teacher.</Alert>}
    <div>
      <label htmlFor="doubt-course" className="mb-1 block text-sm font-semibold text-forest-900">Course / teacher</label>
      <select id="doubt-course" required value={courseId} onChange={e => setCourseId(e.target.value)} disabled={pending || Boolean(lessonId)}
        className="h-11 w-full rounded-xl border border-sage-300 bg-white px-3 text-sm">
        {courses.map(c => <option key={c.course_id} value={c.course_id}>Class {c.grade} · {c.course_title} — {c.teacher_name}</option>)}
      </select>
    </div>
    {lessonId && (
      <div>
        <label htmlFor="doubt-timestamp" className="mb-1 block text-sm font-semibold text-forest-900">Video timestamp (optional)</label>
        <input id="doubt-timestamp" value={timestamp} onChange={e => setTimestamp(e.target.value)} disabled={pending} placeholder="MM:SS, e.g. 02:45"
          className="h-11 w-full rounded-xl border border-sage-300 bg-white px-3 text-sm" />
        <p className="mt-1 text-xs text-forest-600">Pause the lecture at the point you want to ask about. Direct videos can prefill this time automatically.</p>
      </div>
    )}
    <div>
      <label htmlFor="doubt-title" className="mb-1 block text-sm font-semibold text-forest-900">Subject</label>
      <input id="doubt-title" required minLength={5} maxLength={200} value={title} onChange={e => setTitle(e.target.value)} disabled={pending}
        placeholder="What is your doubt about?" className="h-11 w-full rounded-xl border border-sage-300 bg-white px-3 text-sm" />
    </div>
    <div>
      <label htmlFor="doubt-body" className="mb-1 block text-sm font-semibold text-forest-900">Your question</label>
      <textarea id="doubt-body" required minLength={10} maxLength={10000} rows={5} value={body} onChange={e => setBody(e.target.value)} disabled={pending}
        placeholder="Explain what you are confused about. Only you and the selected teacher can see this question."
        className="w-full rounded-xl border border-sage-300 bg-white p-3 text-sm" />
    </div>
    <Button type="submit" disabled={pending || !courseId}>{pending ? "Sending…" : "Send private doubt"}</Button>
  </form>;
}

function parseTimestamp(value: string): number | null {
  const v = value.trim();
  if (!v) return null;
  if (/^\d+$/.test(v)) { const n = Number(v); return Number.isSafeInteger(n) && n <= 86400 ? n : null; }
  const parts = v.split(":");
  if ((parts.length !== 2 && parts.length !== 3) || parts.some(p => !/^\d{1,2}$/.test(p))) return null;
  const numbers = parts.map(Number);
  if (numbers.slice(1).some(n => n > 59)) return null;
  const seconds = parts.length === 2 ? numbers[0]! * 60 + numbers[1]! : numbers[0]! * 3600 + numbers[1]! * 60 + numbers[2]!;
  return seconds <= 86400 ? seconds : null;
}
function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600); const m = Math.floor((seconds % 3600) / 60); const s = seconds % 60;
  return h > 0 ? `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
