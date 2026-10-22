"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function reviewLanguageAssetAction(input: unknown): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = z.object({ id: z.string().uuid(), status: z.enum(["approved", "rejected"]) }).safeParse(input);
  if (!parsed.success) return { ok: false, error: "Choose a valid translation asset and review action." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Please sign in again." };
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (!profile || !["teacher", "admin"].includes((profile as { role: string }).role)) {
    return { ok: false, error: "Only a teacher who owns the content or an administrator can review generated assets." };
  }

  const { data, error } = await supabase.from("learning_language_assets")
    .update({ status: parsed.data.status, reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", parsed.data.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error || !data) {
    if (error?.code === "42P01" || error?.code === "PGRST205") return { ok: false, error: "Apply the multilingual Supabase migration before reviewing assets." };
    return { ok: false, error: "This asset could not be reviewed. Verify that it belongs to one of your courses." };
  }

  revalidatePath("/dashboard/teacher/language-review");
  revalidatePath("/tutorials", "page");
  revalidatePath("/resources", "page");
  return { ok: true };
}
