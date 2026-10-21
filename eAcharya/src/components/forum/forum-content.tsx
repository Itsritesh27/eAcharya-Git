import { FileDown, FileText, ExternalLink } from "lucide-react";

function linkForLine(line: string): URL | null {
  const value = line.trim();
  if (!/^https:\/\//i.test(value) || /\s/.test(value)) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:") return null;
    return url;
  } catch { return null; }
}

function attachmentName(url: URL): string {
  const raw = decodeURIComponent(url.pathname.split("/").pop() || "Attachment");
  return raw.replace(/^[0-9a-f]{8}-[0-9a-f-]{27,}-/i, "") || "Attachment";
}

function isForumAttachment(url: URL): boolean {
  return url.pathname.includes("/storage/v1/object/public/forum-attachments/");
}

function downloadUrl(href: string): string {
  const url = new URL(href);
  url.searchParams.set("download", "");
  return url.toString();
}

/** Render uploaded files as openable/downloadable links while preserving plain text and ordinary URLs. */
export function ForumContent({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="whitespace-pre-wrap break-words text-forest-900">
      {lines.map((line, index) => {
        const url = linkForLine(line);
        if (!url) return <span key={index}>{line}{index < lines.length - 1 ? "\n" : ""}</span>;
        const href = url.toString();
        if (!isForumAttachment(url)) {
          return <span key={index}><a href={href} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-700 underline">{url.hostname}{url.pathname === "/" ? "" : url.pathname}</a>{index < lines.length - 1 ? "\n" : ""}</span>;
        }
        const name = attachmentName(url);
        const isImage = /\.(?:jpe?g|png|webp|gif)$/i.test(url.pathname);
        const isPdf = /\.pdf$/i.test(url.pathname);
        return (
          <span key={index} className="my-2 block rounded-xl border border-sage-200 bg-white p-3">
            {isImage ? <a href={href} target="_blank" rel="noopener noreferrer" className="mb-2 inline-block"><img src={href} alt={name} loading="lazy" className="max-h-72 max-w-full rounded-lg object-contain" /></a> : null}
            <span className="flex flex-wrap items-center gap-2 text-sm">
              <FileText className="h-4 w-4 shrink-0 text-brand-700" aria-hidden />
              <span className="min-w-0 flex-1 break-all font-medium">{name}</span>
              <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-brand-700 underline">Open{isPdf ? " PDF" : " file"} <ExternalLink className="h-3.5 w-3.5" aria-hidden /></a>
              <a href={downloadUrl(href)} className="inline-flex items-center gap-1 font-semibold text-brand-700 underline"><FileDown className="h-3.5 w-3.5" aria-hidden />Download</a>
            </span>
          </span>
        );
      })}
    </div>
  );
}
