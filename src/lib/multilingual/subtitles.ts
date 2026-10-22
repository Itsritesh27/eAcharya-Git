export type SubtitleCue = { prefix: string[]; text: string[] };

/** Parse WebVTT or SRT while keeping cue IDs, timestamps and position metadata untouched. */
export function parseTimedSubtitles(raw: string): { format: "vtt" | "srt"; header: string[]; cues: SubtitleCue[] } | null {
  const normalized = raw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").trim();
  const isVtt = /^WEBVTT(?:\s|$)/i.test(normalized);
  const isSrt = /^\d+\n\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/m.test(normalized);
  if (!isVtt && !isSrt) return null;

  const blocks = normalized.split(/\n{2,}/);
  const header = isVtt ? (blocks.shift()?.split("\n") ?? ["WEBVTT"]) : ["WEBVTT"];
  const cues: SubtitleCue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const timeIndex = lines.findIndex((line) => line.includes("-->") && /\d{2}:\d{2}:\d{2}[.,]\d{3}/.test(line));
    if (timeIndex < 0) continue; // ignore VTT metadata and malformed blocks
    const prefix = lines.slice(0, timeIndex + 1).map((line) => line.replace(/,(\d{3})/g, ".$1"));
    const text = lines.slice(timeIndex + 1);
    if (text.some((line) => line.trim())) cues.push({ prefix, text });
  }
  if (!cues.length || cues.length > 200) return null;
  return { format: isVtt ? "vtt" : "srt", header, cues };
}

export function timedSubtitlesToVtt(parsed: { header: string[]; cues: SubtitleCue[] }): string {
  const header = parsed.header[0]?.trim().toUpperCase().startsWith("WEBVTT") ? parsed.header : ["WEBVTT"];
  return `${header.join("\n")}\n\n${parsed.cues.map((cue) => [...cue.prefix, ...cue.text].join("\n")).join("\n\n")}\n`;
}

export function timedSubtitlesPlainText(rawVtt: string): string {
  const parsed = parseTimedSubtitles(rawVtt);
  if (!parsed) return rawVtt;
  return parsed.cues.map((cue) => cue.text.join("\n").replace(/<[^>]+>/g, "")).join("\n\n");
}
