import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { SPOKEN_AUDIO_CODES } from "@/lib/multilingual/languages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const schema = z.object({
  language: z.string().refine((v) => (SPOKEN_AUDIO_CODES as readonly string[]).includes(v)),
  text: z.string().trim().min(1).max(400),
});

// Azure neural voices (official, free tier available). Used when AZURE_SPEECH_KEY + AZURE_SPEECH_REGION are set.
const AZURE_VOICES: Record<string, { locale: string; voice: string }> = {
  hi: { locale: "hi-IN", voice: "hi-IN-SwaraNeural" },
  bn: { locale: "bn-IN", voice: "bn-IN-TanishaaNeural" },
  ta: { locale: "ta-IN", voice: "ta-IN-PallaviNeural" },
  te: { locale: "te-IN", voice: "te-IN-ShrutiNeural" },
  mr: { locale: "mr-IN", voice: "mr-IN-AarohiNeural" },
  gu: { locale: "gu-IN", voice: "gu-IN-DhwaniNeural" },
  kn: { locale: "kn-IN", voice: "kn-IN-SapnaNeural" },
  ml: { locale: "ml-IN", voice: "ml-IN-SobhanaNeural" },
  ur: { locale: "ur-IN", voice: "ur-IN-GulNeural" },
  pa: { locale: "pa-IN", voice: "pa-IN-VaaniNeural" },
  ne: { locale: "ne-NP", voice: "ne-NP-HemkalaNeural" },
};

const escapeXml = (t: string) => t.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c]!);

/** Speaks one short chunk of text and returns MP3 audio. The client calls this chunk by chunk. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in to play audio." }, { status: 401 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "This language or text cannot be spoken." }, { status: 400 });
  const { language, text } = parsed.data;

  try {
    const key = process.env.AZURE_SPEECH_KEY?.trim();
    const region = process.env.AZURE_SPEECH_REGION?.trim();
    let upstream: Response;
    if (key && region) {
      const v = AZURE_VOICES[language]!;
      upstream = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
          "User-Agent": "eacharya",
        },
        signal: AbortSignal.timeout(15000),
        body: `<speak version="1.0" xml:lang="${v.locale}"><voice name="${v.voice}">${escapeXml(text)}</voice></speak>`,
      });
    } else {
      // Unofficial fallback: Google Translate's public TTS endpoint (short text only; may be rate-limited).
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${language}&q=${encodeURIComponent(text.slice(0, 190))}`;
      upstream = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(15000) });
    }
    if (!upstream.ok) {
      return NextResponse.json({ error: "The voice service could not speak this language right now. Try again in a moment." }, { status: 502 });
    }
    return new NextResponse(await upstream.arrayBuffer(), {
      headers: { "content-type": "audio/mpeg", "cache-control": "private, max-age=3600" },
    });
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    return NextResponse.json({ error: timeout ? "The voice service took too long. Please try again." : "The voice service could not be reached." }, { status: 502 });
  }
}
