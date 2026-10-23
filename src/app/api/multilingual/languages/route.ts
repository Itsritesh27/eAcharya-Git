import { NextResponse } from "next/server";
import { ALL_LANGUAGE_CODES } from "@/lib/multilingual/languages";
import { supportedTranslationCodes } from "@/lib/multilingual/translation-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Scheduled-language codes the configured translation service can translate into. */
export async function GET() {
  const { codes, source } = await supportedTranslationCodes();
  return NextResponse.json({ codes: ALL_LANGUAGE_CODES.filter((code) => codes.includes(code)), source });
}
