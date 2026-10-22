"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { requireRole } from "@/lib/auth/session";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  setUserRoleSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

const NOT_CONFIGURED: ActionResult = {
  ok: false,
  error: "The service is not configured yet. Please try again later.",
};

async function siteOrigin(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signInAction(input: unknown): Promise<ActionResult> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check your email and password." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    // Generic message: do not reveal whether the email exists.
    const unconfirmed = /confirm/i.test(error.message);
    return {
      ok: false,
      error: unconfirmed
        ? "Please verify your email first. Check your inbox for the confirmation link."
        : "Incorrect email or password.",
    };
  }
  return { ok: true };
}

const SIGN_UP_FALLBACK = "We could not create that account. Try a different email or sign in.";

/** Map Supabase errors that are safe to show. Anything else stays generic. */
function signUpErrorMessage(error: { message: string; code?: string; status?: number }): string {
  const code = error.code ?? "";
  const msg = error.message ?? "";
  if (code === "over_email_send_rate_limit" || code === "over_request_rate_limit" || error.status === 429 || /rate limit/i.test(msg)) {
    return "Too many sign-up attempts right now. Please wait a few minutes and try again.";
  }
  if (code === "email_provider_disabled" || code === "signup_disabled") {
    return "Sign-ups are currently turned off. Please contact an administrator.";
  }
  if (code === "weak_password") {
    return "That password is too weak. Choose a longer, less common password.";
  }
  if (code === "unexpected_failure" || /sending (confirmation|email)|smtp/i.test(msg)) {
    return "We could not send the verification email. Please try again shortly.";
  }
  return SIGN_UP_FALLBACK;
}

export async function signUpAction(input: unknown): Promise<ActionResult> {
  // Zod strips unknown keys, so a forged `role` in the payload is discarded.
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid details." };
  }
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const origin = await siteOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Only the display name is sent. The database trigger always assigns 'student'.
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    // Log the real cause server-side (terminal / hosting logs) so it can be diagnosed.
    // Never include the email or password here.
    console.error("[signUp] Supabase rejected sign-up:", {
      code: (error as { code?: string }).code,
      status: (error as { status?: number }).status,
      message: error.message,
    });
    return { ok: false, error: signUpErrorMessage(error) };
  }
  return {
    ok: true,
    message: "Account created. Check your email for a verification link to finish signing up.",
  };
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Enter a valid email address." };
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const origin = await siteOrigin();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset-password`,
  });
  // Same response whether or not the account exists (prevents account enumeration).
  return {
    ok: true,
    message: "If an account exists for that email, a reset link is on its way.",
  };
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }
  if (!isSupabaseConfigured()) return NOT_CONFIGURED;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: "Your reset link has expired. Request a new one from the forgot password page.",
    };
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: "Could not update your password. Please try again." };
  return { ok: true, message: "Password updated." };
}

export async function signOutAction(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

/**
 * Admin-only role change. The caller's role is verified server-side from the
 * database, then the change goes through the admin_set_user_role() database
 * function, which checks admin status again (the role column is not directly
 * writable by app users).
 */
export async function setUserRoleAction(formData: FormData): Promise<void> {
  const session = await requireRole("admin");

  const parsed = setUserRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;

  // Prevent an admin from locking themselves (and possibly everyone) out.
  if (parsed.data.userId === session.userId) return;

  const supabase = await createClient();
  await supabase.rpc("admin_set_user_role", {
    target_user: parsed.data.userId,
    new_role: parsed.data.role,
  });
  revalidatePath("/dashboard/admin");
}
