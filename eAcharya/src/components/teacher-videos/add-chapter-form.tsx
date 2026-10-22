"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addChapterAction } from "@/lib/teacher-videos/actions";

export function AddChapterForm({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addChapterAction({ courseId, title });
      if (result.ok) {
        setTitle("");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 flex flex-wrap items-start gap-2">
      <div className="min-w-[14rem] flex-1">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New chapter title, e.g. Physical Features of India"
          aria-label="New chapter title"
          maxLength={120}
        />
        {error && <Alert tone="error">{error}</Alert>}
      </div>
      <Button type="submit" disabled={pending || title.trim().length < 3}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Plus className="h-4 w-4" aria-hidden />}
        Add chapter
      </Button>
    </form>
  );
}
