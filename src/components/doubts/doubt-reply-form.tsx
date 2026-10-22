"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { replyToTeacherDoubtAction } from "@/lib/doubts/actions";

export function DoubtReplyForm({ id, initialReply = "" }: { id: string; initialReply?: string | null }) {
  const router = useRouter();
  const [reply, setReply] = useState(initialReply ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(null); setSaved(false);
    startTransition(async () => {
      const result = await replyToTeacherDoubtAction({ id, reply });
      if (!result.ok) { setError(result.error); return; }
      setSaved(true); router.refresh();
    });
  }
  return <form onSubmit={submit} className="mt-4 space-y-2" aria-busy={pending}>
    {error && <Alert tone="error">{error}</Alert>}
    {saved && <Alert tone="success">Reply saved and shared with the student.</Alert>}
    <label htmlFor={`doubt-reply-${id}`} className="block text-sm font-semibold">Reply privately</label>
    <textarea id={`doubt-reply-${id}`} rows={4} required maxLength={10000} value={reply} onChange={e => setReply(e.target.value)} disabled={pending}
      placeholder="Write your explanation or guidance…" className="w-full rounded-xl border border-sage-300 bg-white p-3 text-sm" />
    <Button type="submit" size="sm" disabled={pending || !reply.trim()}>{pending ? "Saving…" : initialReply ? "Update reply" : "Send reply"}</Button>
  </form>;
}
