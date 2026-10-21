"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { replyTeacherDoubtAction } from "@/lib/teacher-doubts/actions";
import type { TeacherDoubtInboxItem } from "@/lib/teacher-doubts/data";

function timeLabel(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function dateLabel(raw: string): string {
  const value = new Date(raw);
  return Number.isNaN(value.getTime()) ? raw : value.toLocaleString();
}

function DoubtCard({ doubt }: { doubt: TeacherDoubtInboxItem }) {
  const router = useRouter();
  const [reply, setReply] = useState(doubt.teacherReply ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await replyTeacherDoubtAction({ id: doubt.id, reply });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <article className="rounded-card border border-sage-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{doubt.courseTitle} · {doubt.lessonTitle}</p>
          <h2 className="mt-1 text-lg font-bold text-forest-950">{doubt.title}</h2>
          <p className="mt-1 text-sm text-forest-600">From {doubt.studentName} · {dateLabel(doubt.createdAt)}</p>
        </div>
        <span className={`rounded-pill px-3 py-1 text-xs font-semibold ${doubt.teacherReply ? "bg-sage-100 text-forest-700" : "bg-amber-100 text-amber-900"}`}>
          {doubt.teacherReply ? "Replied" : "Needs reply"}
        </span>
      </div>
      <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-forest-800">{doubt.body}</p>
      {doubt.timestampSeconds !== null && (
        <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-sm font-semibold text-brand-800">
          <MessageCircle className="h-4 w-4" aria-hidden /> Video timestamp: {timeLabel(doubt.timestampSeconds)} ({doubt.timestampSeconds}s)
          {doubt.lessonId && <a href={`/tutorials/${doubt.lessonId}`} className="ml-1 underline">Open lesson</a>}
        </p>
      )}
      {doubt.attachments.length > 0 && <div className="mt-3 flex flex-wrap gap-3">{doubt.attachments.map((file) => <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700 underline">{file.name}</a>)}</div>}
      <form onSubmit={submit} className="mt-5 space-y-3 border-t border-sage-200 pt-4" aria-busy={pending}>
        <label htmlFor={`reply-${doubt.id}`} className="block text-sm font-semibold text-forest-800">Your reply</label>
        <textarea id={`reply-${doubt.id}`} value={reply} onChange={(e) => setReply(e.target.value)} minLength={1} maxLength={10000} required rows={4} disabled={pending}
          className="w-full rounded-xl border border-sage-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Explain the concept or clarify the student's question." />
        {error && <Alert tone="error">{error}</Alert>}
        {saved && <Alert tone="success">Reply saved. The student will see it under this lesson.</Alert>}
        <Button type="submit" disabled={pending || !reply.trim()}><Send className="h-4 w-4" aria-hidden />{pending ? "Saving…" : doubt.teacherReply ? "Update reply" : "Send reply"}</Button>
      </form>
    </article>
  );
}

export function TeacherDoubtInbox({ doubts }: { doubts: TeacherDoubtInboxItem[] }) {
  if (doubts.length === 0) {
    return <div className="rounded-card border border-dashed border-sage-300 bg-white p-8 text-center"><MessageCircle className="mx-auto h-8 w-8 text-forest-500" aria-hidden /><h2 className="mt-3 font-bold text-forest-950">No private doubts yet</h2><p className="mt-1 text-sm text-forest-600">Questions students send from your lessons will appear here.</p></div>;
  }
  return <div className="space-y-4">{doubts.map((doubt) => <DoubtCard key={doubt.id} doubt={doubt} />)}</div>;
}
