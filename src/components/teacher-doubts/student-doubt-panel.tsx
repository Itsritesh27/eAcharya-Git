"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, MessageCircleQuestion, Paperclip, Send } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { createTeacherDoubtAction } from "@/lib/teacher-doubts/actions";
import type { StudentLessonDoubt } from "@/lib/teacher-doubts/data";
import { createClient } from "@/lib/supabase/client";
import { VoiceQuestionButton } from "@/components/multilingual/voice-question-button";

const BUCKET = "teacher-doubt-attachments";
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ACCEPTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"]);

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

function readableDate(raw: string): string {
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? raw : date.toLocaleString();
}

export function StudentDoubtPanel({
  courseId,
  lessonId,
  currentTimeSeconds,
  canUsePlaybackTime,
  initialDoubts,
}: {
  courseId: string;
  lessonId: string;
  currentTimeSeconds: number;
  canUsePlaybackTime: boolean;
  initialDoubts: StudentLessonDoubt[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [timestamp, setTimestamp] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function selectFiles(list: FileList | null) {
    if (!list) return;
    const picked = Array.from(list);
    if (picked.length > MAX_FILES) {
      setError(`Choose at most ${MAX_FILES} attachments.`);
      return;
    }
    const invalid = picked.find((file) => !ACCEPTED.has(file.type) || file.size > MAX_BYTES);
    if (invalid) {
      setError("Attach JPG, PNG, WEBP, GIF or PDF files. Each file must be 10 MB or smaller.");
      return;
    }
    setError(null);
    setFiles(picked);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError(null);
    setSuccess(false);
    if (title.trim().length < 5 || body.trim().length < 10) {
      setError("Enter a title of at least 5 characters and a question of at least 10 characters.");
      return;
    }
    setBusy(true);
    const uploadedPaths: string[] = [];
    let supabase: ReturnType<typeof createClient> | null = null;
    try {
      supabase = createClient();
      if (files.length > 0) {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Please sign in again before attaching files.");
        for (const file of files) {
          const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || "attachment";
          const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
          const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
            contentType: file.type,
            upsert: false,
          });
          if (uploadError) throw new Error(uploadError.message || "A private attachment could not be uploaded.");
          uploadedPaths.push(path);
        }
      }

      const seconds = timestamp.trim() === "" ? null : Number(timestamp);
      if (seconds !== null && (!Number.isInteger(seconds) || seconds < 0 || seconds > 86400)) {
        throw new Error("Timestamp must be a whole number of seconds between 0 and 86,400.");
      }
      const result = await createTeacherDoubtAction({
        courseId,
        lessonId,
        timestampSeconds: seconds,
        title: title.trim(),
        body: body.trim(),
        attachmentPaths: uploadedPaths,
      });
      if (!result.ok) throw new Error(result.error);

      setTitle("");
      setBody("");
      setTimestamp("");
      setFiles([]);
      setSuccess(true);
      router.refresh();
    } catch (caught) {
      if (supabase && uploadedPaths.length > 0) {
        // Unlinked uploads are deletable by their owner. A linked file is protected by storage RLS.
        try { await supabase.storage.from(BUCKET).remove(uploadedPaths); } catch { /* ignore cleanup failure */ }
      }
      setError(caught instanceof Error ? caught.message : "Could not send the private doubt. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-card border border-sage-200 bg-white p-5 shadow-card" aria-labelledby="private-doubt-title">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
          <MessageCircleQuestion className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id="private-doubt-title" className="text-lg font-bold text-forest-950">Ask your teacher privately</h2>
          <p className="mt-1 text-sm text-forest-600">Only you and the teacher who owns this course can read this question and its attachments.</p>
        </div>
      </div>

      {error && <div className="mt-4"><Alert tone="error">{error}</Alert></div>}
      {success && <div className="mt-4"><Alert tone="success">Your private doubt was sent to the course teacher.</Alert></div>}

      <form className="mt-4 space-y-4" onSubmit={submit} aria-busy={busy}>
        <div>
          <label htmlFor={`doubt-title-${lessonId}`} className="mb-1.5 block text-sm font-semibold text-forest-800">Question title</label>
          <input id={`doubt-title-${lessonId}`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required minLength={5} disabled={busy}
            className="h-11 w-full rounded-xl border border-sage-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="What part of the lesson is unclear?" />
        </div>

        <div>
          <label htmlFor={`doubt-body-${lessonId}`} className="mb-1.5 block text-sm font-semibold text-forest-800">Explain your doubt</label>
          <textarea id={`doubt-body-${lessonId}`} value={body} onChange={(e) => setBody(e.target.value)} minLength={10} maxLength={10000} required rows={4} disabled={busy}
            className="w-full rounded-xl border border-sage-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="Explain what you tried and what you would like the teacher to clarify." />
          <VoiceQuestionButton disabled={busy} onTranscript={(speech) => setBody((current) => `${current.trim()}${current.trim() ? " " : ""}${speech}`.slice(0, 10000))} />
        </div>

        <div>
          <label htmlFor={`doubt-time-${lessonId}`} className="mb-1.5 block text-sm font-semibold text-forest-800">Video timestamp (optional, seconds)</label>
          <div className="flex flex-wrap items-center gap-2">
            <input id={`doubt-time-${lessonId}`} type="number" min={0} max={86400} step={1} value={timestamp} onChange={(e) => setTimestamp(e.target.value)} disabled={busy}
              className="h-10 w-36 rounded-xl border border-sage-300 bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100" placeholder="e.g. 125" />
            {canUsePlaybackTime && <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => setTimestamp(String(Math.max(0, Math.floor(currentTimeSeconds))))}>Use current time ({formatTime(currentTimeSeconds)})</Button>}
          </div>
          <p className="mt-1 text-xs text-forest-500">{canUsePlaybackTime ? "Play the video, then use the button to attach the current playback position." : "For YouTube videos, enter the timestamp in seconds manually (for example, 125 for 2:05)."}</p>
        </div>

        <div>
          <label htmlFor={`doubt-files-${lessonId}`} className="mb-1.5 block text-sm font-semibold text-forest-800">Attachments (optional)</label>
          <input id={`doubt-files-${lessonId}`} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" disabled={busy}
            onChange={(e) => selectFiles(e.target.files)} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sage-100 file:px-3 file:py-2 file:font-semibold file:text-forest-900" />
          <p className="mt-1 flex items-center gap-1 text-xs text-forest-500"><Paperclip className="h-3.5 w-3.5" aria-hidden />Private image/PDF uploads · up to {MAX_FILES} files · 10 MB each</p>
          {files.length > 0 && <ul className="mt-2 space-y-1">{files.map((file) => <li key={`${file.name}-${file.size}`} className="flex items-center gap-2 text-xs text-forest-700"><FileText className="h-3.5 w-3.5" aria-hidden /><span className="truncate">{file.name}</span></li>)}</ul>}
        </div>
        <Button type="submit" disabled={busy}>
          <Send className="h-4 w-4" aria-hidden />{busy ? "Sending…" : "Send private doubt"}
        </Button>
      </form>

      <div className="mt-7 border-t border-sage-200 pt-5">
        <h3 className="font-bold text-forest-900">Your questions about this lesson</h3>
        {initialDoubts.length === 0 ? (
          <p className="mt-2 text-sm text-forest-600">You have not asked a private question about this lesson yet.</p>
        ) : (
          <ol className="mt-3 space-y-3">
            {initialDoubts.map((doubt) => (
              <li key={doubt.id} className="rounded-xl border border-sage-200 bg-sage-50/50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h4 className="font-semibold text-forest-950">{doubt.title}</h4>
                  <span className="text-xs text-forest-500">{readableDate(doubt.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-forest-800">{doubt.body}</p>
                {doubt.timestampSeconds !== null && <p className="mt-2 text-xs font-semibold text-brand-700">Video timestamp: {formatTime(doubt.timestampSeconds)} ({doubt.timestampSeconds}s)</p>}
                {doubt.attachments.length > 0 && <div className="mt-2 flex flex-wrap gap-3">{doubt.attachments.map((file) => <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-700 underline">{file.name}</a>)}</div>}
                <div className="mt-3 rounded-lg border border-sage-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-forest-600">Teacher&apos;s reply</p>
                  {doubt.teacherReply ? <p className="mt-1 whitespace-pre-wrap text-sm text-forest-800">{doubt.teacherReply}</p> : <p className="mt-1 text-sm text-forest-500">Waiting for the teacher&apos;s reply.</p>}
                  {doubt.repliedAt && <p className="mt-1 text-xs text-forest-500">Replied {readableDate(doubt.repliedAt)}</p>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
