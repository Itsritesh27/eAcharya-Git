"use client";

import { useRef, useState } from "react";
import { Paperclip, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 10 * 1024 * 1024;
const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

/** Uploads images/PDFs to the forum-attachments bucket and returns their public URLs to the parent form. */
export function AttachmentUploader({ onUploaded, disabled = false }: { onUploaded: (urls: string[]) => void; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setMessage("");
    const chosen = Array.from(files);
    const invalid = chosen.find((f) => !ACCEPT.includes(f.type) || f.size > MAX_BYTES);
    if (invalid) {
      setMessage("Choose JPG, PNG, WEBP, GIF or PDF files, each up to 10 MB.");
      if (ref.current) ref.current.value = "";
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Please sign in before uploading files.");
      const urls: string[] = [];
      for (const file of chosen) {
        const safeName = file.name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]/g, "-").slice(-100) || "attachment";
        const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;
        const { error } = await supabase.storage.from("forum-attachments").upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw new Error(error.message || "Upload failed.");
        const { data } = supabase.storage.from("forum-attachments").getPublicUrl(path);
        urls.push(data.publicUrl);
      }
      onUploaded(urls);
      setMessage(`${urls.length} file${urls.length === 1 ? "" : "s"} uploaded. Add the link(s) to your post or reply.`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Could not upload files. Please try again.");
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  }

  return <div className="space-y-2">
    <input ref={ref} type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf" disabled={disabled || busy}
      className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-sage-100 file:px-3 file:py-2 file:font-semibold file:text-forest-900"
      aria-label="Attach images or PDFs" onChange={(e) => void upload(e.target.files)} />
    <p className="text-xs text-forest-600"><Paperclip className="mr-1 inline h-3.5 w-3.5" aria-hidden />Images and PDFs, up to 10 MB each.</p>
    {busy && <p className="text-sm text-forest-700"><Upload className="mr-1 inline h-4 w-4 animate-pulse" aria-hidden />Uploading…</p>}
    {message && <p role="status" className="text-sm text-forest-700">{message}</p>}
  </div>;
}
